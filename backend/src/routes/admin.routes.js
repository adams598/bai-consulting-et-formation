import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";
import {
  authController,
  banksController,
  formationsController,
  usersController,
  assignmentsController,
  dashboardController,
  quizController,
  progressController,
  notificationsController,
} from "../controllers/admin.controllers.js";

const router = express.Router();

// Endpoint de santé (sans authentification)
router.get("/auth/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API Backend BAI Consulting opérationnelle",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Routes d'authentification
router.post("/auth/login", authController.login);
router.post("/auth/logout", authMiddleware, authController.logout);
router.get("/auth/me", authMiddleware, authController.getCurrentUser);
router.post("/auth/refresh", authController.refreshToken);
router.post(
  "/auth/switch-bank",
  authMiddleware,
  adminMiddleware,
  authController.switchBank
);

// Routes des banques
router.get(
  "/banks",
  authMiddleware,
  adminMiddleware,
  banksController.getAllBanks
);
router.get(
  "/banks/:id",
  authMiddleware,
  adminMiddleware,
  banksController.getBankById
);
router.post(
  "/banks",
  authMiddleware,
  adminMiddleware,
  banksController.createBank
);
router.put(
  "/banks/:id",
  authMiddleware,
  adminMiddleware,
  banksController.updateBank
);
router.delete(
  "/banks/:id",
  authMiddleware,
  adminMiddleware,
  banksController.deleteBank
);

// Routes des formations
router.get(
  "/formations",
  authMiddleware,
  adminMiddleware,
  formationsController.getAllFormations
);
router.get(
  "/formations/:id",
  authMiddleware,
  adminMiddleware,
  formationsController.getFormationById
);
router.post(
  "/formations",
  authMiddleware,
  adminMiddleware,
  formationsController.createFormation
);
router.put(
  "/formations/:id",
  authMiddleware,
  adminMiddleware,
  formationsController.updateFormation
);
router.delete(
  "/formations/:id",
  authMiddleware,
  adminMiddleware,
  formationsController.deleteFormation
);
router.patch(
  "/formations/:id/toggle-active",
  authMiddleware,
  adminMiddleware,
  formationsController.toggleActive
);
router.patch(
  "/formations/:id/toggle-mandatory",
  authMiddleware,
  adminMiddleware,
  formationsController.toggleMandatory
);

// Routes des utilisateurs
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  usersController.getAllUsers
);
router.get(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  usersController.getUserById
);
router.post(
  "/users",
  authMiddleware,
  adminMiddleware,
  usersController.createUser
);
router.put(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  usersController.updateUser
);
router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  usersController.deleteUser
);
router.patch(
  "/users/:id/toggle-active",
  authMiddleware,
  adminMiddleware,
  usersController.toggleActive
);
router.post(
  "/users/:id/reset-password",
  authMiddleware,
  adminMiddleware,
  usersController.resetPassword
);
router.post(
  "/users/:id/send-credentials",
  authMiddleware,
  adminMiddleware,
  usersController.sendCredentials
);

// Routes des assignations
router.get(
  "/assignments",
  authMiddleware,
  adminMiddleware,
  assignmentsController.getAllAssignments
);
router.get(
  "/assignments/:id",
  authMiddleware,
  adminMiddleware,
  assignmentsController.getAssignmentById
);
router.post(
  "/assignments",
  authMiddleware,
  adminMiddleware,
  assignmentsController.createAssignment
);
router.put(
  "/assignments/:id",
  authMiddleware,
  adminMiddleware,
  assignmentsController.updateAssignment
);
router.delete(
  "/assignments/:id",
  authMiddleware,
  adminMiddleware,
  assignmentsController.deleteAssignment
);
router.post(
  "/assignments/bulk",
  authMiddleware,
  adminMiddleware,
  assignmentsController.bulkAssign
);

// Routes du tableau de bord
router.get(
  "/dashboard/stats",
  authMiddleware,
  adminMiddleware,
  dashboardController.getStats
);
router.get(
  "/dashboard/bank-stats",
  authMiddleware,
  adminMiddleware,
  dashboardController.getBankStats
);
router.get(
  "/dashboard/recent-activity",
  authMiddleware,
  adminMiddleware,
  dashboardController.getRecentActivity
);

// Routes des quiz
router.get(
  "/quiz",
  authMiddleware,
  adminMiddleware,
  quizController.getAllQuizzes
);
router.get(
  "/quiz/:id",
  authMiddleware,
  adminMiddleware,
  quizController.getQuizById
);
router.post(
  "/quiz",
  authMiddleware,
  adminMiddleware,
  quizController.createQuiz
);
router.put(
  "/quiz/:id",
  authMiddleware,
  adminMiddleware,
  quizController.updateQuiz
);
router.delete(
  "/quiz/:id",
  authMiddleware,
  adminMiddleware,
  quizController.deleteQuiz
);

// Routes des progressions
router.get(
  "/progress",
  authMiddleware,
  adminMiddleware,
  progressController.getAllProgress
);
router.get(
  "/progress/user/:userId",
  authMiddleware,
  adminMiddleware,
  progressController.getUserProgress
);
router.get(
  "/progress/formation/:formationId",
  authMiddleware,
  adminMiddleware,
  progressController.getFormationProgress
);
router.put(
  "/progress/:id",
  authMiddleware,
  adminMiddleware,
  progressController.updateProgress
);

// Routes des notifications
router.get(
  "/notifications",
  authMiddleware,
  adminMiddleware,
  notificationsController.getAllNotifications
);
router.get(
  "/notifications/user/:userId",
  authMiddleware,
  adminMiddleware,
  notificationsController.getUserNotifications
);
router.post(
  "/notifications",
  authMiddleware,
  adminMiddleware,
  notificationsController.createNotification
);
router.patch(
  "/notifications/:id/read",
  authMiddleware,
  adminMiddleware,
  notificationsController.markAsRead
);
router.delete(
  "/notifications/:id",
  authMiddleware,
  adminMiddleware,
  notificationsController.deleteNotification
);

export default router;
