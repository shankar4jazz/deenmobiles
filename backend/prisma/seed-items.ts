import { PrismaClient, TaxType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed items and stock...');

  // Get the first company
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found. Please create a company first.');
    return;
  }
  console.log(`Using company: ${company.name}`);

  // Get the first branch
  const branch = await prisma.branch.findFirst({
    where: { companyId: company.id },
  });
  if (!branch) {
    console.error('No branch found. Please create a branch first.');
    return;
  }
  console.log(`Using branch: ${branch.name}`);

  // Get or create categories
  const categoryData = [
    { name: 'Display/Screen', code: 'DISPLAY' },
    { name: 'Battery', code: 'BATTERY' },
    { name: 'Back Cover', code: 'BACKCOVER' },
    { name: 'Charger', code: 'CHARGER' },
    { name: 'Accessory', code: 'ACCESSORY' },
  ];

  const categories = [];
  for (const cat of categoryData) {
    let category = await prisma.itemCategory.findFirst({
      where: { code: cat.code, companyId: company.id },
    });
    if (!category) {
      category = await prisma.itemCategory.create({
        data: {
          name: cat.name,
          code: cat.code,
          companyId: company.id,
        },
      });
    }
    categories.push(category);
  }
  console.log(`Created/Updated ${categories.length} categories`);

  // Get or create brands
  const brandData = [
    { name: 'Samsung', code: 'SAMSUNG' },
    { name: 'Apple', code: 'APPLE' },
    { name: 'Xiaomi', code: 'XIAOMI' },
    { name: 'OPPO', code: 'OPPO' },
    { name: 'Vivo', code: 'VIVO' },
  ];

  const brands = [];
  for (const brd of brandData) {
    let brand = await prisma.itemBrand.findFirst({
      where: { code: brd.code, companyId: company.id },
    });
    if (!brand) {
      brand = await prisma.itemBrand.create({
        data: {
          name: brd.name,
          code: brd.code,
          companyId: company.id,
        },
      });
    }
    brands.push(brand);
  }
  console.log(`Created/Updated ${brands.length} brands`);

  // Get or create unit
  let unit = await prisma.itemUnit.findFirst({
    where: { code: 'PCS', companyId: company.id },
  });
  if (!unit) {
    unit = await prisma.itemUnit.create({
      data: {
        name: 'Pieces',
        code: 'PCS',
        symbol: 'pcs',
        companyId: company.id,
      },
    });
  }
  console.log('Created/Updated unit: Pieces');

  // Get or create GST rate
  let gstRate = await prisma.itemGSTRate.findFirst({
    where: { name: '18%', companyId: company.id },
  });
  if (!gstRate) {
    gstRate = await prisma.itemGSTRate.create({
      data: {
        name: '18%',
        rate: new Decimal(18),
        companyId: company.id,
      },
    });
  }
  console.log('Created/Updated GST rate: 18%');

  // Sample items with stock
  const itemsData = [
    // Samsung items
    {
      itemName: 'Samsung Galaxy A54 Display',
      categoryId: categories[0].id, // Display
      brandId: brands[0].id, // Samsung
      purchasePrice: 2500,
      salesPrice: 3500,
      stock: 15,
      minStock: 5,
      reorderLevel: 8,
    },
    {
      itemName: 'Samsung Galaxy S23 Display',
      categoryId: categories[0].id,
      brandId: brands[0].id,
      purchasePrice: 8500,
      salesPrice: 12000,
      stock: 8,
      minStock: 3,
      reorderLevel: 5,
    },
    {
      itemName: 'Samsung Galaxy A54 Battery',
      categoryId: categories[1].id, // Battery
      brandId: brands[0].id,
      purchasePrice: 450,
      salesPrice: 750,
      stock: 25,
      minStock: 10,
      reorderLevel: 15,
    },
    {
      itemName: 'Samsung Galaxy S23 Battery',
      categoryId: categories[1].id,
      brandId: brands[0].id,
      purchasePrice: 850,
      salesPrice: 1200,
      stock: 12,
      minStock: 5,
      reorderLevel: 8,
    },
    {
      itemName: 'Samsung Galaxy A54 Back Cover',
      categoryId: categories[2].id, // Back Cover
      brandId: brands[0].id,
      purchasePrice: 350,
      salesPrice: 600,
      stock: 30,
      minStock: 10,
      reorderLevel: 15,
    },

    // Apple items
    {
      itemName: 'iPhone 13 Display OLED',
      categoryId: categories[0].id,
      brandId: brands[1].id, // Apple
      purchasePrice: 6500,
      salesPrice: 9500,
      stock: 10,
      minStock: 3,
      reorderLevel: 5,
    },
    {
      itemName: 'iPhone 14 Display OLED',
      categoryId: categories[0].id,
      brandId: brands[1].id,
      purchasePrice: 8500,
      salesPrice: 12500,
      stock: 6,
      minStock: 2,
      reorderLevel: 4,
    },
    {
      itemName: 'iPhone 13 Battery',
      categoryId: categories[1].id,
      brandId: brands[1].id,
      purchasePrice: 1200,
      salesPrice: 1800,
      stock: 20,
      minStock: 8,
      reorderLevel: 12,
    },
    {
      itemName: 'iPhone 13 Back Glass',
      categoryId: categories[2].id,
      brandId: brands[1].id,
      purchasePrice: 450,
      salesPrice: 800,
      stock: 15,
      minStock: 5,
      reorderLevel: 8,
    },

    // Xiaomi items
    {
      itemName: 'Redmi Note 12 Pro Display',
      categoryId: categories[0].id,
      brandId: brands[2].id, // Xiaomi
      purchasePrice: 1800,
      salesPrice: 2800,
      stock: 18,
      minStock: 6,
      reorderLevel: 10,
    },
    {
      itemName: 'Redmi Note 12 Pro Battery',
      categoryId: categories[1].id,
      brandId: brands[2].id,
      purchasePrice: 350,
      salesPrice: 600,
      stock: 28,
      minStock: 10,
      reorderLevel: 15,
    },
    {
      itemName: 'Poco X5 Pro Display',
      categoryId: categories[0].id,
      brandId: brands[2].id,
      purchasePrice: 2200,
      salesPrice: 3200,
      stock: 12,
      minStock: 5,
      reorderLevel: 8,
    },

    // OPPO items
    {
      itemName: 'OPPO Reno 8 Display',
      categoryId: categories[0].id,
      brandId: brands[3].id, // OPPO
      purchasePrice: 2000,
      salesPrice: 3000,
      stock: 14,
      minStock: 5,
      reorderLevel: 8,
    },
    {
      itemName: 'OPPO Reno 8 Battery',
      categoryId: categories[1].id,
      brandId: brands[3].id,
      purchasePrice: 400,
      salesPrice: 650,
      stock: 22,
      minStock: 8,
      reorderLevel: 12,
    },

    // Vivo items
    {
      itemName: 'Vivo V27 Pro Display',
      categoryId: categories[0].id,
      brandId: brands[4].id, // Vivo
      purchasePrice: 2300,
      salesPrice: 3400,
      stock: 11,
      minStock: 4,
      reorderLevel: 7,
    },
    {
      itemName: 'Vivo V27 Pro Battery',
      categoryId: categories[1].id,
      brandId: brands[4].id,
      purchasePrice: 420,
      salesPrice: 700,
      stock: 19,
      minStock: 8,
      reorderLevel: 12,
    },

    // Chargers and Accessories
    {
      itemName: 'Type-C Fast Charger 33W',
      categoryId: categories[3].id, // Charger
      brandId: brands[2].id,
      purchasePrice: 280,
      salesPrice: 450,
      stock: 40,
      minStock: 15,
      reorderLevel: 20,
    },
    {
      itemName: 'Type-C Fast Charger 65W',
      categoryId: categories[3].id,
      brandId: brands[2].id,
      purchasePrice: 450,
      salesPrice: 750,
      stock: 25,
      minStock: 10,
      reorderLevel: 15,
    },
    {
      itemName: 'iPhone Lightning Cable',
      categoryId: categories[4].id, // Accessory
      brandId: brands[1].id,
      purchasePrice: 180,
      salesPrice: 350,
      stock: 50,
      minStock: 20,
      reorderLevel: 30,
    },
    {
      itemName: 'Tempered Glass Screen Protector',
      categoryId: categories[4].id,
      brandId: brands[2].id,
      purchasePrice: 50,
      salesPrice: 150,
      stock: 100,
      minStock: 30,
      reorderLevel: 50,
    },
  ];

  let itemCount = 0;
  let stockCount = 0;

  for (const itemData of itemsData) {
    // Generate item code
    const count = await prisma.item.count({ where: { companyId: company.id } });
    const itemCode = `${company.name.substring(0, 3).toUpperCase()}-ITM-${(count + 1).toString().padStart(4, '0')}`;

    // Create item in catalog
    const item = await prisma.item.create({
      data: {
        itemCode,
        itemName: itemData.itemName,
        categoryId: itemData.categoryId,
        brandId: itemData.brandId,
        unitId: unit.id,
        purchasePrice: new Decimal(itemData.purchasePrice),
        salesPrice: new Decimal(itemData.salesPrice),
        gstRateId: gstRate.id,
        taxType: TaxType.IGST,
        hsnCode: '8517', // HSN code for mobile parts
        companyId: company.id,
      },
    });
    itemCount++;

    // Add item to branch inventory with stock
    await prisma.branchInventory.create({
      data: {
        itemId: item.id,
        branchId: branch.id,
        companyId: company.id,
        stockQuantity: new Decimal(itemData.stock),
        minStockLevel: new Decimal(itemData.minStock),
        reorderLevel: new Decimal(itemData.reorderLevel),
      },
    });
    stockCount++;

    console.log(`✓ Created: ${item.itemName} (Stock: ${itemData.stock})`);
  }

  console.log(`\n✅ Successfully created ${itemCount} items and added stock to ${stockCount} items!`);
}

main()
  .catch((e) => {
    console.error('Error seeding items:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
