import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setupBranches() {
  try {
    console.log('🔄 Starting branch setup...\n');

    // Get the first company (assuming single company setup)
    const company = await prisma.company.findFirst();

    if (!company) {
      console.error('❌ No company found. Please create a company first.');
      return;
    }

    console.log(`✅ Found company: ${company.name}\n`);

    // Delete all existing branches and related data
    console.log('🗑️  Deleting all existing branches...');

    // Delete users associated with branches
    await prisma.user.deleteMany({
      where: {
        branchId: { not: null }
      }
    });

    // Delete all branches
    await prisma.branch.deleteMany({
      where: {
        companyId: company.id
      }
    });

    console.log('✅ All existing branches deleted\n');

    // Define the new branches
    const branchesData = [
      {
        name: 'Deen Mobiles Villupuram',
        code: 'VPM',
        address: 'No 719, Neruji Road, Near Greens, Villupuram 605602',
        phone: '+91 9994447003',
        email: 'villupuram@deenmobiles.com',
        managerName: 'Villupuram Manager',
        managerEmail: 'manager.villupuram@deenmobiles.com',
        managerPhone: '+91 9994447003',
      },
      {
        name: 'Deen Mobiles Tirukovilure',
        code: 'TKV',
        address: 'No 11, Hospital Road, Tirukovilure 605757',
        phone: '+91 82208 87745',
        email: 'tirukovilure@deenmobiles.com',
        managerName: 'Tirukovilure Manager',
        managerEmail: 'manager.tirukovilure@deenmobiles.com',
        managerPhone: '+91 82208 87745',
      },
      {
        name: 'Deen mobiles gingee',
        code: 'GNG',
        address: 'No 130/1 Tiruvannamalai road, Noor Lodge & complex, Gingee 604202',
        phone: '+91 90432 16877',
        email: 'gingee@deenmobiles.com',
        managerName: 'Gingee Manager',
        managerEmail: 'manager.gingee@deenmobiles.com',
        managerPhone: '+91 90432 16877',
      },
      {
        name: 'Deen mobiles Tindivanam',
        code: 'TND',
        address: '363, Jawaharlal Neru Street, Nearby aryaas hotel, Tindivanam 604 001',
        phone: '+91 91502 79611',
        email: 'tindivanam@deenmobiles.com',
        managerName: 'Tindivanam Manager',
        managerEmail: 'manager.tindivanam@deenmobiles.com',
        managerPhone: '+91 91502 79611',
      },
    ];

    // Default password for all managers
    const defaultPassword = 'Manager@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    console.log('🏢 Creating branches and managers...\n');

    for (const branchData of branchesData) {
      // Create branch
      const branch = await prisma.branch.create({
        data: {
          name: branchData.name,
          code: branchData.code,
          address: branchData.address,
          phone: branchData.phone,
          email: branchData.email,
          companyId: company.id,
          isActive: true,
        },
      });

      console.log(`✅ Created branch: ${branch.name} (${branch.code})`);

      // Create manager for this branch
      const manager = await prisma.user.create({
        data: {
          name: branchData.managerName,
          email: branchData.managerEmail,
          password: hashedPassword,
          phone: branchData.managerPhone,
          role: UserRole.MANAGER,
          companyId: company.id,
          branchId: branch.id,
          isActive: true,
        },
      });

      console.log(`   👤 Created manager: ${manager.name} (${manager.email})`);

      // Update branch with manager ID
      await prisma.branch.update({
        where: { id: branch.id },
        data: { managerId: manager.id },
      });

      console.log(`   🔗 Linked manager to branch\n`);
    }

    console.log('✨ Branch setup completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Company: ${company.name}`);
    console.log(`   - Branches created: ${branchesData.length}`);
    console.log(`   - Managers created: ${branchesData.length}`);
    console.log(`   - Default password: ${defaultPassword}\n`);

    console.log('🔐 Manager Login Credentials:');
    branchesData.forEach((branch) => {
      console.log(`\n   ${branch.name}:`);
      console.log(`   Email: ${branch.managerEmail}`);
      console.log(`   Password: ${defaultPassword}`);
    });

  } catch (error) {
    console.error('❌ Error setting up branches:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupBranches();
