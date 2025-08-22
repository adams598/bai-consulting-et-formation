import fetch from "node-fetch";

async function testLearnerSimple() {
  console.log("🔍 Test simple des routes learner...");

  try {
    const response = await fetch("http://localhost:3000/api/learner/auth/health");
    console.log(`Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Routes learner accessibles !");
      console.log("Réponse:", data);
    } else {
      console.log("❌ Routes learner répondent mais avec une erreur");
      const errorText = await response.text();
      console.log("Erreur:", errorText);
    }
  } catch (error) {
    console.log("❌ Impossible de se connecter aux routes learner");
    console.log("Erreur:", error.message);
  }
}

testLearnerSimple(); 