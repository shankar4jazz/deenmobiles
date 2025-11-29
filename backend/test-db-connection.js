const { Client } = require('pg');

// Test different PostgreSQL credentials
const configs = [
  { user: 'postgres', password: 'postgres', database: 'deenmobiles' },
  { user: 'postgres', password: 'admin', database: 'deenmobiles' },
  { user: 'postgres', password: '', database: 'deenmobiles' },
  { user: 'postgres', password: 'password', database: 'deenmobiles' },
  { user: 'postgres', password: 'root', database: 'deenmobiles' },
];

async function testConnection(config) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    ...config,
  });

  try {
    await client.connect();
    console.log(`✅ SUCCESS - User: ${config.user}, Password: ${config.password || '(empty)'}`);
    console.log(`   Connection string: postgresql://${config.user}:${config.password}@localhost:5432/${config.database}`);
    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ FAILED  - User: ${config.user}, Password: ${config.password || '(empty)'}`);
    return false;
  }
}

async function testAll() {
  console.log('Testing PostgreSQL connections...\n');

  for (const config of configs) {
    const success = await testConnection(config);
    if (success) {
      console.log('\n🎉 Found working credentials! Update your .env file with the connection string shown above.\n');
      return;
    }
  }

  console.log('\n⚠️  None of the default credentials worked.');
  console.log('Please check your pgAdmin connection settings or PostgreSQL installation.\n');
}

testAll();
