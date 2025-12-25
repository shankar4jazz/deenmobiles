const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper to generate random date within last N days
const randomPastDate = (days = 90) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date;
};

// Helper to get random element from array
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate random amount in range
const randomAmount = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Expense templates by category
const expenseTemplates = {
  'RENT': [
    { description: 'Monthly shop rent payment', amountRange: [15000, 25000], vendorNames: ['Sri Krishna Properties', 'Tamil Nadu Real Estate'], recurring: true },
  ],
  'ELECTRICITY': [
    { description: 'Electricity bill payment', amountRange: [2000, 5000], vendorNames: ['TNEB'], recurring: true },
  ],
  'WATER': [
    { description: 'Water bill payment', amountRange: [300, 800], vendorNames: ['Municipal Water Supply'], recurring: true },
  ],
  'INTERNET': [
    { description: 'Broadband internet charges', amountRange: [800, 1500], vendorNames: ['Airtel', 'BSNL', 'Jio Fiber'], recurring: true },
  ],
  'SALARY': [
    { description: 'Staff salary payment for the month', amountRange: [40000, 80000], vendorNames: null, recurring: true },
  ],
  'OFFICE_SUPPLIES': [
    { description: 'Purchase of stationery and office supplies', amountRange: [500, 2000], vendorNames: ['Local Stationers', 'Office Mart', 'Staples India'] },
    { description: 'Printer ink and paper purchase', amountRange: [800, 1500], vendorNames: ['HP Store', 'Office Supplies'] },
    { description: 'Files, folders and documentation materials', amountRange: [400, 1000], vendorNames: ['Stationary Shop'] },
  ],
  'MAINTENANCE': [
    { description: 'Shop maintenance and repairs', amountRange: [1000, 5000], vendorNames: ['Local Maintenance Services', 'Quick Fix Solutions'] },
    { description: 'AC servicing and maintenance', amountRange: [1500, 3000], vendorNames: ['Cool Tech Services', 'AC Care'] },
    { description: 'Plumbing repair work', amountRange: [500, 2000], vendorNames: ['Local Plumber'] },
    { description: 'Electrical wiring and fixture repairs', amountRange: [800, 2500], vendorNames: ['Electrical Services'] },
  ],
  'TRANSPORT': [
    { description: 'Parts delivery and transportation', amountRange: [300, 1500], vendorNames: ['Local Transport', 'FastTrack Logistics'] },
    { description: 'Staff travel expenses', amountRange: [500, 2000], vendorNames: null },
    { description: 'Courier and shipping charges', amountRange: [200, 800], vendorNames: ['DTDC', 'Blue Dart', 'India Post'] },
  ],
  'MARKETING': [
    { description: 'Social media advertising campaign', amountRange: [2000, 8000], vendorNames: ['Facebook Ads', 'Google Ads'] },
    { description: 'Printing of flyers and banners', amountRange: [1000, 3000], vendorNames: ['Digital Prints', 'Banner World'] },
    { description: 'Local newspaper advertisement', amountRange: [1500, 4000], vendorNames: ['Daily Thanthi', 'Dinakaran'] },
  ],
  'INSURANCE': [
    { description: 'Shop insurance premium', amountRange: [3000, 8000], vendorNames: ['ICICI Lombard', 'HDFC ERGO', 'Bajaj Allianz'], recurring: true },
  ],
  'PROFESSIONAL': [
    { description: 'Accountant professional fees', amountRange: [2000, 5000], vendorNames: ['CA Associates', 'Tax Consultants'] },
    { description: 'Legal consultation charges', amountRange: [1500, 4000], vendorNames: ['Legal Services'] },
    { description: 'GST filing and compliance charges', amountRange: [1000, 3000], vendorNames: ['CA Associates'] },
  ],
  'TOOLS': [
    { description: 'Purchase of repair tools and equipment', amountRange: [3000, 10000], vendorNames: ['Tool Mart', 'Professional Tools India', 'Mobile Repair Tools'] },
    { description: 'Soldering station and accessories', amountRange: [4000, 8000], vendorNames: ['Electronics Tool Shop'] },
    { description: 'Mobile opening tools kit', amountRange: [1500, 3000], vendorNames: ['Repair Tools Supplier'] },
    { description: 'Anti-static mat and equipment', amountRange: [1000, 2500], vendorNames: ['Safety Equipment Store'] },
  ],
  'REFRESHMENTS': [
    { description: 'Tea, coffee and snacks for staff', amountRange: [800, 2000], vendorNames: ['Local Tea Shop', 'Canteen'] },
    { description: 'Water bottles and refreshments', amountRange: [500, 1200], vendorNames: ['Bisleri Distributor', 'Local Store'] },
  ],
  'CLEANING': [
    { description: 'Cleaning supplies purchase', amountRange: [500, 1500], vendorNames: ['Cleaning Supplies Store'] },
    { description: 'Housekeeping service charges', amountRange: [1000, 2500], vendorNames: ['Cleaning Services'] },
  ],
  'MISC': [
    { description: 'Miscellaneous office expenses', amountRange: [500, 2000], vendorNames: null },
    { description: 'Parking and miscellaneous charges', amountRange: [300, 1000], vendorNames: null },
    { description: 'Bank charges and transaction fees', amountRange: [200, 800], vendorNames: null },
  ],
};

