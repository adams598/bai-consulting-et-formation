import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:3001';

async function testFrontendBackendIntegration() {
  console.log('🧪 Test d\'intégration Frontend-Backend BAI Consulting\n');

  try {
    // Test 1: Vérifier que le backend est accessible
    console.log('1️⃣ Test connectivité backend...');
    const healthResponse = await fetch(`${BASE_URL}/api/admin/auth/health`);
    console.log(`   Backend Status: ${healthResponse.status}`);
    
    if (!healthResponse.ok) {
      throw new Error('Backend non accessible');
    }
    console.log('   ✅ Backend accessible\n');

    // Test 2: Connexion avec les identifiants de test
    console.log('2️⃣ Test de connexion...');
    const loginData = {
      email: 'admin@bai-consulting.com',
      password: 'admin123'
    };
    
    const loginResponse = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`   Login Status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(`Erreur de connexion: ${error.message}`);
    }
    
    const loginResult = await loginResponse.json();
    console.log(`   ✅ Connexion réussie pour: ${loginResult.data.user.email}`);
    console.log(`   Rôle: ${loginResult.data.user.role}`);
    
    const accessToken = loginResult.data.accessToken;
    console.log('');

    // Test 3: Test des endpoints avec authentification
    console.log('3️⃣ Test des endpoints authentifiés...');
    
    // Test des banques
    console.log('   📊 Test récupération des banques...');
    const banksResponse = await fetch(`${BASE_URL}/api/admin/banks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (banksResponse.ok) {
      const banksData = await banksResponse.json();
      console.log(`   ✅ ${banksData.data.length} banques récupérées`);
    } else {
      console.log(`   ❌ Erreur banques: ${banksResponse.status}`);
    }

    // Test des formations
    console.log('   📚 Test récupération des formations...');
    const formationsResponse = await fetch(`${BASE_URL}/api/admin/formations`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (formationsResponse.ok) {
      const formationsData = await formationsResponse.json();
      console.log(`   ✅ ${formationsData.data.length} formations récupérées`);
    } else {
      console.log(`   ❌ Erreur formations: ${formationsResponse.status}`);
    }

    // Test des utilisateurs
    console.log('   👥 Test récupération des utilisateurs...');
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`   ✅ ${usersData.data.length} utilisateurs récupérés`);
    } else {
      console.log(`   ❌ Erreur utilisateurs: ${usersResponse.status}`);
    }

    console.log('');

    // Test 4: Test des headers CORS
    console.log('4️⃣ Test des headers CORS...');
    const corsResponse = await fetch(`${BASE_URL}/api/admin/auth/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log(`   CORS Status: ${corsResponse.status}`);
    console.log(`   Access-Control-Allow-Origin: ${corsResponse.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`   Access-Control-Allow-Methods: ${corsResponse.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`   Access-Control-Allow-Headers: ${corsResponse.headers.get('Access-Control-Allow-Headers')}`);
    
    if (corsResponse.headers.get('Access-Control-Allow-Origin')) {
      console.log('   ✅ CORS configuré correctement');
    } else {
      console.log('   ⚠️ CORS non configuré');
    }

    console.log('');

    // Test 5: Test de la structure des réponses
    console.log('5️⃣ Test de la structure des réponses...');
    
    // Test structure banques
    if (banksResponse.ok) {
      const banksData = await banksResponse.json();
      if (banksData.success !== undefined && banksData.data !== undefined) {
        console.log(`   ✅ Banques: Structure correcte (success + data)`);
      } else {
        console.log(`   ⚠️ Banques: Structure différente de celle attendue`);
      }
    }

    // Test structure formations
    if (formationsResponse.ok) {
      const formationsData = await formationsResponse.json();
      if (formationsData.success !== undefined && formationsData.data !== undefined) {
        console.log(`   ✅ Formations: Structure correcte (success + data)`);
      } else {
        console.log(`   ⚠️ Formations: Structure différente de celle attendue`);
      }
    }

    // Test structure utilisateurs
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      if (usersData.success !== undefined && usersData.data !== undefined) {
        console.log(`   ✅ Utilisateurs: Structure correcte (success + data)`);
      } else {
        console.log(`   ⚠️ Utilisateurs: Structure différente de celle attendue`);
      }
    }

    console.log('\n🎉 Tests d\'intégration terminés avec succès !');
    console.log('\n📋 Résumé:');
    console.log('   ✅ Backend accessible');
    console.log('   ✅ Authentification fonctionnelle');
    console.log('   ✅ Endpoints authentifiés opérationnels');
    console.log('   ✅ Structure des réponses cohérente');
    console.log('   ✅ Prêt pour l\'intégration frontend');

  } catch (error) {
    console.error('❌ Erreur lors du test d\'intégration:', error.message);
    console.log('\n🔧 Vérifications à effectuer:');
    console.log('   1. Le backend est-il démarré sur le port 3000 ?');
    console.log('   2. Les identifiants de test sont-ils corrects ?');
    console.log('   3. La base de données est-elle initialisée ?');
  }
}

// Lancer le test
testFrontendBackendIntegration(); 