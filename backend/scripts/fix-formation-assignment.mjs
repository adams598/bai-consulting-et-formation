import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixFormationAssignment() {
  try {
    console.log("🔧 Correction de l'assignation des formations...");

    // 1. Récupérer toutes les formations
    const formations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        universeId: true,
        isOpportunity: true,
        description: true,
        objectives: true,
      },
    });

    console.log(`📊 Formations à corriger: ${formations.length}`);

    // 2. Récupérer les univers
    const universes = await prisma.universe.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`📊 Univers disponibles: ${universes.length}`);
    universes.forEach((universe) => {
      console.log(`  - ${universe.name} (${universe.id})`);
    });

    // 3. Corriger chaque formation
    for (const formation of formations) {
      console.log(`\n🔧 Correction de: ${formation.title}`);
      console.log(`   - universeId actuel: ${formation.universeId || "null"}`);
      console.log(
        `   - isOpportunity actuel: ${formation.isOpportunity || false}`
      );
      console.log(
        `   - description: ${formation.description ? "OK" : "MANQUANTE"}`
      );
      console.log(
        `   - objectives: ${formation.objectives ? "OK" : "MANQUANTS"}`
      );

      let needsUpdate = false;
      const updates = {};

      // Si la formation est assignée à l'univers "Traitement des opportunités commerciales" mais n'est pas marquée comme opportunité
      if (
        formation.universeId &&
        formation.universeId !== "mes-formations" &&
        !formation.isOpportunity
      ) {
        // Vérifier si c'est l'univers des opportunités commerciales
        const universe = universes.find((u) => u.id === formation.universeId);
        if (
          universe &&
          universe.name === "Traitement des opportunités commerciales"
        ) {
          // Marquer comme opportunité commerciale
          updates.isOpportunity = true;
          needsUpdate = true;
          console.log(
            `   ➡️  Marquer comme formation d'opportunités commerciales`
          );
        } else {
          // Assigner à "Mes Formations"
          updates.universeId = "mes-formations";
          needsUpdate = true;
          console.log(`   ➡️  Assigner à l'univers "Mes Formations"`);
        }
      }

      // Si la formation n'a pas d'objectifs, en ajouter
      if (!formation.objectives) {
        updates.objectives = "Objectifs à définir";
        needsUpdate = true;
        console.log(`   ➡️  Ajouter des objectifs par défaut`);
      }

      // Si la formation n'a pas de description, en ajouter
      if (!formation.description) {
        updates.description = "Formation en cours de configuration";
        needsUpdate = true;
        console.log(`   ➡️  Ajouter une description par défaut`);
      }

      if (needsUpdate) {
        await prisma.formation.update({
          where: { id: formation.id },
          data: updates,
        });
        console.log(`   ✅ Formation mise à jour:`, updates);
      } else {
        console.log(`   ✅ Formation déjà correcte`);
      }
    }

    // 4. Vérifier le résultat final
    console.log("\n📊 Résultat final:");
    const finalFormations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        universeId: true,
        isOpportunity: true,
        description: true,
        objectives: true,
      },
    });

    const opportunityFormations = finalFormations.filter(
      (f) => f.isOpportunity
    );
    const universeFormations = finalFormations.filter((f) => !f.isOpportunity);

    console.log(
      `📊 Formations d'opportunités commerciales: ${opportunityFormations.length}`
    );
    opportunityFormations.forEach((f) => {
      console.log(`  - ${f.title}`);
    });

    console.log(`📊 Formations d'univers:`);
    const formationsByUniverse = {};
    universeFormations.forEach((formation) => {
      const universeId = formation.universeId || "mes-formations";
      if (!formationsByUniverse[universeId]) {
        formationsByUniverse[universeId] = [];
      }
      formationsByUniverse[universeId].push(formation);
    });

    Object.entries(formationsByUniverse).forEach(([universeId, formations]) => {
      const universe = universes.find((u) => u.id === universeId);
      console.log(
        `  - ${universe ? universe.name : `Univers ${universeId}`}: ${
          formations.length
        } formations`
      );
      formations.forEach((f) => {
        console.log(`    * ${f.title}`);
      });
    });

    console.log("\n✅ Correction terminée !");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFormationAssignment();

