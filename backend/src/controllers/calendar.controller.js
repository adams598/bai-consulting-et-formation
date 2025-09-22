import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const calendarController = {
  // Récupérer tous les événements d'un utilisateur
  getUserEvents: async (req, res) => {
    try {
      const userId = req.user.id;

      const events = await prisma.calendarEvent.findMany({
        where: { userId },
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

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      console.error("Erreur getUserEvents:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Créer un nouvel événement
  createEvent: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        title,
        description,
        startDate,
        endDate,
        type,
        location,
        attendees,
        isAllDay,
        color,
        reminders,
        formationId,
        lessonId,
        eventType,
        isRecurring,
        recurrenceRule,
      } = req.body;

      // Vérifier que la date de fin est après la date de début
      if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({
          success: false,
          message: "La date de fin doit être après la date de début",
        });
      }

      // Vérifier les conflits d'horaires (logique simplifiée)
      const conflicts = await prisma.calendarEvent.findMany({
        where: {
          userId,
          status: { not: "CANCELLED" },
          startDate: {
            gte: new Date(startDate),
            lt: new Date(endDate),
          },
        },
      });

      // Pour l'instant, permettre la création même s'il y a des conflits (temporaire)
      // TODO: Réactiver la vérification de conflit après tests
      /*
      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Conflit d'horaire détecté",
          conflicts: conflicts.map((c) => ({
            id: c.id,
            title: c.title,
            startDate: c.startDate,
            endDate: c.endDate,
          })),
        });
      }
      */

      const newEvent = await prisma.calendarEvent.create({
        data: {
          userId,
          title,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          type: type || "PERSONAL",
          location,
          attendees: attendees ? JSON.stringify(attendees) : null,
          isAllDay: isAllDay || false,
          color,
          reminders: reminders ? JSON.stringify(reminders) : null,
          formationId,
          lessonId,
          eventType,
          isRecurring: isRecurring || false,
          recurrenceRule,
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

      res.json({
        success: true,
        data: newEvent,
      });
    } catch (error) {
      console.error("Erreur createEvent:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour un événement
  updateEvent: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updateData = req.body;

      // Vérifier que l'événement appartient à l'utilisateur
      const existingEvent = await prisma.calendarEvent.findFirst({
        where: { id, userId },
      });

      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: "Événement non trouvé",
        });
      }

      const updatedEvent = await prisma.calendarEvent.update({
        where: { id },
        data: {
          ...updateData,
          startDate: updateData.startDate
            ? new Date(updateData.startDate)
            : undefined,
          endDate: updateData.endDate
            ? new Date(updateData.endDate)
            : undefined,
          attendees: updateData.attendees
            ? JSON.stringify(updateData.attendees)
            : undefined,
          reminders: updateData.reminders
            ? JSON.stringify(updateData.reminders)
            : undefined,
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

      res.json({
        success: true,
        data: updatedEvent,
      });
    } catch (error) {
      console.error("Erreur updateEvent:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer un événement
  deleteEvent: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Vérifier que l'événement appartient à l'utilisateur
      const existingEvent = await prisma.calendarEvent.findFirst({
        where: { id, userId },
      });

      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: "Événement non trouvé",
        });
      }

      await prisma.calendarEvent.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Événement supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur deleteEvent:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer les événements dans une plage de dates
  getEventsByDateRange: async (req, res) => {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Les dates de début et de fin sont requises",
        });
      }

      const events = await prisma.calendarEvent.findMany({
        where: {
          userId,
          startDate: { gte: new Date(startDate) },
          endDate: { lte: new Date(endDate) },
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

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      console.error("Erreur getEventsByDateRange:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer les prochaines échéances (pour le dashboard)
  getUpcomingDeadlines: async (req, res) => {
    try {
      const userId = req.user.id;
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const upcomingEvents = await prisma.calendarEvent.findMany({
        where: {
          userId,
          startDate: {
            gte: now,
            lte: in30Days,
          },
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
        take: 10, // Limiter à 10 prochains événements
      });

      res.json({
        success: true,
        data: upcomingEvents,
      });
    } catch (error) {
      console.error("Erreur getUpcomingDeadlines:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};
