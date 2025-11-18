import fetch from "node-fetch";

const API_BASE = "http://localhost:3000/api/admin";

async function testFormationSimple() {
  console.log("🔍 Test très simple de la performance des formations\n");

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

  // Test simple des formations
  console.log("🔍 Test simple des formations...");
  try {
    const response = await fetch(`${API_BASE}/formations`, {
      method: "GET",
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Formations OK:", data.data.length, "formations");
      console.log(
        "📊 Première formation:",
        JSON.stringify(data.data[0], null, 2)
      );
    } else {
      const error = await response.text();
      console.log("❌ Erreur formations:", error);
    }
  } catch (error) {
    console.log("💥 Exception formations:", error.message);
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

testFormationSimple().catch(console.error);






































