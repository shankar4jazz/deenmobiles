import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function copyInventory() {
  const targetBranchId = 'a487f72f-13b9-4877-a57b-62cf7d508e03'; // Tirupattur
  
  // Get all items from Main Branch
  const mainBranchInventory = await prisma.branchInventory.findMany({
    where: { branchId: 'a2365d33-9f5a-4e1c-8564-b47e03a7c74b' },
    include: { item: true }
  });
  
  console.log(`Found ${mainBranchInventory.length} items in Main Branch`);
  console.log('Copying to Tirupattur branch...');
  
  for (const inv of mainBranchInventory) {
    // Check if item already exists in target branch
    const existing = await prisma.branchInventory.findFirst({
      where: { itemId: inv.itemId, branchId: targetBranchId }
    });
    
    if (!existing) {
      await prisma.branchInventory.create({
        data: {
          itemId: inv.itemId,
          branchId: targetBranchId,
          companyId: inv.companyId,
          stockQuantity: inv.stockQuantity,
          minStockLevel: inv.minStockLevel,
          maxStockLevel: inv.maxStockLevel,
          reorderLevel: inv.reorderLevel,
        }
      });
      console.log(`✓ Copied: ${inv.item.itemName}`);
    }
  }
  
  console.log('\nDone!');
  await prisma.$disconnect();
}

copyInventory().catch(console.error);
