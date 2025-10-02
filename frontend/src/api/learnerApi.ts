import { 
  LearnerFormation, 
  LearnerFormationAssignment, 
  LearnerProgress, 
  LearnerLesson, 
  LearnerQuiz, 
  LearnerQuizAttempt, 
  LearnerCertificate, 
  LearnerProfile, 
  LearnerNotification, 
  LearnerStats,
  ContentVisit,
  Universe,
  ApiResponse,
  PaginatedResponse 
} from '../features/learner/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Configuration axios pour les apprenants
const createLearnerApi = () => {
  const getAuthHeaders = (): Record<string, string> => {
    // Utiliser le même système de tokens que l'admin
    let token = localStorage.getItem('bai_auth_token');
    
    // Fallback vers les autres clés possibles
    if (!token) {
      token = localStorage.getItem('accessToken') || 
              localStorage.getItem('auth_token') || 
              sessionStorage.getItem('auth_token');
    }
    
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const request = async <T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    const url = `${API_URL}/api/learner${endpoint}`;
    
    const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
        ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(error.message || 'Erreur API');
  }

  return response.json();
};

  return {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, data?: any) => 
      request<T>(endpoint, { 
        method: 'POST', 
        body: data ? JSON.stringify(data) : undefined 
      }),
    put: <T>(endpoint: string, data?: any) => 
      request<T>(endpoint, { 
        method: 'PUT', 
        body: data ? JSON.stringify(data) : undefined 
      }),
    patch: <T>(endpoint: string, data?: any) => 
      request<T>(endpoint, { 
        method: 'PATCH', 
        body: data ? JSON.stringify(data) : undefined 
      }),
    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' })
  };
};

const api = createLearnerApi();

// ===== AUTHENTIFICATION =====
export const authApi = {
  // Connexion
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: LearnerProfile }>>('/auth/login', { email, password }),
  
  // Déconnexion
  logout: () => api.post<ApiResponse<void>>('/auth/logout'),
  
  // Utilisateur connecté
  getCurrentUser: () => api.get<ApiResponse<LearnerProfile>>('/auth/me'),
  
  // Vérification de santé
  healthCheck: () => api.get<ApiResponse<{ status: string; message: string }>>('/auth/health')
};

// ===== PROFIL =====
export const profileApi = {
  // Récupérer le profil
  getProfile: () => api.get<ApiResponse<LearnerProfile>>('/profile'),
  
  // Mettre à jour le profil
  updateProfile: (data: Partial<LearnerProfile>) =>
    api.put<ApiResponse<LearnerProfile>>('/profile', data),
  
  // Changer le mot de passe
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<ApiResponse<void>>('/profile/password', { currentPassword, newPassword })
};

// ===== UNIVERS =====
export const universesApi = {
  // Récupérer tous les univers
  getAll: () => api.get<ApiResponse<Universe[]>>('/universes'),
  
  // Récupérer un univers par ID
  getById: (id: string) => api.get<ApiResponse<Universe>>(`/universes/${id}`)
};

// ===== FORMATIONS =====
export const formationsApi = {
  // Récupérer toutes les formations assignées
  getMyFormations: () => api.get<ApiResponse<LearnerFormationAssignment[]>>('/formations'),
  
  // Récupérer toutes les formations avec indication d'assignation
  getAllFormationsWithAssignment: () => api.get<ApiResponse<any[]>>('/formations/all'),
  
  // Récupérer une formation par ID
  getFormationById: (id: string) => 
    api.get<ApiResponse<LearnerFormationAssignment>>(`/formations/${id}`),
  
  // Récupérer le contenu d'une formation (leçons)
  getFormationContent: (id: string) => 
    api.get<ApiResponse<LearnerLesson[]>>(`/formations/${id}/content`),

  // Planifier une formation dans l'agenda
  scheduleFormation: (data: { formationId: string; date: string; time: string; title?: string; description?: string }) =>
    api.post<ApiResponse<any>>('/formations/schedule', data),
  
  // Récupérer les événements planifiés (échéances à venir)
  getScheduledEvents: () => api.get<ApiResponse<Array<{
    id: string;
    formationTitle: string;
    eventType: 'formation' | 'lesson' | 'quiz';
    scheduledDate: string;
    dueDate?: string;
    isMandatory: boolean;
    progress: number;
    formationId: string;
  }>>>('/formations/scheduled'),
  
  // Démarrer une formation
  startFormation: (id: string) => 
    api.post<ApiResponse<LearnerProgress>>(`/formations/${id}/start`),
  
  // Terminer une formation
  completeFormation: (id: string) => 
    api.post<ApiResponse<LearnerProgress>>(`/formations/${id}/complete`)
};

// ===== PROGRESSION =====
export const progressApi = {
  // Récupérer ma progression générale
  getMyProgress: () => api.get<ApiResponse<LearnerProgress[]>>('/progress'),
  
  // Récupérer la progression d'une formation
  getFormationProgress: (formationId: string) => 
    api.get<ApiResponse<LearnerProgress>>(`/progress/formation/${formationId}`),

  // Mettre à jour la progression
  updateProgress: (progressId: string, progress: number) =>
    api.put<ApiResponse<LearnerProgress>>(`/progress/${progressId}`, { progress }),
  
  // Sauvegarder la progression
  saveProgress: (data: {
    formationId: string;
    lessonId?: string;
    progress: number;
    timeSpent?: number;
    completed?: boolean;
  }) => api.post<ApiResponse<LearnerProgress>>('/progress/save', data),
  
  // Récupérer les statistiques
  getStats: () => api.get<ApiResponse<LearnerStats>>('/progress/stats'),
  
  // Récupérer les statistiques détaillées pour le dashboard
  getDashboardStats: () => api.get<ApiResponse<{
  totalFormations: number;
  completedFormations: number;
  inProgressFormations: number;
  pendingFormations: number;
  certificatesEarned: number;
  totalTimeSpent: number;
  averageScore: number;
  }>>('/progress/dashboard-stats')
};

// ===== QUIZ =====
export const quizApi = {
  // Récupérer un quiz par ID
  getQuizById: (id: string) => 
    api.get<ApiResponse<LearnerQuiz>>(`/quiz/${id}`),
  
  // Démarrer une tentative de quiz
  startQuizAttempt: (quizId: string) => 
    api.post<ApiResponse<LearnerQuizAttempt>>(`/quiz/${quizId}/start`),

  // Soumettre une tentative de quiz
  submitQuizAttempt: (attemptId: string, answers: Record<string, string>) =>
    api.post<ApiResponse<LearnerQuizAttempt>>(`/quiz/attempt/${attemptId}/submit`, { answers }),
  
  // Récupérer mes tentatives de quiz
  getMyAttempts: () => api.get<ApiResponse<LearnerQuizAttempt[]>>('/quiz/attempts'),
  
  // Récupérer les tentatives pour un quiz spécifique
  getQuizAttempts: (quizId: string) => 
    api.get<ApiResponse<LearnerQuizAttempt[]>>(`/quiz/${quizId}/attempts`)
};

