import prisma from '../prisma/client.js';

export const getAccounts = async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { name, type, balance } = req.body;
    
    if (!name || !type || balance === undefined) {
      return res.status(400).json({ message: 'Name, type, and balance are required' });
    }

    const account = await prisma.account.create({
      data: {
        userId: req.user.id,
        name,
        type,
        balance: balance,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, balance } = req.body;

    const account = await prisma.account.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: { name, type, balance },
    });

    res.status(200).json(updatedAccount);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await prisma.account.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    // If deleted but restricted due to transactions
    if (error.code === 'P2003' || (error.message && error.message.includes('violates RESTRICT setting'))) {
      return res.status(400).json({ message: 'Cannot delete account with existing transactions' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
