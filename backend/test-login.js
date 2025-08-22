import fetch from "node-fetch";

const API_BASE = "http://localhost:3000/api/admin";

async function testAPI() {
  try {
    console.log("🧪 Test de l'API Backend BAI Consulting\n");

    // 1. Test de l'endpoint de santé
    console.log("1. Test de l'endpoint de santé...");
    const healthResponse = await fetch(`${API_BASE}/auth/health`);
    const healthData = await healthResponse.json();
    console.log("✅ Endpoint de santé:", healthData.message);

    // 2. Test de connexion
    console.log("\n2. Test de connexion...");
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
      const errorData = await loginResponse.json();
      console.log("❌ Erreur de connexion:", errorData.message);
      return;
    }

    const loginData = await loginResponse.json();
    console.log("✅ Connexion réussie pour:", loginData.data.user.email);

    const token = loginData.data.accessToken;
    console.log("🔑 Token obtenu:", token.substring(0, 20) + "...");

    // 3. Test de l'endpoint de profil
    console.log("\n3. Test de l'endpoint de profil...");
    console.log("URL:", `${API_BASE}/profile`);
    console.log("Token:", token.substring(0, 20) + "...");

    const profileResponse = await fetch(`${API_BASE}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Status:", profileResponse.status);
    console.log(
      "Headers:",
      Object.fromEntries(profileResponse.headers.entries())
    );

    if (!profileResponse.ok) {
      const responseText = await profileResponse.text();
      console.log("❌ Réponse d'erreur:", responseText);

      try {
        const errorData = JSON.parse(responseText);
        console.log("❌ Erreur profil:", errorData.message);
      } catch (e) {
        console.log("❌ Réponse non-JSON reçue");
      }
      return;
    }

    const profileData = await profileResponse.json();
    console.log(
      "✅ Profil récupéré:",
      profileData.data.firstName,
      profileData.data.lastName
    );
    console.log("📧 Email:", profileData.data.email);
    console.log("📱 Téléphone:", profileData.data.phone || "Non défini");
    console.log("🏢 Département:", profileData.data.department || "Non défini");
    console.log(
      "🖼️ Avatar:",
      profileData.data.avatar ? "Défini" : "Non défini"
    );

    console.log("\n🎉 Test de profil réussi !");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
    console.error("Stack:", error.stack);
  }
}

testAPI();
