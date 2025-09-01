import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";
import {
  uploadSingleImage,
  uploadSingleVideo,
  uploadSingleFile,
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
} from "../controllers/admin.controllers.js";
import { uploadController } from "../controllers/upload.controller.js";
import { conversionController } from "../controllers/conversion.controller.js";
import { progressController } from "../controllers/progress.controller.js";

const router = express.Router();

// Endpoint de santé (sans authentification)
router.get("/auth/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API Backend BAI Consulting opérationnelle",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
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

router.patch(
  "/quiz/:id/toggle",
  authMiddleware,
  adminMiddleware,
  quizController.toggleQuizActive
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
// router.get(
//   "/assignments",
//   authMiddleware,
//   adminMiddleware,
//   assignmentsController.getAllAssignments
// );
// router.get(
//   "/assignments/:id",
//   authMiddleware,
//   adminMiddleware,
//   assignmentsController.getAssignmentById
// );
// router.post(
//   "/assignments",
//   authMiddleware,
//   adminMiddleware,
//   assignmentsController.createAssignment
// );
// router.put(
//   "/assignments/:id",
//   authMiddleware,
//   adminMiddleware,
//   assignmentsController.updateAssignment
// );
// router.delete(
//   "/assignments/:id",
//   authMiddleware,
//   adminMiddleware,
//   assignmentsController.deleteAssignment
// );
// router.post(
//   "/assignments/bulk",
//   authMiddleware,
//   adminMiddleware,
//   assignmentsController.bulkAssign
// );

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

// Nouvelles routes de progression pour le TestViewer
router.post("/progress/save", authMiddleware, progressController.saveProgress);
router.get("/progress/get", authMiddleware, progressController.getProgress);
router.get(
  "/progress/user/:userId/all",
  authMiddleware,
  progressController.getUserAllProgress
);

// Routes des notifications (à implémenter)
// router.get(
//   "/notifications",
//   authMiddleware,
//   adminMiddleware,
//   notificationsController.getAllNotifications
// );
// router.get(
//   "/notifications/user/:userId",
//   authMiddleware,
//   adminMiddleware,
//   notificationsController.getUserNotifications
// );
// router.post(
//   "/notifications",
//   authMiddleware,
//   adminMiddleware,
//   notificationsController.createNotification
// );
// router.patch(
//   "/notifications/:id/read",
//   authMiddleware,
//   adminMiddleware,
//   notificationsController.markAsRead
// );
// router.delete(
//   "/notifications/:id",
//   authMiddleware,
//   adminMiddleware,
//   notificationsController.deleteNotification
// );

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

export default router;
