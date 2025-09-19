import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Folder
} from 'lucide-react';
import '../styles/admin-typography.css';
import { authService } from '../../../services/authService';
import { formationsApi } from '../../../api/learnerApi';
import { getFormationCoverImageUrl } from '../../../utils/imageUtils';
import { useToast } from '../../../components/ui/use-toast';

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
  
  hasQuiz: boolean;
  quizPassed?: boolean;
  certificateEarned?: boolean;
}

const LearnerFormationsPage: React.FC = () => {
  const [formations, setFormations] = useState<LearnerFormation[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<LearnerFormation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<LearnerFormation | null>(null);
  const [showFormationDetail, setShowFormationDetail] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadFormations();
  }, []);

  useEffect(() => {
    filterFormations();
  }, [formations, searchTerm, statusFilter]);

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

  const loadFormations = async () => {
    try {
      setIsLoading(true);
      
      // Appel API pour charger les formations assignées à l'apprenant
      try {
        const response = await formationsApi.getMyFormations();
        
        // Transformer les données pour correspondre à notre interface
        const transformedFormations: LearnerFormation[] = response.data.map((assignment: any) => ({
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
          universeId: assignment.formation.universeId,
          hasQuiz: assignment.formation.hasQuiz || false,
          
          // Informations d'assignation
          assignment: {
            id: assignment.id,
            status: assignment.status,
            progress: assignment.progress || 0,
            assignedAt: assignment.assignedAt,
            dueDate: assignment.dueDate,
            isMandatory: assignment.isMandatory || false,
            lastAccessed: assignment.lastAccessed,
            timeSpent: assignment.timeSpent || 0,
          }
        }));
        
        setFormations(transformedFormations);
      } catch (apiError) {
        console.warn('Erreur API, utilisation de données de test:', apiError);
        
        // Données de test en cas d'erreur API
        const mockFormations: LearnerFormation[] = [
          {
            id: '1',
            title: 'Sécurité Bancaire',
            description: 'Formation complète sur les mesures de sécurité dans le secteur bancaire',
            duration: 120,
            totalDuration: 120,
            isActive: true,
            lessonCount: 8,
            createdAt: '2024-01-15',
            updatedAt: '2024-01-15',
            hasQuiz: true,
            assignment: {
              id: 'assign-1',
              status: 'COMPLETED',
              progress: 100,
              assignedAt: '2024-01-15',
              isMandatory: true,
              timeSpent: 125,
            },
            certificateEarned: true
          },
          {
            id: '2',
            title: 'Conformité RGPD',
            description: 'Formation sur le Règlement Général sur la Protection des Données',
            duration: 90,
            totalDuration: 90,
            isActive: true,
            lessonCount: 6,
            createdAt: '2024-01-20',
            updatedAt: '2024-01-20',
            hasQuiz: true,
            assignment: {
              id: 'assign-2',
              status: 'IN_PROGRESS',
              progress: 65,
              assignedAt: '2024-01-20',
              dueDate: '2024-03-20',
              isMandatory: true,
              timeSpent: 58,
            }
          }
        ];
        
        setFormations(mockFormations);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos formations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterFormations = () => {
    let filtered = formations;

    // Filtrage par terme de recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(formation =>
        formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(formation => formation.assignment?.status === statusFilter);
    }

    setFilteredFormations(filtered);
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
    setSelectedFormation(formation);
    setShowFormationDetail(true);
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
      <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="admin-title-md admin-title-spacing">
            Mes formations assignées
          </h2>
        </div>

        {filteredFormations.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune formation trouvée</p>
            <p className="text-gray-400">
              {searchTerm ? 'Essayez de modifier votre recherche' : 'Aucune formation ne vous a été assignée'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredFormations.map((formation) => (
              <div
                key={formation.id}
                className="bg-gradient-to-b from-white to-blue-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow relative"
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
                        Voir les détails
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
                  className="relative h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden group cursor-pointer"
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
                      <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                  )}

                  {/* Progression au survol */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-2xl font-bold">{formation.assignment?.progress || 0}%</div>
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
                      <span>{formation.assignment?.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${formation.assignment?.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
