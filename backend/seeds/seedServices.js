const { PrismaClient, ServiceStatus, PaymentStatus } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper functions
const randomPastDate = (days = 90) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date;
};

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Service issues by category
const serviceIssues = {
  'DISPLAY_REPLACE': [
    'Screen cracked after drop',
    'Display not responding to touch',
    'Black spots on screen',
    'Lines appearing on display',
    'Screen flickering',
  ],
  'BATTERY_REPLACE': [
    'Battery draining very fast',
    'Phone shutting down randomly',
    'Battery swollen',
    'Not charging properly',
    'Battery health below 70%',
  ],
  'CHARGING_PORT': [
    'Charging port loose',
    'Phone not charging at all',
    'Charging cable keeps disconnecting',
    'Port damaged by liquid',
  ],
  'CAMERA_REPAIR': [
    'Camera not focusing',
    'Rear camera showing black screen',
    'Front camera not working',
    'Camera glass broken',
  ],
  'SPEAKER_REPAIR': [
    'No sound from earpiece',
    'Speaker making crackling noise',
    'Low volume issue',
    'Sound distorted during calls',
  ],
  'SOFTWARE': [
    'Phone running very slow',
    'Apps crashing frequently',
    'Software update stuck',
    'Phone keeps restarting',
  ],
  'WATER_DAMAGE': [
    'Phone fell in water',
    'Phone not turning on after water exposure',
    'Microphone not working after water damage',
  ],
};

// Device accessories
const commonAccessories = [
  ['Charger', 'Cable'],
  ['Charger', 'Cable', 'Earphones'],
  ['Charger', 'Cable', 'Case'],
  ['Charger', 'Cable', 'Earphones', 'Case'],
  ['Charger'],
  [],
];

// Colors
const phoneColors = ['Black', 'White', 'Blue', 'Silver', 'Gold', 'Red', 'Green', 'Purple', 'Midnight', 'Starlight'];

// Device passwords/patterns
const devicePatterns = ['1234', '0000', '1111', '9999', 'Pattern Lock', 'Face ID', 'Fingerprint'];

