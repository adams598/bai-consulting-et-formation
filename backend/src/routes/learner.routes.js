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
  notificationsController 
} from "../controllers/learner.controllers.js";
import { quizController as learnerQuizController } from "../controllers/quiz.controller.js";

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
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/profile/password", authMiddleware, authController.changePassword);

// Routes des formations
router.get("/formations", authMiddleware, formationsController.getMyFormations);
router.get(
  "/formations/:id",
  authMiddleware,
  formationsController.getFormationById
);
router.get(
  "/formations/:id/content",
  authMiddleware,
  formationContentController.getByFormation
);
router.post(
  "/formations/schedule",
  authMiddleware,
  formationsController.scheduleFormation
);

// Routes des quiz pour apprenants
router.get("/quiz/:id", authMiddleware, learnerQuizController.getQuizById);
router.post(
  "/quiz/:quizId/start",
  authMiddleware,
  learnerQuizController.startQuizAttempt
);
router.post(
  "/quiz/attempt/:attemptId/submit",
  authMiddleware,
  learnerQuizController.submitQuizAttempt
);
router.get(
  "/quiz/attempts",
  authMiddleware,
  learnerQuizController.getUserQuizAttempts
);

// Routes des progressions
router.get("/progress", authMiddleware, progressController.getMyProgress);
router.get("/progress/stats", authMiddleware, progressController.getStats);
router.put("/progress/:id", authMiddleware, progressController.updateProgress);
router.post("/progress/save", authMiddleware, progressController.saveProgress);
router.get("/progress/get", authMiddleware, progressController.getProgress);

// Routes des notifications
router.get("/notifications", authMiddleware, notificationsController.getMyNotifications);
router.get("/notifications/unread-count", authMiddleware, notificationsController.getUnreadCount);
router.patch("/notifications/:id/read", authMiddleware, notificationsController.markAsRead);
router.delete("/notifications/:id", authMiddleware, notificationsController.deleteNotification);

// Routes de suivi de contenu
router.post("/content/visit", authMiddleware, (req, res) => {
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

router.get("/content/visits", authMiddleware, (req, res) => {
  // Endpoint temporaire qui retourne des données vides
  res.json({
    success: true,
    data: [],
  });
});

// Route temporaire pour les certificats
router.get("/certificates", authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

export default router;
