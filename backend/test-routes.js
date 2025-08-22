import fetch from "node-fetch";

const API_BASE = "http://localhost:3000/api/admin";

async function testRoutes() {
  console.log("🧪 Test de toutes les routes disponibles\n");

  const routes = [
    { path: "/auth/health", method: "GET", auth: false },
    { path: "/auth/login", method: "POST", auth: false },
    { path: "/profile", method: "GET", auth: true },
    { path: "/profile", method: "PUT", auth: true },
    { path: "/profile/password", method: "PUT", auth: true },
    { path: "/banks", method: "GET", auth: true },
    { path: "/formations", method: "GET", auth: true },
    { path: "/users", method: "GET", auth: true },
    { path: "/dashboard/stats", method: "GET", auth: true },
  ];

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

  // Tester chaque route
  for (const route of routes) {
    console.log(`\n📡 Test de ${route.method} ${route.path}...`);

    const headers = {
      "Content-Type": "application/json",
    };

    if (route.auth && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
      method: route.method,
      headers,
    };

    if (route.method === "POST" || route.method === "PUT") {
      options.body = JSON.stringify({ test: "data" });
    }

    try {
      const response = await fetch(`${API_BASE}${route.path}`, options);
      console.log(`   Status: ${response.status}`);

      if (response.ok) {
        console.log(`   ✅ Route accessible`);
      } else {
        const responseText = await response.text();
        if (
          responseText.includes("Cannot GET") ||
          responseText.includes("Cannot POST") ||
          responseText.includes("Cannot PUT")
        ) {
          console.log(`   ❌ Route non trouvée`);
        } else {
          console.log(`   ⚠️ Route accessible mais erreur: ${response.status}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  }

  console.log("\n🎉 Test des routes terminé !");
}

testRoutes();
