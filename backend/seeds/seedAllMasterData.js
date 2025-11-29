const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Import all seed data
async function seedAllMasterData() {
  console.log('🌱 Starting comprehensive master data seeding...\n');

  try {
    // Get the company
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new Error('No company found. Please run the main seed first.');
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    // ============================================
    // 1. BRANDS
    // ============================================
    console.log('📱 Seeding Item Brands...');
    const brands = [
      { name: 'Apple', code: 'APPLE', description: 'Apple Inc. products' },
      { name: 'Samsung', code: 'SAMSUNG', description: 'Samsung Electronics' },
      { name: 'Xiaomi', code: 'XIAOMI', description: 'Xiaomi Corporation' },
      { name: 'OnePlus', code: 'ONEPLUS', description: 'OnePlus Technology' },
      { name: 'Realme', code: 'REALME', description: 'Realme Mobile' },
      { name: 'Oppo', code: 'OPPO', description: 'Oppo Electronics' },
      { name: 'Vivo', code: 'VIVO', description: 'Vivo Communication' },
      { name: 'Google', code: 'GOOGLE', description: 'Google Pixel devices' },
      { name: 'Motorola', code: 'MOTOROLA', description: 'Motorola Mobility' },
      { name: 'Nokia', code: 'NOKIA', description: 'Nokia Corporation' },
      { name: 'Huawei', code: 'HUAWEI', description: 'Huawei Technologies' },
      { name: 'Honor', code: 'HONOR', description: 'Honor Device' },
      { name: 'Asus', code: 'ASUS', description: 'Asus Mobile' },
      { name: 'Sony', code: 'SONY', description: 'Sony Corporation' },
      { name: 'LG', code: 'LG', description: 'LG Electronics' },
      { name: 'Nothing', code: 'NOTHING', description: 'Nothing Technology' },
      { name: 'Infinix', code: 'INFINIX', description: 'Infinix Mobility' },
      { name: 'Tecno', code: 'TECNO', description: 'Tecno Mobile' },
      { name: 'Itel', code: 'ITEL', description: 'Itel Mobile' },
      { name: 'Lava', code: 'LAVA', description: 'Lava International' },
    ];

    let brandsCreated = 0;
    for (const brand of brands) {
      const existing = await prisma.itemBrand.findFirst({
        where: { code: brand.code, companyId: company.id },
      });
      if (!existing) {
        await prisma.itemBrand.create({
          data: { ...brand, companyId: company.id, isActive: true },
        });
        brandsCreated++;
      }
    }
    console.log(`   ✅ Created: ${brandsCreated}, ⏭️  Skipped: ${brands.length - brandsCreated}\n`);
    totalCreated += brandsCreated;
    totalSkipped += (brands.length - brandsCreated);

    // ============================================
    // 2. DEVICE CONDITIONS
    // ============================================
    console.log('🔧 Seeding Device Conditions...');
    const conditions = [
      { name: 'Excellent', code: 'EXCELLENT', description: 'Like new, no scratches or damage' },
      { name: 'Good', code: 'GOOD', description: 'Minor wear, fully functional' },
      { name: 'Fair', code: 'FAIR', description: 'Visible wear, some cosmetic damage' },
      { name: 'Poor', code: 'POOR', description: 'Significant damage, may have functional issues' },
      { name: 'Broken', code: 'BROKEN', description: 'Not working or severely damaged' },
    ];

    let conditionsCreated = 0;
    for (const condition of conditions) {
      const existing = await prisma.deviceCondition.findFirst({
        where: { code: condition.code, companyId: company.id },
      });
      if (!existing) {
        await prisma.deviceCondition.create({
          data: { ...condition, companyId: company.id, isActive: true },
        });
        conditionsCreated++;
      }
    }
    console.log(`   ✅ Created: ${conditionsCreated}, ⏭️  Skipped: ${conditions.length - conditionsCreated}\n`);
    totalCreated += conditionsCreated;
    totalSkipped += (conditions.length - conditionsCreated);

    // ============================================
    // 3. SERVICE CATEGORIES
    // ============================================
    console.log('🔨 Seeding Service Categories...');
    const serviceCategories = [
      { name: 'Display Replacement', code: 'DISPLAY_REPLACE', description: 'Screen and display repairs', defaultPrice: 2000, technicianPoints: 10 },
      { name: 'Battery Replacement', code: 'BATTERY_REPLACE', description: 'Battery replacement service', defaultPrice: 800, technicianPoints: 5 },
      { name: 'Charging Port Repair', code: 'CHARGING_PORT', description: 'Charging port repair or replacement', defaultPrice: 500, technicianPoints: 5 },
      { name: 'Camera Repair', code: 'CAMERA_REPAIR', description: 'Front or rear camera repair', defaultPrice: 1500, technicianPoints: 8 },
      { name: 'Speaker Repair', code: 'SPEAKER_REPAIR', description: 'Speaker or earpiece repair', defaultPrice: 600, technicianPoints: 5 },
      { name: 'Microphone Repair', code: 'MIC_REPAIR', description: 'Microphone repair or replacement', defaultPrice: 500, technicianPoints: 5 },
      { name: 'Button Repair', code: 'BUTTON_REPAIR', description: 'Power or volume button repair', defaultPrice: 400, technicianPoints: 4 },
      { name: 'Water Damage Repair', code: 'WATER_DAMAGE', description: 'Water damage cleaning and repair', defaultPrice: 1200, technicianPoints: 12 },
      { name: 'Software Issue', code: 'SOFTWARE', description: 'OS update, software troubleshooting', defaultPrice: 300, technicianPoints: 3 },
      { name: 'Data Recovery', code: 'DATA_RECOVERY', description: 'Data backup and recovery service', defaultPrice: 500, technicianPoints: 5 },
      { name: 'Screen Protector Installation', code: 'SCREEN_PROTECTOR', description: 'Tempered glass installation', defaultPrice: 100, technicianPoints: 1 },
      { name: 'Back Panel Replacement', code: 'BACK_PANEL', description: 'Back glass or cover replacement', defaultPrice: 1000, technicianPoints: 7 },
      { name: 'Motherboard Repair', code: 'MOTHERBOARD', description: 'IC level motherboard repair', defaultPrice: 3000, technicianPoints: 20 },
      { name: 'Network Issue', code: 'NETWORK', description: 'WiFi, Bluetooth, cellular network repair', defaultPrice: 800, technicianPoints: 8 },
      { name: 'General Inspection', code: 'INSPECTION', description: 'Complete device inspection', defaultPrice: 200, technicianPoints: 2 },
    ];

    let serviceCategoriesCreated = 0;
    for (const category of serviceCategories) {
      const existing = await prisma.serviceCategory.findFirst({
        where: { code: category.code, companyId: company.id },
      });
      if (!existing) {
        await prisma.serviceCategory.create({
          data: { ...category, companyId: company.id, isActive: true },
        });
        serviceCategoriesCreated++;
      }
    }
    console.log(`   ✅ Created: ${serviceCategoriesCreated}, ⏭️  Skipped: ${serviceCategories.length - serviceCategoriesCreated}\n`);
    totalCreated += serviceCategoriesCreated;
    totalSkipped += (serviceCategories.length - serviceCategoriesCreated);

    // ============================================
    // 4. EXPENSE CATEGORIES
    // ============================================
    console.log('💰 Seeding Expense Categories...');
    const expenseCategories = [
      { name: 'Rent', code: 'RENT', description: 'Shop/office rent expenses' },
      { name: 'Electricity', code: 'ELECTRICITY', description: 'Electricity bill payments' },
      { name: 'Water', code: 'WATER', description: 'Water bill payments' },
      { name: 'Internet', code: 'INTERNET', description: 'Internet and telecom expenses' },
      { name: 'Salary', code: 'SALARY', description: 'Employee salary payments' },
      { name: 'Office Supplies', code: 'OFFICE_SUPPLIES', description: 'Stationery and office supplies' },
      { name: 'Maintenance', code: 'MAINTENANCE', description: 'Equipment and shop maintenance' },
      { name: 'Transportation', code: 'TRANSPORT', description: 'Transportation and delivery costs' },
      { name: 'Marketing', code: 'MARKETING', description: 'Marketing and advertising expenses' },
      { name: 'Insurance', code: 'INSURANCE', description: 'Insurance premiums' },
      { name: 'Professional Fees', code: 'PROFESSIONAL', description: 'Accountant, legal fees' },
      { name: 'Tools & Equipment', code: 'TOOLS', description: 'Repair tools and equipment' },
      { name: 'Refreshments', code: 'REFRESHMENTS', description: 'Tea, coffee, snacks for staff' },
      { name: 'Cleaning', code: 'CLEANING', description: 'Cleaning and housekeeping' },
      { name: 'Miscellaneous', code: 'MISC', description: 'Other miscellaneous expenses' },
    ];

    let expenseCategoriesCreated = 0;
    for (const category of expenseCategories) {
      const existing = await prisma.expenseCategory.findFirst({
        where: { code: category.code, companyId: company.id },
      });
      if (!existing) {
        await prisma.expenseCategory.create({
          data: { ...category, companyId: company.id, isActive: true },
        });
        expenseCategoriesCreated++;
      }
    }
    console.log(`   ✅ Created: ${expenseCategoriesCreated}, ⏭️  Skipped: ${expenseCategories.length - expenseCategoriesCreated}\n`);
    totalCreated += expenseCategoriesCreated;
    totalSkipped += (expenseCategories.length - expenseCategoriesCreated);

    // ============================================
    // 5. SUPPLIERS
    // ============================================
    console.log('🏭 Seeding Suppliers...');
    const suppliers = [
      {
        supplierCode: 'SUP-VPM-001',
        name: 'Chennai Mobile Parts Wholesale',
        contactPerson: 'Ramesh Kumar',
        email: 'ramesh@cmparts.com',
        phone: '+91 9876500001',
        address: 'No.123, Ritchie Street, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600002',
        gstNumber: '33AABCC1234F1Z1',
        panNumber: 'AABCC1234F',
      },
      {
        supplierCode: 'SUP-VPM-002',
        name: 'Mobile Parts India',
        contactPerson: 'Suresh Babu',
        email: 'suresh@mobileparts.com',
        phone: '+91 9876500002',
        address: 'No.456, NSC Bose Road, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        gstNumber: '33BBCDD2345G2Z2',
        panNumber: 'BBCDD2345G',
      },
      {
        supplierCode: 'SUP-VPM-003',
        name: 'Tech Accessories Suppliers',
        contactPerson: 'Priya Sharma',
        email: 'priya@techacc.com',
        phone: '+91 9876500003',
        address: 'No.789, T Nagar, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600017',
        gstNumber: '33CCDEE3456H3Z3',
        panNumber: 'CCDEE3456H',
      },
      {
        supplierCode: 'SUP-VPM-004',
        name: 'Display Solutions Ltd',
        contactPerson: 'Venkatesh M',
        email: 'venkat@displaysol.com',
        phone: '+91 9876500004',
        address: 'No.234, Parry\'s Corner, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        gstNumber: '33DDEEF4567I4Z4',
        panNumber: 'DDEEF4567I',
      },
      {
        supplierCode: 'SUP-VPM-005',
        name: 'Battery World Distributors',
        contactPerson: 'Karthik Raja',
        email: 'karthik@batteryworld.com',
        phone: '+91 9876500005',
        address: 'No.567, Anna Salai, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600002',
        gstNumber: '33EEFFG5678J5Z5',
        panNumber: 'EEFFG5678J',
      },
    ];

    let suppliersCreated = 0;
    for (const supplier of suppliers) {
      const existing = await prisma.supplier.findFirst({
        where: { supplierCode: supplier.supplierCode, companyId: company.id },
      });
      if (!existing) {
        await prisma.supplier.create({
          data: { ...supplier, companyId: company.id, active: true },
        });
        suppliersCreated++;
      }
    }
    console.log(`   ✅ Created: ${suppliersCreated}, ⏭️  Skipped: ${suppliers.length - suppliersCreated}\n`);
    totalCreated += suppliersCreated;
    totalSkipped += (suppliers.length - suppliersCreated);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('═'.repeat(50));
    console.log('📊 Master Data Seeding Summary:');
    console.log('═'.repeat(50));
    console.log(`   ✅ Total Items Created: ${totalCreated}`);
    console.log(`   ⏭️  Total Items Skipped: ${totalSkipped}`);
    console.log('');
    console.log('   📱 Brands: Check');
    console.log('   🔧 Device Conditions: Check');
    console.log('   🔨 Service Categories: Check');
    console.log('   💰 Expense Categories: Check');
    console.log('   🏭 Suppliers: Check');
    console.log('═'.repeat(50));
    console.log('');

  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    await seedAllMasterData();
    console.log('🎉 All master data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding master data:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
