import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('❌ DATABASE_URL non définie');
  process.exit(1);
}

console.log('🔍 Analyse de l\'URL de connexion...\n');

const maskedUrl = url.replace(/:[^:@]+@/, ':****@');
console.log('📋 URL actuelle:', maskedUrl);
console.log('📋 Longueur:', url.length, 'caractères\n');

// Parser l'URL
try {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)(\?.*)?/);
  
  if (match) {
    const [, user, password, host, database, params] = match;
    
    console.log('📊 Composants de l\'URL:');
    console.log(`   Utilisateur: ${user}`);
    console.log(`   Host: ${host}`);
    console.log(`   Base de données: ${database}`);
    console.log(`   Paramètres: ${params || 'aucun'}\n`);
    
    // Vérifications
    if (host.includes('pooler')) {
      console.log('⚠️  L\'URL utilise un POOLER');
      console.log('💡 Pour les migrations, essaie l\'URL DIRECTE (sans -pooler)\n');
    } else if (host.includes('direct')) {
      console.log('✅ L\'URL utilise un endpoint DIRECT\n');
    } else {
      console.log('⚠️  L\'URL n\'utilise ni pooler ni direct');
      console.log('💡 Vérifie dans Neon si tu as deux URLs (direct et pooler)\n');
    }
    
    // Vérifier le nom de la base
    console.log('💡 Vérifie dans le dashboard Neon:');
    console.log(`   1. Le nom de la base de données correspond à "${database}"`);
    console.log(`   2. Tu es bien connecté à la branche "production"`);
    console.log(`   3. L'URL est bien la "Connection string" (pas "Pooled connection")`);
    
  } else {
    console.error('❌ Format d\'URL invalide');
    console.error('💡 Format attendu: postgresql://user:pass@host/db?params');
  }
  
} catch (error) {
  console.error('❌ Erreur lors de l\'analyse:', error.message);
}

console.log('\n📝 Prochaines étapes:');
console.log('   1. Ouvre le dashboard Neon');
console.log('   2. Clique sur "Connect" → "Connection string"');
console.log('   3. Assure-toi de sélectionner "production" comme branche');
console.log('   4. Copie l\'URL complète et remplace-la dans .env');
console.log('   5. Désactive temporairement ProtonVPN et réessaie');

