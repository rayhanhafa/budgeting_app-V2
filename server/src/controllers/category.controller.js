import prisma from '../prisma/client.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { userId: null }, // default categories
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const category = await prisma.category.create({
      data: {
        userId: req.user.id, // Custom category
        name,
        type,
        icon,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, icon } = req.body;

    const category = await prisma.category.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found or you cannot edit default category' });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name, type, icon },
    });

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: { 
        id, 
        OR: [
          { userId: req.user.id },
          { userId: null }
        ]
      },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
