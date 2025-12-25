const { PrismaClient, EstimateStatus } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper functions
const randomPastDate = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date;
};

const randomFutureDate = (days = 15) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * days) + 5);
  return date;
};

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Estimate items data
const estimateItemsData = {
  DISPLAY: [
    { description: 'iPhone 13 Display Replacement (Original)', unitPrice: 12000, quantity: 1 },
    { description: 'Samsung Galaxy A52 Display Assembly', unitPrice: 4500, quantity: 1 },
    { description: 'Redmi Note 10 Pro Display', unitPrice: 3200, quantity: 1 },
    { description: 'iPhone 12 Display + Installation', unitPrice: 11500, quantity: 1 },
    { description: 'OnePlus Nord Display Replacement', unitPrice: 5500, quantity: 1 },
  ],
  BATTERY: [
    { description: 'iPhone 12 Battery Replacement', unitPrice: 2000, quantity: 1 },
    { description: 'Samsung Battery + Installation', unitPrice: 1500, quantity: 1 },
    { description: 'Redmi Note 10 Battery', unitPrice: 800, quantity: 1 },
    { description: 'iPhone 11 Battery Replacement', unitPrice: 1800, quantity: 1 },
  ],
  CHARGING: [
    { description: 'Charging Port Replacement', unitPrice: 800, quantity: 1 },
    { description: 'Charging IC Repair', unitPrice: 1200, quantity: 1 },
    { description: 'USB-C Port Module Replacement', unitPrice: 600, quantity: 1 },
  ],
  SPEAKER: [
    { description: 'Earpiece Speaker Replacement', unitPrice: 400, quantity: 1 },
    { description: 'Loud Speaker Replacement', unitPrice: 500, quantity: 1 },
    { description: 'Both Speakers Replacement', unitPrice: 850, quantity: 1 },
  ],
  CAMERA: [
    { description: 'Rear Camera Module Replacement', unitPrice: 2500, quantity: 1 },
    { description: 'Front Camera Replacement', unitPrice: 1500, quantity: 1 },
    { description: 'Camera Glass Replacement', unitPrice: 300, quantity: 1 },
  ],
  SOFTWARE: [
    { description: 'Software Update & Optimization', unitPrice: 500, quantity: 1 },
    { description: 'Data Recovery Service', unitPrice: 1500, quantity: 1 },
    { description: 'Virus Removal & Security Setup', unitPrice: 800, quantity: 1 },
  ],
  WATER_DAMAGE: [
    { description: 'Water Damage Inspection', unitPrice: 500, quantity: 1 },
    { description: 'Logic Board Cleaning & Repair', unitPrice: 3500, quantity: 1 },
    { description: 'Complete Water Damage Treatment', unitPrice: 5000, quantity: 1 },
  ],
  ACCESSORIES: [
    { description: 'Tempered Glass Screen Protector', unitPrice: 100, quantity: 1 },
    { description: 'Premium Silicone Case', unitPrice: 250, quantity: 1 },
    { description: '20W Fast Charger', unitPrice: 350, quantity: 1 },
    { description: 'Lightning Cable (1m)', unitPrice: 300, quantity: 1 },
    { description: 'USB-C Cable (1m)', unitPrice: 250, quantity: 1 },
  ],
};

// Notes templates
const notesTemplates = [
  'All parts are original and come with 6 months warranty.',
  'Original parts with 1 year warranty. Free installation included.',
  'Compatible parts with 90 days warranty. Installation charges included.',
  'Premium quality replacement. 6 months warranty on parts and labor.',
  'All services include free device cleaning and inspection.',
  'Express service available. Same day completion possible.',
];

