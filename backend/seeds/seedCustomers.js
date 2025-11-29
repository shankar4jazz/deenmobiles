const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Sample customer data for each branch
const customerData = {
  villupuram: [
    { name: 'Rajesh Kumar', phone: '+91 9876543210', email: 'rajesh.kumar@gmail.com', address: 'No 45, Gandhi Road, Villupuram' },
    { name: 'Priya Sharma', phone: '+91 9876543211', email: 'priya.sharma@gmail.com', address: 'No 78, Bus Stand Road, Villupuram' },
    { name: 'Vijay Anand', phone: '+91 9876543212', email: 'vijay.anand@gmail.com', address: 'No 123, Market Street, Villupuram' },
    { name: 'Lakshmi Devi', phone: '+91 9876543213', email: 'lakshmi.devi@gmail.com', address: 'No 56, Temple Street, Villupuram' },
    { name: 'Murugan S', phone: '+91 9876543214', address: 'No 89, Bazaar Road, Villupuram' },
    { name: 'Anitha Rani', phone: '+91 9876543215', email: 'anitha.rani@gmail.com', address: 'No 234, Station Road, Villupuram' },
    { name: 'Karthik Raja', phone: '+91 9876543216', address: 'No 67, College Road, Villupuram' },
    { name: 'Sowmya Devi', phone: '+91 9876543217', email: 'sowmya.devi@gmail.com', address: 'No 145, Hospital Road, Villupuram' },
    { name: 'Selvam Kumar', phone: '+91 9876543218', address: 'No 98, Park Street, Villupuram' },
    { name: 'Meena Kumari', phone: '+91 9876543219', email: 'meena.kumari@gmail.com', address: 'No 176, Railway Colony, Villupuram' },
  ],
  tirukovilure: [
    { name: 'Suresh Babu', phone: '+91 9876543220', email: 'suresh.babu@gmail.com', address: 'No 12, Main Road, Tirukovilure' },
    { name: 'Kamala Devi', phone: '+91 9876543221', address: 'No 34, Bazaar Street, Tirukovilure' },
    { name: 'Ramesh Kumar', phone: '+91 9876543222', email: 'ramesh.kumar@gmail.com', address: 'No 56, Hospital Road, Tirukovilure' },
    { name: 'Deepa Rani', phone: '+91 9876543223', email: 'deepa.rani@gmail.com', address: 'No 78, School Street, Tirukovilure' },
    { name: 'Ganesh M', phone: '+91 9876543224', address: 'No 90, Temple Road, Tirukovilure' },
    { name: 'Vasanthi S', phone: '+91 9876543225', email: 'vasanthi.s@gmail.com', address: 'No 112, Market Road, Tirukovilure' },
    { name: 'Arun Kumar', phone: '+91 9876543226', address: 'No 134, Station Street, Tirukovilure' },
    { name: 'Revathi Devi', phone: '+91 9876543227', email: 'revathi.devi@gmail.com', address: 'No 156, Bus Stand Road, Tirukovilure' },
    { name: 'Prakash R', phone: '+91 9876543228', address: 'No 178, Park Street, Tirukovilure' },
    { name: 'Malathi K', phone: '+91 9876543229', email: 'malathi.k@gmail.com', address: 'No 190, Gandhi Road, Tirukovilure' },
  ],
  gingee: [
    { name: 'Naveen Kumar', phone: '+91 9876543230', email: 'naveen.kumar@gmail.com', address: 'No 23, Fort Road, Gingee' },
    { name: 'Sangeetha Rani', phone: '+91 9876543231', address: 'No 45, Bazaar Street, Gingee' },
    { name: 'Bala Murugan', phone: '+91 9876543232', email: 'bala.murugan@gmail.com', address: 'No 67, Temple Road, Gingee' },
    { name: 'Kavitha S', phone: '+91 9876543233', email: 'kavitha.s@gmail.com', address: 'No 89, Market Street, Gingee' },
    { name: 'Senthil Kumar', phone: '+91 9876543234', address: 'No 101, Hospital Road, Gingee' },
    { name: 'Sumathi Devi', phone: '+91 9876543235', email: 'sumathi.devi@gmail.com', address: 'No 123, School Street, Gingee' },
    { name: 'Dinesh R', phone: '+91 9876543236', address: 'No 145, Station Road, Gingee' },
    { name: 'Premalatha K', phone: '+91 9876543237', email: 'premalatha.k@gmail.com', address: 'No 167, Bus Stand Road, Gingee' },
    { name: 'Mahesh Kumar', phone: '+91 9876543238', address: 'No 189, Park Street, Gingee' },
    { name: 'Shanthi Devi', phone: '+91 9876543239', email: 'shanthi.devi@gmail.com', address: 'No 201, Gandhi Road, Gingee' },
  ],
  tindivanam: [
    { name: 'Ashok Kumar', phone: '+91 9876543240', email: 'ashok.kumar@gmail.com', address: 'No 14, Main Road, Tindivanam' },
    { name: 'Radhika S', phone: '+91 9876543241', address: 'No 36, Bazaar Street, Tindivanam' },
    { name: 'Vignesh M', phone: '+91 9876543242', email: 'vignesh.m@gmail.com', address: 'No 58, Temple Road, Tindivanam' },
    { name: 'Geetha Rani', phone: '+91 9876543243', email: 'geetha.rani@gmail.com', address: 'No 70, Market Street, Tindivanam' },
    { name: 'Sathish Kumar', phone: '+91 9876543244', address: 'No 92, Hospital Road, Tindivanam' },
    { name: 'Nirmala Devi', phone: '+91 9876543245', email: 'nirmala.devi@gmail.com', address: 'No 114, School Street, Tindivanam' },
    { name: 'Saravanan R', phone: '+91 9876543246', address: 'No 136, Station Road, Tindivanam' },
    { name: 'Indira K', phone: '+91 9876543247', email: 'indira.k@gmail.com', address: 'No 158, Bus Stand Road, Tindivanam' },
    { name: 'Mohan Kumar', phone: '+91 9876543248', address: 'No 170, Park Street, Tindivanam' },
    { name: 'Valli Devi', phone: '+91 9876543249', email: 'valli.devi@gmail.com', address: 'No 192, Gandhi Road, Tindivanam' },
  ],
  mainBranch: [
    { name: 'Arjun Reddy', phone: '+91 9876543250', email: 'arjun.reddy@gmail.com', address: 'No 25, Main Street, City' },
    { name: 'Divya S', phone: '+91 9876543251', address: 'No 47, Park Avenue, City' },
    { name: 'Kumar Swamy', phone: '+91 9876543252', email: 'kumar.swamy@gmail.com', address: 'No 69, Market Road, City' },
    { name: 'Pavithra R', phone: '+91 9876543253', email: 'pavithra.r@gmail.com', address: 'No 81, Temple Street, City' },
    { name: 'Ravi Kumar', phone: '+91 9876543254', address: 'No 103, Hospital Road, City' },
    { name: 'Shalini Devi', phone: '+91 9876543255', email: 'shalini.devi@gmail.com', address: 'No 125, School Street, City' },
    { name: 'Thiru M', phone: '+91 9876543256', address: 'No 147, Station Road, City' },
    { name: 'Uma Maheshwari', phone: '+91 9876543257', email: 'uma.maheshwari@gmail.com', address: 'No 169, Bus Stand Road, City' },
    { name: 'Bharath Kumar', phone: '+91 9876543258', address: 'No 181, Gandhi Road, City' },
    { name: 'Yamuna S', phone: '+91 9876543259', email: 'yamuna.s@gmail.com', address: 'No 203, Railway Colony, City' },
  ],
  downtown: [
    { name: 'Gopal Krishna', phone: '+91 9876543260', email: 'gopal.krishna@gmail.com', address: 'No 16, Downtown Ave, City' },
    { name: 'Janaki Devi', phone: '+91 9876543261', address: 'No 38, Central Road, City' },
    { name: 'Natarajan S', phone: '+91 9876543262', email: 'natarajan.s@gmail.com', address: 'No 50, Mall Street, City' },
    { name: 'Pooja Rani', phone: '+91 9876543263', email: 'pooja.rani@gmail.com', address: 'No 72, Shopping Complex, City' },
    { name: 'Rajendra Kumar', phone: '+91 9876543264', address: 'No 94, Business Street, City' },
    { name: 'Swarna Latha', phone: '+91 9876543265', email: 'swarna.latha@gmail.com', address: 'No 116, Commercial Road, City' },
    { name: 'Venkatesh M', phone: '+91 9876543266', address: 'No 138, Market Plaza, City' },
    { name: 'Anusha K', phone: '+91 9876543267', email: 'anusha.k@gmail.com', address: 'No 150, Town Center, City' },
    { name: 'Chandran R', phone: '+91 9876543268', address: 'No 172, City Plaza, City' },
    { name: 'Durga Devi', phone: '+91 9876543269', email: 'durga.devi@gmail.com', address: 'No 194, Metro Street, City' },
  ],
  tpt: [
    { name: 'Ezhil Arasan', phone: '+91 9876543270', email: 'ezhil.arasan@gmail.com', address: 'No 27, Textile Road, Tiruppur' },
    { name: 'Fathima Beevi', phone: '+91 9876543271', address: 'No 49, Mill Street, Tiruppur' },
    { name: 'Harish Kumar', phone: '+91 9876543272', email: 'harish.kumar@gmail.com', address: 'No 61, Factory Road, Tiruppur' },
    { name: 'Ishwarya S', phone: '+91 9876543273', email: 'ishwarya.s@gmail.com', address: 'No 83, Industrial Area, Tiruppur' },
    { name: 'Jegan M', phone: '+91 9876543274', address: 'No 105, Market Road, Tiruppur' },
    { name: 'Kalpana Devi', phone: '+91 9876543275', email: 'kalpana.devi@gmail.com', address: 'No 127, Bus Stand, Tiruppur' },
    { name: 'Loganathan R', phone: '+91 9876543276', address: 'No 149, Railway Station, Tiruppur' },
    { name: 'Mythili K', phone: '+91 9876543277', email: 'mythili.k@gmail.com', address: 'No 161, Town Hall, Tiruppur' },
    { name: 'Nirmal Kumar', phone: '+91 9876543278', address: 'No 183, Gandhi Nagar, Tiruppur' },
    { name: 'Oviya S', phone: '+91 9876543279', email: 'oviya.s@gmail.com', address: 'No 205, Anna Nagar, Tiruppur' },
  ],
};

