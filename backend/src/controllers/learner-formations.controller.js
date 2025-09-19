import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Contrôleur pour les formations des apprenants
export const learnerFormationsController = {
  // Obtenir les formations assignées à l'apprenant
  getAssignedFormations: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, search } = req.query;

      // Construire les filtres
      const whereClause = { userId };

      // Récupérer les formations assignées
      const userFormations = await prisma.userFormationAssignment.findMany({
        where: whereClause,
        include: {
          bankFormation: {
            include: {
              formation: {
                include: {
                  quiz: true,
                },
              },
            },
          },
        },
      });

      // Récupérer les progressions
      const progressions = await prisma.userProgress.findMany({
        where: { userId },
        include: {
          formation: true,
        },
      });

      // Récupérer les certificats
      const certificates = await prisma.certificate.findMany({
        where: { userId },
      });

      // Récupérer les tentatives de quiz
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: { userId },
      });

      // Transformer les données
      const formations = userFormations.map((userFormation) => {
        const formation = userFormation.bankFormation.formation;
        const progress = progressions.find(
          (p) => p.formationId === formation.id
        );
        const certificate = certificates.find(
          (c) => c.formationId === formation.id
        );
        const quizAttempt = quizAttempts.find(
          (q) => q.quizId === formation.quiz?.id
        );

        // Déterminer le statut
        let formationStatus = "pending";
        if (progress) {
          if (progress.progress >= 100) {
            formationStatus = "completed";
          } else if (progress.progress > 0) {
            formationStatus = "in_progress";
          }
        }

        return {
          id: formation.id,
          title: formation.title,
          description: formation.description,
          duration: formation.duration,
          coverImage: formation.coverImage,
          code: formation.code,
          pedagogicalModality: formation.pedagogicalModality,
          organization: formation.organization,
          prerequisites: formation.prerequisites,
          objectives: formation.objectives,
          detailedProgram: formation.detailedProgram,
          targetAudience: formation.targetAudience,

          // Informations spécifiques à l'apprenant
          status: formationStatus,
          progress: progress ? progress.progress : 0,
          assignedAt: userFormation.assignedAt,
          dueDate: userFormation.dueDate,
          isMandatory: userFormation.isMandatory,
          lastAccessed: progress ? progress.lastAccessedAt : null,
          timeSpent: progress ? Math.round((progress.timeSpent || 0) / 60) : 0, // Convertir en minutes
          hasQuiz: !!formation.quiz,
          quizPassed: quizAttempt ? quizAttempt.isPassed : false,
          certificateEarned: !!certificate,
        };
      });

      // Appliquer les filtres
      let filteredFormations = formations;

      if (status && status !== "all") {
        filteredFormations = filteredFormations.filter(
          (f) => f.status === status
        );
      }

      if (search) {
        const searchTerm = search.toLowerCase();
        filteredFormations = filteredFormations.filter(
          (f) =>
            f.title.toLowerCase().includes(searchTerm) ||
            f.description.toLowerCase().includes(searchTerm) ||
            (f.code && f.code.toLowerCase().includes(searchTerm))
        );
      }

      res.json({
        success: true,
        data: filteredFormations,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des formations:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des formations",
      });
    }
  },

  // Obtenir le contenu d'une formation
  getFormationContent: async (req, res) => {
    try {
      const userId = req.user.id;
      const formationId = req.params.formationId;

      // Vérifier que l'utilisateur a accès à cette formation
      const userFormation = await prisma.userFormationAssignment.findFirst({
        where: {
          userId,
          bankFormation: {
            formationId,
          },
        },
      });

      if (!userFormation) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas accès à cette formation",
        });
      }

      // Récupérer la formation avec son contenu
      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
        include: {
          content: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
              },
            },
          },
          quiz: {
            include: {
              questions: {
                include: {
                  answers: true,
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Récupérer les progressions de l'utilisateur
      const progressions = await prisma.userProgress.findMany({
        where: {
          userId,
          formationId,
        },
      });

      // Transformer le contenu avec les progressions
      const contentWithProgress = formation.content.map((section) => ({
        ...section,
        lessons: section.lessons.map((lesson) => {
          const progress = progressions.find((p) => p.lessonId === lesson.id);
          return {
            ...lesson,
            progress: progress ? progress.progress : 0,
            timeSpent: progress
              ? Math.round((progress.timeSpent || 0) / 60)
              : 0,
            isCompleted: progress ? progress.isCompleted : false,
            lastAccessed: progress ? progress.lastAccessedAt : null,
          };
        }),
      }));

      res.json({
        success: true,
        data: {
          ...formation,
          content: contentWithProgress,
        },
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du contenu de la formation:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du contenu de la formation",
      });
    }
  },

  // Marquer une leçon comme démarrée
  startLesson: async (req, res) => {
    try {
      const userId = req.user.id;
      const { formationId, lessonId } = req.body;

      // Vérifier l'accès à la formation
      const userFormation = await prisma.userFormationAssignment.findFirst({
        where: {
          userId,
          bankFormation: {
            formationId,
          },
        },
      });

      if (!userFormation) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas accès à cette formation",
        });
      }

      // Créer ou mettre à jour la progression
      const progress = await prisma.userProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        update: {
          startedAt: new Date(),
          lastAccessedAt: new Date(),
        },
        create: {
          userId,
          lessonId,
          formationId,
          progress: 0,
          timeSpent: 0,
          startedAt: new Date(),
          lastAccessedAt: new Date(),
          isCompleted: false,
        },
      });

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      console.error("Erreur lors du démarrage de la leçon:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors du démarrage de la leçon",
      });
    }
  },

  // Mettre à jour la progression d'une leçon
  updateLessonProgress: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        lessonId,
        progress,
        timeSpent,
        currentPage,
        currentTime,
        lastPosition,
      } = req.body;

      // Mettre à jour la progression
      const updatedProgress = await prisma.userProgress.updateMany({
        where: {
          userId,
          lessonId,
        },
        data: {
          progress: Math.min(100, Math.max(0, progress)), // S'assurer que c'est entre 0 et 100
          timeSpent: timeSpent || 0,
          currentPage,
          currentTime,
          lastPosition: lastPosition ? JSON.stringify(lastPosition) : null,
          lastAccessedAt: new Date(),
          isCompleted: progress >= 100,
          completedAt: progress >= 100 ? new Date() : null,
        },
      });

      res.json({
        success: true,
        data: { updated: updatedProgress.count > 0 },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la progression:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de la progression",
      });
    }
  },
};
