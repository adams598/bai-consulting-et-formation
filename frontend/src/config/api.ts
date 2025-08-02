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
    const token = localStorage.getItem('bai_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem('bai_auth_token');
      localStorage.removeItem('bai_auth_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export { api }; 