import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Contrôleur pour le dashboard des apprenants
export const learnerDashboardController = {
  // Obtenir les statistiques du dashboard apprenant
  getDashboardStats: async (req, res) => {
    try {
      const userId = req.user.id;

      // Récupérer les formations assignées à l'utilisateur
      const userFormations = await prisma.userFormationAssignment.findMany({
        where: { userId },
        include: {
          bankFormation: {
            include: {
              formation: true,
            },
          },
        },
      });

      // Calculer les statistiques
      const totalFormations = userFormations.length;
      const completedFormations = userFormations.filter((uf) => {
        // Vérifier si la formation est complétée
        return uf.bankFormation.formation.isActive;
      }).length;

      // Récupérer les progressions
      const progressions = await prisma.userProgress.findMany({
        where: { userId },
        include: {
          formation: true,
        },
      });

      const inProgressFormations = progressions.filter(
        (p) => p.progress > 0 && p.progress < 100
      ).length;
      const pendingFormations =
        totalFormations - completedFormations - inProgressFormations;

      // Calculer le temps total passé
      const totalTimeSpent = progressions.reduce(
        (sum, p) => sum + (p.timeSpent || 0),
        0
      );

      // Récupérer les certificats
      const certificates = await prisma.certificate.findMany({
        where: { userId },
      });

      // Calculer le score moyen des quiz
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: { userId, isPassed: true },
      });

      const averageScore =
        quizAttempts.length > 0
          ? quizAttempts.reduce((sum, q) => sum + q.score, 0) /
            quizAttempts.length
          : 0;

      const stats = {
        totalFormations,
        completedFormations,
        inProgressFormations,
        pendingFormations,
        certificatesEarned: certificates.length,
        totalTimeSpent: Math.round(totalTimeSpent / 60), // Convertir en minutes
        averageScore: Math.round(averageScore),
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des statistiques dashboard:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des statistiques",
      });
    }
  },

  // Obtenir les activités récentes
  getRecentActivities: async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;

      // Récupérer les activités récentes
      const activities = [];

      // Formations récemment terminées
      const completedFormations = await prisma.userProgress.findMany({
        where: {
          userId,
          isCompleted: true,
        },
        include: {
          formation: true,
        },
        orderBy: { completedAt: "desc" },
        take: limit,
      });

      completedFormations.forEach((progress) => {
        activities.push({
          id: `completed-${progress.id}`,
          type: "formation_completed",
          title: progress.formation.title,
          description: "Vous avez terminé cette formation avec succès",
          timestamp: progress.completedAt,
          formationId: progress.formationId,
        });
      });

      // Certificats récemment obtenus
      const recentCertificates = await prisma.certificate.findMany({
        where: { userId },
        include: {
          formation: true,
        },
        orderBy: { issuedAt: "desc" },
        take: limit,
      });

      recentCertificates.forEach((certificate) => {
        activities.push({
          id: `certificate-${certificate.id}`,
          type: "certificate_earned",
          title: `Certificat ${certificate.formation.title}`,
          description: "Félicitations ! Vous avez obtenu un nouveau certificat",
          timestamp: certificate.issuedAt,
          formationId: certificate.formationId,
        });
      });

      // Formations récemment démarrées
      const startedFormations = await prisma.userProgress.findMany({
        where: {
          userId,
          progress: { gt: 0 },
          isCompleted: false,
        },
        include: {
          formation: true,
        },
        orderBy: { startedAt: "desc" },
        take: limit,
      });

      startedFormations.forEach((progress) => {
        activities.push({
          id: `started-${progress.id}`,
          type: "formation_started",
          title: progress.formation.title,
          description: "Vous avez commencé cette nouvelle formation",
          timestamp: progress.startedAt,
          formationId: progress.formationId,
        });
      });

      // Trier par timestamp et limiter
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const recentActivities = activities.slice(0, limit);

      res.json({
        success: true,
        data: recentActivities,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des activités récentes:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des activités récentes",
      });
    }
  },

  // Obtenir les échéances à venir
  getUpcomingDeadlines: async (req, res) => {
    try {
      const userId = req.user.id;

      // Récupérer les formations avec échéances
      const upcomingDeadlines = await prisma.userFormationAssignment.findMany({
        where: {
          userId,
          dueDate: {
            gte: new Date(), // Échéances futures
          },
        },
        include: {
          bankFormation: {
            include: {
              formation: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
      });

      // Récupérer les progressions pour calculer le pourcentage
      const progressions = await prisma.userProgress.findMany({
        where: { userId },
        include: {
          formation: true,
        },
      });

      const deadlines = upcomingDeadlines.map((deadline) => {
        const progress = progressions.find(
          (p) => p.formationId === deadline.bankFormation.formationId
        );

        return {
          id: deadline.id,
          formationTitle: deadline.bankFormation.formation.title,
          dueDate: deadline.dueDate,
          isMandatory: deadline.isMandatory,
          progress: progress ? progress.progress : 0,
        };
      });

      res.json({
        success: true,
        data: deadlines,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des échéances:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des échéances",
      });
    }
  },
};
