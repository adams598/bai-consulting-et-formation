import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addSimpleFormation() {
  try {
    console.log("🏗️ Ajout d'une formation de test...\n");

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

    // Créer une formation simple
    const formation = await prisma.formation.create({
      data: {
        title: "Formation Test Sécurité",
        description: "Formation de test sur la sécurité bancaire",
        duration: 60,
        isActive: true,
        hasQuiz: true,
        quizRequired: false,
        createdBy: adminUser.id,
      },
    });

    console.log(
      "✅ Formation créée:",
      formation.title,
      "(ID:",
      formation.id,
      ")"
    );

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

addSimpleFormation();
