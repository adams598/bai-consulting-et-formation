import fetch from "node-fetch";

async function testActivitiesAPI() {
  try {
    console.log("🔄 Test de l'API des activités récentes...");

    // 1. Se connecter pour obtenir un token
    const loginResponse = await fetch(
      "http://localhost:3000/api/admin/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "mariline@bai.com",
          password: "password123",
        }),
      }
    );

    if (!loginResponse.ok) {
      console.error("❌ Erreur de connexion:", await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log("✅ Connexion réussie");

    const token = loginData.data.accessToken;
    console.log("🔑 Token obtenu:", token.substring(0, 20) + "...");

    // 2. Tester l'API des activités récentes
    const activitiesResponse = await fetch(
      "http://localhost:3000/api/learner/content/recent-activities?filter=1week",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!activitiesResponse.ok) {
      console.error(
        "❌ Erreur API activités:",
        await activitiesResponse.text()
      );
      return;
    }

    const activitiesData = await activitiesResponse.json();
    console.log("✅ API activités appelée avec succès");
    console.log("📊 Données reçues:", JSON.stringify(activitiesData, null, 2));

    // 3. Afficher le résumé
    if (activitiesData.success && activitiesData.data) {
      console.log(`\n📈 Résumé des activités:`);
      console.log(`   - Total: ${activitiesData.data.length} activités`);
      console.log(`   - Filtre: ${activitiesData.filter}`);

      // Grouper par type
      const byType = activitiesData.data.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {});

      console.log(`   - Par type:`);
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`     * ${type}: ${count}`);
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

testActivitiesAPI();
