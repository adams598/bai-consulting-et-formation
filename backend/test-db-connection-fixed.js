import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// URL corrigée avec le port
const fixedUrl = 'postgresql://neondb_owner:npg_pGPf8eHcqo0l@ep-young-river-adgkr8vl.c-2.us-east-1.aws.neon.tech:5432/bai-consulting?sslmode=require';

console.log('🔍 Test de connexion à la base de données avec URL corrigée...');
console.log('🔗 URL (masquée):', fixedUrl.replace(/:[^:@]+@/, ':****@'));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: fixedUrl
    }
  }
});

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
    console.log('\n✅ L\'URL fonctionne ! Mettez à jour votre fichier .env avec:');
    console.log(`DATABASE_URL="${fixedUrl}"`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur de connexion:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    
    if (error.message?.includes("Can't reach database server")) {
      console.error('\n💡 La base de données Neon est peut-être suspendue.');
      console.error('   Allez sur https://neon.tech et réactivez votre base de données.');
    }
    
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnection();






