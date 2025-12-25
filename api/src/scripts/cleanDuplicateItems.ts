import prisma from '../config/database';
import { Logger } from '../utils/logger';

/**
 * Clean up duplicate items in the database
 * Keeps the oldest item for each duplicate name and deletes the rest
 */
async function cleanDuplicateItems() {
  try {
    console.log('Starting duplicate items cleanup...\n');

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

    let totalDeleted = 0;

    // Process each group of duplicates
    for (const group of duplicateGroups) {
      const itemName = group[0].itemName;
      const toKeep = group[0]; // Keep the oldest (first) item
      const toDelete = group.slice(1); // Delete the rest

      console.log(`📝 Item: "${itemName}"`);
      console.log(`   Keeping: ${toKeep.itemCode} (Created: ${toKeep.createdAt})`);
      console.log(`   Deleting ${toDelete.length} duplicate(s):`);

      for (const item of toDelete) {
        console.log(`   - ${item.itemCode} (Created: ${item.createdAt})`);

        try {
          // Check if item is used in purchase orders
          const purchaseOrderCount = await prisma.purchaseOrderItem.count({
            where: { itemId: item.id },
          });

          // Check if item is used in branch inventory
          const branchInventoryCount = await prisma.branchInventory.count({
            where: { itemId: item.id },
          });

          if (purchaseOrderCount > 0 || branchInventoryCount > 0) {
            console.log(`     ⚠️  Warning: Item is in use (PO: ${purchaseOrderCount}, Inventory: ${branchInventoryCount})`);
            console.log(`     Skipping deletion to maintain data integrity`);
            continue;
          }

          // Delete the duplicate item
          await prisma.item.delete({
            where: { id: item.id },
          });

          totalDeleted++;
          console.log(`     ✅ Deleted`);
        } catch (error) {
          console.log(`     ❌ Error deleting: ${error}`);
        }
      }
      console.log('');
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Total duplicates found: ${duplicateGroups.reduce((sum, g) => sum + g.length - 1, 0)}`);
    console.log(`   Successfully deleted: ${totalDeleted}`);
    console.log(`   Skipped (in use): ${duplicateGroups.reduce((sum, g) => sum + g.length - 1, 0) - totalDeleted}`);

  } catch (error) {
    Logger.error('Error cleaning duplicate items', error);
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanDuplicateItems()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
