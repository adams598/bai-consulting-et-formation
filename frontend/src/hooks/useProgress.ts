import { useProgress } from '../contexts/ProgressContext';

// Hook personnalisé pour accéder facilement à la progression d'une leçon
export const useLessonProgress = (lessonId: string, formationId: string, userId: string) => {
  const { getProgress, updateProgress, saveProgress, globalProgress } = useProgress();
  
  const progress = getProgress(lessonId, formationId, userId);
  
  const updateLocalProgress = (updates: any) => {
    updateProgress(lessonId, formationId, userId, updates);
  };
  
  const saveToDatabase = async (progressData: any) => {
    await saveProgress(progressData);
  };
  
  return {
    progress,
    updateLocalProgress,
    saveToDatabase,
    isLoading: false, // Le contexte global gère déjà le chargement
    hasProgress: !!progress
  };
};

// Hook pour obtenir toutes les progressions d'un utilisateur
export const useUserProgress = (userId: string) => {
  const { getAllProgress, globalProgress } = useProgress();
  
  const allProgress = getAllProgress(userId);
  
  return {
    allProgress,
    totalLessons: allProgress.length,
    completedLessons: allProgress.filter(p => p.completed).length,
    averageProgress: allProgress.length > 0 
      ? allProgress.reduce((sum, p) => sum + p.progress, 0) / allProgress.length 
      : 0
  };
};
