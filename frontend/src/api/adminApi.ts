import { api } from '../config/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

import {
  Bank,
  User,
  Formation,
  FormationContent,
  FormationAssignment,
  Quiz,
  UserProgress,
  Notification,
  DashboardStats,
  BankStats,
  ApiResponse,
  BankFormation,
  UserFormationAssignment,
  Universe,
  RecentActivity,
  Alert,
  FormationPerformance,
  SystemSettings,
  SystemInfo,
  SystemHealth,
  LogEntry
} from '../features/admin/types';

// ===== BANKS API =====
export const banksApi = {
  // Récupérer toutes les banques
  getAll: () => api.get<ApiResponse<Bank[]>>('/api/admin/banks'),
  
  // Récupérer une banque par ID
  getById: (id: string) => api.get<ApiResponse<Bank>>(`/api/admin/banks/${id}`),
  
  // Créer une nouvelle banque
  create: (data: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Bank>>('/api/admin/banks', data),
  
  // Mettre à jour une banque
  update: (id: string, data: Partial<Bank>) => 
    api.put<Bank>(`/api/admin/banks/${id}`, data),
  
  // Supprimer une banque
  delete: (id: string) => api.delete(`/api/admin/banks/${id}`),
  
  // Archiver une banque
  archive: (id: string) => api.patch<Bank>(`/api/admin/banks/${id}/archive`),
  
  // Activer/Désactiver une banque
  toggleActive: (id: string) => api.patch<Bank>(`/api/admin/banks/${id}/toggle`),
  
  // Statistiques d'une banque
  getStats: (id: string) => api.get<BankStats>(`/api/admin/banks/${id}/stats`)
};

// ===== FORMATIONS API =====
export const formationsApi = {
  getAllFormations: () => api.get<ApiResponse<Formation[]>>('/api/admin/formations'),
  // Route spéciale pour les COLLABORATOR - récupère leurs formations assignées
  getMyAssignedFormations: () => api.get<ApiResponse<any[]>>('/api/admin/formations/my-assignments'),
  getFormationById: (id: string) => api.get<ApiResponse<Formation>>(`/api/admin/formations/${id}`),
  createFormation: (data: Partial<Formation>) => api.post<ApiResponse<Formation>>('/api/admin/formations', data),
  updateFormation: (id: string, data: Partial<Formation>) => api.put<ApiResponse<Formation>>(`/api/admin/formations/${id}`, data),
  deleteFormation: (id: string) => api.delete<ApiResponse<void>>(`/api/admin/formations/${id}`),
  toggleActive: (id: string) => api.patch<ApiResponse<Formation>>(`/api/admin/formations/${id}/toggle-active`),
  toggleMandatory: (id: string) => api.patch<ApiResponse<Formation>>(`/api/admin/formations/${id}/toggle-mandatory`),
};

// API pour le contenu des formations (leçons et sections)
export const formationContentApi = {
  // Récupérer tout le contenu d'une formation
  async getByFormation(formationId: string) {
    const response = await api.get(`/api/admin/formations/${formationId}/content`);
    return response.data;
  },

  // Ajouter une section
  async addSection(formationId: string, sectionData: any) {
    const response = await api.post(`/api/admin/formations/${formationId}/sections`, sectionData);
    return response.data;
  },

  // Ajouter une leçon
  async addLesson(formationId: string, lessonData: any) {
    const response = await api.post(`/api/admin/formations/${formationId}/lessons`, lessonData);
    return response.data;
  },

  // Modifier une leçon
  async updateLesson(lessonId: string, lessonData: any) {
    const response = await api.put(`/api/admin/formations/lessons/${lessonId}`, lessonData);
    return response.data;
  },

  // Supprimer une leçon
  async deleteLesson(lessonId: string) {
    const response = await api.delete(`/api/admin/formations/lessons/${lessonId}`);
    return response.data;
  },

  // Supprimer une section
  async deleteSection(sectionId: string) {
    const response = await api.delete(`/api/admin/formations/sections/${sectionId}`);
    return response.data;
  },

  // Réorganiser l'ordre des leçons
  async reorderLessons(formationId: string, lessonOrders: { id: string; order: number }[]) {
    const response = await api.put(`/api/admin/formations/${formationId}/reorder`, { content: lessonOrders });
    return response.data;
  },

  // Récupérer les progressions des leçons pour un utilisateur
  async getLessonProgress(formationId: string, userId: string) {
    const response = await api.get(`/api/admin/formations/${formationId}/progress/${userId}`);
    return response.data;
  }
};

export const quizApi = {
  createQuiz: (formationId: string, data: { title: string; description?: string; passingScore?: number; timeLimit?: number; questions: any[] }) =>
    api.post<ApiResponse<Quiz>>(`/api/admin/formations/${formationId}/quiz`, data),
  updateQuiz: (id: string, data: { title: string; description?: string; passingScore?: number; timeLimit?: number; questions: any[] }) =>
    api.put<ApiResponse<Quiz>>(`/api/admin/quiz/${id}`, data),
  deleteQuiz: (id: string) => api.delete<ApiResponse<void>>(`/api/admin/quiz/${id}`),
  toggleActive: (id: string) => api.patch<ApiResponse<Quiz>>(`/api/admin/quiz/${id}/toggle`),
};

// ===== USERS API =====
export const usersApi = {
  // Récupérer tous les utilisateurs (optionnellement filtrés par banque)
  getAll: (bankId?: string) => api.get<ApiResponse<User[]>>(`/api/admin/users${bankId ? `?bankId=${bankId}` : ''}`),
  
  // Récupérer tous les utilisateurs sans filtre
  getAllUsers: () => api.get<ApiResponse<User[]>>('/api/admin/users'),
  
  // Récupérer un utilisateur par ID
  getById: (id: string) => api.get<ApiResponse<User>>(`/api/admin/users/${id}`),
  
  // Créer un nouveau collaborateur
  create: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<User>>('/api/admin/users', data),
  
  // Mettre à jour un utilisateur
  update: (id: string, data: Partial<User>) => 
    api.put<ApiResponse<User>>(`/api/admin/users/${id}`, data),
  
  // Supprimer un utilisateur
  delete: (id: string) => api.delete<ApiResponse<void>>(`/api/admin/users/${id}`),
  
  // Activer/Désactiver un utilisateur
  toggleActive: (id: string) => api.patch<ApiResponse<User>>(`/api/admin/users/${id}/toggle-active`),
  
  // Réinitialiser le mot de passe d'un utilisateur
  resetPassword: (id: string) => api.post<ApiResponse<void>>(`/api/admin/users/${id}/reset-password`),
  
  // Envoyer les identifiants par email
  sendCredentials: (id: string) => api.post<ApiResponse<void>>(`/api/admin/users/${id}/send-credentials`),
  
  // Récupérer les utilisateurs par département
  getByDepartment: (bankId: string, department: string) => 
    api.get<ApiResponse<User[]>>(`/api/admin/users?bankId=${bankId}&department=${department}`)
};

// ===== ASSIGNMENTS API =====
export const assignmentsApi = {
  // Récupérer toutes les assignations
  getAll: (bankId?: string) => 
    api.get<ApiResponse<FormationAssignment[]>>(`/api/admin/assignments${bankId ? `?bankId=${bankId}` : ''}`),
  
  // Récupérer les assignations d'un utilisateur
  getByUser: (userId: string) => 
    api.get<ApiResponse<FormationAssignment[]>>(`/api/admin/assignments?userId=${userId}`),
  
  // Récupérer les assignations d'une formation
  getByFormation: (formationId: string) => 
    api.get<ApiResponse<FormationAssignment[]>>(`/api/admin/assignments?formationId=${formationId}`),
  
  // Créer une assignation
  create: (data: Omit<FormationAssignment, 'id' | 'assignedAt' | 'updatedAt'>) => 
    api.post<ApiResponse<FormationAssignment>>('/api/admin/assignments', data),
  
  // Assigner une formation à plusieurs utilisateurs
  assignMultiple: (data: {
    formationId: string;
    userIds: string[];
    dueDate?: Date;
    assignedBy: string;
  }) => api.post<ApiResponse<FormationAssignment[]>>('/api/admin/assignments/multiple', data),
  
  // Supprimer une assignation
  delete: (id: string) => api.delete<ApiResponse<void>>(`/api/admin/assignments/${id}`),
  
  // Mettre à jour le statut d'une assignation
  updateStatus: (id: string, status: any) => 
    api.patch<ApiResponse<FormationAssignment>>(`/api/admin/assignments/${id}/status`, { status })
};

// ===== PROGRESS API =====
export const progressApi = {
  // Récupérer les progressions d'une banque
  getByBank: (bankId: string) => 
    api.get<ApiResponse<UserProgress[]>>(`/api/admin/progress?bankId=${bankId}`),
  
  // Récupérer les progressions d'un utilisateur
  getByUser: (userId: string) => 
    api.get<ApiResponse<UserProgress[]>>(`/api/admin/progress?userId=${userId}`),
  
  // Récupérer les progressions d'une formation
  getByFormation: (formationId: string) => 
    api.get<ApiResponse<UserProgress[]>>(`/api/admin/progress?formationId=${formationId}`),
  
  // Statistiques de progression
  getStats: (bankId?: string) => 
    api.get<ApiResponse<any>>(`/api/admin/progress/stats${bankId ? `?bankId=${bankId}` : ''}`)
};

// ===== NOTIFICATIONS API =====
export const notificationsApi = {
  // Récupérer les notifications d'un utilisateur
  getByUser: (userId: string) => 
    api.get<ApiResponse<Notification[]>>(`/api/admin/notifications?userId=${userId}`),
  
  // Marquer une notification comme lue
  markAsRead: (id: string) => 
    api.patch<ApiResponse<Notification>>(`/api/admin/notifications/${id}/read`),
  
  // Envoyer une notification
  send: (data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedId?: string;
  }) => api.post<ApiResponse<Notification>>('/api/admin/notifications', data)
};

