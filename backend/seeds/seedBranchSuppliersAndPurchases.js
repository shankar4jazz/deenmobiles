const { PrismaClient, PurchaseOrderStatus } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper to generate random date within last 90 days
const randomPastDate = (days = 90) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date;
};

// Helper to generate random future date within next 30 days
const randomFutureDate = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * days));
  return date;
};

// Branch-specific suppliers
const branchSuppliers = {
  'VPM': [
    {
      supplierCode: 'VPM-SUP-001',
      name: 'Villupuram Mobile Distributors',
      contactPerson: 'Kumar S',
      email: 'kumar@vpmobile.com',
      phone: '+91 9994447010',
      address: 'No 234, Bazaar Street, Villupuram',
      city: 'Villupuram',
      state: 'Tamil Nadu',
      pincode: '605602',
      gstNumber: '33VPMAA1234F1Z1',
      panNumber: 'VPMAA1234F',
    },
    {
      supplierCode: 'VPM-SUP-002',
      name: 'Villupuram Parts Wholesale',
      contactPerson: 'Ravi Kumar',
      email: 'ravi@vpmparts.com',
      phone: '+91 9994447011',
      address: 'No 567, Gandhi Road, Villupuram',
      city: 'Villupuram',
      state: 'Tamil Nadu',
      pincode: '605602',
      gstNumber: '33VPMBB2345G2Z2',
      panNumber: 'VPMBB2345G',
    },
  ],
  'TKV': [
    {
      supplierCode: 'TKV-SUP-001',
      name: 'Tirukovilure Mobile Mart',
      contactPerson: 'Selvam M',
      email: 'selvam@tkvmobile.com',
      phone: '+91 82208 87750',
      address: 'No 45, Main Road, Tirukovilure',
      city: 'Tirukovilure',
      state: 'Tamil Nadu',
      pincode: '605757',
      gstNumber: '33TKVAA3456H3Z3',
      panNumber: 'TKVAA3456H',
    },
  ],
  'GNG': [
    {
      supplierCode: 'GNG-SUP-001',
      name: 'Gingee Electronics Suppliers',
      contactPerson: 'Murugan K',
      email: 'murugan@gngelec.com',
      phone: '+91 90432 16880',
      address: 'No 78, Fort Road, Gingee',
      city: 'Gingee',
      state: 'Tamil Nadu',
      pincode: '604202',
      gstNumber: '33GNGAA4567I4Z4',
      panNumber: 'GNGAA4567I',
    },
  ],
  'TND': [
    {
      supplierCode: 'TND-SUP-001',
      name: 'Tindivanam Mobile World',
      contactPerson: 'Karthik R',
      email: 'karthik@tndmobile.com',
      phone: '+91 91502 79615',
      address: 'No 123, Bazaar Street, Tindivanam',
      city: 'Tindivanam',
      state: 'Tamil Nadu',
      pincode: '604001',
      gstNumber: '33TNDAA5678J5Z5',
      panNumber: 'TNDAA5678J',
    },
  ],
};

