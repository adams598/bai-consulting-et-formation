import express from "express";
import { opportunitiesController } from "../controllers/opportunities.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Routes pour les opportunités commerciales
router.get("/presentation-files", opportunitiesController.getPresentationFiles);

export default router;
