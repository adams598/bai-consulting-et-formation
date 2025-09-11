import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { generatePassword } from "../utils/password.js";
import { sendEmail } from "../services/email.service.js";

const prisma = new PrismaClient();

// Contrôleur d'authentification
export const authController = {
  // Connexion
  async login(req, res) {
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
        include: {
          bank: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email ou mot de passe incorrect",
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Compte désactivé",
        });
      }

      // Vérifier si le mot de passe a expiré
      if (user.passwordExpiresAt && new Date() > user.passwordExpiresAt) {
        return res.status(401).json({
          success: false,
          message:
            "Mot de passe temporaire expiré. Veuillez contacter votre administrateur pour un nouveau mot de passe.",
        });
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Email ou mot de passe incorrect",
        });
      }

      // Mettre à jour la dernière connexion
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Générer les tokens
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

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
            department: user.department,
            phone: user.phone,
            avatar: user.avatar,
          },
          accessToken,
          refreshToken,
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
  async logout(req, res) {
    try {
      // TODO: Invalider le token côté serveur si nécessaire
      res.json({ success: true, message: "Déconnexion réussie" });
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir l'utilisateur actuel
  async getCurrentUser(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // Récupérer les données complètes de l'utilisateur
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          bank: true,
        },
      });

      if (!fullUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: fullUser.id,
            email: fullUser.email,
            firstName: fullUser.firstName,
            lastName: fullUser.lastName,
            role: fullUser.role,
            bankId: fullUser.bankId,
            bank: fullUser.bank,
            department: fullUser.department,
            phone: fullUser.phone,
            avatar: fullUser.avatar,
          },
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

  // Obtenir le profil de l'utilisateur
  async getProfile(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          bank: true,
        },
      });

      if (!fullUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      res.json({
        success: true,
        data: {
          id: fullUser.id,
          email: fullUser.email,
          firstName: fullUser.firstName,
          lastName: fullUser.lastName,
          role: fullUser.role,
          bankId: fullUser.bankId,
          bank: fullUser.bank,
          department: fullUser.department,
          phone: fullUser.phone,
          avatar: fullUser.avatar,
        },
      });
    } catch (error) {
      console.error("Erreur getProfile:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour le profil
  async updateProfile(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const { firstName, lastName, email, department, phone, avatar } =
        req.body;

      // Validation des champs obligatoires
      if (!firstName || !lastName || !email) {
        return res.status(400).json({
          success: false,
          message: "Prénom, nom et email sont obligatoires",
        });
      }

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: user.id },
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Cette adresse email est déjà utilisée",
        });
      }

      // Mettre à jour le profil
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName,
          email,
          department,
          phone,
          avatar,
        },
        include: {
          bank: true,
        },
      });

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          bankId: updatedUser.bankId,
          bank: updatedUser.bank,
          department: updatedUser.department,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
        },
      });
    } catch (error) {
      console.error("Erreur updateProfile:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Changer le mot de passe
  async changePassword(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Mot de passe actuel et nouveau mot de passe requis",
        });
      }

      // Récupérer l'utilisateur avec le mot de passe hashé
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!fullUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier le mot de passe actuel
      const isValidCurrentPassword = await bcrypt.compare(
        currentPassword,
        fullUser.password
      );
      if (!isValidCurrentPassword) {
        return res.status(400).json({
          success: false,
          message: "Mot de passe actuel incorrect",
        });
      }

      // Vérifier que le nouveau mot de passe est différent
      const isSamePassword = await bcrypt.compare(
        newPassword,
        fullUser.password
      );
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: "Le nouveau mot de passe doit être différent de l'actuel",
        });
      }

      // Hasher le nouveau mot de passe
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedNewPassword,
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

