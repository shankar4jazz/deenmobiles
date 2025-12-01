import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Updating Vilupuram technicians with realistic data...\n');

  // Get Vilupuram branch
  const vilupuramBranch = await prisma.branch.findFirst({
    where: { code: 'VPM' }
  });

  if (!vilupuramBranch) {
    throw new Error('Vilupuram branch not found. Run seed-vilupuram first.');
  }

  // Get all technicians in this branch
  const technicians = await prisma.user.findMany({
    where: {
      branchId: vilupuramBranch.id,
      role: 'TECHNICIAN'
    },
    include: {
      technicianProfile: true
    }
  });

  console.log(`Found ${technicians.length} technicians\n`);

  // Realistic data for each technician
  const realisticData: Record<string, {
    rating: number;
    totalCompleted: number;
    totalPoints: number;
    avgHours: number;
    maxJobs: number;
    isAvailable: boolean;
  }> = {
    'kumar@deenmobiles.com': {
      rating: 4.7,
      totalCompleted: 156,
      totalPoints: 4250,
      avgHours: 3.2,
      maxJobs: 5,
      isAvailable: true,
    },
    'ravi@deenmobiles.com': {
      rating: 4.3,
      totalCompleted: 89,
      totalPoints: 2100,
      avgHours: 4.5,
      maxJobs: 5,
      isAvailable: true,
    },
    'murugan@deenmobiles.com': {
      rating: 4.9,
      totalCompleted: 278,
      totalPoints: 8500,
      avgHours: 2.8,
      maxJobs: 6,
      isAvailable: true,
    },
    'senthil@deenmobiles.com': {
      rating: 4.1,
      totalCompleted: 34,
      totalPoints: 680,
      avgHours: 5.5,
      maxJobs: 4,
      isAvailable: true,
    },
    'velu@deenmobiles.com': {
      rating: 4.5,
      totalCompleted: 112,
      totalPoints: 2850,
      avgHours: 3.8,
      maxJobs: 5,
      isAvailable: true,
    },
  };

  for (const tech of technicians) {
    const data = realisticData[tech.email];
    if (!data || !tech.technicianProfile) continue;

    // Update profile with realistic data
    await prisma.technicianProfile.update({
      where: { id: tech.technicianProfile.id },
      data: {
        averageRating: data.rating,
        totalServicesCompleted: data.totalCompleted,
        totalPoints: data.totalPoints,
        avgCompletionHours: data.avgHours,
        maxConcurrentJobs: data.maxJobs,
        isAvailable: data.isAvailable,
        totalRevenue: data.totalCompleted * 1500,
      }
    });

    console.log(`✅ Updated ${tech.name}:`);
    console.log(`   Rating: ${data.rating} ⭐`);
    console.log(`   Completed: ${data.totalCompleted} jobs`);
    console.log(`   Points: ${data.totalPoints} pts`);
    console.log(`   Avg Time: ${data.avgHours}h`);
    console.log(`   Max Jobs: ${data.maxJobs}`);
    console.log('');
  }

  // Update levels based on points
  console.log('🏆 Updating technician levels based on points...\n');

  for (const tech of technicians) {
    if (!tech.technicianProfile) continue;

    const profile = await prisma.technicianProfile.findUnique({
      where: { id: tech.technicianProfile.id }
    });

    if (!profile) continue;

    const newLevel = await prisma.technicianLevel.findFirst({
      where: {
        companyId: vilupuramBranch.companyId,
        minPoints: { lte: profile.totalPoints },
        OR: [
          { maxPoints: { gte: profile.totalPoints } },
          { maxPoints: null },
        ],
      },
      orderBy: { minPoints: 'desc' },
    });

    if (newLevel && newLevel.id !== profile.currentLevelId) {
      await prisma.technicianProfile.update({
        where: { id: profile.id },
        data: { currentLevelId: newLevel.id }
      });
      console.log(`   ${tech.name}: Promoted to ${newLevel.name}`);
    }
  }

  console.log('\n✨ Vilupuram technician data update complete!');
  console.log('\n📊 Final Summary:');
  console.log('-----------------------------------');

  const updatedTechs = await prisma.user.findMany({
    where: {
      branchId: vilupuramBranch.id,
      role: 'TECHNICIAN'
    },
    include: {
      technicianProfile: {
        include: { currentLevel: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  for (const tech of updatedTechs) {
    if (!tech.technicianProfile) continue;
    const p = tech.technicianProfile;
    console.log(`\n${tech.name} (${p.currentLevel?.name || 'No Level'}):`);
    console.log(`  ⭐ Rating: ${p.averageRating?.toFixed(1)}`);
    console.log(`  🎯 Points: ${p.totalPoints}`);
    console.log(`  ✅ Completed: ${p.totalServicesCompleted}`);
    console.log(`  ⏱️  Avg Time: ${p.avgCompletionHours?.toFixed(1)}h`);
    console.log(`  📦 Max Jobs: ${p.maxConcurrentJobs}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
