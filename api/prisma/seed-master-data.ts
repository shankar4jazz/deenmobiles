import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding master data for existing companies...');

  // Get all companies
  const companies = await prisma.company.findMany();

  if (companies.length === 0) {
    console.log('⚠️  No companies found. Please run the main seed script first.');
    return;
  }

  console.log(`Found ${companies.length} companies`);

  for (const company of companies) {
    console.log(`\n🏢 Processing company: ${company.name}`);

    // Check if master data already exists for this company
    const existingCategories = await prisma.itemCategory.count({
      where: { companyId: company.id },
    });

    if (existingCategories > 0) {
      console.log(`⏭️  Master data already exists for ${company.name}, skipping...`);
      continue;
    }

    // Item Categories
    const categories = await Promise.all([
      prisma.itemCategory.create({
        data: {
          name: 'Display',
          code: 'DISPLAY',
          description: 'Display screens and LCD panels',
          companyId: company.id,
        },
      }),
      prisma.itemCategory.create({
        data: {
          name: 'Battery',
          code: 'BATTERY',
          description: 'Batteries and power cells',
          companyId: company.id,
        },
      }),
      prisma.itemCategory.create({
        data: {
          name: 'Charger',
          code: 'CHARGER',
          description: 'Chargers and charging adapters',
          companyId: company.id,
        },
      }),
      prisma.itemCategory.create({
        data: {
          name: 'Cable',
          code: 'CABLE',
          description: 'Cables and connectors',
          companyId: company.id,
        },
      }),
      prisma.itemCategory.create({
        data: {
          name: 'Audio',
          code: 'AUDIO',
          description: 'Audio components (speakers, microphones)',
          companyId: company.id,
        },
      }),
      prisma.itemCategory.create({
        data: {
          name: 'Camera',
          code: 'CAMERA',
          description: 'Camera modules and components',
          companyId: company.id,
        },
      }),
      prisma.itemCategory.create({
        data: {
          name: 'Case/Cover',
          code: 'CASE_COVER',
          description: 'Phone cases and protective covers',
          companyId: company.id,
        },
      }),
      prisma.itemCategory.create({
        data: {
          name: 'Screen Protector',
          code: 'SCREEN_PROTECTOR',
          description: 'Screen protectors and tempered glass',
          companyId: company.id,
        },
      }),
      prisma.itemCategory.create({
        data: {
          name: 'Accessory',
          code: 'ACCESSORY',
          description: 'General accessories',
          companyId: company.id,
        },
      }),
      prisma.itemCategory.create({
        data: {
          name: 'Electrical',
          code: 'ELECTRICAL',
          description: 'Electrical components',
          companyId: company.id,
        },
      }),
      prisma.itemCategory.create({
        data: {
          name: 'Mechanical',
          code: 'MECHANICAL',
          description: 'Mechanical parts and components',
          companyId: company.id,
        },
      }),
      prisma.itemCategory.create({
        data: {
          name: 'Other',
          code: 'OTHER',
          description: 'Other miscellaneous items',
          companyId: company.id,
        },
      }),
    ]);

    console.log(`  ✅ Created ${categories.length} item categories`);

    // Item Units
    const units = await Promise.all([
      prisma.itemUnit.create({
        data: {
          name: 'Piece',
          code: 'PIECE',
          symbol: 'pc',
          description: 'Individual pieces or units',
          companyId: company.id,
        },
      }),
      prisma.itemUnit.create({
        data: {
          name: 'Set',
          code: 'SET',
          symbol: 'set',
          description: 'Set of items',
          companyId: company.id,
        },
      }),
      prisma.itemUnit.create({
        data: {
          name: 'Box',
          code: 'BOX',
          symbol: 'box',
          description: 'Box or package',
          companyId: company.id,
        },
      }),
      prisma.itemUnit.create({
        data: {
          name: 'Meter',
          code: 'METER',
          symbol: 'm',
          description: 'Meters (length)',
          companyId: company.id,
        },
      }),
      prisma.itemUnit.create({
        data: {
          name: 'Roll',
          code: 'ROLL',
          symbol: 'roll',
          description: 'Roll of material',
          companyId: company.id,
        },
      }),
      prisma.itemUnit.create({
        data: {
          name: 'Kilogram',
          code: 'KILOGRAM',
          symbol: 'kg',
          description: 'Kilograms (weight)',
          companyId: company.id,
        },
      }),
      prisma.itemUnit.create({
        data: {
          name: 'Liter',
          code: 'LITER',
          symbol: 'L',
          description: 'Liters (volume)',
          companyId: company.id,
        },
      }),
    ]);

    console.log(`  ✅ Created ${units.length} item units`);

    // Item GST Rates
    const gstRates = await Promise.all([
      prisma.itemGSTRate.create({
        data: {
          name: 'GST 0%',
          rate: 0.0,
          description: 'Zero GST rate',
          companyId: company.id,
        },
      }),
      prisma.itemGSTRate.create({
        data: {
          name: 'GST 5%',
          rate: 5.0,
          description: '5% GST rate',
          companyId: company.id,
        },
      }),
      prisma.itemGSTRate.create({
        data: {
          name: 'GST 12%',
          rate: 12.0,
          description: '12% GST rate',
          companyId: company.id,
        },
      }),
      prisma.itemGSTRate.create({
        data: {
          name: 'GST 18%',
          rate: 18.0,
          description: '18% GST rate',
          companyId: company.id,
        },
      }),
      prisma.itemGSTRate.create({
        data: {
          name: 'GST 28%',
          rate: 28.0,
          description: '28% GST rate',
          companyId: company.id,
        },
      }),
    ]);

    console.log(`  ✅ Created ${gstRates.length} GST rates`);
    console.log(`✅ Completed master data for ${company.name}`);
  }

  console.log('\n🎉 Master data seeding completed for all companies!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding master data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
