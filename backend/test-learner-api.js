import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

async function testLearnerAPI() {
  console.log("🧪 Test de l'API Learner (Espace Apprenant) BAI Consulting\n");

  try {
    // Test 1: Endpoint de santé learner
    console.log("1️⃣ Test endpoint de santé learner...");
    const healthResponse = await fetch(`${BASE_URL}/api/learner/auth/health`);
    console.log(`   Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   Réponse: ${JSON.stringify(healthData, null, 2)}`);
    }
    console.log("");

    // Test 2: Login avec un collaborateur de test
    console.log("2️⃣ Test de connexion collaborateur...");
    const loginData = {
      email: "pierre.durand@banque-populaire.com",
      password: "collaborateur123",
    };

    const loginResponse = await fetch(`${BASE_URL}/api/learner/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    console.log(`   Status: ${loginResponse.status}`);
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log(`   Connexion réussie pour: ${loginResult.data.user.email}`);
      console.log(`   Rôle: ${loginResult.data.user.role}`);
      console.log(`   Banque: ${loginResult.data.user.bank?.name}`);

      const accessToken = loginResult.data.accessToken;

      // Test 3: Récupération du dashboard
      console.log("\n3️⃣ Test récupération du dashboard...");
      const dashboardResponse = await fetch(`${BASE_URL}/api/learner/dashboard`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log(`   Status: ${dashboardResponse.status}`);
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log(`   Dashboard récupéré: ${dashboardData.data.totalFormations} formations totales`);
        console.log(`   Formations terminées: ${dashboardData.data.completedFormations}`);
        console.log(`   Formations en cours: ${dashboardData.data.inProgressFormations}`);
        console.log(`   Score moyen: ${dashboardData.data.averageScore}%`);
      }

      // Test 4: Récupération des formations
      console.log("\n4️⃣ Test récupération des formations...");
      const formationsResponse = await fetch(`${BASE_URL}/api/learner/formations`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log(`   Status: ${formationsResponse.status}`);
      if (formationsResponse.ok) {
        const formationsData = await formationsResponse.json();
        console.log(`   Nombre de formations: ${formationsData.data.length}`);
        formationsData.data.forEach((formation) => {
          console.log(`   - ${formation.title} (${formation.status})`);
        });
      }

      // Test 5: Récupération de la progression
      console.log("\n5️⃣ Test récupération de la progression...");
      const progressResponse = await fetch(`${BASE_URL}/api/learner/progress`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log(`   Status: ${progressResponse.status}`);
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        console.log(`   Nombre de progressions: ${progressData.data.length}`);
      }

      // Test 6: Récupération des notifications
      console.log("\n6️⃣ Test récupération des notifications...");
      const notificationsResponse = await fetch(`${BASE_URL}/api/learner/notifications`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log(`   Status: ${notificationsResponse.status}`);
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        console.log(`   Nombre de notifications: ${notificationsData.data.length}`);
      }

    } else {
      const errorData = await loginResponse.json();
      console.log(`   Erreur de connexion: ${errorData.message}`);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  }

  console.log("\n✅ Test terminé");
}

// Lancer le test
testLearnerAPI(); 