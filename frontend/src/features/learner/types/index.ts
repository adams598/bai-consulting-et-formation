// Types pour l'espace apprenant
export interface LearnerFormation {
  id: string;
  title: string;
  description: string;
  duration: number; // en minutes
  coverImage?: string;
  code?: string;
  pedagogicalModality?: string;
  organization?: string;
  prerequisites?: string;
  objectives?: string[];
  detailedProgram?: string[];
  targetAudience?: string[];
  isActive: boolean;
  hasQuiz: boolean;
  quizRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearnerFormationAssignment {
  id: string;
  formationId: string;
  formation: LearnerFormation;
  status: FormationStatus;
  dueDate?: string;
  assignedAt: string;
  progress?: LearnerProgress;
}

export interface LearnerProgress {
  id: string;
  userId: string;
  formationId: string;
  lessonId: string;
  status: FormationStatus;
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
  timeSpent: number; // en minutes
  updatedAt: string;
}

export interface LearnerLesson {
  id: string;
  formationId: string;
  title: string;
  description?: string;
  type: LessonType;
  contentType: 'SECTION' | 'LESSON';
  sectionId?: string;
  order: number;
  duration?: number;
  fileUrl?: string;
  coverImage?: string;
  objectives?: string[];
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearnerQuiz {
  id: string;
  formationId: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  isActive: boolean;
  questions: LearnerQuizQuestion[];
}

export interface LearnerQuizQuestion {
  id: string;
  quizId: string;
  question: string;
  type: string;
  order: number;
  points: number;
  answers: LearnerQuizAnswer[];
}

export interface LearnerQuizAnswer {
  id: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  order: number;
}

export interface LearnerQuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt?: string;
  answers: Record<string, string>;
}

export interface LearnerCertificate {
  id: string;
  userId: string;
  formationId: string;
  formation: LearnerFormation;
  issuedAt: string;
  expiresAt?: string;
  certificateUrl?: string;
  isValid: boolean;
}

export interface LearnerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string; // Utiliser department au lieu de position
  bankId?: string;
  bank?: {
    id: string;
    name: string;
    code: string;
  };
  avatar?: string;
  notificationSettings?: {
    emailNotifications: boolean;
    formationReminders: boolean;
    progressUpdates: boolean;
    certificateAlerts: boolean;
    weeklyReports: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LearnerNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  relatedFormationId?: string;
  relatedQuizId?: string;
}

export interface LearnerStats {
  totalFormations: number;
  completedFormations: number;
  inProgressFormations: number;
  upcomingFormations: number;
  totalTimeSpent: number; // en minutes
  averageProgress: number; // 0-100
  certificatesEarned: number;
  quizzesPassed: number;
}

export interface ContentVisit {
  id: string;
  userId: string;
  formationId: string;
  lessonId?: string;
  visitedAt: string;
  timeSpent: number; // en secondes
  completed: boolean;
}

// Enums
export enum FormationStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

export enum LessonType {
  PRESENTATION = 'PRESENTATION',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  INTERACTIVE = 'INTERACTIVE',
  QUIZ = 'QUIZ'
}

export enum NotificationType {
  FORMATION_ASSIGNED = 'FORMATION_ASSIGNED',
  FORMATION_DUE = 'FORMATION_DUE',
  QUIZ_AVAILABLE = 'QUIZ_AVAILABLE',
  CERTIFICATE_EARNED = 'CERTIFICATE_EARNED',
  REMINDER = 'REMINDER'
}

// Interfaces pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
