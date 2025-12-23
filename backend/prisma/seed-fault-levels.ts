import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fault level mapping based on common repair types
// Level 1: Easy (simple fixes, software issues)
// Level 2: Simple (basic replacements)
// Level 3: Medium (moderate complexity)
// Level 4: Complex (technical repairs)
// Level 5: Hard (advanced repairs, motherboard work)

const faultLevelMapping: Record<string, number> = {
  // Level 1 - Easy
  'software': 1,
  'update': 1,
  'setting': 1,
  'backup': 1,
  'restore': 1,
  'app': 1,
  'clean': 1,
  'format': 1,
  'reset': 1,
  'data transfer': 1,
  'sim': 1,
  'unlock': 1,
  'pattern': 1,
  'password': 1,

  // Level 2 - Simple
  'battery': 2,
  'back cover': 2,
  'back glass': 2,
  'back panel': 2,
  'tempered': 2,
  'protector': 2,
  'charging port': 2,
  'headphone jack': 2,
  'sim tray': 2,
  'button': 2,
  'power button': 2,
  'volume': 2,

  // Level 3 - Medium
  'screen': 3,
  'display': 3,
  'lcd': 3,
  'touch': 3,
  'camera': 3,
  'front camera': 3,
  'rear camera': 3,
  'speaker': 3,
  'earpiece': 3,
  'mic': 3,
  'microphone': 3,
  'vibrator': 3,
  'fingerprint': 3,

  // Level 4 - Complex
  'wifi': 4,
  'network': 4,
  'signal': 4,
  'antenna': 4,
  'face id': 4,
  'proximity': 4,
  'sensor': 4,
  'flex': 4,
  'connector': 4,
  'water damage': 4,
  'liquid': 4,

  // Level 5 - Hard
  'motherboard': 5,
  'board': 5,
  'ic': 5,
  'chip': 5,
  'logic board': 5,
  'baseband': 5,
  'imei': 5,
  'dead': 5,
  'no power': 5,
  'short circuit': 5,
  'soldering': 5,
  'reballing': 5,
};

async function seedFaultLevels() {
  console.log('Starting fault level seeding...');

  const faults = await prisma.fault.findMany();
  console.log(`Found ${faults.length} faults to analyze`);

  for (const fault of faults) {
    const faultNameLower = fault.name.toLowerCase();
    let level = 3; // Default to medium

    // Check each keyword and find the matching level
    for (const [keyword, keywordLevel] of Object.entries(faultLevelMapping)) {
      if (faultNameLower.includes(keyword)) {
        level = keywordLevel;
        break;
      }
    }

    // Adjust level based on price (higher price = likely harder work)
    const price = Number(fault.defaultPrice);
    if (price > 5000 && level < 4) level = 4;
    if (price > 10000 && level < 5) level = 5;
    if (price < 500 && level > 2) level = 2;
    if (price < 200 && level > 1) level = 1;

    await prisma.fault.update({
      where: { id: fault.id },
      data: { level },
    });

    console.log(`Updated "${fault.name}" (₹${price}) -> Level ${level}`);
  }

  console.log('Fault level seeding completed!');
}

seedFaultLevels()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
