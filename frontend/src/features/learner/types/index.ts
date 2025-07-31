export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'learner' | 'admin';
  avatar?: string;
  company?: string;
  position?: string;
  joinDate: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: 'banque' | 'assurance' | 'immobilier';
  level: 'débutant' | 'intermédiaire' | 'avancé';
  duration: number; // en minutes
  modules: Module[];
  instructor: {
    name: string;
    avatar: string;
    title: string;
  };
  rating: number;
  enrolledCount: number;
  price?: number;
  isFree: boolean;
  certificate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  quiz?: Quiz;
  duration: number; // en minutes
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'exercise';
  content: {
    videoUrl?: string;
    documentUrl?: string;
    quizId?: string;
    exerciseId?: string;
  };
  duration: number; // en minutes
  isCompleted: boolean;
  resources?: Resource[];
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  passingScore: number;
  attempts: number;
  timeLimit?: number; // en minutes
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'open-ended';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'video';
  url: string;
}

export interface Progress {
  courseId: string;
  userId: string;
  completedLessons: string[];
  quizScores: {
    quizId: string;
    score: number;
    attempts: number;
    passed: boolean;
  }[];
  currentModule: number;
  currentLesson: number;
  overallProgress: number;
  lastAccessed: Date;
  certificate?: {
    id: string;
    issuedAt: Date;
    downloadUrl: string;
  };
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: Date;
  downloadUrl: string;
  verificationCode: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: Course[];
  duration: number; // en minutes
  level: 'débutant' | 'intermédiaire' | 'avancé';
  category: 'banque' | 'assurance' | 'immobilier';
  isRecommended: boolean;
} 