import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyFormationData() {
  try {
    console.log("🔍 Vérification des données des formations...");

    // 1. Récupérer toutes les formations
    const formations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        universeId: true,
        isOpportunity: true,
        description: true,
        objectives: true,
        isActive: true,
      },
    });

    console.log(`📊 Total des formations: ${formations.length}`);

    // 2. Récupérer tous les univers
    const universes = await prisma.universe.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        isActive: true,
      },
    });

    console.log(`📊 Total des univers: ${universes.length}`);
    universes.forEach((universe) => {
      console.log(
        `  - ${universe.name} (${universe.id}) - Couleur: ${universe.color}`
      );
    });

    // 3. Analyser les formations
    console.log("\n📊 Analyse des formations:");

    const opportunityFormations = formations.filter((f) => f.isOpportunity);
    const universeFormations = formations.filter((f) => !f.isOpportunity);
    const orphanFormations = formations.filter(
      (f) => !f.isOpportunity && !f.universeId
    );

    console.log(
      `  - Formations d'opportunités commerciales: ${opportunityFormations.length}`
    );
    opportunityFormations.forEach((f) => {
      console.log(`    * ${f.title} (${f.id})`);
    });

    console.log(`  - Formations d'univers: ${universeFormations.length}`);
    universeFormations.forEach((f) => {
      const universe = universes.find((u) => u.id === f.universeId);
      console.log(
        `    * ${f.title} -> ${
          universe ? universe.name : f.universeId || "Sans univers"
        }`
      );
    });

    console.log(
      `  - Formations orphelines (sans univers et sans opportunité): ${orphanFormations.length}`
    );
    orphanFormations.forEach((f) => {
      console.log(`    * ${f.title} (⚠️ PROBLÈME)`);
    });

    // 4. Grouper par univers
    console.log("\n📊 Groupement par univers:");
    const formationsByUniverse = {};

    universeFormations.forEach((formation) => {
      const universeId = formation.universeId || "mes-formations";
      if (!formationsByUniverse[universeId]) {
        formationsByUniverse[universeId] = [];
      }
      formationsByUniverse[universeId].push(formation);
    });

    Object.entries(formationsByUniverse).forEach(
      ([universeId, universeFormations]) => {
        const universe = universes.find((u) => u.id === universeId);
        console.log(
          `  - ${universe ? universe.name : `Univers ${universeId}`}: ${
            universeFormations.length
          } formations`
        );
        universeFormations.forEach((f) => {
          console.log(`    * ${f.title}`);
        });
      }
    );

    // 5. Vérifications de cohérence
    console.log("\n🔍 Vérifications de cohérence:");

    // Vérifier qu'il n'y a pas de formations sans description et sans objectifs (sauf opportunités)
    const formationsSansDescription = formations.filter(
      (f) => !f.isOpportunity && (!f.description || !f.objectives)
    );
    if (formationsSansDescription.length > 0) {
      console.log(
        `  ⚠️ ${formationsSansDescription.length} formations sans description/objectifs:`
      );
      formationsSansDescription.forEach((f) => {
        console.log(
          `    * ${f.title} - Description: ${
            f.description ? "OK" : "MANQUANTE"
          }, Objectifs: ${f.objectives ? "OK" : "MANQUANTS"}`
        );
      });
    } else {
      console.log(
        "  ✅ Toutes les formations d'univers ont une description et des objectifs"
      );
    }

    // Vérifier que toutes les formations ont un statut cohérent
    const formationsInactives = formations.filter((f) => !f.isActive);
    console.log(`  - Formations inactives: ${formationsInactives.length}`);

    console.log("\n✅ Vérification terminée !");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFormationData();

