import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

async function testServer() {
  try {
    console.log("🧪 Test du serveur backend...\n");

    // Attendre que le serveur démarre
    console.log("⏳ Attente du démarrage du serveur...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Test simple de connexion
    console.log("📡 Test de connexion au serveur...");
    try {
      const response = await fetch(`${BASE_URL}/api/admin/dashboard/stats`);
      console.log(`✅ Serveur accessible - Status: ${response.status}`);

      if (response.status === 401) {
        console.log("🔒 Serveur protégé par authentification (normal)");
      } else if (response.status === 200) {
        console.log("✅ Serveur accessible sans authentification");
      }
    } catch (error) {
      console.log("❌ Erreur de connexion:", error.message);
    }

    console.log("\n✅ Test du serveur terminé!");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

testServer();

