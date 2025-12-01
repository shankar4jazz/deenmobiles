import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Vilupuram branch with technicians...');

  // Get the existing company
  const company = await prisma.company.findFirst({
    where: { email: 'info@deenmobiles.com' }
  });

  if (!company) {
    throw new Error('Company not found. Please run the main seed first.');
  }

  console.log('✅ Found company:', company.name);

  // Get the Technician role
  const technicianRole = await prisma.role.findFirst({
    where: { name: 'Technician', isSystemRole: true }
  });

  if (!technicianRole) {
    throw new Error('Technician role not found. Please run the main seed first.');
  }

  console.log('✅ Found technician role:', technicianRole.name);

  // Create Vilupuram branch
  let vilupuramBranch = await prisma.branch.findFirst({
    where: { code: 'VPM' }
  });

  if (!vilupuramBranch) {
    vilupuramBranch = await prisma.branch.create({
      data: {
        name: 'Vilupuram Branch',
        code: 'VPM',
        companyId: company.id,
        address: 'No.123, Main Road, Vilupuram, Tamil Nadu 605602',
        phone: '+91-9876543220',
        email: 'vilupuram@deenmobiles.com',
        isActive: true,
      },
    });
    console.log('✅ Created Vilupuram branch');
  } else {
    console.log('✅ Vilupuram branch already exists');
  }

  // Create Technician Levels if not exists
  const existingLevels = await prisma.technicianLevel.count({
    where: { companyId: company.id }
  });

  let levels: any = {};

  if (existingLevels === 0) {
    levels.junior = await prisma.technicianLevel.create({
      data: {
        name: 'Junior Technician',
        code: 'JUNIOR',
        minPoints: 0,
        maxPoints: 999,
        pointsMultiplier: 1.0,
        incentivePercent: 2,
        badgeColor: '#A0A0A0',
        description: 'Entry level technician',
        sortOrder: 1,
        companyId: company.id,
      },
    });

    levels.mid = await prisma.technicianLevel.create({
      data: {
        name: 'Mid-Level Technician',
        code: 'MID',
        minPoints: 1000,
        maxPoints: 2999,
        pointsMultiplier: 1.2,
        incentivePercent: 4,
        badgeColor: '#CD7F32',
        description: 'Experienced technician',
        sortOrder: 2,
        companyId: company.id,
      },
    });

    levels.senior = await prisma.technicianLevel.create({
      data: {
        name: 'Senior Technician',
        code: 'SENIOR',
        minPoints: 3000,
        maxPoints: 5999,
        pointsMultiplier: 1.5,
        incentivePercent: 6,
        badgeColor: '#C0C0C0',
        description: 'Senior level technician',
        sortOrder: 3,
        companyId: company.id,
      },
    });

    levels.expert = await prisma.technicianLevel.create({
      data: {
        name: 'Expert Technician',
        code: 'EXPERT',
        minPoints: 6000,
        maxPoints: null,
        pointsMultiplier: 2.0,
        incentivePercent: 10,
        badgeColor: '#FFD700',
        description: 'Expert level technician with exceptional skills',
        sortOrder: 4,
        companyId: company.id,
      },
    });

    console.log('✅ Created 4 technician levels');
  } else {
    levels.junior = await prisma.technicianLevel.findFirst({
      where: { companyId: company.id, code: 'JUNIOR' }
    });
    levels.mid = await prisma.technicianLevel.findFirst({
      where: { companyId: company.id, code: 'MID' }
    });
    levels.senior = await prisma.technicianLevel.findFirst({
      where: { companyId: company.id, code: 'SENIOR' }
    });
    levels.expert = await prisma.technicianLevel.findFirst({
      where: { companyId: company.id, code: 'EXPERT' }
    });
    console.log('✅ Technician levels already exist');
  }

  // Create Service Categories if not exists
  let serviceCategories: any[] = [];
  const existingCategories = await prisma.serviceCategory.count({
    where: { companyId: company.id }
  });

  if (existingCategories === 0) {
    serviceCategories = await Promise.all([
      prisma.serviceCategory.create({
        data: {
          name: 'Screen Repair',
          code: 'SCREEN',
          description: 'Display and screen repair services',
          defaultPrice: 2500,
          technicianPoints: 100,
          companyId: company.id,
        },
      }),
      prisma.serviceCategory.create({
        data: {
          name: 'Battery Replacement',
          code: 'BATTERY',
          description: 'Battery replacement services',
          defaultPrice: 1200,
          technicianPoints: 50,
          companyId: company.id,
        },
      }),
      prisma.serviceCategory.create({
        data: {
          name: 'Software Issues',
          code: 'SOFTWARE',
          description: 'Software troubleshooting and OS repairs',
          defaultPrice: 500,
          technicianPoints: 30,
          companyId: company.id,
        },
      }),
      prisma.serviceCategory.create({
        data: {
          name: 'Charging Port',
          code: 'CHARGING',
          description: 'Charging port repair and replacement',
          defaultPrice: 800,
          technicianPoints: 40,
          companyId: company.id,
        },
      }),
      prisma.serviceCategory.create({
        data: {
          name: 'Camera Repair',
          code: 'CAMERA',
          description: 'Camera module repair and replacement',
          defaultPrice: 1500,
          technicianPoints: 60,
          companyId: company.id,
        },
      }),
      prisma.serviceCategory.create({
        data: {
          name: 'Water Damage',
          code: 'WATER_DAMAGE',
          description: 'Water damage repair and recovery',
          defaultPrice: 2000,
          technicianPoints: 80,
          companyId: company.id,
        },
      }),
    ]);
    console.log('✅ Created 6 service categories');
  } else {
    serviceCategories = await prisma.serviceCategory.findMany({
      where: { companyId: company.id },
    });
    console.log('✅ Service categories already exist');
  }

  // Create Technicians for Vilupuram branch
  const hashedPassword = await bcrypt.hash('password123', 10);

  const techniciansData = [
    {
      email: 'kumar@deenmobiles.com',
      username: 'kumar',
      name: 'Kumar Selvam',
      phone: '+91-9876543221',
      points: 3500,
      level: levels.senior,
      rating: 4.8,
      servicesCompleted: 120,
      skills: [0, 1, 2, 3], // Screen, Battery, Software, Charging
    },
    {
      email: 'ravi@deenmobiles.com',
      username: 'ravi',
      name: 'Ravi Chandran',
      phone: '+91-9876543222',
      points: 1800,
      level: levels.mid,
      rating: 4.5,
      servicesCompleted: 65,
      skills: [1, 2, 3], // Battery, Software, Charging
    },
    {
      email: 'murugan@deenmobiles.com',
      username: 'murugan',
      name: 'Murugan K',
      phone: '+91-9876543223',
      points: 6500,
      level: levels.expert,
      rating: 4.9,
      servicesCompleted: 200,
      skills: [0, 1, 2, 3, 4, 5], // All skills
    },
    {
      email: 'senthil@deenmobiles.com',
      username: 'senthil',
      name: 'Senthil Nathan',
      phone: '+91-9876543224',
      points: 450,
      level: levels.junior,
      rating: 4.2,
      servicesCompleted: 25,
      skills: [1, 2], // Battery, Software
    },
    {
      email: 'velu@deenmobiles.com',
      username: 'velu',
      name: 'Velu Murugan',
      phone: '+91-9876543225',
      points: 2200,
      level: levels.mid,
      rating: 4.6,
      servicesCompleted: 85,
      skills: [0, 3, 4], // Screen, Charging, Camera
    },
  ];

  for (const techData of techniciansData) {
    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: { email: techData.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: techData.email,
          username: techData.username,
          password: hashedPassword,
          name: techData.name,
          phone: techData.phone,
          role: UserRole.TECHNICIAN,
          roleId: technicianRole.id,
          companyId: company.id,
          branchId: vilupuramBranch.id,
          isActive: true,
        },
      });
      console.log(`✅ Created user: ${user.name}`);
    } else {
      console.log(`✅ User already exists: ${user.name}`);
    }

    // Check if technician profile already exists
    let profile = await prisma.technicianProfile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) {
      profile = await prisma.technicianProfile.create({
        data: {
          userId: user.id,
          companyId: company.id,
          branchId: vilupuramBranch.id,
          totalPoints: techData.points,
          currentLevelId: techData.level?.id,
          averageRating: techData.rating,
          totalServicesCompleted: techData.servicesCompleted,
          totalRevenue: techData.servicesCompleted * 1500,
          avgCompletionHours: 4 + Math.random() * 4,
          isAvailable: true,
          maxConcurrentJobs: 5,
        },
      });
      console.log(`✅ Created technician profile for: ${user.name}`);

      // Create skills for this technician
      for (const skillIndex of techData.skills) {
        if (serviceCategories[skillIndex]) {
          await prisma.technicianSkill.create({
            data: {
              technicianProfileId: profile.id,
              serviceCategoryId: serviceCategories[skillIndex].id,
              proficiencyLevel: Math.floor(Math.random() * 3) + 3, // 3-5
              isVerified: true,
              verifiedAt: new Date(),
            },
          });
        }
      }
      console.log(`✅ Created ${techData.skills.length} skills for: ${user.name}`);
    } else {
      console.log(`✅ Technician profile already exists for: ${user.name}`);
    }
  }

  // Create a Branch Manager for Vilupuram
  let branchManager = await prisma.user.findFirst({
    where: { email: 'vpm.manager@deenmobiles.com' }
  });

  const managerRole = await prisma.role.findFirst({
    where: { name: 'Manager', isSystemRole: true }
  });

  if (!branchManager && managerRole) {
    branchManager = await prisma.user.create({
      data: {
        email: 'vpm.manager@deenmobiles.com',
        username: 'vpmmanager',
        password: hashedPassword,
        name: 'Arun Kumar',
        phone: '+91-9876543226',
        role: UserRole.MANAGER,
        roleId: managerRole.id,
        companyId: company.id,
        branchId: vilupuramBranch.id,
        isActive: true,
      },
    });
    console.log('✅ Created Vilupuram branch manager:', branchManager.name);

    // Update branch with manager
    await prisma.branch.update({
      where: { id: vilupuramBranch.id },
      data: { managerId: branchManager.id },
    });
  }

  console.log('');
  console.log('🎉 Vilupuram branch seeding complete!');
  console.log('');
  console.log('📝 New Login Credentials (Vilupuram):');
  console.log('-----------------------------------');
  console.log('Branch Manager: vpm.manager@deenmobiles.com / password123');
  console.log('Technicians:');
  console.log('  - kumar@deenmobiles.com / password123 (Senior - 3500 pts)');
  console.log('  - ravi@deenmobiles.com / password123 (Mid - 1800 pts)');
  console.log('  - murugan@deenmobiles.com / password123 (Expert - 6500 pts)');
  console.log('  - senthil@deenmobiles.com / password123 (Junior - 450 pts)');
  console.log('  - velu@deenmobiles.com / password123 (Mid - 2200 pts)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
