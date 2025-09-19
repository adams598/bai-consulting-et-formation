import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDynamicFormationData() {
  try {
    console.log("🧪 Test des données dynamiques des formations...");

    // Récupérer une formation pour tester
    const formation = await prisma.formation.findFirst({
      include: {
        content: true,
      },
    });

    if (!formation) {
      console.log("❌ Aucune formation trouvée");
      return;
    }

    console.log(`📋 Formation testée: "${formation.title}"`);
    console.log("");

    // Tester les nouveaux champs
    console.log("🔍 Vérification des nouveaux champs:");
    console.log(`   Code: ${formation.code || "Non défini"}`);
    console.log(
      `   Modalité pédagogique: ${
        formation.pedagogicalModality || "Non définie"
      }`
    );
    console.log(`   Organisme: ${formation.organization || "Non défini"}`);
    console.log(`   Prérequis: ${formation.prerequisites || "Non définis"}`);
    console.log("");

    // Tester le parsing JSON
    console.log("📊 Test du parsing JSON:");

    if (formation.objectives) {
      try {
        const objectives = JSON.parse(formation.objectives);
        console.log(`   Objectifs (${objectives.length}):`);
        objectives.forEach((obj, index) => {
          console.log(`     ${index + 1}. ${obj}`);
        });
      } catch (error) {
        console.log(`   ❌ Erreur parsing objectifs: ${error.message}`);
      }
    }

    if (formation.detailedProgram) {
      try {
        const program = JSON.parse(formation.detailedProgram);
        console.log(`   Programme (${program.length} modules):`);
        program.forEach((module, index) => {
          console.log(`     ${index + 1}. ${module}`);
        });
      } catch (error) {
        console.log(`   ❌ Erreur parsing programme: ${error.message}`);
      }
    }

    if (formation.targetAudience) {
      try {
        const audience = JSON.parse(formation.targetAudience);
        console.log(`   Public concerné (${audience.length}):`);
        audience.forEach((aud, index) => {
          console.log(`     • ${aud}`);
        });
      } catch (error) {
        console.log(`   ❌ Erreur parsing public: ${error.message}`);
      }
    }

    console.log("");
    console.log("✅ Test terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testDynamicFormationData();




