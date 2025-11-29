import prisma from '../config/database';
import { Logger } from '../utils/logger';

async function seedJobSheetTemplates() {
  try {
    Logger.info('Starting job sheet template seeding...');

    // Get the first company to associate templates with
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new Error('No company found. Please create a company first.');
    }

    // Get the first user to set as creator
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No user found. Please create a user first.');
    }

    // Create categories
    Logger.info('Creating template categories...');

    const warrantyCategory = await prisma.jobSheetTemplateCategory.upsert({
      where: {
        name_companyId: {
          name: 'Warranty Service',
          companyId: company.id,
        },
      },
      update: {},
      create: {
        name: 'Warranty Service',
        description: 'Templates for warranty-covered repairs',
        isActive: true,
        companyId: company.id,
      },
    });

    const paidRepairCategory = await prisma.jobSheetTemplateCategory.upsert({
      where: {
        name_companyId: {
          name: 'Paid Repair',
          companyId: company.id,
        },
      },
      update: {},
      create: {
        name: 'Paid Repair',
        description: 'Templates for customer-paid repairs',
        isActive: true,
        companyId: company.id,
      },
    });

    const insuranceCategory = await prisma.jobSheetTemplateCategory.upsert({
      where: {
        name_companyId: {
          name: 'Insurance Claim',
          companyId: company.id,
        },
      },
      update: {},
      create: {
        name: 'Insurance Claim',
        description: 'Templates for insurance-covered repairs',
        isActive: true,
        companyId: company.id,
      },
    });

    Logger.info('Template categories created successfully');

    // Create templates
    Logger.info('Creating job sheet templates...');

    // Helper function to create or skip template
    const createTemplateIfNotExists = async (data: any) => {
      const existing = await prisma.jobSheetTemplate.findFirst({
        where: {
          name: data.name,
          companyId: data.companyId,
        },
      });

      if (existing) {
        Logger.info(`Template "${data.name}" already exists, skipping...`);
        return existing;
      }

      return await prisma.jobSheetTemplate.create({ data });
    };

    // 1. Standard Service Template (Default)
    await createTemplateIfNotExists({
      name: 'Standard Service Template',
      description: 'Default template for general service requests',
      categoryId: paidRepairCategory.id,
      termsAndConditions: `1. Advance payment is non-refundable.
2. Device must be collected within 7 days of service completion.
3. Company is not responsible for data loss during repair.
4. Warranty: 30 days for parts and 15 days for service.
5. Additional charges may apply for parts replacement.
6. Customer must provide device password if required for testing.
7. Any accessories left with the device are at customer's own risk.`,
      showCustomerSignature: true,
      showAuthorizedSignature: true,
      showCompanyLogo: true,
      showContactDetails: true,
      footerText: 'Thank you for choosing our service. We appreciate your business!',
      isDefault: true,
      isActive: true,
      companyId: company.id,
      createdBy: user.id,
    });

    // 2. Warranty Service Template
    await createTemplateIfNotExists({
      name: 'Warranty Service Template',
      description: 'Template for warranty-covered repairs',
      categoryId: warrantyCategory.id,
      termsAndConditions: `1. This service is covered under manufacturer's warranty.
2. Warranty claim number must be provided.
3. Device must be in original condition with no physical damage.
4. Customer must provide original purchase receipt.
5. Warranty does not cover liquid damage, physical damage, or unauthorized repairs.
6. Service may take 7-15 business days depending on parts availability.
7. Customer will be notified if any charges apply outside warranty coverage.`,
      showCustomerSignature: true,
      showAuthorizedSignature: true,
      showCompanyLogo: true,
      showContactDetails: true,
      footerText: 'Warranty service provided. Please keep this document for your records.',
      isDefault: false,
      isActive: true,
      companyId: company.id,
      createdBy: user.id,
    });

    // 3. Quick Repair Template
    await createTemplateIfNotExists({
      name: 'Quick Repair Template',
      description: 'Simplified template for quick repairs',
      categoryId: paidRepairCategory.id,
      termsAndConditions: `1. Express service - completed within 24 hours.
2. Full payment required before service.
3. No warranty on express service.
4. Customer must collect device within 24 hours of completion.
5. Company not responsible for data loss.`,
      showCustomerSignature: true,
      showAuthorizedSignature: false,
      showCompanyLogo: false,
      showContactDetails: true,
      footerText: 'Express service completed.',
      isDefault: false,
      isActive: true,
      companyId: company.id,
      createdBy: user.id,
    });

    // 4. Insurance Claim Template
    await createTemplateIfNotExists({
      name: 'Insurance Claim Template',
      description: 'Template for insurance-covered repairs',
      categoryId: insuranceCategory.id,
      termsAndConditions: `1. Insurance claim must be approved before service begins.
2. Customer must provide insurance policy number and claim number.
3. Service will be completed as per insurance company guidelines.
4. Any charges beyond insurance coverage will be communicated to customer.
5. Customer must sign off on completed repairs.
6. Device must be collected within 15 days of service completion.
7. All documentation must be provided to insurance company.`,
      showCustomerSignature: true,
      showAuthorizedSignature: true,
      showCompanyLogo: true,
      showContactDetails: true,
      footerText: 'Insurance claim service. Please retain all documents for claim processing.',
      isDefault: false,
      isActive: true,
      companyId: company.id,
      createdBy: user.id,
    });

    // 5. Screen Replacement Template
    await createTemplateIfNotExists({
      name: 'Screen Replacement Template',
      description: 'Specialized template for screen replacements',
      categoryId: paidRepairCategory.id,
      termsAndConditions: `1. Screen replacement warranty: 90 days for defects.
2. Warranty void if device is dropped or damaged after repair.
3. Original screen will not be returned to customer.
4. Device testing required after replacement.
5. Customer must verify screen quality before collection.
6. Touch functionality will be tested before handover.
7. Any additional issues found will be communicated to customer.`,
      showCustomerSignature: true,
      showAuthorizedSignature: true,
      showCompanyLogo: true,
      showContactDetails: true,
      footerText: 'Screen replacement completed. Please handle with care.',
      isDefault: false,
      isActive: true,
      companyId: company.id,
      createdBy: user.id,
    });

    Logger.info('Job sheet templates created successfully');

    // Display summary
    const templateCount = await prisma.jobSheetTemplate.count({
      where: { companyId: company.id },
    });
    const categoryCount = await prisma.jobSheetTemplateCategory.count({
      where: { companyId: company.id },
    });

    Logger.info(`✅ Seeding completed successfully!`);
    Logger.info(`📊 Summary:`);
    Logger.info(`   - ${categoryCount} categories created`);
    Logger.info(`   - ${templateCount} templates created`);
    Logger.info(`   - Company: ${company.name}`);

  } catch (error) {
    Logger.error('Error seeding job sheet templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedJobSheetTemplates()
  .then(() => {
    Logger.info('Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    Logger.error('Seed script failed:', error);
    process.exit(1);
  });
