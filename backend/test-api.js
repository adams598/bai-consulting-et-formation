import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

async function testAPI() {
  console.log("🧪 Test de l'API Backend BAI Consulting\n");

  try {
    // Test 1: Endpoint de santé
    console.log("1️⃣ Test endpoint de santé...");
    const healthResponse = await fetch(`${BASE_URL}/api/admin/auth/health`);
    console.log(`   Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   Réponse: ${JSON.stringify(healthData, null, 2)}`);
    }
    console.log("");

    // Test 2: Login avec les identifiants de test
    console.log("2️⃣ Test de connexion...");
    const loginData = {
      email: "admin@bai-consulting.com",
      password: "admin123",
    };

    const loginResponse = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    console.log(`   Status: ${loginResponse.status}`);
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log(`   Connexion réussie pour: ${loginResult.data.user.email}`);
      console.log(`   Rôle: ${loginResult.data.user.role}`);

      const accessToken = loginResult.data.accessToken;

      // Test 3: Récupération des banques avec token
      console.log("\n3️⃣ Test récupération des banques...");
      const banksResponse = await fetch(`${BASE_URL}/api/admin/banks`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log(`   Status: ${banksResponse.status}`);
      if (banksResponse.ok) {
        const banksData = await banksResponse.json();
        console.log(`   Nombre de banques: ${banksData.data.length}`);
        banksData.data.forEach((bank) => {
          console.log(`   - ${bank.name} (${bank.code})`);
        });
      }

      // Test 4: Récupération des formations
      console.log("\n4️⃣ Test récupération des formations...");
      const formationsResponse = await fetch(
        `${BASE_URL}/api/admin/formations`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log(`   Status: ${formationsResponse.status}`);
      if (formationsResponse.ok) {
        const formationsData = await formationsResponse.json();
        console.log(`   Nombre de formations: ${formationsData.data.length}`);
        formationsData.data.forEach((formation) => {
          console.log(`   - ${formation.title} (${formation.type})`);
        });
      }

      // Test 5: Récupération des utilisateurs
      console.log("\n5️⃣ Test récupération des utilisateurs...");
      const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log(`   Status: ${usersResponse.status}`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log(`   Nombre d'utilisateurs: ${usersData.data.length}`);
        usersData.data.forEach((user) => {
          console.log(
            `   - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`
          );
        });
      }
    } else {
      const errorData = await loginResponse.json();
      console.log(`   Erreur de connexion: ${errorData.error}`);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  }

  console.log("\n✅ Test terminé");
}

// Lancer le test
testAPI();
