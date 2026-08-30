import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getRecurringTransactions = async (req, res) => {
  try {
    const recurring = await prisma.recurringTransaction.findMany({
      where: { userId: req.user.id },
      include: {
        account: true,
        category: true,
        toAccount: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(recurring);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteRecurringTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const recurring = await prisma.recurringTransaction.findUnique({
      where: { id }
    });
    
    if (!recurring) {
      return res.status(404).json({ message: 'Recurring transaction not found' });
    }
    
    if (recurring.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await prisma.recurringTransaction.delete({
      where: { id }
    });
    
    res.json({ message: 'Recurring transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
