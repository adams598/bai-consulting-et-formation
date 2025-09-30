import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log("🔧 Création des données de test...");

    // Récupérer un utilisateur admin pour être le créateur
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          in: ["SUPER_ADMIN", "BANK_ADMIN"],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!adminUser) {
      console.error("❌ Aucun utilisateur admin trouvé");
      return;
    }

    console.log(
      `📝 Création par: ${adminUser.firstName} ${adminUser.lastName}`
    );

    // 1. Créer l'univers "Immobilier"
    console.log("\n🏢 Création de l'univers 'Immobilier'...");
    const universImmobilier = await prisma.universe.create({
      data: {
        id: "immobilier",
        name: "Immobilier",
        description: "Formations spécialisées dans le secteur immobilier",
        color: "#10B981", // Vert
        isActive: true,
      },
    });
    console.log("✅ Univers 'Immobilier' créé:", universImmobilier.id);

    // 2. Créer l'univers "Traitement des opportunités commerciales" (s'il n'existe pas déjà)
    console.log(
      "\n💼 Vérification de l'univers 'Traitement des opportunités commerciales'..."
    );
    let universOpportunites = await prisma.universe.findUnique({
      where: { id: "opportunites-commerciales" },
    });

    if (!universOpportunites) {
      universOpportunites = await prisma.universe.create({
        data: {
          id: "opportunites-commerciales",
          name: "Traitement des opportunités commerciales",
          description:
            "Formations vidéo avec quiz pour le traitement des opportunités commerciales",
          color: "#F59E0B", // Orange
          isActive: true,
        },
      });
      console.log(
        "✅ Univers 'Traitement des opportunités commerciales' créé:",
        universOpportunites.id
      );
    } else {
      console.log(
        "✅ Univers 'Traitement des opportunités commerciales' existe déjà:",
        universOpportunites.id
      );
    }

    // 3. Créer la formation TestOC (Opportunités Commerciales)
    console.log("\n🎥 Création de la formation 'TestOC'...");
    const formationTestOC = await prisma.formation.create({
      data: {
        title: "TestOC",
        description: "Formation test pour les opportunités commerciales",
        objectives: "Objectifs de la formation TestOC",
        duration: 45,
        isActive: true,
        hasQuiz: true,
        quizRequired: true,
        code: "TESTOC001",
        pedagogicalModality: "Vidéo",
        organization: "BAI Consulting",
        prerequisites: "Aucun prérequis",
        detailedProgram: JSON.stringify([
          "Module 1: Introduction aux opportunités commerciales",
          "Module 2: Techniques de prospection",
          "Module 3: Gestion des leads",
        ]),
        targetAudience: JSON.stringify(["Commercial", "Manager"]),
        createdBy: adminUser.id,
        universeId: null, // Pas d'univers pour les opportunités commerciales
        isOpportunity: true, // Marquer comme formation d'opportunités commerciales
      },
    });
    console.log("✅ Formation 'TestOC' créée:", formationTestOC.id);

    // 4. Créer la formation TestIm (Immobilier)
    console.log("\n🏠 Création de la formation 'TestIm'...");
    const formationTestIm = await prisma.formation.create({
      data: {
        title: "TestIm",
        description: "Formation test pour le secteur immobilier",
        objectives: "Objectifs de la formation TestIm",
        duration: 90,
        isActive: true,
        hasQuiz: false,
        quizRequired: false,
        code: "TESTIM001",
        pedagogicalModality: "E-learning",
        organization: "BAI Consulting",
        prerequisites: "Connaissances de base en immobilier",
        detailedProgram: JSON.stringify([
          "Module 1: Introduction à l'immobilier",
          "Module 2: Réglementation immobilière",
          "Module 3: Techniques de vente immobilière",
          "Module 4: Gestion des biens",
        ]),
        targetAudience: JSON.stringify(["Agent immobilier", "Gestionnaire"]),
        createdBy: adminUser.id,
        universeId: "immobilier", // Assigner à l'univers Immobilier
        isOpportunity: false, // Formation d'univers classique
      },
    });
    console.log("✅ Formation 'TestIm' créée:", formationTestIm.id);

    // 5. Vérifier le résultat final
    console.log("\n📊 Vérification du résultat final...");

    const allUniverses = await prisma.universe.findMany({
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    const allFormations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        universeId: true,
        isOpportunity: true,
      },
    });

    console.log(`\n📊 Univers disponibles (${allUniverses.length}):`);
    allUniverses.forEach((universe) => {
      console.log(
        `  - ${universe.name} (${universe.id}) - Couleur: ${universe.color}`
      );
    });

    console.log(`\n📊 Formations disponibles (${allFormations.length}):`);
    allFormations.forEach((formation) => {
      const type = formation.isOpportunity
        ? "Opportunités Commerciales"
        : "Univers";
      const universeName = formation.isOpportunity
        ? "N/A (Opportunités)"
        : allUniverses.find((u) => u.id === formation.universeId)?.name ||
          formation.universeId ||
          "Sans univers";
      console.log(`  - ${formation.title} -> ${type} (${universeName})`);
    });

    // 6. Résumé de la structure attendue
    console.log("\n🎯 Structure attendue dans le frontend:");
    console.log(
      "1. 📁 Traitement des opportunités commerciales (orange, icône Play)"
    );
    console.log("   🎥 TestOC");
    console.log("   🎥 fdfsfsdfsfdsdfsdfsdfsdf");
    console.log("");
    console.log("2. 📁 Immobilier (vert, icône Folder)");
    console.log("   📚 TestIm");
    console.log("");
    console.log("3. 📁 Mes Formations (bleu, icône Folder)");
    console.log("   📚 Formation Test Univers");

    console.log("\n✅ Création des données de test terminée !");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();

