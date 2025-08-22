import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { learnerMiddleware } from "../middleware/learner.middleware.js";
import {
  authController,
  formationsController,
  progressController,
  quizController,
  notificationsController,
} from "../controllers/learner.controllers.js";

const router = express.Router();

// Endpoint de santé (sans authentification)
router.get("/auth/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API Learner BAI Consulting opérationnelle",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Routes d'authentification pour apprenants
router.post("/auth/login", authController.login);
router.post("/auth/logout", authMiddleware, authController.logout);
router.get("/auth/me", authMiddleware, authController.getCurrentUser);
router.post("/auth/refresh", authController.refreshToken);
router.post("/auth/change-password", authMiddleware, authController.changePassword);

// Routes des formations pour apprenants
router.get(
  "/formations",
  authMiddleware,
  learnerMiddleware,
  formationsController.getMyFormations
);
router.get(
  "/formations/:id",
  authMiddleware,
  learnerMiddleware,
  formationsController.getFormationById
);
router.post(
  "/formations/:id/start",
  authMiddleware,
  learnerMiddleware,
  formationsController.startFormation
);
router.post(
  "/formations/:id/complete",
  authMiddleware,
  learnerMiddleware,
  formationsController.completeFormation
);

// Routes de progression
router.get(
  "/progress",
  authMiddleware,
  learnerMiddleware,
  progressController.getMyProgress
);
router.get(
  "/progress/:formationId",
  authMiddleware,
  learnerMiddleware,
  progressController.getFormationProgress
);
router.post(
  "/progress/:formationId/update",
  authMiddleware,
  learnerMiddleware,
  progressController.updateProgress
);

// Routes des quiz
router.get(
  "/quiz/:formationId",
  authMiddleware,
  learnerMiddleware,
  quizController.getQuiz
);
router.post(
  "/quiz/:formationId/submit",
  authMiddleware,
  learnerMiddleware,
  quizController.submitQuiz
);

// Routes des notifications
router.get(
  "/notifications",
  authMiddleware,
  learnerMiddleware,
  notificationsController.getMyNotifications
);
router.patch(
  "/notifications/:id/read",
  authMiddleware,
  learnerMiddleware,
  notificationsController.markAsRead
);

// Routes du dashboard apprenant
router.get(
  "/dashboard",
  authMiddleware,
  learnerMiddleware,
  (req, res) => {
    res.json({
      success: true,
      data: {
        totalFormations: 6,
        completedFormations: 2,
        inProgressFormations: 1,
        pendingFormations: 3,
        averageScore: 85,
        recentActivity: [
          {
            id: "1",
            type: "FORMATION_COMPLETED",
            title: "Compliance bancaire",
            date: new Date().toISOString(),
            score: 90
          },
          {
            id: "2",
            type: "FORMATION_STARTED",
            title: "Gestion des risques",
            date: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      }
    });
  }
);

export default router; 