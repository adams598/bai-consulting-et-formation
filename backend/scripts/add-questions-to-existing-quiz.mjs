import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addQuestionsToExistingQuiz() {
  try {
    console.log('🔍 Recherche de la formation "test formation"...');

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

    console.log(
      `✅ Formation trouvée: "${formation.title}" (ID: ${formation.id})`
    );

    // Chercher le quiz existant
    const existingQuiz = await prisma.quiz.findFirst({
      where: { formationId: formation.id },
    });

    if (!existingQuiz) {
      console.log("❌ Aucun quiz trouvé pour cette formation");
      return;
    }

    console.log(
      `✅ Quiz trouvé: "${existingQuiz.title}" (ID: ${existingQuiz.id})`
    );

    // Vérifier s'il y a déjà des questions
    const existingQuestions = await prisma.quizQuestion.findMany({
      where: { quizId: existingQuiz.id },
    });

    if (existingQuestions.length > 0) {
      console.log(`⚠️ Le quiz a déjà ${existingQuestions.length} questions`);
      console.log("📝 Questions existantes:");
      existingQuestions.forEach((q, index) => {
        console.log(`  ${index + 1}. ${q.question}`);
      });
      return;
    }

    console.log("🎯 Ajout de questions au quiz...");

    // Créer des questions d'exemple
    const questions = [
      {
        question:
          "Quelle est la principale caractéristique d'une formation efficace ?",
        type: "multiple_choice",
        answers: [
          { answer: "Sa durée", isCorrect: false },
          { answer: "Son contenu pédagogique", isCorrect: true },
          { answer: "Son prix", isCorrect: false },
          { answer: "Sa popularité", isCorrect: false },
        ],
      },
      {
        question: "Quel est l'objectif principal de cette formation ?",
        type: "multiple_choice",
        answers: [
          { answer: "Apprendre de nouvelles compétences", isCorrect: true },
          { answer: "Gagner de l'argent", isCorrect: false },
          { answer: "Perdre du temps", isCorrect: false },
          { answer: "Passer un examen", isCorrect: false },
        ],
      },
      {
        question:
          "Combien de temps faut-il généralement pour assimiler une nouvelle compétence ?",
        type: "multiple_choice",
        answers: [
          { answer: "1 jour", isCorrect: false },
          { answer: "1 semaine", isCorrect: false },
          { answer: "21 jours", isCorrect: true },
          { answer: "1 an", isCorrect: false },
        ],
      },
      {
        question: "Quelle méthode d'apprentissage est la plus efficace ?",
        type: "multiple_choice",
        answers: [
          { answer: "Lire seulement", isCorrect: false },
          { answer: "Écouter seulement", isCorrect: false },
          { answer: "Pratiquer activement", isCorrect: true },
          { answer: "Regarder seulement", isCorrect: false },
        ],
      },
      {
        question:
          "Vrai ou Faux : Il est important de réviser régulièrement ce que l'on a appris.",
        type: "true_false",
        answers: [
          { answer: "Vrai", isCorrect: true },
          { answer: "Faux", isCorrect: false },
        ],
      },
    ];

    console.log(`📝 Création de ${questions.length} questions...`);

    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];

      // Créer la question
      const question = await prisma.quizQuestion.create({
        data: {
          quizId: existingQuiz.id,
          question: questionData.question,
          type: questionData.type,
          order: i + 1,
          points: 1,
        },
      });

      console.log(`  ✅ Question ${i + 1} créée: "${question.question}"`);

      // Créer les réponses pour cette question
      for (let j = 0; j < questionData.answers.length; j++) {
        const answerData = questionData.answers[j];

        await prisma.quizAnswer.create({
          data: {
            questionId: question.id,
            answer: answerData.answer,
            isCorrect: answerData.isCorrect,
            order: j,
          },
        });
      }

      console.log(`    📋 ${questionData.answers.length} réponses créées`);
    }

    console.log("\n🎉 Questions ajoutées avec succès !");

    // Afficher le résumé final
    const finalQuiz = await prisma.quiz.findUnique({
      where: { id: existingQuiz.id },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: "asc" },
        },
      },
    });

    console.log("\n📊 Résumé final:");
    console.log(`  - Quiz: "${finalQuiz.title}"`);
    console.log(`  - Formation: "${formation.title}"`);
    console.log(`  - Questions: ${finalQuiz.questions.length}`);
    console.log(`  - Durée limite: ${finalQuiz.timeLimit} minutes`);
    console.log(`  - Score de passage: ${finalQuiz.passingScore}%`);
    console.log(`  - Statut: ${finalQuiz.isActive ? "Actif" : "Inactif"}`);

    console.log("\n📝 Détail des questions:");
    finalQuiz.questions.forEach((q, index) => {
      console.log(`  ${index + 1}. ${q.question}`);
      const correctAnswers = q.answers.filter((a) => a.isCorrect);
      console.log(
        `     ✓ Bonne réponse: ${correctAnswers
          .map((a) => a.answer)
          .join(", ")}`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout des questions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addQuestionsToExistingQuiz();
