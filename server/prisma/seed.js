import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

const generatePassword = (length = 12) => {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
};

async function main() {
  const usersToCreate = [
    { name: 'Rayhan', email: 'rayhanhafa@gmail.com' },
    { name: 'KucingTidur', email: 'kkucingtidurr00@gmail.com' }
  ];

  console.log('Seeding users...');
  console.log('-------------------------------------------');

  for (const u of usersToCreate) {
    const existingUser = await prisma.user.findUnique({ where: { email: u.email } });
    
    if (existingUser) {
      console.log(`User ${u.email} already exists. Skipping.`);
      continue;
    }

    const rawPassword = generatePassword(12);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash: hashedPassword,
      }
    });

    console.log(`Created user: ${u.email}`);
    console.log(`Temporary Password: ${rawPassword}`);
    console.log(`(Please login and change this password immediately in Settings)`);
    console.log('-------------------------------------------');
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
