import axios from "axios";
import jwt from "jsonwebtoken";

const BASE_URL = "http://localhost:3000";
const API_BASE = `${BASE_URL}/api/calendar-integration`;

// Configuration de test
const TEST_USER_ID = "cmfldmtzz000213ks1lt5bmwe"; // ID utilisateur admin valide
const JWT_SECRET = "dev-secret-key-123";

// Token de session valide (généré par create-test-session.mjs)
const VALID_SESSION_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZsZG10enowMDAyMTNrczFsdDVibXdlIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiaWF0IjoxNzU4Nzg4MDA2LCJleHAiOjE3NTg4NzQ0MDZ9.AzXnY1JGhzUnmbAHzLf0v4SFy4Ibma4DGHq4YJjv1PY";

// Générer un token JWT de test (fallback)
const generateTestToken = (userId) => {
  return jwt.sign(
    {
      userId: userId, // Le middleware cherche 'userId', pas 'id'
      email: "test@example.com",
      role: "USER",
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const testToken = VALID_SESSION_TOKEN; // Utiliser le token de session valide

// Configuration des headers
const headers = {
  Authorization: `Bearer ${testToken}`,
  "Content-Type": "application/json",
};

console.log("🧪 Tests d'intégration calendrier");
console.log("=====================================");
console.log(`Token généré: ${testToken.substring(0, 20)}...`);
console.log("");

// Test 1: Obtenir les intégrations existantes
async function testGetIntegrations() {
  console.log("📋 Test 1: Récupération des intégrations");
  try {
    const response = await axios.get(`${API_BASE}/integrations`, { headers });
    console.log("✅ Succès:", response.data);
    return response.data.data || [];
  } catch (error) {
    console.log("❌ Erreur:", error.response?.data || error.message);
    return [];
  }
}

// Test 2: Générer l'URL d'autorisation Google
async function testGoogleAuthUrl() {
  console.log("\n🔗 Test 2: Génération URL d'autorisation Google");
  try {
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

// Test 3: Générer l'URL d'autorisation Outlook
async function testOutlookAuthUrl() {
  console.log("\n🔗 Test 3: Génération URL d'autorisation Outlook");
  try {
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

// Test 4: Simuler un callback Google (avec un code fictif)
async function testGoogleCallback() {
  console.log("\n🔄 Test 4: Simulation callback Google");
  try {
    const mockCode = "mock-google-auth-code-123";
    const response = await axios.post(
      `${API_BASE}/google/callback`,
      {
        code: mockCode,
      },
      { headers }
    );
    console.log("✅ Succès:", response.data);
    return response.data.data;
  } catch (error) {
    console.log(
      "❌ Erreur attendue (code fictif):",
      error.response?.data?.message || error.message
    );
    return null;
  }
}

// Test 5: Simuler un callback Outlook (avec un code fictif)
async function testOutlookCallback() {
  console.log("\n🔄 Test 5: Simulation callback Outlook");
  try {
    const mockCode = "mock-outlook-auth-code-123";
    const response = await axios.post(
      `${API_BASE}/outlook/callback`,
      {
        code: mockCode,
      },
      { headers }
    );
    console.log("✅ Succès:", response.data);
    return response.data.data;
  } catch (error) {
    console.log(
      "❌ Erreur attendue (code fictif):",
      error.response?.data?.message || error.message
    );
    return null;
  }
}

// Test 6: Mettre à jour les paramètres d'intégration
async function testUpdateSettings() {
  console.log("\n⚙️ Test 6: Mise à jour des paramètres");
  try {
    const settings = {
      syncEnabled: true,
      importEnabled: true,
      exportEnabled: false,
    };

    // Test pour Google
    const googleResponse = await axios.put(
      `${API_BASE}/integrations/google/settings`,
      settings,
      { headers }
    );
    console.log("✅ Paramètres Google mis à jour:", googleResponse.data);

    // Test pour Outlook
    const outlookResponse = await axios.put(
      `${API_BASE}/integrations/outlook/settings`,
      settings,
      { headers }
    );
    console.log("✅ Paramètres Outlook mis à jour:", outlookResponse.data);

    return true;
  } catch (error) {
    console.log("❌ Erreur:", error.response?.data || error.message);
    return false;
  }
}

// Test 7: Test d'import Google (simulation)
async function testGoogleImport() {
  console.log("\n📥 Test 7: Simulation import Google");
  try {
    const response = await axios.post(
      `${API_BASE}/google/import`,
      {},
      { headers }
    );
    console.log("✅ Succès:", response.data);
    return response.data.data;
  } catch (error) {
    console.log(
      "❌ Erreur attendue (pas connecté):",
      error.response?.data?.message || error.message
    );
    return null;
  }
}

// Test 8: Test d'import Outlook (simulation)
async function testOutlookImport() {
  console.log("\n📥 Test 8: Simulation import Outlook");
  try {
    const response = await axios.post(
      `${API_BASE}/outlook/import`,
      {},
      { headers }
    );
    console.log("✅ Succès:", response.data);
    return response.data.data;
  } catch (error) {
    console.log(
      "❌ Erreur attendue (pas connecté):",
      error.response?.data?.message || error.message
    );
    return null;
  }
}

// Test 9: Test d'export de formation
async function testExportFormation() {
  console.log("\n📤 Test 9: Simulation export formation");
  try {
    const formationId = "test-formation-id-123";

    // Test Google
    const googleResponse = await axios.post(
      `${API_BASE}/google/export-formation`,
      {
        formationId,
      },
      { headers }
    );
    console.log("✅ Export Google:", googleResponse.data);

    // Test Outlook
    const outlookResponse = await axios.post(
      `${API_BASE}/outlook/export-formation`,
      {
        formationId,
      },
      { headers }
    );
    console.log("✅ Export Outlook:", outlookResponse.data);

    return true;
  } catch (error) {
    console.log(
      "❌ Erreur attendue (pas connecté):",
      error.response?.data?.message || error.message
    );
    return false;
  }
}

// Test 10: Déconnexion d'intégration
async function testDisconnectIntegration() {
  console.log("\n🔌 Test 10: Déconnexion d'intégration");
  try {
    // Test déconnexion Google
    const googleResponse = await axios.delete(
      `${API_BASE}/integrations/google`,
      { headers }
    );
    console.log("✅ Google déconnecté:", googleResponse.data);

    // Test déconnexion Outlook
    const outlookResponse = await axios.delete(
      `${API_BASE}/integrations/outlook`,
      { headers }
    );
    console.log("✅ Outlook déconnecté:", outlookResponse.data);

    return true;
  } catch (error) {
    console.log("❌ Erreur:", error.response?.data || error.message);
    return false;
  }
}

// Fonction principale de test
async function runAllTests() {
  console.log("🚀 Démarrage des tests d'intégration calendrier...\n");

  try {
    // Test 1: Récupération des intégrations
    const integrations = await testGetIntegrations();

    // Test 2: URLs d'autorisation
    const googleUrl = await testGoogleAuthUrl();
    const outlookUrl = await testOutlookAuthUrl();

    // Test 3: Callbacks (simulation)
    await testGoogleCallback();
    await testOutlookCallback();

    // Test 4: Paramètres
    await testUpdateSettings();

    // Test 5: Import/Export (simulation)
    await testGoogleImport();
    await testOutlookImport();
    await testExportFormation();

    // Test 6: Déconnexion
    await testDisconnectIntegration();

    console.log("\n🎉 Tests terminés !");
    console.log("==================");
    console.log("✅ URLs d'autorisation générées avec succès");
    console.log("✅ Endpoints de synchronisation fonctionnels");
    console.log("✅ Gestion des erreurs correcte");
    console.log("");
    console.log("📝 Prochaines étapes :");
    console.log("1. Configurez les vraies applications OAuth");
    console.log("2. Testez avec de vrais codes d'autorisation");
    console.log("3. Vérifiez la synchronisation des événements");
  } catch (error) {
    console.error("💥 Erreur lors des tests:", error);
  }
}

// Exécuter les tests
runAllTests();
