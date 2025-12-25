import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDefaultTheme() {
  try {
    // Get the first company (you can modify this to target a specific company)
    const company = await prisma.company.findFirst();

    if (!company) {
      console.error('No company found. Please create a company first.');
      return;
    }

    // Get the first user to set as creator (admin or super admin)
    const user = await prisma.user.findFirst({
      where: {
        companyId: company.id,
        role: { in: ['SUPER_ADMIN', 'ADMIN'] }
      }
    });

    if (!user) {
      console.error('No admin user found.');
      return;
    }

    // Check if a default theme already exists
    const existingTheme = await prisma.theme.findFirst({
      where: {
        companyId: company.id,
        isDefault: true,
        branchId: null // Global theme
      }
    });

    if (existingTheme) {
      console.log('Default global theme already exists:', existingTheme.name);
      return;
    }

    // Create the default global theme
    const theme = await prisma.theme.create({
      data: {
        name: 'Professional Blue',
        description: 'Default professional theme with blue accents for invoices and estimates',
        primaryColor: '#2563EB', // Blue
        secondaryColor: '#3B82F6', // Light Blue
        headerBackgroundColor: '#1E40AF', // Dark Blue
        headerTextColor: '#FFFFFF', // White
        fontFamily: 'Helvetica',
        fontSize: 10,
        showBranchInfo: true,
        showTermsAndConditions: true,
        termsAndConditions: 'Payment is due within 30 days. Late payments may incur additional charges. All sales are final unless otherwise stated.',
        footerText: 'Thank you for your business!',
        isDefault: true,
        isActive: true,
        companyId: company.id,
        branchId: null, // Global theme (not branch-specific)
        createdBy: user.id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          }
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    console.log('✅ Default global theme created successfully!');
    console.log('Theme Details:');
    console.log('  ID:', theme.id);
    console.log('  Name:', theme.name);
    console.log('  Company:', theme.company.name);
    console.log('  Created By:', theme.createdByUser.name);
    console.log('  Primary Color:', theme.primaryColor);
    console.log('  Secondary Color:', theme.secondaryColor);
    console.log('  Is Default:', theme.isDefault);
    console.log('  Is Active:', theme.isActive);

  } catch (error) {
    console.error('Error creating default theme:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultTheme();