// ===== DASHBOARD API =====
export const dashboardApi = {
  // Statistiques globales
  getStats: () => api.get<ApiResponse<DashboardStats>>('/api/admin/dashboard/stats'),
  
  // Statistiques par banque
  getBankStats: () => api.get<ApiResponse<BankStats[]>>('/api/admin/dashboard/bank-stats'),
  
  // Activité récente
  getRecentActivity: (bankId?: string) => 
    api.get<ApiResponse<RecentActivity[]>>(`/api/admin/dashboard/recent-activity${bankId ? `?bankId=${bankId}` : ''}`),
  
  // Alertes
  getAlerts: () => api.get<ApiResponse<Alert[]>>('/api/admin/dashboard/alerts'),
  
  // Performance des formations
  getFormationPerformance: () => api.get<ApiResponse<FormationPerformance[]>>('/api/admin/dashboard/formation-performance')
};

// ===== AUTH API =====
export const adminAuthApi = {
  // Connexion admin
  login: (email: string, password: string) => 
    api.post<ApiResponse<any>>('/api/admin/auth/login', { email, password }),
  
  // Vérifier le statut de connexion
  checkAuth: () => api.get<ApiResponse<User>>('/api/admin/auth/me'),
  
  // Déconnexion
  logout: () => api.post<ApiResponse<void>>('/api/admin/auth/logout'),
  
  // Changer de banque active
  switchBank: (bankId: string) => 
    api.post<ApiResponse<void>>('/api/admin/auth/switch-bank', { bankId })
}; 

