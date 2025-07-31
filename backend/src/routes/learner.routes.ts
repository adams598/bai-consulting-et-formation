import { Router } from 'express';
import { CourseService } from '../services/course.service';
import { AuthService } from '../services/auth.service';
import { QuizService } from '../services/quiz.service';
import { CertificateService } from '../services/certificate.service';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();
const courseService = new CourseService();
const authService = new AuthService();
const quizService = new QuizService();
const certificateService = new CertificateService();

// Routes d'authentification
router.post('/register', async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);
    res.json({ message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.' });
  } catch (error) {
    next(error);
  }
});

// Routes protégées
router.use(authenticate);
router.use(requireRole(['LEARNER']));

// Profil utilisateur
router.get('/profile', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await authService.validateToken(req.headers.authorization!.split(' ')[1]);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/profile', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await authService.updateProfile(req.user!.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/change-password', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    next(error);
  }
});

// Cours
router.get('/courses', async (req, res, next) => {
  try {
    const courses = await courseService.getAllCourses(req.query);
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

router.get('/courses/:id', async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.json(course);
  } catch (error) {
    next(error);
  }
});

router.post('/courses/:id/enroll', async (req: AuthenticatedRequest, res, next) => {
  try {
    const enrollment = await courseService.enrollUserInCourse(
      req.user!.id,
      req.params.id
    );
    res.status(201).json(enrollment);
  } catch (error) {
    next(error);
  }
});

router.get('/courses/:id/progress', async (req: AuthenticatedRequest, res, next) => {
  try {
    const progress = await courseService.getCourseProgress(
      req.user!.id,
      req.params.id
    );
    res.json(progress);
  } catch (error) {
    next(error);
  }
});

router.put('/courses/:courseId/lessons/:lessonId/progress', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { completed } = req.body;
    const progress = await courseService.updateLessonProgress(
      req.user!.id,
      req.params.courseId,
      req.params.lessonId,
      completed
    );
    res.json(progress);
  } catch (error) {
    next(error);
  }
});

router.get('/enrolled-courses', async (req: AuthenticatedRequest, res, next) => {
  try {
    const enrollments = await courseService.getEnrolledCourses(req.user!.id);
    res.json(enrollments);
  } catch (error) {
    next(error);
  }
});

// Quiz
router.get('/quizzes/:id', async (req, res, next) => {
  try {
    const quiz = await quizService.getQuizById(req.params.id);
    res.json(quiz);
  } catch (error) {
    next(error);
  }
});

router.post('/quizzes/:id/attempt', async (req: AuthenticatedRequest, res, next) => {
  try {
    const attempt = await quizService.submitQuizAttempt(
      req.user!.id,
      req.params.id,
      req.body.answers
    );
    res.status(201).json(attempt);
  } catch (error) {
    next(error);
  }
});

router.get('/quizzes/:id/attempts', async (req: AuthenticatedRequest, res, next) => {
  try {
    const attempts = await quizService.getQuizAttempts(
      req.user!.id,
      req.params.id
    );
    res.json(attempts);
  } catch (error) {
    next(error);
  }
});

router.get('/quizzes/:id/statistics', async (req: AuthenticatedRequest, res, next) => {
  try {
    const statistics = await quizService.getQuizStatistics(req.params.id);
    res.json(statistics);
  } catch (error) {
    next(error);
  }
});

// Certificats
router.post('/courses/:id/certificate', async (req: AuthenticatedRequest, res, next) => {
  try {
    const certificate = await certificateService.generateCertificate(
      req.user!.id,
      req.params.id
    );
    res.status(201).json(certificate);
  } catch (error) {
    next(error);
  }
});

router.get('/certificates', async (req: AuthenticatedRequest, res, next) => {
  try {
    const certificates = await certificateService.getUserCertificates(req.user!.id);
    res.json(certificates);
  } catch (error) {
    next(error);
  }
});

router.get('/certificates/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const certificate = await certificateService.getCertificateById(req.params.id);
    res.json(certificate);
  } catch (error) {
    next(error);
  }
});

router.get('/certificates/verify/:code', async (req, res, next) => {
  try {
    const result = await certificateService.verifyCertificate(req.params.code);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router; 