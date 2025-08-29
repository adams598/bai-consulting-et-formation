import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addTestFormations() {
  try {
    console.log("🏗️ Ajout de formations de test...\n");

    // Créer un utilisateur admin simple s'il n'existe pas
    let adminUser = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (!adminUser) {
      console.log("👤 Création d'un utilisateur admin...");
      adminUser = await prisma.user.create({
        data: {
          email: "admin@test.com",
          password: "hashedpassword123",
          firstName: "Admin",
          lastName: "Test",
          role: "SUPER_ADMIN",
          isActive: true,
        },
      });
      console.log("✅ Utilisateur admin créé:", adminUser.id);
    } else {
      console.log("✅ Utilisateur admin existant:", adminUser.id);
    }

    // Créer des formations de test
    const formations = [
      {
        title: "Formation Sécurité Bancaire",
        description:
          "Formation complète sur la sécurité dans le secteur bancaire",
        duration: 120,
        isActive: true,
        hasQuiz: true,
        quizRequired: true,
        createdBy: adminUser.id,
      },
      {
        title: "Conformité Réglementaire",
        description:
          "Formation sur les réglementations bancaires et la conformité",
        duration: 90,
        isActive: true,
        hasQuiz: true,
        quizRequired: false,
        createdBy: adminUser.id,
      },
    ];

    for (const formationData of formations) {
      const existing = await prisma.formation.findFirst({
        where: { title: formationData.title },
      });

      if (!existing) {
        const formation = await prisma.formation.create({
          data: formationData,
        });
        console.log(
          "✅ Formation créée:",
          formation.title,
          "(ID:",
          formation.id,
          ")"
        );
      } else {
        console.log("⚠️ Formation déjà existante:", formationData.title);
      }
    }

    // Vérifier
    const allFormations = await prisma.formation.findMany();
    console.log(`\n📚 Total des formations: ${allFormations.length}`);
    allFormations.forEach((f) => {
      console.log(`  - ${f.title} (${f.duration} min)`);
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestFormations();

