import { PrismaClient, TaxType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedItems() {
  try {
    console.log('Starting items seed...');

    // Get the first company and user
    const company = await prisma.company.findFirst();
    const user = await prisma.user.findFirst();

    if (!company || !user) {
      throw new Error('Company or User not found. Please run the main seed first.');
    }

    console.log(`Using company: ${company.name} (${company.id})`);
    console.log(`Using user: ${user.name} (${user.id})`);

    // Create Categories
    console.log('\nCreating categories...');

    const displayCategory = await prisma.itemCategory.upsert({
      where: { name_companyId: { name: 'Display & Screens', companyId: company.id } },
      update: {},
      create: {
        name: 'Display & Screens',
        code: 'DISPLAYS',
        description: 'Mobile phone displays, screens, and digitizers',
        isActive: true,
        companyId: company.id,
      },
    });

    const batteryCategory = await prisma.itemCategory.upsert({
      where: { name_companyId: { name: 'Batteries', companyId: company.id } },
      update: {},
      create: {
        name: 'Batteries',
        code: 'BATTERIES',
        description: 'Mobile phone batteries and power banks',
        isActive: true,
        companyId: company.id,
      },
    });

    const accessoryCategory = await prisma.itemCategory.upsert({
      where: { name_companyId: { name: 'Accessories', companyId: company.id } },
      update: {},
      create: {
        name: 'Accessories',
        code: 'ACCESSORIES',
        description: 'Mobile accessories like cables, chargers, cases',
        isActive: true,
        companyId: company.id,
      },
    });

    const partsCategory = await prisma.itemCategory.upsert({
      where: { name_companyId: { name: 'Spare Parts', companyId: company.id } },
      update: {},
      create: {
        name: 'Spare Parts',
        code: 'PARTS',
        description: 'Mobile spare parts for repairs',
        isActive: true,
        companyId: company.id,
      },
    });

    const protectionCategory = await prisma.itemCategory.upsert({
      where: { name_companyId: { name: 'Protection', companyId: company.id } },
      update: {},
      create: {
        name: 'Protection',
        code: 'PROTECTION',
        description: 'Screen protectors, tempered glass, protective films',
        isActive: true,
        companyId: company.id,
      },
    });

    console.log('Categories created successfully');

    // Create Units
    console.log('\nCreating units...');

    const pieceUnit = await createUnitIfNotExists({
      name: 'Piece',
      code: 'PCS',
      symbol: 'pc',
      companyId: company.id,
    });

    const boxUnit = await createUnitIfNotExists({
      name: 'Box',
      code: 'BOX',
      symbol: 'box',
      companyId: company.id,
    });

    const setUnit = await createUnitIfNotExists({
      name: 'Set',
      code: 'SET',
      symbol: 'set',
      companyId: company.id,
    });

    console.log('Units created successfully');

    // Create GST Rates
    console.log('\nCreating GST rates...');

    const gst18 = await createGSTRateIfNotExists({
      name: 'GST 18%',
      rate: 18,
      companyId: company.id,
    });

    const gst12 = await createGSTRateIfNotExists({
      name: 'GST 12%',
      rate: 12,
      companyId: company.id,
    });

    const gst5 = await createGSTRateIfNotExists({
      name: 'GST 5%',
      rate: 5,
      companyId: company.id,
    });

    console.log('GST rates created successfully');

    // Create Brands
    console.log('\nCreating brands...');

    const samsungBrand = await createBrandIfNotExists({
      name: 'Samsung',
      code: 'SAMSUNG',
      description: 'Samsung Electronics',
      companyId: company.id,
    });

    const appleBrand = await createBrandIfNotExists({
      name: 'Apple',
      code: 'APPLE',
      description: 'Apple Inc.',
      companyId: company.id,
    });

    const xiaomiBrand = await createBrandIfNotExists({
      name: 'Xiaomi',
      code: 'XIAOMI',
      description: 'Xiaomi Corporation',
      companyId: company.id,
    });

    const oppoBrand = await createBrandIfNotExists({
      name: 'Oppo',
      code: 'OPPO',
      description: 'Oppo Electronics',
      companyId: company.id,
    });

    const vivoBrand = await createBrandIfNotExists({
      name: 'Vivo',
      code: 'VIVO',
      description: 'Vivo Mobile',
      companyId: company.id,
    });

    const genericBrand = await createBrandIfNotExists({
      name: 'Generic',
      code: 'GENERIC',
      description: 'Generic/Universal products',
      companyId: company.id,
    });

    console.log('Brands created successfully');

    // Create Models
    console.log('\nCreating models...');

    // Samsung Models
    const a51Model = await createModelIfNotExists({
      name: 'Galaxy A51',
      code: 'A51',
      brandId: samsungBrand.id,
      companyId: company.id,
    });

    const a71Model = await createModelIfNotExists({
      name: 'Galaxy A71',
      code: 'A71',
      brandId: samsungBrand.id,
      companyId: company.id,
    });

    const s21Model = await createModelIfNotExists({
      name: 'Galaxy S21',
      code: 'S21',
      brandId: samsungBrand.id,
      companyId: company.id,
    });

    // Apple Models
    const iphone12Model = await createModelIfNotExists({
      name: 'iPhone 12',
      code: 'IP12',
      brandId: appleBrand.id,
      companyId: company.id,
    });

    const iphone13Model = await createModelIfNotExists({
      name: 'iPhone 13',
      code: 'IP13',
      brandId: appleBrand.id,
      companyId: company.id,
    });

    const iphone11Model = await createModelIfNotExists({
      name: 'iPhone 11',
      code: 'IP11',
      brandId: appleBrand.id,
      companyId: company.id,
    });

    // Xiaomi Models
    const redmiNote10Model = await createModelIfNotExists({
      name: 'Redmi Note 10',
      code: 'RN10',
      brandId: xiaomiBrand.id,
      companyId: company.id,
    });

    const redmiNote11Model = await createModelIfNotExists({
      name: 'Redmi Note 11',
      code: 'RN11',
      brandId: xiaomiBrand.id,
      companyId: company.id,
    });

    console.log('Models created successfully');

    // Create Items
    console.log('\nCreating items...');

    // Samsung Displays
    await createItemIfNotExists({
      itemCode: 'SAM-A51-DISP-01',
      barcode: '8901234567890',
      itemName: 'Samsung Galaxy A51 Display Assembly',
      description: 'Original AMOLED display with digitizer for Samsung A51',
      modelVariant: 'AMOLED',
      brandId: samsungBrand.id,
      modelId: a51Model.id,
      categoryId: displayCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 3500.00,
      salesPrice: 5500.00,
      hsnCode: '85177090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'SAM-A71-DISP-01',
      barcode: '8901234567891',
      itemName: 'Samsung Galaxy A71 Display Assembly',
      description: 'Super AMOLED display with digitizer for Samsung A71',
      modelVariant: 'Super AMOLED',
      brandId: samsungBrand.id,
      modelId: a71Model.id,
      categoryId: displayCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 4200.00,
      salesPrice: 6500.00,
      hsnCode: '85177090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'SAM-S21-DISP-01',
      barcode: '8901234567892',
      itemName: 'Samsung Galaxy S21 Display Assembly',
      description: 'Dynamic AMOLED 2X display for Samsung S21',
      modelVariant: 'Dynamic AMOLED 2X',
      brandId: samsungBrand.id,
      modelId: s21Model.id,
      categoryId: displayCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 8500.00,
      salesPrice: 12500.00,
      hsnCode: '85177090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    // Apple Displays
    await createItemIfNotExists({
      itemCode: 'APL-IP12-DISP-01',
      barcode: '8901234567893',
      itemName: 'iPhone 12 Display Assembly',
      description: 'Super Retina XDR OLED display for iPhone 12',
      modelVariant: 'OLED',
      brandId: appleBrand.id,
      modelId: iphone12Model.id,
      categoryId: displayCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 9500.00,
      salesPrice: 14500.00,
      hsnCode: '85177090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'APL-IP13-DISP-01',
      barcode: '8901234567894',
      itemName: 'iPhone 13 Display Assembly',
      description: 'Super Retina XDR OLED display for iPhone 13',
      modelVariant: 'OLED',
      brandId: appleBrand.id,
      modelId: iphone13Model.id,
      categoryId: displayCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 11500.00,
      salesPrice: 16500.00,
      hsnCode: '85177090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'APL-IP11-DISP-01',
      barcode: '8901234567895',
      itemName: 'iPhone 11 Display Assembly',
      description: 'Liquid Retina LCD display for iPhone 11',
      modelVariant: 'LCD',
      brandId: appleBrand.id,
      modelId: iphone11Model.id,
      categoryId: displayCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 6500.00,
      salesPrice: 9500.00,
      hsnCode: '85177090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    // Batteries
    await createItemIfNotExists({
      itemCode: 'SAM-A51-BAT-01',
      barcode: '8901234567896',
      itemName: 'Samsung Galaxy A51 Battery',
      description: 'Original 4000mAh battery for Samsung A51',
      modelVariant: '4000mAh',
      brandId: samsungBrand.id,
      modelId: a51Model.id,
      categoryId: batteryCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 450.00,
      salesPrice: 850.00,
      hsnCode: '85076000',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'APL-IP12-BAT-01',
      barcode: '8901234567897',
      itemName: 'iPhone 12 Battery',
      description: 'Original 2815mAh battery for iPhone 12',
      modelVariant: '2815mAh',
      brandId: appleBrand.id,
      modelId: iphone12Model.id,
      categoryId: batteryCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 1200.00,
      salesPrice: 2200.00,
      hsnCode: '85076000',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'XIA-RN10-BAT-01',
      barcode: '8901234567898',
      itemName: 'Redmi Note 10 Battery',
      description: 'Original 5000mAh battery for Redmi Note 10',
      modelVariant: '5000mAh',
      brandId: xiaomiBrand.id,
      modelId: redmiNote10Model.id,
      categoryId: batteryCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 550.00,
      salesPrice: 950.00,
      hsnCode: '85076000',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    // Accessories
    await createItemIfNotExists({
      itemCode: 'GEN-USBC-CBL-01',
      barcode: '8901234567899',
      itemName: 'USB Type-C Cable',
      description: 'Universal USB Type-C charging cable, 1 meter',
      modelVariant: '1M',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: accessoryCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 80.00,
      salesPrice: 150.00,
      hsnCode: '85444290',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'GEN-LIGHT-CBL-01',
      barcode: '8901234567900',
      itemName: 'Lightning Cable',
      description: 'Apple Lightning charging cable, 1 meter',
      modelVariant: '1M',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: accessoryCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 120.00,
      salesPrice: 250.00,
      hsnCode: '85444290',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'GEN-CHG-20W-01',
      barcode: '8901234567901',
      itemName: 'Fast Charger 20W',
      description: 'Universal 20W fast charging adapter',
      modelVariant: '20W',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: accessoryCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 250.00,
      salesPrice: 450.00,
      hsnCode: '85044090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'GEN-CHG-18W-01',
      barcode: '8901234567902',
      itemName: 'Fast Charger 18W',
      description: 'Universal 18W quick charging adapter',
      modelVariant: '18W',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: accessoryCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 200.00,
      salesPrice: 380.00,
      hsnCode: '85044090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'GEN-EARPH-01',
      barcode: '8901234567903',
      itemName: 'Wired Earphones',
      description: 'Universal 3.5mm wired earphones with mic',
      modelVariant: '3.5mm',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: accessoryCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 100.00,
      salesPrice: 200.00,
      hsnCode: '85183000',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    // Protection
    await createItemIfNotExists({
      itemCode: 'GEN-TG-UNI-01',
      barcode: '8901234567904',
      itemName: 'Tempered Glass Screen Protector',
      description: 'Universal tempered glass 9H hardness',
      modelVariant: '9H',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: protectionCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 40.00,
      salesPrice: 100.00,
      hsnCode: '70071900',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'GEN-CASE-SIL-01',
      barcode: '8901234567905',
      itemName: 'Silicone Phone Case',
      description: 'Universal soft silicone protective case',
      modelVariant: 'Soft',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: protectionCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 60.00,
      salesPrice: 150.00,
      hsnCode: '39269099',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'GEN-CASE-HRD-01',
      barcode: '8901234567906',
      itemName: 'Hard Back Cover',
      description: 'Universal hard polycarbonate back cover',
      modelVariant: 'Hard',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: protectionCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 80.00,
      salesPrice: 180.00,
      hsnCode: '39269099',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    // Spare Parts
    await createItemIfNotExists({
      itemCode: 'GEN-CHRG-PORT-01',
      barcode: '8901234567907',
      itemName: 'USB Type-C Charging Port',
      description: 'Universal Type-C charging port replacement',
      modelVariant: 'Type-C',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: partsCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 120.00,
      salesPrice: 280.00,
      hsnCode: '85389099',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'GEN-SPEAKER-01',
      barcode: '8901234567908',
      itemName: 'Loud Speaker',
      description: 'Universal mobile phone loud speaker',
      modelVariant: 'Standard',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: partsCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 150.00,
      salesPrice: 320.00,
      hsnCode: '85182990',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'GEN-EARSPK-01',
      barcode: '8901234567909',
      itemName: 'Ear Speaker',
      description: 'Universal mobile phone ear speaker/earpiece',
      modelVariant: 'Standard',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: partsCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 100.00,
      salesPrice: 220.00,
      hsnCode: '85182990',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'GEN-MIC-01',
      barcode: '8901234567910',
      itemName: 'Microphone',
      description: 'Universal mobile phone microphone',
      modelVariant: 'Standard',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: partsCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 80.00,
      salesPrice: 180.00,
      hsnCode: '85182200',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'GEN-CAM-REAR-01',
      barcode: '8901234567911',
      itemName: 'Rear Camera Module',
      description: 'Universal rear camera replacement module',
      modelVariant: '48MP',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: partsCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 800.00,
      salesPrice: 1500.00,
      hsnCode: '85258090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'GEN-CAM-FRONT-01',
      barcode: '8901234567912',
      itemName: 'Front Camera Module',
      description: 'Universal front/selfie camera replacement module',
      modelVariant: '16MP',
      brandId: genericBrand.id,
      modelId: null,
      categoryId: partsCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 400.00,
      salesPrice: 850.00,
      hsnCode: '85258090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    // Additional Samsung Items
    await createItemIfNotExists({
      itemCode: 'SAM-A71-BAT-01',
      barcode: '8901234567913',
      itemName: 'Samsung Galaxy A71 Battery',
      description: 'Original 4500mAh battery for Samsung A71',
      modelVariant: '4500mAh',
      brandId: samsungBrand.id,
      modelId: a71Model.id,
      categoryId: batteryCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 550.00,
      salesPrice: 1050.00,
      hsnCode: '85076000',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    // Additional Xiaomi Items
    await createItemIfNotExists({
      itemCode: 'XIA-RN10-DISP-01',
      barcode: '8901234567914',
      itemName: 'Redmi Note 10 Display Assembly',
      description: 'Super AMOLED display with digitizer for Redmi Note 10',
      modelVariant: 'AMOLED',
      brandId: xiaomiBrand.id,
      modelId: redmiNote10Model.id,
      categoryId: displayCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 2800.00,
      salesPrice: 4500.00,
      hsnCode: '85177090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    await createItemIfNotExists({
      itemCode: 'XIA-RN11-DISP-01',
      barcode: '8901234567915',
      itemName: 'Redmi Note 11 Display Assembly',
      description: 'AMOLED display with digitizer for Redmi Note 11',
      modelVariant: 'AMOLED',
      brandId: xiaomiBrand.id,
      modelId: redmiNote11Model.id,
      categoryId: displayCategory.id,
      unitId: pieceUnit.id,
      purchasePrice: 3200.00,
      salesPrice: 4900.00,
      hsnCode: '85177090',
      gstRateId: gst18.id,
      taxType: TaxType.IGST,
      isActive: true,
      companyId: company.id,
    });

    console.log('Items created successfully');
    console.log('\n✅ Seed completed successfully!');

  } catch (error) {
    console.error('Error seeding items:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to create unit if not exists
async function createUnitIfNotExists(data: {
  name: string;
  code: string;
  symbol: string;
  companyId: string;
}) {
  const existing = await prisma.itemUnit.findFirst({
    where: {
      code: data.code,
    },
  });

  if (existing) {
    console.log(`Unit already exists: ${data.name}`);
    return existing;
  }

  const unit = await prisma.itemUnit.create({
    data: {
      ...data,
      isActive: true,
    },
  });

  console.log(`Created unit: ${data.name}`);
  return unit;
}

// Helper function to create GST rate if not exists
async function createGSTRateIfNotExists(data: {
  name: string;
  rate: number;
  companyId: string;
}) {
  const existing = await prisma.itemGSTRate.findFirst({
    where: {
      name: data.name,
      companyId: data.companyId,
    },
  });

  if (existing) {
    console.log(`GST rate already exists: ${data.name}`);
    return existing;
  }

  const gstRate = await prisma.itemGSTRate.create({
    data: {
      ...data,
      isActive: true,
    },
  });

  console.log(`Created GST rate: ${data.name}`);
  return gstRate;
}

// Helper function to create brand if not exists
async function createBrandIfNotExists(data: {
  name: string;
  code: string;
  description: string;
  companyId: string;
}) {
  const existing = await prisma.itemBrand.findFirst({
    where: {
      name: data.name,
      companyId: data.companyId,
    },
  });

  if (existing) {
    console.log(`Brand already exists: ${data.name}`);
    return existing;
  }

  const brand = await prisma.itemBrand.create({
    data: {
      ...data,
      isActive: true,
    },
  });

  console.log(`Created brand: ${data.name}`);
  return brand;
}

// Helper function to create model if not exists
async function createModelIfNotExists(data: {
  name: string;
  code: string;
  brandId: string;
  companyId: string;
}) {
  const existing = await prisma.itemModel.findFirst({
    where: {
      code: data.code,
      brandId: data.brandId,
      companyId: data.companyId,
    },
  });

  if (existing) {
    console.log(`Model already exists: ${data.name}`);
    return existing;
  }

  const model = await prisma.itemModel.create({
    data: {
      ...data,
      isActive: true,
    },
  });

  console.log(`Created model: ${data.name}`);
  return model;
}

// Helper function to create item if not exists
async function createItemIfNotExists(data: any) {
  const existing = await prisma.item.findFirst({
    where: {
      itemCode: data.itemCode,
      companyId: data.companyId,
    },
  });

  if (existing) {
    console.log(`Item already exists: ${data.itemName}`);
    return existing;
  }

  const item = await prisma.item.create({
    data,
  });

  console.log(`Created item: ${data.itemName}`);
  return item;
}

// Run the seed
seedItems()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
