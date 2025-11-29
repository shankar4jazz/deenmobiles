# Migration Scripts

This directory contains data migration scripts for the DeenMobiles application.

## Inventory to Items Migration

**Script:** `migrateInventoryToItems.ts`

### Purpose

Converts the legacy `Inventory` model (which mixed item definitions with branch-specific stock) into the new two-table structure:
- **Item**: Company-level product catalog (shared across branches)
- **BranchInventory**: Branch-specific stock quantities and settings

### What It Does

1. **Groups Inventory Records**: Identifies unique items by partName, brandName, and modelVariant
2. **Creates Items**: Generates company-level catalog entries with unique item codes (e.g., "DEE-ITM-0001")
3. **Creates BranchInventories**: Links items to branches with their specific stock quantities
4. **Updates Relations**: Updates StockMovement and PurchaseOrderItem records to reference the new tables

### How to Run

```bash
# From the backend directory
cd backend

# Run the migration script
npx ts-node src/scripts/migrateInventoryToItems.ts
```

### Before Running

1. **Backup your database** - This script modifies data
2. **Test in development first** - Verify the migration works correctly
3. **Review the code** - Understand what changes will be made

### After Running

1. **Verify Data**: Check the migrated data in Prisma Studio or your application
2. **Test Functionality**: Ensure Items and BranchInventory work correctly
3. **Update Frontend**: Switch your UI to use the new endpoints:
   - `/api/v1/items` - Item catalog management
   - `/api/v1/branch-inventory` - Branch stock management

### Migration Statistics

The script provides detailed statistics on:
- Number of inventory records processed
- Items created
- Branch inventories created
- Stock movements updated
- Purchase order items updated
- Any errors encountered

### Safety Features

- **Idempotent**: Can be run multiple times (warns if Items already exist)
- **Error Handling**: Continues processing even if individual records fail
- **Detailed Logging**: Shows progress and issues during migration
- **Statistics**: Provides complete summary of all changes made

### Troubleshooting

**If migration fails:**
1. Check the error messages in the console output
2. Verify your database connection
3. Ensure all required fields have valid data
4. Check for foreign key constraint violations

**If you need to rollback:**
```sql
-- WARNING: This will delete all migrated data
DELETE FROM "stock_movements" WHERE "branchInventoryId" IS NOT NULL;
DELETE FROM "purchase_order_items" WHERE "itemId" IS NOT NULL;
DELETE FROM "branch_inventories";
DELETE FROM "items";
```

### Notes

- Old `Inventory` records are **not deleted** - they remain for reference
- The script groups items intelligently to avoid duplicates
- Item codes are auto-generated based on company name prefix
- All prices and quantities are preserved during migration
