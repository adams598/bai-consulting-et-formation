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
          message: "Email et mot de passe requis"
        });
      }

      // Rechercher l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email },
        include: { bank: true }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Identifiants invalides"
        });
      }

      // Vérifier que c'est un collaborateur
      if (user.role !== UserRole.COLLABORATOR) {
        return res.status(403).json({
          success: false,
          message: "Accès réservé aux collaborateurs"
        });
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Identifiants invalides"
        });
      }

      // Vérifier que l'utilisateur est actif
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Compte désactivé"
        });
      }

      // Générer le token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          bankId: user.bankId
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      // Mettre à jour la dernière connexion
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
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
            lastLogin: user.lastLogin
          },
          accessToken: token
        }
      });
    } catch (error) {
      console.error("Erreur de connexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  },

  // Déconnexion
  logout: async (req, res) => {
    try {
      // En production, on pourrait invalider le token
      res.json({
        success: true,
        message: "Déconnexion réussie"
      });
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  },

  // Obtenir l'utilisateur actuel
  getCurrentUser: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { bank: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé"
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
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      console.error("Erreur getCurrentUser:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
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
          message: "Refresh token requis"
        });
      }

      // Vérifier le refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refresh-secret");
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Token invalide"
        });
      }

      // Générer un nouveau token
      const newToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          bankId: user.bankId
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        data: {
          accessToken: newToken
        }
      });
    } catch (error) {
      console.error("Erreur refreshToken:", error);
      res.status(401).json({
        success: false,
        message: "Token invalide"
      });
    }
  },

  // Changer le mot de passe
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Ancien et nouveau mot de passe requis"
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé"
        });
      }

      // Vérifier l'ancien mot de passe
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Ancien mot de passe incorrect"
        });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: "Mot de passe modifié avec succès"
      });
    } catch (error) {
      console.error("Erreur changePassword:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  }
};

// Contrôleur des formations pour apprenants
export const formationsController = {
  // Obtenir les formations de l'apprenant
  getMyFormations: async (req, res) => {
    try {
      const userId = req.user.userId;

      // Récupérer les formations assignées à l'utilisateur
      const assignments = await prisma.formationAssignment.findMany({
        where: { userId },
        include: {
          formation: true,
          progress: {
            where: { userId }
          }
        }
      });

      const formations = assignments.map(assignment => ({
        id: assignment.formation.id,
        title: assignment.formation.title,
        description: assignment.formation.description,
        type: assignment.formation.type,
        duration: assignment.formation.duration,
        isMandatory: assignment.isMandatory,
        dueDate: assignment.dueDate,
        status: assignment.status,
        progress: assignment.progress[0] || null,
        assignedAt: assignment.createdAt
      }));

      res.json({
        success: true,
        data: formations
      });
    } catch (error) {
      console.error("Erreur getMyFormations:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  },

  // Obtenir une formation spécifique
  getFormationById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Vérifier que l'utilisateur a accès à cette formation
      const assignment = await prisma.formationAssignment.findFirst({
        where: {
          formationId: id,
          userId
        },
        include: {
          formation: true,
          progress: {
            where: { userId }
          }
        }
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée ou accès non autorisé"
        });
      }

      res.json({
        success: true,
        data: {
          ...assignment.formation,
          assignment: {
            isMandatory: assignment.isMandatory,
            dueDate: assignment.dueDate,
            status: assignment.status
          },
          progress: assignment.progress[0] || null
        }
      });
    } catch (error) {
      console.error("Erreur getFormationById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
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
          userId
        }
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée ou accès non autorisé"
        });
      }

      // Créer ou mettre à jour la progression
      const progress = await prisma.userProgress.upsert({
        where: {
          userId_formationId: {
            userId,
            formationId: id
          }
        },
        update: {
          status: FormationStatus.IN_PROGRESS,
          startedAt: new Date(),
          updatedAt: new Date()
        },
        create: {
          userId,
          formationId: id,
          status: FormationStatus.IN_PROGRESS,
          startedAt: new Date(),
          progress: 0
        }
      });

      // Mettre à jour le statut de l'assignation
      await prisma.formationAssignment.update({
        where: { id: assignment.id },
        data: { status: AssignmentStatus.IN_PROGRESS }
      });

      res.json({
        success: true,
        data: progress,
        message: "Formation démarrée avec succès"
      });
    } catch (error) {
      console.error("Erreur startFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
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
          userId
        }
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée ou accès non autorisé"
        });
      }

      // Mettre à jour la progression
      const progress = await prisma.userProgress.update({
        where: {
          userId_formationId: {
            userId,
            formationId: id
          }
        },
        data: {
          status: FormationStatus.COMPLETED,
          completedAt: new Date(),
          progress: 100,
          updatedAt: new Date()
        }
      });

      // Mettre à jour le statut de l'assignation
      await prisma.formationAssignment.update({
        where: { id: assignment.id },
        data: { status: AssignmentStatus.COMPLETED }
      });

      res.json({
        success: true,
        data: progress,
        message: "Formation terminée avec succès"
      });
    } catch (error) {
      console.error("Erreur completeFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  }
};

// Contrôleur de progression
export const progressController = {
  // Obtenir la progression de l'utilisateur
  getMyProgress: async (req, res) => {
    try {
      const userId = req.user.userId;

      const progress = await prisma.userProgress.findMany({
        where: { userId },
        include: {
          formation: true
        }
      });

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error("Erreur getMyProgress:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  },

  // Obtenir la progression d'une formation spécifique
  getFormationProgress: async (req, res) => {
    try {
      const { formationId } = req.params;
      const userId = req.user.userId;

      const progress = await prisma.userProgress.findUnique({
        where: {
          userId_formationId: {
            userId,
            formationId
          }
        },
        include: {
          formation: true
        }
      });

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: "Progression non trouvée"
        });
      }

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error("Erreur getFormationProgress:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  },

  // Mettre à jour la progression
  updateProgress: async (req, res) => {
    try {
      const { formationId } = req.params;
      const { progress: progressValue } = req.body;
      const userId = req.user.userId;

      const updatedProgress = await prisma.userProgress.update({
        where: {
          userId_formationId: {
            userId,
            formationId
          }
        },
        data: {
          progress: progressValue,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: updatedProgress
      });
    } catch (error) {
      console.error("Erreur updateProgress:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  }
};

// Contrôleur des quiz
export const quizController = {
  // Obtenir le quiz d'une formation
  getQuiz: async (req, res) => {
    try {
      const { formationId } = req.params;
      const userId = req.user.userId;

      // Vérifier que l'utilisateur a accès à cette formation
      const assignment = await prisma.formationAssignment.findFirst({
        where: {
          formationId,
          userId
        }
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée ou accès non autorisé"
        });
      }

      // Récupérer le quiz
      const quiz = await prisma.quiz.findUnique({
        where: { formationId },
        include: {
          questions: {
            include: {
              options: true
            }
          }
        }
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz non trouvé pour cette formation"
        });
      }

      res.json({
        success: true,
        data: quiz
      });
    } catch (error) {
      console.error("Erreur getQuiz:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
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
          userId
        }
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée ou accès non autorisé"
        });
      }

      // Récupérer le quiz avec les bonnes réponses
      const quiz = await prisma.quiz.findUnique({
        where: { formationId },
        include: {
          questions: {
            include: {
              options: true
            }
          }
        }
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz non trouvé"
        });
      }

      // Calculer le score
      let correctAnswers = 0;
      const totalQuestions = quiz.questions.length;

      quiz.questions.forEach(question => {
        const userAnswer = answers[question.id];
        const correctOption = question.options.find(option => option.isCorrect);
        
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
          completedAt: new Date()
        }
      });

      // Mettre à jour la progression si le quiz est réussi
      if (passed) {
        await prisma.userProgress.update({
          where: {
            userId_formationId: {
              userId,
              formationId
            }
          },
          data: {
            status: FormationStatus.COMPLETED,
            completedAt: new Date(),
            progress: 100,
            updatedAt: new Date()
          }
        });

        await prisma.formationAssignment.update({
          where: { id: assignment.id },
          data: { status: AssignmentStatus.COMPLETED }
        });
      }

      res.json({
        success: true,
        data: {
          score,
          passed,
          correctAnswers,
          totalQuestions,
          result: quizResult
        }
      });
    } catch (error) {
      console.error("Erreur submitQuiz:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  }
};

// Contrôleur des notifications
export const notificationsController = {
  // Obtenir les notifications de l'utilisateur
  getMyNotifications: async (req, res) => {
    try {
      const userId = req.user.userId;

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error("Erreur getMyNotifications:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  },

  // Marquer une notification comme lue
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await prisma.notification.update({
        where: {
          id,
          userId // S'assurer que l'utilisateur ne peut marquer que ses propres notifications
        },
        data: {
          readAt: new Date()
        }
      });

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error("Erreur markAsRead:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  }
}; 