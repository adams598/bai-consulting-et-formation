import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateFormationHasQuiz() {
  try {
    console.log('🔍 Mise à jour de la formation "test formation"...');

    // Chercher la formation "test formation"
    const formation = await prisma.formation.findFirst({
      where: {
        title: {
          contains: "test formation",
        },
      },
    });

    if (!formation) {
      console.log('❌ Formation "test formation" non trouvée');
      return;
    }

    console.log(`✅ Formation trouvée: "${formation.title}"`);
    console.log(`  - ID: ${formation.id}`);
    console.log(`  - hasQuiz actuel: ${formation.hasQuiz}`);

    // Mettre à jour hasQuiz à true
    const updatedFormation = await prisma.formation.update({
      where: { id: formation.id },
      data: {
        hasQuiz: true,
      },
    });

    console.log(`✅ Formation mise à jour:`);
    console.log(`  - hasQuiz: ${updatedFormation.hasQuiz}`);

    // Vérifier que le quiz existe
    const quiz = await prisma.quiz.findFirst({
      where: { formationId: formation.id },
    });

    if (quiz) {
      console.log(`✅ Quiz confirmé: "${quiz.title}"`);
    } else {
      console.log("❌ Aucun quiz trouvé pour cette formation");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateFormationHasQuiz();
