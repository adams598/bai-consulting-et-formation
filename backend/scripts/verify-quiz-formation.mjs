import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyQuizFormation() {
  try {
    console.log('🔍 Vérification de la formation "test formation"...');

    // Chercher la formation "test formation"
    const formation = await prisma.formation.findFirst({
      where: {
        title: {
          contains: "test formation",
        },
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: { answers: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!formation) {
      console.log('❌ Formation "test formation" non trouvée');
      return;
    }

    console.log(`✅ Formation trouvée: "${formation.title}"`);
    console.log(`  - ID: ${formation.id}`);
    console.log(`  - hasQuiz: ${formation.hasQuiz}`);
    console.log(`  - Statut: ${formation.isActive ? "Actif" : "Inactif"}`);

    if (formation.quiz) {
      console.log(`\n📊 Quiz associé:`);
      console.log(`  - Titre: "${formation.quiz.title}"`);
      console.log(`  - ID: ${formation.quiz.id}`);
      console.log(`  - Questions: ${formation.quiz.questions.length}`);
      console.log(`  - Durée limite: ${formation.quiz.timeLimit} minutes`);
      console.log(`  - Score de passage: ${formation.quiz.passingScore}%`);
      console.log(
        `  - Statut: ${formation.quiz.isActive ? "Actif" : "Inactif"}`
      );

      if (formation.quiz.questions.length > 0) {
        console.log(`\n📝 Questions du quiz:`);
        formation.quiz.questions.forEach((q, index) => {
          console.log(`  ${index + 1}. ${q.question}`);
          console.log(`     Type: ${q.type}`);
          console.log(`     Points: ${q.points}`);

          const correctAnswers = q.answers.filter((a) => a.isCorrect);
          const incorrectAnswers = q.answers.filter((a) => !a.isCorrect);

          console.log(
            `     ✓ Bonnes réponses: ${correctAnswers
              .map((a) => a.answer)
              .join(", ")}`
          );
          if (incorrectAnswers.length > 0) {
            console.log(
              `     ✗ Mauvaises réponses: ${incorrectAnswers
                .map((a) => a.answer)
                .join(", ")}`
            );
          }
          console.log("");
        });
      }
    } else {
      console.log("❌ Aucun quiz associé à cette formation");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyQuizFormation();
