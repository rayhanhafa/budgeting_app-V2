import prisma from '../prisma/client.js';

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

    // Fetch all budgets for this month/year
    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.user.id,
        month: m,
        year: y
      },
      include: {
        category: true
      }
    });

    // If no budgets exist, return empty array
    if (budgets.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch all expenses for these categories in the given month
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
        },
        categoryId: {
          in: budgets.map(b => b.categoryId)
        }
      },
      _sum: {
        amount: true
      }
    });

    // Map expenses to categories
    const expenseMap = {};
    expenses.forEach(exp => {
      expenseMap[exp.categoryId] = Number(exp._sum.amount || 0);
    });

    // Calculate today's expenses if requested month is current month
    const now = new Date();
    const isCurrentMonth = now.getMonth() + 1 === m && now.getFullYear() === y;
    let spentTodayMap = {};
    
    if (isCurrentMonth) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      const todayExpenses = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId: req.user.id,
          type: 'EXPENSE',
          date: {
            gte: todayStart,
            lte: todayEnd
          },
          categoryId: {
            in: budgets.map(b => b.categoryId)
          }
        },
        _sum: {
          amount: true
        }
      });
      
      todayExpenses.forEach(exp => {
        spentTodayMap[exp.categoryId] = Number(exp._sum.amount || 0);
      });
    }

    // Construct response
    const progress = budgets.map(budget => {
      const spent = expenseMap[budget.categoryId] || 0;
      const spentToday = spentTodayMap[budget.categoryId] || 0;
      
      return {
        id: budget.id,
        category: budget.category,
        budgetAmount: Number(budget.amount),
        spentAmount: spent,
        spentToday: spentToday,
        month: budget.month,
        year: budget.year
      };
    });

    res.status(200).json(progress);
  } catch (error) {
    console.error('Get budget progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
