const API_BASE_URL = 'http://localhost:5000/api/v1';

// Model data organized by brand
const modelsByBrand = {
  'Apple': [
    { name: 'iPhone 15 Pro Max', code: 'IP15PM', description: 'Latest flagship with titanium design' },
    { name: 'iPhone 15 Pro', code: 'IP15P', description: 'Premium model with A17 Pro chip' },
    { name: 'iPhone 15 Plus', code: 'IP15+', description: 'Large display model' },
    { name: 'iPhone 15', code: 'IP15', description: 'Standard model with dynamic island' },
    { name: 'iPhone 14 Pro Max', code: 'IP14PM', description: 'Previous gen pro max' },
    { name: 'iPhone 14 Pro', code: 'IP14P', description: 'Previous gen pro model' },
    { name: 'iPhone 14', code: 'IP14', description: 'Previous standard model' },
    { name: 'iPhone 13', code: 'IP13', description: 'Popular mid-range model' },
    { name: 'iPhone 12', code: 'IP12', description: '5G enabled iPhone' },
    { name: 'iPhone SE 2022', code: 'IPSE22', description: 'Budget iPhone with A15 chip' },
  ],
  'Samsung': [
    { name: 'Galaxy S24 Ultra', code: 'S24U', description: 'Flagship with S Pen' },
    { name: 'Galaxy S24+', code: 'S24+', description: 'Premium large display' },
    { name: 'Galaxy S24', code: 'S24', description: 'Standard flagship' },
    { name: 'Galaxy S23 Ultra', code: 'S23U', description: 'Previous flagship ultra' },
    { name: 'Galaxy A54 5G', code: 'A54', description: 'Mid-range with great camera' },
    { name: 'Galaxy A34 5G', code: 'A34', description: 'Mid-range 5G phone' },
    { name: 'Galaxy A24', code: 'A24', description: 'Budget friendly model' },
    { name: 'Galaxy M34 5G', code: 'M34', description: 'Value for money 5G' },
    { name: 'Galaxy Z Fold 5', code: 'ZF5', description: 'Foldable flagship' },
    { name: 'Galaxy Z Flip 5', code: 'ZFLIP5', description: 'Compact foldable' },
  ],
  'Xiaomi': [
    { name: 'Redmi Note 13 Pro+', code: 'RN13P+', description: 'Pro plus variant' },
    { name: 'Redmi Note 13 Pro', code: 'RN13P', description: 'Popular pro variant' },
    { name: 'Redmi Note 13', code: 'RN13', description: 'Best selling note series' },
    { name: 'Redmi 13C', code: 'R13C', description: 'Budget entry level' },
    { name: 'Redmi 12', code: 'R12', description: 'Standard budget phone' },
    { name: 'Poco X6 Pro', code: 'PX6P', description: 'Gaming focused pro' },
    { name: 'Poco X6', code: 'PX6', description: 'Performance phone' },
    { name: 'Poco M6 Pro', code: 'PM6P', description: 'Budget gaming phone' },
    { name: 'Mi 11X', code: 'M11X', description: 'Flagship killer' },
  ],
  'OnePlus': [
    { name: 'OnePlus 12', code: 'OP12', description: 'Latest flagship' },
    { name: 'OnePlus 11', code: 'OP11', description: 'Previous flagship' },
    { name: 'OnePlus Nord 3', code: 'OPN3', description: 'Mid-range nord series' },
    { name: 'OnePlus Nord CE 3', code: 'OPNCE3', description: 'Core edition' },
    { name: 'OnePlus 10 Pro', code: 'OP10P', description: 'Pro model with Hasselblad camera' },
  ],
  'Oppo': [
    { name: 'Reno 11 Pro', code: 'R11P', description: 'Premium reno series' },
    { name: 'Reno 11', code: 'R11', description: 'Mid-range reno' },
    { name: 'F25 Pro', code: 'F25P', description: 'F series pro' },
    { name: 'A78 5G', code: 'A78', description: 'Budget 5G phone' },
    { name: 'A58', code: 'A58', description: 'Entry level model' },
  ],
  'Vivo': [
    { name: 'V29 Pro', code: 'V29P', description: 'Selfie focused pro' },
    { name: 'V29', code: 'V29', description: 'Popular V series' },
    { name: 'T2 Pro', code: 'T2P', description: 'Performance oriented' },
    { name: 'Y100', code: 'Y100', description: 'Budget Y series' },
    { name: 'Y56 5G', code: 'Y56', description: '5G budget phone' },
  ],
  'Realme': [
    { name: 'Realme 12 Pro+', code: 'R12P+', description: 'Pro plus with periscope' },
    { name: 'Realme 12 Pro', code: 'R12P', description: 'Pro variant' },
    { name: 'Realme 12', code: 'R12', description: 'Standard model' },
    { name: 'Realme 11 Pro', code: 'R11P', description: 'Previous pro model' },
    { name: 'Realme C67', code: 'C67', description: 'Budget C series' },
    { name: 'Realme Narzo 60 Pro', code: 'N60P', description: 'Gaming narzo series' },
  ],
  'Google': [
    { name: 'Pixel 8 Pro', code: 'P8P', description: 'Flagship with tensor G3' },
    { name: 'Pixel 8', code: 'P8', description: 'Standard pixel 8' },
    { name: 'Pixel 7a', code: 'P7A', description: 'Budget pixel with great camera' },
    { name: 'Pixel 7 Pro', code: 'P7P', description: 'Previous flagship' },
  ],
  'Motorola': [
    { name: 'Edge 40 Neo', code: 'E40N', description: 'Premium edge series' },
    { name: 'Edge 40', code: 'E40', description: 'Standard edge' },
    { name: 'G84 5G', code: 'G84', description: 'Mid-range G series' },
    { name: 'G54 5G', code: 'G54', description: 'Budget 5G option' },
  ],
  'Nokia': [
    { name: 'G42 5G', code: 'G42', description: 'Mid-range 5G phone' },
    { name: 'C32', code: 'C32', description: 'Budget entry phone' },
    { name: 'G22', code: 'G22', description: 'Repairable smartphone' },
  ],
  'Nothing': [
    { name: 'Phone (2)', code: 'NP2', description: 'Second gen with glyph interface' },
    { name: 'Phone (1)', code: 'NP1', description: 'First gen unique design' },
    { name: 'Phone (2a)', code: 'NP2A', description: 'Budget variant' },
  ],
  'iQOO': [
    { name: 'iQOO 12', code: 'IQ12', description: 'Gaming flagship' },
    { name: 'iQOO Neo 9 Pro', code: 'IQN9P', description: 'Neo series pro' },
    { name: 'iQOO Z9', code: 'IQZ9', description: 'Budget gaming phone' },
  ],
};

