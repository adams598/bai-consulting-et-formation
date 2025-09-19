import { PrismaClient } from "@prisma/client";
import {
  getUserRecentVisits,
  getLastContentVisit,
} from "../middleware/content-visit.middleware.js";

const prisma = new PrismaClient();

// Contrôleur pour les consultations de contenu
export const contentVisitsController = {
  // Obtenir les consultations récentes d'un utilisateur
  getUserRecentVisits: async (req, res) => {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;

      // Vérifier les permissions
      const requestingUser = await prisma.user.findUnique({
        where: { id: requestingUserId },
        select: { role: true },
      });

      // Seuls les admins peuvent consulter les visites d'autres utilisateurs
      // Les utilisateurs peuvent consulter leurs propres visites
      if (
        userId !== requestingUserId &&
        (!requestingUser ||
          (requestingUser.role !== "SUPER_ADMIN" &&
            requestingUser.role !== "BANK_ADMIN"))
      ) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les permissions pour consulter ces données",
        });
      }

      const visits = await getUserRecentVisits(userId, limit);

      // Enrichir les données avec les informations de contenu
      const enrichedVisits = await Promise.all(
        visits.map(async (visit) => {
          let contentInfo = null;

          if (visit.contentId) {
            switch (visit.contentType) {
              case "formation_detail":
                const formation = await prisma.formation.findUnique({
                  where: { id: visit.contentId },
                  select: { title: true, code: true },
                });
                if (formation) {
                  contentInfo = {
                    title: formation.title,
                    code: formation.code,
                    type: "Formation",
                  };
                }
                break;

              case "lesson_detail":
                const lesson = await prisma.lesson.findUnique({
                  where: { id: visit.contentId },
                  select: {
                    title: true,
                    formation: { select: { title: true } },
                  },
                });
                if (lesson) {
                  contentInfo = {
                    title: lesson.title,
                    formationTitle: lesson.formation?.title,
                    type: "Leçon",
                  };
                }
                break;

              case "quiz_detail":
                const quiz = await prisma.quiz.findUnique({
                  where: { id: visit.contentId },
                  select: {
                    title: true,
                    formation: { select: { title: true } },
                  },
                });
                if (quiz) {
                  contentInfo = {
                    title: quiz.title,
                    formationTitle: quiz.formation?.title,
                    type: "Quiz",
                  };
                }
                break;
            }
          }

          return {
            ...visit,
            contentInfo,
            durationFormatted: visit.duration
              ? formatDuration(visit.duration)
              : null,
          };
        })
      );

      res.json({
        success: true,
        data: enrichedVisits,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des consultations récentes:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des consultations",
      });
    }
  },

  // Obtenir la dernière consultation d'un contenu spécifique
  getLastContentVisit: async (req, res) => {
    try {
      const userId = req.params.userId;
      const contentType = req.query.contentType;
      const contentId = req.query.contentId;
      const requestingUserId = req.user.id;

      // Vérifier les permissions
      const requestingUser = await prisma.user.findUnique({
        where: { id: requestingUserId },
        select: { role: true },
      });

      if (
        userId !== requestingUserId &&
        (!requestingUser ||
          (requestingUser.role !== "SUPER_ADMIN" &&
            requestingUser.role !== "BANK_ADMIN"))
      ) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les permissions pour consulter ces données",
        });
      }

      if (!contentType) {
        return res.status(400).json({
          success: false,
          message: "Le type de contenu est requis",
        });
      }

      const visit = await getLastContentVisit(userId, contentType, contentId);

      if (!visit) {
        return res.status(404).json({
          success: false,
          message: "Aucune consultation trouvée",
        });
      }

      res.json({
        success: true,
        data: {
          ...visit,
          durationFormatted: visit.duration
            ? formatDuration(visit.duration)
            : null,
        },
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la dernière consultation:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de la consultation",
      });
    }
  },

  // Obtenir les statistiques de consultation d'un utilisateur
  getUserVisitStats: async (req, res) => {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.user.id;
      const days = parseInt(req.query.days) || 30;

      // Vérifier les permissions
      const requestingUser = await prisma.user.findUnique({
        where: { id: requestingUserId },
        select: { role: true },
      });

      if (
        userId !== requestingUserId &&
        (!requestingUser ||
          (requestingUser.role !== "SUPER_ADMIN" &&
            requestingUser.role !== "BANK_ADMIN"))
      ) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas les permissions pour consulter ces données",
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Statistiques générales
      const totalVisits = await prisma.contentVisit.count({
        where: {
          userId,
          visitedAt: { gte: startDate },
        },
      });

      // Visites par type de contenu
      const visitsByType = await prisma.contentVisit.groupBy({
        by: ["contentType"],
        where: {
          userId,
          visitedAt: { gte: startDate },
        },
        _count: {
          contentType: true,
        },
      });

      // Temps total passé
      const totalDuration = await prisma.contentVisit.aggregate({
        where: {
          userId,
          visitedAt: { gte: startDate },
          duration: { not: null },
        },
        _sum: {
          duration: true,
        },
      });

      // Dernière activité
      const lastActivity = await prisma.contentVisit.findFirst({
        where: { userId },
        orderBy: { visitedAt: "desc" },
        select: {
          contentType: true,
          contentTitle: true,
          visitedAt: true,
        },
      });

      // Activité par jour (derniers 7 jours)
      const dailyActivity = await prisma.$queryRaw`
        SELECT 
          DATE(visitedAt) as date,
          COUNT(*) as visits,
          SUM(COALESCE(duration, 0)) as totalDuration
        FROM content_visits 
        WHERE userId = ${userId} 
          AND visitedAt >= ${startDate}
        GROUP BY DATE(visitedAt)
        ORDER BY date DESC
        LIMIT 7
      `;

      const stats = {
        period: `${days} derniers jours`,
        totalVisits,
        visitsByType: visitsByType.map((v) => ({
          type: v.contentType,
          count: v._count.contentType,
        })),
        totalDuration: totalDuration._sum.duration || 0,
        totalDurationFormatted: formatDuration(
          totalDuration._sum.duration || 0
        ),
        lastActivity,
        dailyActivity,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des statistiques de consultation:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des statistiques",
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
