// Type générique pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  bankId?: string;
  bank?: Bank;
  department?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  isArchived?: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Formation {
  id: string;
  title: string;
  description: string;
  duration: number;
  isActive: boolean;
  hasQuiz: boolean;
  quizRequired: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  totalDuration?: number;
  lessonCount?: number;
  bankCount?: number; // nombre de banques ayant accès
}

export interface BankFormation {
  id: string;
  bankId: string;
  formationId: string;
  isMandatory: boolean;
  assignedAt: string;
  assignedBy: string;
  updatedAt: string;
  bank?: {
    id: string;
    name: string;
    code: string;
  };
  formation?: {
    id: string;
    title: string;
    description: string;
    duration: number;
    isActive: boolean;
    hasQuiz: boolean;
  };
  userAssignments?: UserFormationAssignment[];
}

export interface UserFormationAssignment {
  id: string;
  bankFormationId: string;
  userId: string;
  isMandatory: boolean;
  dueDate?: string;
  assignedAt: string;
  assignedBy: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
    isActive: boolean;
  };
}

export interface FormationAssignment {
  id: string;
  userId: string;
  formationId: string;
  assignedBy: string;
  status: string;
  dueDate?: string;
  assignedAt: string;
  updatedAt: string;
}

export interface FormationContent {
  id: string;
  formationId: string;
  title: string;
  description?: string;
  type: string; // PRESENTATION, VIDEO, DOCUMENT, INTERACTIVE, etc.
  contentType: 'SECTION' | 'LESSON';
  sectionId?: string; // si contentType = LESSON, référence vers la section parente
  order: number;
  duration?: number; // en minutes
  fileUrl?: string;
  fileSize?: number;
  coverImage?: string; // URL de l'image de couverture
  metadata?: string; // données supplémentaires en JSON
  createdAt: Date;
  updatedAt: Date;
  lessons?: FormationContent[]; // si contentType = SECTION
}

export interface Quiz {
  id: string;
  formationId: string;
  title: string;
  description?: string;
  passingScore: number; // pourcentage minimum pour réussir (80 par défaut)
  timeLimit?: number; // en minutes, null = pas de limite
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  type: string; // multiple_choice, true_false, text
  order: number;
  points: number;
  createdAt: Date;
  updatedAt: Date;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  formationId: string;
  contentId?: string;
  progress: number; // pourcentage de progression (0-100)
  timeSpent: number; // en secondes
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  formation?: Formation;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: string; // données supplémentaires en JSON string
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  user?: User;
}

// Types pour les statistiques
export interface DashboardStats {
  totalUsers: number;
  totalFormations: number;
  totalBanks: number;
  completedFormations: number;
  activeUsers: number;
  pendingAssignments: number;
}

export interface BankStats {
  bankId: string;
  bankName: string;
  userCount: number;
  formationCount: number;
  completionRate: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
} 