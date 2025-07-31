// Configuration des URLs de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  CONTACT: `${API_BASE_URL}/api/contact`,
  // Ajoutez d'autres endpoints ici si nécessaire
};

export default API_BASE_URL; 