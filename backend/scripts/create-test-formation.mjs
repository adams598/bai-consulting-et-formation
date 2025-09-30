import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestFormation() {
  try {
    console.log("🔧 Création d'une formation de test...");

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

    // Créer une formation d'univers (pas d'opportunités commerciales)
    const newFormation = await prisma.formation.create({
      data: {
        title: "Formation Test Univers",
        description: "Description de la formation test pour l'univers",
        objectives: "Objectifs pédagogiques de la formation test",
        duration: 60,
        isActive: true,
        hasQuiz: false,
        quizRequired: false,
        code: "TEST001",
        pedagogicalModality: "E-learning",
        organization: "BAI Consulting",
        prerequisites: "Aucun prérequis",
        detailedProgram: JSON.stringify([
          "Module 1: Introduction",
          "Module 2: Concepts de base",
          "Module 3: Mise en pratique",
        ]),
        targetAudience: JSON.stringify(["Collaborateurs", "Managers"]),
        createdBy: adminUser.id,
        universeId: "mes-formations", // Assigner à "Mes Formations"
        isOpportunity: false,
      },
    });

    console.log("✅ Formation créée avec succès:");
    console.log(`  - ID: ${newFormation.id}`);
    console.log(`  - Titre: ${newFormation.title}`);
    console.log(`  - Univers: mes-formations`);
    console.log(`  - Opportunité: ${newFormation.isOpportunity}`);

    // Vérifier le résultat final
    const allFormations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        universeId: true,
        isOpportunity: true,
      },
    });

    console.log(
      `\n📊 Total des formations maintenant: ${allFormations.length}`
    );
    allFormations.forEach((formation) => {
      console.log(
        `  - ${formation.title} (${
          formation.isOpportunity ? "Opportunité" : "Univers"
        })`
      );
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestFormation();