async function seedServices() {
  console.log('🔧 Seeding Services, Customer Devices, and Related Data...\n');

  try {
    // Get company
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new Error('No company found.');
    }

    // Get all branches
    const branches = await prisma.branch.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true, code: true },
    });

    console.log(`✅ Found ${branches.length} branches\n`);

    // Get service categories
    const serviceCategories = await prisma.serviceCategory.findMany({
      where: { companyId: company.id, isActive: true },
    });

    // Get device conditions
    const deviceConditions = await prisma.deviceCondition.findMany({
      where: { companyId: company.id, isActive: true },
    });

    // Get brands and models
    const brands = await prisma.itemBrand.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true },
    });

    const models = await prisma.itemModel.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true, brandId: true },
    });

    // Get payment methods
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { companyId: company.id },
    });

    // Get parts
    const parts = await prisma.part.findMany({
      where: { companyId: company.id },
      take: 20,
    });

    let totalDevices = 0;
    let totalServices = 0;
    let totalInvoices = 0;
    let totalRatings = 0;

    // Process each branch
    for (const branch of branches) {
      console.log(`🏪 Processing ${branch.name} (${branch.code})...`);

      // Get customers for this branch
      const customers = await prisma.customer.findMany({
        where: {
          branchId: branch.id,
          companyId: company.id,
        },
        take: 8, // Process 8 customers per branch
      });

      if (customers.length === 0) {
        console.log(`   ⚠️  No customers found\n`);
        continue;
      }

      // Get technicians for this branch
      const technicians = await prisma.user.findMany({
        where: {
          branchId: branch.id,
          companyId: company.id,
          role: { in: ['TECHNICIAN', 'MANAGER'] },
        },
      });

      let branchDevices = 0;
      let branchServices = 0;
      let branchInvoices = 0;

      // Create 1-2 devices per customer
      for (const customer of customers) {
        const numDevices = randomInt(1, 2);

        for (let d = 0; d < numDevices; d++) {
          try {
            // Select random brand and model
            const brand = randomElement(brands);
            const brandModels = models.filter(m => m.brandId === brand.id);
            if (brandModels.length === 0) continue;

            const model = randomElement(brandModels);
            const condition = deviceConditions.length > 0 ? randomElement(deviceConditions) : null;

            // Create customer device
            const device = await prisma.customerDevice.create({
              data: {
                customerId: customer.id,
                brandId: brand.id,
                modelId: model.id,
                imei: `${randomInt(100000000000000, 999999999999999)}`,
                color: randomElement(phoneColors),
                password: randomElement(devicePatterns),
                conditionId: condition?.id,
                accessories: randomElement(commonAccessories),
                purchaseYear: randomInt(2020, 2024),
                companyId: company.id,
                branchId: branch.id,
                isActive: true,
              },
            });

            branchDevices++;
            totalDevices++;

            // Create 1-3 services for this device
            const numServices = randomInt(1, 3);

            for (let s = 0; s < numServices; s++) {
              try {
                // Select service category
                const category = serviceCategories.length > 0 ? randomElement(serviceCategories) : null;
                const categoryCode = category?.code || 'SOFTWARE';

                // Generate ticket number
                const ticketNumber = `${branch.code}-${Date.now()}-${randomInt(1000, 9999)}`;

                // Random service status
                const statuses = [
                  ServiceStatus.PENDING,
                  ServiceStatus.IN_PROGRESS,
                  ServiceStatus.COMPLETED,
                  ServiceStatus.DELIVERED,
                  ServiceStatus.WAITING_PARTS,
                ];
                const status = randomElement(statuses);

                // Service dates
                const createdAt = randomPastDate(60);
                let completedAt = null;
                let deliveredAt = null;

                if (status === ServiceStatus.COMPLETED || status === ServiceStatus.DELIVERED) {
                  completedAt = new Date(createdAt.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000);
                }

                if (status === ServiceStatus.DELIVERED) {
                  deliveredAt = new Date(completedAt.getTime() + randomInt(1, 3) * 24 * 60 * 60 * 1000);
                }

                // Costs
                const estimatedCost = parseFloat(category?.defaultPrice || randomInt(500, 5000));
                const actualCost = status === ServiceStatus.COMPLETED || status === ServiceStatus.DELIVERED
                  ? estimatedCost + randomInt(-200, 500)
                  : null;
                const advancePayment = randomInt(0, 1) > 0.5 ? estimatedCost * 0.3 : 0;

                // Issue and diagnosis
                const issueList = serviceIssues[categoryCode] || ['Device issue reported'];
                const issue = randomElement(issueList);
                const diagnosis = status !== ServiceStatus.PENDING
                  ? `Diagnosed: ${issue}. ${category?.name || 'Repair'} required.`
                  : null;

                // Assigned technician
                const assignedTo = technicians.length > 0 && status !== ServiceStatus.PENDING
                  ? randomElement(technicians)
                  : null;

                // Create service
                const service = await prisma.service.create({
                  data: {
                    ticketNumber,
                    customerId: customer.id,
                    customerDeviceId: device.id,
                    serviceCategoryId: category?.id,
                    deviceModel: `${brand.name} ${model.name}`,
                    deviceIMEI: device.imei,
                    devicePassword: device.password,
                    issue,
                    diagnosis,
                    estimatedCost,
                    actualCost,
                    advancePayment,
                    status,
                    assignedToId: assignedTo?.id,
                    companyId: company.id,
                    branchId: branch.id,
                    createdAt,
                    completedAt,
                    deliveredAt,
                  },
                });

                branchServices++;
                totalServices++;

                // Add parts used if service is in progress or completed
                if ((status === ServiceStatus.IN_PROGRESS || status === ServiceStatus.COMPLETED || status === ServiceStatus.DELIVERED) && parts.length > 0) {
                  const numParts = randomInt(1, 3);
                  for (let p = 0; p < numParts; p++) {
                    const part = randomElement(parts);
                    const quantity = randomInt(1, 2);
                    const unitPrice = part.costPrice ? parseFloat(part.costPrice) : 100;

                    await prisma.servicePart.create({
                      data: {
                        serviceId: service.id,
                        partId: part.id,
                        quantity,
                        unitPrice,
                        totalPrice: quantity * unitPrice,
                      },
                    });
                  }
                }

                // Create invoice and payments for completed/delivered services
                if (status === ServiceStatus.COMPLETED || status === ServiceStatus.DELIVERED) {
                  const finalCost = actualCost || estimatedCost;
                  const paidAmount = status === ServiceStatus.DELIVERED
                    ? finalCost
                    : randomInt(0, 1) > 0.5 ? finalCost : advancePayment;

                  const paymentStatus = paidAmount >= finalCost ? PaymentStatus.PAID
                    : paidAmount > 0 ? PaymentStatus.PARTIAL
                    : PaymentStatus.PENDING;

                  // Create invoice
                  const invoice = await prisma.invoice.create({
                    data: {
                      invoiceNumber: `INV-${ticketNumber}`,
                      serviceId: service.id,
                      totalAmount: finalCost,
                      paidAmount,
                      balanceAmount: finalCost - paidAmount,
                      paymentStatus,
                      companyId: company.id,
                    },
                  });

                  branchInvoices++;
                  totalInvoices++;

                  // Create payment records
                  if (advancePayment > 0) {
                    await prisma.payment.create({
                      data: {
                        invoiceId: invoice.id,
                        amount: advancePayment,
                        paymentMethodId: randomElement(paymentMethods).id,
                        notes: 'Advance payment',
                        createdAt,
                      },
                    });
                  }

                  if (paidAmount > advancePayment) {
                    await prisma.payment.create({
                      data: {
                        invoiceId: invoice.id,
                        amount: paidAmount - advancePayment,
                        paymentMethodId: randomElement(paymentMethods).id,
                        notes: 'Final payment',
                        createdAt: completedAt || new Date(),
                      },
                    });
                  }
                }

                // Add service rating for delivered services
                if (status === ServiceStatus.DELIVERED && randomInt(0, 1) > 0.3) {
                  const rating = randomInt(3, 5);
                  const feedbacks = [
                    'Great service! Very satisfied.',
                    'Good work. Phone working perfectly now.',
                    'Quick and efficient service.',
                    'Professional service. Highly recommended.',
                    'Excellent repair work.',
                  ];

                  await prisma.serviceRating.create({
                    data: {
                      serviceId: service.id,
                      rating,
                      feedback: rating >= 4 ? randomElement(feedbacks) : 'Service was okay.',
                      ratedAt: deliveredAt || new Date(),
                    },
                  });

                  totalRatings++;
                }

              } catch (error) {
                console.log(`      ⚠️  Service error: ${error.message}`);
              }
            }

          } catch (error) {
            console.log(`   ⚠️  Device error: ${error.message}`);
          }
        }
      }

      console.log(`   ✅ Devices: ${branchDevices}, Services: ${branchServices}, Invoices: ${branchInvoices}\n`);
    }

    console.log('═'.repeat(50));
    console.log('📊 Services Seeding Summary:');
    console.log('═'.repeat(50));
    console.log(`   📱 Customer Devices Created: ${totalDevices}`);
    console.log(`   🔧 Services Created: ${totalServices}`);
    console.log(`   📄 Invoices Created: ${totalInvoices}`);
    console.log(`   ⭐ Service Ratings: ${totalRatings}`);
    console.log(`   🏪 Branches Processed: ${branches.length}`);
    console.log('═'.repeat(50));
    console.log('');

  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    await seedServices();
    console.log('🎉 Services seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
