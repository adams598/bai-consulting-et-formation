import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL non définie');
  process.exit(1);
}

console.log('🔍 Test de connexion directe PostgreSQL...\n');

const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
console.log('📋 URL:', maskedUrl);

// Test avec différentes configurations
const configs = [
  { ssl: false, name: 'sans SSL' },
  { ssl: { rejectUnauthorized: false }, name: 'SSL sans vérification' },
  { ssl: { require: true, rejectUnauthorized: false }, name: 'SSL requis' },
];

async function testConnection(config) {
  console.log(`\n🧪 Test: ${config.name}`);
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: config.ssl,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('   🔄 Tentative de connexion...');
    await client.connect();
    console.log('   ✅ Connexion réussie !');
    
    const result = await client.query('SELECT version()');
    console.log(`   📊 Version PostgreSQL: ${result.rows[0].version.split(',')[0]}`);
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`   ❌ Échec: ${error.message}`);
    try {
      await client.end();
    } catch (e) {
      // Ignorer les erreurs de fermeture
    }
    return false;
  }
}

async function testAll() {
  for (const config of configs) {
    const success = await testConnection(config);
    if (success) {
      console.log(`\n🎉 Configuration qui fonctionne: ${config.name}`);
      return config;
    }
  }
  
  console.log('\n❌ Aucune configuration n\'a fonctionné');
  console.log('\n💡 Vérifie que:');
  console.log('   1. La base de données Neon n\'est pas en pause');
  console.log('   2. Les credentials sont corrects dans .env');
  console.log('   3. Ton VPN/Proxy n\'interfère pas avec la connexion');
  console.log('   4. La base de données existe bien dans Neon');
  
  return null;
}

testAll()
  .then((config) => {
    if (config) {
      console.log('\n✅ Test terminé - Connexion fonctionnelle');
      process.exit(0);
    } else {
      console.log('\n❌ Test terminé - Aucune connexion fonctionnelle');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });

