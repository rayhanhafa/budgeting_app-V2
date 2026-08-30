import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultCategories = [
    { name: 'Makan', type: 'EXPENSE', icon: 'utensils' },
    { name: 'Transport', type: 'EXPENSE', icon: 'car' },
    { name: 'Hiburan', type: 'EXPENSE', icon: 'film' },
    { name: 'Tagihan', type: 'EXPENSE', icon: 'file-text' },
    { name: 'Lainnya', type: 'EXPENSE', icon: 'box' },
    { name: 'Gaji', type: 'INCOME', icon: 'dollar-sign' },
    { name: 'Lainnya', type: 'INCOME', icon: 'box' },
  ];

  console.log('Start seeding default categories...');
  
  for (const cat of defaultCategories) {
    const exists = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type, userId: null }
    });

    if (!exists) {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          userId: null, // null userId means default category
        }
      });
      console.log(`Created default category: ${cat.name} (${cat.type})`);
    } else {
      console.log(`Default category already exists: ${cat.name} (${cat.type})`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
