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
  Play
} from 'lucide-react';
import '../styles/admin-typography.css';
import { authService } from '../../../services/authService';
import { formationsApi } from '../../../api/learnerApi';
import { getFormationCoverImageUrl } from '../../../utils/imageUtils';
import { getFormationProgressDetails } from '../../../utils/progressUtils';
import { useToast } from '../../../components/ui/use-toast';
import FormationDetailView from './FormationDetailView';
import { useLearnerFormationsCache } from '../../../hooks/useLearnerFormationsCache';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<LearnerFormation | null>(null);
  const [showFormationDetail, setShowFormationDetail] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const { toast } = useToast();

  // Variables dérivées du cache
  const formations = cacheData?.formations || [];
  const universes = cacheData?.universes || [];
  const isLoading = adminLoading;

  useEffect(() => {
    // Charger les données via le cache (même que pour les admins)
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Transformer les formations du cache en LearnerFormation
    if (formations.length > 0) {
      const transformedFormations: LearnerFormation[] = formations.map((formation: any) => ({
        ...formation,
        // Ajouter les propriétés spécifiques aux apprenants si nécessaire
        assignment: {
          id: 'default',
          status: 'PENDING' as const,
          progress: 0,
          assignedAt: formation.createdAt.toString(),
          isMandatory: false,
          timeSpent: 0
        },
        globalProgress: 0,
        quizPassed: false,
        certificateEarned: false
      }));
      setFilteredFormations(transformedFormations);
    }
  }, [formations]);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

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

  // Gestionnaires d'événements
  const handleFormationClick = (formation: LearnerFormation) => {
    // Si c'est une formation d'opportunités commerciales, ouvrir directement le viewer vidéo
    if (formation.isOpportunity) {
      // TODO: Implémenter l'ouverture du viewer vidéo pour les opportunités
      console.log('Ouverture du viewer vidéo pour formation opportunité:', formation.id);
      // Pour l'instant, on garde la vue détail mais on pourrait ajouter un paramètre spécial
      setSelectedFormation(formation);
      setShowFormationDetail(true);
    } else {
      // Comportement normal pour les formations d'univers
      setSelectedFormation(formation);
      setShowFormationDetail(true);
    }
  };

  const handleScheduleFormation = (formation: LearnerFormation) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
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
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Rechercher une formation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        

        {filteredFormations.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune formation trouvée</p>
            <p className="text-gray-400">
              {searchTerm ? 'Essayez de modifier votre recherche' : 'Aucune formation ne vous a été assignée'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section opportunités commerciales */}
            {filteredFormations.filter(f => f.isOpportunity).length > 0 && (
              <div>
                <div className="flex items-center mb-4">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <div className="px-4">
                    <div className="flex items-center">
                      <div 
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white mr-2"
                        style={{ backgroundColor: '#F59E0B' }}
                      >
                        <Play className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        Traitement des opportunités commerciales
                      </span>
                      <span className="ml-2 text-xs text-orange-600 font-medium">
                        (Vidéo + Quiz)
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({filteredFormations.filter(f => f.isOpportunity).length} formation{filteredFormations.filter(f => f.isOpportunity).length > 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredFormations.filter(f => f.isOpportunity).map((formation) => (
                    <div
                      key={formation.id}
                      className="bg-gradient-to-b from-white to-orange-50 border border-orange-200 rounded-lg p-3 hover:shadow-md transition-shadow relative"
                    >
                      {/* Menu apprenant (3 points) */}
                      <div className="absolute top-2 right-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === formation.id ? null : formation.id);
                          }}
                          className="dropdown-trigger p-1 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>

                        {activeDropdown === formation.id && (
                          <div className="dropdown-menu absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFormationClick(formation);
                                setActiveDropdown(null);
                              }}
                              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir la vidéo
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScheduleFormation(formation);
                                setActiveDropdown(null);
                              }}
                              className="w-full flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <CalendarPlus className="h-4 w-4 mr-2" />
                              Planifier dans l'agenda
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Image de formation */}
                      <div 
                        className="relative h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg mb-3 overflow-hidden group cursor-pointer"
                        onClick={() => handleFormationClick(formation)}
                      >
                        {formation.coverImage ? (
                          <img
                            src={getFormationCoverImageUrl(formation.coverImage)}
                            alt={`Couverture de ${formation.title}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="h-12 w-12 text-orange-500" />
                          </div>
                        )}

                        {/* Badge vidéo */}
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <Play className="h-3 w-3 mr-1" />
                            Vidéo
                          </span>
                        </div>

                        {/* Progression au survol */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="text-2xl font-bold">{formation.globalProgress || formation.assignment?.progress || 0}%</div>
                            <div className="text-xs">Progression</div>
                          </div>
                        </div>
                      </div>

                      {/* Contenu de la carte */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 flex-1 pr-2">
                            {formatFormationTitle(formation.title)}
                          </h3>
                          <div className="flex items-center text-gray-600 flex-shrink-0">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="text-xs">
                              {formatDuration(formation.totalDuration || formation.duration)}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2">
                          {formatFormationDescription(formation.description)}
                        </p>

                        {/* Barre de progression */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progression</span>
                            <span>{formation.globalProgress || formation.assignment?.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${formation.globalProgress || formation.assignment?.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section formations d'univers - groupées par univers */}
            {(() => {
              // Grouper les formations par univers (utilise les formations du cache)
              const formationsByUniverse: { [key: string]: any[] } = {};
              filteredFormations.filter(f => !f.isOpportunity).forEach(formation => {
                const universeId = formation.universeId;
                
                // Si la formation n'a pas d'universeId, l'ignorer pour l'instant
                if (!universeId) {
                  console.warn(`⚠️ Formation "${formation.title}" sans universeId, ignorée`);
                  return;
                }
                
                if (!formationsByUniverse[universeId]) {
                  formationsByUniverse[universeId] = [];
                }
                formationsByUniverse[universeId].push(formation);
              });

              return Object.entries(formationsByUniverse)
                .map(([universeId, formations]) => {
                  // Trouver l'univers correspondant
                  const universe = universes.find((u: any) => u.id === universeId);
                  
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
                      {formations.map((formation, index) => (
                        <div
                          key={formation.id}
                          className="group bg-slate-700 rounded-lg overflow-hidden hover:bg-slate-600 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer"
                          onClick={() => handleFormationClick(formation)}
                        >
                          {/* Section supérieure bleue foncée avec logo */}
                          <div 
                            className="h-32 bg-slate-700 group-hover:bg-slate-600 relative flex items-center justify-center transition-colors duration-300"
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

                            {/* Titre de la formation centré */}
                            <div className="text-center px-6">
                              <h3 className="text-amber-50 font-bold text-sm leading-tight mb-1">
                                {formation.title}
                              </h3>
                              <div className="w-full h-px bg-amber-50 opacity-50"></div>
                            </div>
                          </div>
                          
                          {/* Section inférieure bleue foncée */}
                          <div className="p-4 bg-slate-700 group-hover:bg-slate-600 transition-colors duration-300">
                            <div className="flex items-center justify-between">
                              {/* Numéro de cours */}
                              <div>
                                <div className="text-amber-50 font-bold text-sm">
                                  cours n°{index + 1}
                                </div>
                              </div>
                              
                              {/* Date de modification centrée */}
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-amber-50 rounded-full mr-2 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                                </div>
                                <span className="text-amber-50 text-xs">
                                  • Modifié il y a {formatModificationDate(formation.updatedAt)} jours
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })
                .filter(Boolean);
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
                
                toast({
                  title: "Formation planifiée",
                  description: `"${selectedFormation.title}" a été ajoutée à votre agenda le ${new Date(date).toLocaleDateString('fr-FR')} à ${time}`,
                });
                
                setShowScheduleModal(false);
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
