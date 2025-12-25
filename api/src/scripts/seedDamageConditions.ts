import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const damageConditions = [
  // Screen/Display Damage
  { name: 'Screen Damage', description: 'Display glass or screen is cracked or shattered' },
  { name: 'Display Damage', description: 'Screen is black or not displaying anything' },
  { name: 'Touch Panel Damage', description: 'Touch screen not responding or ghost touch issues' },
  { name: 'LCD Damage', description: 'Visible lines, dead pixels, or spots on screen' },
  // Body Damage
  { name: 'Back Door Damage', description: 'Back glass or panel is cracked or broken' },
  { name: 'Frame Damage', description: 'Phone body frame is bent or damaged' },
  { name: 'Camera Glass Damage', description: 'Camera lens glass is cracked or broken' },
  // Port/Button Damage
  { name: 'Charging Port Damage', description: 'Charging port is loose, damaged, or broken' },
  { name: 'Power Button Damage', description: 'Power/lock button stuck or not responding' },
  { name: 'Volume Button Damage', description: 'Volume buttons stuck or not functioning' },
  { name: 'Home Button Damage', description: 'Home button not responding (for phones with physical button)' },
  { name: 'Headphone Jack Damage', description: '3.5mm audio jack not working or loose' },
  // Internal Damage
  { name: 'Battery Damage', description: 'Battery is swollen, bulging, or not holding charge' },
  { name: 'Speaker Damage', description: 'No sound from loudspeaker or earpiece' },
  { name: 'Microphone Damage', description: 'Caller cannot hear voice during calls' },
  { name: 'Camera Damage', description: 'Camera not working or showing black screen' },
  { name: 'Motherboard Damage', description: 'Internal board damage affecting multiple functions' },
  // Water/Physical Damage
  { name: 'Water Damage', description: 'Phone exposed to water or liquid damage' },
  { name: 'Physical Damage', description: 'Device has visible physical damage from drops or impact' },
  { name: 'Burn Damage', description: 'Device has burn marks or heat damage' },
  // Sensor Damage
  { name: 'Fingerprint Sensor Damage', description: 'Fingerprint scanner not working or not recognizing' },
  { name: 'Face ID Damage', description: 'Face recognition/unlock not functioning' },
  { name: 'Proximity Sensor Damage', description: 'Screen not turning off during calls' },
  // Cosmetic/Minor Damage
  { name: 'Scratches Only', description: 'Minor scratches on screen or body, no functional issues' },
  { name: 'Dents', description: 'Small dents on the body without affecting functionality' },
  { name: 'No Visible Damage', description: 'Device has no visible physical damage' },
];

async function main() {
  console.log('🔧 Seeding damage conditions...');

  // Get the first company
  const company = await prisma.company.findFirst();

  if (!company) {
    console.error('❌ No company found. Please run the main seed first.');
    process.exit(1);
  }

  console.log(`📍 Using company: ${company.name}`);

  let created = 0;
  let skipped = 0;

  for (const condition of damageConditions) {
    // Check if damage condition already exists
    const existing = await prisma.damageCondition.findFirst({
      where: {
        name: condition.name,
        companyId: company.id,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.damageCondition.create({
      data: {
        name: condition.name,
        description: condition.description,
        companyId: company.id,
        isActive: true,
      },
    });
    created++;
  }

  console.log(`✅ Created ${created} new damage conditions`);
  if (skipped > 0) {
    console.log(`⏭️  Skipped ${skipped} existing conditions`);
  }
  console.log('🎉 Done!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