async function seedCustomers() {
  console.log('👥 Seeding customers for all branches...\n');

  try {
    // Get the company
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

    console.log(`Found ${branches.length} branches\n`);

    let totalCreated = 0;
    let totalSkipped = 0;

    // Map branch codes to customer data
    const branchMapping = {
      'VPM': 'villupuram',
      'TKV': 'tirukovilure',
      'GNG': 'gingee',
      'TND': 'tindivanam',
      'MAIN-001': 'mainBranch',
      'DOWN-001': 'downtown',
      'TPT': 'tpt',
    };

    for (const branch of branches) {
      const dataKey = branchMapping[branch.code];
      const customers = customerData[dataKey] || [];

      if (customers.length === 0) {
        console.log(`⏭️  No customer data for ${branch.name} (${branch.code})\n`);
        continue;
      }

      console.log(`📍 ${branch.name} (${branch.code})`);
      console.log(`   Adding ${customers.length} customers...`);

      let branchCreated = 0;
      let branchSkipped = 0;

      for (const customerInfo of customers) {
        try {
          // Check if customer with same phone already exists
          const existingCustomer = await prisma.customer.findFirst({
            where: {
              phone: customerInfo.phone,
              companyId: company.id,
            },
          });

          if (existingCustomer) {
            branchSkipped++;
            continue;
          }

          // Create the customer
          await prisma.customer.create({
            data: {
              name: customerInfo.name,
              phone: customerInfo.phone,
              email: customerInfo.email || null,
              address: customerInfo.address,
              companyId: company.id,
              branchId: branch.id,
            },
          });

          branchCreated++;
        } catch (error) {
          console.log(`   ⚠️  Failed to create ${customerInfo.name}: ${error.message}`);
        }
      }

      console.log(`   ✅ Created: ${branchCreated}, ⏭️  Skipped: ${branchSkipped}\n`);
      totalCreated += branchCreated;
      totalSkipped += branchSkipped;
    }

    console.log('📊 Overall Summary:');
    console.log(`   ✅ Total Created: ${totalCreated}`);
    console.log(`   ⏭️  Total Skipped: ${totalSkipped}`);
    console.log(`   🏪 Branches: ${branches.length}\n`);

  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    await seedCustomers();
    console.log('🎉 Customer seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding customers:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
