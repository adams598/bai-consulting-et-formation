import express from "express";
import { userProgressController } from "../controllers/user-progress.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Routes pour le suivi de progression des utilisateurs
router.get("/user/:userId", userProgressController.getUserProgress);
router.get(
  "/user/:userId/summary",
  userProgressController.getUserProgressSummary
);

export default router;
