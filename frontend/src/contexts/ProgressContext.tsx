import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProgressData {
  lessonId: string;
  formationId: string;
  userId: string;
  currentPage?: number;
  totalPages?: number;
  currentTime?: number;
  totalTime?: number;
  progress: number;
  completed: boolean;
  lastAccessedAt: string;
}

interface ProgressContextType {
  // État global de la progression
  globalProgress: Record<string, ProgressData>;
  
  // Actions
  saveProgress: (data: ProgressData) => Promise<void>;
  loadProgress: (lessonId: string, formationId: string, userId: string) => Promise<ProgressData | null>;
  updateProgress: (lessonId: string, formationId: string, userId: string, updates: Partial<ProgressData>) => void;
  getProgress: (lessonId: string, formationId: string, userId: string) => ProgressData | null;
  getAllProgress: (userId: string) => ProgressData[];
  
  // État de chargement
  isLoading: boolean;
  error: string | null;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress doit être utilisé dans un ProgressProvider');
  }
  return context;
};

interface ProgressProviderProps {
  children: ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const [globalProgress, setGlobalProgress] = useState<Record<string, ProgressData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);

  // Créer une clé unique pour chaque progression
  const getProgressKey = (lessonId: string, formationId: string, userId: string) => {
    return `${userId}-${formationId}-${lessonId}`;
  };

  // Configuration de l'API URL selon l'environnement
  const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    // En développement, utiliser localhost:3000
    return 'http://localhost:3000';
  };

  // Sauvegarder la progression dans la base de données et l'état global
  const saveProgress = async (data: ProgressData) => {
    // Éviter les requêtes trop fréquentes (minimum 1 seconde entre chaque sauvegarde)
    const now = Date.now();
    if (now - lastSaveTime < 1000) {
      console.log('⏳ Sauvegarde ignorée - trop fréquente, mise à jour locale uniquement');
      // Mettre à jour seulement l'état local
      const progressKey = getProgressKey(data.lessonId, data.formationId, data.userId);
      setGlobalProgress(prev => ({
        ...prev,
        [progressKey]: {
          ...data,
          lastAccessedAt: new Date().toISOString()
        }
      }));
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastSaveTime(now);
    
    try {
      // Nettoyer et valider les données avant envoi
      const cleanData = {
        lessonId: data.lessonId || '',
        formationId: data.formationId || '',
        userId: data.userId || '',
        currentPage: data.currentPage || null,
        totalPages: data.totalPages || null,
        currentTime: data.currentTime || 0,
        totalTime: data.totalTime || 0,
        progress: data.progress || 0,
        completed: data.completed || false,
        lastAccessedAt: new Date().toISOString(),
      };

      console.log('📤 Envoi des données de progression:', cleanData);

      const response = await fetch(`${getApiUrl()}/api/admin/progress/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(cleanData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Progression sauvegardée globalement:', result);
        
        // Mettre à jour l'état global
        const progressKey = getProgressKey(data.lessonId, data.formationId, data.userId);
        setGlobalProgress(prev => ({
          ...prev,
          [progressKey]: {
            ...data,
            lastAccessedAt: new Date().toISOString()
          }
        }));
      } else {
        // Si le backend n'est pas disponible, sauvegarder en local seulement
        console.log('⚠️ Backend non disponible, sauvegarde locale uniquement');
        const progressKey = getProgressKey(data.lessonId, data.formationId, data.userId);
        setGlobalProgress(prev => ({
          ...prev,
          [progressKey]: {
            ...data,
            lastAccessedAt: new Date().toISOString()
          }
        }));
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde globale:', error);
      // En cas d'erreur, sauvegarder en local seulement
      console.log('⚠️ Erreur réseau, sauvegarde locale uniquement');
      const progressKey = getProgressKey(data.lessonId, data.formationId, data.userId);
      setGlobalProgress(prev => ({
        ...prev,
        [progressKey]: {
          ...data,
          lastAccessedAt: new Date().toISOString()
        }
      }));
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger la progression depuis la base de données
  const loadProgress = async (lessonId: string, formationId: string, userId: string): Promise<ProgressData | null> => {
    // Vérifier si la progression existe déjà en local
    const progressKey = getProgressKey(lessonId, formationId, userId);
    const existingProgress = globalProgress[progressKey];
    
    if (existingProgress) {
      console.log('📊 Progression trouvée en local:', existingProgress);
      return existingProgress;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${getApiUrl()}/api/admin/progress/get?lessonId=${lessonId}&formationId=${formationId}&userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.progress) {
          const progressData: ProgressData = {
            lessonId,
            formationId,
            userId,
            currentPage: data.progress.currentPage || 1,
            totalPages: data.progress.totalPages || 1,
            currentTime: data.progress.timeSpent || 0,
            totalTime: data.progress.totalTime || 0,
            progress: data.progress.progress || 0,
            completed: data.progress.completed || false,
            lastAccessedAt: data.progress.lastAccessedAt || new Date().toISOString()
          };
          
          // Mettre à jour l'état global
          setGlobalProgress(prev => ({
            ...prev,
            [progressKey]: progressData
          }));
          
          console.log('📊 Progression chargée globalement:', progressData);
          return progressData;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur lors du chargement global:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour la progression localement (sans sauvegarde en base)
  const updateProgress = (lessonId: string, formationId: string, userId: string, updates: Partial<ProgressData>) => {
    const progressKey = getProgressKey(lessonId, formationId, userId);
    setGlobalProgress(prev => ({
      ...prev,
      [progressKey]: {
        ...prev[progressKey],
        ...updates,
        lastAccessedAt: new Date().toISOString()
      }
    }));
  };

  // Récupérer la progression depuis l'état global
  const getProgress = (lessonId: string, formationId: string, userId: string): ProgressData | null => {
    const progressKey = getProgressKey(lessonId, formationId, userId);
    return globalProgress[progressKey] || null;
  };

  // Récupérer toutes les progressions d'un utilisateur
  const getAllProgress = (userId: string): ProgressData[] => {
    return Object.values(globalProgress).filter(progress => progress.userId === userId);
  };

  // Charger toutes les progressions d'un utilisateur au démarrage
  useEffect(() => {
    const userId = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')!).id : null;
    const accessToken = localStorage.getItem('accessToken');
    
    if (userId && accessToken && Object.keys(globalProgress).length === 0) {
      console.log('📊 Chargement initial des progressions pour l\'utilisateur:', userId);
      
      // Charger toutes les progressions de l'utilisateur
      fetch(`http://localhost:3000/api/admin/progress/user/${userId}/all`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.progress && Array.isArray(data.progress)) {
          const progressMap: Record<string, ProgressData> = {};
          data.progress.forEach((item: any) => {
            const progressKey = getProgressKey(item.lessonId, item.formationId, item.userId);
            progressMap[progressKey] = {
              lessonId: item.lessonId,
              formationId: item.formationId,
              userId: item.userId,
              currentPage: item.currentPage || 1,
              totalPages: item.totalPages || 1,
              currentTime: item.timeSpent || 0,
              totalTime: item.totalTime || 0,
              progress: item.progress || 0,
              completed: item.completed || false,
              lastAccessedAt: item.lastAccessedAt || new Date().toISOString()
            };
          });
          setGlobalProgress(progressMap);
          console.log('📊 Toutes les progressions chargées:', Object.keys(progressMap).length, 'progression(s)');
        }
      })
      .catch(error => {
        console.error('❌ Erreur lors du chargement des progressions:', error);
        // Ne pas bloquer l'application si le chargement échoue
      });
    }
  }, []); // Dépendances vides pour ne s'exécuter qu'une seule fois

  const value: ProgressContextType = {
    globalProgress,
    saveProgress,
    loadProgress,
    updateProgress,
    getProgress,
    getAllProgress,
    isLoading,
    error
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
