const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEstimates() {
  console.log('🔍 Debugging Estimates Issue...\n');

  try {
    // Count all estimates
    const totalEstimates = await prisma.estimate.count();
    console.log(`Total estimates in database: ${totalEstimates}\n`);

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
      console.log('❌ VPM branch not found\n');
      return;
    }

    console.log(`✅ VPM Branch: ${vpmBranch.name} (${vpmBranch.code})`);
    console.log(`   Branch ID: ${vpmBranch.id}`);
    console.log(`   Company ID: ${vpmBranch.companyId}\n`);

    // Count estimates in VPM branch
    const vpmEstimates = await prisma.estimate.count({
      where: { branchId: vpmBranch.id },
    });

    console.log(`Estimates in VPM branch: ${vpmEstimates}\n`);

    // Get sample estimates
    const sampleEstimates = await prisma.estimate.findMany({
      where: { branchId: vpmBranch.id },
      take: 5,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('📋 Sample Estimates:');
    console.log('-------------------');
    sampleEstimates.forEach((est, index) => {
      console.log(`${index + 1}. ${est.estimateNumber}`);
      console.log(`   Status: ${est.status}`);
      console.log(`   Customer: ${est.customer?.name || 'N/A'}`);
      console.log(`   Amount: ₹${est.totalAmount}`);
      console.log(`   Company ID: ${est.companyId}`);
      console.log(`   Branch ID: ${est.branchId}`);
      console.log('');
    });

    // Get all companies
    const companies = await prisma.company.findMany();
    console.log(`\n📊 Total Companies: ${companies.length}`);
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (ID: ${company.id})`);
    });

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEstimates();
