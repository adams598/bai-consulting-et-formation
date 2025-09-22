import fetch from 'node-fetch';

async function testAuthAPI() {
  try {
    console.log('🧪 Test de l\'API avec authentification...\n');
    
    // 1. Connexion pour obtenir un token
    console.log('🔐 Tentative de connexion...');
    const loginResponse = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@bai-consulting.com',
        password: 'admin123'
      })
    });
    
    console.log('Login status:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      const errorData = await loginResponse.text();
      console.log('❌ Erreur de connexion:', errorData);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Connexion réussie');
    console.log('Token:', loginData.data?.accessToken ? 'Présent' : 'Manquant');
    
    if (!loginData.data?.accessToken) {
      console.log('❌ Pas de token dans la réponse');
      return;
    }
    
    // 2. Test de l'API formations avec le token
    console.log('\n📚 Test API formations avec token...');
    const formationsResponse = await fetch('http://localhost:3000/api/admin/formations', {
      headers: {
        'Authorization': `Bearer ${loginData.data.accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Formations status:', formationsResponse.status);
    
    if (formationsResponse.status === 200) {
      const formationsData = await formationsResponse.json();
      console.log('✅ Formations récupérées avec succès');
      console.log('Nombre de formations:', formationsData.data?.length || 0);
      console.log('Première formation:', formationsData.data?.[0]?.title || 'Aucune');
    } else {
      const errorData = await formationsResponse.text();
      console.log('❌ Erreur formations:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testAuthAPI();


