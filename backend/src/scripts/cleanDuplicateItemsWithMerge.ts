import prisma from '../config/database';
import { Logger } from '../utils/logger';

/**
 * Clean up duplicate items in the database by merging their references
 * Keeps the oldest item for each duplicate name and merges all references
 */
async function cleanDuplicateItemsWithMerge() {
  try {
    console.log('Starting duplicate items cleanup with merge...\n');

    // Get all items grouped by name and companyId
    const allItems = await prisma.item.findMany({
      select: {
        id: true,
        itemName: true,
        itemCode: true,
        companyId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc', // Oldest first
      },
    });

    // Group items by name (case-insensitive) and companyId
    const itemGroups = new Map<string, typeof allItems>();

    for (const item of allItems) {
      const key = `${item.companyId}_${item.itemName.toLowerCase()}`;
      const existing = itemGroups.get(key) || [];
      existing.push(item);
      itemGroups.set(key, existing);
    }

    // Find duplicates
    const duplicateGroups = Array.from(itemGroups.values()).filter(
      (group) => group.length > 1
    );

    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicate items found!');
      return;
    }

    console.log(`Found ${duplicateGroups.length} sets of duplicate items:\n`);

    let totalMerged = 0;
    let totalDeleted = 0;

    // Process each group of duplicates
    for (const group of duplicateGroups) {
      const itemName = group[0].itemName;
      const toKeep = group[0]; // Keep the oldest (first) item
      const toMerge = group.slice(1); // Merge the rest

      console.log(`\n📝 Item: "${itemName}"`);
      console.log(`   Keeping: ${toKeep.itemCode} (ID: ${toKeep.id}, Created: ${toKeep.createdAt})`);
      console.log(`   Merging ${toMerge.length} duplicate(s):`);

      for (const item of toMerge) {
        console.log(`\n   Processing: ${item.itemCode} (ID: ${item.id}, Created: ${item.createdAt})`);

        try {
          // Start a transaction for each duplicate item
          await prisma.$transaction(async (tx) => {
            // 1. Check and update PurchaseOrderItems
            const purchaseOrderItems = await tx.purchaseOrderItem.findMany({
              where: { itemId: item.id },
            });

            if (purchaseOrderItems.length > 0) {
              console.log(`      - Updating ${purchaseOrderItems.length} purchase order item(s)`);
              await tx.purchaseOrderItem.updateMany({
                where: { itemId: item.id },
                data: { itemId: toKeep.id },
              });
            }

            // 2. Check and handle BranchInventory
            const branchInventories = await tx.branchInventory.findMany({
              where: { itemId: item.id },
              select: {
                id: true,
                branchId: true,
                stockQuantity: true,
                minStockLevel: true,
                maxStockLevel: true,
                reorderLevel: true,
              },
            });

            if (branchInventories.length > 0) {
              console.log(`      - Processing ${branchInventories.length} branch inventor(y/ies)`);

              for (const dupInventory of branchInventories) {
                // Check if the original item already has inventory for this branch
                const existingInventory = await tx.branchInventory.findFirst({
                  where: {
                    itemId: toKeep.id,
                    branchId: dupInventory.branchId,
                  },
                });

                if (existingInventory) {
                  // Merge quantities
                  const newQuantity = existingInventory.stockQuantity.plus(dupInventory.stockQuantity);
                  console.log(`        • Branch ${dupInventory.branchId}: Merging quantities (${existingInventory.stockQuantity} + ${dupInventory.stockQuantity} = ${newQuantity})`);

                  await tx.branchInventory.update({
                    where: { id: existingInventory.id },
                    data: { stockQuantity: newQuantity },
                  });

                  // Delete the duplicate inventory record
                  await tx.branchInventory.delete({
                    where: { id: dupInventory.id },
                  });
                } else {
                  // Just update the itemId to point to the original item
                  console.log(`        • Branch ${dupInventory.branchId}: Reassigning inventory to original item`);
                  await tx.branchInventory.update({
                    where: { id: dupInventory.id },
                    data: { itemId: toKeep.id },
                  });
                }
              }
            }

            // 3. Delete the duplicate item
            await tx.item.delete({
              where: { id: item.id },
            });

            console.log(`      ✅ Successfully merged and deleted`);
            totalMerged++;
            totalDeleted++;
          });
        } catch (error) {
          console.log(`      ❌ Error processing: ${error}`);
          console.error(error);
        }
      }
    }

    console.log(`\n\n✅ Cleanup complete!`);
    console.log(`   Total duplicate groups: ${duplicateGroups.length}`);
    console.log(`   Total items processed: ${duplicateGroups.reduce((sum, g) => sum + g.length - 1, 0)}`);
    console.log(`   Successfully merged: ${totalMerged}`);
    console.log(`   Successfully deleted: ${totalDeleted}`);
    console.log(`   Failed: ${duplicateGroups.reduce((sum, g) => sum + g.length - 1, 0) - totalDeleted}`);

  } catch (error) {
    Logger.error('Error cleaning duplicate items with merge', error);
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanDuplicateItemsWithMerge()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
