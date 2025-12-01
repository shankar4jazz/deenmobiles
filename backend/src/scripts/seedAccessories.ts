import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_ACCESSORIES = [
  { name: 'Charger', code: 'CHARGER', description: 'Device charging adapter' },
  { name: 'Charging Cable', code: 'CHARGING_CABLE', description: 'USB/Lightning charging cable' },
  { name: 'Case/Cover', code: 'CASE_COVER', description: 'Protective case or cover' },
  { name: 'Screen Protector', code: 'SCREEN_PROTECTOR', description: 'Tempered glass or film protector' },
  { name: 'Earphones', code: 'EARPHONES', description: 'Wired or wireless earphones' },
  { name: 'SIM Card', code: 'SIM_CARD', description: 'SIM card included' },
  { name: 'Memory Card', code: 'MEMORY_CARD', description: 'SD/MicroSD memory card' },
  { name: 'Battery', code: 'BATTERY', description: 'Removable battery' },
  { name: 'Stylus', code: 'STYLUS', description: 'Stylus pen' },
  { name: 'Box', code: 'BOX', description: 'Original device box' },
  { name: 'Manual', code: 'MANUAL', description: 'User manual or documentation' },
  { name: 'Warranty Card', code: 'WARRANTY_CARD', description: 'Warranty documentation' },
];

async function seedAccessories() {
  console.log('Seeding default accessories...');

  let created = 0;
  let skipped = 0;

  for (const accessory of DEFAULT_ACCESSORIES) {
    const existing = await prisma.accessory.findUnique({
      where: { name: accessory.name },
    });

    if (!existing) {
      await prisma.accessory.create({
        data: {
          name: accessory.name,
          code: accessory.code,
          description: accessory.description,
          isActive: true,
        },
      });
      console.log(`  Created: ${accessory.name}`);
      created++;
    } else {
      console.log(`  Skipped (exists): ${accessory.name}`);
      skipped++;
    }
  }

  console.log(`\nAccessory seeding completed!`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
}

seedAccessories()
  .catch((e) => {
    console.error('Error seeding accessories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