async function seedEstimates() {
  console.log('📝 Seeding Estimates for VPM Branch...\n');

  try {
    // Get company
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new Error('No company found. Please run main seed first.');
    }

    // Get VPM/TPT branch
    const vpmBranch = await prisma.branch.findFirst({
      where: {
        OR: [
          { code: 'TPT' },
          { code: 'VPM' },
          { name: { contains: 'TPT' } },
        ],
      },
    });

    if (!vpmBranch) {
      console.log('⚠️  VPM/TPT branch not found. Creating it...');
      const vpmBranch = await prisma.branch.create({
        data: {
          name: 'VPM Branch',
          code: 'VPM',
          companyId: company.id,
          address: 'VPM Complex, Tiruppur, Tamil Nadu 641601',
          phone: '+91-9876543215',
          email: 'vpm@deenmobiles.com',
          isActive: true,
        },
      });
      console.log('✅ Created VPM branch\n');
    }

    // Get customers from TPT/VPM branch
    let customers = await prisma.customer.findMany({
      where: { branchId: vpmBranch.id },
      take: 20,
    });

    // If no customers, get any customers
    if (customers.length === 0) {
      customers = await prisma.customer.findMany({
        where: { companyId: company.id },
        take: 20,
      });
    }

    if (customers.length === 0) {
      throw new Error('No customers found. Please run customer seed first.');
    }

    console.log(`✅ Found ${customers.length} customers\n`);

    // Get users from branch for createdBy
    const branchUsers = await prisma.user.findMany({
      where: { branchId: vpmBranch.id },
      select: { id: true, name: true },
    });

    // If no users in branch, get any active users
    const users = branchUsers.length > 0
      ? branchUsers
      : await prisma.user.findMany({
          where: { companyId: company.id, isActive: true },
          take: 5,
        });

    console.log(`✅ Found ${users.length} users for estimate creation\n`);

    // Create estimates with different statuses
    const estimates = [];
    const estimateCount = 25; // Create 25 estimates
    let estimateNumber = 1001; // Starting estimate number

    for (let i = 0; i < estimateCount; i++) {
      const customer = randomElement(customers);
      const creator = users.length > 0 ? randomElement(users) : null;

      // Determine status (weighted distribution)
      let status;
      const statusRand = Math.random();
      if (statusRand < 0.15) status = EstimateStatus.DRAFT;
      else if (statusRand < 0.35) status = EstimateStatus.SENT;
      else if (statusRand < 0.55) status = EstimateStatus.APPROVED;
      else if (statusRand < 0.65) status = EstimateStatus.REJECTED;
      else if (statusRand < 0.80) status = EstimateStatus.CONVERTED;
      else status = EstimateStatus.EXPIRED;

      // Select random items for the estimate
      const categoryKeys = Object.keys(estimateItemsData);
      const selectedCategory = randomElement(categoryKeys);
      const categoryItems = estimateItemsData[selectedCategory];

      // Pick 1-3 items
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedItems = [];
      const usedItems = new Set();

      for (let j = 0; j < numItems; j++) {
        let item;
        let attempts = 0;
        do {
          item = randomElement(categoryItems);
          attempts++;
        } while (usedItems.has(item.description) && attempts < 10);

        if (!usedItems.has(item.description)) {
          selectedItems.push({ ...item });
          usedItems.add(item.description);
        }
      }

      // Sometimes add accessories
      if (Math.random() > 0.6) {
        const accessory = randomElement(estimateItemsData.ACCESSORIES);
        selectedItems.push({ ...accessory });
      }

      // Calculate amounts
      const subtotal = selectedItems.reduce((sum, item) =>
        sum + (item.unitPrice * item.quantity), 0
      );
      const taxRate = 0.18; // 18% GST
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      // Set dates based on status
      const createdAt = randomPastDate(45);
      let sentAt = null;
      let approvedAt = null;
      let convertedAt = null;
      let validUntil = randomFutureDate(15);

      if (status !== EstimateStatus.DRAFT) {
        sentAt = new Date(createdAt.getTime() + 1000 * 60 * 60 * 2); // 2 hours after creation
      }

      if (status === EstimateStatus.APPROVED || status === EstimateStatus.CONVERTED) {
        approvedAt = new Date(sentAt.getTime() + 1000 * 60 * 60 * 24); // 1 day after sent
      }

      if (status === EstimateStatus.CONVERTED) {
        convertedAt = new Date(approvedAt.getTime() + 1000 * 60 * 60 * 12); // 12 hours after approved
      }

      if (status === EstimateStatus.EXPIRED) {
        validUntil = randomPastDate(5); // Set valid until to past date
      }

      // Create estimate
      const estimate = await prisma.estimate.create({
        data: {
          estimateNumber: `EST-VPM-${estimateNumber.toString().padStart(4, '0')}`,
          customerId: customer.id,
          companyId: company.id,
          branchId: vpmBranch.id,
          createdBy: creator?.id,
          status,
          subtotal,
          taxAmount,
          totalAmount,
          validUntil,
          notes: randomElement(notesTemplates),
          sentAt,
          approvedAt,
          convertedAt,
          createdAt,
          items: {
            create: selectedItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.unitPrice * item.quantity,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      estimates.push(estimate);
      estimateNumber++;

      // Log progress every 5 estimates
      if ((i + 1) % 5 === 0) {
        console.log(`  Created ${i + 1}/${estimateCount} estimates...`);
      }
    }

    console.log(`\n✅ Created ${estimates.length} estimates for VPM branch\n`);

    // Display summary
    const statusCounts = estimates.reduce((acc, est) => {
      acc[est.status] = (acc[est.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Estimates Status Summary:');
    console.log('----------------------------');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} estimates`);
    });
    console.log('');

    // Calculate total values
    const totalValue = estimates.reduce((sum, est) => sum + est.totalAmount, 0);
    const approvedValue = estimates
      .filter(est => est.status === EstimateStatus.APPROVED || est.status === EstimateStatus.CONVERTED)
      .reduce((sum, est) => sum + est.totalAmount, 0);

    console.log(`💰 Total Estimates Value: ₹${totalValue.toFixed(2)}`);
    console.log(`💰 Approved Estimates Value: ₹${approvedValue.toFixed(2)}`);
    console.log('');

    console.log('🎉 Estimate seeding completed successfully!');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding estimates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedEstimates()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedEstimates };
