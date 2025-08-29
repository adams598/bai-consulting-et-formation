import axios from 'axios';
import { currentEnv } from './environments';

// Configuration de base pour axios
const api = axios.create({
  baseURL: currentEnv.apiUrl,
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
      console.log('🔑 Token envoyé dans la requête:', config.url);
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
      // Token expiré ou invalide
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export { api }; 