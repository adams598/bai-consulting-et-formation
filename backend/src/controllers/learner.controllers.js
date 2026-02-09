import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { UserRole, FormationStatus, AssignmentStatus } from "../types/index.js";

const prisma = new PrismaClient();

// Contrôleur d'authentification pour apprenants
export const authController = {
  // Connexion pour apprenants
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email et mot de passe requis",
        });
      }

      // Rechercher l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email },
        include: { bank: true },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Identifiants invalides",
        });
      }

      // Vérifier que c'est un collaborateur
      if (user.role !== UserRole.COLLABORATOR) {
        return res.status(403).json({
          success: false,
          message: "Accès réservé aux collaborateurs",
        });
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Identifiants invalides",
        });
      }

      // Vérifier que l'utilisateur est actif
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Compte désactivé",
        });
      }

      // Générer le token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          bankId: user.bankId,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" },
      );

      // Mettre à jour la dernière connexion et effacer l'expiration du mot de passe
      const loginTime = new Date();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: loginTime,
          lastLoginAt: loginTime,
          passwordExpiresAt: null, // Effacer l'expiration du mot de passe après connexion réussie
        },
      });

      // Créer une session utilisateur avec timeout d'inactivité de 10 minutes
      const now = new Date();
      const sessionExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes d'inactivité

      await prisma.userSession.create({
        data: {
          userId: user.id,
          token: token,
          refreshToken: null, // Pas de refresh token pour les collaborateurs
          expiresAt: sessionExpiresAt,
          lastActivity: now,
          userAgent: req.headers["user-agent"] || "Unknown",
          ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        },
      });

      // Retourner la réponse
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            bankId: user.bankId,
            bank: user.bank,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
          },
          accessToken: token,
        },
      });
    } catch (error) {
      console.error("Erreur de connexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Déconnexion
  logout: async (req, res) => {
    try {
      // En production, on pourrait invalider le token
      res.json({
        success: true,
        message: "Déconnexion réussie",
      });
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir l'utilisateur actuel
  getCurrentUser: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user?.id || req.user?.userId },
        include: { bank: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          bankId: user.bankId,
          bank: user.bank,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      console.error("Erreur getCurrentUser:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Rafraîchir le token
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token requis",
        });
      }

      // Vérifier le refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || "refresh-secret",
      );

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Token invalide",
        });
      }

      // Générer un nouveau token
      const newToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          bankId: user.bankId,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" },
      );

      res.json({
        success: true,
        data: {
          accessToken: newToken,
        },
      });
    } catch (error) {
      console.error("Erreur refreshToken:", error);
      res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }
  },

  // Changer le mot de passe
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id || req.user?.userId;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Ancien et nouveau mot de passe requis",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier l'ancien mot de passe
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Ancien mot de passe incorrect",
        });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: "Mot de passe modifié avec succès",
      });
    } catch (error) {
      console.error("Erreur changePassword:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

// Contrôleur des formations pour apprenants
export const formationsController = {
  // Obtenir les formations de l'apprenant
  getMyFormations: async (req, res) => {
    try {
      const userId = req.user.id; // Correction: req.user.id au lieu de req.user.userId
      console.log(
        "🔄 [LEARNER API] getMyFormations appelé pour userId:",
        userId,
      );

      // Récupérer les formations assignées à l'utilisateur
      const assignments = await prisma.formationAssignment.findMany({
        where: { userId },
        include: {
          formation: {
            include: {
              content: true, // Inclure le contenu pour compter les leçons
              universe: true, // Inclure l'univers de la formation
            },
          },
          user: true,
          assignedByUser: true,
        },
      });

      console.log(
        "📊 [LEARNER API] Nombre d'assignations trouvées:",
        assignments.length,
      );

      // Récupérer la progression pour chaque formation
      const formationsWithProgress = await Promise.all(
        assignments.map(async (assignment) => {
          // Calculer la progression globale de la formation
          const userProgress = await prisma.userProgress.findMany({
            where: {
              userId,
              formationId: assignment.formationId,
            },
          });

          const totalLessons =
            assignment.formation.content?.filter(
              (c) => c.contentType === "LESSON",
            ).length || 0;
          const completedLessons = userProgress.filter(
            (p) => p.isCompleted,
          ).length;
          const progressPercentage =
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;

          return {
            ...assignment,
            progress: progressPercentage,
            lessonCount: totalLessons,
            completedLessons,
          };
        }),
      );

      // Retourner les assignations avec progression calculée
      const formations = formationsWithProgress.map((assignment) => ({
        id: assignment.id,
        formationId: assignment.formation.id,
        formation: {
          id: assignment.formation.id,
          title: assignment.formation.title,
          description: assignment.formation.description,
          duration: assignment.formation.duration,
          totalDuration:
            assignment.formation.totalDuration || assignment.formation.duration,
          coverImage: assignment.formation.coverImage,
          code: assignment.formation.code,
          isActive: assignment.formation.isActive,
          lessonCount: assignment.lessonCount,
          createdAt: assignment.formation.createdAt,
          updatedAt: assignment.formation.updatedAt,
          universeId: assignment.formation.universeId,
          isOpportunity: assignment.formation.isOpportunity,
          universe: assignment.formation.universe,
          hasQuiz: !!assignment.formation.quiz,
        },
        status: assignment.status,
        progress: assignment.progress,
        assignedAt: assignment.assignedAt,
        dueDate: assignment.dueDate,
        isMandatory: assignment.isMandatory || false,
        timeSpent: assignment.timeSpent || 0,
        completedLessons: assignment.completedLessons,
      }));

      console.log(
        "✅ [LEARNER API] Retour de",
        formations.length,
        "formations transformées",
      );

      res.json({
        success: true,
        data: formations,
      });
    } catch (error) {
      console.error("Erreur getMyFormations:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir toutes les formations avec indication d'assignation pour les COLLABORATOR
  getAllFormationsWithAssignment: async (req, res) => {
    try {
      const userId = req.user.id;
      console.log(
        "🔄 [LEARNER API] getAllFormationsWithAssignment appelé pour userId:",
        userId,
      );

      // Récupérer toutes les formations actives
      const allFormations = await prisma.formation.findMany({
        where: {
          isActive: true,
        },
        include: {
          content: true,
          universe: true,
          quiz: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(
        "📊 [LEARNER API] Nombre total de formations trouvées:",
        allFormations.length,
      );

      // Debug: Afficher les données des formations
      allFormations.forEach((formation) => {
        // console.log(`🔍 [LEARNER API] Formation "${formation.title}":`, {
        //   id: formation.id,
        //   universeId: formation.universeId,
        //   universe: formation.universe,
        //   isOpportunity: formation.isOpportunity,
        // });
      });

      // Récupérer les formations assignées à l'utilisateur
      const assignments = await prisma.formationAssignment.findMany({
        where: { userId },
        select: {
          formationId: true,
          status: true,
          assignedAt: true,
          dueDate: true,
        },
      });

      // Créer un Set des IDs des formations assignées pour une recherche rapide
      const assignedFormationIds = new Set(
        assignments.map((a) => a.formationId),
      );
      const assignmentMap = new Map(assignments.map((a) => [a.formationId, a]));

      console.log(
        "📊 [LEARNER API] Nombre de formations assignées:",
        assignedFormationIds.size,
      );

      // Récupérer la progression pour chaque formation assignée
      const userProgress = await prisma.userProgress.findMany({
        where: {
          userId,
        },
        select: {
          formationId: true,
          isCompleted: true,
        },
      });

      // Calculer la progression par formation
      const progressMap = new Map();
      userProgress.forEach((progress) => {
        if (!progressMap.has(progress.formationId)) {
          progressMap.set(progress.formationId, { completed: 0, total: 0 });
        }
        const current = progressMap.get(progress.formationId);
        current.total++;
        if (progress.isCompleted) {
          current.completed++;
        }
      });

      // Transformer les formations avec indication d'assignation
      const formationsWithAssignment = allFormations.map((formation) => {
        const isAssigned = assignedFormationIds.has(formation.id);
        const assignment = assignmentMap.get(formation.id);
        const progress = progressMap.get(formation.id);

        // Calculer le nombre de leçons
        const lessonCount =
          formation.content?.filter((c) => c.contentType === "LESSON").length ||
          0;

        // Calculer la progression
        const progressPercentage =
          progress && progress.total > 0
            ? Math.round((progress.completed / progress.total) * 100)
            : 0;

        return {
          id: formation.id,
          title: formation.title,
          description: formation.description,
          duration: formation.duration,
          totalDuration: formation.duration, // Utiliser duration comme totalDuration
          coverImage: formation.coverImage,
          code: formation.code,
          pedagogicalModality: formation.pedagogicalModality,
          organization: formation.organization,
          prerequisites: formation.prerequisites,
          objectives: formation.objectives,
          detailedProgram: formation.detailedProgram,
          targetAudience: formation.targetAudience,
          isActive: formation.isActive,
          lessonCount,
          createdAt: formation.createdAt,
          updatedAt: formation.updatedAt,
          universeId: formation.universeId,
          isOpportunity: formation.isOpportunity,
          universe: formation.universe,
          hasQuiz: !!formation.quiz,

          // Informations d'assignation
          isAssigned,
          assignment: isAssigned
            ? {
                id: assignment.formationId,
                status: assignment.status,
                progress: progressPercentage,
                assignedAt: assignment.assignedAt,
                dueDate: assignment.dueDate,
                isMandatory: false, // Par défaut, pas de champ isMandatory dans le schéma
                timeSpent: 0, // Par défaut, pas de champ timeSpent dans le schéma
                completedLessons: progress?.completed || 0,
              }
            : null,

          // Progression globale
          globalProgress: isAssigned ? progressPercentage : 0,
          quizPassed: false, // TODO: Implémenter la vérification des quiz
          certificateEarned: false, // TODO: Implémenter la vérification des certificats
        };
      });

      console.log(
        "✅ [LEARNER API] Retour de",
        formationsWithAssignment.length,
        "formations avec indication d'assignation",
      );

      res.json({
        success: true,
        data: formationsWithAssignment,
      });
    } catch (error) {
      console.error("Erreur getAllFormationsWithAssignment:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir les statistiques détaillées pour le dashboard
  getDashboardStats: async (req, res) => {
    try {
      const userId = req.user.id;

      // Récupérer toutes les formations assignées
      const assignments = await prisma.formationAssignment.findMany({
        where: { userId },
        include: {
          formation: {
            include: {
              content: true,
            },
          },
        },
      });

      // Calculer les statistiques
      let totalFormations = assignments.length;
      let completedFormations = 0;
      let inProgressFormations = 0;
      let pendingFormations = 0;
      let totalTimeSpent = 0; // en minutes

      // Récupérer les certificats
      const certificates = await prisma.certificate.count({
        where: { userId },
      });

      // Récupérer toutes les tentatives de quiz pour calculer le score moyen
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: { userId, isCompleted: true },
        select: { score: true },
      });

      const averageScore =
        quizAttempts.length > 0
          ? Math.round(
              quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
                quizAttempts.length,
            )
          : 0;

      // Analyser chaque formation
      for (const assignment of assignments) {
        const totalLessons =
          assignment.formation.content?.filter(
            (c) => c.contentType === "LESSON",
          ).length || 0;

        // Vérifier la progression
        const userProgress = await prisma.userProgress.findMany({
          where: {
            userId,
            formationId: assignment.formationId,
          },
        });

        const completedLessons = userProgress.filter(
          (p) => p.isCompleted,
        ).length;
        const hasStarted = userProgress.length > 0;
        const isCompleted =
          completedLessons === totalLessons && totalLessons > 0;

        if (isCompleted) {
          completedFormations++;
          // Ajouter le temps total de la formation aux formations terminées
          totalTimeSpent += assignment.formation.duration || 0;
        } else if (hasStarted) {
          inProgressFormations++;
        } else {
          pendingFormations++;
        }
      }

      res.json({
        success: true,
        data: {
          totalFormations,
          completedFormations,
          inProgressFormations,
          pendingFormations,
          certificatesEarned: certificates,
          totalTimeSpent,
          averageScore,
        },
      });
    } catch (error) {
      console.error("Erreur getDashboardStats:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir les événements planifiés
  getScheduledEvents: async (req, res) => {
    try {
      const userId = req.user.id;
      const now = new Date();

      // Récupérer les événements futurs de l'utilisateur
      const events = await prisma.calendarEvent.findMany({
        where: {
          userId,
          startDate: { gte: now },
          status: { not: "CANCELLED" },
        },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
            },
          },
        },
        orderBy: { startDate: "asc" },
      });

      // Transformer pour le format attendu par le frontend
      const transformedEvents = events.map((event) => ({
        id: event.id,
        formationTitle: event.formation?.title || event.title,
        eventType: event.eventType || "formation",
        scheduledDate: event.startDate.toISOString(),
        dueDate: event.formation ? null : event.endDate.toISOString(), // Pour les formations, pas de dueDate spécifique
        isMandatory: event.type === "FORMATION", // Les formations planifiées sont considérées comme importantes
        progress: 0, // À calculer selon la progression réelle
        formationId: event.formationId || event.id,
      }));

      res.json({
        success: true,
        data: transformedEvents,
      });
    } catch (error) {
      console.error("Erreur getScheduledEvents:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Planifier une formation dans l'agenda
  scheduleFormation: async (req, res) => {
    try {
      const userId = req.user.id;
      const { formationId, date, time, title, description } = req.body;

      // Vérifier que l'utilisateur a accès à cette formation
      const assignment = await prisma.formationAssignment.findFirst({
        where: {
          userId,
          formationId,
        },
        include: {
          formation: true,
        },
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée ou non assignée",
        });
      }

      // Créer l'événement dans l'agenda
      const startDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(
        startDateTime.getTime() + (assignment.formation.duration || 60) * 60000,
      );

      const calendarEvent = await prisma.calendarEvent.create({
        data: {
          userId,
          title: title || `Formation: ${assignment.formation.title}`,
          description: description || assignment.formation.description,
          startDate: startDateTime,
          endDate: endDateTime,
          type: "FORMATION",
          formationId,
          eventType: "formation",
          status: "CONFIRMED",
          reminders: JSON.stringify([15, 60]), // Rappels 15min et 1h avant
        },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
            },
          },
        },
      });

      // Créer une notification pour l'utilisateur
      await prisma.notification.create({
        data: {
          userId,
          title: "Formation planifiée",
          message: `La formation "${
            assignment.formation.title
          }" a été planifiée pour le ${new Date(date).toLocaleDateString(
            "fr-FR",
          )} à ${time}`,
          type: "INFO",
          isRead: false,
          relatedFormationId: formationId,
        },
      });

      res.json({
        success: true,
        message: "Formation planifiée avec succès",
        data: calendarEvent,
      });
    } catch (error) {
      console.error("Erreur scheduleFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir une formation spécifique
  getFormationById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.user?.userId;

      console.log(
        "🔄 [LEARNER API] getFormationById called for id:",
        id,
        "userId:",
        userId,
      );

      // Vérifier que l'utilisateur est authentifié
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // Vérifier que l'utilisateur a accès à cette formation
      // NOTE: le modèle FormationAssignment n'expose pas de relation `progress` directement,
      // la progression est stockée dans la table `userProgress`. Nous récupérons l'assignation,
      // puis la progression séparément.
      const assignment = await prisma.formationAssignment.findFirst({
        where: {
          formationId: id,
          userId,
        },
        include: {
          formation: {
            include: {
              quiz: {
                include: {
                  questions: {
                    orderBy: { order: "asc" },
                    include: {
                      answers: {
                        orderBy: { order: "asc" },
                      },
                    },
                  },
                },
              },
            },
          },
          user: true,
          assignedByUser: true,
        },
      });

      // Récupérer la progression de l'utilisateur pour cette formation (si existante)
      const progressRecord = await prisma.userProgress.findFirst({
        where: {
          formationId: id,
          userId,
        },
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée ou accès non autorisé",
        });
      }

      res.json({
        success: true,
        data: {
          ...assignment.formation,
          assignment: {
            isMandatory: assignment.isMandatory,
            dueDate: assignment.dueDate,
            status: assignment.status,
          },
          progress: progressRecord || null,
        },
      });
    } catch (error) {
      console.error("Erreur getFormationById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Commencer une formation
  startFormation: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Vérifier l'assignation
      const assignment = await prisma.formationAssignment.findFirst({
        where: {
          formationId: id,
          userId,
        },
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée ou accès non autorisé",
        });
      }

      // Créer ou mettre à jour la progression
      const progress = await prisma.userProgress.upsert({
        where: {
          userId_formationId: {
            userId,
            formationId: id,
          },
        },
        update: {
          status: FormationStatus.IN_PROGRESS,
          startedAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          userId,
          formationId: id,
          status: FormationStatus.IN_PROGRESS,
          startedAt: new Date(),
          progress: 0,
        },
      });

      // Mettre à jour le statut de l'assignation
      await prisma.formationAssignment.update({
        where: { id: assignment.id },
        data: { status: AssignmentStatus.IN_PROGRESS },
      });

      res.json({
        success: true,
        data: progress,
        message: "Formation démarrée avec succès",
      });
    } catch (error) {
      console.error("Erreur startFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Terminer une formation
  completeFormation: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Vérifier l'assignation
      const assignment = await prisma.formationAssignment.findFirst({
        where: {
          formationId: id,
          userId,
        },
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée ou accès non autorisé",
        });
      }

      // Mettre à jour la progression
      const progress = await prisma.userProgress.update({
        where: {
          userId_formationId: {
            userId,
            formationId: id,
          },
        },
        data: {
          status: FormationStatus.COMPLETED,
          completedAt: new Date(),
          progress: 100,
          updatedAt: new Date(),
        },
      });

      // Mettre à jour le statut de l'assignation
      await prisma.formationAssignment.update({
        where: { id: assignment.id },
        data: { status: AssignmentStatus.COMPLETED },
      });

      res.json({
        success: true,
        data: progress,
        message: "Formation terminée avec succès",
      });
    } catch (error) {
      console.error("Erreur completeFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer les activités récentes de l'apprenant
  getRecentActivities: async (req, res) => {
    try {
      const userId = req.user.id;
      const { filter = "1week" } = req.query;

      // Calculer la date de début selon le filtre
      let startDate;
      const now = new Date();

      switch (filter) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "1week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "1month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "3months":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const activities = [];

      // 1. Formations assignées récemment
      const recentAssignments = await prisma.formationAssignment.findMany({
        where: {
          userId,
          assignedAt: {
            gte: startDate,
          },
        },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          assignedByUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
        take: 10,
      });

      // Transformer les assignations en activités
      recentAssignments.forEach((assignment) => {
        activities.push({
          id: `assignment_${assignment.id}`,
          type: "formation_assigned",
          title: assignment.formation.title,
          description: `Nouvelle formation assignée`,
          timestamp: assignment.assignedAt.toISOString(),
          formationId: assignment.formation.id,
          assignedBy: assignment.assignedByUser
            ? {
                firstName: assignment.assignedByUser.firstName,
                lastName: assignment.assignedByUser.lastName,
              }
            : null,
          dueDate: assignment.dueDate,
        });
      });

      // 2. Progression récente (UserProgress)
      const recentProgress = await prisma.userProgress.findMany({
        where: {
          userId,
          lastAccessedAt: {
            gte: startDate,
          },
        },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          lastAccessedAt: "desc",
        },
        take: 10,
      });

      // Transformer les progressions en activités
      recentProgress.forEach((progress) => {
        let activityType = "formation_started";
        let description = "Formation démarrée";

        if (progress.progress === 100) {
          activityType = "formation_completed";
          description = "Formation terminée avec succès";
        } else if (progress.progress > 0) {
          activityType = "formation_started";
          description = `Progression: ${progress.progress}%`;
        }

        activities.push({
          id: `progress_${progress.id}`,
          type: activityType,
          title: progress.formation.title,
          description,
          timestamp: progress.lastAccessedAt.toISOString(),
          formationId: progress.formation.id,
          progressPercentage: progress.progress,
        });
      });

      // 3. Événements planifiés récemment
      const recentEvents = await prisma.calendarEvent.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      // Transformer les événements en activités
      recentEvents.forEach((event) => {
        activities.push({
          id: `event_${event.id}`,
          type: "formation_scheduled",
          title: event.title,
          description: `Événement planifié pour le ${event.startDate.toLocaleDateString(
            "fr-FR",
          )}`,
          timestamp: event.createdAt.toISOString(),
          formationId: event.formationId,
          scheduledDate: event.startDate,
        });
      });

      // 4. Notifications récentes (si elles existent)
      const recentNotifications = await prisma.notification.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      // Transformer les notifications en activités
      recentNotifications.forEach((notification) => {
        activities.push({
          id: `notification_${notification.id}`,
          type: "notification",
          title: notification.title,
          description: notification.message,
          timestamp: notification.createdAt.toISOString(),
          isRead: notification.isRead,
        });
      });

      // Trier toutes les activités par timestamp (plus récent en premier)
      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Limiter à 20 activités maximum
      const limitedActivities = activities.slice(0, 20);

      res.json({
        success: true,
        data: limitedActivities,
        filter,
        total: limitedActivities.length,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des activités récentes:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors du chargement des activités récentes",
      });
    }
  },
};

// Contrôleur de progression
export const progressController = {
  // Obtenir les statistiques de progression
  getStats: async (req, res) => {
    try {
      const userId = req.user.id || req.user.userId; // Support des deux formats

      // Récupérer les assignations de l'utilisateur
      const assignments = await prisma.formationAssignment.findMany({
        where: { userId },
        include: {
          formation: true,
        },
      });

      // Récupérer les progressions de l'utilisateur
      const userProgress = await prisma.userProgress.findMany({
        where: { userId },
        include: {
          formation: true,
        },
      });

      // Calculer les statistiques
      const totalFormations = assignments.length;

      // Calculer les formations complétées (toutes les leçons terminées)
      const completedFormations = assignments.filter((assignment) => {
        const formationLessons = userProgress.filter(
          (progress) => progress.formationId === assignment.formationId,
        );
        const completedLessons = formationLessons.filter(
          (progress) => progress.isCompleted,
        );
        return (
          formationLessons.length > 0 &&
          completedLessons.length === formationLessons.length
        );
      }).length;

      // Calculer les formations en cours (au moins une leçon commencée mais pas toutes terminées)
      const inProgressFormations = assignments.filter((assignment) => {
        const formationLessons = userProgress.filter(
          (progress) => progress.formationId === assignment.formationId,
        );
        const completedLessons = formationLessons.filter(
          (progress) => progress.isCompleted,
        );
        return (
          formationLessons.length > 0 &&
          completedLessons.length > 0 &&
          completedLessons.length < formationLessons.length
        );
      }).length;

      const upcomingFormations =
        totalFormations - completedFormations - inProgressFormations;

      // Calculer le temps total et progression moyenne
      const totalTimeSpent = userProgress.reduce((total, progress) => {
        return total + (progress.totalTime || 0);
      }, 0);

      const progressValues = userProgress
        .map((p) => p.progress || 0)
        .filter((p) => p > 0);
      const averageProgress =
        progressValues.length > 0
          ? progressValues.reduce((sum, p) => sum + p, 0) /
            progressValues.length
          : 0;

      const stats = {
        totalFormations,
        completedFormations,
        inProgressFormations,
        upcomingFormations,
        totalTimeSpent,
        averageProgress: Math.round(averageProgress),
        certificatesEarned: completedFormations,
        quizzesPassed: 0,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Erreur getStats:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir la progression de l'utilisateur
  getMyProgress: async (req, res) => {
    try {
      const userId = req.user.userId;

      const progress = await prisma.userProgress.findMany({
        where: { userId },
        include: {
          formation: true,
        },
        orderBy: { updatedAt: "desc" },
      });

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      console.error("Erreur getMyProgress:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Méthodes additionnelles pour la progression
  updateProgress: async (req, res) => {
    try {
      const { id } = req.params;
      const { progress } = req.body;
      const userId = req.user.userId;

      const updatedProgress = await prisma.userProgress.update({
        where: { id, userId },
        data: { progress, updatedAt: new Date() },
      });

      res.json({
        success: true,
        data: updatedProgress,
      });
    } catch (error) {
      console.error("Erreur updateProgress:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  saveProgress: async (req, res) => {
    try {
      const { formationId, lessonId, progress, timeSpent, completed } =
        req.body;
      const userId = req.user.userId;

      const progressData = await prisma.userProgress.upsert({
        where: {
          userId_formationId: { userId, formationId },
        },
        update: {
          progress: progress || 0,
          timeSpent: timeSpent || 0,
          status: completed ? "COMPLETED" : "IN_PROGRESS",
          updatedAt: new Date(),
        },
        create: {
          userId,
          formationId,
          lessonId: lessonId || formationId,
          progress: progress || 0,
          timeSpent: timeSpent || 0,
          status: completed ? "COMPLETED" : "IN_PROGRESS",
        },
      });

      res.json({
        success: true,
        data: progressData,
      });
    } catch (error) {
      console.error("Erreur saveProgress:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  getProgress: async (req, res) => {
    return progressController.getMyProgress(req, res);
  },
};

// Contrôleur des quiz
export const quizController = {
  // Obtenir le quiz d'une formation
  getQuiz: async (req, res) => {
    try {
      const { formationId } = req.params;
      const userId = req.user.userId;

      console.log(
        "🔄 [LEARNER API] getQuiz called for formationId:",
        formationId,
        "userId:",
        userId,
      );

      // Vérifier que l'utilisateur a accès à cette formation
      const assignment = await prisma.formationAssignment.findFirst({
        where: {
          formationId,
          userId,
        },
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée ou accès non autorisé",
        });
      }

      // Récupérer le quiz
      const quiz = await prisma.quiz.findUnique({
        where: { formationId },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz non trouvé pour cette formation",
        });
      }

      res.json({
        success: true,
        data: quiz,
      });
    } catch (error) {
      console.error("Erreur getQuiz:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Soumettre un quiz
  submitQuiz: async (req, res) => {
    try {
      const { formationId } = req.params;
      const { answers } = req.body;
      const userId = req.user.userId;

      // Vérifier que l'utilisateur a accès à cette formation
      const assignment = await prisma.formationAssignment.findFirst({
        where: {
          formationId,
          userId,
        },
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée ou accès non autorisé",
        });
      }

      // Récupérer le quiz avec les bonnes réponses
      const quiz = await prisma.quiz.findUnique({
        where: { formationId },
        include: {
          questions: {
            include: {
              options: true,
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

      // Calculer le score
      let correctAnswers = 0;
      const totalQuestions = quiz.questions.length;

      quiz.questions.forEach((question) => {
        const userAnswer = answers[question.id];
        const correctOption = question.options.find(
          (option) => option.isCorrect,
        );

        if (userAnswer === correctOption?.id) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const passed = score >= 80; // Seuil de 80%

      // Sauvegarder le résultat
      const quizResult = await prisma.quizResult.create({
        data: {
          userId,
          formationId,
          score,
          passed,
          answers: answers,
          completedAt: new Date(),
        },
      });

      // Mettre à jour la progression si le quiz est réussi
      if (passed) {
        await prisma.userProgress.update({
          where: {
            userId_formationId: {
              userId,
              formationId,
            },
          },
          data: {
            status: FormationStatus.COMPLETED,
            completedAt: new Date(),
            progress: 100,
            updatedAt: new Date(),
          },
        });

        await prisma.formationAssignment.update({
          where: { id: assignment.id },
          data: { status: AssignmentStatus.COMPLETED },
        });
      }

      res.json({
        success: true,
        data: {
          score,
          passed,
          correctAnswers,
          totalQuestions,
          result: quizResult,
        },
      });
    } catch (error) {
      console.error("Erreur submitQuiz:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Méthodes additionnelles pour la progression
  updateProgress: async (req, res) => {
    try {
      const { id } = req.params;
      const { progress } = req.body;
      const userId = req.user.userId;

      const updatedProgress = await prisma.userProgress.update({
        where: { id, userId },
        data: { progress, updatedAt: new Date() },
      });

      res.json({
        success: true,
        data: updatedProgress,
      });
    } catch (error) {
      console.error("Erreur updateProgress:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  saveProgress: async (req, res) => {
    try {
      const { formationId, lessonId, progress, timeSpent, completed } =
        req.body;
      const userId = req.user.userId;

      const progressData = await prisma.userProgress.upsert({
        where: {
          userId_formationId: { userId, formationId },
        },
        update: {
          progress: progress || 0,
          timeSpent: timeSpent || 0,
          status: completed ? "COMPLETED" : "IN_PROGRESS",
          updatedAt: new Date(),
        },
        create: {
          userId,
          formationId,
          lessonId: lessonId || formationId,
          progress: progress || 0,
          timeSpent: timeSpent || 0,
          status: completed ? "COMPLETED" : "IN_PROGRESS",
        },
      });

      res.json({
        success: true,
        data: progressData,
      });
    } catch (error) {
      console.error("Erreur saveProgress:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  getProgress: async (req, res) => {
    return progressController.getMyProgress(req, res);
  },
};

// Contrôleur des univers pour apprenants
export const universesController = {
  // Obtenir tous les univers (pour les apprenants)
  getAll: async (req, res) => {
    try {
      const universes = await prisma.universe.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });

      res.json({
        success: true,
        data: universes,
      });
    } catch (error) {
      console.error("Erreur getAll universes:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir un univers par ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const universe = await prisma.universe.findUnique({
        where: { id },
        include: {
          formations: {
            where: { isActive: true },
            include: {
              formation: {
                include: {
                  content: true,
                },
              },
            },
          },
        },
      });

      if (!universe) {
        return res.status(404).json({
          success: false,
          message: "Univers non trouvé",
        });
      }

      res.json({
        success: true,
        data: universe,
      });
    } catch (error) {
      console.error("Erreur getById universe:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

// Contrôleur des notifications
export const notificationsController = {
  // Obtenir les notifications de l'utilisateur
  getMyNotifications: async (req, res) => {
    try {
      const userId = req.user.userId;

      res.json({
        success: true,
        data: [], // Données vides pour l'instant
      });
    } catch (error) {
      console.error("Erreur getMyNotifications:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir le nombre de notifications non lues
  getUnreadCount: async (req, res) => {
    try {
      res.json({
        success: true,
        data: { count: 0 },
      });
    } catch (error) {
      console.error("Erreur getUnreadCount:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Marquer comme lu
  markAsRead: async (req, res) => {
    try {
      res.json({
        success: true,
        data: { id: req.params.id, isRead: true },
      });
    } catch (error) {
      console.error("Erreur markAsRead:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer notification
  deleteNotification: async (req, res) => {
    try {
      res.json({
        success: true,
        message: "Notification supprimée",
      });
    } catch (error) {
      console.error("Erreur deleteNotification:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer les activités récentes de l'apprenant
  getRecentActivities: async (req, res) => {
    try {
      const userId = req.user.id;
      const { filter = "1week" } = req.query;

      // Calculer la date de début selon le filtre
      let startDate;
      const now = new Date();

      switch (filter) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "1week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "1month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "3months":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const activities = [];

      // 1. Formations assignées récemment
      const recentAssignments = await prisma.formationAssignment.findMany({
        where: {
          userId,
          assignedAt: {
            gte: startDate,
          },
        },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          assignedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      // Transformer les assignations en activités
      recentAssignments.forEach((assignment) => {
        activities.push({
          id: `assignment_${assignment.id}`,
          type: "formation_assigned",
          title: assignment.formation.title,
          description: `Nouvelle formation assignée`,
          timestamp: assignment.assignedAt.toISOString(),
          formationId: assignment.formation.id,
          assignedBy: assignment.assignedByUser
            ? {
                firstName: assignment.assignedByUser.firstName,
                lastName: assignment.assignedByUser.lastName,
              }
            : null,
          dueDate: assignment.dueDate,
        });
      });

      // 2. Progression récente (UserProgress)
      const recentProgress = await prisma.userProgress.findMany({
        where: {
          userId,
          updatedAt: {
            gte: startDate,
          },
        },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
      });

      // Transformer les progressions en activités
      recentProgress.forEach((progress) => {
        let activityType = "formation_started";
        let description = "Formation démarrée";

        if (progress.progressPercentage === 100) {
          activityType = "formation_completed";
          description = "Formation terminée avec succès";
        } else if (progress.progressPercentage > 0) {
          activityType = "formation_started";
          description = `Progression: ${progress.progressPercentage}%`;
        }

        activities.push({
          id: `progress_${progress.id}`,
          type: activityType,
          title: progress.formation.title,
          description,
          timestamp: progress.updatedAt.toISOString(),
          formationId: progress.formation.id,
          progressPercentage: progress.progressPercentage,
        });
      });

      // 3. Événements planifiés récemment
      const recentEvents = await prisma.calendarEvent.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      // Transformer les événements en activités
      recentEvents.forEach((event) => {
        activities.push({
          id: `event_${event.id}`,
          type: "formation_scheduled",
          title: event.title,
          description: `Événement planifié pour le ${event.startDate.toLocaleDateString(
            "fr-FR",
          )}`,
          timestamp: event.createdAt.toISOString(),
          formationId: event.formationId,
          scheduledDate: event.startDate,
        });
      });

      // 4. Notifications récentes (si elles existent)
      const recentNotifications = await prisma.notification.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      // Transformer les notifications en activités
      recentNotifications.forEach((notification) => {
        activities.push({
          id: `notification_${notification.id}`,
          type: "notification",
          title: notification.title,
          description: notification.message,
          timestamp: notification.createdAt.toISOString(),
          isRead: notification.isRead,
        });
      });

      // Trier toutes les activités par timestamp (plus récent en premier)
      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Limiter à 20 activités maximum
      const limitedActivities = activities.slice(0, 20);

      res.json({
        success: true,
        data: limitedActivities,
        filter,
        total: limitedActivities.length,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des activités récentes:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors du chargement des activités récentes",
      });
    }
  },
};
