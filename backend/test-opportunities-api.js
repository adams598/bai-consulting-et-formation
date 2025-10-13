import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

async function testOpportunitiesAPI() {
  console.log("🧪 Test des routes API Opportunities...\n");

  try {
    // Test 1: Récupérer les fichiers PDF
    console.log("1️⃣ Test GET /api/admin/opportunities/files");
    const response = await fetch(`${BASE_URL}/api/admin/opportunities/files`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Note: En production, il faudrait un token d'authentification
      },
    });

    console.log("Status:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Réponse:", data);
    } else {
      const errorText = await response.text();
      console.log("❌ Erreur:", errorText);
    }
  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);
  }
}

// Lancer le test
testOpportunitiesAPI();














