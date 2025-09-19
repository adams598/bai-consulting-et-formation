import { useState, useEffect, useCallback, useRef } from 'react';
import { formationsApi, bankFormationApi, universesApi } from '../api/adminApi';
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

export const useFormationsCache = () => {
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
      console.log('📦 Utilisation du cache existant');
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
      
      console.log('🔄 Chargement des données formations...');
      
      // Charger les formations et universes en parallèle
      const [formationsResponse, universesResponse] = await Promise.all([
        formationsApi.getAllFormations(),
        universesApi.getAll()
      ]);

      if (signal.aborted) return null;

      const formations = formationsResponse.data.data || [];
      const universesData = universesResponse.data.success ? universesResponse.data.data : [];
      
      // Ajouter l'univers FSU pour les formations sans univers
      const formationsWithoutUniverse = formations.filter(f => !f.universeId);
      const latestFSUUpdate = formationsWithoutUniverse.length > 0 
        ? new Date(Math.max(...formationsWithoutUniverse.map(f => new Date(f.updatedAt).getTime())))
        : new Date('2025-01-01');

      const fsuUniverse: Universe = {
        id: 'fsu',
        name: 'FSU',
        description: 'Formations Sans Univers',
        color: '#6B7280',
        isActive: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: latestFSUUpdate,
        formationCount: formationsWithoutUniverse.length
      };

      // Calculer le nombre de formations par univers
      const universesWithCounts = [fsuUniverse, ...universesData].map(universe => {
        const universeFormations = formations.filter(f => f.universeId === universe.id);
        return { ...universe, formationCount: universeFormations.length };
      });
      
      const universes = universesWithCounts;

      console.log(`📊 Chargement des statistiques pour ${formations.length} formations...`);
      
      // Charger toutes les statistiques en une seule requête
      const statsResponse = await bankFormationApi.getAllFormationsStats();
      
      if (signal.aborted) return null;

      const formationStats = statsResponse.data.data || {};

      const cacheData: CacheData = {
        formations,
        universes,
        formationStats,
        lastUpdated: Date.now()
      };

      // Mettre à jour le cache global
      globalCache = cacheData;
      setData(cacheData);

      console.log('✅ Données chargées et mises en cache');
      return cacheData;

    } catch (error: any) {
      if (signal.aborted) return null;
      
      console.error('❌ Erreur lors du chargement des données:', error);
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
    console.log('🗑️ Invalidation du cache');
    globalCache = null;
    setData(null);
  }, []);

  const updateFormationInCache = useCallback((updatedFormation: Formation) => {
    if (!globalCache) return;
    
    console.log(`🔄 Mise à jour formation en cache: ${updatedFormation.title}`);
    
    const updatedFormations = globalCache.formations.map(f => 
      f.id === updatedFormation.id ? updatedFormation : f
    );
    
    // Recalculer les univers avec les nouveaux compteurs
    const formationsWithoutUniverse = updatedFormations.filter(f => !f.universeId);
    const latestFSUUpdate = formationsWithoutUniverse.length > 0 
      ? new Date(Math.max(...formationsWithoutUniverse.map(f => new Date(f.updatedAt).getTime())))
      : new Date('2025-01-01');

    const fsuUniverse: Universe = {
      id: 'fsu',
      name: 'FSU',
      description: 'Formations Sans Univers',
      color: '#6B7280',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: latestFSUUpdate,
      formationCount: formationsWithoutUniverse.length
    };

    // Recalculer les compteurs des autres univers
    const updatedUniverses = [fsuUniverse, ...globalCache.universes.slice(1)].map(universe => {
      const universeFormations = updatedFormations.filter(f => f.universeId === universe.id);
      return { ...universe, formationCount: universeFormations.length };
    });
    
    globalCache = {
      ...globalCache,
      formations: updatedFormations,
      universes: updatedUniverses,
      lastUpdated: Date.now()
    };
    
    setData(globalCache);
    console.log('✅ Cache mis à jour intelligemment - pas de rechargement réseau');
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

  const updateFormationStatsInCache = useCallback((formationId: string, stats: FormationStats) => {
    if (!globalCache) return;
    
    globalCache = {
      ...globalCache,
      formationStats: {
        ...globalCache.formationStats,
        [formationId]: stats
      },
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
    updateFormationStatsInCache,
    isCacheValid: isCacheValid()
  };
};
