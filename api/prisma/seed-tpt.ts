import { PrismaClient, InventoryCategory, GSTRate, TaxType, Unit } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TPT branch data...');

  // Get the existing company
  const company = await prisma.company.findFirst();
  if (!company) {
    throw new Error('No company found. Please run the main seed script first.');
  }

  // Check if TPT branch already exists
  let tptBranch = await prisma.branch.findUnique({
    where: { code: 'TPT' },
  });

  if (tptBranch) {
    console.log('✅ TPT Branch already exists');
  } else {
    // Create TPT Branch
    tptBranch = await prisma.branch.create({
      data: {
        name: 'TPT Branch',
        code: 'TPT',
        companyId: company.id,
        address: '789 TPT Road, Tiruppur, Tamil Nadu 641601',
        phone: '+91-9876543210',
        email: 'tpt@deenmobiles.com',
        isActive: true,
      },
    });
    console.log('✅ Created TPT Branch');
  }

  // Check if suppliers already exist
  const existingSuppliers = await prisma.supplier.findMany({
    where: {
      supplierCode: { in: ['SUP-001', 'SUP-002', 'SUP-003'] },
    },
  });

  let supplier1, supplier2, supplier3;

  if (existingSuppliers.length === 0) {
    // Create Suppliers
    supplier1 = await prisma.supplier.create({
      data: {
        supplierCode: 'SUP-001',
        name: 'Mobile Parts Wholesale',
        contactPerson: 'Rajesh Kumar',
        email: 'rajesh@mobilepartsltd.com',
        phone: '+91-9876543211',
        address: 'No.45, Display Street, Coimbatore, Tamil Nadu',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641001',
        gstNumber: '33ABCDE1234F1Z5',
        panNumber: 'ABCDE1234F',
        bankName: 'State Bank of India',
        accountNumber: '12345678901',
        ifscCode: 'SBIN0001234',
        companyId: company.id,
        branchId: tptBranch.id,
      },
    });

    supplier2 = await prisma.supplier.create({
      data: {
        supplierCode: 'SUP-002',
        name: 'Tech Accessories Co',
        contactPerson: 'Priya Sharma',
        email: 'priya@techaccessories.com',
        phone: '+91-9876543212',
        address: 'No.78, Accessory Market, Chennai, Tamil Nadu',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        gstNumber: '33FGHIJ5678K2L6',
        panNumber: 'FGHIJ5678K',
        companyId: company.id,
        branchId: tptBranch.id,
      },
    });

    supplier3 = await prisma.supplier.create({
      data: {
        supplierCode: 'SUP-003',
        name: 'Electronics Wholesale India',
        contactPerson: 'Suresh Babu',
        email: 'suresh@electronicsltd.com',
        phone: '+91-9876543213',
        address: 'Electronics Complex, Bangalore, Karnataka',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        gstNumber: '29KLMNO9012P3Q7',
        panNumber: 'KLMNO9012P',
        companyId: company.id,
        branchId: tptBranch.id,
      },
    });
    console.log('✅ Created 3 suppliers for TPT branch');
  } else {
    supplier1 = existingSuppliers.find((s) => s.supplierCode === 'SUP-001')!;
    supplier2 = existingSuppliers.find((s) => s.supplierCode === 'SUP-002')!;
    supplier3 = existingSuppliers.find((s) => s.supplierCode === 'SUP-003')!;

    // Update suppliers with branchId if they don't have one
    const suppliersToUpdate = [supplier1, supplier2, supplier3].filter(s => !s.branchId);
    if (suppliersToUpdate.length > 0) {
      await Promise.all(
        suppliersToUpdate.map(s =>
          prisma.supplier.update({
            where: { id: s.id },
            data: { branchId: tptBranch.id },
          })
        )
      );
      console.log(`✅ Updated ${suppliersToUpdate.length} suppliers with TPT branch ID`);
    } else {
      console.log('✅ Suppliers already exist and have branch IDs');
    }
  }

  // Check if inventory already exists for TPT branch
  const existingInventory = await prisma.inventory.findMany({
    where: { branchId: tptBranch.id },
  });

  if (existingInventory.length > 0) {
    console.log(`✅ TPT branch already has ${existingInventory.length} inventory items`);
    return;
  }

  // Create Inventory Items for TPT Branch
  const inventories = await Promise.all([
    // Display Items
    prisma.inventory.create({
      data: {
        partNumber: 'DSP-IPH13-001',
        partName: 'iPhone 13 Display Assembly',
        description: 'Original OLED display for iPhone 13 with touch digitizer',
        modelVariant: 'iPhone 13',
        brandName: 'Apple',
        category: InventoryCategory.DISPLAY,
        unit: Unit.PIECE,
        purchasePrice: 8500.00,
        salesPrice: 12000.00,
        hsnCode: '85177000',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 15,
        minStockLevel: 5,
        maxStockLevel: 50,
        reorderLevel: 10,
        supplierId: supplier1.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    prisma.inventory.create({
      data: {
        partNumber: 'DSP-SAM-A52-001',
        partName: 'Samsung Galaxy A52 Display',
        description: 'AMOLED display assembly for Samsung A52',
        modelVariant: 'Galaxy A52',
        brandName: 'Samsung',
        category: InventoryCategory.DISPLAY,
        unit: Unit.PIECE,
        purchasePrice: 3200.00,
        salesPrice: 4500.00,
        hsnCode: '85177000',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 8,
        minStockLevel: 5,
        maxStockLevel: 30,
        reorderLevel: 8,
        supplierId: supplier1.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    // Battery Items
    prisma.inventory.create({
      data: {
        partNumber: 'BAT-IPH12-001',
        partName: 'iPhone 12 Battery',
        description: 'Original battery for iPhone 12, 2815mAh capacity',
        modelVariant: 'iPhone 12',
        brandName: 'Apple',
        category: InventoryCategory.BATTERY,
        unit: Unit.PIECE,
        purchasePrice: 1200.00,
        salesPrice: 2000.00,
        hsnCode: '85076000',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 25,
        minStockLevel: 10,
        maxStockLevel: 60,
        reorderLevel: 15,
        supplierId: supplier1.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    prisma.inventory.create({
      data: {
        partNumber: 'BAT-RDM-N10-001',
        partName: 'Redmi Note 10 Battery',
        description: 'Compatible battery for Redmi Note 10, 5000mAh',
        modelVariant: 'Redmi Note 10',
        brandName: 'Xiaomi',
        category: InventoryCategory.BATTERY,
        unit: Unit.PIECE,
        purchasePrice: 450.00,
        salesPrice: 800.00,
        hsnCode: '85076000',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 30,
        minStockLevel: 10,
        maxStockLevel: 70,
        reorderLevel: 15,
        supplierId: supplier1.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    // Chargers
    prisma.inventory.create({
      data: {
        partNumber: 'CHG-USBC-20W-001',
        partName: 'USB-C 20W Fast Charger',
        description: '20W USB-C fast charging adapter with cable',
        category: InventoryCategory.CHARGER,
        unit: Unit.PIECE,
        purchasePrice: 180.00,
        salesPrice: 350.00,
        hsnCode: '85044090',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 60,
        minStockLevel: 20,
        maxStockLevel: 100,
        reorderLevel: 30,
        supplierId: supplier2.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    prisma.inventory.create({
      data: {
        partNumber: 'CBL-LIGHT-001',
        partName: 'Lightning Cable 1M',
        description: 'MFi certified Lightning to USB cable, 1 meter',
        brandName: 'Apple',
        category: InventoryCategory.CABLE,
        unit: Unit.PIECE,
        purchasePrice: 150.00,
        salesPrice: 300.00,
        hsnCode: '85444290',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 75,
        minStockLevel: 25,
        maxStockLevel: 120,
        reorderLevel: 35,
        supplierId: supplier2.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    // Cases and Accessories
    prisma.inventory.create({
      data: {
        partNumber: 'CASE-SIL-IPH13-001',
        partName: 'iPhone 13 Silicone Case',
        description: 'Premium silicone case for iPhone 13 - Multiple colors',
        modelVariant: 'iPhone 13',
        brandName: 'Apple',
        category: InventoryCategory.CASE_COVER,
        unit: Unit.PIECE,
        purchasePrice: 120.00,
        salesPrice: 250.00,
        hsnCode: '39269099',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 45,
        minStockLevel: 15,
        maxStockLevel: 80,
        reorderLevel: 20,
        supplierId: supplier2.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    prisma.inventory.create({
      data: {
        partNumber: 'SPRT-TEMP-001',
        partName: 'Tempered Glass Screen Protector',
        description: 'Universal 9H tempered glass, fits multiple models',
        category: InventoryCategory.SCREEN_PROTECTOR,
        unit: Unit.PIECE,
        purchasePrice: 30.00,
        salesPrice: 100.00,
        hsnCode: '70071900',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 120,
        minStockLevel: 40,
        maxStockLevel: 200,
        reorderLevel: 60,
        supplierId: supplier2.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    // Tools and Others
    prisma.inventory.create({
      data: {
        partNumber: 'TOOL-SCREW-SET-001',
        partName: 'Mobile Repair Screwdriver Set',
        description: 'Professional 25-piece precision screwdriver set',
        category: InventoryCategory.OTHER,
        unit: Unit.SET,
        purchasePrice: 250.00,
        salesPrice: 500.00,
        hsnCode: '82055100',
        gstRate: GSTRate.TWELVE,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 10,
        minStockLevel: 3,
        maxStockLevel: 20,
        reorderLevel: 5,
        supplierId: supplier3.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    prisma.inventory.create({
      data: {
        partNumber: 'TOOL-OPEN-001',
        partName: 'Mobile Opening Tool Kit',
        description: 'Plastic opening tools and spudgers kit',
        category: InventoryCategory.OTHER,
        unit: Unit.SET,
        purchasePrice: 80.00,
        salesPrice: 150.00,
        hsnCode: '82055900',
        gstRate: GSTRate.TWELVE,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 15,
        minStockLevel: 5,
        maxStockLevel: 30,
        reorderLevel: 8,
        supplierId: supplier3.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    // Audio Items
    prisma.inventory.create({
      data: {
        partNumber: 'AUD-IPH-SPEAK-001',
        partName: 'iPhone Earpiece Speaker',
        description: 'Replacement earpiece speaker for iPhone models',
        brandName: 'Apple',
        category: InventoryCategory.AUDIO,
        unit: Unit.PIECE,
        purchasePrice: 200.00,
        salesPrice: 400.00,
        hsnCode: '85183000',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 20,
        minStockLevel: 8,
        maxStockLevel: 40,
        reorderLevel: 12,
        supplierId: supplier3.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    // Camera Items
    prisma.inventory.create({
      data: {
        partNumber: 'CAM-SAM-REAR-001',
        partName: 'Samsung Rear Camera Module',
        description: 'Rear camera module for Samsung A-series phones',
        brandName: 'Samsung',
        category: InventoryCategory.CAMERA,
        unit: Unit.PIECE,
        purchasePrice: 1500.00,
        salesPrice: 2500.00,
        hsnCode: '85258020',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 6,
        minStockLevel: 3,
        maxStockLevel: 20,
        reorderLevel: 5,
        supplierId: supplier1.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    // Electrical/Mechanical
    prisma.inventory.create({
      data: {
        partNumber: 'ELEC-VIBR-001',
        partName: 'Vibration Motor Universal',
        description: 'Universal vibration motor for smartphones',
        category: InventoryCategory.ELECTRICAL,
        unit: Unit.PIECE,
        purchasePrice: 50.00,
        salesPrice: 120.00,
        hsnCode: '85011010',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 35,
        minStockLevel: 10,
        maxStockLevel: 60,
        reorderLevel: 15,
        supplierId: supplier3.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    prisma.inventory.create({
      data: {
        partNumber: 'MECH-POWER-BTN-001',
        partName: 'Power Button Flex Cable',
        description: 'Universal power button flex cable assembly',
        category: InventoryCategory.MECHANICAL,
        unit: Unit.PIECE,
        purchasePrice: 80.00,
        salesPrice: 180.00,
        hsnCode: '85366990',
        gstRate: GSTRate.EIGHTEEN,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 25,
        minStockLevel: 10,
        maxStockLevel: 50,
        reorderLevel: 15,
        supplierId: supplier3.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
    // Accessory with low stock to test notifications
    prisma.inventory.create({
      data: {
        partNumber: 'ACC-EARPOD-001',
        partName: 'Wired Earphones with Mic',
        description: '3.5mm jack wired earphones with mic - Low Stock Item',
        category: InventoryCategory.ACCESSORY,
        unit: Unit.PIECE,
        purchasePrice: 80.00,
        salesPrice: 150.00,
        hsnCode: '85183000',
        gstRate: GSTRate.TWELVE,
        taxType: TaxType.CGST_SGST,
        stockQuantity: 4,
        minStockLevel: 10,
        maxStockLevel: 50,
        reorderLevel: 12,
        supplierId: supplier2.id,
        branchId: tptBranch.id,
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Created', inventories.length, 'inventory items for TPT branch');

  console.log('');
  console.log('🎉 TPT branch data seeded successfully!');
  console.log('');
  console.log('TPT Branch Details:');
  console.log('-------------------');
  console.log('Branch Code: TPT');
  console.log('Branch Name: TPT Branch');
  console.log('Suppliers: 3');
  console.log('Inventory Items: 15');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding TPT branch data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
