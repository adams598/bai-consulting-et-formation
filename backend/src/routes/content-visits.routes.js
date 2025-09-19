import express from "express";
import { contentVisitsController } from "../controllers/content-visits.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Routes pour les consultations de contenu
router.get("/user/:userId/recent", contentVisitsController.getUserRecentVisits);
router.get("/user/:userId/last", contentVisitsController.getLastContentVisit);
router.get("/user/:userId/stats", contentVisitsController.getUserVisitStats);

export default router;
