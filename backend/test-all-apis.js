import fetch from "node-fetch";

const API_BASE = "http://localhost:3000/api/admin";

async function testAllAPIs() {
  console.log("🧪 Test complet des APIs du dashboard\n");

  // Connexion
  console.log("🔑 Connexion...");
  const loginResponse = await fetch(`${API_BASE}/auth/login`, {
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
    console.log("❌ Erreur de connexion:", await loginResponse.text());
    return;
  }

  const loginData = await loginResponse.json();
  const token = loginData.data.accessToken;
  console.log("✅ Connexion réussie\n");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Test de toutes les APIs
  const apis = [
    {
      name: "Statistiques générales",
      path: "/dashboard/stats",
      description: "KPIs temps réel",
    },
    {
      name: "Statistiques par banque",
      path: "/dashboard/bank-stats",
      description: "Performance par établissement",
    },
    {
      name: "Activité récente",
      path: "/dashboard/recent-activity",
      description: "Timeline des actions",
    },
    {
      name: "Alertes",
      path: "/dashboard/alerts",
      description: "Notifications importantes",
    },
    {
      name: "Performance des formations",
      path: "/dashboard/formation-performance",
      description: "Métriques par formation",
    },
  ];

  for (const api of apis) {
    console.log(`🔍 Test: ${api.name}`);
    console.log(`   Description: ${api.description}`);

    try {
      const response = await fetch(`${API_BASE}${api.path}`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Succès (${response.status})`);

        // Afficher un résumé des données
        if (data.data) {
          if (Array.isArray(data.data)) {
            console.log(`   📊 Données: ${data.data.length} éléments`);
            if (data.data.length > 0) {
              console.log(
                `   📋 Premier élément:`,
                JSON.stringify(data.data[0], null, 2)
              );
            }
          } else {
            console.log(`   📊 Données:`, JSON.stringify(data.data, null, 2));
          }
        }
      } else {
        const error = await response.text();
        console.log(`   ❌ Erreur (${response.status})`);
        console.log(`   💥 Message: ${error}`);
      }
    } catch (error) {
      console.log(`   💥 Exception: ${error.message}`);
    }

    console.log(""); // Ligne vide
  }

  console.log("🎉 Test complet terminé !");
}

testAllAPIs().catch(console.error);


