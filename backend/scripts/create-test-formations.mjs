import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestFormations() {
  try {
    console.log("🏗️ Création des formations de test...\n");

    // D'abord, récupérer un utilisateur admin existant
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [{ role: "SUPER_ADMIN" }, { role: "BANK_ADMIN" }],
      },
    });

    if (!adminUser) {
      console.log(
        "❌ Aucun utilisateur admin trouvé. Créez d'abord un utilisateur admin."
      );
      return;
    }

    console.log(
      `👤 Utilisateur admin trouvé: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.role})`
    );

    const formations = [
      {
        title: "Formation Sécurité Bancaire",
        description:
          "Formation complète sur la sécurité dans le secteur bancaire",
        duration: 120, // 2 heures
        isActive: true,
        hasQuiz: true,
        quizRequired: true,
        createdBy: adminUser.id,
      },
      {
        title: "Conformité Réglementaire",
        description:
          "Formation sur les réglementations bancaires et la conformité",
        duration: 90, // 1h30
        isActive: true,
        hasQuiz: true,
        quizRequired: true,
        createdBy: adminUser.id,
      },
      {
        title: "Gestion des Risques",
        description:
          "Formation sur l'identification et la gestion des risques bancaires",
        duration: 180, // 3 heures
        isActive: true,
        hasQuiz: false,
        quizRequired: false,
        createdBy: adminUser.id,
      },
      {
        title: "Service Client Bancaire",
        description:
          "Formation sur l'excellence du service client dans le secteur bancaire",
        duration: 60, // 1 heure
        isActive: true,
        hasQuiz: true,
        quizRequired: false,
        createdBy: adminUser.id,
      },
      {
        title: "Technologies Bancaires",
        description:
          "Formation sur les nouvelles technologies dans le secteur bancaire",
        duration: 150, // 2h30
        isActive: true,
        hasQuiz: true,
        quizRequired: true,
        createdBy: adminUser.id,
      },
    ];

    for (const formation of formations) {
      const existing = await prisma.formation.findFirst({
        where: { title: formation.title },
      });

      if (!existing) {
        const created = await prisma.formation.create({
          data: formation,
        });
        console.log(`✅ Formation créée: ${created.title} (ID: ${created.id})`);
      } else {
        console.log(`⚠️ Formation déjà existante: ${formation.title}`);
      }
    }

    console.log("\n🎉 Création des formations terminée !");

    // Afficher toutes les formations
    const allFormations = await prisma.formation.findMany({
      where: { isActive: true },
    });

    console.log(`\n📚 Total des formations actives: ${allFormations.length}`);
    allFormations.forEach((f) => {
      console.log(
        `  - ${f.title} (${f.duration} min, Quiz: ${f.hasQuiz ? "Oui" : "Non"})`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création des formations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer la création
createTestFormations();
