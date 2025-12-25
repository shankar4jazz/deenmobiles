import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate entries...\n');

  // Check ItemBrand duplicates
  const brandDuplicates = await prisma.$queryRaw<any[]>`
    SELECT name, "companyId", COUNT(*) as count
    FROM item_brands
    GROUP BY name, "companyId"
    HAVING COUNT(*) > 1
  `;
  console.log('📦 ItemBrand duplicates:', brandDuplicates.length);
  if (brandDuplicates.length > 0) {
    console.log(brandDuplicates);
  }

  // Check ItemModel duplicates
  const modelDuplicates = await prisma.$queryRaw<any[]>`
    SELECT name, "brandId", "companyId", COUNT(*) as count
    FROM item_models
    GROUP BY name, "brandId", "companyId"
    HAVING COUNT(*) > 1
  `;
  console.log('📱 ItemModel duplicates:', modelDuplicates.length);
  if (modelDuplicates.length > 0) {
    console.log(modelDuplicates);
  }

  // Check ServiceCategory duplicates
  const serviceCategoryDuplicates = await prisma.$queryRaw<any[]>`
    SELECT name, "companyId", COUNT(*) as count
    FROM service_categories
    GROUP BY name, "companyId"
    HAVING COUNT(*) > 1
  `;
  console.log('🔧 ServiceCategory duplicates:', serviceCategoryDuplicates.length);
  if (serviceCategoryDuplicates.length > 0) {
    console.log(serviceCategoryDuplicates);
  }

  // Check ItemCategory duplicates
  const itemCategoryDuplicates = await prisma.$queryRaw<any[]>`
    SELECT name, "companyId", COUNT(*) as count
    FROM item_categories
    GROUP BY name, "companyId"
    HAVING COUNT(*) > 1
  `;
  console.log('📂 ItemCategory duplicates:', itemCategoryDuplicates.length);
  if (itemCategoryDuplicates.length > 0) {
    console.log(itemCategoryDuplicates);
  }

  // Check DeviceCondition duplicates
  const deviceConditionDuplicates = await prisma.$queryRaw<any[]>`
    SELECT name, "companyId", COUNT(*) as count
    FROM device_conditions
    GROUP BY name, "companyId"
    HAVING COUNT(*) > 1
  `;
  console.log('📟 DeviceCondition duplicates:', deviceConditionDuplicates.length);
  if (deviceConditionDuplicates.length > 0) {
    console.log(deviceConditionDuplicates);
  }

  // Check ExpenseCategory duplicates
  const expenseCategoryDuplicates = await prisma.$queryRaw<any[]>`
    SELECT name, "companyId", COUNT(*) as count
    FROM expense_categories
    GROUP BY name, "companyId"
    HAVING COUNT(*) > 1
  `;
  console.log('💰 ExpenseCategory duplicates:', expenseCategoryDuplicates.length);
  if (expenseCategoryDuplicates.length > 0) {
    console.log(expenseCategoryDuplicates);
  }

  const totalDuplicates =
    brandDuplicates.length +
    modelDuplicates.length +
    serviceCategoryDuplicates.length +
    itemCategoryDuplicates.length +
    deviceConditionDuplicates.length +
    expenseCategoryDuplicates.length;

  console.log('\n✅ Total duplicate groups found:', totalDuplicates);

  await prisma.$disconnect();
}

checkDuplicates().catch((error) => {
  console.error('❌ Error checking duplicates:', error);
  process.exit(1);
});
