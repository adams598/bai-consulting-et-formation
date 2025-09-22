import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🧪 Test de l\'API formations...\n');
    
    // D'abord, testons la connexion
    const healthResponse = await fetch('http://localhost:3000/api/admin/auth/health');
    console.log('🏥 Health check:', healthResponse.status);
    
    if (healthResponse.status !== 200) {
      console.log('❌ Serveur non accessible');
      return;
    }
    
    // Testons l'API formations (sans authentification pour voir l'erreur)
    console.log('\n📡 Test API formations (sans auth)...');
    const formationsResponse = await fetch('http://localhost:3000/api/admin/formations');
    console.log('Status:', formationsResponse.status);
    
    const formationsData = await formationsResponse.text();
    console.log('Réponse:', formationsData);
    
  } catch (error) {
    console.error('❌ Erreur lors du test API:', error.message);
  }
}

testAPI();


