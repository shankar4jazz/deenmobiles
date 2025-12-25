const API_BASE_URL = 'http://localhost:5000/api/v1';

const brands = [
  {
    name: 'Apple',
    code: 'APL',
    description: 'Premium smartphones, tablets and accessories',
  },
  {
    name: 'Samsung',
    code: 'SAM',
    description: 'Korean electronics giant - phones, tablets, accessories',
  },
  {
    name: 'Xiaomi',
    code: 'XIA',
    description: 'Value for money smartphones and accessories',
  },
  {
    name: 'OnePlus',
    code: 'OPL',
    description: 'Flagship killer smartphones',
  },
  {
    name: 'Oppo',
    code: 'OPP',
    description: 'Camera-focused smartphones',
  },
  {
    name: 'Vivo',
    code: 'VIV',
    description: 'Selfie-focused smartphones',
  },
  {
    name: 'Realme',
    code: 'RLM',
    description: 'Budget and mid-range smartphones',
  },
  {
    name: 'Google',
    code: 'GOG',
    description: 'Pixel smartphones with pure Android',
  },
  {
    name: 'Motorola',
    code: 'MOT',
    description: 'Durable smartphones with stock Android',
  },
  {
    name: 'Nokia',
    code: 'NOK',
    description: 'Classic and reliable smartphones',
  },
  {
    name: 'Nothing',
    code: 'NTH',
    description: 'Innovative design smartphones',
  },
  {
    name: 'iQOO',
    code: 'IQO',
    description: 'Gaming-focused smartphones',
  },
];

async function seedBrands() {
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

    console.log('📦 Creating brands...\n');
    let successCount = 0;
    let skipCount = 0;

    for (const brand of brands) {
      try {
        const response = await fetch(`${API_BASE_URL}/master-data/brands`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(brand),
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`✅ Created: ${brand.name} (${brand.code})`);
          successCount++;
        } else if (response.status === 400 && data.message?.includes('already exists')) {
          console.log(`⏭️  Skipped: ${brand.name} (already exists)`);
          skipCount++;
        } else {
          console.error(`❌ Failed to create ${brand.name}: ${data.message || response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create ${brand.name}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   📦 Total: ${brands.length}`);
    console.log('\n🎉 Brand seeding completed!');

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

seedBrands();
