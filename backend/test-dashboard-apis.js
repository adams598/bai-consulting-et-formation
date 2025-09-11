import fetch from "node-fetch";

const API_BASE = "http://localhost:3000/api/admin";

async function testDashboardAPIs() {
  console.log("🧪 Test des APIs du dashboard enrichi\n");

  // D'abord, obtenir un token
  console.log("🔑 Obtention d'un token d'authentification...");
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

  let token = null;
  if (loginResponse.ok) {
    const loginData = await loginResponse.json();
    token = loginData.data.accessToken;
    console.log("✅ Token obtenu");
  } else {
    console.log("❌ Impossible d'obtenir un token");
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Tester les nouvelles APIs du dashboard
  const dashboardAPIs = [
    {
      path: "/dashboard/stats",
      name: "Statistiques générales",
      description: "KPIs temps réel",
    },
    {
      path: "/dashboard/bank-stats",
      name: "Statistiques par banque",
      description: "Performance par établissement",
    },
    {
      path: "/dashboard/recent-activity",
      name: "Activité récente",
      description: "Timeline des actions",
    },
    {
      path: "/dashboard/alerts",
      name: "Alertes",
      description: "Notifications importantes",
    },
    {
      path: "/dashboard/formation-performance",
      name: "Performance des formations",
      description: "Métriques par formation",
    },
  ];

  console.log("\n📊 Test des APIs du dashboard:\n");

  for (const api of dashboardAPIs) {
    try {
      console.log(`🔍 Test: ${api.name}`);
      console.log(`   Description: ${api.description}`);

      const response = await fetch(`${API_BASE}${api.path}`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Succès (${response.status})`);
        console.log(`   📊 Données:`, JSON.stringify(data.data, null, 2));
      } else {
        console.log(`   ❌ Erreur (${response.status})`);
        const error = await response.text();
        console.log(`   💥 Message: ${error}`);
      }
    } catch (error) {
      console.log(`   💥 Exception: ${error.message}`);
    }

    console.log(""); // Ligne vide pour la lisibilité
  }

  console.log("🎉 Test des APIs du dashboard terminé !");
}

testDashboardAPIs().catch(console.error);

