import cron from 'node-cron';
import { addDays, addWeeks, addMonths, isBefore, isEqual, startOfDay } from 'date-fns';
import prisma from '../prisma/client.js';

// We need to duplicate the applyTransactionToBalance logic here or extract it
const applyTransactionToBalance = async (prismaTx, transaction) => {
  if (transaction.type === 'INCOME') {
    await prismaTx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: Number(transaction.amount) } }
    });
  } else if (transaction.type === 'EXPENSE') {
    await prismaTx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { decrement: Number(transaction.amount) } }
    });
  } else if (transaction.type === 'TRANSFER') {
    await prismaTx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { decrement: Number(transaction.amount) } }
    });
    if (transaction.toAccountId) {
      await prismaTx.account.update({
        where: { id: transaction.toAccountId },
        data: { balance: { increment: Number(transaction.amount) } }
      });
    }
  }
};

const getNextDate = (currentDate, frequency) => {
  if (frequency === 'DAILY') return addDays(currentDate, 1);
  if (frequency === 'WEEKLY') return addWeeks(currentDate, 1);
  if (frequency === 'MONTHLY') return addMonths(currentDate, 1);
  return currentDate;
};

// Run every hour at minute 0 (or once a day at midnight '0 0 * * *')
export const startRecurringTransactionsCron = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running recurring transactions check...');
    await processRecurringTransactions();
  });
  
  // Also run immediately on server start
  processRecurringTransactions();
};

export const processRecurringTransactions = async () => {
  try {
    const today = startOfDay(new Date());

    // Find all active recurring transactions that are due today or in the past
    const dueRecurringTxs = await prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextDate: {
          lte: today
        }
      }
    });

    if (dueRecurringTxs.length === 0) return;

    for (const recurring of dueRecurringTxs) {
      await prisma.$transaction(async (prismaTx) => {
        let currentDate = startOfDay(new Date(recurring.nextDate));
        let txsCreated = 0;

        // Loop to catch up if missed multiple periods (e.g. server down for a week on DAILY)
        while (isBefore(currentDate, today) || isEqual(currentDate, today)) {
          // Create actual transaction
          const newTx = await prismaTx.transaction.create({
            data: {
              userId: recurring.userId,
              accountId: recurring.accountId,
              categoryId: recurring.categoryId,
              type: recurring.type,
              amount: recurring.amount,
              note: `[Auto] ${recurring.note || recurring.type}`,
              date: currentDate,
              toAccountId: recurring.toAccountId,
            }
          });

          // Apply to balance
          await applyTransactionToBalance(prismaTx, newTx);
          
          txsCreated++;
          
          // Advance date
          currentDate = getNextDate(currentDate, recurring.frequency);
        }

        // Update the template's nextDate
        await prismaTx.recurringTransaction.update({
          where: { id: recurring.id },
          data: { nextDate: currentDate }
        });

        console.log(`[Cron] Processed ${txsCreated} transactions for Recurring ID ${recurring.id}`);
      });
    }
  } catch (err) {
    console.error('[Cron] Error processing recurring transactions:', err);
  }
};
