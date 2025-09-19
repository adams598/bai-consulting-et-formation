import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Contrôleur pour le suivi de progression des utilisateurs par les admins
export const userProgressController = {
  // Obtenir la progression détaillée d'un utilisateur
  getUserProgress: async (req, res) => {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.user.id;

      // Vérifier que l'utilisateur qui fait la requête a les permissions
      const requestingUser = await prisma.user.findUnique({
        where: { id: requestingUserId },
        select: { role: true },
      });

      if (
        !requestingUser ||
        (requestingUser.role !== "SUPER_ADMIN" &&
          requestingUser.role !== "BANK_ADMIN")
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Vous n'avez pas les permissions pour consulter cette progression",
        });
      }

      // Récupérer les informations de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          bank: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Récupérer les formations assignées à l'utilisateur
      const userFormations = await prisma.userFormationAssignment.findMany({
        where: { userId },
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
          lesson: true,
        },
        orderBy: { lastAccessedAt: "desc" },
      });

      // Récupérer les certificats
      const certificates = await prisma.certificate.findMany({
        where: { userId },
        include: {
          formation: true,
        },
      });

      // Récupérer les tentatives de quiz
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: { userId },
        include: {
          quiz: {
            include: {
              formation: true,
            },
          },
        },
        orderBy: { completedAt: "desc" },
      });

      // Calculer les statistiques générales
      const totalFormations = userFormations.length;
      const completedFormations = progressions.filter(
        (p) => p.isCompleted
      ).length;
      const inProgressFormations = progressions.filter(
        (p) => p.progress > 0 && p.progress < 100
      ).length;
      const pendingFormations =
        totalFormations - completedFormations - inProgressFormations;

      // Calculer les statistiques des quiz
      const totalQuizAttempts = quizAttempts.length;
      const passedQuizAttempts = quizAttempts.filter((q) => q.isPassed).length;
      const failedQuizAttempts = totalQuizAttempts - passedQuizAttempts;
      const averageQuizScore =
        totalQuizAttempts > 0
          ? Math.round(
              quizAttempts.reduce((sum, q) => sum + q.score, 0) /
                totalQuizAttempts
            )
          : 0;

      // Calculer le temps total passé
      const totalTimeSpent = progressions.reduce(
        (sum, p) => sum + (p.timeSpent || 0),
        0
      );

      // Trouver la dernière activité
      const lastActivity =
        progressions.length > 0 ? progressions[0].lastAccessedAt : null;

      // Trouver la dernière formation vue
      const lastFormationViewed =
        progressions.length > 0 ? progressions[0].formation : null;
      const lastFormationViewedDate =
        progressions.length > 0 ? progressions[0].lastAccessedAt : null;

      // Récupérer les consultations récentes
      const recentVisits = await prisma.contentVisit.findMany({
        where: { userId },
        orderBy: { visitedAt: "desc" },
        take: 10,
        select: {
          contentType: true,
          contentTitle: true,
          contentId: true,
          url: true,
          duration: true,
          visitedAt: true,
        },
      });

      // Trouver la dernière consultation de contenu
      const lastContentVisit = recentVisits.length > 0 ? recentVisits[0] : null;

      // Transformer les formations avec progression
      const formationsWithProgress = userFormations.map((userFormation) => {
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
          if (progress.isCompleted) {
            formationStatus = "completed";
          } else if (progress.progress > 0) {
            formationStatus = "in_progress";
          }
        }

        return {
          id: formation.id,
          title: formation.title,
          status: formationStatus,
          progress: progress ? progress.progress : 0,
          startedAt: progress ? progress.startedAt : null,
          completedAt: progress ? progress.completedAt : null,
          lastAccessedAt: progress ? progress.lastAccessedAt : null,
          timeSpent: progress ? Math.round((progress.timeSpent || 0) / 60) : 0, // Convertir en minutes
          hasQuiz: !!formation.quiz,
          quizPassed: quizAttempt ? quizAttempt.isPassed : false,
          quizScore: quizAttempt ? quizAttempt.score : null,
          certificateEarned: !!certificate,
        };
      });

      // Récupérer les formations planifiées (avec échéances)
      const scheduledFormations = userFormations
        .filter((uf) => uf.dueDate)
        .map((uf) => ({
          id: uf.bankFormation.formation.id,
          title: uf.bankFormation.formation.title,
          scheduledDate: uf.dueDate,
          isMandatory: uf.isMandatory,
          status: uf.dueDate > new Date() ? "upcoming" : "overdue",
        }))
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

      // Construire la réponse
      const progressData = {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        userRole: user.role,
        bank: user.bank,

        // Statistiques générales
        totalFormations,
        completedFormations,
        inProgressFormations,
        pendingFormations,
        totalTimeSpent: Math.round(totalTimeSpent / 60), // Convertir en minutes

        // Progression détaillée
        formations: formationsWithProgress,

        // Quiz
        totalQuizAttempts,
        passedQuizAttempts,
        failedQuizAttempts,
        averageQuizScore,

        // Activité récente
        lastActivity,
        lastFormationViewed: lastFormationViewed?.title,
        lastFormationViewedDate,

        // Consultations récentes
        recentVisits: recentVisits.map((visit) => ({
          ...visit,
          durationFormatted: visit.duration
            ? formatDuration(visit.duration)
            : null,
        })),
        lastContentVisit: lastContentVisit
          ? {
              ...lastContentVisit,
              durationFormatted: lastContentVisit.duration
                ? formatDuration(lastContentVisit.duration)
                : null,
            }
          : null,

        // Formations planifiées
        scheduledFormations,
      };

      res.json({
        success: true,
        data: progressData,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la progression utilisateur:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de la progression",
      });
    }
  },

  // Obtenir un résumé rapide de la progression d'un utilisateur
  getUserProgressSummary: async (req, res) => {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.user.id;

      // Vérifier les permissions
      const requestingUser = await prisma.user.findUnique({
        where: { id: requestingUserId },
        select: { role: true },
      });

      if (
        !requestingUser ||
        (requestingUser.role !== "SUPER_ADMIN" &&
          requestingUser.role !== "BANK_ADMIN")
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Vous n'avez pas les permissions pour consulter cette progression",
        });
      }

      // Récupérer les statistiques de base
      const userFormations = await prisma.userFormationAssignment.count({
        where: { userId },
      });

      const completedFormations = await prisma.userProgress.count({
        where: {
          userId,
          isCompleted: true,
        },
      });

      const inProgressFormations = await prisma.userProgress.count({
        where: {
          userId,
          progress: { gt: 0, lt: 100 },
        },
      });

      const totalQuizAttempts = await prisma.quizAttempt.count({
        where: { userId },
      });

      const passedQuizAttempts = await prisma.quizAttempt.count({
        where: {
          userId,
          isPassed: true,
        },
      });

      const lastActivity = await prisma.userProgress.findFirst({
        where: { userId },
        orderBy: { lastAccessedAt: "desc" },
        select: { lastAccessedAt: true },
      });

      const summary = {
        totalFormations: userFormations,
        completedFormations,
        inProgressFormations,
        pendingFormations:
          userFormations - completedFormations - inProgressFormations,
        totalQuizAttempts,
        passedQuizAttempts,
        failedQuizAttempts: totalQuizAttempts - passedQuizAttempts,
        lastActivity: lastActivity?.lastAccessedAt,
      };

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du résumé de progression:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du résumé de progression",
      });
    }
  },
};

// Fonction utilitaire pour formater la durée
function formatDuration(seconds) {
  if (!seconds) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
