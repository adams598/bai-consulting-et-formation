import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { learnerMiddleware } from "../middleware/learner.middleware.js";
import {
  authController,
  formationContentController,
} from "../controllers/admin.controllers.js";
import {
  formationsController,
  progressController,
  notificationsController,
  universesController,
} from "../controllers/learner.controllers.js";
import { quizController as learnerQuizController } from "../controllers/quiz.controller.js";
import { calendarController } from "../controllers/calendar.controller.js";
import { calendarIntegrationController } from "../controllers/calendar-integration.controller.js";
import { opportunitiesController } from "../controllers/opportunities.controller.js";

const router = express.Router();

// Endpoint de santé (sans authentification)
router.get("/auth/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API Learner BAI Consulting opérationnelle",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Routes d'authentification pour apprenants
router.post("/auth/login", authController.login);
router.post("/auth/logout", authMiddleware, authController.logout);
router.get("/auth/me", authMiddleware, authController.getCurrentUser);

// Routes de gestion du profil
router.get(
  "/profile",
  authMiddleware,
  learnerMiddleware,
  authController.getProfile
);
router.put(
  "/profile",
  authMiddleware,
  learnerMiddleware,
  authController.updateProfile
);
router.put(
  "/profile/password",
  authMiddleware,
  learnerMiddleware,
  authController.changePassword
);

// Routes des univers
router.get(
  "/universes",
  authMiddleware,
  learnerMiddleware,
  universesController.getAll
);
router.get(
  "/universes/:id",
  authMiddleware,
  learnerMiddleware,
  universesController.getById
);

// Routes des formations
router.get(
  "/formations",
  authMiddleware,
  learnerMiddleware,
  formationsController.getMyFormations
);
router.get(
  "/formations/all",
  authMiddleware,
  learnerMiddleware,
  formationsController.getAllFormationsWithAssignment
);
router.get(
  "/formations/scheduled",
  authMiddleware,
  learnerMiddleware,
  formationsController.getScheduledEvents
);
router.get(
  "/formations/:id",
  authMiddleware,
  learnerMiddleware,
  formationsController.getFormationById
);
router.get(
  "/formations/:id/content",
  authMiddleware,
  learnerMiddleware,
  formationContentController.getByFormation
);
router.post(
  "/formations/schedule",
  authMiddleware,
  learnerMiddleware,
  formationsController.scheduleFormation
);

// Routes des quiz pour apprenants
router.get(
  "/quiz/:id",
  authMiddleware,
  learnerMiddleware,
  learnerQuizController.getQuizById
);
router.post(
  "/quiz/:quizId/start",
  authMiddleware,
  learnerMiddleware,
  learnerQuizController.startQuizAttempt
);
router.post(
  "/quiz/attempt/:attemptId/submit",
  authMiddleware,
  learnerMiddleware,
  learnerQuizController.submitQuizAttempt
);
router.get(
  "/quiz/attempts",
  authMiddleware,
  learnerMiddleware,
  learnerQuizController.getUserQuizAttempts
);

// Routes des progressions
router.get(
  "/progress",
  authMiddleware,
  learnerMiddleware,
  progressController.getMyProgress
);
router.get(
  "/progress/dashboard-stats",
  authMiddleware,
  learnerMiddleware,
  formationsController.getDashboardStats
);
router.get(
  "/progress/stats",
  authMiddleware,
  learnerMiddleware,
  progressController.getStats
);
router.put(
  "/progress/:id",
  authMiddleware,
  learnerMiddleware,
  progressController.updateProgress
);
router.post(
  "/progress/save",
  authMiddleware,
  learnerMiddleware,
  progressController.saveProgress
);
router.get(
  "/progress/get",
  authMiddleware,
  learnerMiddleware,
  progressController.getProgress
);

// Routes des notifications
router.get(
  "/notifications",
  authMiddleware,
  learnerMiddleware,
  notificationsController.getMyNotifications
);
router.get(
  "/notifications/unread-count",
  authMiddleware,
  learnerMiddleware,
  notificationsController.getUnreadCount
);
router.patch(
  "/notifications/:id/read",
  authMiddleware,
  learnerMiddleware,
  notificationsController.markAsRead
);
router.delete(
  "/notifications/:id",
  authMiddleware,
  learnerMiddleware,
  notificationsController.deleteNotification
);

// Routes de suivi de contenu
router.post("/content/visit", authMiddleware, learnerMiddleware, (req, res) => {
  // Endpoint temporaire qui retourne un succès
  res.json({
    success: true,
    data: {
      id: "temp",
      ...req.body,
      userId: req.user.userId,
      visitedAt: new Date(),
    },
  });
});

router.get("/content/visits", authMiddleware, learnerMiddleware, (req, res) => {
  // Endpoint temporaire qui retourne des données vides
  res.json({
    success: true,
    data: [],
  });
});

router.get(
  "/content/recent-activities",
  authMiddleware,
  learnerMiddleware,
  formationsController.getRecentActivities
);

// Routes du calendrier
router.get(
  "/calendar/events",
  authMiddleware,
  learnerMiddleware,
  calendarController.getUserEvents
);
router.post(
  "/calendar/events",
  authMiddleware,
  learnerMiddleware,
  calendarController.createEvent
);
router.put(
  "/calendar/events/:id",
  authMiddleware,
  learnerMiddleware,
  calendarController.updateEvent
);
router.delete(
  "/calendar/events/:id",
  authMiddleware,
  learnerMiddleware,
  calendarController.deleteEvent
);
router.get(
  "/calendar/events/range",
  authMiddleware,
  learnerMiddleware,
  calendarController.getEventsByDateRange
);
router.get(
  "/calendar/upcoming",
  authMiddleware,
  learnerMiddleware,
  calendarController.getUpcomingDeadlines
);

// Routes d'intégration calendrier
router.get(
  "/calendar/integrations",
  authMiddleware,
  learnerMiddleware,
  calendarIntegrationController.getUserIntegrations
);
router.get(
  "/calendar/oauth/google/init",
  authMiddleware,
  learnerMiddleware,
  calendarIntegrationController.initiateGoogleOAuth
);
router.get(
  "/calendar/oauth/google/callback",
  calendarIntegrationController.handleGoogleOAuthCallback
);
router.get(
  "/calendar/oauth/outlook/init",
  authMiddleware,
  learnerMiddleware,
  calendarIntegrationController.initiateOutlookOAuth
);
router.get(
  "/calendar/oauth/outlook/callback",
  calendarIntegrationController.handleOutlookOAuthCallback
);
router.delete(
  "/calendar/integrations/:id",
  authMiddleware,
  learnerMiddleware,
  calendarIntegrationController.disconnectIntegration
);
router.post(
  "/calendar/sync/google",
  authMiddleware,
  learnerMiddleware,
  calendarIntegrationController.syncGoogleCalendar
);
router.post(
  "/calendar/sync/outlook",
  authMiddleware,
  learnerMiddleware,
  calendarIntegrationController.syncOutlookCalendar
);

// Route temporaire pour les certificats
router.get("/certificates", authMiddleware, learnerMiddleware, (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

// Routes des opportunités (fichiers PDF de présentation)
router.get(
  "/opportunities/files",
  authMiddleware,
  learnerMiddleware,
  opportunitiesController.getPresentationFiles
);

// Route supprimée - utilisation de la route publique /api/opportunities/files/:filename

export default router;
