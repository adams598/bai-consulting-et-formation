import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

async function testWebAPIs() {
  try {
    console.log("🌐 Test des APIs web...\n");

    // Attendre que le serveur démarre
    console.log("⏳ Attente du démarrage du serveur...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 1. Test des statistiques globales
    console.log("📊 Test des statistiques globales...");
    try {
      const statsResponse = await fetch(
        `${BASE_URL}/api/admin/dashboard/stats`
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log("✅ Statistiques récupérées via API:");
        console.log(`   🏦 Banques: ${statsData.data.totalBanks}`);
        console.log(`   👥 Utilisateurs: ${statsData.data.totalUsers}`);
        console.log(`   📚 Formations: ${statsData.data.totalFormations}`);
        console.log(
          `   ✅ Formations terminées: ${statsData.data.completedFormations}`
        );
        console.log(`   🔄 Utilisateurs actifs: ${statsData.data.activeUsers}`);
        console.log(
          `   ⏳ Assignations en attente: ${statsData.data.pendingAssignments}`
        );
      } else {
        console.log(`❌ Erreur stats: ${statsResponse.status}`);
      }
    } catch (error) {
      console.log("❌ Erreur de connexion au serveur:", error.message);
    }

    // 2. Test des statistiques par banque
    console.log("\n🏦 Test des statistiques par banque...");
    try {
      const bankStatsResponse = await fetch(
        `${BASE_URL}/api/admin/dashboard/bank-stats`
      );

      if (bankStatsResponse.ok) {
        const bankStatsData = await bankStatsResponse.json();
        console.log("✅ Statistiques des banques récupérées via API:");

        if (bankStatsData.data.length > 0) {
          bankStatsData.data.forEach((bank) => {
            console.log(`   ${bank.bankName}:`);
            console.log(`     👥 Collaborateurs: ${bank.userCount}`);
            console.log(`     📚 Formations: ${bank.formationCount}`);
            console.log(`     📈 Taux de réussite: ${bank.completionRate}%`);
          });
        } else {
          console.log("   Aucune banque trouvée");
        }
      } else {
        console.log(`❌ Erreur bank stats: ${bankStatsResponse.status}`);
      }
    } catch (error) {
      console.log("❌ Erreur de connexion au serveur:", error.message);
    }

    console.log("\n✅ Test des APIs web terminé!");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

testWebAPIs();

