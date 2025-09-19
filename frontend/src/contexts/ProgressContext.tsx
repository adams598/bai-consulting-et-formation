// ProgressContext.tsx - Contexte global pour la gestion des progressions
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import progressService, { LessonProgress } from '../services/progressService';

interface ProgressContextType {
  lessonProgress: { [lessonId: string]: LessonProgress };
  updateProgress: (lessonId: string, progress: Partial<Omit<LessonProgress, 'lessonId' | 'lastUpdated'>>) => void;
  loadProgress: (formationId: string, userId: string, lessons: any[]) => void;
  getProgress: (lessonId: string, formationId: string, userId: string) => LessonProgress | undefined;
  clearProgress: () => void;
  isLoading: boolean;
  setLessons: (lessons: any[]) => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

interface ProgressProviderProps {
  children: ReactNode;
  formationId: string;
  lessons?: any[];
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ 
  children, 
  formationId, 
  lessons 
}) => {
  const [lessonProgress, setLessonProgress] = useState<{ [lessonId: string]: LessonProgress }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentLessons, setCurrentLessons] = useState<any[]>(lessons || []);

  // Mettre à jour currentLessons quand lessons change
  useEffect(() => {
    setCurrentLessons(lessons || []);
  }, [lessons]);

  // Charger les progressions quand currentLessons change
  useEffect(() => {
    const loadProgressData = () => {
      try {
        const userId = progressService.getCurrentUserId();
        const progress = progressService.getProgress(formationId, userId, currentLessons);
        setLessonProgress(progress);
        console.log('📊 Progressions chargées depuis le localStorage:', progress);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des progressions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentLessons.length > 0) {
      loadProgressData();
    } else {
      setIsLoading(false);
    }
  }, [formationId, currentLessons]);

  // Mettre à jour une progression
  const updateProgress = (lessonId: string, progress: Partial<Omit<LessonProgress, 'lessonId' | 'lastUpdated'>>) => {
    const userId = progressService.getCurrentUserId();
    
    // Mettre à jour dans le service
    progressService.updateProgress(formationId, userId, lessonId, progress);
    
    // Mettre à jour l'état local
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        ...progress,
        lessonId,
        lastUpdated: new Date().toISOString()
      }
    }));
  };

  // Charger les progressions manuellement
  const loadProgress = (formationId: string, userId: string, lessons: any[]) => {
    const progress = progressService.getProgress(formationId, userId, lessons || []);
    setLessonProgress(progress);
  };

  // Récupérer la progression d'une leçon spécifique
  const getProgress = (lessonId: string, formationId: string, userId: string): LessonProgress | undefined => {
    try {
      return progressService.getProgress(formationId, userId, [])[lessonId];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la progression:', error);
      return undefined;
    }
  };

  // Effacer toutes les progressions
  const clearProgress = () => {
    const userId = progressService.getCurrentUserId();
    progressService.clearProgress(formationId, userId);
    setLessonProgress({});
  };

  const value: ProgressContextType = {
    lessonProgress,
    updateProgress,
    loadProgress,
    getProgress,
    clearProgress,
    isLoading,
    setLessons: setCurrentLessons
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

// Hook pour utiliser le contexte de progression
export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress doit être utilisé dans un ProgressProvider');
  }
  return context;
};