import prisma from '../prisma/client.js';
import { getWibTime, getWibMidnight } from '../utils/timezone.js';

// Upsert a monthly budget for a specific category
export const setBudget = async (req, res) => {
  try {
    const { categoryId, amount, month, year } = req.body;

    if (!categoryId || amount === undefined || !month || !year) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (Number(amount) < 0) {
      return res.status(400).json({ message: 'Budget amount cannot be negative' });
    }

    // Ensure category exists and is an EXPENSE
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId: req.user.id }, { userId: null }]
      }
    });

    if (!category || category.type !== 'EXPENSE') {
      return res.status(400).json({ message: 'Invalid category or category is not an expense' });
    }

    // Upsert budget
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: req.user.id,
          categoryId,
          month: Number(month),
          year: Number(year)
        }
      },
      update: {
        amount
      },
      create: {
        userId: req.user.id,
        categoryId,
        amount,
        period: 'MONTHLY',
        month: Number(month),
        year: Number(year)
      }
    });

    res.status(200).json(budget);
  } catch (error) {
    console.error('Set budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get budget progress for a specific month and year
export const getBudgetProgress = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year query parameters are required' });
    }

    const m = Number(month);
    const y = Number(year);

    // Fetch all EXPENSE categories available to the user
    const categories = await prisma.category.findMany({
      where: {
        type: 'EXPENSE',
        OR: [{ userId: req.user.id }, { userId: null }]
      }
    });

    // Fetch budgets for this month/year
    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.user.id,
        month: m,
        year: y
      }
    });

    // Create a map for easy budget lookup
    const budgetMap = {};
    budgets.forEach(b => {
      budgetMap[b.categoryId] = b;
    });

    // Fetch all expenses in the given month
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);

    const expenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: req.user.id,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      }
    });

    // Map expenses to categories
    const expenseMap = {};
    expenses.forEach(exp => {
      if (exp.categoryId) {
        expenseMap[exp.categoryId] = Number(exp._sum.amount || 0);
      }
    });

    // Calculate today's expenses if requested month is current month using explicit WIB offset (+7)
    const wibTime = getWibTime();
    const isCurrentMonth = wibTime.getUTCMonth() + 1 === m && wibTime.getUTCFullYear() === y;
    let spentTodayMap = {};
    
    if (isCurrentMonth) {
      const todayStart = getWibMidnight();
      const todayEnd = new Date(todayStart.getTime() + (24 * 60 * 60 * 1000) - 1);
      
      const todayExpenses = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId: req.user.id,
          type: 'EXPENSE',
          date: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        _sum: {
          amount: true
        }
      });
      
      todayExpenses.forEach(exp => {
        if (exp.categoryId) {
          spentTodayMap[exp.categoryId] = Number(exp._sum.amount || 0);
        }
      });
    }

    // Construct response for ALL categories
    const progress = categories.map(category => {
      const budget = budgetMap[category.id];
      const spent = expenseMap[category.id] || 0;
      const spentToday = spentTodayMap[category.id] || 0;
      
      return {
        id: budget ? budget.id : null,
        category: category,
        budgetAmount: budget ? Number(budget.amount) : null,
        spentAmount: spent,
        spentToday: spentToday,
        month: m,
        year: y
      };
    });

    res.status(200).json(progress);
  } catch (error) {
    console.error('Get budget progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