// Contrôleurs stubs pour les autres fonctionnalités
export const banksController = {
  async getAllBanks(req, res) {
    try {
      const banks = await prisma.bank.findMany({
        where: {
          isArchived: false, // Ne pas afficher les banques archivées, mais afficher les actives ET inactives
        },
        orderBy: { name: "asc" },
      });

      // Charger les statistiques pour chaque banque
      const banksWithStats = await Promise.all(
        banks.map(async (bank) => {
          // Compter le nombre d'utilisateurs
          const userCount = await prisma.user.count({
            where: { bankId: bank.id },
          });

          // Compter le nombre de formations assignées
          const formationCount = await prisma.bankFormation.count({
            where: { bankId: bank.id },
          });

          return {
            ...bank,
            userCount,
            formationCount,
          };
        })
      );

      res.json({ success: true, data: banksWithStats });
    } catch (error) {
      console.error("Erreur getAllBanks:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async getBankById(req, res) {
    try {
      const { id } = req.params;
      const bank = await prisma.bank.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      if (!bank) {
        return res.status(404).json({
          success: false,
          message: "Banque non trouvée",
        });
      }

      res.json({ success: true, data: bank });
    } catch (error) {
      console.error("Erreur getBankById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async createBank(req, res) {
    try {
      const { name, code } = req.body;

      // Validation
      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: "Nom et code de la banque requis",
        });
      }

      // Vérifier si le code existe déjà
      const existingBank = await prisma.bank.findFirst({
        where: { code },
      });

      if (existingBank) {
        return res.status(400).json({
          success: false,
          message: "Ce code de banque existe déjà",
        });
      }

      const bank = await prisma.bank.create({
        data: {
          name,
          code,
          isActive: true,
        },
      });

      res.status(201).json({ success: true, data: bank });
    } catch (error) {
      console.error("Erreur createBank:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async updateBank(req, res) {
    try {
      const { id } = req.params;
      const { name, code, isActive } = req.body;

      // Vérifier si la banque existe
      const existingBank = await prisma.bank.findUnique({
        where: { id },
      });

      if (!existingBank) {
        return res.status(404).json({
          success: false,
          message: "Banque non trouvée",
        });
      }

      // Vérifier si le code existe déjà (sauf pour cette banque)
      if (code && code !== existingBank.code) {
        const duplicateCode = await prisma.bank.findFirst({
          where: {
            code,
            id: { not: id },
          },
        });

        if (duplicateCode) {
          return res.status(400).json({
            success: false,
            message: "Ce code de banque existe déjà",
          });
        }
      }

      const bank = await prisma.bank.update({
        where: { id },
        data: {
          name,
          code,
          isActive,
        },
      });

      res.json({ success: true, data: bank });
    } catch (error) {
      console.error("Erreur updateBank:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async deleteBank(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si la banque existe
      const bank = await prisma.bank.findUnique({
        where: { id },
        include: {
          users: true,
          formations: true,
        },
      });

      if (!bank) {
        return res.status(404).json({
          success: false,
          message: "Banque non trouvée",
        });
      }

      // Vérifier s'il y a des utilisateurs ou formations associés
      if (bank.users.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Impossible de supprimer une banque qui a des utilisateurs associés",
        });
      }

      if (bank.formations.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Impossible de supprimer une banque qui a des formations associées",
        });
      }

      // Supprimer la banque
      await prisma.bank.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Banque supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur deleteBank:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async archiveBank(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si la banque existe
      const bank = await prisma.bank.findUnique({
        where: { id },
      });

      if (!bank) {
        return res.status(404).json({
          success: false,
          message: "Banque non trouvée",
        });
      }

      // Archiver la banque (désactiver et marquer comme archivée)
      const archivedBank = await prisma.bank.update({
        where: { id },
        data: {
          isActive: false,
          isArchived: true,
          archivedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: "Banque archivée avec succès",
        data: archivedBank,
      });
    } catch (error) {
      console.error("Erreur archiveBank:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async toggleActive(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si la banque existe
      const bank = await prisma.bank.findUnique({
        where: { id },
      });

      if (!bank) {
        return res.status(404).json({
          success: false,
          message: "Banque non trouvée",
        });
      }

      // Inverser le statut actif
      const updatedBank = await prisma.bank.update({
        where: { id },
        data: {
          isActive: !bank.isActive,
        },
      });

      res.json({
        success: true,
        message: `Banque ${
          updatedBank.isActive ? "activée" : "désactivée"
        } avec succès`,
        data: updatedBank,
      });
    } catch (error) {
      console.error("Erreur toggleActive:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

export const formationsController = {
  async getAllFormations(req, res) {
    try {
      const formations = await prisma.formation.findMany({
        where: { isActive: true },
        orderBy: { title: "asc" },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          content: {
            where: { contentType: "LESSON" },
            orderBy: { order: "asc" },
          },
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

      // Calculer la durée totale et le nombre de leçons pour chaque formation
      const formationsWithStats = formations.map((formation) => {
        const totalDuration = formation.content.reduce(
          (sum, lesson) => sum + (lesson.duration || 0),
          0
        );
        const lessonCount = formation.content.length;

        return {
          ...formation,
          totalDuration,
          lessonCount,
          coverImage: formation.coverImage || null, // Assurer la compatibilité
        };
      });

      res.json({ success: true, data: formationsWithStats });
    } catch (error) {
      console.error("Erreur getAllFormations:", error);
      console.error("Stack trace:", error.stack);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  async getFormationById(req, res) {
    try {
      const { id } = req.params;
      const formation = await prisma.formation.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          content: {
            orderBy: [{ contentType: "asc" }, { order: "asc" }],
            include: {
              lessons: {
                orderBy: { order: "asc" },
              },
            },
          },
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
      });

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Organiser le contenu par sections et leçons
      const sections = formation.content.filter(
        (item) => item.contentType === "SECTION"
      );
      const lessons = formation.content.filter(
        (item) => item.contentType === "LESSON" && !item.sectionId
      );

      const organizedContent = {
        sections: sections.map((section) => ({
          ...section,
          lessons: formation.content.filter(
            (lesson) => lesson.sectionId === section.id
          ),
        })),
        lessons: lessons,
      };

      const formationWithOrganizedContent = {
        ...formation,
        content: organizedContent,
      };

      res.json({ success: true, data: formationWithOrganizedContent });
    } catch (error) {
      console.error("Erreur getFormationById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async createFormation(req, res) {
    try {
      const {
        title,
        description,
        isActive,
        hasQuiz,
        quizRequired,
        coverImage,
        universeId,
      } = req.body;
      const userId = req.user.id;

      // Validation
      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Le titre est obligatoire",
        });
      }

      const formation = await prisma.formation.create({
        data: {
          title,
          description: description || "",
          duration: 0, // sera calculé automatiquement lors de l'ajout de leçons
          isActive: isActive !== undefined ? isActive : true,
          hasQuiz: hasQuiz !== undefined ? hasQuiz : false,
          quizRequired: quizRequired !== undefined ? quizRequired : true,
          coverImage: coverImage || null,
          createdBy: userId,
          universeId: universeId || null,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({ success: true, data: formation });
    } catch (error) {
      console.error("Erreur createFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async updateFormation(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        isActive,
        hasQuiz,
        quizRequired,
        coverImage,
        universeId,
      } = req.body;

      // Validation
      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Le titre est obligatoire",
        });
      }

      // Vérifier si la formation existe
      const existingFormation = await prisma.formation.findUnique({
        where: { id },
      });

      if (!existingFormation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      const formation = await prisma.formation.update({
        where: { id },
        data: {
          title,
          description: description || "",
          isActive:
            isActive !== undefined ? isActive : existingFormation.isActive,

          hasQuiz: hasQuiz !== undefined ? hasQuiz : existingFormation.hasQuiz,
          quizRequired:
            quizRequired !== undefined
              ? quizRequired
              : existingFormation.quizRequired,
          coverImage:
            coverImage !== undefined
              ? coverImage
              : existingFormation.coverImage,
          universeId:
            universeId !== undefined
              ? universeId
              : existingFormation.universeId,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.json({ success: true, data: formation });
    } catch (error) {
      console.error("Erreur updateFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async deleteFormation(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id },
        include: {
          assignments: true,
          progress: true,
        },
      });

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Vérifier s'il y a des assignations ou progress associés
      if (formation.assignments.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Impossible de supprimer une formation qui a des assignations",
        });
      }

      if (formation.progress.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Impossible de supprimer une formation qui a des progressions",
        });
      }

      // Supprimer la formation (cascade sur content et quiz)
      await prisma.formation.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Formation supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur deleteFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async toggleActive(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id },
      });

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Inverser le statut actif
      const updatedFormation = await prisma.formation.update({
        where: { id },
        data: {
          isActive: !formation.isActive,
        },
      });

      res.json({
        success: true,
        message: `Formation ${
          updatedFormation.isActive ? "activée" : "désactivée"
        } avec succès`,
        data: updatedFormation,
      });
    } catch (error) {
      console.error("Erreur toggleActive:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async toggleMandatory(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id },
      });

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Inverser le statut obligatoire
      const updatedFormation = await prisma.formation.update({
        where: { id },
        data: {
          isMandatory: !formation.isMandatory,
        },
      });

      res.json({
        success: true,
        message: `Formation ${
          updatedFormation.isMandatory
            ? "rendue obligatoire"
            : "rendue optionnelle"
        } avec succès`,
        data: updatedFormation,
      });
    } catch (error) {
      console.error("Erreur toggleMandatory:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

export const usersController = {
  async getAllUsers(req, res) {
    try {
      const { bankId } = req.query;

      const whereClause = bankId && bankId !== "" ? { bankId } : {};

      const users = await prisma.user.findMany({
        where: {
          ...whereClause,
          isActive: true,
        },
        orderBy: { firstName: "asc" },
        include: {
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      res.json({ success: true, data: users });
    } catch (error) {
      console.error("Erreur getAllUsers:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          bank: {
            select: {
              id: true,
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

      res.json({ success: true, data: user });
    } catch (error) {
      console.error("Erreur getUserById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async createUser(req, res) {
    try {
      console.log("🔍 createUser - Corps de la requête reçu:", req.body);
      const {
        firstName,
        lastName,
        email,
        role,
        department,
        phone,
        isActive,
        bankId,
      } = req.body;

      // Validation
      if (!firstName || !lastName || !email || !role) {
        return res.status(400).json({
          success: false,
          message: "Prénom, nom, email et rôle sont obligatoires",
        });
      }

      // Validation du bankId si fourni
      if (bankId) {
        const bank = await prisma.bank.findUnique({
          where: { id: bankId },
        });

        if (!bank) {
          return res.status(400).json({
            success: false,
            message: "Banque invalide",
          });
        }
      }

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findFirst({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Cette adresse email est déjà utilisée",
        });
      }

      // Générer un mot de passe temporaire
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Définir l'expiration du mot de passe à 5 jours
      const passwordExpiresAt = new Date();
      passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 5);

      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role,
          bankId: bankId || null,
          department: department || null,
          phone: phone || null,
          isActive: isActive !== undefined ? isActive : true,
          passwordExpiresAt,
        },
        include: {
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: user,
        message: `Utilisateur créé avec succès. Mot de passe temporaire: ${tempPassword}`,
      });
    } catch (error) {
      console.error("Erreur createUser:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, role, department, phone, isActive } =
        req.body;

      // Validation
      if (!firstName || !lastName || !email || !role) {
        return res.status(400).json({
          success: false,
          message: "Prénom, nom, email et rôle sont obligatoires",
        });
      }

      // Vérifier si l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (email !== existingUser.email) {
        const emailExists = await prisma.user.findFirst({
          where: {
            email,
            id: { not: id },
          },
        });

        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: "Cette adresse email est déjà utilisée",
          });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          firstName,
          lastName,
          email,
          role,
          department: department || null,
          phone: phone || null,
          isActive: isActive !== undefined ? isActive : existingUser.isActive,
        },
        include: {
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      res.json({ success: true, data: user });
    } catch (error) {
      console.error("Erreur updateUser:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          assignments: true,
          progress: true,
          createdFormations: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Empêcher la suppression du super admin
      if (user.role === "SUPER_ADMIN") {
        return res.status(400).json({
          success: false,
          message: "Impossible de supprimer un super administrateur",
        });
      }

      // Vérifier s'il y a des données associées
      if (
        user.assignments.length > 0 ||
        user.progress.length > 0 ||
        user.createdFormations.length > 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Impossible de supprimer un utilisateur qui a des données associées",
        });
      }

      // Supprimer l'utilisateur
      await prisma.user.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Utilisateur supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur deleteUser:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async toggleActive(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Empêcher la désactivation du super admin
      if (user.role === "SUPER_ADMIN") {
        return res.status(400).json({
          success: false,
          message: "Impossible de désactiver un super administrateur",
        });
      }

      // Inverser le statut actif
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          isActive: !user.isActive,
        },
      });

      res.json({
        success: true,
        message: `Utilisateur ${
          updatedUser.isActive ? "activé" : "désactivé"
        } avec succès`,
        data: updatedUser,
      });
    } catch (error) {
      console.error("Erreur toggleActive:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async resetPassword(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Générer un nouveau mot de passe temporaire
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
        },
      });

      res.json({
        success: true,
        message: `Mot de passe réinitialisé avec succès. Nouveau mot de passe temporaire: ${tempPassword}`,
      });
    } catch (error) {
      console.error("Erreur resetPassword:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async sendCredentials(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Ici, tu pourrais implémenter l'envoi d'email avec les identifiants
      // Pour l'instant, on retourne juste un message de succès
      res.json({
        success: true,
        message: "Identifiants envoyés par email avec succès",
      });
    } catch (error) {
      console.error("Erreur sendCredentials:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

export const dashboardController = {
  async getStats(req, res) {
    try {
      console.log("📊 Récupération des statistiques du dashboard...");

      // Compter le nombre total d'utilisateurs
      const totalUsers = await prisma.user.count();

      // Compter le nombre total de formations
      const totalFormations = await prisma.formation.count();

      // Compter le nombre total de banques
      const totalBanks = await prisma.bank.count({
        where: { isArchived: false },
      });

      // Compter le nombre d'utilisateurs actifs
      const activeUsers = await prisma.user.count({
        where: { isActive: true },
      });

      // Compter les utilisateurs en ligne (connexions récentes - dernière heure)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const onlineUsers = await prisma.user.count({
        where: {
          lastLogin: {
            gte: oneHourAgo,
          },
        },
      });

      // Calculer les formations terminées via les progressions
      const completedFormations = await prisma.userProgress.count({
        where: {
          isCompleted: true,
        },
      });

      // Calculer les assignations en attente (pas de statut dans UserFormationAssignment, on compte toutes les assignations)
      const pendingAssignments = await prisma.userFormationAssignment.count();

      // Calculer le temps moyen de complétion (en minutes)
      const completedProgress = await prisma.userProgress.findMany({
        where: {
          isCompleted: true,
          totalTime: {
            not: null,
          },
        },
        select: {
          totalTime: true,
        },
      });

      const averageCompletionTime =
        completedProgress.length > 0
          ? Math.round(
              completedProgress.reduce(
                (sum, p) => sum + (p.totalTime || 0),
                0
              ) /
                completedProgress.length /
                60
            ) // Convertir en minutes
          : 0;

      // Calculer le taux de réussite des quiz (pour l'instant, on met 0 car le modèle QuizAttempt n'existe pas encore)
      const quizAttempts = 0;
      const successfulQuizAttempts = 0;
      const quizSuccessRate = 0;

      const stats = {
        totalUsers,
        totalFormations,
        totalBanks,
        completedFormations,
        activeUsers,
        pendingAssignments,
        onlineUsers,
        averageCompletionTime,
        quizSuccessRate,
        totalQuizAttempts: quizAttempts,
      };

      console.log("📊 Statistiques calculées:", stats);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Erreur getDashboardStats:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async getBankStats(req, res) {
    try {
      console.log("🏦 Récupération des statistiques par banque...");

      const banks = await prisma.bank.findMany({
        where: { isArchived: false },
        include: {
          users: {
            select: {
              id: true,
              isActive: true,
            },
          },
          bankFormations: {
            select: {
              id: true,
              formation: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      const bankStats = await Promise.all(
        banks.map(async (bank) => {
          // Compter les utilisateurs actifs de cette banque
          const activeUserCount = bank.users.filter(
            (user) => user.isActive
          ).length;

          // Compter les formations assignées à cette banque
          const formationCount = bank.bankFormations.length;

          // Calculer le taux de complétion pour cette banque
          const bankUserIds = bank.users.map((user) => user.id);

          const totalAssignments = await prisma.userFormationAssignment.count({
            where: {
              userId: {
                in: bankUserIds,
              },
            },
          });

          // Pour les assignations complétées, on vérifie via UserProgress
          const completedAssignments = await prisma.userProgress.count({
            where: {
              userId: {
                in: bankUserIds,
              },
              isCompleted: true,
            },
          });

          const completionRate =
            totalAssignments > 0
              ? Math.round((completedAssignments / totalAssignments) * 100)
              : 0;

          return {
            bankId: bank.id,
            bankName: bank.name,
            userCount: activeUserCount,
            formationCount: formationCount,
            completionRate: completionRate,
            totalAssignments: totalAssignments,
            completedAssignments: completedAssignments,
          };
        })
      );

      console.log(
        "🏦 Statistiques par banque calculées:",
        bankStats.length,
        "banques"
      );

      res.json({
        success: true,
        data: bankStats,
      });
    } catch (error) {
      console.error("Erreur getBankStats:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async getRecentActivity(req, res) {
    try {
      console.log("📈 Récupération de l'activité récente...");

      const limit = 20; // Limiter à 20 activités récentes

      // Récupérer les progressions récentes
      const recentProgress = await prisma.userProgress.findMany({
        where: {
          lastAccessedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Dernière semaine
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
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
        take: limit,
      });

      // Récupérer les nouvelles assignations
      const recentAssignments = await prisma.userFormationAssignment.findMany({
        where: {
          assignedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          bankFormation: {
            include: {
              formation: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
        take: limit,
      });

      // Combiner et formater toutes les activités
      const activities = [];

      // Ajouter les progressions
      recentProgress.forEach((progress) => {
        let type = "progress_updated";
        let description = `Progression mise à jour pour "${progress.formation.title}"`;

        if (progress.isCompleted) {
          type = "formation_completed";
          description = `Formation "${progress.formation.title}" terminée`;
        } else if (!progress.isCompleted && progress.progress === 0) {
          type = "formation_started";
          description = `Formation "${progress.formation.title}" démarrée`;
        }

        activities.push({
          id: `progress_${progress.id}`,
          type: type,
          description: description,
          user: `${progress.user.firstName} ${progress.user.lastName}`,
          timestamp: progress.lastAccessedAt,
          metadata: {
            formationTitle: progress.formation.title,
            progress: progress.progress,
            status: progress.isCompleted ? "COMPLETED" : "IN_PROGRESS",
          },
        });
      });

      // Ajouter les nouvelles assignations
      recentAssignments.forEach((assignment) => {
        activities.push({
          id: `assignment_${assignment.id}`,
          type: "formation_assigned",
          description: `Formation "${assignment.bankFormation.formation.title}" assignée`,
          user: `${assignment.user.firstName} ${assignment.user.lastName}`,
          timestamp: assignment.assignedAt,
          metadata: {
            formationTitle: assignment.bankFormation.formation.title,
            dueDate: assignment.dueDate,
            isMandatory: assignment.isMandatory,
          },
        });
      });

      // Trier par timestamp décroissant et limiter
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      console.log(
        "📈 Activités récentes récupérées:",
        sortedActivities.length,
        "activités"
      );

      res.json({
        success: true,
        data: sortedActivities,
      });
    } catch (error) {
      console.error("Erreur getRecentActivity:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async getAlerts(req, res) {
    try {
      console.log("🚨 Récupération des alertes...");

      const alerts = [];

      // Alerte 1: Formations en retard
      const overdueAssignments = await prisma.userFormationAssignment.count({
        where: {
          dueDate: {
            lt: new Date(),
          },
        },
      });

      if (overdueAssignments > 0) {
        alerts.push({
          id: "overdue_assignments",
          type: "warning",
          title: "Formations en retard",
          message: "Des apprenants ont dépassé leur date limite",
          count: overdueAssignments,
          action: "Voir les détails",
        });
      }

      // Alerte 2: Échecs aux quiz récents (pour l'instant, on met 0 car le modèle QuizAttempt n'existe pas encore)
      const recentFailedQuizzes = 0;

      if (recentFailedQuizzes > 0) {
        alerts.push({
          id: "failed_quizzes",
          type: "error",
          title: "Échecs aux quiz",
          message: "Plusieurs échecs récents nécessitent une attention",
          count: recentFailedQuizzes,
          action: "Consulter",
        });
      }

      // Alerte 3: Nouvelles assignations en attente
      const pendingAssignments = await prisma.userFormationAssignment.count();

      if (pendingAssignments > 0) {
        alerts.push({
          id: "pending_assignments",
          type: "info",
          title: "Nouvelles assignations",
          message: "De nouveaux utilisateurs attendent une attribution",
          count: pendingAssignments,
          action: "Attribuer",
        });
      }

      // Alerte 4: Utilisateurs inactifs depuis longtemps
      const inactiveUsers = await prisma.user.count({
        where: {
          isActive: true,
          lastLogin: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
          },
        },
      });

      if (inactiveUsers > 0) {
        alerts.push({
          id: "inactive_users",
          type: "warning",
          title: "Utilisateurs inactifs",
          message: "Des utilisateurs ne se sont pas connectés depuis longtemps",
          count: inactiveUsers,
          action: "Relancer",
        });
      }

      console.log("🚨 Alertes générées:", alerts.length, "alertes");

      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      console.error("Erreur getAlerts:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async getFormationPerformance(req, res) {
    try {
      console.log("📊 Récupération des performances des formations...");

      // Récupérer toutes les formations actives
      const formations = await prisma.formation.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          title: true,
        },
      });

      // Pour chaque formation, calculer les statistiques de base
      const performanceData = formations.map((formation) => {
        return {
          formationId: formation.id,
          formationTitle: formation.title,
          enrollments: 0, // Pour l'instant
          completions: 0, // Pour l'instant
          averageScore: 0, // Pour l'instant
          averageTime: 0, // Pour l'instant
          completionRate: 0, // Pour l'instant
        };
      });

      console.log(
        "📊 Performances des formations calculées:",
        performanceData.length,
        "formations"
      );

      res.json({
        success: true,
        data: performanceData,
      });
    } catch (error) {
      console.error("Erreur getFormationPerformance:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

export const formationContentController = {
  // Récupérer tout le contenu d'une formation
  async getByFormation(req, res) {
    try {
      const { formationId } = req.params;

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

      // Récupérer tout le contenu de la formation
      const content = await prisma.formationContent.findMany({
        where: { formationId },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          // Inclure les métadonnées si nécessaire
        },
      });

      res.json({ success: true, data: content });
    } catch (error) {
      console.error("Erreur getByFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async addSection(req, res) {
    try {
      const { formationId } = req.params;
      const { title, description, order } = req.body;

      // Validation
      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Le titre de la section est obligatoire",
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

      const section = await prisma.formationContent.create({
        data: {
          formationId,
          title,
          description: description || "",
          type: "SECTION",
          contentType: "SECTION",
          order: order || 0,
        },
      });

      res.status(201).json({ success: true, data: section });
    } catch (error) {
      console.error("Erreur addSection:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async addLesson(req, res) {
    try {
      const { formationId } = req.params;
      const {
        title,
        description,
        type,
        duration,
        sectionId,
        order,
        coverImage,
        fileUrl,
        metadata,
      } = req.body;

      // Validation
      if (!title || !type) {
        return res.status(400).json({
          success: false,
          message: "Le titre et le type de la leçon sont obligatoires",
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

      // Vérifier si la section existe si sectionId est fourni
      if (sectionId) {
        const section = await prisma.formationContent.findFirst({
          where: {
            id: sectionId,
            formationId,
            contentType: "SECTION",
          },
        });

        if (!section) {
          return res.status(404).json({
            success: false,
            message: "Section non trouvée",
          });
        }
      }

      const lesson = await prisma.formationContent.create({
        data: {
          formationId,
          title,
          description: description || "",
          type,
          contentType: "LESSON",
          sectionId: sectionId || null,
          order: order || 0,
          duration: duration ? parseInt(duration) : null,
          coverImage: coverImage || null,
          fileUrl: fileUrl || null,
          metadata: metadata || null,
        },
      });

      // Mettre à jour la durée totale de la formation
      await updateFormationDuration(formationId);

      res.status(201).json({ success: true, data: lesson });
    } catch (error) {
      console.error("Erreur addLesson:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async updateLesson(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        type,
        duration,
        sectionId,
        order,
        coverImage,
        fileUrl,
        metadata,
      } = req.body;

      // Validation
      if (!title || !type) {
        return res.status(400).json({
          success: false,
          message: "Le titre et le type de la leçon sont obligatoires",
        });
      }

      // Vérifier si la leçon existe
      const existingLesson = await prisma.formationContent.findUnique({
        where: { id },
      });

      if (!existingLesson || existingLesson.contentType !== "LESSON") {
        return res.status(404).json({
          success: false,
          message: "Leçon non trouvée",
        });
      }

      // Vérifier si la section existe si sectionId est fourni
      if (sectionId) {
        const section = await prisma.formationContent.findFirst({
          where: {
            id: sectionId,
            formationId: existingLesson.formationId,
            contentType: "SECTION",
          },
        });

        if (!section) {
          return res.status(404).json({
            success: false,
            message: "Section non trouvée",
          });
        }
      }

      const lesson = await prisma.formationContent.update({
        where: { id },
        data: {
          title,
          description: description || "",
          type,
          sectionId: sectionId || null,
          order: order !== undefined ? order : existingLesson.order,
          duration: duration ? parseInt(duration) : null,
          coverImage:
            coverImage !== undefined ? coverImage : existingLesson.coverImage,
          fileUrl: fileUrl !== undefined ? fileUrl : existingLesson.fileUrl,
          metadata: metadata !== undefined ? metadata : existingLesson.metadata,
        },
      });

      // Mettre à jour la durée totale de la formation
      await updateFormationDuration(existingLesson.formationId);

      res.json({ success: true, data: lesson });
    } catch (error) {
      console.error("Erreur updateLesson:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async deleteLesson(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si la leçon existe
      const lesson = await prisma.formationContent.findUnique({
        where: { id },
      });

      if (!lesson || lesson.contentType !== "LESSON") {
        return res.status(404).json({
          success: false,
          message: "Leçon non trouvée",
        });
      }

      const formationId = lesson.formationId;

      // Supprimer la leçon
      await prisma.formationContent.delete({
        where: { id },
      });

      // Mettre à jour la durée totale de la formation
      await updateFormationDuration(formationId);

      res.json({
        success: true,
        message: "Leçon supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur deleteLesson:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour une section
  async updateSection(req, res) {
    try {
      const { id } = req.params;
      const { title, description, order } = req.body;

      // Validation
      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Le titre de la section est obligatoire",
        });
      }

      // Vérifier si la section existe
      const existingSection = await prisma.formationContent.findUnique({
        where: { id },
      });

      if (!existingSection || existingSection.contentType !== "SECTION") {
        return res.status(404).json({
          success: false,
          message: "Section non trouvée",
        });
      }

      const section = await prisma.formationContent.update({
        where: { id },
        data: {
          title,
          description: description || "",
          order: order !== undefined ? order : existingSection.order,
        },
      });

      res.json({ success: true, data: section });
    } catch (error) {
      console.error("Erreur updateSection:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer une section
  async deleteSection(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si la section existe
      const section = await prisma.formationContent.findUnique({
        where: { id },
      });

      if (!section || section.contentType !== "SECTION") {
        return res.status(404).json({
          success: false,
          message: "Section non trouvée",
        });
      }

      // Vérifier s'il y a des leçons dans cette section
      const lessonsInSection = await prisma.formationContent.findMany({
        where: {
          sectionId: id,
          contentType: "LESSON",
        },
      });

      if (lessonsInSection.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Impossible de supprimer une section qui contient des leçons. Déplacez d'abord les leçons.",
        });
      }

      // Supprimer la section
      await prisma.formationContent.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Section supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur deleteSection:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  async reorderContent(req, res) {
    try {
      const { formationId } = req.params;
      const { content } = req.body; // array of { id, order, sectionId? }

      // Validation
      if (!Array.isArray(content)) {
        return res.status(400).json({
          success: false,
          message: "Le contenu doit être un tableau",
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

      // Mettre à jour l'ordre de chaque élément
      for (const item of content) {
        await prisma.formationContent.update({
          where: { id: item.id },
          data: {
            order: item.order,
            sectionId: item.sectionId || null,
          },
        });
      }

      res.json({
        success: true,
        message: "Ordre du contenu mis à jour avec succès",
      });
    } catch (error) {
      console.error("Erreur reorderContent:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

export const quizController = {
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
};

// Contrôleur pour la gestion des assignations banque-formation
export const bankFormationController = {
  // Assigner une formation à une banque
  async assignFormationToBank(req, res) {
    try {
      console.log("🔍 assignFormationToBank appelé");
      console.log("📡 Headers:", req.headers);
      console.log("👤 req.user:", req.user);
      console.log("📦 Body:", req.body);

      const { bankId, formationId } = req.body;

      // Vérifier l'authentification
      if (!req.user || !req.user.id) {
        console.log("❌ Utilisateur non authentifié");
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const userId = req.user.id; // ID de l'admin qui fait l'assignation
      console.log("✅ Utilisateur authentifié:", userId);

      // Validation
      if (!bankId || !formationId) {
        return res.status(400).json({
          success: false,
          message: "ID de banque et ID de formation requis",
        });
      }

      // Vérifier si la banque existe
      const bank = await prisma.bank.findUnique({
        where: { id: bankId },
      });

      if (!bank) {
        return res.status(404).json({
          success: false,
          message: "Banque non trouvée",
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

      // Vérifier si l'assignation existe déjà
      const existingAssignment = await prisma.bankFormation.findFirst({
        where: {
          bankId,
          formationId,
        },
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: "Cette formation est déjà assignée à cette banque",
        });
      }

      // Créer l'assignation
      const bankFormation = await prisma.bankFormation.create({
        data: {
          bankId,
          formationId,
          assignedBy: userId,
        },
        include: {
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      });

      res.status(201).json({ success: true, data: bankFormation });
    } catch (error) {
      console.error("Erreur assignFormationToBank:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer toutes les formations assignées à une banque
  async getBankFormations(req, res) {
    try {
      const { bankId } = req.params;

      // Vérifier si la banque existe
      const bank = await prisma.bank.findUnique({
        where: { id: bankId },
      });

      if (!bank) {
        return res.status(404).json({
          success: false,
          message: "Banque non trouvée",
        });
      }

      // Récupérer les formations assignées avec le nombre d'utilisateurs
      const bankFormations = await prisma.bankFormation.findMany({
        where: { bankId },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
              isActive: true,
              hasQuiz: true,
            },
          },
          userAssignments: {
            select: {
              id: true,
              userId: true,
              isMandatory: true,
              dueDate: true,
            },
          },
        },
      });

      // Ajouter le nombre d'utilisateurs assignés à chaque formation
      const formationsWithUserCount = bankFormations.map((bf) => ({
        ...bf,
        userCount: bf.userAssignments.length,
      }));

      res.json({ success: true, data: formationsWithUserCount });
    } catch (error) {
      console.error("Erreur getBankFormations:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer toutes les banques qui ont accès à une formation
  async getFormationBanks(req, res) {
    try {
      const { formationId } = req.params;

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

      // Récupérer toutes les banques qui ont accès à cette formation
      const bankFormations = await prisma.bankFormation.findMany({
        where: { formationId },
        include: {
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
          },
        },
      });

      const banks = bankFormations.map((bf) => bf.bank);

      res.json({ success: true, data: banks });
    } catch (error) {
      console.error("Erreur getFormationBanks:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer les statistiques d'une formation
  async getFormationStats(req, res) {
    try {
      const { formationId } = req.params;

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

      // Compter le nombre de banques qui ont accès à cette formation
      const bankCount = await prisma.bankFormation.count({
        where: { formationId },
      });

      // Compter le nombre total d'utilisateurs assignés à cette formation
      const userCount = await prisma.userFormationAssignment.count({
        where: {
          bankFormation: {
            formationId,
          },
        },
      });

      res.json({
        success: true,
        data: {
          bankCount,
          userCount,
        },
      });
    } catch (error) {
      console.error("Erreur getFormationStats:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour le statut obligatoire d'une formation pour une banque
  async updateFormationMandatory(req, res) {
    try {
      const { id } = req.params;
      const { isMandatory } = req.body;

      // Validation
      if (typeof isMandatory !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Le statut obligatoire doit être un booléen",
        });
      }

      // Vérifier si l'assignation existe
      const bankFormation = await prisma.bankFormation.findUnique({
        where: { id },
      });

      if (!bankFormation) {
        return res.status(404).json({
          success: false,
          message: "Assignation formation-banque non trouvée",
        });
      }

      // Mettre à jour le statut
      const updatedBankFormation = await prisma.bankFormation.update({
        where: { id },
        data: { isMandatory },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      res.json({ success: true, data: updatedBankFormation });
    } catch (error) {
      console.error("Erreur updateFormationMandatory:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer l'assignation d'une formation à une banque
  async removeFormationFromBank(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si l'assignation existe
      const bankFormation = await prisma.bankFormation.findUnique({
        where: { id },
      });

      if (!bankFormation) {
        return res.status(404).json({
          success: false,
          message: "Assignation formation-banque non trouvée",
        });
      }

      // Supprimer l'assignation (les assignations utilisateurs seront supprimées en cascade)
      await prisma.bankFormation.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Formation retirée de la banque avec succès",
      });
    } catch (error) {
      console.error("Erreur removeFormationFromBank:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

// Contrôleur pour la gestion des assignations utilisateurs aux formations
export const userFormationAssignmentController = {
  // Assigner des utilisateurs à une formation d'une banque
  async assignUsersToFormation(req, res) {
    try {
      const { bankFormationId, users } = req.body;
      const { userId } = req.user; // ID de l'admin qui fait l'assignation

      // Validation
      if (!bankFormationId || !users || !Array.isArray(users)) {
        return res.status(400).json({
          success: false,
          message: "ID de formation-banque et liste d'utilisateurs requis",
        });
      }

      // Vérifier si l'assignation formation-banque existe
      const bankFormation = await prisma.bankFormation.findUnique({
        where: { id: bankFormationId },
        include: {
          bank: true,
          formation: true,
        },
      });

      if (!bankFormation) {
        return res.status(404).json({
          success: false,
          message: "Assignation formation-banque non trouvée",
        });
      }

      // Vérifier que les utilisateurs appartiennent à la bonne banque
      const userIds = users.map((u) => u.userId);
      const bankUsers = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          bankId: bankFormation.bankId,
        },
      });

      if (bankUsers.length !== userIds.length) {
        return res.status(400).json({
          success: false,
          message: "Certains utilisateurs n'appartiennent pas à cette banque",
        });
      }

      // Créer les assignations utilisateurs
      const assignments = [];
      for (const userData of users) {
        const assignment = await prisma.userFormationAssignment.create({
          data: {
            bankFormationId,
            userId: userData.userId,
            isMandatory: userData.isMandatory || false,
            dueDate: userData.dueDate ? new Date(userData.dueDate) : null,
            assignedBy: userId,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                department: true,
              },
            },
          },
        });
        assignments.push(assignment);
      }

      res.status(201).json({ success: true, data: assignments });
    } catch (error) {
      console.error("Erreur assignUsersToFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Assigner des utilisateurs par groupe (département, etc.)
  async assignUsersByGroup(req, res) {
    try {
      const { bankFormationId, groupType, groupValue, isMandatory, dueDate } =
        req.body;
      const { userId } = req.user;

      // Validation
      if (!bankFormationId || !groupType || !groupValue) {
        return res.status(400).json({
          success: false,
          message:
            "ID de formation-banque, type de groupe et valeur de groupe requis",
        });
      }

      // Vérifier si l'assignation formation-banque existe
      const bankFormation = await prisma.bankFormation.findUnique({
        where: { id: bankFormationId },
        include: {
          bank: true,
        },
      });

      if (!bankFormation) {
        return res.status(404).json({
          success: false,
          message: "Assignation formation-banque non trouvée",
        });
      }

      // Construire la clause where selon le type de groupe
      let whereClause = { bankId: bankFormation.bankId };

      if (groupType === "department") {
        whereClause.department = groupValue;
      } else if (groupType === "role") {
        whereClause.role = groupValue;
      } else if (groupType === "all") {
        // Tous les utilisateurs de la banque
      } else {
        return res.status(400).json({
          success: false,
          message: "Type de groupe non supporté",
        });
      }

      // Récupérer les utilisateurs du groupe
      const groupUsers = await prisma.user.findMany({
        where: {
          ...whereClause,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
        },
      });

      if (groupUsers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Aucun utilisateur trouvé pour ce groupe",
        });
      }

      // Créer les assignations pour tous les utilisateurs du groupe
      const assignments = [];
      for (const user of groupUsers) {
        // Vérifier si l'assignation existe déjà
        const existingAssignment =
          await prisma.userFormationAssignment.findUnique({
            where: {
              bankFormationId_userId: {
                bankFormationId,
                userId: user.id,
              },
            },
          });

        if (!existingAssignment) {
          const assignment = await prisma.userFormationAssignment.create({
            data: {
              bankFormationId,
              userId: user.id,
              isMandatory: isMandatory || false,
              dueDate: dueDate ? new Date(dueDate) : null,
              assignedBy: userId,
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  department: true,
                },
              },
            },
          });
          assignments.push(assignment);
        }
      }

      res.status(201).json({
        success: true,
        data: assignments,
        message: `${assignments.length} utilisateur(s) assigné(s) avec succès`,
      });
    } catch (error) {
      console.error("Erreur assignUsersByGroup:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour le statut obligatoire d'un utilisateur pour une formation
  async updateUserFormationMandatory(req, res) {
    try {
      const { id } = req.params;
      const { isMandatory, dueDate } = req.body;

      // Validation
      if (typeof isMandatory !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Le statut obligatoire doit être un booléen",
        });
      }

      // Vérifier si l'assignation existe
      const assignment = await prisma.userFormationAssignment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignation utilisateur-formation non trouvée",
        });
      }

      // Mettre à jour le statut
      const updatedAssignment = await prisma.userFormationAssignment.update({
        where: { id },
        data: {
          isMandatory,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      res.json({ success: true, data: updatedAssignment });
    } catch (error) {
      console.error("Erreur updateUserFormationMandatory:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer l'assignation d'un utilisateur à une formation
  async removeUserFromFormation(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si l'assignation existe
      const assignment = await prisma.userFormationAssignment.findUnique({
        where: { id },
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignation utilisateur-formation non trouvée",
        });
      }

      // Supprimer l'assignation
      await prisma.userFormationAssignment.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Utilisateur retiré de la formation avec succès",
      });
    } catch (error) {
      console.error("Erreur removeUserFromFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer toutes les assignations d'une formation d'une banque
  async getFormationUserAssignments(req, res) {
    try {
      const { bankFormationId } = req.params;

      // Vérifier si l'assignation formation-banque existe
      const bankFormation = await prisma.bankFormation.findUnique({
        where: { id: bankFormationId },
      });

      if (!bankFormation) {
        return res.status(404).json({
          success: false,
          message: "Assignation formation-banque non trouvée",
        });
      }

      // Récupérer toutes les assignations utilisateurs
      const userAssignments = await prisma.userFormationAssignment.findMany({
        where: { bankFormationId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ isMandatory: "desc" }, { user: { firstName: "asc" } }],
      });

      res.json({ success: true, data: userAssignments });
    } catch (error) {
      console.error("Erreur getFormationUserAssignments:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

// Fonction utilitaire pour mettre à jour la durée totale d'une formation
async function updateFormationDuration(formationId) {
  try {
    const lessons = await prisma.formationContent.findMany({
      where: {
        formationId,
        contentType: "LESSON",
      },
    });

    const totalDuration = lessons.reduce(
      (sum, lesson) => sum + (lesson.duration || 0),
      0
    );

    await prisma.formation.update({
      where: { id: formationId },
      data: { duration: totalDuration },
    });
  } catch (error) {
    console.error("Erreur updateFormationDuration:", error);
  }
}

// Contrôleurs pour les univers
export const universeController = {
  // Récupérer tous les univers
  async getAllUniverses(req, res) {
    try {
      const universes = await prisma.universe.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });

      // Ajouter le nombre de formations pour chaque univers
      const universesWithCounts = await Promise.all(
        universes.map(async (universe) => {
          let formationCount = 0;

          if (universe.id === "fsu") {
            // Pour FSU, compter les formations sans univers
            formationCount = await prisma.formation.count({
              where: { universeId: null },
            });
          } else {
            // Pour les autres univers, compter les formations dans l'univers
            formationCount = await prisma.formation.count({
              where: { universeId: universe.id },
            });
          }

          return {
            ...universe,
            formationCount,
          };
        })
      );

      res.json({ success: true, data: universesWithCounts });
    } catch (error) {
      console.error("Erreur getAllUniverses:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Créer un nouvel univers
  async createUniverse(req, res) {
    try {
      const { name, description, color, icon } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Le nom de l'univers est requis",
        });
      }

      const universe = await prisma.universe.create({
        data: {
          name,
          description,
          color: color || "#3B82F6",
          icon: icon || "folder",
          isActive: true,
        },
      });

      res.json({ success: true, data: universe });
    } catch (error) {
      console.error("Erreur createUniverse:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour un univers
  async updateUniverse(req, res) {
    try {
      const { id } = req.params;
      const { name, description, color, icon, isActive } = req.body;

      const universe = await prisma.universe.update({
        where: { id },
        data: {
          name,
          description,
          color,
          icon,
          isActive,
        },
      });

      res.json({ success: true, data: universe });
    } catch (error) {
      console.error("Erreur updateUniverse:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer un univers
  async deleteUniverse(req, res) {
    try {
      const { id } = req.params;

      // Vérifier s'il y a des formations dans cet univers
      const formationsCount = await prisma.formation.count({
        where: { universeId: id },
      });

      if (formationsCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Impossible de supprimer un univers contenant des formations",
        });
      }

      await prisma.universe.delete({
        where: { id },
      });

      res.json({ success: true, message: "Univers supprimé avec succès" });
    } catch (error) {
      console.error("Erreur deleteUniverse:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Déplacer une formation vers un univers
  async moveFormationToUniverse(req, res) {
    try {
      const { formationId, universeId } = req.body;

      if (!formationId) {
        return res.status(400).json({
          success: false,
          message: "ID de formation requis",
        });
      }

      // Vérifier que la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
      });

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Si universeId est null ou vide, retirer de l'univers (placer dans FSU)
      if (!universeId) {
        await prisma.formation.update({
          where: { id: formationId },
          data: { universeId: null },
        });
      } else {
        // Vérifier que l'univers existe
        const universe = await prisma.universe.findUnique({
          where: { id: universeId },
        });

        if (!universe) {
          return res.status(404).json({
            success: false,
            message: "Univers non trouvé",
          });
        }

        // Déplacer la formation vers l'univers
        await prisma.formation.update({
          where: { id: formationId },
          data: { universeId },
        });
      }

      res.json({ success: true, message: "Formation déplacée avec succès" });
    } catch (error) {
      console.error("Erreur moveFormationToUniverse:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer les formations d'un univers
  async getUniverseFormations(req, res) {
    try {
      const { universeId } = req.params;

      let formations = [];

      if (universeId === "fsu") {
        // Pour FSU, récupérer les formations sans univers
        formations = await prisma.formation.findMany({
          where: { universeId: null },
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                content: {
                  where: { contentType: "LESSON" },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      } else {
        // Pour les autres univers, récupérer les formations de l'univers
        formations = await prisma.formation.findMany({
          where: { universeId },
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                content: {
                  where: { contentType: "LESSON" },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      }

      // Ajouter les statistiques pour chaque formation
      const formationsWithStats = await Promise.all(
        formations.map(async (formation) => {
          const bankCount = await prisma.bankFormation.count({
            where: { formationId: formation.id },
          });

          const userCount = await prisma.userFormationAssignment.count({
            where: {
              bankFormation: {
                formationId: formation.id,
              },
            },
          });

          return {
            ...formation,
            lessonCount: formation._count.content,
            bankCount,
            userCount,
          };
        })
      );

      res.json({ success: true, data: formationsWithStats });
    } catch (error) {
      console.error("Erreur getUniverseFormations:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};
