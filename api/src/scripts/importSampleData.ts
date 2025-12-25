import { PrismaClient, UserRole, PurchaseOrderStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function to generate random Indian mobile numbers
function generatePhoneNumber(): string {
  const prefixes = ['98', '99', '97', '96', '95', '94', '93', '92', '91', '90'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(10000000 + Math.random() * 90000000);
  return `+91 ${prefix}${number.toString().substring(0, 8)}`;
}

// Sample Indian names for customers and employees
const firstNames = {
  male: ['Rajesh', 'Suresh', 'Ramesh', 'Vijay', 'Arun', 'Kumar', 'Prakash', 'Mahesh', 'Dinesh', 'Ganesh', 'Sanjay', 'Ravi', 'Karthik', 'Anand', 'Ashok'],
  female: ['Priya', 'Lakshmi', 'Kavitha', 'Deepa', 'Sangeetha', 'Radhika', 'Divya', 'Meena', 'Sudha', 'Rekha', 'Anitha', 'Shanti', 'Usha', 'Vani', 'Saranya']
};

const lastNames = ['Kumar', 'Raj', 'Babu', 'Murugan', 'Selvam', 'Pandian', 'Rajan', 'Kannan', 'Moorthy', 'Samy', 'Naidu', 'Reddy', 'Venkat', 'Krishnan', 'Sundar'];

function generateName(gender: 'male' | 'female' = Math.random() > 0.5 ? 'male' : 'female'): string {
  const firstName = firstNames[gender][Math.floor(Math.random() * firstNames[gender].length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

function generateEmail(name: string): string {
  const emailName = name.toLowerCase().replace(' ', '.');
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${emailName}${Math.floor(Math.random() * 1000)}@${domain}`;
}

// Tamil Nadu cities/towns near Villupuram
const cities = ['Villupuram', 'Tindivanam', 'Gingee', 'Tirukovilure', 'Vikravandi', 'Kandachipuram', 'Marakkanam', 'Pondicherry'];
const streetNames = ['Main Road', 'Bazaar Street', 'Gandhi Road', 'Nehru Street', 'Anna Salai', 'Kamaraj Road', 'Bazaar Street', 'Hospital Road', 'Station Road', 'Market Street'];

function generateAddress(): string {
  const doorNo = Math.floor(1 + Math.random() * 999);
  const street = streetNames[Math.floor(Math.random() * streetNames.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const pincode = Math.floor(604000 + Math.random() * 10000);
  return `No ${doorNo}, ${street}, ${city} ${pincode}`;
}

async function importSampleData() {
  try {
    console.log('🚀 Starting sample data import for all branches...\n');

    // Get company
    const company = await prisma.company.findFirst();
    if (!company) {
      console.error('❌ No company found. Please run seed script first.');
      return;
    }
    console.log(`✅ Found company: ${company.name}\n`);

    // Get all branches
    const branches = await prisma.branch.findMany({
      where: { companyId: company.id },
      orderBy: { code: 'asc' }
    });

    if (branches.length === 0) {
      console.error('❌ No branches found. Please run setupBranches script first.');
      return;
    }
    console.log(`✅ Found ${branches.length} branches: ${branches.map(b => b.code).join(', ')}\n`);

    // Get master data
    const itemCategories = await prisma.itemCategory.findMany({ where: { companyId: company.id } });
    const itemUnits = await prisma.itemUnit.findMany({ where: { companyId: company.id } });
    const gstRates = await prisma.itemGSTRate.findMany({ where: { companyId: company.id } });
    const paymentMethods = await prisma.paymentMethod.findMany({ where: { companyId: company.id } });
    const roles = await prisma.role.findMany({ where: { isSystemRole: true } });

    console.log('✅ Loaded master data\n');

    // Create Expense Categories if they don't exist
    console.log('📂 Creating expense categories...');
    const expenseCategoryData = [
      { name: 'Rent', code: 'RENT', description: 'Monthly rent payments' },
      { name: 'Utilities', code: 'UTILITIES', description: 'Electricity, water, internet bills' },
      { name: 'Salaries', code: 'SALARIES', description: 'Employee salary payments' },
      { name: 'Transportation', code: 'TRANSPORT', description: 'Vehicle fuel and maintenance' },
      { name: 'Office Supplies', code: 'OFFICE_SUPPLIES', description: 'Stationery and office items' },
      { name: 'Maintenance', code: 'MAINTENANCE', description: 'Building and equipment maintenance' },
      { name: 'Marketing', code: 'MARKETING', description: 'Advertising and promotional expenses' },
      { name: 'Miscellaneous', code: 'MISC', description: 'Other miscellaneous expenses' },
    ];

    const expenseCategories = [];
    for (const catData of expenseCategoryData) {
      const existing = await prisma.expenseCategory.findFirst({
        where: { code: catData.code, companyId: company.id }
      });
      if (!existing) {
        const cat = await prisma.expenseCategory.create({
          data: { ...catData, companyId: company.id }
        });
        expenseCategories.push(cat);
      } else {
        expenseCategories.push(existing);
      }
    }
    console.log(`✅ Created/verified ${expenseCategories.length} expense categories\n`);

    // Create Employees for each branch
    console.log('👥 Creating employees...');
    const hashedPassword = await bcrypt.hash('Employee@123', 10);
    const technicianRole = roles.find(r => r.name === 'Technician');
    const receptionistRole = roles.find(r => r.name === 'Receptionist');

    let totalEmployees = 0;
    for (const branch of branches) {
      // Create 2-3 technicians per branch
      const numTechnicians = 2 + Math.floor(Math.random() * 2); // 2 or 3
      for (let i = 0; i < numTechnicians; i++) {
        const name = generateName('male');
        const email = generateEmail(name);
        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            phone: generatePhoneNumber(),
            role: UserRole.TECHNICIAN,
            roleId: technicianRole?.id,
            companyId: company.id,
            branchId: branch.id,
            isActive: true,
          },
        });
        totalEmployees++;
      }

      // Create 1-2 receptionists per branch
      const numReceptionists = 1 + Math.floor(Math.random() * 2); // 1 or 2
      for (let i = 0; i < numReceptionists; i++) {
        const name = generateName('female');
        const email = generateEmail(name);
        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            phone: generatePhoneNumber(),
            role: UserRole.RECEPTIONIST,
            roleId: receptionistRole?.id,
            companyId: company.id,
            branchId: branch.id,
            isActive: true,
          },
        });
        totalEmployees++;
      }

      console.log(`   ✓ Created employees for ${branch.name} (${branch.code})`);
    }
    console.log(`✅ Created ${totalEmployees} employees across all branches\n`);

    // Create Customers
    console.log('🧑‍🤝‍🧑 Creating customers...');
    let totalCustomers = 0;
    for (const branch of branches) {
      const numCustomers = 10 + Math.floor(Math.random() * 3); // 10-12 per branch
      for (let i = 0; i < numCustomers; i++) {
        const name = generateName();
        const hasEmail = Math.random() > 0.3; // 70% have email
        await prisma.customer.create({
          data: {
            name,
            email: hasEmail ? generateEmail(name) : null,
            phone: generatePhoneNumber(),
            address: generateAddress(),
            companyId: company.id,
            branchId: branch.id,
          },
        });
        totalCustomers++;
      }
      console.log(`   ✓ Created customers for ${branch.name} (${branch.code})`);
    }
    console.log(`✅ Created ${totalCustomers} customers across all branches\n`);

    // Create Suppliers
    console.log('🏪 Creating suppliers...');
    const supplierData = [
      {
        code: 'SUP-VPM-001',
        name: 'Mobile Parts Wholesale Villupuram',
        contactPerson: 'Rajesh Kumar',
        email: 'rajesh@mobilepartsvillupuram.com',
        phone: '+91 98765 43210',
        address: 'No 145, Display Market, Villupuram',
        city: 'Villupuram',
        gstNumber: '33ABCDE1234F1Z1',
        panNumber: 'ABCDE1234F',
      },
      {
        code: 'SUP-CHN-001',
        name: 'Chennai Electronics Hub',
        contactPerson: 'Priya Sharma',
        email: 'priya@chennaielectronics.com',
        phone: '+91 98765 43211',
        address: 'No 78, Ritchie Street, Chennai',
        city: 'Chennai',
        gstNumber: '33FGHIJ5678K2L2',
        panNumber: 'FGHIJ5678K',
      },
      {
        code: 'SUP-BLR-001',
        name: 'Bangalore Mobile Solutions',
        contactPerson: 'Suresh Babu',
        email: 'suresh@bangaloremobile.com',
        phone: '+91 98765 43212',
        address: 'Electronics Complex, SP Road, Bangalore',
        city: 'Bangalore',
        gstNumber: '29KLMNO9012P3Q3',
        panNumber: 'KLMNO9012P',
      },
      {
        code: 'SUP-CBE-001',
        name: 'Coimbatore Spare Parts Co',
        contactPerson: 'Anand Raj',
        email: 'anand@coimbatorespares.com',
        phone: '+91 98765 43213',
        address: 'No 234, RS Puram, Coimbatore',
        city: 'Coimbatore',
        gstNumber: '33PQRST3456U4V4',
        panNumber: 'PQRST3456U',
      },
      {
        code: 'SUP-MDU-001',
        name: 'Madurai Accessories Import',
        contactPerson: 'Karthik Venkat',
        email: 'karthik@maduraiaccessories.com',
        phone: '+91 98765 43214',
        address: 'Import Market, Madurai',
        city: 'Madurai',
        gstNumber: '33UVWXY7890Z5A5',
        panNumber: 'UVWXY7890Z',
      },
      {
        code: 'SUP-PDY-001',
        name: 'Pondicherry Mobile Distributors',
        contactPerson: 'Vijay Kumar',
        email: 'vijay@pondymobile.com',
        phone: '+91 98765 43215',
        address: 'No 56, MG Road, Pondicherry',
        city: 'Pondicherry',
        gstNumber: '34BCDEF2345G6H6',
        panNumber: 'BCDEF2345G',
      },
    ];

    const suppliers = [];
    for (const supData of supplierData) {
      const existing = await prisma.supplier.findFirst({
        where: { supplierCode: supData.code, companyId: company.id }
      });
      if (!existing) {
        const supplier = await prisma.supplier.create({
          data: {
            supplierCode: supData.code,
            name: supData.name,
            contactPerson: supData.contactPerson,
            email: supData.email,
            phone: supData.phone,
            address: supData.address,
            city: supData.city,
            state: 'Tamil Nadu',
            pincode: '600001',
            gstNumber: supData.gstNumber,
            panNumber: supData.panNumber,
            bankName: 'State Bank of India',
            accountNumber: `${Math.floor(10000000000 + Math.random() * 90000000000)}`,
            ifscCode: 'SBIN0001234',
            companyId: company.id,
          },
        });
        suppliers.push(supplier);
      } else {
        suppliers.push(existing);
      }
    }
    console.log(`✅ Created/verified ${suppliers.length} suppliers\n`);

    // Create Items (Company-level catalog)
    console.log('📦 Creating items...');
    const displayCategory = itemCategories.find(c => c.code === 'DISPLAY');
    const batteryCategory = itemCategories.find(c => c.code === 'BATTERY');
    const chargerCategory = itemCategories.find(c => c.code === 'CHARGER');
    const cableCategory = itemCategories.find(c => c.code === 'CABLE');
    const caseCategory = itemCategories.find(c => c.code === 'CASE_COVER');
    const protectorCategory = itemCategories.find(c => c.code === 'SCREEN_PROTECTOR');
    const audioCategory = itemCategories.find(c => c.code === 'AUDIO');
    const cameraCategory = itemCategories.find(c => c.code === 'CAMERA');

    const pieceUnit = itemUnits.find(u => u.code === 'PIECE');
    const gst18 = gstRates.find(g => parseFloat(g.rate.toString()) === 18);
    const gst12 = gstRates.find(g => parseFloat(g.rate.toString()) === 12);

    const itemsData = [
      // Displays
      { name: 'iPhone 13 Display Assembly', code: 'DSP-IPH13-001', category: displayCategory?.id, price: 12000, cost: 8500, gst: gst18?.id },
      { name: 'iPhone 12 Display Assembly', code: 'DSP-IPH12-001', category: displayCategory?.id, price: 10000, cost: 7200, gst: gst18?.id },
      { name: 'Samsung A52 Display', code: 'DSP-SAM-A52-001', category: displayCategory?.id, price: 4500, cost: 3200, gst: gst18?.id },
      { name: 'Samsung A32 Display', code: 'DSP-SAM-A32-001', category: displayCategory?.id, price: 3500, cost: 2500, gst: gst18?.id },
      { name: 'Redmi Note 10 Pro Display', code: 'DSP-RDM-N10P-001', category: displayCategory?.id, price: 3800, cost: 2700, gst: gst18?.id },
      { name: 'Oppo F19 Display', code: 'DSP-OPP-F19-001', category: displayCategory?.id, price: 3200, cost: 2300, gst: gst18?.id },
      { name: 'Vivo Y21 Display', code: 'DSP-VIV-Y21-001', category: displayCategory?.id, price: 2800, cost: 2000, gst: gst18?.id },

      // Batteries
      { name: 'iPhone 13 Battery', code: 'BAT-IPH13-001', category: batteryCategory?.id, price: 2500, cost: 1800, gst: gst18?.id },
      { name: 'iPhone 12 Battery', code: 'BAT-IPH12-001', category: batteryCategory?.id, price: 2000, cost: 1400, gst: gst18?.id },
      { name: 'Samsung A52 Battery', code: 'BAT-SAM-A52-001', category: batteryCategory?.id, price: 900, cost: 650, gst: gst18?.id },
      { name: 'Redmi Note 10 Battery', code: 'BAT-RDM-N10-001', category: batteryCategory?.id, price: 800, cost: 550, gst: gst18?.id },
      { name: 'Realme C25 Battery', code: 'BAT-RLM-C25-001', category: batteryCategory?.id, price: 700, cost: 500, gst: gst18?.id },

      // Chargers and Cables
      { name: 'USB-C 20W Fast Charger', code: 'CHG-USBC-20W-001', category: chargerCategory?.id, price: 350, cost: 200, gst: gst18?.id },
      { name: 'iPhone Lightning Charger 18W', code: 'CHG-LIGHT-18W-001', category: chargerCategory?.id, price: 450, cost: 280, gst: gst18?.id },
      { name: 'Samsung 25W Charger', code: 'CHG-SAM-25W-001', category: chargerCategory?.id, price: 400, cost: 250, gst: gst18?.id },
      { name: 'Lightning Cable 1M', code: 'CBL-LIGHT-1M-001', category: cableCategory?.id, price: 300, cost: 180, gst: gst18?.id },
      { name: 'USB-C Cable 1M', code: 'CBL-USBC-1M-001', category: cableCategory?.id, price: 200, cost: 120, gst: gst18?.id },

      // Cases and Protectors
      { name: 'iPhone 13 Silicone Case', code: 'CASE-IPH13-SIL-001', category: caseCategory?.id, price: 250, cost: 130, gst: gst12?.id },
      { name: 'Samsung A52 Clear Case', code: 'CASE-SAM-A52-CLR-001', category: caseCategory?.id, price: 180, cost: 100, gst: gst12?.id },
      { name: 'Universal Tempered Glass', code: 'PROT-TEMP-UNI-001', category: protectorCategory?.id, price: 100, cost: 40, gst: gst18?.id },
      { name: 'iPhone 13 Tempered Glass', code: 'PROT-IPH13-TEMP-001', category: protectorCategory?.id, price: 150, cost: 60, gst: gst18?.id },

      // Audio
      { name: 'iPhone Earpiece Speaker', code: 'AUD-IPH-SPEAK-001', category: audioCategory?.id, price: 400, cost: 250, gst: gst18?.id },
      { name: 'Wired Earphones with Mic', code: 'AUD-EARPOD-001', category: audioCategory?.id, price: 150, cost: 80, gst: gst12?.id },

      // Camera
      { name: 'Samsung Rear Camera Module', code: 'CAM-SAM-REAR-001', category: cameraCategory?.id, price: 2500, cost: 1700, gst: gst18?.id },
    ];

    const items = [];
    for (const itemData of itemsData) {
      const existing = await prisma.item.findFirst({
        where: { itemCode: itemData.code, companyId: company.id }
      });
      if (!existing) {
        const item = await prisma.item.create({
          data: {
            itemName: itemData.name,
            itemCode: itemData.code,
            description: itemData.name,
            categoryId: itemData.category!,
            unitId: pieceUnit!.id,
            purchasePrice: itemData.cost,
            salesPrice: itemData.price,
            gstRateId: itemData.gst!,
            hsnCode: '85177000',
            companyId: company.id,
          },
        });
        items.push(item);
      } else {
        items.push(existing);
      }
    }
    console.log(`✅ Created/verified ${items.length} items\n`);

    // Create Branch Inventory
    console.log('📊 Creating branch inventory...');
    let totalStockRecords = 0;
    for (const branch of branches) {
      // VPM gets more stock as main branch
      const stockMultiplier = branch.code === 'VPM' ? 1.5 : 1.0;

      for (const item of items) {
        const baseQuantity = Math.floor(5 + Math.random() * 20);
        const quantity = Math.floor(baseQuantity * stockMultiplier);

        const existing = await prisma.branchInventory.findFirst({
          where: { itemId: item.id, branchId: branch.id }
        });

        if (!existing) {
          await prisma.branchInventory.create({
            data: {
              itemId: item.id,
              branchId: branch.id,
              companyId: company.id,
              stockQuantity: quantity,
              minStockLevel: Math.floor(quantity * 0.2),
              maxStockLevel: Math.floor(quantity * 3),
              reorderLevel: Math.floor(quantity * 0.3),
            },
          });
          totalStockRecords++;
        }
      }
      console.log(`   ✓ Created inventory for ${branch.name} (${branch.code})`);
    }
    console.log(`✅ Created ${totalStockRecords} branch inventory records\n`);

    // Create Purchase Orders
    console.log('🛒 Creating purchase orders...');
    let totalPurchaseOrders = 0;
    const statuses: PurchaseOrderStatus[] = ['COMPLETED', 'COMPLETED', 'PENDING'];

    for (const branch of branches) {
      const numOrders = 2 + Math.floor(Math.random() * 2); // 2-3 per branch

      for (let i = 0; i < numOrders; i++) {
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        const status = statuses[i % statuses.length];
        const orderDate = new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000); // Random date in last 60 days

        // Select 3-6 random items for this order
        const numItems = 3 + Math.floor(Math.random() * 4);
        const orderItems = [];
        const usedItems = new Set();

        while (orderItems.length < numItems) {
          const item = items[Math.floor(Math.random() * items.length)];
          if (!usedItems.has(item.id)) {
            usedItems.add(item.id);
            const quantity = 5 + Math.floor(Math.random() * 15);
            const unitPrice = parseFloat((item.purchasePrice || 0).toString());
            const lineTotal = quantity * unitPrice;
            const taxRate = 18; // 18% GST
            const taxAmount = lineTotal * (taxRate / 100);
            const totalAmount = lineTotal + taxAmount;

            orderItems.push({
              itemId: item.id,
              quantity,
              unitPrice,
              taxRate,
              taxAmount,
              totalAmount,
            });
          }
        }

        const totalAmount = orderItems.reduce((sum, item) => sum + item.totalAmount, 0);
        const taxAmount = orderItems.reduce((sum, item) => sum + item.taxAmount, 0);
        const grandTotal = totalAmount;

        const poNumber = `PO-${branch.code}-${new Date().getFullYear()}-${String(totalPurchaseOrders + 1).padStart(4, '0')}`;

        const users = await prisma.user.findMany({ where: { branchId: branch.id } });
        const createdBy = users[0];

        const po = await prisma.purchaseOrder.create({
          data: {
            poNumber,
            supplierId: supplier.id,
            branchId: branch.id,
            companyId: company.id,
            orderDate,
            expectedDelivery: status === 'COMPLETED' ? orderDate : new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            status,
            totalAmount: totalAmount - taxAmount,
            taxAmount,
            grandTotal,
            createdBy: createdBy.id,
            items: {
              create: orderItems,
            },
          },
        });

        totalPurchaseOrders++;

        // Create supplier payment for completed orders
        if (status === 'COMPLETED' && paymentMethods.length > 0) {
          const paymentMethod = paymentMethods[Math.floor(Math.random() * Math.min(4, paymentMethods.length))];
          await prisma.supplierPayment.create({
            data: {
              purchaseOrderId: po.id,
              supplierId: supplier.id,
              branchId: branch.id,
              companyId: company.id,
              amount: grandTotal,
              paymentDate: new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000),
              paymentMethodId: paymentMethod.id,
              referenceNumber: `REF-${Date.now()}`,
              createdBy: createdBy.id,
            },
          });
        }
      }
      console.log(`   ✓ Created purchase orders for ${branch.name} (${branch.code})`);
    }
    console.log(`✅ Created ${totalPurchaseOrders} purchase orders with payments\n`);

    // Create Expenses
    console.log('💰 Creating expenses...');
    let totalExpenses = 0;

    for (const branch of branches) {
      const users = await prisma.user.findMany({ where: { branchId: branch.id } });
      const recordedBy = users[0];

      const numExpenses = 6 + Math.floor(Math.random() * 3); // 6-8 per branch

      for (let i = 0; i < numExpenses; i++) {
        const category = expenseCategories[i % expenseCategories.length];
        const expenseDate = new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000); // Random date in last 90 days

        let amount = 1000;
        let description = '';

        // Generate realistic amounts based on category
        switch (category.code) {
          case 'RENT':
            amount = 15000 + Math.floor(Math.random() * 10000);
            description = `Monthly rent for ${expenseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
            break;
          case 'UTILITIES':
            amount = 2000 + Math.floor(Math.random() * 3000);
            description = `Electricity and water bill - ${expenseDate.toLocaleDateString('en-US', { month: 'short' })}`;
            break;
          case 'SALARIES':
            amount = 50000 + Math.floor(Math.random() * 50000);
            description = `Staff salaries for ${expenseDate.toLocaleDateString('en-US', { month: 'long' })}`;
            break;
          case 'TRANSPORT':
            amount = 500 + Math.floor(Math.random() * 2000);
            description = 'Fuel and vehicle maintenance';
            break;
          case 'OFFICE_SUPPLIES':
            amount = 500 + Math.floor(Math.random() * 1500);
            description = 'Stationery and office supplies';
            break;
          case 'MAINTENANCE':
            amount = 2000 + Math.floor(Math.random() * 5000);
            description = 'Shop maintenance and repairs';
            break;
          case 'MARKETING':
            amount = 3000 + Math.floor(Math.random() * 7000);
            description = 'Local advertising and promotions';
            break;
          default:
            amount = 1000 + Math.floor(Math.random() * 3000);
            description = 'Miscellaneous expenses';
        }

        await prisma.expense.create({
          data: {
            expenseNumber: `EXP-${branch.code}-${new Date().getFullYear()}-${String(totalExpenses + 1).padStart(4, '0')}`,
            categoryId: category.id,
            amount,
            expenseDate,
            description,
            branchId: branch.id,
            companyId: company.id,
            recordedBy: recordedBy.id,
          },
        });
        totalExpenses++;
      }
      console.log(`   ✓ Created expenses for ${branch.name} (${branch.code})`);
    }
    console.log(`✅ Created ${totalExpenses} expense records\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Sample data import completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • Employees: ${totalEmployees}`);
    console.log(`   • Customers: ${totalCustomers}`);
    console.log(`   • Suppliers: ${suppliers.length}`);
    console.log(`   • Items: ${items.length}`);
    console.log(`   • Branch Inventory Records: ${totalStockRecords}`);
    console.log(`   • Purchase Orders: ${totalPurchaseOrders}`);
    console.log(`   • Expenses: ${totalExpenses}`);
    console.log(`   • Expense Categories: ${expenseCategories.length}`);
    console.log('\n🔐 All employees can login with their email and password: Employee@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error importing sample data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importSampleData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
