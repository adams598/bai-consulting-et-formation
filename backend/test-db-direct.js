import pg from 'pg';
const { Client } = pg;

// Test de connexion directe avec pg (sans Prisma)
const connectionString = 'postgresql://neondb_owner:npg_pGPf8eHcqo0l@ep-young-river-adgkr8vl.c-2.us-east-1.aws.neon.tech:5432/bai-consulting?sslmode=require';

console.log('🔍 Test de connexion directe avec pg...');
console.log('🔗 Host: ep-young-river-adgkr8vl.c-2.us-east-1.aws.neon.tech');
console.log('🔗 Port: 5432');

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Pour accepter les certificats SSL
  },
  connectionTimeoutMillis: 10000, // 10 secondes
});

async function testDirectConnection() {
  try {
    console.log('\n🔄 Tentative de connexion...');
    await client.connect();
    console.log('✅ Connexion réussie avec pg !');
    
    const result = await client.query('SELECT COUNT(*) as count FROM "User"');
    console.log(`📊 Nombre d'utilisateurs: ${result.rows[0].count}`);
    
    await client.end();
    console.log('✅ Déconnexion réussie');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur de connexion:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Problème de connexion réseau:');
      console.error('   - Vérifiez votre firewall');
      console.error('   - Vérifiez que le port 5432 n\'est pas bloqué');
      console.error('   - Essayez depuis un autre réseau (hotspot mobile)');
    }
    
    if (error.message?.includes('SSL')) {
      console.error('\n💡 Problème SSL:');
      console.error('   - Essayez avec sslmode=require');
    }
    
    process.exit(1);
  }
}

testDirectConnection();

