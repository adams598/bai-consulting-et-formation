export interface Bank {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  bankId?: string;
  department?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BANK_ADMIN = 'BANK_ADMIN',
  COLLABORATOR = 'COLLABORATOR'
}

export interface Formation {
  id: string;
  title: string;
  description: string;
  duration: number; // en minutes
  type: FormationType;
  content: FormationContent[];
  isActive: boolean;
  isMandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  bankId?: string; // null pour les formations globales
}

export enum FormationType {
  VIDEO = 'VIDEO',
  SLIDES = 'SLIDES',
  DOCUMENT = 'DOCUMENT',
  MIXED = 'MIXED'
}

export interface FormationContent {
  id: string;
  title: string;
  type: ContentType;
  order: number;
  duration?: number;
  url?: string;
  filePath?: string;
  description?: string;
}

export enum ContentType {
  VIDEO = 'VIDEO',
  SLIDE = 'SLIDE',
  DOCUMENT = 'DOCUMENT',
  QUIZ = 'QUIZ'
}

export interface FormationAssignment {
  id: string;
  formationId: string;
  userId: string;
  assignedBy: string;
  assignedAt: Date;
  dueDate?: Date;
  isMandatory: boolean;
  status: AssignmentStatus;
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED'
}

export interface Quiz {
  id: string;
  formationId: string;
  questions: QuizQuestion[];
  passingScore: number; // 80 par défaut
  timeLimit?: number; // en minutes
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
}

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE'
}

export interface UserProgress {
  id: string;
  userId: string;
  formationId: string;
  currentContentId?: string;
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  attempts: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedId?: string; // formationId, assignmentId, etc.
}

export enum NotificationType {
  FORMATION_ASSIGNED = 'FORMATION_ASSIGNED',
  FORMATION_MANDATORY = 'FORMATION_MANDATORY',
  FORMATION_SCHEDULED = 'FORMATION_SCHEDULED',
  FORMATION_COMPLETED = 'FORMATION_COMPLETED',
  QUIZ_FAILED = 'QUIZ_FAILED',
  REMINDER = 'REMINDER'
}

export interface AdminDashboardStats {
  totalBanks: number;
  totalUsers: number;
  totalFormations: number;
  activeAssignments: number;
  completedFormations: number;
  averageScore: number;
}

export interface BankStats {
  bankId: string;
  bankName: string;
  totalUsers: number;
  totalFormations: number;
  activeAssignments: number;
  completedFormations: number;
  averageScore: number;
} 