async function seedExpenses() {
  console.log('💰 Seeding Expenses...\\n');

  try {
    // Get company
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new Error('No company found.');
    }

    // Get all branches
    const branches = await prisma.branch.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true, code: true },
    });

    console.log(`✅ Found ${branches.length} branches\\n`);

    // Get all expense categories
    const expenseCategories = await prisma.expenseCategory.findMany({
      where: { companyId: company.id, isActive: true },
    });

    if (expenseCategories.length === 0) {
      throw new Error('No expense categories found. Please run seedAllMasterData.js first.');
    }

    console.log(`✅ Found ${expenseCategories.length} expense categories\\n`);

    // Create a map of category codes to IDs
    const categoryMap = {};
    expenseCategories.forEach(cat => {
      categoryMap[cat.code] = cat.id;
    });

    let totalExpenses = 0;

    // Process each branch
    for (const branch of branches) {
      console.log(`🏪 Creating expenses for ${branch.name} (${branch.code})...`);

      // Get users (managers/admins) for this branch who can record expenses
      const users = await prisma.user.findMany({
        where: {
          branchId: branch.id,
          companyId: company.id,
          role: { in: ['MANAGER', 'SUPER_ADMIN', 'ADMIN'] },
        },
      });

      if (users.length === 0) {
        console.log(`   ⚠️  No managers/admins found, skipping this branch\\n`);
        continue;
      }

      let branchExpenses = 0;

      // Generate expenses for each category
      for (const [categoryCode, templates] of Object.entries(expenseTemplates)) {
        const categoryId = categoryMap[categoryCode];

        if (!categoryId) {
          console.log(`   ⚠️  Category ${categoryCode} not found, skipping`);
          continue;
        }

        // Determine number of expenses for this category
        // Recurring: 2-3 (monthly), Non-recurring: 1-3
        const template = templates[0];
        const isRecurring = template.recurring || false;
        const numExpenses = isRecurring ? randomAmount(2, 3) : randomAmount(1, Math.min(3, templates.length));

        for (let i = 0; i < numExpenses; i++) {
          try {
            // Select random template from this category
            const selectedTemplate = randomElement(templates);

            // Generate expense data
            const expenseDate = randomPastDate(60); // Last 60 days
            const amount = randomAmount(selectedTemplate.amountRange[0], selectedTemplate.amountRange[1]);
            const expenseNumber = `EXP-${branch.code}-${Date.now()}-${branchExpenses}`;

            // Generate bill number (70% of expenses have bill numbers)
            const billNumber = Math.random() > 0.3
              ? `BILL-${Math.floor(Math.random() * 100000)}`
              : null;

            // Select vendor name if applicable
            const vendorName = selectedTemplate.vendorNames
              ? randomElement(selectedTemplate.vendorNames)
              : null;

            // Random user to record the expense
            const recordedBy = randomElement(users);

            // Create expense
            await prisma.expense.create({
              data: {
                expenseNumber,
                branchId: branch.id,
                categoryId,
                amount,
                expenseDate,
                description: selectedTemplate.description,
                billNumber,
                vendorName,
                recordedBy: recordedBy.id,
                companyId: company.id,
              },
            });

            branchExpenses++;
            totalExpenses++;

          } catch (error) {
            console.log(`      ⚠️  Expense error: ${error.message}`);
          }
        }
      }

      console.log(`   ✅ Expenses created: ${branchExpenses}\\n`);
    }

    console.log('═'.repeat(50));
    console.log('📊 Expenses Seeding Summary:');
    console.log('═'.repeat(50));
    console.log(`   💰 Total Expenses Created: ${totalExpenses}`);
    console.log(`   🏪 Branches Processed: ${branches.length}`);
    console.log(`   📝 Expense Categories Used: ${expenseCategories.length}`);
    console.log('═'.repeat(50));
    console.log('');

  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    await seedExpenses();
    console.log('🎉 Expenses seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
