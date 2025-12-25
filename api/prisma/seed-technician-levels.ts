import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Seeding Technician Levels...');

  // Get all companies
  const companies = await prisma.company.findMany();

  if (companies.length === 0) {
    console.log('❌ No companies found. Please run the main seed first.');
    return;
  }

  for (const company of companies) {
    console.log(`\n📌 Creating levels for company: ${company.name}`);

    // Check if levels already exist for this company
    const existingLevels = await prisma.technicianLevel.findMany({
      where: { companyId: company.id }
    });

    if (existingLevels.length > 0) {
      console.log(`  ⏭️  Levels already exist for ${company.name}, skipping...`);
      continue;
    }

    // Create default technician levels
    const levels = await Promise.all([
      prisma.technicianLevel.create({
        data: {
          name: 'Trainee',
          code: 'TRAINEE',
          minPoints: 0,
          maxPoints: 4999,
          pointsMultiplier: 0.8,
          incentivePercent: 0,
          badgeColor: '#9CA3AF', // Gray
          description: 'New technician in training period',
          sortOrder: 1,
          companyId: company.id,
        },
      }),
      prisma.technicianLevel.create({
        data: {
          name: 'Junior Technician',
          code: 'JUNIOR',
          minPoints: 5000,
          maxPoints: 14999,
          pointsMultiplier: 1.0,
          incentivePercent: 2,
          badgeColor: '#10B981', // Green
          description: 'Entry-level technician with basic skills',
          sortOrder: 2,
          companyId: company.id,
        },
      }),
      prisma.technicianLevel.create({
        data: {
          name: 'Technician',
          code: 'TECHNICIAN',
          minPoints: 15000,
          maxPoints: 49999,
          pointsMultiplier: 1.1,
          incentivePercent: 3,
          badgeColor: '#3B82F6', // Blue
          description: 'Competent technician handling standard repairs',
          sortOrder: 3,
          companyId: company.id,
        },
      }),
      prisma.technicianLevel.create({
        data: {
          name: 'Senior Technician',
          code: 'SENIOR',
          minPoints: 50000,
          maxPoints: 99999,
          pointsMultiplier: 1.2,
          incentivePercent: 5,
          badgeColor: '#8B5CF6', // Purple
          description: 'Experienced technician handling complex repairs',
          sortOrder: 4,
          companyId: company.id,
        },
      }),
      prisma.technicianLevel.create({
        data: {
          name: 'Expert Technician',
          code: 'EXPERT',
          minPoints: 100000,
          maxPoints: 199999,
          pointsMultiplier: 1.5,
          incentivePercent: 8,
          badgeColor: '#F59E0B', // Orange
          description: 'Expert-level technician with specialized skills',
          sortOrder: 5,
          companyId: company.id,
        },
      }),
      prisma.technicianLevel.create({
        data: {
          name: 'Master Technician',
          code: 'MASTER',
          minPoints: 200000,
          maxPoints: null, // No upper limit
          pointsMultiplier: 2.0,
          incentivePercent: 10,
          badgeColor: '#EF4444', // Red/Gold
          description: 'Master-level technician - highest rank',
          sortOrder: 6,
          companyId: company.id,
        },
      }),
    ]);

    console.log(`  ✅ Created ${levels.length} technician levels`);
  }

  console.log('\n🎉 Technician levels seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding technician levels:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
