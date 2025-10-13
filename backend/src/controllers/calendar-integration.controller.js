import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

export const calendarIntegrationController = {
  // Obtenir toutes les intégrations d'un utilisateur
  getUserIntegrations: async (req, res) => {
    try {
      const userId = req.user.id;

      const integrations = await prisma.calendarIntegration.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          isConnected: true,
          syncEnabled: true,
          importEnabled: true,
          exportEnabled: true,
          email: true,
          name: true,
          lastSync: true,
          createdAt: true,
          updatedAt: true,
          // Ne pas exposer les tokens
        },
      });

      res.json({
        success: true,
        data: integrations,
      });
    } catch (error) {
      console.error("Erreur getUserIntegrations:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des intégrations",
      });
    }
  },

  // Initier l'authentification OAuth pour Google Calendar
  initiateGoogleOAuth: async (req, res) => {
    try {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.FRONTEND_URL}/calendar/oauth/google/callback`;

      if (!googleClientId) {
        return res.status(500).json({
          success: false,
          message: "Configuration Google OAuth manquante",
        });
      }

      const scope = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ].join(" ");

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${googleClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${req.user.id}`;

      res.json({
        success: true,
        authUrl,
      });
    } catch (error) {
      console.error("Erreur initiateGoogleOAuth:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'initialisation OAuth Google",
      });
    }
  },

  // Callback OAuth Google
  handleGoogleOAuthCallback: async (req, res) => {
    try {
      const { code, state: userId } = req.query;

      if (!code || !userId) {
        return res.status(400).json({
          success: false,
          message: "Code ou userId manquant",
        });
      }

      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.FRONTEND_URL}/calendar/oauth/google/callback`;

      // Échanger le code contre les tokens
      const tokenResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Récupérer les informations de l'utilisateur Google
      const userInfoResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const { email, name } = userInfoResponse.data;

      // Calculer la date d'expiration du token
      const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

      // Créer ou mettre à jour l'intégration
      const integration = await prisma.calendarIntegration.upsert({
        where: {
          userId_type: {
            userId,
            type: "GOOGLE",
          },
        },
        create: {
          userId,
          type: "GOOGLE",
          isConnected: true,
          syncEnabled: true,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiresAt,
          email,
          name,
          lastSync: new Date(),
        },
        update: {
          isConnected: true,
          accessToken: access_token,
          refreshToken: refresh_token || undefined,
          tokenExpiresAt,
          email,
          name,
          lastSync: new Date(),
        },
      });

      // Rediriger vers le frontend avec succès
      res.redirect(
        `${process.env.FRONTEND_URL}/learner/calendar?integration=success&type=google`
      );
    } catch (error) {
      console.error("Erreur handleGoogleOAuthCallback:", error);
      res.redirect(
        `${process.env.FRONTEND_URL}/learner/calendar?integration=error&type=google`
      );
    }
  },

  // Initier l'authentification OAuth pour Outlook
  initiateOutlookOAuth: async (req, res) => {
    try {
      const outlookClientId = process.env.OUTLOOK_CLIENT_ID;
      const redirectUri =
        process.env.OUTLOOK_REDIRECT_URI ||
        `${process.env.FRONTEND_URL}/calendar/oauth/outlook/callback`;

      if (!outlookClientId) {
        return res.status(500).json({
          success: false,
          message: "Configuration Outlook OAuth manquante",
        });
      }

      const scope = [
        "openid",
        "profile",
        "email",
        "Calendars.ReadWrite",
        "offline_access",
      ].join(" ");

      const authUrl =
        `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${outlookClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_mode=query&` +
        `state=${req.user.id}`;

      res.json({
        success: true,
        authUrl,
      });
    } catch (error) {
      console.error("Erreur initiateOutlookOAuth:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'initialisation OAuth Outlook",
      });
    }
  },

  // Callback OAuth Outlook
  handleOutlookOAuthCallback: async (req, res) => {
    try {
      const { code, state: userId } = req.query;

      if (!code || !userId) {
        return res.status(400).json({
          success: false,
          message: "Code ou userId manquant",
        });
      }

      const outlookClientId = process.env.OUTLOOK_CLIENT_ID;
      const outlookClientSecret = process.env.OUTLOOK_CLIENT_SECRET;
      const redirectUri =
        process.env.OUTLOOK_REDIRECT_URI ||
        `${process.env.FRONTEND_URL}/calendar/oauth/outlook/callback`;

      // Échanger le code contre les tokens
      const tokenResponse = await axios.post(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        new URLSearchParams({
          code,
          client_id: outlookClientId,
          client_secret: outlookClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Récupérer les informations de l'utilisateur Microsoft
      const userInfoResponse = await axios.get(
        "https://graph.microsoft.com/v1.0/me",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const { mail, displayName } = userInfoResponse.data;

      // Calculer la date d'expiration du token
      const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

      // Créer ou mettre à jour l'intégration
      const integration = await prisma.calendarIntegration.upsert({
        where: {
          userId_type: {
            userId,
            type: "OUTLOOK",
          },
        },
        create: {
          userId,
          type: "OUTLOOK",
          isConnected: true,
          syncEnabled: true,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiresAt,
          email: mail,
          name: displayName,
          lastSync: new Date(),
        },
        update: {
          isConnected: true,
          accessToken: access_token,
          refreshToken: refresh_token || undefined,
          tokenExpiresAt,
          email: mail,
          name: displayName,
          lastSync: new Date(),
        },
      });

      // Rediriger vers le frontend avec succès
      res.redirect(
        `${process.env.FRONTEND_URL}/learner/calendar?integration=success&type=outlook`
      );
    } catch (error) {
      console.error("Erreur handleOutlookOAuthCallback:", error);
      res.redirect(
        `${process.env.FRONTEND_URL}/learner/calendar?integration=error&type=outlook`
      );
    }
  },

  // Déconnecter une intégration
  disconnectIntegration: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const integration = await prisma.calendarIntegration.findFirst({
        where: { id, userId },
      });

      if (!integration) {
        return res.status(404).json({
          success: false,
          message: "Intégration non trouvée",
        });
      }

      await prisma.calendarIntegration.update({
        where: { id },
        data: {
          isConnected: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
        },
      });

      res.json({
        success: true,
        message: "Intégration déconnectée avec succès",
      });
    } catch (error) {
      console.error("Erreur disconnectIntegration:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la déconnexion",
      });
    }
  },

  // Synchroniser les événements depuis Google Calendar
  syncGoogleCalendar: async (req, res) => {
    try {
      const userId = req.user.id;

      const integration = await prisma.calendarIntegration.findFirst({
        where: { userId, type: "GOOGLE", isConnected: true },
      });

      if (!integration) {
        return res.status(404).json({
          success: false,
          message: "Intégration Google non trouvée ou non connectée",
        });
      }

      // Vérifier si le token est expiré et le rafraîchir si nécessaire
      let accessToken = integration.accessToken;
      if (
        integration.tokenExpiresAt &&
        new Date() > integration.tokenExpiresAt
      ) {
        // TODO: Implémenter le rafraîchissement du token
        // Pour l'instant, retourner une erreur
        return res.status(401).json({
          success: false,
          message: "Token expiré, veuillez vous reconnecter",
        });
      }

      // Récupérer les événements de Google Calendar
      const eventsResponse = await axios.get(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            timeMin: new Date().toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: "startTime",
          },
        }
      );

      const googleEvents = eventsResponse.data.items || [];

      // Importer les événements dans notre base de données
      const importedEvents = [];
      for (const googleEvent of googleEvents) {
        const startDate = googleEvent.start.dateTime || googleEvent.start.date;
        const endDate = googleEvent.end.dateTime || googleEvent.end.date;

        const event = await prisma.calendarEvent.upsert({
          where: {
            // Utiliser un index unique basé sur l'ID externe
            userId_externalId: {
              userId,
              externalId: googleEvent.id,
            },
          },
          create: {
            userId,
            title: googleEvent.summary || "Sans titre",
            description: googleEvent.description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            type: "EXTERNAL",
            location: googleEvent.location,
            isAllDay: !googleEvent.start.dateTime,
            externalId: googleEvent.id,
            externalSource: "GOOGLE",
          },
          update: {
            title: googleEvent.summary || "Sans titre",
            description: googleEvent.description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            location: googleEvent.location,
            isAllDay: !googleEvent.start.dateTime,
          },
        });

        importedEvents.push(event);
      }

      // Mettre à jour la date de dernière synchronisation
      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: { lastSync: new Date() },
      });

      res.json({
        success: true,
        message: `${importedEvents.length} événements synchronisés`,
        data: importedEvents,
      });
    } catch (error) {
      console.error("Erreur syncGoogleCalendar:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la synchronisation",
        error: error.message,
      });
    }
  },

  // Synchroniser les événements depuis Outlook
  syncOutlookCalendar: async (req, res) => {
    try {
      const userId = req.user.id;

      const integration = await prisma.calendarIntegration.findFirst({
        where: { userId, type: "OUTLOOK", isConnected: true },
      });

      if (!integration) {
        return res.status(404).json({
          success: false,
          message: "Intégration Outlook non trouvée ou non connectée",
        });
      }

      // Vérifier si le token est expiré
      let accessToken = integration.accessToken;
      if (
        integration.tokenExpiresAt &&
        new Date() > integration.tokenExpiresAt
      ) {
        return res.status(401).json({
          success: false,
          message: "Token expiré, veuillez vous reconnecter",
        });
      }

      // Récupérer les événements de Outlook Calendar
      const eventsResponse = await axios.get(
        "https://graph.microsoft.com/v1.0/me/calendar/events",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            $top: 50,
            $orderby: "start/dateTime",
          },
        }
      );

      const outlookEvents = eventsResponse.data.value || [];

      // Importer les événements
      const importedEvents = [];
      for (const outlookEvent of outlookEvents) {
        const event = await prisma.calendarEvent.upsert({
          where: {
            userId_externalId: {
              userId,
              externalId: outlookEvent.id,
            },
          },
          create: {
            userId,
            title: outlookEvent.subject || "Sans titre",
            description: outlookEvent.bodyPreview,
            startDate: new Date(outlookEvent.start.dateTime),
            endDate: new Date(outlookEvent.end.dateTime),
            type: "EXTERNAL",
            location: outlookEvent.location?.displayName,
            isAllDay: outlookEvent.isAllDay,
            externalId: outlookEvent.id,
            externalSource: "OUTLOOK",
          },
          update: {
            title: outlookEvent.subject || "Sans titre",
            description: outlookEvent.bodyPreview,
            startDate: new Date(outlookEvent.start.dateTime),
            endDate: new Date(outlookEvent.end.dateTime),
            location: outlookEvent.location?.displayName,
            isAllDay: outlookEvent.isAllDay,
          },
        });

        importedEvents.push(event);
      }

      // Mettre à jour la date de dernière synchronisation
      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: { lastSync: new Date() },
      });

      res.json({
        success: true,
        message: `${importedEvents.length} événements synchronisés`,
        data: importedEvents,
      });
    } catch (error) {
      console.error("Erreur syncOutlookCalendar:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la synchronisation",
        error: error.message,
      });
    }
  },
};
