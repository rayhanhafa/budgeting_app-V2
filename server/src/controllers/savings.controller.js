import prisma from '../prisma/client.js';

export const getSavingsGoals = async (req, res) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(goals);
  } catch (error) {
    console.error('Get savings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createSavingsGoal = async (req, res) => {
  try {
    const { name, targetAmount, targetDate } = req.body;
    
    if (!name || !targetAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: req.user.id,
        name,
        targetAmount,
        targetDate: targetDate ? new Date(targetDate) : null,
      }
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Create savings goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSavingsGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, currentAmount, targetDate } = req.body;

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        name,
        targetAmount,
        currentAmount,
        targetDate: targetDate ? new Date(targetDate) : undefined,
      }
    });

    res.status(200).json(goal);
  } catch (error) {
    console.error('Update savings goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteSavingsGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    await prisma.savingsGoal.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Savings goal deleted successfully' });
  } catch (error) {
    console.error('Delete savings goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
