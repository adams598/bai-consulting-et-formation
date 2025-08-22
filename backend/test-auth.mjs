import fetch from "node-fetch";

async function testAuth() {
  try {
    console.log("Test de connexion à l'API...");

    const response = await fetch("http://localhost:3000/api/admin/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@bai-consulting.com",
        password: "admin123",
      }),
    });

    console.log("Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("Connexion réussie:", data);

      // Test de récupération des banques avec le token
      const token = data.data.accessToken;
      console.log("\nTest de récupération des banques...");

      const banksResponse = await fetch(
        "http://localhost:3000/api/admin/banks",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Status banques:", banksResponse.status);

      if (banksResponse.ok) {
        const banksData = await banksResponse.json();
        console.log("Banques récupérées:", banksData);
      } else {
        const errorData = await banksResponse.text();
        console.log("Erreur banques:", errorData);
      }
    } else {
      const errorData = await response.text();
      console.log("Erreur de connexion:", errorData);
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
}

testAuth();
