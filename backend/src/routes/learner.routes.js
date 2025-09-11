import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { learnerMiddleware } from "../middleware/learner.middleware.js";
import {
  authController,
  formationsController,
  formationContentController,
} from "../controllers/admin.controllers.js";
import { progressController } from "../controllers/progress.controller.js";
import { quizController as learnerQuizController } from "../controllers/quiz.controller.js";
import { notificationsController } from "../controllers/notifications.controller.js";

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
router.get(
  "/formations",
  authMiddleware,
  formationsController.getAllFormations
);
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
router.get("/progress", authMiddleware, progressController.getUserProgress);
router.put("/progress/:id", authMiddleware, progressController.updateProgress);
router.post("/progress/save", authMiddleware, progressController.saveProgress);
router.get("/progress/get", authMiddleware, progressController.getProgress);

// Routes des notifications
router.get(
  "/notifications",
  authMiddleware,
  notificationsController.getUserNotifications
);
router.patch(
  "/notifications/:id/read",
  authMiddleware,
  notificationsController.markAsRead
);
router.delete(
  "/notifications/:id",
  authMiddleware,
  notificationsController.deleteNotification
);

export default router;
