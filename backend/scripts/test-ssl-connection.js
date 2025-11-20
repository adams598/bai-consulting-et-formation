import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const originalUrl = process.env.DATABASE_URL;

if (!originalUrl) {
  console.error('❌ DATABASE_URL non définie');
  process.exit(1);
}

console.log('🔍 Test de différentes configurations SSL...\n');

// Extraire la base de l'URL (sans paramètres)
const urlMatch = originalUrl.match(/^(postgresql:\/\/[^\/]+)\/([^?]+)(.*)$/);
if (!urlMatch) {
  console.error('❌ Format d\'URL invalide');
  process.exit(1);
}

const baseUrl = urlMatch[1];
const database = urlMatch[2];
const existingParams = urlMatch[3];

// Différentes configurations à tester
const configs = [
  { name: 'sslmode=prefer', url: `${baseUrl}/${database}?sslmode=prefer` },
  { name: 'sslmode=require', url: `${baseUrl}/${database}?sslmode=require` },
  { name: 'sslmode=require + connection_limit=1', url: `${baseUrl}/${database}?sslmode=require&connection_limit=1` },
  { name: 'sslmode=prefer + connection_limit=1', url: `${baseUrl}/${database}?sslmode=prefer&connection_limit=1` },
  { name: 'sans paramètres SSL', url: `${baseUrl}/${database}` },
];

async function testConnection(name, url) {
  const maskedUrl = url.replace(/:[^:@]+@/, ':****@');
  console.log(`\n🧪 Test: ${name}`);
  console.log(`   URL: ${maskedUrl}`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });

  try {
    // Timeout de 5 secondes
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const queryPromise = prisma.$queryRaw`SELECT 1 as test`;
    
    await Promise.race([queryPromise, timeoutPromise]);
    
    console.log(`   ✅ Succès !`);
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log(`   ❌ Échec: ${error.message.split('\n')[0]}`);
    await prisma.$disconnect();
    return false;
  }
}

async function testAll() {
  for (const config of configs) {
    const success = await testConnection(config.name, config.url);
    if (success) {
      console.log(`\n🎉 Configuration qui fonctionne: ${config.name}`);
      console.log(`📝 URL à utiliser dans .env:`);
      console.log(`DATABASE_URL="${config.url}"`);
      return config.url;
    }
  }
  
  console.log('\n❌ Aucune configuration n\'a fonctionné');
  console.log('\n💡 Vérifie que:');
  console.log('   1. La base de données Neon n\'est pas en pause');
  console.log('   2. Les credentials sont corrects');
  console.log('   3. Le firewall autorise la connexion');
  
  return null;
}

testAll()
  .then((workingUrl) => {
    if (workingUrl) {
      console.log('\n✅ Test terminé - URL fonctionnelle trouvée');
      process.exit(0);
    } else {
      console.log('\n❌ Test terminé - Aucune URL fonctionnelle');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });

