import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

// Test de l'API de suivi des consultations de contenu
async function testContentVisitsAPI() {
  console.log("🧪 Test de l'API de suivi des consultations de contenu\n");

  try {
    // 1. Test de connexion admin
    console.log("1. Test de connexion admin...");
    const loginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@bai-consulting.com",
        password: "admin123",
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Erreur de connexion: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data?.accessToken;

    if (!token) {
      throw new Error("Token non reçu");
    }

    console.log("✅ Connexion admin réussie\n");

    // 2. Récupérer la liste des utilisateurs
    console.log("2. Récupération de la liste des utilisateurs...");
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!usersResponse.ok) {
      throw new Error(
        `Erreur récupération utilisateurs: ${usersResponse.status}`
      );
    }

    const usersData = await usersResponse.json();
    const users = usersData.data?.data || usersData.data || [];

    if (users.length === 0) {
      console.log("⚠️  Aucun utilisateur trouvé pour tester");
      return;
    }

    const testUserId = users[0].id;
    console.log(
      `✅ Utilisateur trouvé: ${users[0].firstName} ${users[0].lastName} (ID: ${testUserId})\n`
    );

    // 3. Test de l'API des consultations récentes
    console.log("3. Test de l'API des consultations récentes...");
    const visitsResponse = await fetch(
      `${BASE_URL}/api/content-visits/user/${testUserId}/recent?limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!visitsResponse.ok) {
      const errorText = await visitsResponse.text();
      throw new Error(
        `Erreur API consultations: ${visitsResponse.status} - ${errorText}`
      );
    }

    const visitsData = await visitsResponse.json();
    console.log("✅ API des consultations récentes fonctionne");
    console.log(`   - Nombre de consultations: ${visitsData.data.length}`);

    if (visitsData.data.length > 0) {
      const latestVisit = visitsData.data[0];
      console.log(`   - Dernière consultation: ${latestVisit.contentType}`);
      console.log(
        `   - Date: ${new Date(latestVisit.visitedAt).toLocaleString()}`
      );
      if (latestVisit.durationFormatted) {
        console.log(`   - Durée: ${latestVisit.durationFormatted}`);
      }
    }
    console.log();

    // 4. Test de l'API des statistiques de consultation
    console.log("4. Test de l'API des statistiques de consultation...");
    const statsResponse = await fetch(
      `${BASE_URL}/api/content-visits/user/${testUserId}/stats?days=30`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!statsResponse.ok) {
      const errorText = await statsResponse.text();
      throw new Error(
        `Erreur API statistiques: ${statsResponse.status} - ${errorText}`
      );
    }

    const statsData = await statsResponse.json();
    console.log("✅ API des statistiques de consultation fonctionne");
    console.log(`   - Période: ${statsData.data.period}`);
    console.log(`   - Total consultations: ${statsData.data.totalVisits}`);
    console.log(`   - Temps total: ${statsData.data.totalDurationFormatted}`);
    console.log(`   - Types de contenu: ${statsData.data.visitsByType.length}`);
    console.log();

    // 5. Test de l'API de dernière consultation d'un type spécifique
    console.log("5. Test de l'API de dernière consultation...");
    const lastVisitResponse = await fetch(
      `${BASE_URL}/api/content-visits/user/${testUserId}/last?contentType=formation_detail`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!lastVisitResponse.ok) {
      const errorText = await lastVisitResponse.text();
      throw new Error(
        `Erreur API dernière consultation: ${lastVisitResponse.status} - ${errorText}`
      );
    }

    const lastVisitData = await lastVisitResponse.json();
    if (lastVisitData.data) {
      console.log("✅ API de dernière consultation fonctionne");
      console.log(`   - Type: ${lastVisitData.data.contentType}`);
      console.log(
        `   - Date: ${new Date(lastVisitData.data.visitedAt).toLocaleString()}`
      );
    } else {
      console.log(
        "✅ API de dernière consultation fonctionne (aucune consultation trouvée)"
      );
    }
    console.log();

    console.log("🎉 Tous les tests sont passés avec succès !");
    console.log("\n💡 Pour générer des données de test:");
    console.log("   - Connectez-vous en tant qu'utilisateur");
    console.log("   - Naviguez sur différentes pages de la plateforme");
    console.log("   - Les consultations seront automatiquement enregistrées");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
    console.error(
      "💡 Assurez-vous que le serveur backend est démarré sur le port 3000"
    );
  }
}

// Exécuter les tests
testContentVisitsAPI();
