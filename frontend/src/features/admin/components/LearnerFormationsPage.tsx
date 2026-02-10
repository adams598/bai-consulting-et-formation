import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  PlayCircle, 
  CheckCircle, 
  Award,
  Calendar,
  User,
  Search,
  Filter,
  Grid,
  List,
  AlertCircle,
  Download,
  Eye,
  CalendarPlus,
  MoreVertical,
  Folder,
  Play,
  Lock
} from 'lucide-react';
import '../styles/admin-typography.css';
import { authService } from '../../../services/authService';
import { formationsApi } from '../../../api/learnerApi';
import { getFormationCoverImageUrl } from '../../../utils/imageUtils';
import { getFormationProgressDetails } from '../../../utils/progressUtils';
import { useToast } from '../../../components/ui/use-toast';
import FormationDetailView from './FormationDetailView';
import { useLearnerFormationsCache } from '../../../hooks/useLearnerFormationsCache';
import calendarApi from '../../../api/calendarApi';
import { formationContentApi } from '../../../api/adminApi';
import LessonPlayer from './LessonPlayer';
import SearchSuggestions from '../../../components/SearchSuggestions';
import { ProBadge } from './ProBadge';

interface LearnerFormation {
  id: string;
  title: string;
  description?: string;
  duration: number; // en minutes
  totalDuration?: number;
  coverImage?: string;
  code?: string;
  pedagogicalModality?: string;
  organization?: string;
  prerequisites?: string;
  objectives?: string;
  detailedProgram?: string;
  targetAudience?: string;
  isActive: boolean;
  lessonCount?: number;
  createdAt: string;
  updatedAt: string;
  universeId?: string;
  isOpportunity?: boolean;
  
  // Informations spécifiques à l'assignation
  assignment?: {
    id: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    progress: number; // pourcentage
    assignedAt: string;
    dueDate?: string;
    isMandatory: boolean;
    lastAccessed?: string;
    timeSpent: number; // en minutes
  };
  
  // Progression globale calculée par le backend
  globalProgress?: number;
  
  hasQuiz: boolean;
  quizPassed?: boolean;
  certificateEarned?: boolean;
}

interface Universe {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LearnerFormationsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hook optimisé pour le cache des données (spécialisé pour les learners)
  const {
    data: cacheData,
    isLoading: adminLoading,
    error: cacheError,
    loadData,
    invalidateCache
  } = useLearnerFormationsCache();

