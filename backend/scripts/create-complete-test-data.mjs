import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createCompleteTestData() {
  try {
    console.log("🔧 Création d'un jeu de données complet pour les tests...");

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

    // Vérifier les formations existantes
    const existingFormations = await prisma.formation.findMany({
      select: { title: true, id: true },
    });

    console.log(`📊 Formations existantes: ${existingFormations.length}`);
    existingFormations.forEach((f) => console.log(`  - ${f.title}`));

    // Créer une formation d'opportunités commerciales supplémentaire
    console.log(
      "\n🎥 Création d'une formation d'opportunités commerciales supplémentaire..."
    );
    const formationOC2 = await prisma.formation.create({
      data: {
        title: "Formation OC Avancée",
        description:
          "Formation avancée pour le traitement des opportunités commerciales",
        objectives:
          "Maîtriser les techniques avancées de prospection commerciale",
        duration: 60,
        isActive: true,
        hasQuiz: true,
        quizRequired: true,
        code: "OCAV001",
        pedagogicalModality: "Vidéo",
        organization: "BAI Consulting",
        prerequisites: "Formation de base en commercial",
        detailedProgram: JSON.stringify([
          "Module 1: Analyse des opportunités",
          "Module 2: Techniques de négociation avancées",
          "Module 3: Suivi et fidélisation clients",
        ]),
        targetAudience: JSON.stringify([
          "Commercial senior",
          "Manager commercial",
        ]),
        createdBy: adminUser.id,
        universeId: null,
        isOpportunity: true,
      },
    });
    console.log(
      "✅ Formation d'opportunités commerciales supplémentaire créée"
    );

    // Créer une formation pour "Mes Formations"
    console.log("\n📚 Création d'une formation pour 'Mes Formations'...");
    const formationMesFormations = await prisma.formation.create({
      data: {
        title: "Formation Générale",
        description: "Formation générale pour tous les collaborateurs",
        objectives: "Acquérir les connaissances de base nécessaires",
        duration: 120,
        isActive: true,
        hasQuiz: true,
        quizRequired: false,
        code: "GEN001",
        pedagogicalModality: "E-learning",
        organization: "BAI Consulting",
        prerequisites: "Aucun prérequis",
        detailedProgram: JSON.stringify([
          "Module 1: Introduction à l'entreprise",
          "Module 2: Processus métier",
          "Module 3: Outils et systèmes",
        ]),
        targetAudience: JSON.stringify(["Tous les collaborateurs"]),
        createdBy: adminUser.id,
        universeId: "mes-formations",
        isOpportunity: false,
      },
    });
    console.log("✅ Formation pour 'Mes Formations' créée");

    // Créer une formation supplémentaire pour l'univers Immobilier
    console.log(
      "\n🏠 Création d'une formation supplémentaire pour l'univers Immobilier..."
    );
    const formationImmo2 = await prisma.formation.create({
      data: {
        title: "Gestion Locative",
        description: "Formation spécialisée en gestion locative",
        objectives: "Maîtriser la gestion complète des biens locatifs",
        duration: 150,
        isActive: true,
        hasQuiz: true,
        quizRequired: true,
        code: "GESTLOC001",
        pedagogicalModality: "E-learning",
        organization: "BAI Consulting",
        prerequisites: "Connaissances de base en immobilier",
        detailedProgram: JSON.stringify([
          "Module 1: Législation locative",
          "Module 2: Gestion des locataires",
          "Module 3: Maintenance et entretien",
          "Module 4: Comptabilité locative",
        ]),
        targetAudience: JSON.stringify([
          "Gestionnaire locatif",
          "Agent immobilier",
        ]),
        createdBy: adminUser.id,
        universeId: "immobilier",
        isOpportunity: false,
      },
    });
    console.log("✅ Formation supplémentaire pour l'univers Immobilier créée");

    // Vérification finale
    console.log("\n📊 Vérification finale...");
    const allFormations = await prisma.formation.findMany({
      select: {
        title: true,
        universeId: true,
        isOpportunity: true,
      },
      orderBy: {
        title: "asc",
      },
    });

    console.log(`📊 Total des formations: ${allFormations.length}`);

    const opportunityFormations = allFormations.filter((f) => f.isOpportunity);
    const universeFormations = allFormations.filter((f) => !f.isOpportunity);

    console.log(
      `\n📊 Formations d'opportunités commerciales (${opportunityFormations.length}):`
    );
    opportunityFormations.forEach((f) => {
      console.log(`  🎥 ${f.title}`);
    });

    console.log(`\n📊 Formations d'univers (${universeFormations.length}):`);
    const formationsByUniverse = {};
    universeFormations.forEach((f) => {
      const universeId = f.universeId || "mes-formations";
      if (!formationsByUniverse[universeId]) {
        formationsByUniverse[universeId] = [];
      }
      formationsByUniverse[universeId].push(f.title);
    });

    Object.entries(formationsByUniverse).forEach(([universeId, titles]) => {
      const universeName =
        universeId === "mes-formations"
          ? "Mes Formations"
          : universeId === "immobilier"
          ? "Immobilier"
          : `Univers ${universeId}`;
      console.log(`  📁 ${universeName}:`);
      titles.forEach((title) => {
        console.log(`    📚 ${title}`);
      });
    });

    console.log("\n🎯 Structure finale attendue dans le frontend:");
    console.log(
      "1. 📁 Traitement des opportunités commerciales (orange, icône Play)"
    );
    opportunityFormations.forEach((f) => {
      console.log(`   🎥 ${f.title}`);
    });

    console.log("\n2. 📁 Formations par univers:");
    Object.entries(formationsByUniverse).forEach(([universeId, titles]) => {
      const universeName =
        universeId === "mes-formations"
          ? "Mes Formations"
          : universeId === "immobilier"
          ? "Immobilier"
          : `Univers ${universeId}`;
      console.log(`   📁 ${universeName}:`);
      titles.forEach((title) => {
        console.log(`     📚 ${title}`);
      });
    });

    console.log("\n✅ Jeu de données complet créé !");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createCompleteTestData();

