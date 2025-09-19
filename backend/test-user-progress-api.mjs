import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

// Test de l'API de suivi de progression
async function testUserProgressAPI() {
  console.log("🧪 Test de l'API de suivi de progression des utilisateurs\n");

  try {
    // 1. Test de connexion admin (nécessaire pour accéder à l'API)
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
    const token = loginData.data?.token;

    if (!token) {
      throw new Error("Token non reçu");
    }

    console.log("✅ Connexion admin réussie\n");

    // 2. Récupérer la liste des utilisateurs pour avoir un ID à tester
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

    // 3. Test de l'API de progression détaillée
    console.log("3. Test de l'API de progression détaillée...");
    const progressResponse = await fetch(
      `${BASE_URL}/api/user-progress/user/${testUserId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!progressResponse.ok) {
      const errorText = await progressResponse.text();
      throw new Error(
        `Erreur API progression: ${progressResponse.status} - ${errorText}`
      );
    }

    const progressData = await progressResponse.json();
    console.log("✅ API de progression détaillée fonctionne");
    console.log(`   - Total formations: ${progressData.data.totalFormations}`);
    console.log(
      `   - Formations terminées: ${progressData.data.completedFormations}`
    );
    console.log(
      `   - Formations en cours: ${progressData.data.inProgressFormations}`
    );
    console.log(`   - Quiz tentés: ${progressData.data.totalQuizAttempts}`);
    console.log(`   - Score moyen: ${progressData.data.averageQuizScore}%\n`);

    // 4. Test de l'API de résumé
    console.log("4. Test de l'API de résumé...");
    const summaryResponse = await fetch(
      `${BASE_URL}/api/user-progress/user/${testUserId}/summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!summaryResponse.ok) {
      const errorText = await summaryResponse.text();
      throw new Error(
        `Erreur API résumé: ${summaryResponse.status} - ${errorText}`
      );
    }

    const summaryData = await summaryResponse.json();
    console.log("✅ API de résumé fonctionne");
    console.log(
      `   - Résumé: ${summaryData.data.totalFormations} formations, ${summaryData.data.completedFormations} terminées\n`
    );

    console.log("🎉 Tous les tests sont passés avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
    console.error(
      "💡 Assurez-vous que le serveur backend est démarré sur le port 3000"
    );
  }
}

// Exécuter les tests
testUserProgressAPI();
