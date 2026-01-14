import { PrismaClient } from '@prisma/client';

// Neon utilise souvent un pooler de connexion avec un hostname différent
// Essayons avec le pooler si disponible
const urlsToTest = [
  // URL standard
  'postgresql://neondb_owner:npg_pGPf8eHcqo0l@ep-young-river-adgkr8vl.c-2.us-east-1.aws.neon.tech:5432/bai-consulting?sslmode=require',
  
  // URL avec pooler (format commun Neon)
  'postgresql://neondb_owner:npg_pGPf8eHcqo0l@ep-young-river-adgkr8vl-pooler.c-2.us-east-1.aws.neon.tech:5432/bai-consulting?sslmode=require',
  
  // URL avec pooler sur port 6543
  'postgresql://neondb_owner:npg_pGPf8eHcqo0l@ep-young-river-adgkr8vl-pooler.c-2.us-east-1.aws.neon.tech:6543/bai-consulting?sslmode=require',
];

console.log('🔍 Test de différentes URLs Neon...\n');

for (let i = 0; i < urlsToTest.length; i++) {
  const url = urlsToTest[i];
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });
  
  console.log(`\n📋 Test ${i + 1}/${urlsToTest.length}:`);
  console.log('   URL:', url.replace(/:[^:@]+@/, ':****@'));
  
  try {
    await prisma.$connect();
    console.log('   ✅ Connexion réussie !');
    
    const userCount = await prisma.user.count();
    console.log(`   📊 Utilisateurs: ${userCount}`);
    
    await prisma.$disconnect();
    console.log(`\n✅ URL qui fonctionne:`);
    console.log(`DATABASE_URL="${url}"`);
    process.exit(0);
  } catch (error) {
    console.log(`   ❌ Échec: ${error.message.split('\n')[0]}`);
    await prisma.$disconnect().catch(() => {});
  }
}

console.log('\n❌ Aucune URL n\'a fonctionné.');
console.log('\n💡 Suggestions:');
console.log('1. Vérifiez votre firewall/antivirus qui pourrait bloquer le port 5432');
console.log('2. Essayez depuis un autre réseau (hotspot mobile)');
console.log('3. Vérifiez dans le dashboard Neon s\'il y a une URL de pooler différente');
console.log('4. Contactez le support Neon pour vérifier les restrictions IP');
process.exit(1);






