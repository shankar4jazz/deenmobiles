const API_BASE_URL = 'http://localhost:5000/api/v1';

const serviceCategories = [
  {
    name: 'Screen Replacement',
    code: 'SCR',
    description: 'Display screen replacement service',
    defaultPrice: 2000,
    technicianPoints: 10,
  },
  {
    name: 'Battery Replacement',
    code: 'BAT',
    description: 'Battery replacement service',
    defaultPrice: 800,
    technicianPoints: 5,
  },
  {
    name: 'Charging Port Repair',
    code: 'CHG',
    description: 'Charging port repair or replacement',
    defaultPrice: 500,
    technicianPoints: 5,
  },
  {
    name: 'Water Damage Repair',
    code: 'WTR',
    description: 'Water damage inspection and repair',
    defaultPrice: 1500,
    technicianPoints: 15,
  },
  {
    name: 'Software Issues',
    code: 'SFT',
    description: 'Software troubleshooting and fixes',
    defaultPrice: 300,
    technicianPoints: 3,
  },
  {
    name: 'Camera Repair',
    code: 'CAM',
    description: 'Front or back camera repair/replacement',
    defaultPrice: 1200,
    technicianPoints: 8,
  },
  {
    name: 'Speaker/Mic Repair',
    code: 'AUD',
    description: 'Speaker or microphone repair/replacement',
    defaultPrice: 600,
    technicianPoints: 6,
  },
  {
    name: 'Back Panel Replacement',
    code: 'BKP',
    description: 'Back panel/cover replacement',
    defaultPrice: 700,
    technicianPoints: 4,
  },
  {
    name: 'Power Button Repair',
    code: 'PWR',
    description: 'Power button repair or replacement',
    defaultPrice: 400,
    technicianPoints: 4,
  },
  {
    name: 'Network Issue Fix',
    code: 'NET',
    description: 'Network connectivity troubleshooting and repair',
    defaultPrice: 500,
    technicianPoints: 5,
  },
];

async function seedServiceCategories() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'admin@deenmobiles.com',
        password: 'password123',
        rememberMe: true,
      }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.message || loginResponse.statusText}`);
    }

    const token = loginData.data.accessToken;
    console.log('✅ Login successful\n');

    console.log('🛠️  Creating service categories...\n');
    let successCount = 0;
    let skipCount = 0;

    for (const category of serviceCategories) {
      try {
        const response = await fetch(`${API_BASE_URL}/master-data/service-categories`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(category),
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`✅ Created: ${category.name} (${category.code}) - ₹${category.defaultPrice}, ${category.technicianPoints} pts`);
          successCount++;
        } else if (response.status === 400 && data.message?.includes('already exists')) {
          console.log(`⏭️  Skipped: ${category.name} (already exists)`);
          skipCount++;
        } else {
          console.error(`❌ Failed to create ${category.name}: ${data.message || response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create ${category.name}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   🛠️  Total: ${serviceCategories.length}`);
    console.log('\n🎉 Service category seeding completed!');

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

seedServiceCategories();
