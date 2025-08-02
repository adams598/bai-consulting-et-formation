import { api } from '../config/api';
import {
  Bank,
  User,
  Formation,
  FormationAssignment,
  Quiz,
  UserProgress,
  Notification,
  AdminDashboardStats,
  BankStats,
  UserRole,
  FormationType,
  AssignmentStatus
} from '../features/admin/types';

// ===== BANKS API =====
export const banksApi = {
  // Récupérer toutes les banques
  getAll: () => api.get<Bank[]>('/admin/banks'),
  
  // Récupérer une banque par ID
  getById: (id: string) => api.get<Bank>(`/admin/banks/${id}`),
  
  // Créer une nouvelle banque
  create: (data: Omit<Bank, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<Bank>('/admin/banks', data),
  
  // Mettre à jour une banque
  update: (id: string, data: Partial<Bank>) => 
    api.put<Bank>(`/admin/banks/${id}`, data),
  
  // Supprimer une banque
  delete: (id: string) => api.delete(`/admin/banks/${id}`),
  
  // Activer/Désactiver une banque
  toggleActive: (id: string) => api.patch<Bank>(`/admin/banks/${id}/toggle`),
  
  // Statistiques d'une banque
  getStats: (id: string) => api.get<BankStats>(`/admin/banks/${id}/stats`)
};

// ===== FORMATIONS API =====
export const formationsApi = {
  // Récupérer toutes les formations
  getAll: (bankId?: string) => 
    api.get<Formation[]>(`/admin/formations${bankId ? `?bankId=${bankId}` : ''}`),
  
  // Récupérer une formation par ID
  getById: (id: string) => api.get<Formation>(`/admin/formations/${id}`),
  
  // Créer une nouvelle formation
  create: (data: Omit<Formation, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<Formation>('/admin/formations', data),
  
  // Mettre à jour une formation
  update: (id: string, data: Partial<Formation>) => 
    api.put<Formation>(`/admin/formations/${id}`, data),
  
  // Supprimer une formation
  delete: (id: string) => api.delete(`/admin/formations/${id}`),
  
  // Activer/Désactiver une formation
  toggleActive: (id: string) => api.patch<Formation>(`/admin/formations/${id}/toggle`),
  
  // Rendre une formation obligatoire
  toggleMandatory: (id: string) => api.patch<Formation>(`/admin/formations/${id}/mandatory`),
  
  // Upload de contenu (vidéo, document, etc.)
  uploadContent: (formationId: string, file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post(`/admin/formations/${formationId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Supprimer un contenu
  deleteContent: (formationId: string, contentId: string) => 
    api.delete(`/admin/formations/${formationId}/content/${contentId}`)
};

// ===== USERS API =====
export const usersApi = {
  // Récupérer tous les utilisateurs d'une banque
  getAll: (bankId: string) => api.get<User[]>(`/admin/users?bankId=${bankId}`),
  
  // Récupérer un utilisateur par ID
  getById: (id: string) => api.get<User>(`/admin/users/${id}`),
  
  // Créer un nouveau collaborateur
  create: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<User>('/admin/users', data),
  
  // Mettre à jour un utilisateur
  update: (id: string, data: Partial<User>) => 
    api.put<User>(`/admin/users/${id}`, data),
  
  // Supprimer un utilisateur
  delete: (id: string) => api.delete(`/admin/users/${id}`),
  
  // Activer/Désactiver un utilisateur
  toggleActive: (id: string) => api.patch<User>(`/admin/users/${id}/toggle`),
  
  // Réinitialiser le mot de passe d'un utilisateur
  resetPassword: (id: string) => api.post(`/admin/users/${id}/reset-password`),
  
  // Envoyer les identifiants par email
  sendCredentials: (id: string) => api.post(`/admin/users/${id}/send-credentials`),
  
  // Récupérer les utilisateurs par département
  getByDepartment: (bankId: string, department: string) => 
    api.get<User[]>(`/admin/users?bankId=${bankId}&department=${department}`)
};

// ===== ASSIGNMENTS API =====
export const assignmentsApi = {
  // Récupérer toutes les assignations
  getAll: (bankId?: string) => 
    api.get<FormationAssignment[]>(`/admin/assignments${bankId ? `?bankId=${bankId}` : ''}`),
  
  // Assigner une formation à un utilisateur
  assignToUser: (data: {
    formationId: string;
    userId: string;
    isMandatory?: boolean;
    dueDate?: Date;
  }) => api.post<FormationAssignment>('/admin/assignments', data),
  
  // Assigner une formation à un département
  assignToDepartment: (data: {
    formationId: string;
    bankId: string;
    department: string;
    isMandatory?: boolean;
    dueDate?: Date;
  }) => api.post<FormationAssignment[]>('/admin/assignments/department', data),
  
  // Assigner une formation à plusieurs utilisateurs
  assignToMultiple: (data: {
    formationId: string;
    userIds: string[];
    isMandatory?: boolean;
    dueDate?: Date;
  }) => api.post<FormationAssignment[]>('/admin/assignments/multiple', data),
  
  // Supprimer une assignation
  delete: (id: string) => api.delete(`/admin/assignments/${id}`),
  
  // Mettre à jour le statut d'une assignation
  updateStatus: (id: string, status: AssignmentStatus) => 
    api.patch<FormationAssignment>(`/admin/assignments/${id}/status`, { status })
};

// ===== QUIZ API =====
export const quizApi = {
  // Récupérer le quiz d'une formation
  getByFormation: (formationId: string) => 
    api.get<Quiz>(`/admin/quiz/${formationId}`),
  
  // Créer ou mettre à jour un quiz
  save: (formationId: string, data: Omit<Quiz, 'id' | 'formationId'>) => 
    api.post<Quiz>(`/admin/quiz/${formationId}`, data),
  
  // Supprimer un quiz
  delete: (formationId: string) => api.delete(`/admin/quiz/${formationId}`)
};

// ===== PROGRESS API =====
export const progressApi = {
  // Récupérer les progressions d'une banque
  getByBank: (bankId: string) => 
    api.get<UserProgress[]>(`/admin/progress?bankId=${bankId}`),
  
  // Récupérer les progressions d'un utilisateur
  getByUser: (userId: string) => 
    api.get<UserProgress[]>(`/admin/progress?userId=${userId}`),
  
  // Récupérer les progressions d'une formation
  getByFormation: (formationId: string) => 
    api.get<UserProgress[]>(`/admin/progress?formationId=${formationId}`),
  
  // Statistiques de progression
  getStats: (bankId?: string) => 
    api.get(`/admin/progress/stats${bankId ? `?bankId=${bankId}` : ''}`)
};

// ===== NOTIFICATIONS API =====
export const notificationsApi = {
  // Récupérer les notifications d'un utilisateur
  getByUser: (userId: string) => 
    api.get<Notification[]>(`/admin/notifications?userId=${userId}`),
  
  // Marquer une notification comme lue
  markAsRead: (id: string) => 
    api.patch<Notification>(`/admin/notifications/${id}/read`),
  
  // Envoyer une notification
  send: (data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedId?: string;
  }) => api.post<Notification>('/admin/notifications', data)
};

// ===== DASHBOARD API =====
export const dashboardApi = {
  // Statistiques globales
  getStats: () => api.get<AdminDashboardStats>('/admin/dashboard/stats'),
  
  // Statistiques par banque
  getBankStats: () => api.get<BankStats[]>('/admin/dashboard/bank-stats'),
  
  // Activité récente
  getRecentActivity: (bankId?: string) => 
    api.get(`/admin/dashboard/recent-activity${bankId ? `?bankId=${bankId}` : ''}`)
};

// ===== AUTH API =====
export const adminAuthApi = {
  // Connexion admin
  login: (email: string, password: string) => 
    api.post('/admin/auth/login', { email, password }),
  
  // Vérifier le statut de connexion
  checkAuth: () => api.get('/admin/auth/me'),
  
  // Déconnexion
  logout: () => api.post('/admin/auth/logout'),
  
  // Changer de banque active
  switchBank: (bankId: string) => 
    api.post('/admin/auth/switch-bank', { bankId })
}; 