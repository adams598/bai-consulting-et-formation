import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testBankFormations() {
  try {
    console.log('🧪 Test de l\'API d\'assignation de formations...\n');

    // 1. Connexion admin
    console.log('1️⃣ Connexion admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@bai.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Erreur de connexion: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Connexion réussie');
    
    const { accessToken } = loginData.data;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // 2. Récupérer toutes les formations
    console.log('\n2️⃣ Récupération des formations...');
    const formationsResponse = await fetch(`${BASE_URL}/api/admin/formations`, {
      headers
    });

    if (!formationsResponse.ok) {
      throw new Error(`Erreur récupération formations: ${formationsResponse.status}`);
    }

    const formationsData = await formationsResponse.json();
    console.log(`✅ ${formationsData.data.length} formations récupérées`);
    
    if (formationsData.data.length === 0) {
      console.log('⚠️ Aucune formation disponible');
      return;
    }

    // 3. Récupérer la première banque
    console.log('\n3️⃣ Récupération des banques...');
    const banksResponse = await fetch(`${BASE_URL}/api/admin/banks`, {
      headers
    });

    if (!banksResponse.ok) {
      throw new Error(`Erreur récupération banques: ${banksResponse.status}`);
    }

    const banksData = await banksResponse.json();
    console.log(`✅ ${banksData.data.length} banques récupérées`);
    
    if (banksData.data.length === 0) {
      console.log('⚠️ Aucune banque disponible');
      return;
    }

    const bankId = banksData.data[0].id;
    const formationId = formationsData.data[0].id;

    console.log(`\n🏦 Banque sélectionnée: ${banksData.data[0].name} (${bankId})`);
    console.log(`📚 Formation sélectionnée: ${formationsData.data[0].title} (${formationId})`);

    // 4. Assigner la formation à la banque
    console.log('\n4️⃣ Assignation de la formation à la banque...');
    const assignResponse = await fetch(`${BASE_URL}/api/admin/bank-formations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bankId,
        formationId
      })
    });

    if (!assignResponse.ok) {
      const errorData = await assignResponse.json();
      throw new Error(`Erreur assignation: ${assignResponse.status} - ${errorData.message || 'Erreur inconnue'}`);
    }

    const assignData = await assignResponse.json();
    console.log('✅ Formation assignée avec succès');
    console.log('📊 Données de l\'assignation:', JSON.stringify(assignData.data, null, 2));

    // 5. Vérifier l'assignation
    console.log('\n5️⃣ Vérification de l\'assignation...');
    const verifyResponse = await fetch(`${BASE_URL}/api/admin/banks/${bankId}/formations`, {
      headers
    });

    if (!verifyResponse.ok) {
      throw new Error(`Erreur vérification: ${verifyResponse.status}`);
    }

    const verifyData = await verifyResponse.json();
    console.log(`✅ ${verifyData.data.length} formation(s) assignée(s) à la banque`);
    console.log('📊 Formations assignées:', JSON.stringify(verifyData.data, null, 2));

    console.log('\n🎉 Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('📡 Détails de la réponse:', error.response);
    }
  }
}

// Lancer le test
testBankFormations();
