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
        where: { id: user.userId },
        include: {
          bank: true,
        },
      });

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

  // Rafraîchir le token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token requis",
        });
      }

      // Vérifier le refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Token invalide",
        });
      }

      // Générer un nouveau access token
      const newAccessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
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

  // Changer de banque
  async switchBank(req, res) {
    try {
      const { bankId } = req.body;
      const user = req.user;

      if (!bankId) {
        return res.status(400).json({
          success: false,
          message: "ID de banque requis",
        });
      }

      // Vérifier que la banque existe
      const bank = await prisma.bank.findUnique({
        where: { id: bankId },
      });

      if (!bank) {
        return res.status(404).json({
          success: false,
          message: "Banque non trouvée",
        });
      }

      // Mettre à jour l'utilisateur
      await prisma.user.update({
        where: { id: user.userId },
        data: { bankId },
      });

      res.json({
        success: true,
        message: "Banque changée avec succès",
      });
    } catch (error) {
      console.error("Erreur switchBank:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

// Contrôleur des banques
export const banksController = {
  // Obtenir toutes les banques
  async getAllBanks(req, res) {
    try {
      const banks = await prisma.bank.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });

      res.json({
        success: true,
        data: banks,
      });
    } catch (error) {
      console.error("Erreur getAllBanks:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir une banque par ID
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
              department: true,
              isActive: true,
            },
          },
          formations: {
            select: {
              id: true,
              title: true,
              type: true,
              duration: true,
              isActive: true,
              isMandatory: true,
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

      res.json({
        success: true,
        data: bank,
      });
    } catch (error) {
      console.error("Erreur getBankById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Créer une banque
  async createBank(req, res) {
    try {
      const { name, code } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: "Nom et code de banque requis",
        });
      }

      // Vérifier que le code n'existe pas déjà
      const existingBank = await prisma.bank.findUnique({
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

      res.status(201).json({
        success: true,
        data: bank,
      });
    } catch (error) {
      console.error("Erreur createBank:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour une banque
  async updateBank(req, res) {
    try {
      const { id } = req.params;
      const { name, code, isActive } = req.body;

      // Vérifier que la banque existe
      const existingBank = await prisma.bank.findUnique({
        where: { id },
      });

      if (!existingBank) {
        return res.status(404).json({
          success: false,
          message: "Banque non trouvée",
        });
      }

      // Vérifier que le code n'existe pas déjà (sauf pour cette banque)
      if (code && code !== existingBank.code) {
        const bankWithCode = await prisma.bank.findUnique({
          where: { code },
        });

        if (bankWithCode) {
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

      res.json({
        success: true,
        data: bank,
      });
    } catch (error) {
      console.error("Erreur updateBank:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer une banque
  async deleteBank(req, res) {
    try {
      const { id } = req.params;

      // Vérifier que la banque existe
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

      // Vérifier qu'il n'y a pas d'utilisateurs ou de formations associés
      if (bank.users.length > 0 || bank.formations.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Impossible de supprimer une banque avec des utilisateurs ou formations associés",
        });
      }

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
};

// Contrôleur des formations
export const formationsController = {
  // Obtenir toutes les formations
  async getAllFormations(req, res) {
    try {
      const { bankId, type, isActive, isMandatory } = req.query;
      const user = req.user;

      let where = {};

      // Filtrer par banque si l'utilisateur n'est pas super admin
      if (user.role !== "SUPER_ADMIN") {
        where.bankId = user.bankId;
      } else if (bankId) {
        where.bankId = bankId;
      }

      // Autres filtres
      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive === "true";
      if (isMandatory !== undefined) where.isMandatory = isMandatory === "true";

      const formations = await prisma.formation.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          content: {
            orderBy: { order: "asc" },
          },
          _count: {
            select: {
              assignments: true,
              progress: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: formations,
      });
    } catch (error) {
      console.error("Erreur getAllFormations:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir une formation par ID
  async getFormationById(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

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
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          content: {
            orderBy: { order: "asc" },
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
          assignments: {
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
          progress: {
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

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && formation.bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      res.json({
        success: true,
        data: formation,
      });
    } catch (error) {
      console.error("Erreur getFormationById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Créer une formation
  async createFormation(req, res) {
    try {
      const {
        title,
        description,
        type,
        duration,
        isMandatory,
        bankId,
        content,
      } = req.body;
      const user = req.user;

      if (!title || !description || !type || !duration) {
        return res.status(400).json({
          success: false,
          message: "Titre, description, type et durée requis",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      const formation = await prisma.formation.create({
        data: {
          title,
          description,
          type,
          duration: parseInt(duration),
          isMandatory: isMandatory || false,
          createdBy: user.userId,
          bankId: user.role === "SUPER_ADMIN" ? bankId : user.bankId,
          content: {
            create: content || [],
          },
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
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          content: {
            orderBy: { order: "asc" },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: formation,
      });
    } catch (error) {
      console.error("Erreur createFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour une formation
  async updateFormation(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        type,
        duration,
        isActive,
        isMandatory,
        content,
      } = req.body;
      const user = req.user;

      // Vérifier que la formation existe
      const existingFormation = await prisma.formation.findUnique({
        where: { id },
      });

      if (!existingFormation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && existingFormation.bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      // Mettre à jour la formation
      const formation = await prisma.formation.update({
        where: { id },
        data: {
          title,
          description,
          type,
          duration: duration ? parseInt(duration) : undefined,
          isActive,
          isMandatory,
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
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          content: {
            orderBy: { order: "asc" },
          },
        },
      });

      // Mettre à jour le contenu si fourni
      if (content) {
        // Supprimer l'ancien contenu
        await prisma.formationContent.deleteMany({
          where: { formationId: id },
        });

        // Créer le nouveau contenu
        await prisma.formationContent.createMany({
          data: content.map((item, index) => ({
            ...item,
            formationId: id,
            order: index + 1,
          })),
        });
      }

      res.json({
        success: true,
        data: formation,
      });
    } catch (error) {
      console.error("Erreur updateFormation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer une formation
  async deleteFormation(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      // Vérifier que la formation existe
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

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && formation.bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      // Vérifier qu'il n'y a pas d'assignations ou de progressions
      if (formation.assignments.length > 0 || formation.progress.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Impossible de supprimer une formation avec des assignations ou progressions",
        });
      }

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

  // Basculer l'état actif d'une formation
  async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const formation = await prisma.formation.findUnique({
        where: { id },
      });

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && formation.bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      const updatedFormation = await prisma.formation.update({
        where: { id },
        data: { isActive: !formation.isActive },
      });

      res.json({
        success: true,
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

  // Basculer l'état obligatoire d'une formation
  async toggleMandatory(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const formation = await prisma.formation.findUnique({
        where: { id },
      });

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && formation.bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      const updatedFormation = await prisma.formation.update({
        where: { id },
        data: { isMandatory: !formation.isMandatory },
      });

      res.json({
        success: true,
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

// Contrôleur des utilisateurs
export const usersController = {
  // Obtenir tous les utilisateurs
  async getAllUsers(req, res) {
    try {
      const { bankId, role, department, isActive } = req.query;
      const user = req.user;

      let where = {};

      // Filtrer par banque si l'utilisateur n'est pas super admin
      if (user.role !== "SUPER_ADMIN") {
        where.bankId = user.bankId;
      } else if (bankId) {
        where.bankId = bankId;
      }

      // Autres filtres
      if (role) where.role = role;
      if (department) where.department = department;
      if (isActive !== undefined) where.isActive = isActive === "true";

      const users = await prisma.user.findMany({
        where,
        include: {
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { lastName: "asc" },
      });

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("Erreur getAllUsers:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir un utilisateur par ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const targetUser = await prisma.user.findUnique({
        where: { id },
        include: {
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          assignments: {
            include: {
              formation: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  duration: true,
                },
              },
            },
          },
          progress: {
            include: {
              formation: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  duration: true,
                },
              },
            },
          },
        },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && targetUser.bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      res.json({
        success: true,
        data: targetUser,
      });
    } catch (error) {
      console.error("Erreur getUserById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Créer un utilisateur
  async createUser(req, res) {
    try {
      const {
        email,
        firstName,
        lastName,
        role,
        bankId,
        department,
        password,
      } = req.body;
      const user = req.user;

      if (!email || !firstName || !lastName || !role) {
        return res.status(400).json({
          success: false,
          message: "Email, prénom, nom et rôle requis",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      // Vérifier que l'email n'existe pas déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Cet email existe déjà",
        });
      }

      // Générer un mot de passe si non fourni
      const hashedPassword = password
        ? await bcrypt.hash(password, 12)
        : await bcrypt.hash(await generatePassword(), 12);

      const newUser = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          role,
          bankId: user.role === "SUPER_ADMIN" ? bankId : user.bankId,
          department,
          password: hashedPassword,
          isActive: true,
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
        data: newUser,
      });
    } catch (error) {
      console.error("Erreur createUser:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour un utilisateur
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const {
        email,
        firstName,
        lastName,
        role,
        bankId,
        department,
        isActive,
      } = req.body;
      const user = req.user;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && existingUser.bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      // Vérifier que l'email n'existe pas déjà (sauf pour cet utilisateur)
      if (email && email !== existingUser.email) {
        const userWithEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (userWithEmail) {
          return res.status(400).json({
            success: false,
            message: "Cet email existe déjà",
          });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          email,
          firstName,
          lastName,
          role,
          bankId: user.role === "SUPER_ADMIN" ? bankId : existingUser.bankId,
          department,
          isActive,
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

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      console.error("Erreur updateUser:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer un utilisateur
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      // Vérifier que l'utilisateur existe
      const targetUser = await prisma.user.findUnique({
        where: { id },
        include: {
          assignments: true,
          progress: true,
        },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && targetUser.bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      // Vérifier qu'il n'y a pas d'assignations ou de progressions
      if (targetUser.assignments.length > 0 || targetUser.progress.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Impossible de supprimer un utilisateur avec des assignations ou progressions",
        });
      }

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

  // Basculer l'état actif d'un utilisateur
  async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && targetUser.bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: !targetUser.isActive },
      });

      res.json({
        success: true,
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

  // Réinitialiser le mot de passe d'un utilisateur
  async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && targetUser.bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      // Générer un nouveau mot de passe
      const newPassword = await generatePassword();
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      // Envoyer le nouveau mot de passe par email
      await sendEmail({
        to: targetUser.email,
        subject: "Réinitialisation de mot de passe",
        template: "passwordReset",
        data: {
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          newPassword,
        },
      });

      res.json({
        success: true,
        message: "Mot de passe réinitialisé et envoyé par email",
      });
    } catch (error) {
      console.error("Erreur resetPassword:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Envoyer les identifiants d'un utilisateur
  async sendCredentials(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier les permissions
      if (user.role !== "SUPER_ADMIN" && targetUser.bankId !== user.bankId) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      // Envoyer les identifiants par email
      await sendEmail({
        to: targetUser.email,
        subject: "Vos identifiants de connexion",
        template: "credentials",
        data: {
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          email: targetUser.email,
          password: "Votre mot de passe actuel",
        },
      });

      res.json({
        success: true,
        message: "Identifiants envoyés par email",
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

// Contrôleurs stubs pour les autres fonctionnalités
export const assignmentsController = {
  async getAllAssignments(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [] });
  },
  async getAssignmentById(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {} });
  },
  async createAssignment(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {} });
  },
  async updateAssignment(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {} });
  },
  async deleteAssignment(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: "Assignation supprimée" });
  },
  async bulkAssign(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: "Assignations en masse effectuées" });
  },
};

export const dashboardController = {
  async getStats(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {} });
  },
  async getBankStats(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {} });
  },
  async getRecentActivity(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [] });
  },
};

export const quizController = {
  async getAllQuizzes(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [] });
  },
  async getQuizById(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {} });
  },
  async createQuiz(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {} });
  },
  async updateQuiz(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {} });
  },
  async deleteQuiz(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: "Quiz supprimé" });
  },
};

export const progressController = {
  async getAllProgress(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [] });
  },
  async getUserProgress(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [] });
  },
  async getFormationProgress(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [] });
  },
  async updateProgress(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {} });
  },
};

export const notificationsController = {
  async getAllNotifications(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [] });
  },
  async getUserNotifications(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: [] });
  },
  async createNotification(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {} });
  },
  async markAsRead(req, res) {
    // TODO: Implémenter
    res.json({ success: true, data: {} });
  },
  async deleteNotification(req, res) {
    // TODO: Implémenter
    res.json({ success: true, message: "Notification supprimée" });
  },
};

