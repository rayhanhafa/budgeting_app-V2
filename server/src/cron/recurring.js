import cron from 'node-cron';
import { isBefore, isEqual } from 'date-fns';
import prisma from '../prisma/client.js';
import { getWibMidnight } from '../utils/timezone.js';

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
  const d = new Date(currentDate);
  if (frequency === 'DAILY') d.setUTCDate(d.getUTCDate() + 1);
  if (frequency === 'WEEKLY') d.setUTCDate(d.getUTCDate() + 7);
  if (frequency === 'MONTHLY') d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
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
    const today = getWibMidnight();

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
        let currentDate = new Date(recurring.nextDate);
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
