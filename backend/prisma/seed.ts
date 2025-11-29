import { PrismaClient, UserRole, ServiceStatus, PaymentStatus, InventoryCategory, GSTRate, TaxType, Unit } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Company
  const company = await prisma.company.create({
    data: {
      name: 'DeenMobiles Service Center',
      email: 'info@deenmobiles.com',
      phone: '+1234567890',
      address: '123 Main Street, City, State 12345',
      isActive: true,
    },
  });

  console.log('✅ Created company:', company.name);

  // Create Master Data
  console.log('🔧 Creating master data...');

  // Payment Methods
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.create({
      data: {
        name: 'Cash',
        code: 'CASH',
        description: 'Cash payment',
        companyId: company.id,
      },
    }),
    prisma.paymentMethod.create({
      data: {
        name: 'Card',
        code: 'CARD',
        description: 'Credit/Debit card payment',
        companyId: company.id,
      },
    }),
    prisma.paymentMethod.create({
      data: {
        name: 'UPI',
        code: 'UPI',
        description: 'UPI payment (Google Pay, PhonePe, etc.)',
        companyId: company.id,
      },
    }),
    prisma.paymentMethod.create({
      data: {
        name: 'Bank Transfer',
        code: 'BANK_TRANSFER',
        description: 'Bank transfer/NEFT/RTGS',
        companyId: company.id,
      },
    }),
    prisma.paymentMethod.create({
      data: {
        name: 'Cheque',
        code: 'CHEQUE',
        description: 'Cheque payment',
        companyId: company.id,
      },
    }),
    prisma.paymentMethod.create({
      data: {
        name: 'Other',
        code: 'OTHER',
        description: 'Other payment methods',
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Created', paymentMethods.length, 'payment methods');

  // Item Categories
  const categories = await Promise.all([
    prisma.itemCategory.create({
      data: {
        name: 'Display',
        code: 'DISPLAY',
        description: 'Display screens and LCD panels',
        companyId: company.id,
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: 'Battery',
        code: 'BATTERY',
        description: 'Batteries and power cells',
        companyId: company.id,
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: 'Charger',
        code: 'CHARGER',
        description: 'Chargers and charging adapters',
        companyId: company.id,
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: 'Cable',
        code: 'CABLE',
        description: 'Cables and connectors',
        companyId: company.id,
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: 'Audio',
        code: 'AUDIO',
        description: 'Audio components (speakers, microphones)',
        companyId: company.id,
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: 'Camera',
        code: 'CAMERA',
        description: 'Camera modules and components',
        companyId: company.id,
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: 'Case/Cover',
        code: 'CASE_COVER',
        description: 'Phone cases and protective covers',
        companyId: company.id,
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: 'Screen Protector',
        code: 'SCREEN_PROTECTOR',
        description: 'Screen protectors and tempered glass',
        companyId: company.id,
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: 'Accessory',
        code: 'ACCESSORY',
        description: 'General accessories',
        companyId: company.id,
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: 'Electrical',
        code: 'ELECTRICAL',
        description: 'Electrical components',
        companyId: company.id,
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: 'Mechanical',
        code: 'MECHANICAL',
        description: 'Mechanical parts and components',
        companyId: company.id,
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: 'Other',
        code: 'OTHER',
        description: 'Other miscellaneous items',
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Created', categories.length, 'item categories');

  // Item Units
  const units = await Promise.all([
    prisma.itemUnit.create({
      data: {
        name: 'Piece',
        code: 'PIECE',
        symbol: 'pc',
        description: 'Individual pieces or units',
        companyId: company.id,
      },
    }),
    prisma.itemUnit.create({
      data: {
        name: 'Set',
        code: 'SET',
        symbol: 'set',
        description: 'Set of items',
        companyId: company.id,
      },
    }),
    prisma.itemUnit.create({
      data: {
        name: 'Box',
        code: 'BOX',
        symbol: 'box',
        description: 'Box or package',
        companyId: company.id,
      },
    }),
    prisma.itemUnit.create({
      data: {
        name: 'Meter',
        code: 'METER',
        symbol: 'm',
        description: 'Meters (length)',
        companyId: company.id,
      },
    }),
    prisma.itemUnit.create({
      data: {
        name: 'Roll',
        code: 'ROLL',
        symbol: 'roll',
        description: 'Roll of material',
        companyId: company.id,
      },
    }),
    prisma.itemUnit.create({
      data: {
        name: 'Kilogram',
        code: 'KILOGRAM',
        symbol: 'kg',
        description: 'Kilograms (weight)',
        companyId: company.id,
      },
    }),
    prisma.itemUnit.create({
      data: {
        name: 'Liter',
        code: 'LITER',
        symbol: 'L',
        description: 'Liters (volume)',
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Created', units.length, 'item units');

  // Item GST Rates
  const gstRates = await Promise.all([
    prisma.itemGSTRate.create({
      data: {
        name: 'GST 0%',
        rate: 0.00,
        description: 'Zero GST rate',
        companyId: company.id,
      },
    }),
    prisma.itemGSTRate.create({
      data: {
        name: 'GST 5%',
        rate: 5.00,
        description: '5% GST rate',
        companyId: company.id,
      },
    }),
    prisma.itemGSTRate.create({
      data: {
        name: 'GST 12%',
        rate: 12.00,
        description: '12% GST rate',
        companyId: company.id,
      },
    }),
    prisma.itemGSTRate.create({
      data: {
        name: 'GST 18%',
        rate: 18.00,
        description: '18% GST rate',
        companyId: company.id,
      },
    }),
    prisma.itemGSTRate.create({
      data: {
        name: 'GST 28%',
        rate: 28.00,
        description: '28% GST rate',
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Created', gstRates.length, 'GST rates');

  // Create Permissions
  const permissions = await Promise.all([
    // Branch permissions
    prisma.permission.create({ data: { name: 'branch:view', description: 'View branches', resource: 'branch', action: 'view' } }),
    prisma.permission.create({ data: { name: 'branch:create', description: 'Create new branches', resource: 'branch', action: 'create' } }),
    prisma.permission.create({ data: { name: 'branch:update', description: 'Update branch details', resource: 'branch', action: 'update' } }),
    prisma.permission.create({ data: { name: 'branch:delete', description: 'Delete branches', resource: 'branch', action: 'delete' } }),

    // Employee permissions
    prisma.permission.create({ data: { name: 'employee:view', description: 'View employees', resource: 'employee', action: 'view' } }),
    prisma.permission.create({ data: { name: 'employee:create', description: 'Create new employees', resource: 'employee', action: 'create' } }),
    prisma.permission.create({ data: { name: 'employee:update', description: 'Update employee details', resource: 'employee', action: 'update' } }),
    prisma.permission.create({ data: { name: 'employee:delete', description: 'Delete employees', resource: 'employee', action: 'delete' } }),

    // Customer permissions
    prisma.permission.create({ data: { name: 'customer:view', description: 'View customers', resource: 'customer', action: 'view' } }),
    prisma.permission.create({ data: { name: 'customer:create', description: 'Create new customers', resource: 'customer', action: 'create' } }),
    prisma.permission.create({ data: { name: 'customer:update', description: 'Update customer details', resource: 'customer', action: 'update' } }),
    prisma.permission.create({ data: { name: 'customer:delete', description: 'Delete customers', resource: 'customer', action: 'delete' } }),

    // Service permissions
    prisma.permission.create({ data: { name: 'service:view', description: 'View services', resource: 'service', action: 'view' } }),
    prisma.permission.create({ data: { name: 'service:create', description: 'Create new services', resource: 'service', action: 'create' } }),
    prisma.permission.create({ data: { name: 'service:update', description: 'Update service details', resource: 'service', action: 'update' } }),
    prisma.permission.create({ data: { name: 'service:delete', description: 'Delete services', resource: 'service', action: 'delete' } }),
    prisma.permission.create({ data: { name: 'service:assign', description: 'Assign services to technicians', resource: 'service', action: 'assign' } }),

    // Part/Inventory permissions
    prisma.permission.create({ data: { name: 'part:view', description: 'View parts inventory', resource: 'part', action: 'view' } }),
    prisma.permission.create({ data: { name: 'part:create', description: 'Add new parts to inventory', resource: 'part', action: 'create' } }),
    prisma.permission.create({ data: { name: 'part:update', description: 'Update part details', resource: 'part', action: 'update' } }),
    prisma.permission.create({ data: { name: 'part:delete', description: 'Delete parts from inventory', resource: 'part', action: 'delete' } }),

    // Invoice permissions
    prisma.permission.create({ data: { name: 'invoice:view', description: 'View invoices', resource: 'invoice', action: 'view' } }),
    prisma.permission.create({ data: { name: 'invoice:create', description: 'Create invoices', resource: 'invoice', action: 'create' } }),
    prisma.permission.create({ data: { name: 'invoice:update', description: 'Update invoices', resource: 'invoice', action: 'update' } }),
    prisma.permission.create({ data: { name: 'invoice:delete', description: 'Delete invoices', resource: 'invoice', action: 'delete' } }),

    // Payment permissions
    prisma.permission.create({ data: { name: 'payment:view', description: 'View payments', resource: 'payment', action: 'view' } }),
    prisma.permission.create({ data: { name: 'payment:create', description: 'Record payments', resource: 'payment', action: 'create' } }),

    // Role permissions
    prisma.permission.create({ data: { name: 'role:view', description: 'View roles', resource: 'role', action: 'view' } }),
    prisma.permission.create({ data: { name: 'role:create', description: 'Create custom roles', resource: 'role', action: 'create' } }),
    prisma.permission.create({ data: { name: 'role:update', description: 'Update roles', resource: 'role', action: 'update' } }),
    prisma.permission.create({ data: { name: 'role:delete', description: 'Delete roles', resource: 'role', action: 'delete' } }),

    // Dashboard permissions
    prisma.permission.create({ data: { name: 'dashboard:view', description: 'View dashboard analytics', resource: 'dashboard', action: 'view' } }),

    // Report permissions
    prisma.permission.create({ data: { name: 'report:view', description: 'View reports', resource: 'report', action: 'view' } }),
    prisma.permission.create({ data: { name: 'report:export', description: 'Export reports', resource: 'report', action: 'export' } }),
  ]);

  console.log('✅ Created', permissions.length, 'permissions');

  // Create System Roles with Permissions
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Administrator',
      description: 'Full system access with all permissions',
      isSystemRole: true,
      permissions: {
        create: permissions.map(p => ({ permissionId: p.id }))
      }
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: 'Administrator',
      description: 'Administrative access without system role management',
      isSystemRole: true,
      permissions: {
        create: permissions
          .filter(p => !p.name.startsWith('role:delete')) // Can't delete roles
          .map(p => ({ permissionId: p.id }))
      }
    },
  });

  const branchAdminRole = await prisma.role.create({
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

  const managerRole = await prisma.role.create({
    data: {
      name: 'Manager',
      description: 'Manage branch operations, view reports',
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
            (p.resource === 'employee' && p.action === 'view')
          )
          .map(p => ({ permissionId: p.id }))
      }
    },
  });

  const serviceAdminRole = await prisma.role.create({
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

  const serviceManagerRole = await prisma.role.create({
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

  const technicianRole = await prisma.role.create({
    data: {
      name: 'Technician',
      description: 'Handle service repairs and update service status',
      isSystemRole: true,
      permissions: {
        create: permissions
          .filter(p =>
            (p.resource === 'service' && ['view', 'update'].includes(p.action)) ||
            (p.resource === 'customer' && p.action === 'view') ||
            (p.resource === 'part' && p.action === 'view')
          )
          .map(p => ({ permissionId: p.id }))
      }
    },
  });

  const receptionistRole = await prisma.role.create({
    data: {
      name: 'Receptionist',
      description: 'Customer intake, service creation, and basic operations',
      isSystemRole: true,
      permissions: {
        create: permissions
          .filter(p =>
            p.resource === 'customer' ||
            (p.resource === 'service' && ['view', 'create', 'update'].includes(p.action)) ||
            (p.resource === 'payment' && p.action === 'create') ||
            (p.resource === 'invoice' && p.action === 'view')
          )
          .map(p => ({ permissionId: p.id }))
      }
    },
  });

  const customerSupportRole = await prisma.role.create({
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

  console.log('✅ Created 9 system roles:', superAdminRole.name, adminRole.name, branchAdminRole.name, managerRole.name, serviceAdminRole.name, serviceManagerRole.name, technicianRole.name, receptionistRole.name, customerSupportRole.name);

  // Create Branches
  const mainBranch = await prisma.branch.create({
    data: {
      name: 'Main Branch',
      code: 'MAIN-001',
      companyId: company.id,
      address: '123 Main Street, City, State 12345',
      phone: '+1234567890',
      email: 'main@deenmobiles.com',
      isActive: true,
    },
  });

  const secondBranch = await prisma.branch.create({
    data: {
      name: 'Downtown Branch',
      code: 'DOWN-001',
      companyId: company.id,
      address: '456 Downtown Ave, City, State 12345',
      phone: '+1234567891',
      email: 'downtown@deenmobiles.com',
      isActive: true,
    },
  });

  const tptBranch = await prisma.branch.create({
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

  console.log('✅ Created branches:', mainBranch.name, secondBranch.name, tptBranch.name);

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@deenmobiles.com',
      username: 'admin',
      password: hashedPassword,
      name: 'Super Admin',
      phone: '+1234567890',
      role: UserRole.SUPER_ADMIN,
      roleId: superAdminRole.id,
      companyId: company.id,
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@deenmobiles.com',
      username: 'manager',
      password: hashedPassword,
      name: 'Branch Manager',
      phone: '+1234567891',
      role: UserRole.MANAGER,
      roleId: managerRole.id,
      companyId: company.id,
      branchId: mainBranch.id,
      isActive: true,
    },
  });

  const technician1 = await prisma.user.create({
    data: {
      email: 'tech1@deenmobiles.com',
      username: 'tech1',
      password: hashedPassword,
      name: 'John Technician',
      phone: '+1234567892',
      role: UserRole.TECHNICIAN,
      roleId: technicianRole.id,
      companyId: company.id,
      branchId: mainBranch.id,
      isActive: true,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const technician2 = await prisma.user.create({
    data: {
      email: 'tech2@deenmobiles.com',
      username: 'tech2',
      password: hashedPassword,
      name: 'Jane Technician',
      phone: '+1234567893',
      role: UserRole.TECHNICIAN,
      roleId: technicianRole.id,
      companyId: company.id,
      branchId: secondBranch.id,
      isActive: true,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const receptionist = await prisma.user.create({
    data: {
      email: 'reception@deenmobiles.com',
      username: 'reception',
      password: hashedPassword,
      name: 'Sarah Receptionist',
      phone: '+1234567894',
      role: UserRole.RECEPTIONIST,
      roleId: receptionistRole.id,
      companyId: company.id,
      branchId: mainBranch.id,
      isActive: true,
    },
  });

  console.log('✅ Created users: Super Admin, Manager, 2 Technicians, Receptionist');
  console.log('📧 All users have email/password or username/password: [email or username]/password123');

  // Create Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Michael Johnson',
        email: 'michael@example.com',
        phone: '+1555000001',
        address: '789 Oak Street, City, State',
        companyId: company.id,
        branchId: mainBranch.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Emily Davis',
        phone: '+1555000002',
        address: '321 Pine Avenue, City, State',
        companyId: company.id,
        branchId: mainBranch.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Robert Brown',
        email: 'robert@example.com',
        phone: '+1555000003',
        companyId: company.id,
        branchId: secondBranch.id,
      },
    }),
  ]);

  console.log('✅ Created', customers.length, 'customers');

  // Create Parts
  const parts = await Promise.all([
    prisma.part.create({
      data: {
        name: 'iPhone 12 Screen',
        partNumber: 'IP12-SCR-001',
        description: 'Original iPhone 12 display screen',
        costPrice: 80.0,
        sellingPrice: 150.0,
        quantity: 25,
        minQuantity: 5,
        companyId: company.id,
      },
    }),
    prisma.part.create({
      data: {
        name: 'Samsung S21 Battery',
        partNumber: 'SS21-BAT-001',
        description: 'Original Samsung S21 battery',
        costPrice: 30.0,
        sellingPrice: 60.0,
        quantity: 40,
        minQuantity: 10,
        companyId: company.id,
      },
    }),
    prisma.part.create({
      data: {
        name: 'Universal Charging Port',
        partNumber: 'UNI-CHG-001',
        description: 'USB-C charging port module',
        costPrice: 10.0,
        sellingPrice: 25.0,
        quantity: 60,
        minQuantity: 15,
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Created', parts.length, 'parts in inventory');

  // Create Suppliers for TPT Branch
  const supplier1 = await prisma.supplier.create({
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
    },
  });

  const supplier2 = await prisma.supplier.create({
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
    },
  });

  const supplier3 = await prisma.supplier.create({
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
    },
  });

  console.log('✅ Created 3 suppliers');

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

  // Create Services
  const service1 = await prisma.service.create({
    data: {
      ticketNumber: 'TKT-2024-0001',
      customerId: customers[0].id,
      deviceModel: 'iPhone 12',
      deviceIMEI: '123456789012345',
      issue: 'Cracked screen, touch not working properly',
      diagnosis: 'Display replacement required',
      estimatedCost: 150.0,
      actualCost: 150.0,
      advancePayment: 50.0,
      status: ServiceStatus.COMPLETED,
      assignedToId: technician1.id,
      companyId: company.id,
      branchId: mainBranch.id,
      completedAt: new Date(),
    },
  });

  const service2 = await prisma.service.create({
    data: {
      ticketNumber: 'TKT-2024-0002',
      customerId: customers[1].id,
      deviceModel: 'Samsung Galaxy S21',
      issue: 'Battery draining quickly, phone overheating',
      status: ServiceStatus.IN_PROGRESS,
      estimatedCost: 60.0,
      advancePayment: 20.0,
      assignedToId: technician1.id,
      companyId: company.id,
      branchId: mainBranch.id,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const service3 = await prisma.service.create({
    data: {
      ticketNumber: 'TKT-2024-0003',
      customerId: customers[2].id,
      deviceModel: 'iPhone 13',
      deviceIMEI: '987654321098765',
      issue: 'Charging port not working',
      status: ServiceStatus.PENDING,
      estimatedCost: 25.0,
      advancePayment: 0.0,
      companyId: company.id,
      branchId: secondBranch.id,
    },
  });

  console.log('✅ Created', 3, 'service tickets');

  // Add parts used for completed service
  await prisma.servicePart.create({
    data: {
      serviceId: service1.id,
      partId: parts[0].id,
      quantity: 1,
      unitPrice: 150.0,
      totalPrice: 150.0,
    },
  });

  // Create invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-0001',
      serviceId: service1.id,
      totalAmount: 150.0,
      paidAmount: 150.0,
      balanceAmount: 0.0,
      paymentStatus: PaymentStatus.PAID,
      companyId: company.id,
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 50.0,
      paymentMethodId: paymentMethods[0].id, // Cash
      notes: 'Advance payment',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 100.0,
      paymentMethodId: paymentMethods[1].id, // Card
      notes: 'Final payment',
    },
  });

  console.log('✅ Created invoices and payments');

  // Create notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: technician1.id,
        serviceId: service2.id,
        title: 'Service Assigned',
        message: 'You have been assigned service ticket TKT-2024-0002',
      },
    }),
    prisma.notification.create({
      data: {
        userId: manager.id,
        serviceId: service1.id,
        title: 'Service Completed',
        message: 'Service ticket TKT-2024-0001 has been completed',
        isRead: true,
      },
    }),
  ]);

  console.log('✅ Created notifications');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📝 Login Credentials:');
  console.log('-------------------');
  console.log('Super Admin:   admin@deenmobiles.com OR admin / password123');
  console.log('Manager:       manager@deenmobiles.com OR manager / password123');
  console.log('Technician 1:  tech1@deenmobiles.com OR tech1 / password123');
  console.log('Technician 2:  tech2@deenmobiles.com OR tech2 / password123');
  console.log('Receptionist:  reception@deenmobiles.com OR reception / password123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
