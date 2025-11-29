import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('🔍 Verifying database data...\n');

    const company = await prisma.company.findFirst();
    console.log('Company:', company?.name || 'NOT FOUND');

    const branches = await prisma.branch.findMany();
    console.log(`\n📍 Branches (${branches.length}):`);
    branches.forEach(b => console.log(`   - ${b.name} (${b.code})`));

    const users = await prisma.user.count();
    console.log(`\n👥 Total Users: ${users}`);

    const customers = await prisma.customer.count();
    console.log(`🧑‍🤝‍🧑 Total Customers: ${customers}`);

    const suppliers = await prisma.supplier.count();
    console.log(`🏪 Total Suppliers: ${suppliers}`);

    const items = await prisma.item.count();
    console.log(`📦 Total Items: ${items}`);

    const branchInventory = await prisma.branchInventory.count();
    console.log(`📊 Total Branch Inventory Records: ${branchInventory}`);

    const purchaseOrders = await prisma.purchaseOrder.count();
    console.log(`🛒 Total Purchase Orders: ${purchaseOrders}`);

    const expenses = await prisma.expense.count();
    console.log(`💰 Total Expenses: ${expenses}`);

    // Show some sample customers per branch
    console.log('\n📋 Sample Customers per Branch:');
    for (const branch of branches) {
      const branchCustomers = await prisma.customer.findMany({
        where: { branchId: branch.id },
        take: 3,
        select: { name: true, phone: true }
      });
      console.log(`\n   ${branch.code}:`);
      branchCustomers.forEach(c => console.log(`      - ${c.name} (${c.phone})`));
    }

    // Show some sample items
    console.log('\n\n📦 Sample Items:');
    const sampleItems = await prisma.item.findMany({
      take: 5,
      select: { itemName: true, itemCode: true, salesPrice: true }
    });
    sampleItems.forEach(item => console.log(`   - ${item.itemName} (${item.itemCode}) - ₹${item.salesPrice}`));

    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
