import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const themeTemplates = [
  {
    name: 'Professional Blue',
    description: 'Clean and professional theme with blue accents - perfect for corporate invoices',
    primaryColor: '#2563EB',
    secondaryColor: '#3B82F6',
    headerBackgroundColor: '#1E40AF',
    headerTextColor: '#FFFFFF',
    isDefault: true,
  },
  {
    name: 'Modern Red',
    description: 'Bold and energetic theme with red tones - great for making an impact',
    primaryColor: '#DC2626',
    secondaryColor: '#EF4444',
    headerBackgroundColor: '#991B1B',
    headerTextColor: '#FFFFFF',
    isDefault: false,
  },
  {
    name: 'Classic Green',
    description: 'Traditional and trustworthy theme with green colors - ideal for financial documents',
    primaryColor: '#059669',
    secondaryColor: '#10B981',
    headerBackgroundColor: '#047857',
    headerTextColor: '#FFFFFF',
    isDefault: false,
  },
  {
    name: 'Elegant Purple',
    description: 'Creative and premium theme with purple accents - perfect for luxury services',
    primaryColor: '#7C3AED',
    secondaryColor: '#8B5CF6',
    headerBackgroundColor: '#5B21B6',
    headerTextColor: '#FFFFFF',
    isDefault: false,
  },
  {
    name: 'Minimalist Black',
    description: 'Clean and modern theme with black tones - sophisticated and timeless',
    primaryColor: '#1F2937',
    secondaryColor: '#374151',
    headerBackgroundColor: '#111827',
    headerTextColor: '#FFFFFF',
    isDefault: false,
  },
  {
    name: 'Warm Orange',
    description: 'Friendly and approachable theme with orange colors - great for service businesses',
    primaryColor: '#EA580C',
    secondaryColor: '#F97316',
    headerBackgroundColor: '#C2410C',
    headerTextColor: '#FFFFFF',
    isDefault: false,
  },
  {
    name: 'Royal Indigo',
    description: 'Distinguished and elegant theme with indigo tones - perfect for premium brands',
    primaryColor: '#4F46E5',
    secondaryColor: '#6366F1',
    headerBackgroundColor: '#3730A3',
    headerTextColor: '#FFFFFF',
    isDefault: false,
  },
  {
    name: 'Fresh Teal',
    description: 'Modern and refreshing theme with teal colors - ideal for tech and creative services',
    primaryColor: '#0D9488',
    secondaryColor: '#14B8A6',
    headerBackgroundColor: '#0F766E',
    headerTextColor: '#FFFFFF',
    isDefault: false,
  },
];

async function createMultipleThemes() {
  try {
    // Get the first company
    const company = await prisma.company.findFirst();

    if (!company) {
      console.error('❌ No company found. Please create a company first.');
      return;
    }

    // Get the first admin user
    const user = await prisma.user.findFirst({
      where: {
        companyId: company.id,
        role: { in: ['SUPER_ADMIN', 'ADMIN'] }
      }
    });

    if (!user) {
      console.error('❌ No admin user found.');
      return;
    }

    console.log(`\n🎨 Creating ${themeTemplates.length} theme styles for ${company.name}...\n`);

    // Create all themes
    for (const template of themeTemplates) {
      // Check if theme already exists
      const existingTheme = await prisma.theme.findFirst({
        where: {
          companyId: company.id,
          name: template.name,
          branchId: null,
        }
      });

      if (existingTheme) {
        console.log(`⏭️  Skipped: "${template.name}" (already exists)`);
        continue;
      }

      // If this is the default theme, unset any existing defaults
      if (template.isDefault) {
        await prisma.theme.updateMany({
          where: {
            companyId: company.id,
            branchId: null,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const theme = await prisma.theme.create({
        data: {
          name: template.name,
          description: template.description,
          primaryColor: template.primaryColor,
          secondaryColor: template.secondaryColor,
          headerBackgroundColor: template.headerBackgroundColor,
          headerTextColor: template.headerTextColor,
          fontFamily: 'Helvetica',
          fontSize: 10,
          showBranchInfo: true,
          showTermsAndConditions: true,
          termsAndConditions: 'Payment is due within 30 days. Late payments may incur additional charges. All sales are final unless otherwise stated. Goods once sold cannot be returned or exchanged.',
          footerText: 'Thank you for your business! We appreciate your trust in our services.',
          isDefault: template.isDefault,
          isActive: true,
          companyId: company.id,
          branchId: null,
          createdBy: user.id,
        },
      });

      console.log(`✅ Created: "${theme.name}" ${theme.isDefault ? '(DEFAULT)' : ''}`);
      console.log(`   Colors: ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.headerBackgroundColor}`);
    }

    console.log(`\n🎉 Successfully created all theme styles!`);
    console.log(`\n📌 Summary:`);
    const allThemes = await prisma.theme.findMany({
      where: {
        companyId: company.id,
        branchId: null,
      },
      select: {
        name: true,
        isDefault: true,
        isActive: true,
        primaryColor: true,
      },
    });

    allThemes.forEach((theme) => {
      console.log(`   • ${theme.name} - ${theme.primaryColor} ${theme.isDefault ? '⭐ DEFAULT' : ''}`);
    });

  } catch (error) {
    console.error('❌ Error creating themes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMultipleThemes();
