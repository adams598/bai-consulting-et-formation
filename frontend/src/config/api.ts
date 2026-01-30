import axios from 'axios';
import { currentEnv } from './environments';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? currentEnv.apiUrl;

export const API_ENDPOINTS = {
  CONTACT: `${API_BASE_URL}/api/contact`,
};

// Configuration de base pour axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    // Essayer d'abord la clé utilisée par AuthProvider
    let token = localStorage.getItem('bai_auth_token');
    
    // Fallback vers la clé utilisée par authService
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log('🔑 Token envoyé dans la requête:', config.url);
    } else {
      console.warn('⚠️ Aucun token trouvé pour la requête:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      // Différents messages selon le type d'expiration
      let message = 'Session expirée';
      switch (errorCode) {
        case 'SESSION_INACTIVE':
          message = 'Session expirée due à l\'inactivité';
          break;
        case 'SESSION_EXPIRED':
          message = 'Session expirée';
          break;
        case 'TOKEN_EXPIRED':
          message = 'Token d\'authentification expiré';
          break;
        case 'INVALID_TOKEN':
          message = 'Token d\'authentification invalide';
          break;
        default:
          message = 'Session expirée, veuillez vous reconnecter';
      }
      
      console.warn('🔐 Authentification échouée:', message);
      
      // Token expiré ou invalide - nettoyage unifié
      localStorage.removeItem('bai_auth_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      
      // Redirection vers la page de connexion unifiée seulement si on n'y est pas déjà
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { api, API_BASE_URL }; 