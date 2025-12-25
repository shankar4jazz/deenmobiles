const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function moveEstimates() {
  console.log('🔄 Moving Estimates to Correct Branch...\n');

  try {
    // Get the branch with ID c1a9dfc9-354a-4e71-bde1-5a1ade259bdd (user's branch)
    const userBranch = await prisma.branch.findUnique({
      where: { id: 'c1a9dfc9-354a-4e71-bde1-5a1ade259bdd' },
    });

    if (!userBranch) {
      console.log('❌ User branch not found\n');
      return;
    }

    console.log(`✅ User Branch: ${userBranch.name} (${userBranch.code})`);
    console.log(`   Branch ID: ${userBranch.id}\n`);

    // Update all estimates from TPT branch to user's branch
    const result = await prisma.estimate.updateMany({
      where: {
        branchId: 'fd9b3568-c312-41d1-b44e-e70437adc666', // TPT branch
      },
      data: {
        branchId: 'c1a9dfc9-354a-4e71-bde1-5a1ade259bdd', // User's branch
      },
    });

    console.log(`✅ Moved ${result.count} estimates to ${userBranch.name} branch\n`);

    // Verify
    const estimatesCount = await prisma.estimate.count({
      where: { branchId: 'c1a9dfc9-354a-4e71-bde1-5a1ade259bdd' },
    });

    console.log(`📊 Estimates now in ${userBranch.name}: ${estimatesCount}\n`);
    console.log('🎉 Done! Refresh your browser to see the estimates.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

moveEstimates();