// API pour la gestion du profil utilisateur
export const profileApi = {
  // Mettre à jour le profil
  updateProfile: (data: Partial<User>) => api.put<ApiResponse<User>>('/api/admin/profile', data),
  
  // Changer le mot de passe
  changePassword: (data: { currentPassword: string; newPassword: string }) => 
    api.put<ApiResponse<void>>('/api/admin/profile/password', data),
  
  // Obtenir le profil actuel
  getProfile: () => api.get<ApiResponse<User>>('/api/admin/profile'),
}; 

// API pour les assignations banque-formation
export const bankFormationApi = {
  // Assigner une formation à une banque
  assignFormationToBank: async (data: { bankId: string; formationId: string }): Promise<ApiResponse<BankFormation>> => {
    const response = await api.post('/api/admin/bank-formations', data);
    return response.data;
  },

  // Récupérer toutes les formations assignées à une banque
  getBankFormations: async (bankId: string): Promise<ApiResponse<BankFormation[]>> => {
    const response = await api.get(`/api/admin/banks/${bankId}/formations`);
    return response.data;
  },

  // Récupérer toutes les banques qui ont accès à une formation
  getFormationBanks: async (formationId: string): Promise<ApiResponse<Bank[]>> => {
    const response = await api.get(`/api/admin/formations/${formationId}/banks`);
    return response.data;
  },

  // Récupérer les statistiques d'une formation (nombre de banques, collaborateurs)
  getFormationStats: async (formationId: string): Promise<ApiResponse<{
    bankCount: number;
    userCount: number;
  }>> => {
    const response = await api.get(`/api/admin/formations/${formationId}/stats`);
    return response.data;
  },

  // Récupérer les statistiques de toutes les formations en une seule requête
  getAllFormationsStats: async (): Promise<ApiResponse<Record<string, {
    bankCount: number;
    userCount: number;
  }>>> => {
    const response = await api.get(`/api/admin/formations/stats/all`);
    return response.data;
  },

  // Mettre à jour le statut obligatoire d'une formation pour une banque
  updateFormationMandatory: async (id: string, data: { isMandatory: boolean }): Promise<ApiResponse<BankFormation>> => {
    const response = await api.patch(`/api/admin/bank-formations/${id}/mandatory`, data);
    return response.data;
  },

  // Supprimer l'assignation d'une formation à une banque
  removeFormationFromBank: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/admin/bank-formations/${id}`);
    return response.data;
  },
};

// API pour les assignations utilisateurs aux formations
export const userFormationAssignmentApi = {
  // Assigner des utilisateurs à une formation d'une banque
  assignUsersToFormation: async (bankFormationId: string, data: { users: Array<{ userId: string; isMandatory?: boolean; dueDate?: string }> }): Promise<ApiResponse<UserFormationAssignment[]>> => {
    const response = await api.post(`/api/admin/bank-formations/${bankFormationId}/users`, data);
    return response.data;
  },

  // Assigner des utilisateurs par groupe
  assignUsersByGroup: async (bankFormationId: string, data: { groupType: string; groupValue: string; isMandatory?: boolean; dueDate?: string }): Promise<ApiResponse<UserFormationAssignment[]>> => {
    const response = await api.post(`/api/admin/bank-formations/${bankFormationId}/users/group`, data);
    return response.data;
  },

  // Assigner plusieurs formations à des utilisateurs (assignation en lot)
  bulkAssignFormationsToUsers: async (data: { formationIds: string[]; userIds: string[]; bankId: string; isMandatory?: boolean; dueDate?: string }): Promise<ApiResponse<UserFormationAssignment[]>> => {
    const response = await api.post('/api/admin/assignments/bulk-formations', data);
    return response.data;
  },

  // Mettre à jour le statut obligatoire d'un utilisateur pour une formation
  updateUserFormationMandatory: async (id: string, data: { isMandatory: boolean; dueDate?: string }): Promise<ApiResponse<UserFormationAssignment>> => {
    const response = await api.patch(`/api/admin/user-formation-assignments/${id}`, data);
    return response.data;
  },

  // Supprimer l'assignation d'un utilisateur à une formation
  removeUserFromFormation: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/admin/user-formation-assignments/${id}`);
    return response.data;
  },

  // Récupérer toutes les assignations d'une formation d'une banque
  getFormationUserAssignments: async (bankFormationId: string): Promise<ApiResponse<UserFormationAssignment[]>> => {
    const response = await api.get(`/api/admin/bank-formations/${bankFormationId}/users`);
    return response.data;
  },
};

