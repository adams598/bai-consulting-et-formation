import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { learnerDashboardController } from "../controllers/learner-dashboard.controller.js";
import { learnerFormationsController } from "../controllers/learner-formations.controller.js";
import { learnerCertificatesController } from "../controllers/learner-certificates.controller.js";
import { progressController } from "../controllers/progress.controller.js";
import { quizController } from "../controllers/quiz.controller.js";

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Routes du dashboard apprenant
router.get("/dashboard/stats", learnerDashboardController.getDashboardStats);
router.get(
  "/dashboard/activities",
  learnerDashboardController.getRecentActivities
);
router.get(
  "/dashboard/deadlines",
  learnerDashboardController.getUpcomingDeadlines
);

// Routes des formations apprenant
router.get("/formations", learnerFormationsController.getAssignedFormations);
router.get(
  "/formations/:formationId/content",
  learnerFormationsController.getFormationContent
);
router.post(
  "/formations/start-lesson",
  learnerFormationsController.startLesson
);
router.put(
  "/formations/update-progress",
  learnerFormationsController.updateLessonProgress
);

// Routes des certificats apprenant
router.get("/certificates", learnerCertificatesController.getCertificates);
router.get(
  "/certificates/stats",
  learnerCertificatesController.getCertificateStats
);
router.get(
  "/certificates/:certificateId/download",
  learnerCertificatesController.downloadCertificate
);
router.get(
  "/certificates/:certificateNumber/verify",
  learnerCertificatesController.verifyCertificate
);

// Routes de progression (réutilisées depuis le contrôleur existant)
router.get("/progress", progressController.getUserProgress);
router.get("/progress/:formationId", progressController.getFormationProgress);
router.put("/progress/:progressId", progressController.updateProgress);

// Routes des quiz (réutilisées depuis le contrôleur existant)
router.get("/quiz/:quizId", quizController.getQuizById);
router.post("/quiz/:quizId/attempt", quizController.submitQuizAttempt);
router.get("/quiz/:quizId/attempts", quizController.getUserQuizAttempts);

export default router;
