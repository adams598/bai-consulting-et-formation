import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;

console.log('🔍 Test de connexion à la base de données...\n');

if (!dbUrl) {
  console.error('❌ DATABASE_URL non définie dans .env');
  process.exit(1);
}

// Masquer le mot de passe dans l'URL pour l'affichage
const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
console.log('📋 URL de connexion:', maskedUrl);
console.log('📋 Longueur:', dbUrl.length, 'caractères\n');

// Vérifier le format
if (!dbUrl.startsWith('postgresql://')) {
  console.error('❌ L\'URL doit commencer par postgresql://');
  console.error('💡 Format attendu: postgresql://user:pass@host/db?sslmode=require');
  process.exit(1);
}

// Tester la connexion avec Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔄 Tentative de connexion...\n');
    
    // Test simple : lister les tables
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      LIMIT 5
    `;
    
    console.log('✅ Connexion réussie !');
    console.log('📊 Tables existantes:', result);
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('\n💡 Suggestions:');
    
    if (error.message.includes("Can't reach database")) {
      console.error('   1. Vérifie que l\'URL est correcte dans .env');
      console.error('   2. Pour Neon, utilise l\'endpoint DIRECT (pas pooler) pour les migrations');
      console.error('   3. Vérifie les paramètres SSL: ?sslmode=require ou ?sslmode=prefer');
      console.error('   4. Vérifie que la base de données n\'est pas en pause (mode serverless)');
    }
    
    if (error.message.includes('SSL')) {
      console.error('   5. Ajoute ?sslmode=require à l\'URL');
    }
    
    if (error.message.includes('authentication')) {
      console.error('   6. Vérifie le nom d\'utilisateur et le mot de passe');
    }
    
    console.error('\n📝 Format URL Neon recommandé:');
    console.error('   postgresql://user:pass@ep-xxx-xxx-direct.region.aws.neon.tech/dbname?sslmode=require');
    console.error('   OU (pour pooler):');
    console.error('   postgresql://user:pass@ep-xxx-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require');
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then(() => {
    console.log('\n✅ Test terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test échoué');
    process.exit(1);
  });

