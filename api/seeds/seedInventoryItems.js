const { PrismaClient, InventoryCategory, Unit, GSTRate, TaxType } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to generate random stock quantity
const randomStock = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Inventory items template (will be created for each branch)
const inventoryTemplates = [
  // DISPLAYS
  {
    partNumber: 'DSP-IP15PM-001',
    partName: 'iPhone 15 Pro Max Display OLED',
    description: 'Original OLED display for iPhone 15 Pro Max',
    category: InventoryCategory.DISPLAY,
    unit: Unit.PIECE,
    purchasePrice: 18000,
    salesPrice: 25000,
    hsnCode: '85177000',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 2,
    maxStockLevel: 10,
    reorderLevel: 3,
    stockRange: [3, 8],
    brandName: 'Apple',
    modelName: 'iPhone 15 Pro Max',
  },
  {
    partNumber: 'DSP-IP14P-001',
    partName: 'iPhone 14 Pro Display OLED',
    description: 'Original OLED display for iPhone 14 Pro',
    category: InventoryCategory.DISPLAY,
    unit: Unit.PIECE,
    purchasePrice: 15000,
    salesPrice: 21000,
    hsnCode: '85177000',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 3,
    maxStockLevel: 15,
    reorderLevel: 5,
    stockRange: [5, 12],
    brandName: 'Apple',
    modelName: 'iPhone 14 Pro',
  },
  {
    partNumber: 'DSP-S24U-001',
    partName: 'Samsung S24 Ultra AMOLED Display',
    description: 'Original AMOLED display for Galaxy S24 Ultra',
    category: InventoryCategory.DISPLAY,
    unit: Unit.PIECE,
    purchasePrice: 12000,
    salesPrice: 17000,
    hsnCode: '85177000',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 3,
    maxStockLevel: 15,
    reorderLevel: 5,
    stockRange: [4, 10],
    brandName: 'Samsung',
    modelName: 'Galaxy S24 Ultra',
  },
  {
    partNumber: 'DSP-RN13P-001',
    partName: 'Redmi Note 13 Pro Display',
    description: 'AMOLED display for Redmi Note 13 Pro',
    category: InventoryCategory.DISPLAY,
    unit: Unit.PIECE,
    purchasePrice: 2500,
    salesPrice: 4000,
    hsnCode: '85177000',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 5,
    maxStockLevel: 25,
    reorderLevel: 8,
    stockRange: [8, 20],
    brandName: 'Xiaomi',
    modelName: 'Redmi Note 13 Pro',
  },

  // BATTERIES
  {
    partNumber: 'BAT-IP15PM-001',
    partName: 'iPhone 15 Pro Max Battery',
    description: 'Original battery for iPhone 15 Pro Max, 4422mAh',
    category: InventoryCategory.BATTERY,
    unit: Unit.PIECE,
    purchasePrice: 3500,
    salesPrice: 5500,
    hsnCode: '85076000',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 5,
    maxStockLevel: 20,
    reorderLevel: 8,
    stockRange: [8, 15],
    brandName: 'Apple',
    modelName: 'iPhone 15 Pro Max',
  },
  {
    partNumber: 'BAT-IP13-001',
    partName: 'iPhone 13 Battery',
    description: 'Original battery for iPhone 13, 3227mAh',
    category: InventoryCategory.BATTERY,
    unit: Unit.PIECE,
    purchasePrice: 2000,
    salesPrice: 3500,
    hsnCode: '85076000',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 8,
    maxStockLevel: 30,
    reorderLevel: 12,
    stockRange: [12, 25],
    brandName: 'Apple',
    modelName: 'iPhone 13',
  },
  {
    partNumber: 'BAT-S24U-001',
    partName: 'Samsung S24 Ultra Battery',
    description: 'Original battery for Galaxy S24 Ultra, 5000mAh',
    category: InventoryCategory.BATTERY,
    unit: Unit.PIECE,
    purchasePrice: 1800,
    salesPrice: 3200,
    hsnCode: '85076000',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 8,
    maxStockLevel: 30,
    reorderLevel: 12,
    stockRange: [10, 25],
    brandName: 'Samsung',
    modelName: 'Galaxy S24 Ultra',
  },
  {
    partNumber: 'BAT-RN13P-001',
    partName: 'Redmi Note 13 Pro Battery',
    description: 'Battery for Redmi Note 13 Pro, 5000mAh',
    category: InventoryCategory.BATTERY,
    unit: Unit.PIECE,
    purchasePrice: 600,
    salesPrice: 1200,
    hsnCode: '85076000',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 10,
    maxStockLevel: 40,
    reorderLevel: 15,
    stockRange: [15, 35],
    brandName: 'Xiaomi',
    modelName: 'Redmi Note 13 Pro',
  },
  {
    partNumber: 'BAT-OP12-001',
    partName: 'OnePlus 12 Battery',
    description: 'Battery for OnePlus 12, 5400mAh',
    category: InventoryCategory.BATTERY,
    unit: Unit.PIECE,
    purchasePrice: 1200,
    salesPrice: 2200,
    hsnCode: '85076000',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 5,
    maxStockLevel: 25,
    reorderLevel: 10,
    stockRange: [8, 20],
    brandName: 'OnePlus',
    modelName: 'OnePlus 12',
  },

  // CHARGERS & CABLES
  {
    partNumber: 'CHG-USBC-20W-001',
    partName: 'USB-C 20W Fast Charger',
    description: '20W USB-C fast charging adapter',
    category: InventoryCategory.CHARGER,
    unit: Unit.PIECE,
    purchasePrice: 150,
    salesPrice: 350,
    hsnCode: '85044090',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 20,
    maxStockLevel: 100,
    reorderLevel: 30,
    stockRange: [30, 80],
  },
  {
    partNumber: 'CHG-LIGHT-5W-001',
    partName: 'Apple Lightning 5W Charger',
    description: 'Original Apple 5W USB power adapter',
    category: InventoryCategory.CHARGER,
    unit: Unit.PIECE,
    purchasePrice: 250,
    salesPrice: 500,
    hsnCode: '85044090',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 15,
    maxStockLevel: 60,
    reorderLevel: 25,
    stockRange: [25, 50],
    brandName: 'Apple',
  },
  {
    partNumber: 'CBL-LIGHT-1M-001',
    partName: 'Lightning to USB Cable 1M',
    description: 'MFi certified Lightning cable',
    category: InventoryCategory.CABLE,
    unit: Unit.PIECE,
    purchasePrice: 120,
    salesPrice: 300,
    hsnCode: '85444290',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 30,
    maxStockLevel: 150,
    reorderLevel: 50,
    stockRange: [50, 120],
    brandName: 'Apple',
  },
  {
    partNumber: 'CBL-USBC-1M-001',
    partName: 'USB-C to USB-C Cable 1M',
    description: 'USB-C fast charging cable',
    category: InventoryCategory.CABLE,
    unit: Unit.PIECE,
    purchasePrice: 80,
    salesPrice: 250,
    hsnCode: '85444290',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 40,
    maxStockLevel: 200,
    reorderLevel: 60,
    stockRange: [60, 150],
  },

  // CASES & SCREEN PROTECTORS
  {
    partNumber: 'CASE-IP15PM-SIL-001',
    partName: 'iPhone 15 Pro Max Silicone Case',
    description: 'Premium silicone case - Multiple colors',
    category: InventoryCategory.CASE_COVER,
    unit: Unit.PIECE,
    purchasePrice: 150,
    salesPrice: 400,
    hsnCode: '39269099',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 20,
    maxStockLevel: 100,
    reorderLevel: 30,
    stockRange: [30, 80],
    brandName: 'Apple',
    modelName: 'iPhone 15 Pro Max',
  },
  {
    partNumber: 'SPRT-TEMP-UNIV-001',
    partName: 'Universal Tempered Glass',
    description: '9H tempered glass screen protector',
    category: InventoryCategory.SCREEN_PROTECTOR,
    unit: Unit.PIECE,
    purchasePrice: 30,
    salesPrice: 150,
    hsnCode: '70071900',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 50,
    maxStockLevel: 250,
    reorderLevel: 80,
    stockRange: [80, 200],
  },
  {
    partNumber: 'CASE-UNIV-TPU-001',
    partName: 'Universal TPU Back Cover',
    description: 'Transparent TPU case - Universal fit',
    category: InventoryCategory.CASE_COVER,
    unit: Unit.PIECE,
    purchasePrice: 40,
    salesPrice: 150,
    hsnCode: '39269099',
    gstRate: GSTRate.TWELVE,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 40,
    maxStockLevel: 200,
    reorderLevel: 60,
    stockRange: [60, 150],
  },

  // AUDIO COMPONENTS
  {
    partNumber: 'AUD-IP-SPEAK-001',
    partName: 'iPhone Earpiece Speaker',
    description: 'Replacement earpiece speaker for iPhone',
    category: InventoryCategory.AUDIO,
    unit: Unit.PIECE,
    purchasePrice: 200,
    salesPrice: 500,
    hsnCode: '85183000',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 15,
    maxStockLevel: 60,
    reorderLevel: 25,
    stockRange: [20, 50],
    brandName: 'Apple',
  },
  {
    partNumber: 'AUD-EARPOD-001',
    partName: 'Wired Earphones with Mic',
    description: '3.5mm jack wired earphones',
    category: InventoryCategory.ACCESSORY,
    unit: Unit.PIECE,
    purchasePrice: 80,
    salesPrice: 200,
    hsnCode: '85183000',
    gstRate: GSTRate.TWELVE,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 30,
    maxStockLevel: 150,
    reorderLevel: 50,
    stockRange: [50, 120],
  },

  // CAMERA COMPONENTS
  {
    partNumber: 'CAM-IP15P-REAR-001',
    partName: 'iPhone 15 Pro Rear Camera Module',
    description: 'Triple camera module for iPhone 15 Pro',
    category: InventoryCategory.CAMERA,
    unit: Unit.PIECE,
    purchasePrice: 8000,
    salesPrice: 12000,
    hsnCode: '85258020',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 2,
    maxStockLevel: 10,
    reorderLevel: 4,
    stockRange: [3, 8],
    brandName: 'Apple',
    modelName: 'iPhone 15 Pro',
  },
  {
    partNumber: 'CAM-SAM-REAR-001',
    partName: 'Samsung Rear Camera Module',
    description: 'Rear camera for Samsung A-series',
    category: InventoryCategory.CAMERA,
    unit: Unit.PIECE,
    purchasePrice: 1500,
    salesPrice: 2800,
    hsnCode: '85258020',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 5,
    maxStockLevel: 25,
    reorderLevel: 10,
    stockRange: [8, 20],
    brandName: 'Samsung',
  },

  // ELECTRICAL COMPONENTS
  {
    partNumber: 'ELEC-VIBR-UNIV-001',
    partName: 'Vibration Motor Universal',
    description: 'Universal vibration motor for smartphones',
    category: InventoryCategory.ELECTRICAL,
    unit: Unit.PIECE,
    purchasePrice: 50,
    salesPrice: 150,
    hsnCode: '85011010',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 25,
    maxStockLevel: 100,
    reorderLevel: 40,
    stockRange: [35, 80],
  },
  {
    partNumber: 'ELEC-FLEX-PWR-001',
    partName: 'Power Button Flex Cable',
    description: 'Universal power button flex cable',
    category: InventoryCategory.MECHANICAL,
    unit: Unit.PIECE,
    purchasePrice: 80,
    salesPrice: 250,
    hsnCode: '85366990',
    gstRate: GSTRate.EIGHTEEN,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 20,
    maxStockLevel: 80,
    reorderLevel: 30,
    stockRange: [25, 60],
  },

  // TOOLS & ACCESSORIES
  {
    partNumber: 'TOOL-SCREWSET-001',
    partName: 'Mobile Repair Screwdriver Set',
    description: 'Professional 25-piece precision set',
    category: InventoryCategory.OTHER,
    unit: Unit.SET,
    purchasePrice: 250,
    salesPrice: 600,
    hsnCode: '82055100',
    gstRate: GSTRate.TWELVE,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 5,
    maxStockLevel: 20,
    reorderLevel: 8,
    stockRange: [5, 15],
  },
  {
    partNumber: 'TOOL-OPEN-KIT-001',
    partName: 'Mobile Opening Tool Kit',
    description: 'Plastic opening tools and spudgers',
    category: InventoryCategory.OTHER,
    unit: Unit.SET,
    purchasePrice: 80,
    salesPrice: 200,
    hsnCode: '82055900',
    gstRate: GSTRate.TWELVE,
    taxType: TaxType.CGST_SGST,
    minStockLevel: 10,
    maxStockLevel: 40,
    reorderLevel: 15,
    stockRange: [15, 35],
  },
];

async function seedInventoryItems() {
  console.log('📦 Seeding Inventory Items for All Branches...\n');

  try {
    // Get company
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new Error('No company found. Please run the main seed first.');
    }

    // Get all branches
    const branches = await prisma.branch.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true, code: true },
    });

    if (branches.length === 0) {
      throw new Error('No branches found. Please create branches first.');
    }

    console.log(`✅ Found ${branches.length} branches\n`);

    // Get suppliers
    const suppliers = await prisma.supplier.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true },
    });

    // Get brands and models for reference
    const brands = await prisma.itemBrand.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true },
    });

    const models = await prisma.itemModel.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true, brandId: true },
    });

    // Create maps
    const brandMap = {};
    brands.forEach(b => brandMap[b.name] = b.id);

    const modelMap = {};
    models.forEach(m => modelMap[m.name] = m.id);

    let totalCreated = 0;
    let totalSkipped = 0;

    // Create inventory items for each branch
    for (const branch of branches) {
      console.log(`🏪 Creating inventory for ${branch.name} (${branch.code})...`);

      let branchCreated = 0;
      let branchSkipped = 0;

      for (const template of inventoryTemplates) {
        try {
          // Generate unique part number for this branch
          const branchPartNumber = `${template.partNumber}-${branch.code}`;

          // Check if item already exists
          const existing = await prisma.inventory.findFirst({
            where: {
              partNumber: branchPartNumber,
              branchId: branch.id,
            },
          });

          if (existing) {
            branchSkipped++;
            continue;
          }

          // Get brand and model IDs if applicable
          const brandId = template.brandName ? brandMap[template.brandName] : null;
          const modelId = template.modelName ? modelMap[template.modelName] : null;

          // Random supplier
          const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];

          // Generate stock quantity based on range
          const stockQuantity = template.stockRange
            ? randomStock(template.stockRange[0], template.stockRange[1])
            : randomStock(10, 50);

          // Create inventory item
          await prisma.inventory.create({
            data: {
              partNumber: branchPartNumber,
              partName: template.partName,
              description: template.description,
              modelVariant: template.modelName || null,
              brandName: template.brandName || null,
              brandId: brandId,
              modelId: modelId,
              category: template.category,
              unit: template.unit,
              purchasePrice: template.purchasePrice,
              salesPrice: template.salesPrice,
              hsnCode: template.hsnCode,
              gstRate: template.gstRate,
              taxType: template.taxType,
              stockQuantity: stockQuantity,
              minStockLevel: template.minStockLevel || 5,
              maxStockLevel: template.maxStockLevel || 50,
              reorderLevel: template.reorderLevel || 10,
              supplierId: supplier?.id,
              active: true,
              branchId: branch.id,
              companyId: company.id,
            },
          });

          branchCreated++;
        } catch (error) {
          console.log(`   ⚠️  Failed to create ${template.partName}: ${error.message}`);
        }
      }

      console.log(`   ✅ Created: ${branchCreated}, ⏭️  Skipped: ${branchSkipped}\n`);
      totalCreated += branchCreated;
      totalSkipped += branchSkipped;
    }

    console.log('═'.repeat(50));
    console.log('📊 Inventory Seeding Summary:');
    console.log('═'.repeat(50));
    console.log(`   ✅ Total Items Created: ${totalCreated}`);
    console.log(`   ⏭️  Total Items Skipped: ${totalSkipped}`);
    console.log(`   🏪 Branches: ${branches.length}`);
    console.log(`   📦 Items per Branch: ${inventoryTemplates.length}`);
    console.log(`   💰 Total Inventory Records: ${totalCreated}`);
    console.log('═'.repeat(50));
    console.log('');

  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    await seedInventoryItems();
    console.log('🎉 Inventory seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding inventory:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
