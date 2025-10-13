import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Contrôleur pour la gestion des quiz et tentatives
export const quizController = {
  // Créer un quiz
  async createQuiz(req, res) {
    try {
      const { formationId } = req.params;
      const { title, description, passingScore, timeLimit, questions } =
        req.body;

      // Validation
      if (!title || !questions || !Array.isArray(questions)) {
        return res.status(400).json({
          success: false,
          message: "Titre et questions sont obligatoires",
        });
      }

      // Vérifier si la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
      });

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Vérifier si un quiz existe déjà pour cette formation
      const existingQuiz = await prisma.quiz.findUnique({
        where: { formationId },
      });

      if (existingQuiz) {
        return res.status(400).json({
          success: false,
          message: "Un quiz existe déjà pour cette formation",
        });
      }

      // Créer le quiz avec ses questions et réponses
      const quiz = await prisma.quiz.create({
        data: {
          formationId,
          title,
          description: description || "",
          passingScore: passingScore || 80,
          timeLimit: timeLimit ? parseInt(timeLimit) : null,
          questions: {
            create: questions.map((question, qIndex) => ({
              question: question.question,
              type: question.type || "multiple_choice",
              order: question.order || qIndex,
              points: question.points || 1,
              answers: {
                create: question.answers.map((answer, aIndex) => ({
                  answer: answer.answer,
                  isCorrect: answer.isCorrect,
                  order: answer.order || aIndex,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            include: {
              answers: true,
            },
          },
        },
      });

      res.status(201).json({ success: true, data: quiz });
    } catch (error) {
      console.error("Erreur createQuiz:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour un quiz
  async updateQuiz(req, res) {
    try {
      const { id } = req.params;
      const { title, description, passingScore, timeLimit, questions } =
        req.body;

      // Validation
      if (!title || !questions || !Array.isArray(questions)) {
        return res.status(400).json({
          success: false,
          message: "Titre et questions sont obligatoires",
        });
      }

      // Vérifier si le quiz existe
      const existingQuiz = await prisma.quiz.findUnique({
        where: { id },
      });

      if (!existingQuiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz non trouvé",
        });
      }

      // Supprimer les anciennes questions et réponses
      await prisma.quizAnswer.deleteMany({
        where: {
          question: {
            quizId: id,
          },
        },
      });

      await prisma.quizQuestion.deleteMany({
        where: { quizId: id },
      });

      // Mettre à jour le quiz avec ses nouvelles questions et réponses
      const quiz = await prisma.quiz.update({
        where: { id },
        data: {
          title,
          description: description || "",
          passingScore: passingScore || 80,
          timeLimit: timeLimit ? parseInt(timeLimit) : null,
          questions: {
            create: questions.map((question, qIndex) => ({
              question: question.question,
              type: question.type || "multiple_choice",
              order: question.order || qIndex,
              points: question.points || 1,
              answers: {
                create: question.answers.map((answer, aIndex) => ({
                  answer: answer.answer,
                  isCorrect: answer.isCorrect,
                  order: answer.order || aIndex,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            include: {
              answers: true,
            },
          },
        },
      });

      res.json({ success: true, data: quiz });
    } catch (error) {
      console.error("Erreur updateQuiz:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer un quiz
  async deleteQuiz(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si le quiz existe
      const quiz = await prisma.quiz.findUnique({
        where: { id },
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz non trouvé",
        });
      }

      // Supprimer le quiz (les questions et réponses seront supprimées en cascade)
      await prisma.quiz.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Quiz supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur deleteQuiz:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Basculer le statut actif d'un quiz
  async toggleQuizActive(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si le quiz existe
      const quiz = await prisma.quiz.findUnique({
        where: { id },
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz non trouvé",
        });
      }

      // Basculer le statut actif
      const updatedQuiz = await prisma.quiz.update({
        where: { id },
        data: { isActive: !quiz.isActive },
      });

      res.json({
        success: true,
        message: `Quiz ${
          updatedQuiz.isActive ? "activé" : "désactivé"
        } avec succès`,
        data: updatedQuiz,
      });
    } catch (error) {
      console.error("Erreur toggleQuizActive:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir un quiz par ID (pour les apprenants)
  async getQuizById(req, res) {
    try {
      const { id } = req.params;

      const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
            },
          },
          questions: {
            orderBy: { order: "asc" },
            include: {
              answers: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  answer: true,
                  order: true,
                  // Ne pas inclure isCorrect pour les apprenants
                },
              },
            },
          },
        },
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz non trouvé",
        });
      }

      if (!quiz.isActive) {
        return res.status(400).json({
          success: false,
          message: "Ce quiz n'est pas actif",
        });
      }

      res.json({ success: true, data: quiz });
    } catch (error) {
      console.error("Erreur getQuizById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Commencer une tentative de quiz
  async startQuizAttempt(req, res) {
    try {
      const { quizId } = req.params;
      const userId = req.user.id;

      // Vérifier si le quiz existe et est actif
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          formation: true,
        },
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz non trouvé",
        });
      }

      if (!quiz.isActive) {
        return res.status(400).json({
          success: false,
          message: "Ce quiz n'est pas actif",
        });
      }

      // Vérifier si l'utilisateur a déjà une tentative en cours
      const existingAttempt = await prisma.quizAttempt.findFirst({
        where: {
          userId,
          quizId,
          completedAt: null,
        },
      });

      if (existingAttempt) {
        return res.json({
          success: true,
          data: existingAttempt,
          message: "Tentative en cours trouvée",
        });
      }

      // Créer une nouvelle tentative
      const attempt = await prisma.quizAttempt.create({
        data: {
          userId,
          quizId,
          startedAt: new Date(),
        },
      });

      res.status(201).json({ success: true, data: attempt });
    } catch (error) {
      console.error("Erreur startQuizAttempt:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Soumettre les réponses d'un quiz
  async submitQuizAttempt(req, res) {
    try {
      const { attemptId } = req.params;
      const { answers, timeSpent } = req.body;
      const userId = req.user.id;

      // Vérifier si la tentative existe et appartient à l'utilisateur
      const attempt = await prisma.quizAttempt.findFirst({
        where: {
          id: attemptId,
          userId,
          completedAt: null, // Pas encore terminée
        },
        include: {
          quiz: {
            include: {
              questions: {
                include: {
                  answers: true,
                },
              },
            },
          },
        },
      });

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: "Tentative non trouvée ou déjà terminée",
        });
      }

      // Calculer le score
      let totalScore = 0;
      let userScore = 0;

      attempt.quiz.questions.forEach((question) => {
        totalScore += question.points;
        const userAnswer = answers[question.id];

        if (userAnswer) {
          // Pour les questions à choix multiples
          if (question.type === "multiple_choice") {
            const correctAnswers = question.answers.filter((a) => a.isCorrect);
            const userAnswers = Array.isArray(userAnswer)
              ? userAnswer
              : [userAnswer];

            // Vérifier si toutes les bonnes réponses sont sélectionnées
            const allCorrect =
              correctAnswers.every((correct) =>
                userAnswers.includes(correct.id)
              ) && userAnswers.length === correctAnswers.length;

            if (allCorrect) {
              userScore += question.points;
            }
          }
          // Pour les questions vrai/faux
          else if (question.type === "true_false") {
            const correctAnswer = question.answers.find((a) => a.isCorrect);
            if (correctAnswer && userAnswer === correctAnswer.id) {
              userScore += question.points;
            }
          }
        }
      });

      // Calculer le pourcentage
      const scorePercentage =
        totalScore > 0 ? Math.round((userScore / totalScore) * 100) : 0;
      const isPassed = scorePercentage >= attempt.quiz.passingScore;

      // Mettre à jour la tentative
      const updatedAttempt = await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          score: scorePercentage,
          totalScore,
          isPassed,
          timeSpent: timeSpent || null,
          answers: JSON.stringify(answers),
          completedAt: new Date(),
        },
      });

      // Créer une notification si le quiz est réussi
      if (isPassed) {
        await prisma.notification.create({
          data: {
            userId,
            type: "quiz_passed",
            title: "Quiz réussi !",
            message: `Félicitations ! Vous avez réussi le quiz "${attempt.quiz.title}" avec un score de ${scorePercentage}%.`,
            data: JSON.stringify({
              quizId: attempt.quiz.id,
              formationId: attempt.quiz.formationId,
              score: scorePercentage,
            }),
          },
        });
      } else {
        await prisma.notification.create({
          data: {
            userId,
            type: "quiz_failed",
            title: "Quiz échoué",
            message: `Le quiz "${attempt.quiz.title}" nécessite un score de ${attempt.quiz.passingScore}%. Vous avez obtenu ${scorePercentage}%.`,
            data: JSON.stringify({
              quizId: attempt.quiz.id,
              formationId: attempt.quiz.formationId,
              score: scorePercentage,
              passingScore: attempt.quiz.passingScore,
            }),
          },
        });
      }

      res.json({
        success: true,
        data: {
          ...updatedAttempt,
          score: scorePercentage,
          isPassed,
          userScore,
          totalScore,
        },
      });
    } catch (error) {
      console.error("Erreur submitQuizAttempt:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir l'historique des tentatives d'un utilisateur
  async getUserQuizAttempts(req, res) {
    try {
      const userId = req.user.id;
      const { quizId } = req.query;

      const whereClause = {
        userId,
        ...(quizId && { quizId }),
      };

      const attempts = await prisma.quizAttempt.findMany({
        where: whereClause,
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              passingScore: true,
              formation: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ success: true, data: attempts });
    } catch (error) {
      console.error("Erreur getUserQuizAttempts:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir les statistiques d'un quiz (pour les admins)
  async getQuizStats(req, res) {
    try {
      const { quizId } = req.params;

      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
            },
          },
          attempts: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz non trouvé",
        });
      }

      const stats = {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          passingScore: quiz.passingScore,
          totalQuestions: quiz.questions?.length || 0,
        },
        attempts: {
          total: quiz.attempts.length,
          passed: quiz.attempts.filter((a) => a.isPassed).length,
          failed: quiz.attempts.filter((a) => !a.isPassed).length,
          averageScore:
            quiz.attempts.length > 0
              ? Math.round(
                  quiz.attempts.reduce((sum, a) => sum + a.score, 0) /
                    quiz.attempts.length
                )
              : 0,
        },
        recentAttempts: quiz.attempts.slice(0, 10).map((attempt) => ({
          id: attempt.id,
          user: `${attempt.user.firstName} ${attempt.user.lastName}`,
          score: attempt.score,
          isPassed: attempt.isPassed,
          completedAt: attempt.completedAt,
        })),
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error("Erreur getQuizStats:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

