// ===== UNIVERSES API =====
export const universesApi = {
  // Récupérer tous les univers
  getAll: () => api.get<ApiResponse<Universe[]>>('/api/admin/universes'),
  
  // Créer un nouvel univers
  create: (data: Omit<Universe, 'id' | 'createdAt' | 'updatedAt' | 'formationCount'>) => 
    api.post<ApiResponse<Universe>>('/api/admin/universes', data),
  
  // Mettre à jour un univers
  update: (id: string, data: Partial<Universe>) => 
    api.put<ApiResponse<Universe>>(`/api/admin/universes/${id}`, data),
  
  // Supprimer un univers
  delete: (id: string) => api.delete<ApiResponse<void>>(`/api/admin/universes/${id}`),
  
  // Déplacer une formation vers un univers
  moveFormation: (formationId: string, universeId: string | null) => 
    api.post<ApiResponse<void>>('/api/admin/universes/move-formation', {
      formationId,
      universeId
    }),
  
  // Récupérer les formations d'un univers
  getFormations: (universeId: string) => 
    api.get<ApiResponse<Formation[]>>(`/api/admin/universes/${universeId}/formations`)
};

// ===== OPPORTUNITIES API =====
export const opportunitiesApi = {
  // Récupérer tous les fichiers PDF de présentation des formations
  getPresentationFiles: () => 
    api.get<ApiResponse<any[]>>('/api/admin/opportunities/files'),
  
  // Upload d'un nouveau fichier PDF
  uploadPresentationFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/admin/opportunities/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Supprimer un fichier PDF
  deletePresentationFile: (fileName: string) => 
    api.delete(`/api/admin/opportunities/files/${fileName}`),
  
  // Obtenir l'URL d'un fichier PDF
  getPresentationFileUrl: (fileName: string) => 
    `${API_BASE_URL}/api/admin/opportunities/files/${fileName}`,
};

