const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedVPMUser() {
  console.log('👤 Creating VPM Branch User...\n');

  try {
    // Get company
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new Error('No company found.');
    }

    // Get VPM branch
    const vpmBranch = await prisma.branch.findFirst({
      where: {
        OR: [
          { code: 'VPM' },
          { code: 'TPT' },
        ],
      },
    });

    if (!vpmBranch) {
      throw new Error('VPM branch not found. Please run estimate seed first.');
    }

    console.log(`✅ Found branch: ${vpmBranch.name} (${vpmBranch.code})\n`);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'vpm@deenmobiles.com' },
          { username: 'vpm' },
        ],
      },
    });

    if (existingUser) {
      console.log('⚠️  VPM user already exists');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Username: ${existingUser.username}`);
      console.log('   Password: password123\n');
      return;
    }

    // Get Branch Admin role
    const branchAdminRole = await prisma.role.findFirst({
      where: { name: 'Branch Admin', isSystemRole: true },
    });

    if (!branchAdminRole) {
      throw new Error('Branch Admin role not found.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create VPM user
    const vpmUser = await prisma.user.create({
      data: {
        email: 'vpm@deenmobiles.com',
        username: 'vpm',
        password: hashedPassword,
        name: 'VPM Branch Manager',
        phone: '+91-9876543216',
        role: UserRole.MANAGER,
        roleId: branchAdminRole.id,
        companyId: company.id,
        branchId: vpmBranch.id,
        isActive: true,
      },
    });

    console.log('✅ VPM user created successfully!\n');
    console.log('📧 Login Credentials:');
    console.log('-------------------');
    console.log(`Email:    ${vpmUser.email}`);
    console.log(`Username: ${vpmUser.username}`);
    console.log('Password: password123');
    console.log(`Branch:   ${vpmBranch.name} (${vpmBranch.code})`);
    console.log('');

  } catch (error) {
    console.error('❌ Error creating VPM user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedVPMUser()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedVPMUser };
