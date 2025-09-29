const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Met à jour la progression d'une leçon spécifique
 * @param lessonId - ID de la leçon
 * @param progress - Progression de la leçon (0-100)
 * @param isCompleted - Si la leçon est complétée
 * @returns Promise avec la réponse de l'API
 */
export const updateLessonProgress = async (lessonId: string, progress: number, isCompleted: boolean = false) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/lessons/${lessonId}/progress`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        progress: Math.min(100, Math.max(0, progress)),
        isCompleted
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la mise à jour de la progression');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    throw error;
  }
};

/**
 * Récupère les détails de progression d'une formation
 * @param formationId - ID de la formation
 * @returns Promise avec les détails de progression
 */
export const getFormationProgressDetails = async (formationId: string) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/formations/${formationId}/progress-details`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des détails de progression');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de progression:', error);
    throw error;
  }
};

/**
 * Calcule la progression globale d'une formation basée sur les leçons
 * @param lessons - Liste des leçons avec leur progression
 * @returns Progression globale en pourcentage
 */
export const calculateGlobalProgress = (lessons: Array<{ progress: number; isCompleted: boolean }>): number => {
  if (lessons.length === 0) {
    return 0;
  }

  let totalProgress = 0;
  lessons.forEach(lesson => {
    if (lesson.isCompleted) {
      totalProgress += 100;
    } else {
      totalProgress += Math.min(100, Math.max(0, lesson.progress));
    }
  });

  return Math.round((totalProgress / lessons.length) * 100) / 100;
};
