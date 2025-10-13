import { api } from '../config/api';
import { learnerApi } from '../api/learnerApi';

export interface AvatarUploadResponse {
  success: boolean;
  data: {
    avatarUrl: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  };
  message: string;
}

export interface AvatarDeleteResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  };
  message: string;
}

class AvatarUploadService {
  /**
   * Upload d'un avatar de profil
   */
  async uploadAvatar(file: File, isLearner: boolean = false): Promise<AvatarUploadResponse> {
    console.log('🔧 AvatarUploadService - uploadAvatar appelé avec:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type, 
      isLearner 
    });

    const formData = new FormData();
    formData.append('file', file);

    const endpoint = isLearner ? '/api/learner/upload/profile-image' : '/api/admin/upload/profile-image';
    const apiClient = isLearner ? learnerApi : api;
    
    console.log('🌐 Appel API vers:', endpoint, 'avec client:', isLearner ? 'learnerApi' : 'api');
    
    try {
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Réponse API reçue:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur API:', error);
      throw error;
    }
  }

  /**
   * Suppression de l'avatar de profil
   */
  async deleteAvatar(isLearner: boolean = false): Promise<AvatarDeleteResponse> {
    const endpoint = isLearner ? '/api/learner/upload/profile-image' : '/api/admin/upload/profile-image';
    const apiClient = isLearner ? learnerApi : api;
    const response = await apiClient.delete(endpoint);
    return response.data;
  }

  /**
   * Construction de l'URL complète de l'avatar
   */
  getAvatarUrl(avatarPath: string | null, isLearner: boolean = false): string | null {
    if (!avatarPath) return null;
    
    // Si c'est déjà une URL complète, la retourner telle quelle
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    
    // Sinon, construire l'URL avec la base de l'API appropriée
    const baseUrl = isLearner 
      ? (import.meta.env.VITE_API_URL || 'http://localhost:3000')
      : (import.meta.env.VITE_API_URL || 'http://localhost:3001');
    return `${baseUrl}${avatarPath}`;
  }
}

export const avatarUploadService = new AvatarUploadService();
