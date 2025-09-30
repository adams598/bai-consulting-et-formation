import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function adjustFormationData() {
  try {
    console.log("🔄 Ajustement des données des formations...");

    // 1. Récupérer toutes les formations existantes
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

    console.log(`📊 Formations trouvées: ${formations.length}`);

    // 2. Récupérer les univers disponibles
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

    // 3. Créer un univers par défaut "Mes Formations" s'il n'existe pas
    let defaultUniverse = universes.find((u) => u.id === "mes-formations");
    if (!defaultUniverse) {
      console.log('📝 Création de l\'univers par défaut "Mes Formations"...');
      defaultUniverse = await prisma.universe.create({
        data: {
          id: "mes-formations",
          name: "Mes Formations",
          description: "Formations par défaut",
          color: "#3B82F6",
          isActive: true,
        },
      });
      console.log('✅ Univers "Mes Formations" créé');
    }

    // 4. Ajuster chaque formation
    for (const formation of formations) {
      console.log(`\n🔄 Traitement de: ${formation.title}`);
      console.log(`   - universeId actuel: ${formation.universeId || "null"}`);
      console.log(
        `   - isOpportunity actuel: ${formation.isOpportunity || false}`
      );

      let needsUpdate = false;
      let newUniverseId = formation.universeId;
      let newIsOpportunity = formation.isOpportunity;

      // Si la formation n'a pas d'univers ET n'est pas marquée comme opportunité
      if (!formation.universeId && !formation.isOpportunity) {
        // Assigner à l'univers par défaut
        newUniverseId = "mes-formations";
        needsUpdate = true;
        console.log(`   ➡️  Assignation à l'univers "Mes Formations"`);
      }

      // Si la formation a une description vide mais n'est pas une opportunité
      if (!formation.description && !formation.isOpportunity && newUniverseId) {
        console.log(
          `   ⚠️  Formation sans description - ajout d'une description par défaut`
        );
        await prisma.formation.update({
          where: { id: formation.id },
          data: {
            description: "Formation en cours de configuration",
            objectives: formation.objectives || "Objectifs à définir",
          },
        });
        needsUpdate = false; // Déjà mis à jour
      }

      if (needsUpdate) {
        await prisma.formation.update({
          where: { id: formation.id },
          data: {
            universeId: newUniverseId,
            isOpportunity: newIsOpportunity,
          },
        });
        console.log(`   ✅ Formation mise à jour`);
      } else {
        console.log(`   ✅ Formation déjà correcte`);
      }
    }

    // 5. Vérifier le résultat final
    console.log("\n📊 Résultat final:");
    const finalFormations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        universeId: true,
        isOpportunity: true,
      },
    });

    const formationsByUniverse = {};
    const opportunityFormations = [];

    finalFormations.forEach((formation) => {
      if (formation.isOpportunity) {
        opportunityFormations.push(formation.title);
      } else if (formation.universeId) {
        if (!formationsByUniverse[formation.universeId]) {
          formationsByUniverse[formation.universeId] = [];
        }
        formationsByUniverse[formation.universeId].push(formation.title);
      }
    });

    console.log(
      `📊 Formations d'opportunités commerciales: ${opportunityFormations.length}`
    );
    opportunityFormations.forEach((title) => console.log(`  - ${title}`));

    console.log(`📊 Formations par univers:`);
    Object.entries(formationsByUniverse).forEach(([universeId, titles]) => {
      const universe = universes.find((u) => u.id === universeId);
      console.log(
        `  - ${universe ? universe.name : universeId}: ${
          titles.length
        } formations`
      );
      titles.forEach((title) => console.log(`    - ${title}`));
    });

    console.log("\n✅ Ajustement terminé !");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

adjustFormationData();

