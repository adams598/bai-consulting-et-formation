import fetch from "node-fetch";

async function simpleTest() {
  console.log("🔍 Test simple de connectivité...");
  
  try {
    const response = await fetch("http://localhost:3000/api/admin/auth/health");
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Serveur accessible !");
      console.log("Réponse:", data);
    } else {
      console.log("❌ Serveur répond mais avec une erreur");
    }
  } catch (error) {
    console.log("❌ Impossible de se connecter au serveur");
    console.log("Erreur:", error.message);
  }
}

simpleTest(); 