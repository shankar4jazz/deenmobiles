import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('🧹 Starting duplicate cleanup...\n');

  let totalRemoved = 0;

  // Clean up ItemBrand duplicates
  console.log('📦 Cleaning ItemBrand duplicates...');
  const brands = await prisma.itemBrand.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const brandMap = new Map<string, string>();
  const brandsToDelete: string[] = [];

  for (const brand of brands) {
    const key = `${brand.name}-${brand.companyId}`;
    if (brandMap.has(key)) {
      brandsToDelete.push(brand.id);
      console.log(`  - Duplicate brand: ${brand.name} (${brand.id})`);
    } else {
      brandMap.set(key, brand.id);
    }
  }

  if (brandsToDelete.length > 0) {
    // Update references to point to the first occurrence
    for (const duplicateId of brandsToDelete) {
      const brand = brands.find(b => b.id === duplicateId)!;
      const key = `${brand.name}-${brand.companyId}`;
      const keepId = brandMap.get(key)!;

      // Update customer devices
      await prisma.customerDevice.updateMany({
        where: { brandId: duplicateId },
        data: { brandId: keepId },
      });

      // Update items
      await prisma.item.updateMany({
        where: { brandId: duplicateId },
        data: { brandId: keepId },
      });

      // Update inventories
      await prisma.inventory.updateMany({
        where: { brandId: duplicateId },
        data: { brandId: keepId },
      });

      // Delete the duplicate
      await prisma.itemBrand.delete({
        where: { id: duplicateId },
      });
    }
    totalRemoved += brandsToDelete.length;
    console.log(`  ✅ Removed ${brandsToDelete.length} duplicate brands`);
  }

  // Clean up ItemModel duplicates
  console.log('📱 Cleaning ItemModel duplicates...');
  const models = await prisma.itemModel.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const modelMap = new Map<string, string>();
  const modelsToDelete: string[] = [];

  for (const model of models) {
    const key = `${model.name}-${model.brandId}-${model.companyId}`;
    if (modelMap.has(key)) {
      modelsToDelete.push(model.id);
      console.log(`  - Duplicate model: ${model.name} (${model.id})`);
    } else {
      modelMap.set(key, model.id);
    }
  }

  if (modelsToDelete.length > 0) {
    for (const duplicateId of modelsToDelete) {
      const model = models.find(m => m.id === duplicateId)!;
      const key = `${model.name}-${model.brandId}-${model.companyId}`;
      const keepId = modelMap.get(key)!;

      // Update customer devices
      await prisma.customerDevice.updateMany({
        where: { modelId: duplicateId },
        data: { modelId: keepId },
      });

      // Update items
      await prisma.item.updateMany({
        where: { modelId: duplicateId },
        data: { modelId: keepId },
      });

      // Update inventories
      await prisma.inventory.updateMany({
        where: { modelId: duplicateId },
        data: { modelId: keepId },
      });

      // Delete the duplicate
      await prisma.itemModel.delete({
        where: { id: duplicateId },
      });
    }
    totalRemoved += modelsToDelete.length;
    console.log(`  ✅ Removed ${modelsToDelete.length} duplicate models`);
  }

  // Clean up ServiceCategory duplicates
  console.log('🔧 Cleaning ServiceCategory duplicates...');
  const serviceCategories = await prisma.serviceCategory.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const serviceCategoryMap = new Map<string, string>();
  const serviceCategoriesToDelete: string[] = [];

  for (const category of serviceCategories) {
    const key = `${category.name}-${category.companyId}`;
    if (serviceCategoryMap.has(key)) {
      serviceCategoriesToDelete.push(category.id);
      console.log(`  - Duplicate service category: ${category.name} (${category.id})`);
    } else {
      serviceCategoryMap.set(key, category.id);
    }
  }

  if (serviceCategoriesToDelete.length > 0) {
    for (const duplicateId of serviceCategoriesToDelete) {
      const category = serviceCategories.find(c => c.id === duplicateId)!;
      const key = `${category.name}-${category.companyId}`;
      const keepId = serviceCategoryMap.get(key)!;

      // Update services
      await prisma.service.updateMany({
        where: { serviceCategoryId: duplicateId },
        data: { serviceCategoryId: keepId },
      });

      // Delete the duplicate
      await prisma.serviceCategory.delete({
        where: { id: duplicateId },
      });
    }
    totalRemoved += serviceCategoriesToDelete.length;
    console.log(`  ✅ Removed ${serviceCategoriesToDelete.length} duplicate service categories`);
  }

  // Clean up ItemCategory duplicates
  console.log('📂 Cleaning ItemCategory duplicates...');
  const itemCategories = await prisma.itemCategory.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const itemCategoryMap = new Map<string, string>();
  const itemCategoriesToDelete: string[] = [];

  for (const category of itemCategories) {
    const key = `${category.name}-${category.companyId}`;
    if (itemCategoryMap.has(key)) {
      itemCategoriesToDelete.push(category.id);
      console.log(`  - Duplicate item category: ${category.name} (${category.id})`);
    } else {
      itemCategoryMap.set(key, category.id);
    }
  }

  if (itemCategoriesToDelete.length > 0) {
    for (const duplicateId of itemCategoriesToDelete) {
      const category = itemCategories.find(c => c.id === duplicateId)!;
      const key = `${category.name}-${category.companyId}`;
      const keepId = itemCategoryMap.get(key)!;

      // Update items
      await prisma.item.updateMany({
        where: { categoryId: duplicateId },
        data: { categoryId: keepId },
      });

      // Update inventories
      await prisma.inventory.updateMany({
        where: { categoryId: duplicateId },
        data: { categoryId: keepId },
      });

      // Delete the duplicate
      await prisma.itemCategory.delete({
        where: { id: duplicateId },
      });
    }
    totalRemoved += itemCategoriesToDelete.length;
    console.log(`  ✅ Removed ${itemCategoriesToDelete.length} duplicate item categories`);
  }

  // Clean up DeviceCondition duplicates
  console.log('📟 Cleaning DeviceCondition duplicates...');
  const deviceConditions = await prisma.deviceCondition.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const deviceConditionMap = new Map<string, string>();
  const deviceConditionsToDelete: string[] = [];

  for (const condition of deviceConditions) {
    const key = `${condition.name}-${condition.companyId}`;
    if (deviceConditionMap.has(key)) {
      deviceConditionsToDelete.push(condition.id);
      console.log(`  - Duplicate device condition: ${condition.name} (${condition.id})`);
    } else {
      deviceConditionMap.set(key, condition.id);
    }
  }

  if (deviceConditionsToDelete.length > 0) {
    for (const duplicateId of deviceConditionsToDelete) {
      const condition = deviceConditions.find(c => c.id === duplicateId)!;
      const key = `${condition.name}-${condition.companyId}`;
      const keepId = deviceConditionMap.get(key)!;

      // Update customer devices
      await prisma.customerDevice.updateMany({
        where: { conditionId: duplicateId },
        data: { conditionId: keepId },
      });

      // Delete the duplicate
      await prisma.deviceCondition.delete({
        where: { id: duplicateId },
      });
    }
    totalRemoved += deviceConditionsToDelete.length;
    console.log(`  ✅ Removed ${deviceConditionsToDelete.length} duplicate device conditions`);
  }

  // Clean up ExpenseCategory duplicates
  console.log('💰 Cleaning ExpenseCategory duplicates...');
  const expenseCategories = await prisma.expenseCategory.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const expenseCategoryMap = new Map<string, string>();
  const expenseCategoriesToDelete: string[] = [];

  for (const category of expenseCategories) {
    const key = `${category.name}-${category.companyId}`;
    if (expenseCategoryMap.has(key)) {
      expenseCategoriesToDelete.push(category.id);
      console.log(`  - Duplicate expense category: ${category.name} (${category.id})`);
    } else {
      expenseCategoryMap.set(key, category.id);
    }
  }

  if (expenseCategoriesToDelete.length > 0) {
    for (const duplicateId of expenseCategoriesToDelete) {
      const category = expenseCategories.find(c => c.id === duplicateId)!;
      const key = `${category.name}-${category.companyId}`;
      const keepId = expenseCategoryMap.get(key)!;

      // Update expenses
      await prisma.expense.updateMany({
        where: { categoryId: duplicateId },
        data: { categoryId: keepId },
      });

      // Delete the duplicate
      await prisma.expenseCategory.delete({
        where: { id: duplicateId },
      });
    }
    totalRemoved += expenseCategoriesToDelete.length;
    console.log(`  ✅ Removed ${expenseCategoriesToDelete.length} duplicate expense categories`);
  }

  console.log(`\n✅ Cleanup complete! Total duplicates removed: ${totalRemoved}`);

  await prisma.$disconnect();
}

cleanupDuplicates().catch((error) => {
  console.error('❌ Error cleaning duplicates:', error);
  process.exit(1);
});
