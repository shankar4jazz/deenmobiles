const API_BASE_URL = 'http://localhost:5000/api/v1';

const deviceConditions = [
  {
    name: 'Excellent',
    code: 'EXC',
    description: 'Like new condition with no visible wear, scratches, or dents',
  },
  {
    name: 'Good',
    code: 'GOD',
    description: 'Minor cosmetic wear, fully functional with no major issues',
  },
  {
    name: 'Fair',
    code: 'FAR',
    description: 'Visible wear and tear, some cosmetic damage but fully functional',
  },
  {
    name: 'Poor',
    code: 'POR',
    description: 'Heavy damage, multiple cosmetic or functional issues',
  },
];

async function seedDeviceConditions() {
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

    console.log('🛠️  Creating device conditions...\n');
    let successCount = 0;
    let skipCount = 0;

    for (const condition of deviceConditions) {
      try {
        const response = await fetch(`${API_BASE_URL}/master-data/device-conditions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(condition),
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`✅ Created: ${condition.name} (${condition.code})`);
          successCount++;
        } else if (response.status === 400 && data.message?.includes('already exists')) {
          console.log(`⏭️  Skipped: ${condition.name} (already exists)`);
          skipCount++;
        } else {
          console.error(`❌ Failed to create ${condition.name}: ${data.message || response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create ${condition.name}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   🛠️  Total: ${deviceConditions.length}`);
    console.log('\n🎉 Device condition seeding completed!');

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

seedDeviceConditions();