  const [filteredFormations, setFilteredFormations] = useState<LearnerFormation[]>([]);
  const [allFormations, setAllFormations] = useState<LearnerFormation[]>([]);
  const [assignedFormationIds, setAssignedFormationIds] = useState<Set<string>>(new Set());
  const [plannedFormationIds, setPlannedFormationIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<LearnerFormation | null>(null);
  const [showFormationDetail, setShowFormationDetail] = useState(false);
  const [showLessonPlayer, setShowLessonPlayer] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  
  // États pour les suggestions de recherche
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  
  const { toast } = useToast();

  // Variables dérivées du cache
  const formations = cacheData?.formations || [];
  const universes = cacheData?.universes || [];
  const isLoading = adminLoading;
  
  // États pour les univers récupérés via l'API
  const [apiUniverses, setApiUniverses] = useState<any[]>([]);

  useEffect(() => {
    // Charger les données via la nouvelle API pour les COLLABORATOR
    loadAllFormationsWithAssignment();
    // Charger les événements du calendrier pour savoir quelles formations sont planifiées
    loadCalendarEvents();
  }, [location.pathname]); // Recharger quand on revient sur cette page

  // Fonction pour charger les événements du calendrier
  const loadCalendarEvents = async () => {
    try {
      const eventsResponse = await calendarApi.getEvents();
      if (eventsResponse.success && eventsResponse.data) {
        // Récupérer les IDs des formations déjà planifiées
        const formationIds: string[] = eventsResponse.data
          .filter((event: any) => event.type === 'FORMATION' && event.formationId)
          .map((event: any) => event.formationId as string);
        
        const plannedIds = new Set<string>(formationIds);
        setPlannedFormationIds(plannedIds);
        // console.log('📅 Formations déjà planifiées:', plannedIds.size);
      }
    } catch (error) {
      console.warn('Aucun événement trouvé, calendrier vide');
      setPlannedFormationIds(new Set<string>());
    }
  };

  // Fonction pour charger toutes les formations avec indication d'assignation
  const loadAllFormationsWithAssignment = async () => {
    try {
      const response = await formationsApi.getAllFormationsWithAssignment();
      const formationsData = response.data;
      
      // console.log('📊 Formations chargées avec assignation:', formationsData.length);
      
      // Debug: Afficher les données brutes de l'API
      // console.log('🔍 Données brutes de l\'API (première formation):', formationsData[0]);
      // console.log('🔍 Champs de la première formation:', {
      //   title: formationsData[0]?.title,
      //   pedagogicalModality: formationsData[0]?.pedagogicalModality,
      //   organization: formationsData[0]?.organization,
      //   code: formationsData[0]?.code
      // });
      
      // Extraire les univers uniques des formations
      const uniqueUniverses = new Map();
      formationsData.forEach((formation: any) => {
        // console.log(`🔍 Formation "${formation.title}":`, {
        //   id: formation.id,
        //   universeId: formation.universeId,
        //   universe: formation.universe,
        //   isOpportunity: formation.isOpportunity
        // });
        
        if (formation.universe && formation.universeId) {
          uniqueUniverses.set(formation.universeId, formation.universe);
        }
      });
      
      // Stocker les univers récupérés via l'API
      setApiUniverses(Array.from(uniqueUniverses.values()));
      
      // console.log('🌍 Univers récupérés via l\'API:', Array.from(uniqueUniverses.values()));

      // Transformer les données de l'API
      const transformedFormations: LearnerFormation[] = formationsData.map((formation: any) => {
        // S'assurer que isAssigned est bien défini (true ou false, jamais undefined)
        const isAssigned = formation.isAssigned === true;
        
        // Debug: Log les formations avec isAssigned undefined/null
        if (formation.isAssigned === undefined || formation.isAssigned === null) {
          console.warn(`⚠️ Formation "${formation.title}" (ID: ${formation.id}) a isAssigned=${formation.isAssigned}, considérée comme NON assignée`);
        }
        
        return {
          id: formation.id,
          title: formation.title,
          description: formation.description,
          duration: formation.duration,
          totalDuration: formation.totalDuration,
          coverImage: formation.coverImage,
          code: formation.code,
          pedagogicalModality: formation.pedagogicalModality,
          organization: formation.organization,
          prerequisites: formation.prerequisites,
          objectives: formation.objectives,
          detailedProgram: formation.detailedProgram,
          targetAudience: formation.targetAudience,
          isActive: formation.isActive,
          lessonCount: formation.lessonCount,
          createdAt: formation.createdAt,
          updatedAt: formation.updatedAt,
          universeId: formation.universeId,
          isOpportunity: formation.isOpportunity,
          hasQuiz: formation.hasQuiz,
          
          // Informations d'assignation
          assignment: formation.assignment || {
            id: 'default',
            status: 'PENDING' as const,
            progress: 0,
            assignedAt: formation.createdAt.toString(),
            isMandatory: false,
            timeSpent: 0
          },
          globalProgress: formation.globalProgress || 0,
          quizPassed: formation.quizPassed || false,
          certificateEarned: formation.certificateEarned || false
        };
      });
      
      // Stocker toutes les formations
      setAllFormations(transformedFormations);
      
      // Extraire les IDs des formations assignées
      // Utiliser une vérification explicite pour éviter les problèmes avec undefined/null
      const assignedIds = new Set(
        formationsData
          .filter((f: any) => f.isAssigned === true)
          .map((f: any) => f.id)
      );
            // Debug: Log pour vérifier les formations non assignées
            const nonAssignedFormations = formationsData.filter((f: any) => f.isAssigned !== true);
            // console.log('🔒 Formations NON assignées:', nonAssignedFormations.map((f: any) => ({ id: f.id, title: f.title, isAssigned: f.isAssigned })));
            
            setAssignedFormationIds(assignedIds);
            
            setFilteredFormations(transformedFormations);
            
    } catch (error) {
      console.error('❌ Erreur lors du chargement des formations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les formations. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    filterFormations();
  }, [filteredFormations, searchTerm, statusFilter]);

  // Fermer le menu déroulant quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeDropdown && !target.closest('.dropdown-menu') && !target.closest('.dropdown-trigger')) {
        setActiveDropdown(null);
      }
      // Fermer les suggestions de recherche si on clique ailleurs
      if (showSearchSuggestions && !target.closest('.search-suggestions-container')) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown, showSearchSuggestions]);

  // loadUniverses supprimée - utilise le hook useLearnerFormationsCache

  // loadFormations supprimée - utilise le hook useLearnerFormationsCache

  const filterFormations = () => {
    // Cette fonction n'est plus nécessaire car les formations sont déjà filtrées
    // via le hook useLearnerFormationsCache
    // console.log('📊 Formations filtrées:', filteredFormations.length);
  };

  // Fonctions utilitaires mémorisées
  const formatDuration = useCallback((seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else if (seconds < 86400) { // < 24h
      const hours = Math.floor(seconds / 3600);
      return `${hours}h`;
    } else if (seconds < 604800) { // < 7 jours
      const days = Math.floor(seconds / 86400);
      return `${days}j`;
    } else {
      const weeks = Math.floor(seconds / 604800);
      return `${weeks}w`;
    }
  }, []);

  // Fonction pour formater la date de modification
  const formatModificationDate = useCallback((updatedAt: string | Date) => {
    if (!updatedAt) return '0';
    
    const updateDate = new Date(updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updateDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays.toString();
  }, []);

  const formatFormationTitle = useCallback((title: string): string => {
    const maxLength = 25;
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength).trim() + '...';
  }, []);

  const formatFormationDescription = useCallback((description: string | undefined): string => {
    const defaultDescription = "Aucune description disponible pour cette formation.";
    const maxLength = 80;
    
    if (!description || description.trim() === '') {
      return defaultDescription;
    }
    
    if (description.length <= maxLength) {
      return description;
    }
    
    return description.substring(0, maxLength).trim() + '...';
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Terminée';
      case 'IN_PROGRESS':
        return 'En cours';
      case 'PENDING':
        return 'En attente';
      default:
        return 'Inconnu';
    }
  };

  // Fonction pour vérifier si une formation est assignée
  const isFormationAssigned = (formationId: string): boolean => {
    // Vérification explicite : une formation est assignée uniquement si son ID est dans le Set
    const isAssigned = assignedFormationIds.has(formationId);
    
    // Debug: Log pour les formations non assignées
    if (!isAssigned && formationId) {
      // Vérifier si la formation existe dans allFormations
      const formation = allFormations.find(f => f.id === formationId);
      // if (formation) {
      //   console.log(`⚠️ Formation "${formation.title}" (ID: ${formationId}) n'est PAS dans assignedFormationIds`);
      // }
    }
    
    return isAssigned;
  };

  // Fonction pour vérifier si une formation est déjà planifiée
  const isFormationPlanned = (formationId: string): boolean => {
    return plannedFormationIds.has(formationId);
  };

  // Gestionnaires d'événements
  const handleFormationClick = async (formation: LearnerFormation) => {
    // Vérifier si la formation est assignée
    if (!isFormationAssigned(formation.id)) {
      toast({
        title: "Formation verrouillée",
        description: "Cette formation ne vous a pas été assignée. Contactez votre administrateur pour y avoir accès.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFormation(formation);
    
    // Si c'est une formation d'opportunités commerciales, ouvrir directement le viewer vidéo
    if (formation) {
      try {
        setIsLoadingLessons(true);
        
        // Charger les leçons de la formation
        const response = await formationContentApi.getByFormation(formation.id);
        // console.log('📦 [COLLABORATOR] Réponse brute de l\'API:', response);
        // console.log('📦 [COLLABORATOR] Type de response.data:', typeof response.data);
        
        // Vérifier la structure de la réponse
        let lessonsData = response.data;
        
        // Si response.data contient success/data, extraire le bon niveau
        if (response.data && response.data.success && response.data.data) {
          // console.log('📦 [COLLABORATOR] Structure API avec success/data détectée');
          lessonsData = response.data.data;
        }
        
        // console.log('📦 [COLLABORATOR] Données de leçons avant filtrage:', lessonsData);
        
        // Filtrer seulement les leçons (pas les sections) et trier par ordre
        const lessonsOnly = (Array.isArray(lessonsData) ? lessonsData : [])
          .filter((content: any) => content.contentType === 'LESSON')
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        
        // console.log('📚 [COLLABORATOR] Leçons filtrées:', lessonsOnly);
        // console.log('📚 [COLLABORATOR] Nombre de leçons:', lessonsOnly.length);
        
        setLessons(lessonsOnly);
        
        // Ouvrir le viewer avec la première leçon
        if (lessonsOnly.length > 0) {
          setShowLessonPlayer(true);
        } else {
          toast({
            title: "Aucune leçon",
            description: "Cette formation ne contient pas encore de leçons.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des leçons:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les leçons de cette formation.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLessons(false);
      }
    } else {
      console.log('⚠️ Formation sélectionnée invalide');
    }
  };

  const handleScheduleFormation = (formation: LearnerFormation) => {
    // Vérifier si la formation est assignée
    if (!isFormationAssigned(formation.id)) {
      toast({
        title: "Formation verrouillée",
        description: "Cette formation ne vous a pas été assignée. Contactez votre administrateur pour y avoir accès.",
        variant: "destructive",
      });
      return;
    }

    // Rediriger vers la page calendrier avec la formation pré-sélectionnée
    navigate('/admin/calendar', {
      state: {
        selectedFormation: {
          id: formation.id,
          title: formation.title,
          description: formation.description,
          duration: formation.duration
        },
        action: 'schedule'
      }
    });
  };

  const handleStartFormation = (formation: LearnerFormation) => {
    // TODO: Implémenter la logique pour démarrer une formation
    // console.log('Démarrer la formation:', formation.id);
    toast({
      title: "Formation démarrée",
      description: `Vous avez commencé la formation "${formation.title}"`,
    });
  };

  const handleContinueFormation = (formation: LearnerFormation) => {
    // TODO: Implémenter la logique pour continuer une formation
    // console.log('Continuer la formation:', formation.id);
  };

  const handleDownloadCertificate = (formation: LearnerFormation) => {
    // TODO: Implémenter le téléchargement du certificat
    // console.log('Télécharger le certificat pour:', formation.id);
    toast({
      title: "Téléchargement",
      description: `Téléchargement du certificat pour "${formation.title}"`,
    });
  };

  // Gestionnaires pour les suggestions de recherche
  const handleSearchInputFocus = () => {
    setShowSearchSuggestions(true);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowSearchSuggestions(true);
  };

  const handleSuggestionClick = (formation: LearnerFormation) => {
    handleFormationClick(formation);
    setSearchTerm('');
    setShowSearchSuggestions(false);
  };

  const handleSearchSuggestionsClose = () => {
    setShowSearchSuggestions(false);
  };

  if (isLoading || isLoadingLessons) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si on affiche le viewer de leçons (pour les opportunités)
  if (showLessonPlayer && selectedFormation && lessons.length > 0) {
    return (
      <LessonPlayer
        formation={{
          id: selectedFormation.id,
          title: selectedFormation.title,
          description: selectedFormation.description || '',
          duration: selectedFormation.duration,
          universeId: selectedFormation.universeId // Ajouter universeId pour la logique de basculement au quiz
        }}
        lessons={lessons}
        initialSelectedLesson={lessons[0]} // Commencer par la première leçon
        onClose={() => {
          setShowLessonPlayer(false);
          setSelectedFormation(null);
          setLessons([]);
        }}
        onProgressUpdate={(lessonId, progress) => {
          // console.log('📊 Progression mise à jour:', lessonId, progress);
        }}
        onLessonUpdate={() => {
          // Les apprenants ne peuvent pas modifier les leçons
          // console.log('📚 Modification de leçon non autorisée pour les apprenants');
        }}
      />
    );
  }

  // Si on affiche le détail d'une formation, remplacer complètement la vue
  if (showFormationDetail && selectedFormation) {
    return (
      <FormationDetailView
        formation={{
          id: selectedFormation.id,
          title: selectedFormation.title,
          description: selectedFormation.description || '',
          duration: selectedFormation.duration || 0,
          isActive: true,
          hasQuiz: false,
          quizRequired: false,
          createdBy: '',
          createdAt: selectedFormation.createdAt || new Date().toISOString(),
          updatedAt: selectedFormation.updatedAt || new Date().toISOString(),
          coverImage: selectedFormation.coverImage
        }}
        formationStats={{
          bankCount: 0,
          userCount: 0
        }}
        onBack={() => setShowFormationDetail(false)}
        onEdit={() => {}} // Pas d'édition pour les COLLABORATOR
        onDelete={() => {}} // Pas de suppression pour les COLLABORATOR
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Contrôles de vue et recherche */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Barre de recherche */}
        <div className="relative flex-1 search-suggestions-container">
          <input
            ref={setSearchInputRef}
            type="text"
            placeholder="Rechercher une formation..."
            value={searchTerm}
            onChange={handleSearchInputChange}
            onFocus={handleSearchInputFocus}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Suggestions de recherche */}
          <SearchSuggestions
            searchTerm={searchTerm}
            formations={allFormations.map(f => ({
              id: f.id,
              title: f.title,
              description: f.description || '',
              duration: f.duration || 0,
              isActive: f.isActive,
              hasQuiz: f.hasQuiz || false,
              quizRequired: false,
              createdBy: '',
              createdAt: f.createdAt || new Date().toISOString(),
              updatedAt: f.updatedAt || new Date().toISOString(),
              universeId: f.universeId,
              isOpportunity: f.isOpportunity
            }))}
            universes={apiUniverses.map(u => ({
              id: u.id,
              name: u.name,
              description: u.description,
              color: u.color || '#6B7280',
              isActive: u.isActive,
              createdAt: u.createdAt,
              updatedAt: u.updatedAt
            }))}
            onSuggestionClick={(formation) => {
              const learnerFormation = allFormations.find(f => f.id === formation.id);
              if (learnerFormation) {
                handleSuggestionClick(learnerFormation);
              }
            }}
            onClose={handleSearchSuggestionsClose}
            isVisible={showSearchSuggestions}
          />
        </div>

        
      </div>


      {/* Contenu principal */}
      <div className="bg-neutral-50 shadow-md p-6">
        

        {allFormations.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune formation trouvée</p>
            <p className="text-gray-400">
              {searchTerm ? 'Essayez de modifier votre recherche' : 'Aucune formation disponible'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section formations groupées par univers - toutes les formations */}
            {(() => {
              // Grouper TOUTES les formations par univers (pas de filtrage artificiel)
              const formationsByUniverse: { [key: string]: any[] } = {};
              const formationsWithoutUniverse: any[] = [];
              
              allFormations.forEach(formation => {
                const universeId = formation.universeId;
                
                // Si la formation n'a pas d'universeId, la mettre dans une section spéciale
                if (!universeId) {
                  console.warn(`⚠️ Formation "${formation.title}" sans universeId, ajoutée à la section "Autres formations"`);
                  formationsWithoutUniverse.push(formation);
                  return;
                }
                
                if (!formationsByUniverse[universeId]) {
                  formationsByUniverse[universeId] = [];
                }
                formationsByUniverse[universeId].push(formation);
              });

              // Rendu des univers
              const universeSections = Object.entries(formationsByUniverse)
                .sort(([aId, aFormations], [bId, bFormations]) => {
                  // Mettre 'opportunites-commerciales' en premier
                  if (aId === 'opportunites-commerciales') return -1;
                  if (bId === 'opportunites-commerciales') return 1;
                  
                  // Pour les autres univers, trier par nombre de formations décroissant
                  const aCount = Array.isArray(aFormations) ? aFormations.length : 0;
                  const bCount = Array.isArray(bFormations) ? bFormations.length : 0;
                  
                  return bCount - aCount;
                })
                .map(([universeId, formations]) => {
                  // Trouver l'univers correspondant dans les univers de l'API
                  const universe = apiUniverses.find((u: any) => u.id === universeId);
                  
                  // Si l'univers n'est pas trouvé, ignorer ces formations ou les grouper différemment
                  if (!universe) {
                    console.warn(`⚠️ Univers "${universeId}" non trouvé pour les formations:`, formations.map(f => f.title));
                    return null; // Ignorer ce groupe
                  }

                  return (
                  <div key={universeId} className="space-y-4">
                    {/* Barre de séparation grise et discrète */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-gray-300"></div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-gray-50">
                        {/* <div 
                          className="w-3 h-3"
                          style={{ backgroundColor: universe.color || '#6B7280' }}
                        ></div> */}
                        <span className="text-2xl font-medium text-gray-700 uppercase mb-2">
                          {universe.name}
                        </span>
                        
                      </div>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {formations.map((formation, index) => {
                        const isAssigned = isFormationAssigned(formation.id);
                        
                        // Debug: Vérifier les formations non assignées
                        // if (!isAssigned) {
                        //   console.log(`🔒 Formation NON assignée détectée: "${formation.title}" (ID: ${formation.id})`);
                        // }
                        
                        return (
                        <div
                          key={formation.id}
                          className={`group relative transition-all duration-300 ease-in-out overflow-hidden ${
                            isAssigned 
                              ? 'cursor-pointer hover:scale-105' 
                              : 'cursor-not-allowed'
                          }`}
                          onClick={() => isAssigned && handleFormationClick(formation)}
                        >
                          {/* Section supérieure - Fond brand-blue avec logo BAI */}
                          <div className="h-36 bg-brand-blue transition-all duration-300 flex items-center justify-center relative">
                            {/* Logo BAI au centre dans un cercle beige */}
                            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 flex items-center justify-center">
                              <div className="w-16 h-16 border-2 border-brand-beige rounded-full flex items-center justify-center">
                                <img 
                                  src="/images/BAI 2-modified.png" 
                                  alt="BAI Logo" 
                                  className="w-10 h-10 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>

                            {/* Icône cadenas au survol pour les formations non assignées */}
                            {!isAssigned && (
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                                  <Lock className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}

                            {/* Icône agenda au survol pour les formations assignées ET non planifiées */}
                            {isAssigned && !isFormationPlanned(formation.id) && (
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleScheduleFormation(formation);
                                  }}
                                  className="w-6 h-6 rounded-full bg-brand-beige hover:bg-opacity-80 flex items-center justify-center transition-all duration-200"
                                  title="Planifier dans l'agenda"
                                >
                                  <Calendar className="h-3 w-3 text-brand-blue" />
                                </button>
                              </div>
                            )}
                            
                            {/* Badge "Planifiée" pour les formations déjà planifiées */}
                            {isAssigned && isFormationPlanned(formation.id) && (
                              <div className="absolute top-3 right-3">
                                <div className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Planifiée
                                </div>
                              </div>
                            )}
                            
                            {/* Badge code de la formation */}
                            {formation.code && formation.code.trim() !== '' && (
                              <div className="absolute top-3 left-3">
                                <div className="px-3 py-1.5 border-2 border-white bg-transparent backdrop-blur-sm">
                                  <span className="text-brand-beige font-bold text-sm tracking-wide">
                                    {(formation.code || '').toString().trim().toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Section inférieure - Fond blanc */}
                          <div className="bg-gray-50 p-4 transition-colors duration-300">
                            <div className='space-y-3'>
                              {/* Titre de la formation */}
                              <h3 className="font-medium text-sm leading-tight text-gray-900" title={formation.title}>
                                {formation.title.length > 30 ? `${formation.title.substring(0, 30)}...` : formation.title}
                              </h3>
                              
                              {/* E-learning et durée */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {formation.pedagogicalModality || 'E-learning'}
                                </span>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {formatDuration(formation.duration || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                  );
                })
                .filter(Boolean);

              // Section pour les formations sans univers
              const otherFormationsSection = formationsWithoutUniverse.length > 0 ? (
                <div key="other-formations" className="space-y-4">
                  {/* Barre de séparation grise et discrète */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: '#6B7280' }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        Autres formations
                      </span>
                      
                    </div>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {formationsWithoutUniverse.map((formation, index) => {
                      const isAssigned = isFormationAssigned(formation.id);
                      
                      // Debug: Vérifier les formations non assignées
                      // if (!isAssigned) {
                      //   console.log(`🔒 Formation sans univers NON assignée: "${formation.title}" (ID: ${formation.id})`);
                      // }
                      
                      return (
                      <div
                        key={formation.id}
                        className={`group relative w-64 h-48 transition-all duration-300 ease-in-out rounded-lg overflow-hidden ${
                          isAssigned 
                            ? 'cursor-pointer hover:scale-105' 
                            : 'cursor-not-allowed'
                        }`}
                        onClick={() => handleFormationClick(formation)}
                      >
                        {/* Section supérieure - Fond brand-blue avec logo BAI (70% de la hauteur) */}
                        <div className="h-[70%] bg-brand-blue rounded-t-lg transition-all duration-300 group-hover:shadow-2xl">
                          {/* Logo BAI au centre avec bordure beige */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center">
                            <div className="w-12 h-12 border-2 border-brand-beige rounded-full flex items-center justify-center">
                              <img 
                                src="/images/BAI 2-modified.png" 
                                alt="BAI Logo" 
                                className="w-8 h-8"
                              />
                            </div>
                          </div>

                          {/* Icône cadenas au survol pour les formations non assignées */}
                          {!isAssigned && (
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                                <Lock className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          )}

                          {/* Icône agenda au survol pour les formations assignées ET non planifiées */}
                          {isAssigned && !isFormationPlanned(formation.id) && (
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleScheduleFormation(formation);
                                }}
                                className="w-6 h-6 rounded-full bg-brand-beige hover:bg-opacity-80 flex items-center justify-center transition-all duration-200"
                                title="Planifier dans l'agenda"
                              >
                                <Calendar className="h-3 w-3 text-brand-blue" />
                              </button>
                            </div>
                          )}
                          
                          {/* Badge "Planifiée" pour les formations déjà planifiées */}
                          {isAssigned && isFormationPlanned(formation.id) && (
                            <div className="absolute top-3 right-3">
                              <div className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Planifiée
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section inférieure - Fond blanc (30% de la hauteur) */}
                        <div className="h-[30%] bg-white rounded-b-lg p-4 flex flex-col justify-between">
                          {/* Titre de la formation */}
                            <h3 className="font-semibold text-sm leading-tight text-gray-900 mb-1 truncate" title={formation.title}>
                              {formation.title.length > 30 ? `${formation.title.substring(0, 30)}...` : formation.title}
                            </h3>
                          
                          {/* E-learning et durée */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {formation.pedagogicalModality || 'E-learning'}
                            </span>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatDuration(formation.duration || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              ) : null;

              // Retourner toutes les sections
              return [...universeSections, otherFormationsSection].filter(Boolean);
            })()}
          </div>
        )}
      </div>

    </div>
  );
};

export default LearnerFormationsPage;
