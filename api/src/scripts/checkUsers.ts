import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: { name: true, email: true, username: true, role: true }
  });

  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

checkUsers();
