import axios from "axios";

const BASE_URL = "http://localhost:3000";
const API_BASE = `${BASE_URL}/api/calendar-integration`;

// Token de session valide (nouveau)
const VALID_SESSION_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZsZG10enowMDAyMTNrczFsdDVibXdlIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiaWF0IjoxNzU4Nzg5MDYxLCJleHAiOjE3NTg4NzU0NjF9.LUXPJn7xDwtBosuSi8Ee-_V9C4wKFUHIIX_464beTPc";

const headers = {
  Authorization: `Bearer ${VALID_SESSION_TOKEN}`,
  "Content-Type": "application/json",
};

async function testGoogleAuthUrl() {
  try {
    console.log("🔗 Test de génération URL Google...");
    const response = await axios.get(`${API_BASE}/google/auth-url`, {
      headers,
    });
    console.log("✅ Succès:", response.data);
    console.log("URL générée:", response.data.data.authUrl);
    return response.data.data.authUrl;
  } catch (error) {
    console.log("❌ Erreur:", error.response?.data || error.message);
    return null;
  }
}

async function testOutlookAuthUrl() {
  try {
    console.log("\n🔗 Test de génération URL Outlook...");
    const response = await axios.get(`${API_BASE}/outlook/auth-url`, {
      headers,
    });
    console.log("✅ Succès:", response.data);
    console.log("URL générée:", response.data.data.authUrl);
    return response.data.data.authUrl;
  } catch (error) {
    console.log("❌ Erreur:", error.response?.data || error.message);
    return null;
  }
}

async function testIntegrations() {
  try {
    console.log("\n📋 Test de récupération des intégrations...");
    const response = await axios.get(`${API_BASE}/integrations`, { headers });
    console.log("✅ Succès:", response.data);
    return response.data.data || [];
  } catch (error) {
    console.log("❌ Erreur:", error.response?.data || error.message);
    return [];
  }
}

async function runTests() {
  console.log("🧪 Tests rapides de l'API calendrier");
  console.log("=====================================");

  // Attendre que le serveur soit prêt
  console.log("⏳ Attente du serveur...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await testIntegrations();
  await testGoogleAuthUrl();
  await testOutlookAuthUrl();

  console.log("\n🎉 Tests terminés !");
}

runTests();