// ===== SETTINGS API =====
export const settingsApi = {
  // Récupérer tous les paramètres
  getAllSettings: () => api.get<ApiResponse<SystemSettings[]>>('/api/admin/settings'),
  
  // Récupérer les paramètres par catégorie
  getSettingsByCategory: (category: string) => 
    api.get<ApiResponse<SystemSettings[]>>(`/api/admin/settings/category/${category}`),
  
  // Mettre à jour un paramètre
  updateSetting: (key: string, value: string) => 
    api.put<ApiResponse<SystemSettings>>(`/api/admin/settings/${key}`, { value }),
  
  // Récupérer les informations système
  getSystemInfo: () => api.get<ApiResponse<SystemInfo>>('/api/admin/settings/system-info'),
  
  // Vérifier la santé du système
  getSystemHealth: () => api.get<ApiResponse<SystemHealth>>('/api/admin/settings/system-health'),
  
  // Récupérer les logs système
  getSystemLogs: (params?: { level?: string; limit?: number; offset?: number }) => 
    api.get<ApiResponse<{ logs: LogEntry[]; total: number; limit: number; offset: number }>>('/api/admin/settings/logs', { params }),
  
  // Tester la configuration email
  testEmailConfig: (testEmail: string) => 
    api.post<ApiResponse<void>>('/api/admin/settings/test-email', { testEmail }),
  
  // Sauvegarder les paramètres
  backupSettings: () => api.post<ApiResponse<{ backupPath: string }>>('/api/admin/settings/backup'),
  
  // Restaurer les paramètres
  restoreSettings: (backupFile: string) => 
    api.post<ApiResponse<void>>('/api/admin/settings/restore', { backupFile })
}; 