async function seedBranchSuppliersAndPurchases() {
  console.log('🏭 Seeding Branch Suppliers and Purchase Orders...\n');

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

    // Get super admin user for createdBy
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', companyId: company.id },
    });

    if (!superAdmin) {
      throw new Error('Super admin user not found.');
    }

    console.log(`✅ Found ${branches.length} branches\n`);

    let suppliersCreated = 0;
    let purchaseOrdersCreated = 0;

    // ============================================
    // 1. CREATE BRANCH-SPECIFIC SUPPLIERS
    // ============================================
    console.log('🏪 Creating branch-specific suppliers...\n');

    for (const branch of branches) {
      const suppliers = branchSuppliers[branch.code] || [];

      if (suppliers.length === 0) continue;

      console.log(`📍 ${branch.name} (${branch.code})`);

      for (const supplierData of suppliers) {
        try {
          const existing = await prisma.supplier.findFirst({
            where: { supplierCode: supplierData.supplierCode, companyId: company.id },
          });

          if (!existing) {
            await prisma.supplier.create({
              data: {
                ...supplierData,
                companyId: company.id,
                branchId: branch.id,
                active: true,
              },
            });
            console.log(`   ✅ ${supplierData.name}`);
            suppliersCreated++;
          } else {
            console.log(`   ⏭️  ${supplierData.name} (exists)`);
          }
        } catch (error) {
          console.log(`   ❌ ${supplierData.name}: ${error.message}`);
        }
      }
      console.log('');
    }

    // ============================================
    // 2. CREATE PURCHASE ORDERS
    // ============================================
    console.log('\n📦 Creating purchase orders...\n');

    for (const branch of branches) {
      console.log(`📍 Creating POs for ${branch.name} (${branch.code})...`);

      // Get suppliers for this branch and company suppliers
      const suppliers = await prisma.supplier.findMany({
        where: {
          companyId: company.id,
          OR: [
            { branchId: branch.id },
            { branchId: null },
          ],
          active: true,
        },
      });

      if (suppliers.length === 0) {
        console.log(`   ⚠️  No suppliers found for this branch\n`);
        continue;
      }

      // Get inventory items for this branch
      const inventoryItems = await prisma.inventory.findMany({
        where: {
          branchId: branch.id,
          companyId: company.id,
          active: true,
        },
        take: 10, // Use first 10 items
      });

      if (inventoryItems.length === 0) {
        console.log(`   ⚠️  No inventory items found for this branch\n`);
        continue;
      }

      // Create 2-3 purchase orders for each branch
      const numPOs = Math.floor(Math.random() * 2) + 2; // 2-3 POs

      for (let i = 0; i < numPOs; i++) {
        try {
          // Random supplier
          const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];

          // Generate PO number
          const poNumber = `PO-${branch.code}-${Date.now()}-${i}`;

          // Random order date
          const orderDate = randomPastDate(30);

          // Expected delivery date (7-15 days after order)
          const expectedDelivery = new Date(orderDate);
          expectedDelivery.setDate(expectedDelivery.getDate() + Math.floor(Math.random() * 8) + 7);

          // Random status
          const statuses = [
            PurchaseOrderStatus.PENDING,
            PurchaseOrderStatus.RECEIVED,
            PurchaseOrderStatus.COMPLETED,
          ];
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          // Set delivery date if received or completed
          const deliveryDate = (status === PurchaseOrderStatus.RECEIVED || status === PurchaseOrderStatus.COMPLETED)
            ? new Date(orderDate.getTime() + (Math.floor(Math.random() * 10) + 5) * 24 * 60 * 60 * 1000)
            : null;

          // Select 2-5 random items
          const numItems = Math.floor(Math.random() * 4) + 2;
          const selectedItems = [];
          const usedIndexes = new Set();

          while (selectedItems.length < numItems && selectedItems.length < inventoryItems.length) {
            const idx = Math.floor(Math.random() * inventoryItems.length);
            if (!usedIndexes.has(idx)) {
              usedIndexes.add(idx);
              selectedItems.push(inventoryItems[idx]);
            }
          }

          // Calculate totals
          let totalAmount = 0;
          let taxAmount = 0;
          const poItems = [];

          for (const item of selectedItems) {
            const quantity = Math.floor(Math.random() * 10) + 5; // 5-15 units
            const unitPrice = parseFloat(item.purchasePrice || 0);
            const taxRate = 18; // 18% GST
            const itemTotal = quantity * unitPrice;
            const itemTax = (itemTotal * taxRate) / 100;

            totalAmount += itemTotal;
            taxAmount += itemTax;

            poItems.push({
              inventoryId: item.id,
              quantity: quantity,
              unitPrice: unitPrice,
              salesPrice: parseFloat(item.salesPrice || 0),
              taxRate: taxRate,
              taxAmount: itemTax,
              totalAmount: itemTotal + itemTax,
              receivedQty: status === PurchaseOrderStatus.RECEIVED || status === PurchaseOrderStatus.COMPLETED
                ? quantity
                : 0,
            });
          }

          const grandTotal = totalAmount + taxAmount;

          // Random paid amount
          let paidAmount = 0;
          if (status === PurchaseOrderStatus.COMPLETED) {
            paidAmount = grandTotal;
          } else if (status === PurchaseOrderStatus.RECEIVED) {
            paidAmount = Math.random() > 0.5 ? grandTotal : grandTotal * 0.5;
          }

          // Create purchase order with items
          const po = await prisma.purchaseOrder.create({
            data: {
              poNumber,
              supplierId: supplier.id,
              branchId: branch.id,
              companyId: company.id,
              orderDate,
              expectedDelivery,
              deliveryDate,
              totalAmount,
              taxAmount,
              grandTotal,
              paidAmount,
              status,
              invoiceNumber: status !== PurchaseOrderStatus.PENDING ? `INV-${poNumber}` : null,
              invoiceDate: deliveryDate,
              notes: `Purchase order for ${branch.name}`,
              createdBy: superAdmin.id,
              items: {
                create: poItems,
              },
            },
            include: {
              items: true,
            },
          });

          console.log(`   ✅ ${po.poNumber} - ${status} - ₹${grandTotal.toFixed(2)} (${po.items.length} items)`);
          purchaseOrdersCreated++;

        } catch (error) {
          console.log(`   ❌ Failed to create PO: ${error.message}`);
        }
      }
      console.log('');
    }

    console.log('═'.repeat(50));
    console.log('📊 Seeding Summary:');
    console.log('═'.repeat(50));
    console.log(`   🏭 Branch Suppliers Created: ${suppliersCreated}`);
    console.log(`   📦 Purchase Orders Created: ${purchaseOrdersCreated}`);
    console.log(`   🏪 Branches Processed: ${branches.length}`);
    console.log('═'.repeat(50));
    console.log('');

  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    await seedBranchSuppliersAndPurchases();
    console.log('🎉 Branch suppliers and purchase orders seeding completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
