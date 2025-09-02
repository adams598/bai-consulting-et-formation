import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const progressController = {
  // Obtenir la progression d'un utilisateur sur une leçon
  async getUserProgress(req, res) {
    try {
      const { userId, lessonId } = req.params;

      if (!userId || !lessonId) {
        return res.status(400).json({
          success: false,
          message: "userId et lessonId sont requis",
        });
      }

      // Si l'utilisateur n'existe pas, utiliser l'admin par défaut
      let actualUserId = userId;
      if (userId === "default-user-id") {
        const adminUser = await prisma.user.findFirst({
          where: { email: "admin@bai-consulting.com" },
        });
        if (adminUser) {
          actualUserId = adminUser.id;
          console.log(
            "🔄 Utilisation de l'utilisateur admin par défaut:",
            actualUserId
          );
        }
      }

      const progress = await prisma.userProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: actualUserId,
            lessonId,
          },
        },
        include: {
          lesson: true,
          formation: true,
        },
      });

      if (!progress) {
        // Créer une progression initiale si elle n'existe pas
        const lesson = await prisma.formationContent.findUnique({
          where: { id: lessonId },
          include: { formation: true },
        });

        if (!lesson) {
          return res.status(404).json({
            success: false,
            message: "Leçon introuvable",
          });
        }

        const initialProgress = await prisma.userProgress.create({
          data: {
            userId: actualUserId,
            lessonId,
            formationId: lesson.formationId,
            progress: 0,
            currentPage: 1,
            totalPages: 1,
            currentTime: 0,
            totalTime: lesson.duration ? lesson.duration * 60 : 0, // Convertir en secondes
            lastPosition: JSON.stringify({ page: 1, time: 0 }),
          },
          include: {
            lesson: true,
            formation: true,
          },
        });

        return res.json({
          success: true,
          data: initialProgress,
        });
      }

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      console.error("❌ Erreur getUserProgress:", error);
      res.status(500).json({
        success: false,
        message:
          error.message || "Erreur lors de la récupération de la progression",
      });
    }
  },

  // Mettre à jour la progression d'un utilisateur
  async updateProgress(req, res) {
    try {
      const { userId, lessonId } = req.params;
      const {
        progress,
        currentPage,
        totalPages,
        currentTime,
        totalTime,
        lastPosition,
        isCompleted,
      } = req.body;

      if (!userId || !lessonId) {
        return res.status(400).json({
          success: false,
          message: "userId et lessonId sont requis",
        });
      }

      // Vérifier que la leçon existe
      const lesson = await prisma.formationContent.findUnique({
        where: { id: lessonId },
        include: { formation: true },
      });

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Leçon introuvable",
        });
      }

      // Calculer la progression automatiquement si non fournie
      let calculatedProgress = progress;
      if (calculatedProgress === undefined) {
        if (currentPage && totalPages) {
          // Pour les PDFs : pages lues / total pages
          calculatedProgress = Math.round((currentPage / totalPages) * 100);
        } else if (currentTime && totalTime) {
          // Pour les vidéos/audio : temps écouté / durée totale
          calculatedProgress = Math.round((currentTime / totalTime) * 100);
        }
      }

      // Limiter la progression entre 0 et 100
      calculatedProgress = Math.max(0, Math.min(100, calculatedProgress));

      // Si l'utilisateur n'existe pas, utiliser l'admin par défaut
      let actualUserId = userId;
      if (userId === "default-user-id") {
        const adminUser = await prisma.user.findFirst({
          where: { email: "admin@bai-consulting.com" },
        });
        if (adminUser) {
          actualUserId = adminUser.id;
          console.log(
            "🔄 Utilisation de l'utilisateur admin par défaut:",
            actualUserId
          );
        }
      }

      // Mettre à jour ou créer la progression
      const updatedProgress = await prisma.userProgress.upsert({
        where: {
          userId_lessonId: {
            userId: actualUserId,
            lessonId,
          },
        },
        update: {
          progress: calculatedProgress,
          currentPage,
          totalPages,
          currentTime,
          totalTime,
          lastPosition: lastPosition ? JSON.stringify(lastPosition) : undefined,
          lastAccessedAt: new Date(),
          isCompleted: isCompleted || calculatedProgress >= 100,
          completedAt:
            isCompleted || calculatedProgress >= 100 ? new Date() : undefined,
        },
        create: {
          userId: actualUserId,
          lessonId,
          formationId: lesson.formationId,
          progress: calculatedProgress,
          currentPage,
          totalPages,
          currentTime,
          totalTime,
          lastPosition: lastPosition ? JSON.stringify(lastPosition) : undefined,
          isCompleted: isCompleted || calculatedProgress >= 100,
          completedAt:
            isCompleted || calculatedProgress >= 100 ? new Date() : undefined,
        },
        include: {
          lesson: true,
          formation: true,
        },
      });

      res.json({
        success: true,
        data: updatedProgress,
        message: "Progression mise à jour avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur updateProgress:", error);
      res.status(500).json({
        success: false,
        message:
          error.message || "Erreur lors de la mise à jour de la progression",
      });
    }
  },

  // Obtenir la progression globale d'un utilisateur sur une formation
  async getFormationProgress(req, res) {
    try {
      const { userId, formationId } = req.params;

      if (!userId || !formationId) {
        return res.status(400).json({
          success: false,
          message: "userId et formationId sont requis",
        });
      }

      // Si l'utilisateur n'existe pas, utiliser l'admin par défaut
      let actualUserId = userId;
      if (userId === "default-user-id") {
        const adminUser = await prisma.user.findFirst({
          where: { email: "admin@bai-consulting.com" },
        });
        if (adminUser) {
          actualUserId = adminUser.id;
          console.log(
            "🔄 Utilisation de l'utilisateur admin par défaut:",
            actualUserId
          );
        }
      }

      // Récupérer toutes les leçons de la formation
      const lessons = await prisma.formationContent.findMany({
        where: {
          formationId,
          contentType: "LESSON",
        },
        orderBy: { order: "asc" },
      });

      // Récupérer la progression pour chaque leçon
      const progressData = await Promise.all(
        lessons.map(async (lesson) => {
          const progress = await prisma.userProgress.findUnique({
            where: {
              userId_lessonId: {
                userId: actualUserId,
                lessonId: lesson.id,
              },
            },
          });

          return {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonType: lesson.type,
            lessonDuration: lesson.duration,
            progress: progress?.progress || 0,
            isCompleted: progress?.isCompleted || false,
            currentPage: progress?.currentPage || 1,
            totalPages: progress?.totalPages || 1,
            currentTime: progress?.currentTime || 0,
            totalTime:
              progress?.totalTime ||
              (lesson.duration ? lesson.duration * 60 : 0),
          };
        })
      );

      // Calculer la progression globale
      const totalLessons = lessons.length;
      const completedLessons = progressData.filter((p) => p.isCompleted).length;
      const averageProgress =
        progressData.reduce((sum, p) => sum + p.progress, 0) / totalLessons;

      const formationProgress = {
        formationId,
        totalLessons,
        completedLessons,
        averageProgress: Math.round(averageProgress),
        lessons: progressData,
      };

      res.json({
        success: true,
        data: formationProgress,
      });
    } catch (error) {
      console.error("❌ Erreur getFormationProgress:", error);
      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Erreur lors de la récupération de la progression de formation",
      });
    }
  },

  // Marquer une leçon comme terminée
  async markLessonCompleted(req, res) {
    try {
      const { userId, lessonId } = req.params;

      if (!userId || !lessonId) {
        return res.status(400).json({
          success: false,
          message: "userId et lessonId sont requis",
        });
      }

      // Si l'utilisateur n'existe pas, utiliser l'admin par défaut
      let actualUserId = userId;
      if (userId === "default-user-id") {
        const adminUser = await prisma.user.findFirst({
          where: { email: "admin@bai-consulting.com" },
        });
        if (adminUser) {
          actualUserId = adminUser.id;
          console.log(
            "🔄 Utilisation de l'utilisateur admin par défaut:",
            actualUserId
          );
        }
      }

      const updatedProgress = await prisma.userProgress.update({
        where: {
          userId_lessonId: {
            userId: actualUserId,
            lessonId,
          },
        },
        data: {
          progress: 100,
          isCompleted: true,
          completedAt: new Date(),
          lastAccessedAt: new Date(),
        },
        include: {
          lesson: true,
          formation: true,
        },
      });

      res.json({
        success: true,
        data: updatedProgress,
        message: "Leçon marquée comme terminée",
      });
    } catch (error) {
      console.error("❌ Erreur markLessonCompleted:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Erreur lors du marquage de la leçon",
      });
    }
  },

  // Sauvegarder la progression (pour TestViewer)
  async saveProgress(req, res) {
    try {
      console.log("📊 saveProgress - Données reçues:", req.body);
      console.log("📊 saveProgress - Utilisateur authentifié:", req.user);

      const {
        lessonId,
        formationId,
        userId,
        currentPage,
        totalPages,
        currentTime,
        totalTime,
        progress,
        completed,
      } = req.body;

      // Validation des données
      if (!lessonId || !formationId || !userId) {
        console.log("❌ saveProgress - Données manquantes:", {
          lessonId,
          formationId,
          userId,
        });
        return res.status(400).json({
          error: "Données manquantes",
          required: ["lessonId", "formationId", "userId"],
          received: { lessonId, formationId, userId },
        });
      }

      // Utiliser l'utilisateur authentifié plutôt que celui dans le body
      const actualUserId = req.user.id;
      console.log(
        "📊 saveProgress - Utilisation de l'utilisateur authentifié:",
        actualUserId
      );

      // Vérifier que la leçon existe
      const lesson = await prisma.formationContent.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        console.log("❌ saveProgress - Leçon non trouvée:", lessonId);
        return res.status(404).json({ error: "Leçon non trouvée", lessonId });
      }

      // Vérifier que la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
      });

      if (!formation) {
        console.log("❌ saveProgress - Formation non trouvée:", formationId);
        return res
          .status(404)
          .json({ error: "Formation non trouvée", formationId });
      }

      // Créer ou mettre à jour la progression
      const progressData = {
        userId: actualUserId, // Utiliser l'utilisateur authentifié
        lessonId,
        formationId,
        progress: Math.min(100, Math.max(0, progress || 0)), // Limiter entre 0 et 100
        currentPage: currentPage || null,
        totalPages: totalPages || null,
        currentTime: currentTime || 0,
        totalTime: totalTime || null,
        lastPosition: JSON.stringify({
          currentPage,
          totalPages,
          currentTime,
          totalTime,
          progress,
          completed,
          timestamp: new Date().toISOString(),
        }),
        lastAccessedAt: new Date(),
        isCompleted: completed || false,
        completedAt: completed ? new Date() : null,
      };

      console.log(
        "📊 saveProgress - Données de progression à sauvegarder:",
        progressData
      );

      // Upsert (créer ou mettre à jour)
      const savedProgress = await prisma.userProgress.upsert({
        where: {
          userId_lessonId: {
            userId: actualUserId, // Utiliser l'utilisateur authentifié
            lessonId,
          },
        },
        update: progressData,
        create: {
          ...progressData,
          startedAt: new Date(),
        },
      });

      console.log("📊 Progression sauvegardée:", {
        userId,
        lessonId,
        formationId,
        progress: savedProgress.progress,
        currentPage: savedProgress.currentPage,
        isCompleted: savedProgress.isCompleted,
      });

      res.json({
        success: true,
        message: "Progression sauvegardée avec succès",
        progress: savedProgress,
      });
    } catch (error) {
      console.error(
        "❌ Erreur lors de la sauvegarde de la progression:",
        error
      );
      res.status(500).json({
        error: "Erreur interne du serveur",
        details: error.message,
      });
    }
  },

  // Récupérer la progression (pour TestViewer)
  async getProgress(req, res) {
    try {
      const { lessonId, formationId, userId } = req.query;

      // Validation des paramètres
      if (!lessonId || !formationId || !userId) {
        return res.status(400).json({
          error: "Paramètres manquants",
          required: ["lessonId", "formationId", "userId"],
        });
      }

      // Récupérer la progression
      const progress = await prisma.userProgress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
          formation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!progress) {
        return res.json({
          success: true,
          message: "Aucune progression trouvée",
          progress: null,
        });
      }

      console.log("📊 Progression récupérée:", {
        userId,
        lessonId,
        formationId,
        progress: progress.progress,
        currentPage: progress.currentPage,
        isCompleted: progress.isCompleted,
      });

      res.json({
        success: true,
        message: "Progression récupérée avec succès",
        progress: {
          id: progress.id,
          userId: progress.userId,
          lessonId: progress.lessonId,
          formationId: progress.formationId,
          progress: progress.progress,
          currentPage: progress.currentPage,
          totalPages: progress.totalPages,
          currentTime: progress.currentTime,
          totalTime: progress.totalTime,
          lastPosition: progress.lastPosition
            ? JSON.parse(progress.lastPosition)
            : null,
          startedAt: progress.startedAt,
          lastAccessedAt: progress.lastAccessedAt,
          completedAt: progress.completedAt,
          isCompleted: progress.isCompleted,
          lesson: progress.lesson,
          formation: progress.formation,
        },
      });
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération de la progression:",
        error
      );
      res.status(500).json({
        error: "Erreur interne du serveur",
        details: error.message,
      });
    }
  },

  // Récupérer toutes les progressions d'un utilisateur (pour TestViewer)
  async getUserAllProgress(req, res) {
    try {
      const { userId } = req.params;
      const { formationId } = req.query;

      // Validation des paramètres
      if (!userId) {
        return res.status(400).json({ error: "ID utilisateur manquant" });
      }

      // Construire la requête
      const where = { userId };
      if (formationId) {
        where.formationId = formationId;
      }

      // Récupérer toutes les progressions
      const progressions = await prisma.userProgress.findMany({
        where,
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              type: true,
              contentType: true,
            },
          },
          formation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: [{ formationId: "asc" }, { lessonId: "asc" }],
      });

      console.log(
        `📊 ${progressions.length} progressions récupérées pour l'utilisateur ${userId}`
      );

      res.json({
        success: true,
        message: "Progressions récupérées avec succès",
        count: progressions.length,
        progressions: progressions.map((p) => ({
          id: p.id,
          userId: p.userId,
          lessonId: p.lessonId,
          formationId: p.formationId,
          progress: p.progress,
          currentPage: p.currentPage,
          totalPages: p.totalPages,
          currentTime: p.currentTime,
          totalTime: p.totalTime,
          lastPosition: p.lastPosition ? JSON.parse(p.lastPosition) : null,
          startedAt: p.startedAt,
          lastAccessedAt: p.lastAccessedAt,
          completedAt: p.completedAt,
          isCompleted: p.isCompleted,
          lesson: p.lesson,
          formation: p.formation,
        })),
      });
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des progressions:",
        error
      );
      res.status(500).json({
        error: "Erreur interne du serveur",
        details: error.message,
      });
    }
  },
};
