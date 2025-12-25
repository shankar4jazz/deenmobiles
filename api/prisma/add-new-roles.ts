import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addNewRoles() {
  console.log('🌱 Adding new branch-specific system roles...');

  try {
    // Fetch all permissions
    const permissions = await prisma.permission.findMany();

    // Check if roles already exist
    const existingBranchAdmin = await prisma.role.findFirst({
      where: { name: 'Branch Admin', isSystemRole: true }
    });

    const existingServiceAdmin = await prisma.role.findFirst({
      where: { name: 'Service Admin', isSystemRole: true }
    });

    const existingServiceManager = await prisma.role.findFirst({
      where: { name: 'Service Manager', isSystemRole: true }
    });

    const existingCustomerSupport = await prisma.role.findFirst({
      where: { name: 'Customer Support', isSystemRole: true }
    });

    // Create Branch Admin role if it doesn't exist
    if (!existingBranchAdmin) {
      await prisma.role.create({
        data: {
          name: 'Branch Admin',
          description: 'Full branch-level administrative access including employee management',
          isSystemRole: true,
          permissions: {
            create: permissions
              .filter(p =>
                p.resource === 'dashboard' ||
                p.resource === 'report' ||
                p.resource === 'service' ||
                p.resource === 'customer' ||
                p.resource === 'part' ||
                p.resource === 'invoice' ||
                p.resource === 'payment' ||
                p.resource === 'employee' ||
                (p.resource === 'role' && p.action === 'view')
              )
              .map(p => ({ permissionId: p.id }))
          }
        },
      });
      console.log('✅ Created Branch Admin role');
    } else {
      console.log('⏭️  Branch Admin role already exists');
    }

    // Create Service Admin role if it doesn't exist
    if (!existingServiceAdmin) {
      await prisma.role.create({
        data: {
          name: 'Service Admin',
          description: 'Full control over service operations and assignments',
          isSystemRole: true,
          permissions: {
            create: permissions
              .filter(p =>
                p.resource === 'service' ||
                p.resource === 'customer' ||
                p.resource === 'part' ||
                p.resource === 'invoice' ||
                p.resource === 'payment' ||
                p.resource === 'dashboard'
              )
              .map(p => ({ permissionId: p.id }))
          }
        },
      });
      console.log('✅ Created Service Admin role');
    } else {
      console.log('⏭️  Service Admin role already exists');
    }

    // Create Service Manager role if it doesn't exist
    if (!existingServiceManager) {
      await prisma.role.create({
        data: {
          name: 'Service Manager',
          description: 'Oversee service operations and technician assignments',
          isSystemRole: true,
          permissions: {
            create: permissions
              .filter(p =>
                (p.resource === 'service' && p.action !== 'delete') ||
                (p.resource === 'customer' && ['view', 'update'].includes(p.action)) ||
                (p.resource === 'part' && p.action === 'view') ||
                (p.resource === 'invoice' && p.action === 'view') ||
                p.resource === 'dashboard'
              )
              .map(p => ({ permissionId: p.id }))
          }
        },
      });
      console.log('✅ Created Service Manager role');
    } else {
      console.log('⏭️  Service Manager role already exists');
    }

    // Create Customer Support role if it doesn't exist
    if (!existingCustomerSupport) {
      await prisma.role.create({
        data: {
          name: 'Customer Support',
          description: 'Handle customer inquiries and service status updates',
          isSystemRole: true,
          permissions: {
            create: permissions
              .filter(p =>
                (p.resource === 'customer' && ['view', 'update'].includes(p.action)) ||
                (p.resource === 'service' && ['view', 'update'].includes(p.action)) ||
                (p.resource === 'invoice' && p.action === 'view')
              )
              .map(p => ({ permissionId: p.id }))
          }
        },
      });
      console.log('✅ Created Customer Support role');
    } else {
      console.log('⏭️  Customer Support role already exists');
    }

    console.log('');
    console.log('🎉 New system roles added successfully!');
    console.log('');
  } catch (error) {
    console.error('❌ Error adding roles:', error);
    throw error;
  }
}

addNewRoles()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
