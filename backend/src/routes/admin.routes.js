import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";
import {
  uploadSingleImage,
  uploadSingleVideo,
  uploadSingleFile,
  uploadOpportunitiesFile,
  uploadProfileImage,
  uploadFormationImage,
  uploadLessonFile,
  uploadLessonCoverImage,
  createLessonFileUploadMiddleware,
  createLessonCoverUploadMiddleware,
  handleMulterError,
} from "../middleware/upload.middleware.js";
import {
  authController,
  banksController,
  formationsController,
  usersController,
  dashboardController,
  formationContentController,
  quizController,
  bankFormationController,
  userFormationAssignmentController,
  universeController,
} from "../controllers/admin.controllers.js";
import { uploadController } from "../controllers/upload.controller.js";
import { conversionController } from "../controllers/conversion.controller.js";
import { progressController } from "../controllers/progress.controller.js";
import { quizController as newQuizController } from "../controllers/quiz.controller.js";
import { notificationsController } from "../controllers/notifications.controller.js";
import { advancedAssignmentsController } from "../controllers/advanced-assignments.controller.js";
import { formationAssignmentsController } from "../controllers/formation-assignments.controller.js";
import { certificatesController } from "../controllers/certificates.controller.js";
import { opportunitiesController } from "../controllers/opportunities.controller.js";
import {
  getMetricsMiddleware,
  getLogsMiddleware,
  resetMetricsMiddleware,
  cleanupLogsMiddleware,
} from "../middleware/monitoring.middleware.js";

const router = express.Router();

