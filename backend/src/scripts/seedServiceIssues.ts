import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const serviceIssues = [
  // Display/Screen Issues
  { name: 'Screen Cracked', description: 'Display glass or screen is cracked or shattered' },
  { name: 'Display Not Working', description: 'Screen is black or not displaying anything' },
  { name: 'Touch Not Responding', description: 'Touch screen not responding or ghost touch issues' },
  { name: 'Display Lines/Spots', description: 'Visible lines, dead pixels, or spots on screen' },
  { name: 'Screen Flickering', description: 'Display flickering or blinking intermittently' },
  // Battery Issues
  { name: 'Battery Draining Fast', description: 'Battery discharges quickly, poor battery life' },
  { name: 'Battery Swollen', description: 'Battery is swollen or bulging' },
  { name: 'Not Charging', description: 'Device not charging when connected to charger' },
  { name: 'Phone Overheating', description: 'Device gets excessively hot during use or charging' },
  { name: 'Battery Not Holding Charge', description: 'Battery percentage drops suddenly or phone shuts off' },
  // Charging & Port Issues
  { name: 'Charging Port Damaged', description: 'Charging port is loose, damaged, or broken' },
  { name: 'Slow Charging', description: 'Device charges very slowly' },
  { name: 'Charging Intermittent', description: 'Charging works inconsistently, connects and disconnects' },
  // Audio Issues
  { name: 'Speaker Not Working', description: 'No sound from loudspeaker or earpiece' },
  { name: 'Microphone Not Working', description: 'Caller cannot hear voice during calls' },
  { name: 'Audio Distorted', description: 'Sound is crackling, distorted, or unclear' },
  { name: 'Headphone Jack Issue', description: '3.5mm audio jack not working or loose' },
  // Camera Issues
  { name: 'Camera Not Working', description: 'Camera app shows black screen or fails to open' },
  { name: 'Camera Blurry', description: 'Photos are blurry or camera cannot focus' },
  { name: 'Front Camera Issue', description: 'Selfie camera not working or showing black screen' },
  { name: 'Camera Glass Cracked', description: 'Camera lens glass is cracked or broken' },
  { name: 'Flash Not Working', description: 'Camera flash or flashlight not functioning' },
  // Software Issues
  { name: 'Phone Hanging/Slow', description: 'Device is slow, lagging, or freezing frequently' },
  { name: 'Software Update Required', description: 'OS update needed or stuck in update loop' },
  { name: 'Apps Crashing', description: 'Applications crashing or not opening' },
  { name: 'Stuck on Logo', description: 'Phone stuck on boot logo, not starting properly' },
  { name: 'Factory Reset Required', description: 'Need complete data wipe and fresh setup' },
  { name: 'Virus/Malware', description: 'Device infected with virus or unwanted software' },
  // Network & Connectivity Issues
  { name: 'No Network Signal', description: 'No cellular network or signal strength issues' },
  { name: 'WiFi Not Working', description: 'Cannot connect to WiFi or weak WiFi signal' },
  { name: 'Bluetooth Not Working', description: 'Bluetooth not pairing or connecting to devices' },
  { name: 'SIM Card Not Detected', description: 'SIM card not recognized or SIM tray issue' },
  { name: 'Mobile Data Not Working', description: 'Internet not working on mobile data' },
  // Physical & Button Issues
  { name: 'Power Button Not Working', description: 'Power/lock button stuck or not responding' },
  { name: 'Volume Button Issue', description: 'Volume buttons stuck or not functioning' },
  { name: 'Home Button Not Working', description: 'Home button not responding (for phones with physical button)' },
  { name: 'Back Panel Damaged', description: 'Back glass or panel is cracked or broken' },
  { name: 'Frame/Body Damage', description: 'Phone body frame is bent or damaged' },
  // Water & Physical Damage
  { name: 'Water Damage', description: 'Phone exposed to water or liquid damage' },
  { name: 'Phone Not Turning On', description: 'Device completely dead, not powering on' },
  { name: 'Restart Loop', description: 'Phone keeps restarting automatically' },
  // Sensor & Other Issues
  { name: 'Fingerprint Sensor Issue', description: 'Fingerprint scanner not working or not recognizing' },
  { name: 'Face ID Not Working', description: 'Face recognition/unlock not functioning' },
  { name: 'Proximity Sensor Issue', description: 'Screen not turning off during calls' },
  { name: 'Vibration Not Working', description: 'Phone not vibrating for calls or notifications' },
  { name: 'GPS Not Working', description: 'Location/GPS not accurate or not working' },
  // Storage Issues
  { name: 'Storage Full', description: 'Internal storage full, need data cleanup or transfer' },
  { name: 'SD Card Not Detected', description: 'Memory card not recognized by device' },
  { name: 'Data Recovery', description: 'Need to recover lost or deleted data' },
  // General Service
  { name: 'General Checkup', description: 'Complete device diagnosis and health check' },
  { name: 'Screen Protector Installation', description: 'Apply new tempered glass or screen protector' },
  { name: 'Other Issue', description: 'Issue not listed above' },
];

async function main() {
  console.log('🔧 Seeding service issues...');

  // Get the first company
  const company = await prisma.company.findFirst();

  if (!company) {
    console.error('❌ No company found. Please run the main seed first.');
    process.exit(1);
  }

  console.log(`📍 Using company: ${company.name}`);

  let created = 0;
  let skipped = 0;

  for (const issue of serviceIssues) {
    // Check if issue already exists
    const existing = await prisma.serviceIssue.findFirst({
      where: {
        name: issue.name,
        companyId: company.id,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.serviceIssue.create({
      data: {
        name: issue.name,
        description: issue.description,
        companyId: company.id,
        isActive: true,
      },
    });
    created++;
  }

  console.log(`✅ Created ${created} new service issues`);
  if (skipped > 0) {
    console.log(`⏭️  Skipped ${skipped} existing issues`);
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
