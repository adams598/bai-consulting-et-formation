import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, BookOpen, Users, Settings, FolderOpen, Clock, Database, MoreVertical, Play, HelpCircle, UserPlus, Folder, Grid, List, ArrowLeft, Move, AlertTriangle, Info } from 'lucide-react';
import './AdminFormationsPage.css';
import './UniverseFolder.css';
import './DragDrop.css';
import '../styles/admin-typography.css';
import { formationsApi, quizApi, bankFormationApi, universesApi } from '../../../api/adminApi';
import { Formation, Universe, UniverseFormation } from '../types';
import { getFormationCoverImageUrl } from '../../../utils/imageUtils';
import { authService } from '../../../services/authService';
import { FormationModal } from './FormationModal';
import ConfirmModal from './ConfirmModal';
import ConfirmationModal from './ConfirmationModal';
import QuizConfigModal from './QuizConfigModal';
import FormationContentManager from './FormationContentManager';
import FormationDetailView from './FormationDetailView';
import BanksListView from './BanksListView';
import FormationAssignmentModal from './FormationAssignmentModal';
import { useConfirmation } from '../../../hooks/useConfirmation';
import { useSidebar } from '../../../contexts/SidebarContext';

const AdminFormationsPage: React.FC = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showContentManager, setShowContentManager] = useState(false);
  const [showFormationDetail, setShowFormationDetail] = useState(false);
  const [showBanksList, setShowBanksList] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [action, setAction] = useState<'edit' | 'delete' | 'quiz' | null>(null);
  const [formationStats, setFormationStats] = useState<Record<string, { bankCount: number; userCount: number }>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // États pour le système d'univers
  const [viewMode, setViewMode] = useState<'formations' | 'universes'>('formations');
  const [universeViewMode, setUniverseViewMode] = useState<'list' | 'cards'>('cards');
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [showUniverseModal, setShowUniverseModal] = useState(false);
  const [showMoveFormationModal, setShowMoveFormationModal] = useState(false);
  const [formationToMove, setFormationToMove] = useState<Formation | null>(null);
  const [showUniverseEditModal, setShowUniverseEditModal] = useState(false);
  const [universeToEdit, setUniverseToEdit] = useState<Universe | null>(null);
  const [activeUniverseDropdown, setActiveUniverseDropdown] = useState<string | null>(null);
  
  
  // Hook de confirmation
  const confirmation = useConfirmation();
  
  // Hook pour contrôler la sidebar
  const { setIsCollapsed } = useSidebar();

  // Fonctions utilitaires pour les mises à jour optimistes
  const addFormationOptimistically = (newFormation: Formation) => {
    setFormations(prev => [newFormation, ...prev]);
    setFormationStats(prev => ({
      ...prev,
      [newFormation.id]: { bankCount: 0, userCount: 0 }
    }));
  };

  const updateFormationOptimistically = (updatedFormation: Formation) => {
    setFormations(prev => 
      prev.map(f => f.id === updatedFormation.id ? updatedFormation : f)
    );
    if (selectedFormation?.id === updatedFormation.id) {
      setSelectedFormation(updatedFormation);
    }
  };

  const removeFormationOptimistically = (formationId: string) => {
    setFormations(prev => prev.filter(f => f.id !== formationId));
    setFormationStats(prev => {
      const newStats = { ...prev };
      delete newStats[formationId];
      return newStats;
    });
    if (selectedFormation?.id === formationId) {
      setSelectedFormation(null);
    }
  };

  // Fonctions utilitaires pour les mises à jour optimistes des univers
  const addUniverseOptimistically = (newUniverse: Universe) => {
    setUniverses(prev => [...prev, newUniverse]);
  };

  const updateUniverseOptimistically = (updatedUniverse: Universe) => {
    setUniverses(prev => 
      prev.map(u => u.id === updatedUniverse.id ? updatedUniverse : u)
    );
    if (selectedUniverse?.id === updatedUniverse.id) {
      setSelectedUniverse(updatedUniverse);
    }
  };

  const removeUniverseOptimistically = (universeId: string) => {
    setUniverses(prev => prev.filter(u => u.id !== universeId));
    if (selectedUniverse?.id === universeId) {
      setSelectedUniverse(null);
    }
  };

  // Vérifier si l'utilisateur est admin
  const isAdmin = (): boolean => {
    const user = authService.getCurrentUser();
    return !!(user && (user.role === 'SUPER_ADMIN' || user.role === 'BANK_ADMIN'));
  };


  useEffect(() => {
    loadFormations();
    loadUniverses();
  }, []);

  useEffect(() => {
    filterFormations();
  }, [formations, searchTerm]);

  // Fermer le menu déroulant quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Ne fermer que si le clic n'est pas dans le menu déroulant
      if (activeDropdown && !target.closest('.dropdown-menu') && !target.closest('.dropdown-trigger')) {
        setActiveDropdown(null);
      }
      if (activeUniverseDropdown && !target.closest('.universe-menu') && !target.closest('.universe-menu-trigger')) {
        setActiveUniverseDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown, activeUniverseDropdown]);

  const loadFormations = async () => {
    try {
      setIsLoading(true);
      const response = await formationsApi.getAllFormations();
      // L'API retourne { success: true, data: [...] }
      const formationsData = response.data.data || [];
      setFormations(formationsData);
      
      // Charger les statistiques pour chaque formation
      const stats: Record<string, { bankCount: number; userCount: number }> = {};
      for (const formation of formationsData) {
        try {
          const statsResponse = await bankFormationApi.getFormationStats(formation.id);
          stats[formation.id] = statsResponse.data || { bankCount: 0, userCount: 0 };
        } catch (error) {
          console.error(`Erreur lors du chargement des stats pour la formation ${formation.id}:`, error);
          stats[formation.id] = { bankCount: 0, userCount: 0 };
        }
      }
      setFormationStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour formater le titre des formations
  const formatFormationTitle = (title: string): string => {
    const maxLength = 25; // Limite de caractères pour l'alignement des titres
    
    if (title.length <= maxLength) {
      return title;
    }
    
    // Tronquer à la limite et ajouter des points de suspension
    return title.substring(0, maxLength).trim() + '...';
  };

  // Fonction pour formater la description des formations
  const formatFormationDescription = (description: string | undefined): string => {
    const defaultDescription = "Aucune description disponible pour cette formation.";
    const maxLength = 80; // Limite de caractères pour l'alignement
    
    if (!description || description.trim() === '') {
      return defaultDescription;
    }
    
    if (description.length <= maxLength) {
      return description;
    }
    
    // Tronquer à la limite et ajouter des points de suspension
    return description.substring(0, maxLength).trim() + '...';
  };

  const loadUniverses = async () => {
    try {
      const response = await universesApi.getAll();
      if (response.data.success) {
        // Ajouter l'univers FSU pour les formations sans univers
        // Calculer la date de modification la plus récente des formations sans univers
        const formationsWithoutUniverse = formations.filter(f => !f.universeId);
        const latestFSUUpdate = formationsWithoutUniverse.length > 0 
          ? new Date(Math.max(...formationsWithoutUniverse.map(f => new Date(f.updatedAt).getTime())))
          : new Date('2025-01-01'); // Date fixe si aucune formation FSU

        const fsuUniverse: Universe = {
          id: 'fsu',
          name: 'FSU',
          description: 'Formations Sans Univers',
          color: '#6B7280',
          isActive: true,
          createdAt: new Date('2025-01-01'),
          updatedAt: latestFSUUpdate,
          formationCount: 0
        };
        
        // Calculer le nombre de formations par univers
        const universesWithCounts = [fsuUniverse, ...response.data.data].map(universe => {
          if (universe.id === 'fsu') {
            // Pour FSU, compter les formations sans univers
            const formationsWithoutUniverse = formations.filter(f => !f.universeId);
            return { ...universe, formationCount: formationsWithoutUniverse.length };
          } else {
            // Pour les autres univers, compter les formations avec cet univers
            const formationsInUniverse = formations.filter(f => f.universeId === universe.id);
            return { ...universe, formationCount: formationsInUniverse.length };
          }
        });
        
        setUniverses(universesWithCounts);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des univers:', error);
      // En cas d'erreur, créer au moins l'univers FSU
      const fsuUniverse: Universe = {
        id: 'fsu',
        name: 'FSU',
        description: 'Formations Sans Univers',
        color: '#6B7280',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        formationCount: 0
      };
      setUniverses([fsuUniverse]);
    }
  };

  const filterFormations = () => {
    if (!searchTerm.trim()) {
      setFilteredFormations(formations);
    } else {
      const filtered = formations.filter(formation =>
        formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFormations(filtered);
    }
  };

  const handleCreateFormation = () => {
    setSelectedFormation(null);
    setAction('edit');
    setShowFormationModal(true);
  };

  const handleEditFormation = async (formation: Formation) => {
    try {
    setSelectedFormation(formation);
    setAction('edit');
    setShowFormationModal(true);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du modal d\'édition:', error);
    }
  };

  const handleDeleteFormation = async (formation: Formation) => {
    try {
    setSelectedFormation(formation);
    setAction('delete');
    setShowConfirmModal(true);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la confirmation de suppression:', error);
    }
  };

  const handleManageContent = (formation: Formation) => {
    setSelectedFormation(formation);
    setShowContentManager(true);
  };

  const handleConfigureQuiz = (formation: Formation) => {
    setSelectedFormation(formation);
    setAction('quiz');
    setShowQuizModal(true);
  };

  const handleFormationClick = (formation: Formation) => {
    setSelectedFormation(formation);
    setShowFormationDetail(true);
    // Réduire automatiquement la sidebar quand on ouvre le détail
    setIsCollapsed(true);
  };

  const handleLessonsClick = (formation: Formation, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher le déclenchement de handleFormationClick
    setSelectedFormation(formation);
    setShowFormationDetail(true);
    // Réduire automatiquement la sidebar quand on ouvre le détail
    setIsCollapsed(true);
  };

  const handleBanksClick = (formation: Formation, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher le déclenchement de handleFormationClick
    setSelectedFormation(formation);
    setShowBanksList(true);
  };

  const handleSaveFormation = async (formationData?: Partial<Formation>) => {
    try {
      setShowFormationModal(false);
      
      // Si on a des données de formation (création/modification), les traiter
      if (formationData) {
        if (formationData.id) {
          // Modification d'une formation existante
          updateFormationOptimistically(formationData as Formation);
        } else {
          // Création d'une nouvelle formation
          addFormationOptimistically(formationData as Formation);
        }
      } else {
        // Fallback : recharger les formations si pas de données spécifiques
        await loadFormations();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // En cas d'erreur, recharger les données pour s'assurer de la cohérence
      await loadFormations();
    }
  };

  const handleSaveQuiz = async (quizData: any) => {
    try {
      if (selectedFormation) {
        // Pour l'instant, on suppose qu'il n'y a pas de quiz existant
        // TODO: Vérifier si un quiz existe déjà
        await quizApi.createQuiz(selectedFormation.id, quizData);
        setShowQuizModal(false);
        loadFormations();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du quiz:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedFormation) {
      try {
        // Mise à jour optimiste : supprimer immédiatement de l'interface
        const formationId = selectedFormation.id;
        removeFormationOptimistically(formationId);
        
        setShowConfirmModal(false);
        
        // Si on était en mode détail, retourner à la liste
        if (showFormationDetail) {
          setShowFormationDetail(false);
        }
        
        // Appel API en arrière-plan
        await formationsApi.deleteFormation(formationId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        // En cas d'erreur, recharger les données pour restaurer l'état correct
        await loadFormations();
      }
    }
  };

  const handleToggleActive = async (formation: Formation) => {
    try {
      // Mise à jour optimiste : changer immédiatement le statut dans l'interface
      const updatedFormation = { ...formation, isActive: !formation.isActive };
      updateFormationOptimistically(updatedFormation);
      
      // Appel API en arrière-plan
      await formationsApi.toggleActive(formation.id);
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      // En cas d'erreur, recharger les données pour restaurer l'état correct
      await loadFormations();
    }
  };

  const handleAssignFormation = (formation: Formation) => {
    setSelectedFormation(formation);
    setShowAssignmentModal(true);
  };

  const handleSaveAssignments = async (assignments: any[]) => {
    try {
      // TODO: Appel API pour sauvegarder les attributions individuelles
      console.log('Sauvegarde des attributions:', assignments);
      // await assignmentApi.assignFormationToUsers(selectedFormation!.id, assignments);
      setShowAssignmentModal(false);
      loadFormations(); // Recharger pour mettre à jour les stats
    } catch (error) {
      console.error('Erreur lors de l\'attribution:', error);
    }
  };

  // Fonctions pour gérer les univers
  const handleCreateUniverse = () => {
    setShowUniverseModal(true);
  };

  const handleEditUniverse = (universe: Universe) => {
    setUniverseToEdit(universe);
    setShowUniverseEditModal(true);
    setActiveUniverseDropdown(null);
  };

  const handleDeleteUniverse = (universe: Universe) => {
    if (universe.id === 'fsu') {
      confirmation.showConfirmation({
        title: 'Action impossible',
        message: 'L\'univers FSU ne peut pas être supprimé car il contient toutes les formations sans univers.',
        confirmText: 'Compris',
        type: 'info',
        onConfirm: () => {}
      });
      return;
    }
    
    confirmation.showConfirmation({
      title: 'Supprimer l\'univers',
      message: `Êtes-vous sûr de vouloir supprimer l'univers "${universe.name}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Mise à jour optimiste : supprimer immédiatement l'univers de l'interface
          const universeId = universe.id;
          removeUniverseOptimistically(universeId);
          setActiveUniverseDropdown(null);
          
          // Appel API en arrière-plan
          await universesApi.delete(universeId);
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'univers:', error);
          // En cas d'erreur, recharger les données pour restaurer l'état correct
          await loadUniverses();
        }
      }
    });
  };

  const handleUpdateUniverse = async (universeData: Partial<Universe>) => {
    if (!universeToEdit) return;
    
    try {
      // Mise à jour optimiste : modifier immédiatement l'univers dans l'interface
      const updatedUniverse = { ...universeToEdit, ...universeData };
      updateUniverseOptimistically(updatedUniverse);
      
      setShowUniverseEditModal(false);
      setUniverseToEdit(null);
      
      // Appel API en arrière-plan
      await universesApi.update(universeToEdit.id, universeData);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'univers:', error);
      // En cas d'erreur, recharger les données pour restaurer l'état correct
      await loadUniverses();
    }
  };

  const handleEnterUniverse = (universe: Universe) => {
    setSelectedUniverse(universe);
    setViewMode('formations');
  };

  const handleBackToUniverses = () => {
    setSelectedUniverse(null);
    setViewMode('universes');
  };

  const handleMoveFormation = (formation: Formation) => {
    setFormationToMove(formation);
    setShowMoveFormationModal(true);
  };

  const handleSaveMoveFormation = async (targetUniverseId: string) => {
    if (!formationToMove) return;
    
    try {
      // Mise à jour optimiste : modifier immédiatement l'universId de la formation
      const updatedFormation = { 
        ...formationToMove, 
        universeId: targetUniverseId === '' ? undefined : targetUniverseId 
      };
      updateFormationOptimistically(updatedFormation);
      
      setShowMoveFormationModal(false);
      setFormationToMove(null);
      
      // Appel API en arrière-plan
      if (targetUniverseId === '') {
        // Retirer de l'univers (placer dans FSU)
        if (formationToMove.universeId) {
          await universesApi.moveFormation(formationToMove.id, null);
        }
      } else {
        // Déplacer vers un univers
        if (formationToMove.universeId) {
          // Retirer de l'ancien univers
          await universesApi.moveFormation(formationToMove.id, null);
        }
        // Ajouter au nouvel univers
        await universesApi.moveFormation(formationToMove.id, targetUniverseId);
      }
      
      // Recharger les univers pour mettre à jour les compteurs
      await loadUniverses();
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      // En cas d'erreur, recharger les données pour restaurer l'état correct
      await loadFormations();
      await loadUniverses();
    }
  };


  // Grouper les formations par univers pour l'affichage
  const getFormationsByUniverse = () => {
    const grouped: Record<string, Formation[]> = {};
    
    universes.forEach(universe => {
      if (universe.id === 'fsu') {
        // FSU contient les formations sans univers
        grouped[universe.id] = formations.filter(f => !f.universeId);
      } else {
        // Autres univers contiennent leurs formations
        grouped[universe.id] = formations.filter(f => f.universeId === universe.id);
      }
    });
    
    return grouped;
  };

  // Obtenir les formations à afficher selon le contexte
  const getFormationsToDisplay = () => {
    if (selectedUniverse) {
      // Si on est dans un univers spécifique, afficher ses formations
      if (selectedUniverse.id === 'fsu') {
        return formations.filter(f => !f.universeId);
      } else {
        return formations.filter(f => f.universeId === selectedUniverse.id);
      }
    } else {
      // Sinon, afficher toutes les formations
      return filteredFormations;
    }
  };

  // Grouper les formations par univers pour l'affichage avec sections
  const getFormationsGroupedByUniverse = () => {
    const grouped: { universe: Universe; formations: Formation[] }[] = [];
    
    universes.forEach(universe => {
      let universeFormations: Formation[] = [];
      
      if (universe.id === 'fsu') {
        universeFormations = filteredFormations.filter(f => !f.universeId);
      } else {
        universeFormations = filteredFormations.filter(f => f.universeId === universe.id);
      }
      
      // Ne pas afficher les univers vides
      if (universeFormations.length > 0) {
        grouped.push({ universe, formations: universeFormations });
      }
    });
    
    return grouped;
  };

  // Fonction pour obtenir l'icône de statut
  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-0.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Actif
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactif
      </span>
    );
  };

  // Fonction pour formater la durée
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Afficher la vue détaillée de la formation
  if (showFormationDetail && selectedFormation) {
    return (
      <FormationDetailView
        formation={selectedFormation}
        formationStats={formationStats[selectedFormation.id]}
        onBack={() => {
          setShowFormationDetail(false);
          // Rétablir la sidebar quand on revient à la liste
          setIsCollapsed(false);
        }}
        onEdit={handleEditFormation}
        onDelete={handleDeleteFormation}
      />
    );
  }

  // Afficher la liste des banques
  if (showBanksList && selectedFormation) {
    return (
      <BanksListView
        formation={selectedFormation}
        formationStats={formationStats[selectedFormation.id]}
        onBack={() => setShowBanksList(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      {/* <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Formations</h1>
        <button
          onClick={handleCreateFormation}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nouvelle Formation
        </button>
      </div> */}

      {/* Contrôles de vue et recherche */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Barre de recherche */}
        <div className="relative flex-1">
        <input
          type="text"
            placeholder={viewMode === 'formations' ? "Rechercher une formation..." : "Rechercher un univers..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

        {/* Contrôles de vue */}
        <div className="flex items-center gap-3">
          {/* Bouton retour si on est dans un univers */}
          {selectedUniverse && (
            <button
              onClick={handleBackToUniverses}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux univers
            </button>
          )}

          {/* Sélecteur de vue principale */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('formations')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                viewMode === 'formations' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Formations
            </button>
            <button
              onClick={() => setViewMode('universes')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                viewMode === 'universes' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Folder className="h-4 w-4" />
              Univers
            </button>
          </div>

          {/* Sélecteur de vue univers (si on est en mode univers) */}
          {viewMode === 'universes' && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setUniverseViewMode('cards')}
                className={`p-2 rounded-md transition-colors ${
                  universeViewMode === 'cards' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Vue cartes"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setUniverseViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  universeViewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Vue liste"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="admin-title-md admin-title-spacing">
            {viewMode === 'universes' ? 'Univers disponibles' : 
             selectedUniverse ? `Formations - ${selectedUniverse.name}` : 
             'Formations disponibles'}
          </h2>
          
          {viewMode === 'formations' && (
          <button
          onClick={handleCreateFormation}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nouvelle Formation
        </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Chargement...</p>
          </div>
        ) : viewMode === 'universes' ? (
          /* Vue Univers avec Drag and Drop */
          universes.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun univers trouvé</p>
              <p className="text-gray-400">Commencez par créer votre premier univers</p>
            </div>
          ) : (
            <div className={universeViewMode === 'cards' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' : 'bg-white border border-gray-200 rounded-lg overflow-hidden'}>
              {/* En-tête des colonnes pour la vue liste */}
              {universeViewMode === 'list' && (
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center text-sm font-medium text-gray-700">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-5 mr-2"></div>
                    <span>Nom</span>
                  </div>
                  <div className="w-20 flex-shrink-0 text-right">Taille</div>
                  <div className="w-24 flex-shrink-0 text-right">Durée</div>
                  <div className="w-32 flex-shrink-0">Date de modification</div>
                  <div className="w-28 flex-shrink-0">Type</div>
                  <div className="w-8 flex-shrink-0"></div>
                </div>
              )}
              
              {universes.map((universe) => (
                universeViewMode === 'cards' ? (
                  <div
                    key={universe.id}
                    className="bg-gradient-to-b from-white to-blue-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
                  >
                    {/* Menu Admin (3 points) - Visible uniquement pour les admins */}
                    {isAdmin() && (
                      <div className="absolute top-2 right-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveUniverseDropdown(activeUniverseDropdown === universe.id ? null : universe.id);
                          }}
                          className="dropdown-trigger p-1 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                          title="Actions d'administration"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>

                        {/* Menu déroulant */}
                        {activeUniverseDropdown === universe.id && (
                          <div className="dropdown-menu absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUniverse(universe);
                                setActiveUniverseDropdown(null);
                              }}
                              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier l'univers
                            </button>

                            <div className="border-t border-gray-200 my-1"></div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUniverse(universe);
                                setActiveUniverseDropdown(null);
                              }}
                              className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div 
                      className="cursor-pointer text-center"
                      onClick={() => handleEnterUniverse(universe)}
                    >
                      {/* Icône dossier Windows */}
                      <div className="flex justify-center mb-2">
                        <div className="relative">
                          <svg viewBox="0 0 24 24" className="w-16 h-16 text-yellow-500">
                            <path fill="currentColor" d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                          </svg>
                          {/* Petit badge pour le nombre de formations */}
                          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                            {formations.filter(f => f.universeId === universe.id).length}
                          </div>
                        </div>
                      </div>
                      
                      {/* Nom du dossier */}
                      <h3 className="text-sm font-medium text-gray-800 mb-1 px-1 break-words">
                        {universe.name}
                      </h3>
                      
                      {/* Informations supplémentaires */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center justify-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(formations.filter(f => f.universeId === universe.id).reduce((total, f) => total + (f.totalDuration || f.duration), 0))}
                        </div>
                        {universe.description && (
                          <div className="text-gray-400 truncate px-1">
                            {universe.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Liste univers - Style Windows */
                  <div 
                    key={universe.id} 
                    className="flex items-center py-1 px-3 hover:bg-blue-50 cursor-pointer group border-b border-gray-100 last:border-b-0 text-sm"
                    onClick={() => handleEnterUniverse(universe)}
                  >
                    {/* Colonne Nom */}
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-5 h-5 mr-2 flex-shrink-0">
                        <svg viewBox="0 0 24 24" className="w-full h-full text-yellow-500">
                          <path fill="currentColor" d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                        </svg>
                      </div>
                      <span className="text-gray-900 font-normal truncate">
                        {universe.name}
                      </span>
                    </div>
                    
                    {/* Colonne Taille */}
                    <div className="w-20 text-gray-600 flex-shrink-0 text-right">
                      {formations.filter(f => f.universeId === universe.id).length} élément{(formations.filter(f => f.universeId === universe.id).length > 1 ? 's' : '')}
                    </div>
                    
                    {/* Colonne Durée totale */}
                    <div className="w-24 text-gray-600 flex-shrink-0 text-right">
                      {formatDuration(formations.filter(f => f.universeId === universe.id).reduce((total, f) => total + (f.totalDuration || f.duration), 0))}
                    </div>
                    
                    {/* Colonne Date de modification */}
                    <div className="w-32 text-gray-600 flex-shrink-0">
                      {universe.id === 'fsu' ? (
                        '-'
                      ) : (
                        new Date(universe.updatedAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      )}
                    </div>
                    
                    {/* Colonne Type */}
                    <div className="w-28 text-gray-600 flex-shrink-0">
                      Dossier
                    </div>
                    
                    {/* Menu contextuel - Visible uniquement pour les admins */}
                    {isAdmin() && universe.id !== 'fsu' && (
                      <div className="w-8 flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveUniverseDropdown(activeUniverseDropdown === universe.id ? null : universe.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Actions d'administration"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      
                        {/* Menu déroulant */}
                        {activeUniverseDropdown === universe.id && (
                          <div className="absolute right-4 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUniverse(universe);
                              }}
                              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUniverse(universe);
                              }}
                              className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              ))}
              
              {/* Bouton ajouter univers */}
              {universeViewMode === 'cards' ? (
                <div 
                  onClick={handleCreateUniverse}
                  className="bg-gradient-to-b from-white to-blue-50 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer text-center group"
                >
                  <div className="flex justify-center mb-2">
                    <div className="relative">
                      <svg viewBox="0 0 24 24" className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors">
                        <path fill="currentColor" d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                    Nouveau dossier
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Créer un univers
                  </p>
                </div>
              ) : (
                <div 
                  onClick={handleCreateUniverse}
                  className="flex items-center py-1 px-3 hover:bg-blue-50 cursor-pointer group border-b border-gray-100 text-sm"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-5 h-5 mr-2 flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-full h-full text-gray-400">
                        <path fill="currentColor" d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                      </svg>
                    </div>
                    <span className="text-gray-600 font-normal">
                      Nouveau dossier
                    </span>
                  </div>
                  <div className="w-20 text-gray-500 flex-shrink-0 text-right">
                    -
                  </div>
                  <div className="w-24 text-gray-500 flex-shrink-0 text-right">
                    -
                  </div>
                  <div className="w-32 text-gray-500 flex-shrink-0">
                    -
                  </div>
                  <div className="w-28 text-gray-500 flex-shrink-0">
                    -
                  </div>
                  <div className="w-8 flex-shrink-0"></div>
                </div>
              )}
            </div>
          )
        ) : (
          /* Vue Formations */
          getFormationsToDisplay().length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune formation trouvée</p>
              <p className="text-gray-400">
                {selectedUniverse ? 
                  `Aucune formation dans l'univers "${selectedUniverse.name}"` : 
                  'Commencez par créer votre première formation'
                }
              </p>
          </div>
          ) : selectedUniverse ? (
            /* Vue formations d'un univers spécifique avec Drag and Drop */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getFormationsToDisplay().map((formation) => (
                <div
                  key={formation.id}
                  className="bg-gradient-to-b from-white to-blue-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow relative"
                >
                  {/* Menu Admin (3 points) - Visible uniquement pour les admins */}
                  {isAdmin() && (
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === formation.id ? null : formation.id);
                        }}
                        className="dropdown-trigger p-1 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                        title="Actions d'administration"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>

                      {/* Menu déroulant */}
                      {activeDropdown === formation.id && (
                        <div className="dropdown-menu absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleManageContent(formation);
                              setActiveDropdown(null);
                            }}
                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Gérer le contenu
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfigureQuiz(formation);
                              setActiveDropdown(null);
                            }}
                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Configurer le quiz
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignFormation(formation);
                              setActiveDropdown(null);
                            }}
                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assigner
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFormation(formation);
                              setActiveDropdown(null);
                            }}
                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier la formation
                          </button>

                          <div className="border-t border-gray-200 my-1"></div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveFormation(formation);
                              setActiveDropdown(null);
                            }}
                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Move className="h-4 w-4 mr-2" />
                            Déplacer
                          </button>

                          <div className="border-t border-gray-200 my-1"></div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFormation(formation);
                              setActiveDropdown(null);
                            }}
                            className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div 
                    className="relative h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden group cursor-pointer"
                    onClick={() => handleFormationClick(formation)}
                  >
                    {formation.coverImage ? (
                      <img
                        src={getFormationCoverImageUrl(formation.coverImage)}
                        alt={`Couverture de ${formation.title}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('❌ Erreur de chargement de l\'image de couverture:', formation.coverImage);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}

                    {/* Fallback si pas d'image */}
                    <div className={`w-full h-full flex items-center justify-center ${formation.coverImage ? 'hidden' : ''}`}>
                      <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>

                    {/* Badge de statut - Visible uniquement pour les admins */}
                    {isAdmin() && (
                      <div className="absolute top-2 left-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(formation);
                          }}
                          className="cursor-pointer"
                        >
                          {getStatusIcon(formation.isActive)}
                        </button>
                      </div>
                    )}

                    {/* Statistiques au survol - Visible uniquement pour les admins */}
                    {isAdmin() && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="flex items-center space-x-6 text-white">
                          <div
                            className="flex flex-col items-center hover:text-blue-300 transition-colors cursor-pointer"
                            onClick={(e) => handleLessonsClick(formation, e)}
                            title={`${formation.lessonCount || 0} leçon(s)`}
                          >
                            <BookOpen className="h-4 w-4 mb-1" />
                            <span className="text-xs">{formation.lessonCount || 0}</span>
                          </div>

                          <div
                            className="flex flex-col items-center hover:text-blue-300 transition-colors cursor-pointer"
                            onClick={(e) => handleBanksClick(formation, e)}
                            title={`${formationStats[formation.id]?.bankCount || 0} banque(s)`}
                          >
                            <Database className="h-4 w-4 mb-1" />
                            <span className="text-xs">{formationStats[formation.id]?.bankCount || 0}</span>
                          </div>

                          <div
                            className="flex flex-col items-center hover:text-yellow-300 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfigureQuiz(formation);
                            }}
                            title={formation.hasQuiz ? 'Quiz configuré - Cliquer pour modifier' : 'Quiz non configuré - Cliquer pour configurer'}
                          >
                            <HelpCircle className={`h-4 w-4 mb-1 ${
                              formation.hasQuiz
                                ? 'text-yellow-300'
                                : 'text-white/70'
                            }`} />
                            <span className="text-xs">Quiz</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contenu de la carte */}
                  <div className="space-y-2">
                    {/* Titre et durée */}
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

                    {/* Description */}
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {formatFormationDescription(formation.description)}
                    </p>

                    {/* Action principale - Voir la formation */}
                    <div className="pt-2">
                      {/* <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFormationClick(formation);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center"
                        title="Voir la formation"
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        Voir
                      </button> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Vue formations avec sections par univers */
            <div className="space-y-8">
              {getFormationsGroupedByUniverse().map(({ universe, formations }) => (
                <div key={universe.id}>
                  {/* Séparateur avec titre */}
                  <div className="flex items-center mb-4">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <div className="px-4">
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white mr-2"
                          style={{ backgroundColor: universe.color }}
                        >
                          <Folder className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {universe.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({formations.length} formation{formations.length > 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                  
                  {/* Formations de cet univers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {formations.map((formation) => (
                      <div
                        key={formation.id}
                        className="bg-gradient-to-b from-white to-blue-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow relative"
                      >
                        {/* Menu Admin (3 points) - Visible uniquement pour les admins */}
                        {isAdmin() && (
                          <div className="absolute top-2 right-2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === formation.id ? null : formation.id);
                              }}
                              className="dropdown-trigger p-1 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                              title="Actions d'administration"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </button>

                            {/* Menu déroulant */}
                            {activeDropdown === formation.id && (
                              <div className="dropdown-menu absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48 z-20">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleManageContent(formation);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <FolderOpen className="h-4 w-4 mr-2" />
                                  Gérer le contenu
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfigureQuiz(formation);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Configurer le quiz
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssignFormation(formation);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Assigner
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditFormation(formation);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier la formation
                                </button>

                                <div className="border-t border-gray-200 my-1"></div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveFormation(formation);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Move className="h-4 w-4 mr-2" />
                                  Déplacer
                                </button>

                                <div className="border-t border-gray-200 my-1"></div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFormation(formation);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div 
                          className="relative h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden group cursor-pointer"
                          onClick={() => handleFormationClick(formation)}
                        >
                          {formation.coverImage ? (
                            <img
                              src={getFormationCoverImageUrl(formation.coverImage)}
                              alt={`Couverture de ${formation.title}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('❌ Erreur de chargement de l\'image de couverture:', formation.coverImage);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}

                          {/* Fallback si pas d'image */}
                          <div className={`w-full h-full flex items-center justify-center ${formation.coverImage ? 'hidden' : ''}`}>
                            <BookOpen className="h-12 w-12 text-gray-400" />
                          </div>

                          {/* Badge de statut - Visible uniquement pour les admins */}
                          {isAdmin() && (
                            <div className="absolute top-2 left-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleActive(formation);
                                }}
                                className="cursor-pointer"
                              >
                                {getStatusIcon(formation.isActive)}
                              </button>
                            </div>
                          )}

                          {/* Statistiques au survol - Visible uniquement pour les admins */}
                          {isAdmin() && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <div className="flex items-center space-x-6 text-white">
                                <div
                                  className="flex flex-col items-center hover:text-blue-300 transition-colors cursor-pointer"
                                  onClick={(e) => handleLessonsClick(formation, e)}
                                  title={`${formation.lessonCount || 0} leçon(s)`}
                                >
                                  <BookOpen className="h-4 w-4 mb-1" />
                                  <span className="text-xs">{formation.lessonCount || 0}</span>
                                </div>

                                <div
                                  className="flex flex-col items-center hover:text-blue-300 transition-colors cursor-pointer"
                                  onClick={(e) => handleBanksClick(formation, e)}
                                  title={`${formationStats[formation.id]?.bankCount || 0} banque(s)`}
                                >
                                  <Database className="h-4 w-4 mb-1" />
                                  <span className="text-xs">{formationStats[formation.id]?.bankCount || 0}</span>
                                </div>

                                <div
                                  className="flex flex-col items-center hover:text-yellow-300 transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfigureQuiz(formation);
                                  }}
                                  title={formation.hasQuiz ? 'Quiz configuré - Cliquer pour modifier' : 'Quiz non configuré - Cliquer pour configurer'}
                                >
                                  <HelpCircle className={`h-4 w-4 mb-1 ${
                                    formation.hasQuiz
                                      ? 'text-yellow-300'
                                      : 'text-white/70'
                                  }`} />
                                  <span className="text-xs">Quiz</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Contenu de la carte */}
                        <div className="space-y-2">
                          {/* Titre et durée */}
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

                          {/* Description */}
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {formatFormationDescription(formation.description)}
                          </p>

                          {/* Action principale - Voir la formation */}
                          <div className="pt-2">
                            {/* <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFormationClick(formation);
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-md transition-colors duration-200 flex items-center justify-center"
                              title="Voir la formation"
                            >
                              <BookOpen className="h-3 w-3 mr-1" />
                              Voir
                            </button> */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal de création/édition de formation */}
      {showFormationModal && (
        <FormationModal
          formation={selectedFormation}
          onClose={() => setShowFormationModal(false)}
          onSave={handleSaveFormation}
          universeId={selectedUniverse?.id === 'fsu' ? undefined : selectedUniverse?.id}
        />
      )}

      {/* Modal de configuration du quiz */}
      {showQuizModal && selectedFormation && (
        <QuizConfigModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          onSave={handleSaveQuiz}
          formationId={selectedFormation.id}
          existingQuiz={null}
        />
      )}

      {/* Gestionnaire de contenu */}
      {showContentManager && selectedFormation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <FormationContentManager
              formation={selectedFormation}
              onClose={() => setShowContentManager(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showConfirmModal && (
        <ConfirmModal
          title="Supprimer la formation"
          message={`Êtes-vous sûr de vouloir supprimer la formation "${selectedFormation?.title}" ?`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowConfirmModal(false)}
          confirmText="Supprimer"
          variant="danger"
        />
      )}

      {/* Modal d'attribution individuelle */}
      {showAssignmentModal && selectedFormation && (
        <FormationAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          formation={selectedFormation}
          onSave={handleSaveAssignments}
        />
      )}

      {/* Modal de création d'univers */}
      {showUniverseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouvel univers</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const name = formData.get('name') as string;
                const description = formData.get('description') as string;
                const color = formData.get('color') as string;
                
                try {
                  // Mise à jour optimiste : créer l'univers immédiatement dans l'interface
                  const tempId = `temp-${Date.now()}`;
                  const newUniverse: Universe = {
                    id: tempId,
                    name,
                    description: description || undefined,
                    color: color || '#3B82F6',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    formationCount: 0
                  };
                  addUniverseOptimistically(newUniverse);
                  setShowUniverseModal(false);
                  
                  // Appel API en arrière-plan
                  const response = await universesApi.create({
                    name,
                    description: description || undefined,
                    color: color || '#3B82F6',
                    isActive: true
                  });
                  
                  // Remplacer l'univers temporaire par la vraie réponse de l'API
                  if (response.data.success) {
                    const realUniverse = response.data.data;
                    setUniverses(prev => 
                      prev.map(u => u.id === tempId ? realUniverse : u)
                    );
                  }
                } catch (error) {
                  console.error('Erreur lors de la création de l\'univers:', error);
                  // En cas d'erreur, supprimer l'univers temporaire et recharger
                  removeUniverseOptimistically(`temp-${Date.now()}`);
                  await loadUniverses();
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'univers
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Banque, Conformité..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optionnel)
                    </label>
                    <textarea
                      name="description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Description de l'univers..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Couleur
                    </label>
                    <div className="flex gap-2">
                      {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'].map(color => (
                        <button
                          key={color}
                          type="button"
                          name="color"
                          value={color}
                          className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-gray-400"
                          style={{ backgroundColor: color }}
                          onClick={(e) => {
                            const target = e.target as HTMLButtonElement;
                            const form = target.closest('form');
                            if (form) {
                              const colorInput = form.querySelector('input[name="color"]') as HTMLInputElement;
                              if (colorInput) {
                                colorInput.value = color;
                              }
                            }
                          }}
                        />
                      ))}
                    </div>
                    <input type="hidden" name="color" value="#3B82F6" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowUniverseModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition d'univers */}
      {showUniverseEditModal && universeToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Modifier l'univers</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const name = formData.get('name') as string;
                const description = formData.get('description') as string;
                const color = formData.get('color') as string;
                
                await handleUpdateUniverse({
                  name,
                  description: description || undefined,
                  color: color || universeToEdit.color
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'univers
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={universeToEdit.name}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Banque, Conformité..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optionnel)
                    </label>
                    <textarea
                      name="description"
                      defaultValue={universeToEdit.description || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Description de l'univers..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Couleur
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { name: 'Bleu', value: '#3B82F6' },
                        { name: 'Vert', value: '#10B981' },
                        { name: 'Violet', value: '#8B5CF6' },
                        { name: 'Orange', value: '#F59E0B' },
                        { name: 'Rouge', value: '#EF4444' },
                        { name: 'Cyan', value: '#06B6D4' },
                        { name: 'Rose', value: '#EC4899' },
                        { name: 'Indigo', value: '#6366F1' }
                      ].map(colorOption => (
                        <button
                          key={colorOption.value}
                          type="button"
                          name="color"
                          value={colorOption.value}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            universeToEdit.color === colorOption.value 
                              ? 'border-gray-400 scale-110' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: colorOption.value }}
                          onClick={(e) => {
                            const target = e.target as HTMLButtonElement;
                            const form = target.closest('form');
                            if (form) {
                              const colorInput = form.querySelector('input[name="color"]') as HTMLInputElement;
                              if (colorInput) {
                                colorInput.value = colorOption.value;
                              }
                            }
                          }}
                          title={colorOption.name}
                        />
                      ))}
                    </div>
                    <input type="hidden" name="color" defaultValue={universeToEdit.color} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowUniverseEditModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sauvegarder
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={confirmation.hideConfirmation}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmText={confirmation.options?.confirmText}
        cancelText={confirmation.options?.cancelText}
        type={confirmation.options?.type}
        isLoading={confirmation.isLoading}
      />

      {/* Modal de déplacement de formation */}
      {showMoveFormationModal && formationToMove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Déplacer "{formationToMove.title}"
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Choisissez l'univers de destination pour cette formation :
                </p>
                {universes.map(universe => (
                  <button
                    key={universe.id}
                    onClick={() => handleSaveMoveFormation(universe.id)}
                    className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white mr-3"
                      style={{ backgroundColor: universe.color }}
                    >
                      <Folder className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{universe.name}</div>
                      {universe.description && (
                        <div className="text-sm text-gray-500">{universe.description}</div>
                      )}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => handleSaveMoveFormation('')}
                  className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center text-white mr-3">
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Retirer de l'univers</div>
                    <div className="text-sm text-gray-500">Placer dans FSU</div>
                  </div>
                </button>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowMoveFormationModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFormationsPage; 