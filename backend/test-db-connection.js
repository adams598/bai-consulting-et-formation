import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

console.log('🔍 Test de connexion à la base de données...');
console.log('📋 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurée' : '❌ Non configurée');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas définie dans le fichier .env');
  process.exit(1);
}

// Masquer le mot de passe dans l'URL pour l'affichage
const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
console.log('🔗 URL (masquée):', maskedUrl);

async function testConnection() {
  try {
    console.log('\n🔄 Tentative de connexion...');
    
    // Test simple de connexion
    await prisma.$connect();
    console.log('✅ Connexion réussie !');
    
    // Test d'une requête simple
    const userCount = await prisma.user.count();
    console.log(`📊 Nombre d'utilisateurs dans la base: ${userCount}`);
    
    await prisma.$disconnect();
    console.log('✅ Déconnexion réussie');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur de connexion:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    
    if (error.message?.includes("Can't reach database server")) {
      console.error('\n💡 Suggestions:');
      console.error('1. Vérifiez que la base de données Neon est active (non suspendue)');
      console.error('2. Vérifiez que l\'URL contient le port :5432');
      console.error('3. Vérifiez que l\'URL contient ?sslmode=require');
      console.error('4. Vérifiez votre connexion internet');
      console.error('\n📝 Format attendu:');
      console.error('postgresql://user:password@host:5432/database?sslmode=require');
    }
    
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnection();






