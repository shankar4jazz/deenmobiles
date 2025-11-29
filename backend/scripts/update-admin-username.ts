import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminUsername() {
  try {
    // First, list all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
      },
    });

    console.log('📋 All users in database:');
    console.log(JSON.stringify(users, null, 2));

    // Find user with admin email or SUPER_ADMIN role
    const adminUser = users.find(
      u => u.email === 'admin@deenmobiles.com' || u.role === 'SUPER_ADMIN'
    );

    if (adminUser) {
      const updated = await prisma.user.update({
        where: { id: adminUser.id },
        data: { username: 'admin' },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
        },
      });

      console.log('\n✅ Admin username updated successfully:');
      console.log(JSON.stringify(updated, null, 2));
    } else {
      console.log('\n❌ No admin user found in database');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminUsername();
