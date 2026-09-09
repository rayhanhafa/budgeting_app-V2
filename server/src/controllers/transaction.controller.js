import prisma from '../prisma/client.js';

const applyTransactionToBalance = async (prismaTx, transaction, reverse = false) => {
  const multiplier = reverse ? -1 : 1;
  
  if (transaction.type === 'INCOME') {
    await prismaTx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: Number(transaction.amount) * multiplier } }
    });
  } else if (transaction.type === 'EXPENSE') {
    await prismaTx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { decrement: Number(transaction.amount) * multiplier } }
    });
  } else if (transaction.type === 'TRANSFER') {
    await prismaTx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { decrement: Number(transaction.amount) * multiplier } }
    });
    if (transaction.toAccountId) {
      await prismaTx.account.update({
        where: { id: transaction.toAccountId },
        data: { balance: { increment: Number(transaction.amount) * multiplier } }
      });
    }
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { month, year, category_id, account_id, startDate, endDate } = req.query;

    let whereClause = { userId: req.user.id };

    if (category_id) whereClause.categoryId = category_id;
    if (account_id) {
      whereClause.OR = [
        { accountId: account_id },
        { toAccountId: account_id }
      ];
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.date = { gte: new Date(startDate) };
    } else if (endDate) {
      whereClause.date = { lte: new Date(endDate) };
    } else if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      whereClause.date = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        account: true,
        toAccount: true,
      },
      orderBy: { date: 'desc' },
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { accountId, categoryId, type, amount, note, date, toAccountId, frequency } = req.body;

    if (!accountId || !type || amount === undefined || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be a strictly positive number' });
    }

    if (type === 'TRANSFER' && !toAccountId) {
      return res.status(400).json({ message: 'toAccountId is required for transfers' });
    }

    const transaction = await prisma.$transaction(async (prismaTx) => {
      const newTx = await prismaTx.transaction.create({
        data: {
          userId: req.user.id,
          accountId,
          categoryId: type !== 'TRANSFER' ? categoryId : null,
          type,
          amount,
          note,
          date: new Date(date),
          toAccountId: type === 'TRANSFER' ? toAccountId : null,
        },
      });
      
      await applyTransactionToBalance(prismaTx, newTx, false);

      // Handle Recurring Transaction Creation
      if (frequency && ['DAILY', 'WEEKLY', 'MONTHLY'].includes(frequency)) {
        // Calculate next date natively to avoid date-fns import overhead here
        const nextDate = new Date(date);
        if (frequency === 'DAILY') nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        if (frequency === 'WEEKLY') nextDate.setUTCDate(nextDate.getUTCDate() + 7);
        if (frequency === 'MONTHLY') nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);

        await prismaTx.recurringTransaction.create({
          data: {
            userId: req.user.id,
            accountId,
            categoryId: type !== 'TRANSFER' ? categoryId : null,
            type,
            amount,
            note,
            toAccountId: type === 'TRANSFER' ? toAccountId : null,
            frequency,
            nextDate,
          }
        });
      }

      return newTx;
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountId, categoryId, type, amount, note, date, toAccountId } = req.body;

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({ message: 'Amount must be a strictly positive number' });
    }

    const oldTx = await prisma.transaction.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!oldTx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const updatedTx = await prisma.$transaction(async (prismaTx) => {
      // Reverse old transaction
      await applyTransactionToBalance(prismaTx, oldTx, true);

      // Apply new transaction
      const newTx = await prismaTx.transaction.update({
        where: { id },
        data: {
          accountId,
          categoryId: type !== 'TRANSFER' ? categoryId : null,
          type,
          amount,
          note,
          date: date ? new Date(date) : undefined,
          toAccountId: type === 'TRANSFER' ? toAccountId : null,
        },
      });

      await applyTransactionToBalance(prismaTx, newTx, false);
      return newTx;
    });

    res.status(200).json(updatedTx);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const oldTx = await prisma.transaction.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!oldTx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await prisma.$transaction(async (prismaTx) => {
      await applyTransactionToBalance(prismaTx, oldTx, true);
      await prismaTx.transaction.delete({
        where: { id },
      });
    });

    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
