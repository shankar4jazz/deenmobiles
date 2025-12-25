const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Create branches with their managers
async function createBranches() {
  console.log('🏪 Creating branches with managers...\n');

  // Get the company
  const company = await prisma.company.findFirst();
  if (!company) {
    throw new Error('No company found. Please run the main seed first.');
  }

  // Get the Manager role
  const managerRole = await prisma.role.findFirst({
    where: { name: 'Manager', isSystemRole: true }
  });
  if (!managerRole) {
    throw new Error('Manager role not found. Please run the main seed first.');
  }

  const branches = [
    {
      name: 'Deen Mobiles Villupuram',
      code: 'VPM',
      address: 'No 719, Neruji Road, Near Greens, Villupuram 605602',
      phone: '+91 9994447003',
      email: 'villupuram@deenmobiles.com',
      manager: {
        name: 'Villupuram Manager',
        email: 'manager.villupuram@deenmobiles.com',
        username: 'manager.villupuram',
        password: 'Manager@123',
      },
    },
    {
      name: 'Deen Mobiles Tirukovilure',
      code: 'TKV',
      address: 'No 11, Hospital Road, Tirukovilure 605757',
      phone: '+91 82208 87745',
      email: 'tirukovilure@deenmobiles.com',
      manager: {
        name: 'Tirukovilure Manager',
        email: 'manager.tirukovilure@deenmobiles.com',
        username: 'manager.tirukovilure',
        password: 'Manager@123',
      },
    },
    {
      name: 'Deen Mobiles Gingee',
      code: 'GNG',
      address: 'No 130/1 Tiruvannamalai road, Noor Lodge & complex, Gingee 604202',
      phone: '+91 90432 16877',
      email: 'gingee@deenmobiles.com',
      manager: {
        name: 'Gingee Manager',
        email: 'manager.gingee@deenmobiles.com',
        username: 'manager.gingee',
        password: 'Manager@123',
      },
    },
    {
      name: 'Deen Mobiles Tindivanam',
      code: 'TND',
      address: '363, Jawaharlal Neru Street, Nearby aryaas hotel, Tindivanam 604001',
      phone: '+91 91502 79611',
      email: 'tindivanam@deenmobiles.com',
      manager: {
        name: 'Tindivanam Manager',
        email: 'manager.tindivanam@deenmobiles.com',
        username: 'manager.tindivanam',
        password: 'Manager@123',
      },
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const branchData of branches) {
    try {
      // Check if branch already exists
      const existingBranch = await prisma.branch.findFirst({
        where: {
          code: branchData.code,
          companyId: company.id,
        },
      });

      if (existingBranch) {
        console.log(`⏭️  ${branchData.name} (already exists)\n`);
        skipped++;
        continue;
      }

      // Create the branch
      const branch = await prisma.branch.create({
        data: {
          name: branchData.name,
          code: branchData.code,
          address: branchData.address,
          phone: branchData.phone,
          email: branchData.email,
          isActive: true,
          companyId: company.id,
        },
      });

      console.log(`✅ Created branch: ${branch.name} (${branch.code})`);

      // Create the manager for this branch
      try {
        // Check if manager email/username already exists
        const existingManager = await prisma.user.findFirst({
          where: {
            OR: [
              { email: branchData.manager.email },
              { username: branchData.manager.username },
            ],
          },
        });

        if (existingManager) {
          console.log(`   ⚠️  Manager with email/username already exists`);
          console.log(`   Branch created but manager not assigned\n`);
          created++;
          continue;
        }

        const hashedPassword = await bcrypt.hash(branchData.manager.password, 10);

        const manager = await prisma.user.create({
          data: {
            name: branchData.manager.name,
            email: branchData.manager.email,
            username: branchData.manager.username,
            password: hashedPassword,
            phone: branchData.phone,
            role: UserRole.MANAGER,
            roleId: managerRole.id,
            branchId: branch.id,
            companyId: company.id,
            isActive: true,
          },
        });

        console.log(`   ✅ Created manager: ${branchData.manager.name}`);
        console.log(`      Email: ${branchData.manager.email}`);
        console.log(`      Username: ${branchData.manager.username}`);
        console.log(`      Password: ${branchData.manager.password}`);

        // Update branch with manager ID
        await prisma.branch.update({
          where: { id: branch.id },
          data: { managerId: manager.id },
        });

        console.log(`   ✅ Branch updated with manager\n`);
        created++;
      } catch (managerError) {
        console.log(`   ⚠️  Manager creation failed: ${managerError.message}`);
        console.log(`   Branch created but manager not assigned\n`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Failed to create ${branchData.name}:`, error.message);
      console.log('');
    }
  }

  console.log('📊 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   🏪 Total: ${branches.length}\n`);
}

// Main execution
async function main() {
  try {
    await createBranches();
    console.log('🎉 Branch seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding branches:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
