import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createQuizForTestFormation() {
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
      console.log("📋 Formations disponibles:");
      const allFormations = await prisma.formation.findMany({
        select: { id: true, title: true, isActive: true },
      });
      allFormations.forEach((f) =>
        console.log(`  - ${f.title} (${f.isActive ? "active" : "inactive"})`)
      );
      return;
    }

    console.log(
      `✅ Formation trouvée: "${formation.title}" (ID: ${formation.id})`
    );

    // Vérifier si un quiz existe déjà pour cette formation
    const existingQuiz = await prisma.quiz.findFirst({
      where: { formationId: formation.id },
    });

    if (existingQuiz) {
      console.log("⚠️ Un quiz existe déjà pour cette formation");
      console.log(
        `📊 Quiz existant: ${existingQuiz.title} (ID: ${existingQuiz.id})`
      );

      // Lister les questions existantes
      const questions = await prisma.quizQuestion.findMany({
        where: { quizId: existingQuiz.id },
        include: { answers: true },
      });

      console.log(`📝 Questions existantes: ${questions.length}`);
      questions.forEach((q, index) => {
        console.log(`  ${index + 1}. ${q.question}`);
        console.log(`     Réponses: ${q.answers.length}`);
        const correctAnswers = q.answers.filter((a) => a.isCorrect);
        console.log(`     Bonnes réponses: ${correctAnswers.length}`);
      });
      return;
    }

    console.log("🎯 Création du quiz...");

    // Créer le quiz
    const quiz = await prisma.quiz.create({
      data: {
        title: `Quiz - ${formation.title}`,
        description: "Quiz de test pour la formation",
        formationId: formation.id,
        timeLimit: 30, // 30 minutes
        passingScore: 70, // 70% pour réussir
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Quiz créé: "${quiz.title}" (ID: ${quiz.id})`);

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
          quizId: quiz.id,
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

    // Mettre à jour la formation pour indiquer qu'elle a un quiz
    await prisma.formation.update({
      where: { id: formation.id },
      data: {
        hasQuiz: true,
      },
    });

    console.log("✅ Formation mise à jour avec hasQuiz: true");

    // Afficher le résumé
    const createdQuiz = await prisma.quiz.findUnique({
      where: { id: quiz.id },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: "asc" },
        },
      },
    });

    console.log("\n🎉 Quiz créé avec succès !");
    console.log("📊 Résumé:");
    console.log(`  - Quiz: "${createdQuiz.title}"`);
    console.log(`  - Formation: "${formation.title}"`);
    console.log(`  - Questions: ${createdQuiz.questions.length}`);
    console.log(`  - Durée limite: ${createdQuiz.timeLimit} minutes`);
    console.log(`  - Score de passage: ${createdQuiz.passingScore}%`);
    console.log(`  - Statut: ${createdQuiz.isActive ? "Actif" : "Inactif"}`);
  } catch (error) {
    console.error("❌ Erreur lors de la création du quiz:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createQuizForTestFormation();
