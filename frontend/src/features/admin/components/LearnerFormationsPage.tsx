import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<LearnerFormation | null>(null);
  const [showFormationDetail, setShowFormationDetail] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
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
  }, []);

  // Fonction pour charger toutes les formations avec indication d'assignation
  const loadAllFormationsWithAssignment = async () => {
    try {
      const response = await formationsApi.getAllFormationsWithAssignment();
      const formationsData = response.data;
      
      console.log('📊 Formations chargées avec assignation:', formationsData.length);
      
      // Debug: Afficher les données brutes de l'API
      console.log('🔍 Données brutes de l\'API:', formationsData);
      
      // Extraire les univers uniques des formations
      const uniqueUniverses = new Map();
      formationsData.forEach((formation: any) => {
        console.log(`🔍 Formation "${formation.title}":`, {
          id: formation.id,
          universeId: formation.universeId,
          universe: formation.universe,
          isOpportunity: formation.isOpportunity
        });
        
        if (formation.universe && formation.universeId) {
          uniqueUniverses.set(formation.universeId, formation.universe);
        }
      });
      
      // Stocker les univers récupérés via l'API
      setApiUniverses(Array.from(uniqueUniverses.values()));
      
      console.log('🌍 Univers récupérés via l\'API:', Array.from(uniqueUniverses.values()));

      // Transformer les données de l'API
      const transformedFormations: LearnerFormation[] = formationsData.map((formation: any) => ({
        id: formation.id,
        title: formation.title,
        description: formation.description,
        duration: formation.duration,
        totalDuration: formation.totalDuration,
        coverImage: formation.coverImage,
        code: formation.code,
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
      }));
      
      // Stocker toutes les formations
      setAllFormations(transformedFormations);
      
      // Extraire les IDs des formations assignées
      const assignedIds = new Set(
        formationsData
          .filter((f: any) => f.isAssigned)
          .map((f: any) => f.id)
      );
      setAssignedFormationIds(assignedIds);
      
      setFilteredFormations(transformedFormations);
      
      console.log('✅ Formations transformées:', transformedFormations.length);
      console.log('🔒 Formations assignées:', assignedIds.size);
      
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
    console.log('📊 Formations filtrées:', filteredFormations.length);
  };

  // Fonctions utilitaires mémorisées
  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
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
    return assignedFormationIds.has(formationId);
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
    if (formation.isOpportunity || formation.universeId === 'opportunites-commerciales') {
      console.log('🎥 Ouverture du viewer vidéo pour formation opportunité:', formation.id);
      
      try {
        setIsLoadingLessons(true);
        
        // Charger les leçons de la formation
        const response = await formationContentApi.getByFormation(formation.id);
        
        // Filtrer seulement les leçons (pas les sections) et trier par ordre
        const lessonsOnly = response.data
          .filter((content: any) => content.contentType === 'LESSON')
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        
        setLessons(lessonsOnly);
        
        console.log('📚 Leçons chargées:', lessonsOnly.length);
        
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
      // Comportement normal pour les formations d'univers
      setShowFormationDetail(true);
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

    setSelectedFormation(formation);
    setShowScheduleModal(true);
    setActiveDropdown(null);
  };

  const handleStartFormation = (formation: LearnerFormation) => {
    // TODO: Implémenter la logique pour démarrer une formation
    console.log('Démarrer la formation:', formation.id);
    toast({
      title: "Formation démarrée",
      description: `Vous avez commencé la formation "${formation.title}"`,
    });
  };

  const handleContinueFormation = (formation: LearnerFormation) => {
    // TODO: Implémenter la logique pour continuer une formation
    console.log('Continuer la formation:', formation.id);
  };

  const handleDownloadCertificate = (formation: LearnerFormation) => {
    // TODO: Implémenter le téléchargement du certificat
    console.log('Télécharger le certificat pour:', formation.id);
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
          description: selectedFormation.description || ''
        }}
        lessons={lessons}
        initialSelectedLesson={lessons[0]} // Commencer par la première leçon
        onClose={() => {
          setShowLessonPlayer(false);
          setSelectedFormation(null);
          setLessons([]);
        }}
        onProgressUpdate={(lessonId, progress) => {
          console.log('📊 Progression mise à jour:', lessonId, progress);
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

        {/* Filtres et contrôles */}
        <div className="flex items-center gap-3">
          {/* Filtre par statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminées</option>
          </select>

        </div>
      </div>


      {/* Contenu principal */}
      <div className="bg-white shadow-md p-6">
        

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
                      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: universe.color || '#6B7280' }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">
                          {universe.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({formations.length} formation{formations.length > 1 ? 's' : ''})
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {formations.map((formation, index) => {
                        const isAssigned = isFormationAssigned(formation.id);
                        return (
                        <div
                          key={formation.id}
                          className={`group rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${
                            isAssigned 
                              ? 'bg-slate-700 hover:bg-slate-600 hover:shadow-xl hover:scale-105 cursor-pointer' 
                              : 'bg-gray-400 cursor-not-allowed opacity-60'
                          }`}
                          onClick={() => handleFormationClick(formation)}
                        >
                          {/* Section supérieure avec logo */}
                          <div 
                            className={`h-32 relative flex items-center justify-center transition-colors duration-300 ${
                              isAssigned 
                                ? 'bg-slate-700 group-hover:bg-slate-600' 
                                : 'bg-gray-400'
                            }`}
                          >
                            {/* Logo BAI en haut à gauche */}
                            <div className="absolute top-3 left-3">
                              <div className="w-8 h-8">
                                <img 
                                  src="/images/BAI 2-modified.png" 
                                  alt="BAI Logo" 
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    // Fallback si l'image n'est pas trouvée
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>

                            {/* Icône cadenas pour les formations non assignées */}
                            {!isAssigned && (
                              <div className="absolute top-3 right-3">
                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                  <Lock className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            )}

                            {/* Icône agenda au survol pour les formations assignées */}
                            {isAssigned && (
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleScheduleFormation(formation);
                                  }}
                                  className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center transition-all duration-200"
                                  title="Planifier dans l'agenda"
                                >
                                  <Calendar className="h-4 w-4 text-white" />
                                </button>
                              </div>
                            )}

                            {/* Titre de la formation centré */}
                            <div className="text-center px-6">
                              <h3 className={`font-bold text-sm leading-tight mb-1 ${
                                isAssigned ? 'text-amber-50' : 'text-gray-200'
                              }`}>
                                {formation.title}
                              </h3>
                              <div className={`w-full h-px opacity-50 ${
                                isAssigned ? 'bg-amber-50' : 'bg-gray-200'
                              }`}></div>
                            </div>
                          </div>
                          
                          {/* Section inférieure */}
                          <div className={`p-4 transition-colors duration-300 ${
                            isAssigned 
                              ? 'bg-slate-700 group-hover:bg-slate-600' 
                              : 'bg-gray-400'
                          }`}>
                            <div className="flex items-center justify-between">
                              {/* Numéro de cours */}
                              <div>
                                <div className={`font-bold text-sm ${
                                  isAssigned ? 'text-amber-50' : 'text-gray-200'
                                }`}>
                                  cours n°{index + 1}
                                </div>
                              </div>
                              
                              {/* Date de modification centrée */}
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 flex items-center justify-center ${
                                  isAssigned ? 'bg-amber-50' : 'bg-gray-200'
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    isAssigned ? 'bg-slate-900' : 'bg-gray-400'
                                  }`}></div>
                                </div>
                                <span className={`text-xs ${
                                  isAssigned ? 'text-amber-50' : 'text-gray-200'
                                }`}>
                                  • Modifié il y a {formatModificationDate(formation.updatedAt)} jours
                                </span>
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
                      <span className="text-xs text-gray-500">
                        ({formationsWithoutUniverse.length} formation{formationsWithoutUniverse.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {formationsWithoutUniverse.map((formation, index) => {
                      const isAssigned = isFormationAssigned(formation.id);
                      return (
                      <div
                        key={formation.id}
                        className={`group rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${
                          isAssigned 
                            ? 'bg-slate-700 hover:bg-slate-600 hover:shadow-xl hover:scale-105 cursor-pointer' 
                            : 'bg-gray-400 cursor-not-allowed opacity-60'
                        }`}
                        onClick={() => handleFormationClick(formation)}
                      >
                        {/* Section supérieure avec logo */}
                        <div 
                          className={`h-32 relative flex items-center justify-center transition-colors duration-300 ${
                            isAssigned 
                              ? 'bg-slate-700 group-hover:bg-slate-600' 
                              : 'bg-gray-400'
                          }`}
                        >
                          {/* Logo BAI en haut à gauche */}
                          <div className="absolute top-3 left-3">
                            <div className="w-8 h-8">
                              <img 
                                src="/images/BAI 2-modified.png" 
                                alt="BAI Logo" 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  // Fallback si l'image n'est pas trouvée
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>

                          {/* Icône cadenas pour les formations non assignées */}
                          {!isAssigned && (
                            <div className="absolute top-3 right-3">
                              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                <Lock className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}

                          {/* Icône agenda au survol pour les formations assignées */}
                          {isAssigned && (
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleScheduleFormation(formation);
                                }}
                                className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center transition-all duration-200"
                                title="Planifier dans l'agenda"
                              >
                                <Calendar className="h-4 w-4 text-white" />
                              </button>
                            </div>
                          )}

                          {/* Titre de la formation centré */}
                          <div className="text-center px-6">
                            <h3 className={`font-bold text-sm leading-tight mb-1 ${
                              isAssigned ? 'text-amber-50' : 'text-gray-200'
                            }`}>
                              {formation.title}
                            </h3>
                            <div className={`w-full h-px opacity-50 ${
                              isAssigned ? 'bg-amber-50' : 'bg-gray-200'
                            }`}></div>
                          </div>
                        </div>
                        
                        {/* Section inférieure */}
                        <div className={`p-4 transition-colors duration-300 ${
                          isAssigned 
                            ? 'bg-slate-700 group-hover:bg-slate-600' 
                            : 'bg-gray-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            {/* Numéro de cours */}
                            <div>
                              <div className={`font-bold text-sm ${
                                isAssigned ? 'text-amber-50' : 'text-gray-200'
                              }`}>
                                cours n°{index + 1}
                              </div>
                            </div>
                            
                            {/* Date de modification centrée */}
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 flex items-center justify-center ${
                                isAssigned ? 'bg-amber-50' : 'bg-gray-200'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  isAssigned ? 'bg-slate-900' : 'bg-gray-400'
                                }`}></div>
                              </div>
                              <span className={`text-xs ${
                                isAssigned ? 'text-amber-50' : 'text-gray-200'
                              }`}>
                                • Modifié il y a {formatModificationDate(formation.updatedAt)} jours
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

      {/* Modal de planification */}
      {showScheduleModal && selectedFormation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Planifier dans l'agenda
              </h3>
              <p className="text-gray-600 mb-4">
                Formation : <strong>{selectedFormation.title}</strong>
              </p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const date = formData.get('date') as string;
                const time = formData.get('time') as string;
                
                try {
                  // Calculer les dates de début et de fin
                  const startDateTime = new Date(`${date}T${time}`);
                  const endDateTime = new Date(startDateTime.getTime() + (selectedFormation.duration || 60) * 60000); // Durée en minutes
                  
                  // Créer l'événement via l'API
                  await calendarApi.createEvent({
                    title: selectedFormation.title,
                    description: selectedFormation.description || `Formation: ${selectedFormation.title}`,
                    startDate: startDateTime.toISOString(),
                    endDate: endDateTime.toISOString(),
                    type: "FORMATION",
                    formationId: selectedFormation.id,
                    eventType: "formation",
                    color: "#3B82F6", // Bleu pour les formations
                    reminders: [15, 60] // Rappels 15 min et 1h avant
                  });
                  
                  toast({
                    title: "Formation planifiée",
                    description: `"${selectedFormation.title}" a été ajoutée à votre agenda le ${new Date(date).toLocaleDateString('fr-FR')} à ${time}`,
                  });
                  
                  setShowScheduleModal(false);
                } catch (error) {
                  console.error('Erreur lors de la planification:', error);
                  toast({
                    title: "Erreur",
                    description: "Impossible de planifier la formation. Veuillez réessayer.",
                    variant: "destructive",
                  });
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure
                    </label>
                    <input
                      type="time"
                      name="time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Planifier
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LearnerFormationsPage;