// ===== CERTIFICATS =====
export const certificatesApi = {
  // Récupérer mes certificats
  getMyCertificates: () => api.get<ApiResponse<LearnerCertificate[]>>('/certificates'),
  
  // Récupérer un certificat par ID
  getCertificateById: (id: string) => 
    api.get<ApiResponse<LearnerCertificate>>(`/certificates/${id}`),
  
  // Télécharger un certificat
  downloadCertificate: async (id: string): Promise<Blob> => {
    const url = `${API_URL}/api/learner/certificates/${id}/download`;
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const response = await fetch(url, {
      method: 'GET',
    headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
      throw new Error('Erreur lors du téléchargement du certificat');
    }

    return response.blob();
  },
  
  // Vérifier la validité d'un certificat
  verifyCertificate: (id: string) => 
    api.get<ApiResponse<{ isValid: boolean; details: LearnerCertificate }>>(`/certificates/${id}/verify`)
};

// ===== NOTIFICATIONS =====
export const notificationsApi = {
  // Récupérer mes notifications
  getMyNotifications: (page = 1, limit = 20) => 
    api.get<PaginatedResponse<LearnerNotification>>(`/notifications?page=${page}&limit=${limit}`),
  
  // Marquer comme lu
  markAsRead: (id: string) => 
    api.patch<ApiResponse<LearnerNotification>>(`/notifications/${id}/read`),
  
  // Marquer toutes comme lues
  markAllAsRead: () => 
    api.patch<ApiResponse<void>>('/notifications/read-all'),
  
  // Supprimer une notification
  deleteNotification: (id: string) => 
    api.delete<ApiResponse<void>>(`/notifications/${id}`),
  
  // Compter les non lues
  getUnreadCount: () => 
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count')
};

// ===== SUIVI DE CONTENU =====
export const contentVisitApi = {
  // Enregistrer une visite
  recordVisit: (data: {
    formationId: string;
    lessonId?: string;
    timeSpent: number;
    completed?: boolean;
  }) => api.post<ApiResponse<ContentVisit>>('/content/visit', data),
  
  // Récupérer l'historique des visites
  getVisitHistory: (formationId?: string) => 
    api.get<ApiResponse<ContentVisit[]>>(`/content/visits${formationId ? `?formationId=${formationId}` : ''}`),
  
  // Récupérer le temps passé
  getTimeSpent: (formationId?: string) => 
    api.get<ApiResponse<{ totalTime: number; byFormation?: Record<string, number> }>>(`/content/time-spent${formationId ? `?formationId=${formationId}` : ''}`),
  
  // Récupérer les activités récentes
  getRecentActivities: (filter?: '24h' | '1week' | '1month' | '3months') => 
    api.get<ApiResponse<Array<{
      id: string;
      type: 'formation_assigned' | 'formation_started' | 'formation_completed' | 'certificate_earned' | 'formation_scheduled';
      title: string;
      description: string;
      timestamp: string;
      formationId?: string;
      assignedBy?: { firstName: string; lastName: string };
    }>>>(`/content/recent-activities${filter ? `?filter=${filter}` : ''}`)
};

// ===== CALENDRIER =====
export const calendarApi = {
  // Récupérer tous les événements de l'utilisateur
  getUserEvents: () => api.get<ApiResponse<any[]>>('/calendar/events'),
  
  // Créer un nouvel événement
  createEvent: (data: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    type?: string;
    location?: string;
    attendees?: string[];
    isAllDay?: boolean;
    color?: string;
    reminders?: number[];
    formationId?: string;
    lessonId?: string;
    eventType?: string;
  }) => api.post<ApiResponse<any>>('/calendar/events', data),
  
  // Mettre à jour un événement
  updateEvent: (id: string, data: any) => 
    api.put<ApiResponse<any>>(`/calendar/events/${id}`, data),
  
  // Supprimer un événement
  deleteEvent: (id: string) => 
    api.delete<ApiResponse<void>>(`/calendar/events/${id}`),
  
  // Récupérer les événements dans une plage de dates
  getEventsByDateRange: (startDate: string, endDate: string) => 
    api.get<ApiResponse<any[]>>(`/calendar/events/range?startDate=${startDate}&endDate=${endDate}`),
  
  // Récupérer les prochaines échéances
  getUpcomingDeadlines: () => api.get<ApiResponse<any[]>>('/calendar/upcoming')
};

// ===== OPPORTUNITÉS =====
export const opportunitiesApi = {
  // Récupérer tous les fichiers PDF de présentation des formations
  getPresentationFiles: () => 
    api.get<ApiResponse<any[]>>('/opportunities/files'),
  
  // Obtenir l'URL d'un fichier PDF (route publique comme pour les admins)
  getPresentationFileUrl: (fileName: string) => 
    `${API_URL}/api/opportunities/files/${fileName}`,
};

// Export par défaut avec toutes les API
export default {
  auth: authApi,
  profile: profileApi,
  universes: universesApi,
  formations: formationsApi,
  progress: progressApi,
  quiz: quizApi,
  certificates: certificatesApi,
  notifications: notificationsApi,
  contentVisit: contentVisitApi,
  calendar: calendarApi,
  opportunities: opportunitiesApi
};