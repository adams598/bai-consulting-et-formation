import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyUniverses() {
  try {
    console.log("🔍 Vérification complète des univers...");

    // Vérifier les univers
    const universes = await prisma.universe.findMany({
      include: {
        formations: {
          include: {
            formation: {
              select: {
                id: true,
                title: true,
                isActive: true,
                universeId: true,
              },
            },
          },
        },
        directFormations: {
          select: {
            id: true,
            title: true,
            isActive: true,
            universeId: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`\n📊 Résumé:`);
    console.log(`  - Nombre d'univers: ${universes.length}`);

    let totalRelations = 0;
    let totalDirectFormations = 0;

    universes.forEach((universe) => {
      totalRelations += universe.formations.length;
      totalDirectFormations += universe.directFormations.length;
    });

    console.log(`  - Relations UniverseFormation: ${totalRelations}`);
    console.log(`  - Formations directes: ${totalDirectFormations}`);

    console.log("\n📋 Détail des univers:");
    universes.forEach((universe) => {
      console.log(`\n🏷️ ${universe.name} (${universe.color})`);
      console.log(`   Description: ${universe.description}`);
      console.log(
        `   Formations via UniverseFormation (${universe.formations.length}):`
      );
      universe.formations.forEach((uf) => {
        console.log(
          `     - ${uf.formation.title} (universeId: ${uf.formation.universeId})`
        );
      });
      console.log(
        `   Formations directes (${universe.directFormations.length}):`
      );
      universe.directFormations.forEach((formation) => {
        console.log(
          `     - ${formation.title} (universeId: ${formation.universeId})`
        );
      });
    });

    // Vérifier les formations sans univers
    const formationsWithoutUniverse = await prisma.formation.findMany({
      where: {
        universeId: null,
      },
      select: {
        id: true,
        title: true,
        isActive: true,
      },
    });

    console.log(
      `\n⚠️ Formations sans univers (${formationsWithoutUniverse.length}):`
    );
    formationsWithoutUniverse.forEach((formation) => {
      console.log(`  - ${formation.title}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la vérification
verifyUniverses();
