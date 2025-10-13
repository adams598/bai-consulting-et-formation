import fetch from "node-fetch";

const API_BASE = "http://localhost:3000/api/admin";

async function testSimpleDebug() {
  console.log("🔍 Test très simple de debug\n");

  // Connexion
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

  const loginData = await loginResponse.json();
  const token = loginData.data.accessToken;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Test des stats (qui fonctionnent)
  console.log("🔍 Test des stats (qui fonctionnent)...");
  try {
    const response = await fetch(`${API_BASE}/dashboard/stats`, {
      method: "GET",
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Stats OK:", data.data.totalFormations, "formations");
    } else {
      const error = await response.text();
      console.log("❌ Erreur stats:", error);
    }
  } catch (error) {
    console.log("💥 Exception stats:", error.message);
  }

  // Test de l'activité récente
  console.log("\n🔍 Test de l'activité récente...");
  try {
    const response = await fetch(`${API_BASE}/dashboard/recent-activity`, {
      method: "GET",
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Activité récente OK:", data.data.length, "activités");
    } else {
      const error = await response.text();
      console.log("❌ Erreur activité récente:", error);
    }
  } catch (error) {
    console.log("💥 Exception activité récente:", error.message);
  }

  // Test de la performance des formations
  console.log("\n🔍 Test de la performance des formations...");
  try {
    const response = await fetch(
      `${API_BASE}/dashboard/formation-performance`,
      {
        method: "GET",
        headers,
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(
        "✅ Performance formations OK:",
        data.data.length,
        "formations"
      );
    } else {
      const error = await response.text();
      console.log("❌ Erreur performance formations:", error);
    }
  } catch (error) {
    console.log("💥 Exception performance formations:", error.message);
  }
}

testSimpleDebug().catch(console.error);























