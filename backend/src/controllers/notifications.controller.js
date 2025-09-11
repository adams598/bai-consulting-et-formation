import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Contrôleur pour la gestion des notifications
export const notificationsController = {
  // Obtenir toutes les notifications (pour les admins)
  async getAllNotifications(req, res) {
    try {
      const { page = 1, limit = 50, type, isRead } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = {};
      if (type) whereClause.type = type;
      if (isRead !== undefined) whereClause.isRead = isRead === "true";

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              bank: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      });

      const total = await prisma.notification.count({ where: whereClause });

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Erreur getAllNotifications:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir les notifications d'un utilisateur (pour les apprenants)
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, isRead } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = { userId };
      if (isRead !== undefined) whereClause.isRead = isRead === "true";

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      });

      const total = await prisma.notification.count({ where: whereClause });
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Erreur getUserNotifications:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir les notifications d'un utilisateur par ID (pour les admins)
  async getUserNotificationsById(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, isRead } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = { userId };
      if (isRead !== undefined) whereClause.isRead = isRead === "true";

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      });

      const total = await prisma.notification.count({ where: whereClause });
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Erreur getUserNotificationsById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Créer une notification
  async createNotification(req, res) {
    try {
      const { userId, type, title, message, data } = req.body;

      // Validation
      if (!userId || !type || !title || !message) {
        return res.status(400).json({
          success: false,
          message: "userId, type, title et message sont obligatoires",
        });
      }

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: data ? JSON.stringify(data) : null,
        },
      });

      res.status(201).json({ success: true, data: notification });
    } catch (error) {
      console.error("Erreur createNotification:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Marquer une notification comme lue
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Vérifier si la notification existe et appartient à l'utilisateur
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification non trouvée",
        });
      }

      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      res.json({ success: true, data: updatedNotification });
    } catch (error) {
      console.error("Erreur markAsRead:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer une notification
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Vérifier si la notification existe et appartient à l'utilisateur
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification non trouvée",
        });
      }

      await prisma.notification.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Notification supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur deleteNotification:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Marquer toutes les notifications comme lues
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      res.json({
        success: true,
        message: "Toutes les notifications ont été marquées comme lues",
      });
    } catch (error) {
      console.error("Erreur markAllAsRead:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir le nombre de notifications non lues
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      res.json({ success: true, data: { unreadCount } });
    } catch (error) {
      console.error("Erreur getUnreadCount:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};
