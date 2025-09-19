import { api } from '../config/api';

export interface UserProgressData {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  bank?: {
    name: string;
    code: string;
  };
  
  // Statistiques générales
  totalFormations: number;
  completedFormations: number;
  inProgressFormations: number;
  pendingFormations: number;
  totalTimeSpent: number; // en minutes
  
  // Progression détaillée
  formations: FormationProgress[];
  
  // Quiz
  totalQuizAttempts: number;
  passedQuizAttempts: number;
  failedQuizAttempts: number;
  averageQuizScore: number;
  
  // Activité récente
  lastActivity?: string;
  lastFormationViewed?: string;
  lastFormationViewedDate?: string;
  
  // Formations planifiées
  scheduledFormations: ScheduledFormation[];
}

export interface FormationProgress {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
  timeSpent: number; // en minutes
  hasQuiz: boolean;
  quizPassed?: boolean;
  quizScore?: number;
  certificateEarned?: boolean;
}

export interface ScheduledFormation {
  id: string;
  title: string;
  scheduledDate: string;
  isMandatory: boolean;
  status: 'upcoming' | 'overdue';
}

export interface UserProgressSummary {
  totalFormations: number;
  completedFormations: number;
  inProgressFormations: number;
  pendingFormations: number;
  totalQuizAttempts: number;
  passedQuizAttempts: number;
  failedQuizAttempts: number;
  lastActivity?: string;
}

export const userProgressApi = {
  // Obtenir la progression détaillée d'un utilisateur
  getUserProgress: async (userId: string): Promise<UserProgressData> => {
    const response = await api.get(`/api/user-progress/user/${userId}`);
    return response.data.data;
  },

  // Obtenir un résumé rapide de la progression d'un utilisateur
  getUserProgressSummary: async (userId: string): Promise<UserProgressSummary> => {
    const response = await api.get(`/api/user-progress/user/${userId}/summary`);
    return response.data.data;
  }
};