// Endpoint de santé amélioré (sans authentification)
router.get("/auth/health", async (req, res) => {
  try {
    const healthChecks = {
      database: { status: "unknown", responseTime: 0 },
      cache: { status: "unknown", responseTime: 0 },
      storage: { status: "unknown", responseTime: 0 },
    };

    // Vérification de la base de données
    const dbStart = Date.now();
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.database = {
        status: "healthy",
        responseTime: Date.now() - dbStart,
      };
    } catch (error) {
      healthChecks.database = {
        status: "unhealthy",
        responseTime: Date.now() - dbStart,
        error: error.message,
      };
    }

    // Vérification du cache Redis
    const cacheStart = Date.now();
    try {
      const cacheService = (await import("../services/cache.service.js"))
        .default;
      const cacheStatus = cacheService.getStatus();
      healthChecks.cache = {
        status: "healthy", // Toujours healthy car nous avons un fallback en mémoire
        responseTime: Date.now() - cacheStart,
        host: cacheStatus.host,
        port: cacheStatus.port,
        redisConnected: cacheStatus.connected,
        fallbackMode: !cacheStatus.connected,
      };
    } catch (error) {
      healthChecks.cache = {
        status: "healthy", // Même en cas d'erreur, le cache mémoire fonctionne
        responseTime: Date.now() - cacheStart,
        error: error.message,
        fallbackMode: true,
      };
    }

    // Vérification du stockage
    const storageStart = Date.now();
    try {
      const fs = await import("fs");
      const path = await import("path");
      const uploadPath = path.join(process.cwd(), "uploads");

      if (fs.existsSync(uploadPath)) {
        healthChecks.storage = {
          status: "healthy",
          responseTime: Date.now() - storageStart,
          path: uploadPath,
        };
      } else {
        healthChecks.storage = {
          status: "unhealthy",
          responseTime: Date.now() - storageStart,
          error: "Upload directory does not exist",
        };
      }
    } catch (error) {
      healthChecks.storage = {
        status: "unhealthy",
        responseTime: Date.now() - storageStart,
        error: error.message,
      };
    }

    // Déterminer le statut global
    const allHealthy = Object.values(healthChecks).every(
      (check) => check.status === "healthy"
    );
    const status = allHealthy ? "healthy" : "degraded";

    res.status(allHealthy ? 200 : 503).json({
      status,
      message: allHealthy
        ? "API Backend BAI Consulting opérationnelle"
        : "API Backend BAI Consulting avec problèmes détectés",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      healthChecks,
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      message: "Erreur lors de la vérification de santé",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Routes d'authentification
router.post("/auth/login", authController.login);
router.post("/auth/logout", authMiddleware, authController.logout);
router.get("/auth/me", authMiddleware, authController.getCurrentUser);
// router.post("/auth/refresh", authController.refreshToken); // À implémenter
// router.post(
//   "/auth/switch-bank",
//   authMiddleware,
//   adminMiddleware,
//   authController.switchBank
// ); // À implémenter

// Routes de gestion du profil
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/profile/password", authMiddleware, authController.changePassword);

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
router.patch(
  "/banks/:id/archive",
  authMiddleware,
  adminMiddleware,
  banksController.archiveBank
);
router.patch(
  "/banks/:id/toggle",
  authMiddleware,
  adminMiddleware,
  banksController.toggleActive
);

// Routes des formations
router.get(
  "/formations",
  authMiddleware,
  adminMiddleware,
  formationsController.getAllFormationsSimple
);

// Route spéciale pour les COLLABORATOR - accès à leurs formations assignées
router.get(
  "/formations/my-assignments",
  authMiddleware, // Seul authMiddleware, pas adminMiddleware
  async (req, res) => {
    try {
      const user = req.user;

      // Si c'est un admin, rediriger vers la route normale
      if (user.role === "SUPER_ADMIN" || user.role === "BANK_ADMIN") {
        return res.status(400).json({
          success: false,
          message: "Les administrateurs doivent utiliser la route /formations",
        });
      }

      // Pour les COLLABORATOR, utiliser le contrôleur learner
      const { formationsController: learnerFormationsController } =
        await import("../controllers/learner.controllers.js");
      return learnerFormationsController.getMyFormations(req, res);
    } catch (error) {
      console.error("Erreur dans /formations/my-assignments:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  }
);
router.get(
  "/formations/paginated",
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

// Routes du contenu des formations
router.get(
  "/formations/:formationId/content",
  authMiddleware,
  adminMiddleware,
  formationContentController.getByFormation
);

router.post(
  "/formations/:formationId/sections",
  authMiddleware,
  adminMiddleware,
  formationContentController.addSection
);

router.post(
  "/formations/:formationId/lessons",
  authMiddleware,
  adminMiddleware,
  formationContentController.addLesson
);

router.put(
  "/formations/sections/:id",
  authMiddleware,
  adminMiddleware,
  formationContentController.updateSection
);

router.put(
  "/formations/lessons/:id",
  authMiddleware,
  adminMiddleware,
  formationContentController.updateLesson
);

router.delete(
  "/formations/sections/:id",
  authMiddleware,
  adminMiddleware,
  formationContentController.deleteSection
);

router.delete(
  "/formations/lessons/:id",
  authMiddleware,
  adminMiddleware,
  formationContentController.deleteLesson
);

router.put(
  "/formations/:formationId/reorder",
  authMiddleware,
  adminMiddleware,
  formationContentController.reorderContent
);

// Routes des quiz
router.post(
  "/formations/:formationId/quiz",
  authMiddleware,
  adminMiddleware,
  newQuizController.createQuiz
);

router.put(
  "/quiz/:id",
  authMiddleware,
  adminMiddleware,
  newQuizController.updateQuiz
);

router.delete(
  "/quiz/:id",
  authMiddleware,
  adminMiddleware,
  newQuizController.deleteQuiz
);

router.patch(
  "/quiz/:id/toggle",
  authMiddleware,
  adminMiddleware,
  newQuizController.toggleQuizActive
);

router.get(
  "/quiz/:quizId/stats",
  authMiddleware,
  adminMiddleware,
  newQuizController.getQuizStats
);

// Routes des assignations banque-formation
router.post(
  "/bank-formations",
  authMiddleware,
  adminMiddleware,
  bankFormationController.assignFormationToBank
);

router.get(
  "/banks/:bankId/formations",
  authMiddleware,
  adminMiddleware,
  bankFormationController.getBankFormations
);

// Routes pour les statistiques des formations
router.get(
  "/formations/:formationId/banks",
  authMiddleware,
  adminMiddleware,
  bankFormationController.getFormationBanks
);

router.get(
  "/formations/:formationId/stats",
  authMiddleware,
  adminMiddleware,
  bankFormationController.getFormationStats
);

router.get(
  "/formations/stats/all",
  authMiddleware,
  adminMiddleware,
  formationsController.getAllFormationsStats
);

router.patch(
  "/bank-formations/:id/mandatory",
  authMiddleware,
  adminMiddleware,
  bankFormationController.updateFormationMandatory
);

router.delete(
  "/bank-formations/:id",
  authMiddleware,
  adminMiddleware,
  bankFormationController.removeFormationFromBank
);

// Routes des assignations utilisateurs aux formations
router.post(
  "/bank-formations/:bankFormationId/users",
  authMiddleware,
  adminMiddleware,
  userFormationAssignmentController.assignUsersToFormation
);

router.post(
  "/bank-formations/:bankFormationId/users/group",
  authMiddleware,
  adminMiddleware,
  userFormationAssignmentController.assignUsersByGroup
);

router.post(
  "/assignments/bulk-formations",
  authMiddleware,
  adminMiddleware,
  userFormationAssignmentController.bulkAssignFormationsToUsers
);

router.patch(
  "/user-formation-assignments/:id",
  authMiddleware,
  adminMiddleware,
  userFormationAssignmentController.updateUserFormationMandatory
);

router.delete(
  "/user-formation-assignments/:id",
  authMiddleware,
  adminMiddleware,
  userFormationAssignmentController.removeUserFromFormation
);

router.get(
  "/bank-formations/:bankFormationId/users",
  authMiddleware,
  adminMiddleware,
  userFormationAssignmentController.getFormationUserAssignments
);

// Routes des assignations avancées
router.post(
  "/assignments/bulk-banks",
  authMiddleware,
  adminMiddleware,
  advancedAssignmentsController.bulkAssignToBanks
);

router.post(
  "/assignments/bulk-users",
  authMiddleware,
  adminMiddleware,
  advancedAssignmentsController.bulkAssignUsers
);

router.post(
  "/assignments/by-criteria",
  authMiddleware,
  adminMiddleware,
  advancedAssignmentsController.assignByCriteria
);

router.post(
  "/assignments/send-reminders",
  authMiddleware,
  adminMiddleware,
  advancedAssignmentsController.sendReminders
);

router.get(
  "/assignments/:bankFormationId/stats",
  authMiddleware,
  adminMiddleware,
  advancedAssignmentsController.getAssignmentStats
);

// Routes des certificats
router.post(
  "/certificates/generate/:userId/:formationId",
  authMiddleware,
  adminMiddleware,
  certificatesController.generateCertificate
);

router.post(
  "/certificates/generate-bulk/:formationId",
  authMiddleware,
  adminMiddleware,
  certificatesController.generateBulkCertificates
);

router.get(
  "/certificates",
  authMiddleware,
  adminMiddleware,
  certificatesController.getAllCertificates
);

router.get(
  "/certificates/user/:userId",
  authMiddleware,
  adminMiddleware,
  certificatesController.getUserCertificates
);

router.get(
  "/certificates/:certificateId/download",
  authMiddleware,
  certificatesController.downloadCertificate
);

router.get(
  "/certificates/verify/:certificateNumber",
  certificatesController.verifyCertificate
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

// Routes des assignations (à implémenter)
// Routes des assignations directes formation-utilisateur
router.get(
  "/assignments",
  authMiddleware,
  adminMiddleware,
  formationAssignmentsController.getAllAssignments
);
router.get(
  "/assignments/:id",
  authMiddleware,
  adminMiddleware,
  formationAssignmentsController.getAssignmentById
);
router.post(
  "/assignments",
  authMiddleware,
  adminMiddleware,
  formationAssignmentsController.createAssignment
);
router.put(
  "/assignments/:id",
  authMiddleware,
  adminMiddleware,
  formationAssignmentsController.updateAssignment
);
router.delete(
  "/assignments/:id",
  authMiddleware,
  adminMiddleware,
  formationAssignmentsController.deleteAssignment
);
router.post(
  "/assignments/bulk",
  authMiddleware,
  adminMiddleware,
  formationAssignmentsController.bulkAssign
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
router.get(
  "/dashboard/alerts",
  authMiddleware,
  adminMiddleware,
  dashboardController.getAlerts
);
router.get(
  "/dashboard/formation-performance",
  authMiddleware,
  adminMiddleware,
  dashboardController.getFormationPerformance
);

// Routes des opportunités commerciales
router.get(
  "/opportunities/files",
  authMiddleware,
  adminMiddleware,
  opportunitiesController.getPresentationFiles
);

router.post(
  "/opportunities/files",
  authMiddleware,
  adminMiddleware,
  uploadOpportunitiesFile,
  opportunitiesController.uploadPresentationFile
);

router.delete(
  "/opportunities/files/:fileName",
  authMiddleware,
  adminMiddleware,
  opportunitiesController.deletePresentationFile
);

router.options("/opportunities/files/:fileName", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  res.header("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.header("Cross-Origin-Opener-Policy", "unsafe-none");
  res.status(200).end();
});

router.get(
  "/opportunities/files/:fileName",
  authMiddleware,
  opportunitiesController.servePresentationFile
);

// Routes des quiz (à implémenter)
// router.get(
//   "/quiz",
//   authMiddleware,
//   adminMiddleware,
//   quizController.getAllQuizzes
// );
// router.get(
//   "/quiz/:id",
//   authMiddleware,
//   adminMiddleware,
//   quizController.getQuizById
// );
// router.post(
//   "/quiz",
//   authMiddleware,
//   adminMiddleware,
//   quizController.createQuiz
// );
// router.put(
//   "/quiz/:id",
//   authMiddleware,
//   adminMiddleware,
//   quizController.updateQuiz
// );
// router.delete(
//   "/quiz/:id",
//   authMiddleware,
//   adminMiddleware,
//   quizController.deleteQuiz
// );

// Routes des progressions
router.get(
  "/progress/user/:userId",
  authMiddleware,
  adminMiddleware,
  progressController.getUserProgress
);
router.put(
  "/progress/:id",
  authMiddleware,
  adminMiddleware,
  progressController.updateProgress
);

// Route de test pour vérifier l'authentification
router.get("/test-auth", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Authentification réussie",
    user: req.user,
  });
});

// Route de test pour la progression
router.post("/test-progress", authMiddleware, (req, res) => {
  console.log("🧪 Test progression - Données reçues:", req.body);
  console.log("🧪 Test progression - Utilisateur:", req.user);
  res.json({
    success: true,
    message: "Test progression réussi",
    data: req.body,
    user: req.user,
  });
});

// Routes de progression
router.post("/progress/save", authMiddleware, progressController.saveProgress);
router.get("/progress/get", authMiddleware, progressController.getProgress);
router.get(
  "/progress/user/:userId/all",
  authMiddleware,
  progressController.getUserProgress
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
  notificationsController.getUserNotificationsById
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
  notificationsController.markNotificationAsRead
);
router.delete(
  "/notifications/:id",
  authMiddleware,
  adminMiddleware,
  notificationsController.deleteNotification
);

// Routes d'upload
router.post("/upload/test", authMiddleware, adminMiddleware, (req, res) => {
  console.log("🔍 Test endpoint - req.body:", req.body);
  console.log("🔍 Test endpoint - req.params:", req.params);
  res.json({ success: true, message: "Test endpoint fonctionne" });
});

router.post(
  "/upload/image",
  authMiddleware,
  adminMiddleware,
  uploadSingleImage,
  handleMulterError,
  uploadController.uploadImage
);

router.post(
  "/upload/cover-image/:formationTitle",
  authMiddleware,
  adminMiddleware,
  uploadFormationImage,
  handleMulterError,
  uploadController.uploadFormationCoverImage
);

router.post(
  "/upload/lesson-cover-image",
  authMiddleware,
  adminMiddleware,
  createLessonCoverUploadMiddleware(),
  uploadSingleImage,
  handleMulterError,
  uploadController.uploadLessonCoverImage
);

router.post(
  "/upload/profile-image",
  authMiddleware,
  adminMiddleware,
  uploadProfileImage,
  handleMulterError,
  uploadController.uploadImage
);

router.post(
  "/upload/video",
  authMiddleware,
  adminMiddleware,
  uploadSingleVideo,
  handleMulterError,
  uploadController.uploadVideo
);

router.post(
  "/upload/file",
  authMiddleware,
  adminMiddleware,
  uploadSingleFile,
  handleMulterError,
  uploadController.uploadFile
);

router.post(
  "/upload/lesson-file/:formationTitle/:lessonTitle",
  authMiddleware,
  adminMiddleware,
  createLessonFileUploadMiddleware(),
  uploadSingleFile,
  uploadController.uploadLessonFile,
  handleMulterError
);

// Route pour récupérer les fichiers des leçons
router.get(
  "/lesson-file/:formationTitle/:lessonTitle/:filename",
  authMiddleware,
  uploadController.getLessonFile
);

// Route pour récupérer le fichier le plus récent d'une leçon
router.get(
  "/lesson-file/:formationTitle/:lessonTitle",
  authMiddleware,
  uploadController.getLessonFile
);

// Routes de vérification et gestion
router.get(
  "/upload/check/:contentType/:userFolder/:filename",
  authMiddleware,
  adminMiddleware,
  uploadController.checkFile
);

// Route pour vérifier les fichiers existants d'une leçon
router.get(
  "/upload/check-lesson-files/:formationTitle/:lessonTitle",
  authMiddleware,
  adminMiddleware,
  uploadController.checkLessonFiles
);

// Route pour supprimer les fichiers existants d'une leçon
router.delete(
  "/upload/delete-lesson-files/:formationTitle/:lessonTitle",
  authMiddleware,
  adminMiddleware,
  uploadController.deleteLessonFiles
);

// Route pour mettre à jour les types de fichiers existants
router.post(
  "/upload/update-file-types",
  authMiddleware,
  adminMiddleware,
  uploadController.updateExistingFileTypes
);

router.get(
  "/upload/files",
  authMiddleware,
  adminMiddleware,
  uploadController.listUserFiles
);

// Routes de conversion
router.get(
  "/convert/status/:formationTitle/:lessonTitle/:filename",
  authMiddleware,
  conversionController.getConversionStatus
);

router.post(
  "/convert/to-pdf/:formationTitle/:lessonTitle/:filename",
  authMiddleware,
  conversionController.convertToPdf
);

router.get(
  "/convert/extract-html/:formationTitle/:lessonTitle/:filename",
  authMiddleware,
  conversionController.extractHtml
);

// Routes de progression
router.get(
  "/progress/:userId/:lessonId",
  authMiddleware,
  progressController.getUserProgress
);

router.put(
  "/progress/:userId/:lessonId",
  authMiddleware,
  progressController.updateProgress
);

router.get(
  "/progress/formation/:userId/:formationId",
  authMiddleware,
  progressController.getFormationProgress
);

router.post(
  "/progress/:userId/:lessonId/complete",
  authMiddleware,
  progressController.markLessonCompleted
);

// Routes des univers
router.get(
  "/universes",
  authMiddleware,
  adminMiddleware,
  universeController.getAllUniverses
);

router.post(
  "/universes",
  authMiddleware,
  adminMiddleware,
  universeController.createUniverse
);

router.put(
  "/universes/:id",
  authMiddleware,
  adminMiddleware,
  universeController.updateUniverse
);

router.delete(
  "/universes/:id",
  authMiddleware,
  adminMiddleware,
  universeController.deleteUniverse
);

router.post(
  "/universes/move-formation",
  authMiddleware,
  adminMiddleware,
  universeController.moveFormationToUniverse
);

router.get(
  "/universes/:universeId/formations",
  authMiddleware,
  adminMiddleware,
  universeController.getUniverseFormations
);

// Endpoints de monitoring (avec authentification admin)
router.get(
  "/monitoring/metrics",
  authMiddleware,
  adminMiddleware,
  getMetricsMiddleware
);

router.get(
  "/monitoring/logs",
  authMiddleware,
  adminMiddleware,
  getLogsMiddleware
);

router.post(
  "/monitoring/reset",
  authMiddleware,
  adminMiddleware,
  resetMetricsMiddleware
);

router.post(
  "/monitoring/cleanup",
  authMiddleware,
  adminMiddleware,
  cleanupLogsMiddleware
);

export default router;
