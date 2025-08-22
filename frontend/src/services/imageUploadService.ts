import { api } from '../config/api';

export interface UploadResponse {
  success: boolean;
  data: {
    imageUrl?: string;
    videoUrl?: string;
    fileUrl?: string;
    filename: string;
    size: number;
    mimetype: string;
    userFolder: string;
    contentType?: string;
  };
  message: string;
}

class UploadService {
  // Upload d'image
  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post<UploadResponse>('/api/admin/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data.imageUrl) {
        // Solution temporaire : utiliser directement l'URL du backend
        const imageUrl = response.data.data.imageUrl;
        const backendUrl = 'http://localhost:3000';
        const fullImageUrl = imageUrl.startsWith('/') ? `${backendUrl}${imageUrl}` : imageUrl;
        
        console.log('🔗 URL image générée:', fullImageUrl);
        return fullImageUrl;
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'upload de l\'image');
      }
    } catch (error) {
      console.error('❌ Erreur uploadImage:', error);
      throw error;
    }
  }

  // Upload d'image de couverture pour les leçons
  async uploadLessonImage(file: File, lessonTitle: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('lessonTitle', lessonTitle);

      const response = await api.post<UploadResponse>('/api/admin/upload/lesson-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data.imageUrl) {
        // Solution temporaire : utiliser directement l'URL du backend
        const imageUrl = response.data.data.imageUrl;
        const backendUrl = 'http://localhost:3000';
        const fullImageUrl = imageUrl.startsWith('/') ? `${backendUrl}${imageUrl}` : imageUrl;
        
        console.log('🔗 URL image de leçon générée:', fullImageUrl);
        return fullImageUrl;
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'upload de l\'image de leçon');
      }
    } catch (error) {
      console.error('❌ Erreur uploadLessonImage:', error);
      throw error;
    }
  }

  // Upload de vidéo
  async uploadVideo(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await api.post<UploadResponse>('/api/admin/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data.videoUrl) {
        // Solution temporaire : utiliser directement l'URL du backend
        const videoUrl = response.data.data.videoUrl;
        const backendUrl = 'http://localhost:3000';
        const fullVideoUrl = videoUrl.startsWith('/') ? `${backendUrl}${videoUrl}` : videoUrl;
        
        console.log('🔗 URL vidéo générée:', fullVideoUrl);
        return fullVideoUrl;
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'upload de la vidéo');
      }
    } catch (error) {
      console.error('❌ Erreur uploadVideo:', error);
      throw error;
    }
  }

  // Upload de fichier générique
  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<UploadResponse>('/api/admin/upload/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data.fileUrl) {
        // Solution temporaire : utiliser directement l'URL du backend
        const fileUrl = response.data.data.fileUrl;
        const backendUrl = 'http://localhost:3000';
        const fullFileUrl = fileUrl.startsWith('/') ? `${backendUrl}${fileUrl}` : fileUrl;
        
        console.log('🔗 URL fichier générée:', fullFileUrl);
        return fullFileUrl;
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'upload du fichier');
      }
    } catch (error) {
      console.error('❌ Erreur uploadFile:', error);
      throw error;
    }
  }

  // Vérifier si un fichier existe
  async checkFile(contentType: string, userFolder: string, filename: string): Promise<boolean> {
    try {
      const response = await api.get(`/api/admin/upload/check/${contentType}/${userFolder}/${filename}`);
      return response.data.success && response.data.data.exists;
    } catch (error) {
      console.error('❌ Erreur checkFile:', error);
      return false;
    }
  }

  // Lister les fichiers d'un utilisateur
  async listUserFiles(contentType: string = 'images'): Promise<any[]> {
    try {
      const response = await api.get(`/api/admin/upload/files?contentType=${contentType}`);
      if (response.data.success) {
        return response.data.data.files || [];
      }
      return [];
    } catch (error) {
      console.error('❌ Erreur listUserFiles:', error);
      return [];
    }
  }

  // Vérifier si une URL est valide
  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    // URL locale (uploads/) ou backend direct
    if (url.startsWith('/uploads/') || url.startsWith('http://localhost:3000/uploads/')) {
      return true;
    }
    
    // URL externe
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Nettoyer une URL blob temporaire
  cleanupBlobUrl(blobUrl: string): void {
    if (blobUrl && blobUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(blobUrl);
        console.log('🧹 URL blob nettoyée:', blobUrl);
      } catch (error) {
        console.error('❌ Erreur lors du nettoyage de l\'URL blob:', error);
      }
    }
  }

  // Obtenir le type de fichier à partir de l'extension
  getFileType(filename: string): 'image' | 'video' | 'document' | 'other' {
    const extension = filename.toLowerCase().split('.').pop();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'image';
    }
    
    if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension || '')) {
      return 'video';
    }
    
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'].includes(extension || '')) {
      return 'document';
    }
    
    return 'other';
  }

  // Formater la taille d'un fichier
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const uploadService = new UploadService();
export const imageUploadService = uploadService; // Alias pour la compatibilité
