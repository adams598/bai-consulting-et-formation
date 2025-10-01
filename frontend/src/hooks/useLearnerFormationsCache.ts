import { useState, useEffect, useCallback, useRef } from 'react';
import { formationsApi, universesApi } from '../api/learnerApi';
import { Formation, Universe } from '../features/admin/types';

interface FormationStats {
  bankCount: number;
  userCount: number;
}

interface CacheData {
  formations: Formation[];
  universes: Universe[];
  formationStats: Record<string, FormationStats>;
  lastUpdated: number;
}

// Cache global pour éviter les requêtes répétées
let globalCache: CacheData | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useLearnerFormationsCache = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CacheData | null>(globalCache);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isCacheValid = useCallback(() => {
    if (!globalCache) return false;
    const now = Date.now();
    return (now - globalCache.lastUpdated) < CACHE_DURATION;
  }, []);

  const loadData = useCallback(async (forceRefresh = false) => {
    // Si le cache est valide et qu'on ne force pas le refresh, utiliser le cache
    if (!forceRefresh && isCacheValid() && globalCache) {
      console.log('📦 Utilisation du cache existant (Learner)');
      setData(globalCache);
      return globalCache;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau contrôleur d'abort
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Chargement des données formations (Learner)...');
      
      // Charger les formations et universes en parallèle avec les APIs learner
      const [formationsResponse, universesResponse] = await Promise.all([
        formationsApi.getMyFormations(),
        universesApi.getAll()
      ]);

      if (signal.aborted) return null;

      // Transformer les assignations en formations
      const assignments = formationsResponse.data || [];
      
      const formations = assignments.map((assignment: any) => {
        if (!assignment.formation) {
          console.error('Formation manquante dans assignation:', assignment);
          return null;
        }

        return {
          id: assignment.formation.id,
          title: assignment.formation.title,
          description: assignment.formation.description,
          duration: assignment.formation.duration,
          totalDuration: assignment.formation.totalDuration || assignment.formation.duration,
          coverImage: assignment.formation.coverImage,
          code: assignment.formation.code,
          isActive: assignment.formation.isActive,
          lessonCount: assignment.formation.lessonCount || 0,
          createdAt: assignment.formation.createdAt,
          updatedAt: assignment.formation.updatedAt,
          universeId: assignment.formation.universeId || undefined,
          isOpportunity: assignment.formation.isOpportunity || false,
          hasQuiz: assignment.formation.hasQuiz || false,
        };
      }).filter(formation => formation !== null);

      const universesData = universesResponse.data || [];
      
      // S'assurer que toutes les formations ont le champ isOpportunity
      const formationsWithOpportunity = formations.map(formation => ({
        ...formation,
        isOpportunity: formation.isOpportunity || false
      }));
      
      // Convertir les dates des univers de string vers Date
      const universesWithDates = universesData.map(universe => ({
        ...universe,
        createdAt: new Date(universe.createdAt),
        updatedAt: new Date(universe.updatedAt)
      }));
      
      // Calculer le nombre de formations par univers (sans FSU)
      const universesWithCounts = universesWithDates.map(universe => {
        const universeFormations = formationsWithOpportunity.filter(f => f.universeId === universe.id && !f.isOpportunity);
        return { ...universe, formationCount: universeFormations.length };
      });
      
      const universes = universesWithCounts;

      console.log(`📊 Chargement terminé - ${formationsWithOpportunity.length} formations, ${universes.length} univers`);

      const cacheData: CacheData = {
        formations: formationsWithOpportunity,
        universes,
        formationStats: {}, // Pas de stats pour les learners
        lastUpdated: Date.now()
      };

      // Mettre à jour le cache global
      globalCache = cacheData;
      setData(cacheData);

      console.log('✅ Données chargées et mises en cache (Learner)');
      return cacheData;

    } catch (error: any) {
      if (signal.aborted) return null;
      
      console.error('❌ Erreur lors du chargement des données (Learner):', error);
      setError(error.message || 'Erreur lors du chargement des données');
      
      // En cas d'erreur, retourner le cache existant s'il existe
      if (globalCache) {
        setData(globalCache);
        return globalCache;
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isCacheValid]);

  const invalidateCache = useCallback(() => {
    console.log('🗑️ Invalidation du cache (Learner)');
    globalCache = null;
    setData(null);
  }, []);

  const updateFormationInCache = useCallback((updatedFormation: Formation) => {
    if (!globalCache) return;
    
    console.log(`🔄 Mise à jour formation en cache (Learner): ${updatedFormation.title}`);
    
    const updatedFormations = globalCache.formations.map(f => 
      f.id === updatedFormation.id ? updatedFormation : f
    );
    
    // Recalculer les compteurs des univers (sans FSU)
    const updatedUniverses = globalCache.universes.map(universe => {
      const universeFormations = updatedFormations.filter(f => f.universeId === universe.id && !f.isOpportunity);
      return { ...universe, formationCount: universeFormations.length };
    });
    
    globalCache = {
      ...globalCache,
      formations: updatedFormations,
      universes: updatedUniverses,
      lastUpdated: Date.now()
    };
    
    setData(globalCache);
    console.log('✅ Cache mis à jour intelligemment (Learner) - pas de rechargement réseau');
  }, []);

  const addFormationToCache = useCallback((newFormation: Formation) => {
    if (!globalCache) return;
    
    globalCache = {
      ...globalCache,
      formations: [newFormation, ...globalCache.formations],
      lastUpdated: Date.now()
    };
    
    setData(globalCache);
  }, []);

  const removeFormationFromCache = useCallback((formationId: string) => {
    if (!globalCache) return;
    
    globalCache = {
      ...globalCache,
      formations: globalCache.formations.filter(f => f.id !== formationId),
      lastUpdated: Date.now()
    };
    
    setData(globalCache);
  }, []);

  // Nettoyer le contrôleur d'abort au démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    loadData,
    invalidateCache,
    updateFormationInCache,
    addFormationToCache,
    removeFormationFromCache,
    isCacheValid: isCacheValid()
  };
};
