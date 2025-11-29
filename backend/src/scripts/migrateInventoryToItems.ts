import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  inventoryRecordsProcessed: number;
  itemsCreated: number;
  branchInventoriesCreated: number;
  stockMovementsUpdated: number;
  purchaseOrderItemsUpdated: number;
  errors: string[];
}

/**
 * Migration Script: Convert Inventory records to Item + BranchInventory structure
 *
 * This script:
 * 1. Groups existing Inventory records by unique item characteristics (partName, brandName, etc.)
 * 2. Creates Item records for unique items (company-level catalog)
 * 3. Creates BranchInventory records for each original Inventory record
 * 4. Updates StockMovement records to reference BranchInventory
 * 5. Updates PurchaseOrderItem records to reference Item
 *
 * Run with: npx ts-node src/scripts/migrateInventoryToItems.ts
 */

async function migrateInventoryToItems(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    inventoryRecordsProcessed: 0,
    itemsCreated: 0,
    branchInventoriesCreated: 0,
    stockMovementsUpdated: 0,
    purchaseOrderItemsUpdated: 0,
    errors: [],
  };

  console.log('🚀 Starting migration: Inventory → Item + BranchInventory');
  console.log('='.repeat(60));

  try {
    // Step 1: Check if Items already exist
    const existingItemsCount = await prisma.item.count();
    if (existingItemsCount > 0) {
      console.log(`⚠️  Warning: ${existingItemsCount} Items already exist.`);
      console.log('   Migration may have been run before. Continue? (CTRL+C to cancel)');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Step 2: Fetch all Inventory records
    console.log('\n📦 Fetching Inventory records...');
    const inventories = await prisma.inventory.findMany({
      include: {
        company: true,
        branch: true,
        supplier: true,
      },
    });

    console.log(`   Found ${inventories.length} inventory records`);
    stats.inventoryRecordsProcessed = inventories.length;

    if (inventories.length === 0) {
      console.log('✅ No inventory records to migrate. Exiting.');
      return stats;
    }

    // Step 3: Group inventories by unique item characteristics
    console.log('\n🔍 Grouping inventories by unique items...');
    const itemGroups = new Map<string, typeof inventories>();

    inventories.forEach((inv) => {
      // Create a unique key based on item characteristics
      const key = [
        inv.partName.toLowerCase().trim(),
        inv.brandName?.toLowerCase().trim() || 'no-brand',
        inv.modelVariant?.toLowerCase().trim() || 'no-variant',
        inv.companyId,
      ].join('::');

      if (!itemGroups.has(key)) {
        itemGroups.set(key, []);
      }
      itemGroups.get(key)!.push(inv);
    });

    console.log(`   Identified ${itemGroups.size} unique items`);

    // Step 4: Create Items and BranchInventories
    console.log('\n📝 Creating Items and BranchInventories...');

    for (const [key, groupInventories] of itemGroups.entries()) {
      try {
        const firstInv = groupInventories[0];

        // Create Item (company-level catalog entry)
        const itemCode = await generateItemCode(firstInv.companyId);

        const item = await prisma.item.create({
          data: {
            itemCode,
            itemName: firstInv.partName,
            description: firstInv.description,
            modelVariant: firstInv.modelVariant,
            brandId: firstInv.brandId,
            modelId: firstInv.modelId,
            categoryId: firstInv.categoryId,
            unitId: firstInv.unitId,
            purchasePrice: firstInv.purchasePrice,
            salesPrice: firstInv.salesPrice,
            hsnCode: firstInv.hsnCode,
            gstRateId: firstInv.gstRateId,
            taxType: firstInv.taxType,
            companyId: firstInv.companyId,
          },
        });

        stats.itemsCreated++;
        console.log(`   ✓ Created Item: ${item.itemName} (${item.itemCode})`);

        // Create BranchInventory records for each branch
        for (const inv of groupInventories) {
          const branchInventory = await prisma.branchInventory.create({
            data: {
              itemId: item.id,
              branchId: inv.branchId,
              companyId: inv.companyId,
              stockQuantity: inv.stockQuantity,
              minStockLevel: inv.minStockLevel,
              maxStockLevel: inv.maxStockLevel,
              reorderLevel: inv.reorderLevel,
              supplierId: inv.supplierId,
              lastPurchasePrice: inv.purchasePrice,
              lastPurchaseDate: inv.purchaseDate,
            },
          });

          stats.branchInventoriesCreated++;
          console.log(`     ✓ Created BranchInventory for branch: ${inv.branch?.name || inv.branchId}`);

          // Update StockMovement records
          const updatedMovements = await prisma.stockMovement.updateMany({
            where: { inventoryId: inv.id },
            data: {
              branchInventoryId: branchInventory.id,
            },
          });

          stats.stockMovementsUpdated += updatedMovements.count;

          // Update PurchaseOrderItem records
          const updatedPoItems = await prisma.purchaseOrderItem.updateMany({
            where: { inventoryId: inv.id },
            data: {
              itemId: item.id,
            },
          });

          stats.purchaseOrderItemsUpdated += updatedPoItems.count;
        }
      } catch (error) {
        const errorMsg = `Failed to migrate group ${key}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`   ✗ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed!');
    console.log('📊 Statistics:');
    console.log(`   - Inventory records processed: ${stats.inventoryRecordsProcessed}`);
    console.log(`   - Items created: ${stats.itemsCreated}`);
    console.log(`   - Branch inventories created: ${stats.branchInventoriesCreated}`);
    console.log(`   - Stock movements updated: ${stats.stockMovementsUpdated}`);
    console.log(`   - Purchase order items updated: ${stats.purchaseOrderItemsUpdated}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
      stats.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`);
      });
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. Verify the migrated data in Prisma Studio or your application');
    console.log('   2. Test the new Items and BranchInventory functionality');
    console.log('   3. Once verified, you can optionally archive old Inventory records');
    console.log('   4. Update your application to use the new structure');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    stats.errors.push(error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

/**
 * Generate a unique item code
 */
async function generateItemCode(companyId: string): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  // Generate prefix from company name (first 3 letters, uppercase)
  const companyPrefix = company.name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, '');

  // Count existing items for this company
  const count = await prisma.item.count({
    where: { companyId },
  });

  // Generate item number with padding
  const itemNumber = (count + 1).toString().padStart(4, '0');

  return `${companyPrefix}-ITM-${itemNumber}`;
}

// Run migration
if (require.main === module) {
  migrateInventoryToItems()
    .then((stats) => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateInventoryToItems };
