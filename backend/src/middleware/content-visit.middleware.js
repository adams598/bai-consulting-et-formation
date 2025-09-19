import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Middleware pour tracker les consultations de contenu
export const contentVisitMiddleware = (options = {}) => {
  const {
    trackDuration = false,
    trackUserAgent = true,
    trackIpAddress = true,
    trackReferrer = true,
    excludePaths = ["/api/auth", "/api/admin/login", "/api/learner/login"],
    contentTypes = {
      "/admin/formations": "formation_list",
      "/admin/users": "user_list",
      "/admin/dashboard": "dashboard",
      "/apprenant/dashboard": "learner_dashboard",
      "/apprenant/formations": "learner_formations",
      "/apprenant/progress": "learner_progress",
      "/apprenant/certificates": "learner_certificates",
    },
  } = options;

  return async (req, res, next) => {
    try {
      // Vérifier si l'utilisateur est authentifié
      if (!req.user || !req.user.id) {
        return next();
      }

      // Vérifier si le chemin doit être exclu
      const shouldExclude = excludePaths.some((path) =>
        req.path.startsWith(path)
      );
      if (shouldExclude) {
        return next();
      }

      // Déterminer le type de contenu basé sur le chemin
      let contentType = "page";
      let contentId = null;
      let contentTitle = null;

      // Vérifier les patterns spécifiques
      for (const [path, type] of Object.entries(contentTypes)) {
        if (req.path.startsWith(path)) {
          contentType = type;
          break;
        }
      }

      // Extraire l'ID du contenu si présent dans l'URL
      const pathSegments = req.path.split("/").filter(Boolean);

      // Patterns pour extraire les IDs de contenu
      if (req.path.includes("/formations/") && pathSegments.length > 2) {
        const formationId =
          pathSegments[pathSegments.indexOf("formations") + 1];
        if (formationId && formationId !== "new" && formationId !== "edit") {
          contentId = formationId;
          contentType = "formation_detail";
        }
      } else if (req.path.includes("/users/") && pathSegments.length > 2) {
        const userId = pathSegments[pathSegments.indexOf("users") + 1];
        if (userId && userId !== "new" && userId !== "edit") {
          contentId = userId;
          contentType = "user_detail";
        }
      } else if (req.path.includes("/lessons/") && pathSegments.length > 2) {
        const lessonId = pathSegments[pathSegments.indexOf("lessons") + 1];
        if (lessonId) {
          contentId = lessonId;
          contentType = "lesson_detail";
        }
      } else if (req.path.includes("/quiz/") && pathSegments.length > 2) {
        const quizId = pathSegments[pathSegments.indexOf("quiz") + 1];
        if (quizId) {
          contentId = quizId;
          contentType = "quiz_detail";
        }
      }

      // Préparer les données de la visite
      const visitData = {
        userId: req.user.id,
        contentType,
        contentId,
        contentTitle,
        url: req.originalUrl,
        userAgent: trackUserAgent ? req.get("User-Agent") : null,
        ipAddress: trackIpAddress
          ? req.ip || req.connection.remoteAddress
          : null,
        referrer: trackReferrer ? req.get("Referer") : null,
      };

      // Enregistrer la visite de manière asynchrone (ne pas bloquer la réponse)
      setImmediate(async () => {
        try {
          await prisma.contentVisit.create({
            data: visitData,
          });
        } catch (error) {
          console.error("Erreur lors de l'enregistrement de la visite:", error);
        }
      });

      // Si on track la durée, on peut ajouter un middleware de fin
      if (trackDuration) {
        const startTime = Date.now();

        res.on("finish", async () => {
          const duration = Math.floor((Date.now() - startTime) / 1000);

          try {
            // Mettre à jour la dernière visite avec la durée
            await prisma.contentVisit.updateMany({
              where: {
                userId: req.user.id,
                url: req.originalUrl,
                visitedAt: {
                  gte: new Date(startTime - 1000), // Dans la dernière seconde
                },
              },
              data: {
                duration,
              },
            });
          } catch (error) {
            console.error("Erreur lors de la mise à jour de la durée:", error);
          }
        });
      }

      next();
    } catch (error) {
      console.error("Erreur dans le middleware contentVisit:", error);
      next(); // Continuer même en cas d'erreur
    }
  };
};

// Fonction utilitaire pour enregistrer manuellement une visite
export const recordContentVisit = async (data) => {
  try {
    const visit = await prisma.contentVisit.create({
      data: {
        userId: data.userId,
        contentType: data.contentType,
        contentId: data.contentId,
        contentTitle: data.contentTitle,
        url: data.url,
        duration: data.duration,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        referrer: data.referrer,
      },
    });
    return visit;
  } catch (error) {
    console.error(
      "Erreur lors de l'enregistrement manuel de la visite:",
      error
    );
    throw error;
  }
};

// Fonction pour obtenir les dernières consultations d'un utilisateur
export const getUserRecentVisits = async (userId, limit = 10) => {
  try {
    const visits = await prisma.contentVisit.findMany({
      where: { userId },
      orderBy: { visitedAt: "desc" },
      take: limit,
      select: {
        id: true,
        contentType: true,
        contentId: true,
        contentTitle: true,
        url: true,
        duration: true,
        visitedAt: true,
      },
    });
    return visits;
  } catch (error) {
    console.error("Erreur lors de la récupération des visites:", error);
    throw error;
  }
};

// Fonction pour obtenir la dernière consultation d'un contenu spécifique
export const getLastContentVisit = async (
  userId,
  contentType,
  contentId = null
) => {
  try {
    const whereClause = {
      userId,
      contentType,
    };

    if (contentId) {
      whereClause.contentId = contentId;
    }

    const visit = await prisma.contentVisit.findFirst({
      where: whereClause,
      orderBy: { visitedAt: "desc" },
      select: {
        id: true,
        contentId: true,
        contentTitle: true,
        url: true,
        duration: true,
        visitedAt: true,
      },
    });

    return visit;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la dernière visite:",
      error
    );
    throw error;
  }
};
