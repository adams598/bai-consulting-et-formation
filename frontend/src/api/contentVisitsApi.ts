import { api } from '../config/api';

export interface ContentVisit {
  id: string;
  contentType: string;
  contentId?: string;
  contentTitle?: string;
  url?: string;
  duration?: number;
  durationFormatted?: string;
  visitedAt: string;
  contentInfo?: {
    title: string;
    code?: string;
    formationTitle?: string;
    type: string;
  };
}

export interface VisitStats {
  period: string;
  totalVisits: number;
  visitsByType: Array<{
    type: string;
    count: number;
  }>;
  totalDuration: number;
  totalDurationFormatted: string;
  lastActivity?: {
    contentType: string;
    contentTitle?: string;
    visitedAt: string;
  };
  dailyActivity: Array<{
    date: string;
    visits: number;
    totalDuration: number;
  }>;
}

export const contentVisitsApi = {
  // Obtenir les consultations récentes d'un utilisateur
  getUserRecentVisits: async (userId: string, limit: number = 20): Promise<ContentVisit[]> => {
    const response = await api.get(`/api/content-visits/user/${userId}/recent?limit=${limit}`);
    return response.data.data;
  },

  // Obtenir la dernière consultation d'un contenu spécifique
  getLastContentVisit: async (userId: string, contentType: string, contentId?: string): Promise<ContentVisit> => {
    const params = new URLSearchParams({ contentType });
    if (contentId) params.append('contentId', contentId);
    
    const response = await api.get(`/api/content-visits/user/${userId}/last?${params}`);
    return response.data.data;
  },

  // Obtenir les statistiques de consultation d'un utilisateur
  getUserVisitStats: async (userId: string, days: number = 30): Promise<VisitStats> => {
    const response = await api.get(`/api/content-visits/user/${userId}/stats?days=${days}`);
    return response.data.data;
  }
};