async function seedModels() {
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

    // Fetch all brands
    console.log('📱 Fetching brands...');
    const brandsResponse = await fetch(`${API_BASE_URL}/master-data/brands?limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const brandsData = await brandsResponse.json();
    if (!brandsResponse.ok) {
      throw new Error(`Failed to fetch brands: ${brandsData.message || brandsResponse.statusText}`);
    }

    const brands = brandsData.data.data;
    console.log(`✅ Found ${brands.length} brands\n`);

    // Create a map of brand names to IDs
    const brandMap = {};
    brands.forEach(brand => {
      brandMap[brand.name] = brand.id;
    });

    console.log('📦 Creating models...\n');
    let successCount = 0;
    let skipCount = 0;
    let totalModels = 0;

    // Create models for each brand
    for (const [brandName, models] of Object.entries(modelsByBrand)) {
      const brandId = brandMap[brandName];

      if (!brandId) {
        console.log(`⚠️  Brand "${brandName}" not found, skipping ${models.length} models`);
        continue;
      }

      console.log(`\n📱 Creating models for ${brandName}...`);

      for (const model of models) {
        totalModels++;
        try {
          const response = await fetch(`${API_BASE_URL}/master-data/models`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...model,
              brandId: brandId,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            console.log(`   ✅ ${model.name} (${model.code})`);
            successCount++;
          } else if (response.status === 400 && data.message?.includes('already exists')) {
            console.log(`   ⏭️  ${model.name} (already exists)`);
            skipCount++;
          } else {
            console.error(`   ❌ Failed: ${model.name} - ${data.message || response.statusText}`);
          }
        } catch (error) {
          console.error(`   ❌ Failed: ${model.name} - ${error.message}`);
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   📦 Total: ${totalModels}`);
    console.log('\n🎉 Model seeding completed!');

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

seedModels();
