import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, BookOpen, Users, Settings, FolderOpen, Clock, Database, MoreVertical, Play, HelpCircle, UserPlus, Folder, Grid, List, ArrowLeft, Move, AlertTriangle, Info, Calendar } from 'lucide-react';
import './AdminFormationsPage.css';
import './UniverseFolder.css';
import './DragDrop.css';
import '../styles/admin-typography.css';
import { formationsApi, quizApi, bankFormationApi, universesApi, assignmentsApi } from '../../../api/adminApi';
import { formationsApi as learnerFormationsApi } from '../../../api/learnerApi';
import { Formation, Universe, UniverseFormation } from '../types';
import { getFormationCoverImageUrl } from '../../../utils/imageUtils';
import { authService } from '../../../services/authService';
import { useFormationsCache } from '../../../hooks/useFormationsCache';
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
import { useToast } from '../../../components/ui/use-toast';

const AdminFormationsPage: React.FC = () => {
  // Hook optimisé pour le cache des données (pour les admins)
  const {
    data: cacheData,
    isLoading: adminLoading,
    error: cacheError,
    loadData,
    invalidateCache,
    updateFormationInCache,
    addFormationToCache,
    removeFormationFromCache,
    updateFormationStatsInCache
  } = useFormationsCache();

  // Vérifier si l'utilisateur est admin (MÉMORISÉ)
  const isAdminUser = useMemo(() => {
    const user = authService.getCurrentUser();
    return !!(user && (user.role === 'SUPER_ADMIN' || user.role === 'BANK_ADMIN'));
  }, []);

  const isAdmin = (): boolean => isAdminUser;


  // États locaux
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showContentManager, setShowContentManager] = useState(false);
  const [showFormationDetail, setShowFormationDetail] = useState(false);
  const [showBanksList, setShowBanksList] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [action, setAction] = useState<'edit' | 'delete' | 'quiz' | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // États pour le système d'univers
  const [viewMode, setViewMode] = useState<'formations' | 'universes'>('formations');
  const [universeViewMode, setUniverseViewMode] = useState<'list' | 'cards'>('cards');
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);

  // États spécifiques pour les apprenants
  const [learnerFormations, setLearnerFormations] = useState<Formation[]>([]);
  const [learnerLoading, setLearnerLoading] = useState(false);

  // Variables dérivées selon le rôle
  const formations = isAdminUser ? (cacheData?.formations || []) : learnerFormations;
  const formationStats = cacheData?.formationStats || {};
  const isLoading = isAdminUser ? adminLoading : learnerLoading;
  
  // Pour les COLLABORATOR, créer un univers par défaut si nécessaire
  const universes = useMemo(() => {
    if (isAdminUser) {
      return cacheData?.universes || [];
    } else {
      // Pour les COLLABORATOR, créer un univers par défaut "Mes Formations"
      return [
        {
          id: 'mes-formations',
          name: 'Mes Formations',
          description: 'Formations qui vous sont assignées',
          color: '#3B82F6',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
  }, [isAdminUser, cacheData?.universes]);
  const [showUniverseModal, setShowUniverseModal] = useState(false);
  const [showMoveFormationModal, setShowMoveFormationModal] = useState(false);
  const [formationToMove, setFormationToMove] = useState<Formation | null>(null);
  const [showUniverseEditModal, setShowUniverseEditModal] = useState(false);
  const [universeToEdit, setUniverseToEdit] = useState<Universe | null>(null);
  const [activeUniverseDropdown, setActiveUniverseDropdown] = useState<string | null>(null);
  
  // États pour la sélection multiple
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Hook de confirmation
  const confirmation = useConfirmation();
  
  // Hook pour contrôler la sidebar
  const { setIsCollapsed } = useSidebar();
  
  // Hook pour les notifications
  const { toast } = useToast();

  // Mémorisation des formations par univers pour éviter les recalculs
  const formationsByUniverse = useMemo(() => {
    const grouped: Record<string, Formation[]> = {};
    universes.forEach(universe => {
      if (universe.id === 'fsu') {
        grouped[universe.id] = formations.filter(f => !f.universeId);
      } else {
        grouped[universe.id] = formations.filter(f => f.universeId === universe.id);
      }
    });
    return grouped;
  }, [formations, universes]);

  // Mémorisation des statistiques par univers
  const universeStats = useMemo(() => {
    const stats: Record<string, { count: number; totalDuration: number }> = {};
    Object.entries(formationsByUniverse).forEach(([universeId, universeFormations]) => {
      stats[universeId] = {
        count: universeFormations.length,
        totalDuration: universeFormations.reduce((total, f) => total + (f.totalDuration || f.duration), 0)
      };
    });
    return stats;
  }, [formationsByUniverse]);

  // Fonctions utilitaires pour les mises à jour optimistes
  const addFormationOptimistically = (newFormation: Formation) => {
    // Utiliser le hook de cache pour ajouter la formation
    addFormationToCache(newFormation);
  };

  const updateFormationOptimistically = (updatedFormation: Formation) => {
    // Utiliser le hook de cache pour mettre à jour la formation
    updateFormationInCache(updatedFormation);
    if (selectedFormation?.id === updatedFormation.id) {
      setSelectedFormation(updatedFormation);
    }
  };

  const removeFormationOptimistically = (formationId: string) => {
    // Utiliser le hook de cache pour supprimer la formation
    removeFormationFromCache(formationId);
    if (selectedFormation?.id === formationId) {
      setSelectedFormation(null);
    }
  };

  // Fonctions utilitaires pour les mises à jour optimistes des univers
  const addUniverseOptimistically = (newUniverse: Universe) => {
    // Pour l'ajout d'univers, on peut éviter le rechargement complet
    console.log('✅ Univers ajouté - rechargement léger uniquement');
    // On ne recharge que si nécessaire
  };

  const updateUniverseOptimistically = (updatedUniverse: Universe) => {
    // Mise à jour locale sans rechargement complet
    if (selectedUniverse?.id === updatedUniverse.id) {
      setSelectedUniverse(updatedUniverse);
    }
    console.log('✅ Univers mis à jour - pas de rechargement nécessaire');
  };

  const removeUniverseOptimistically = (universeId: string) => {
    // Mise à jour locale sans rechargement complet
    if (selectedUniverse?.id === universeId) {
      setSelectedUniverse(null);
    }
    console.log('✅ Univers supprimé - pas de rechargement nécessaire');
  };

  // Fonction de filtrage mémorisée
  const filterFormations = useCallback(() => {
    if (!searchTerm.trim()) {
      setFilteredFormations(formations);
    } else {
      const filtered = formations.filter(formation =>
        formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFormations(filtered);
    }
  }, [formations, searchTerm]);

  useEffect(() => {
    // Chargement une seule fois au montage du composant
    if (isAdminUser) {
      loadData();
    } else {
      // Pour les COLLABORATOR, chargement simple sans cache
      loadSimpleFormations();
    }
  }, []); // Pas de dépendances pour éviter la boucle

  useEffect(() => {
    filterFormations();
  }, [filterFormations]);

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

  // Gérer l'affichage des actions en lot
  useEffect(() => {
    setShowBulkActions(selectedFormations.length > 0);
  }, [selectedFormations]);

  // Fonction de chargement optimisée (utilise le hook)
  const refreshData = useCallback(async () => {
    await loadData(true); // Force refresh
  }, [loadData]);

  // Fonction pour formater le titre des formations (mémorisée)
  const formatFormationTitle = useCallback((title: string): string => {
    const maxLength = 25; // Limite de caractères pour l'alignement des titres
    
    if (title.length <= maxLength) {
      return title;
    }
    
    // Tronquer à la limite et ajouter des points de suspension
    return title.substring(0, maxLength).trim() + '...';
  }, []);

  // Fonction pour formater la description des formations (mémorisée)
  const formatFormationDescription = useCallback((description: string | undefined): string => {
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
  }, []);

  // Fonction de chargement simple pour les COLLABORATOR
  const loadSimpleFormations = async () => {
    try {
      setLearnerLoading(true);
      
      // Utiliser la nouvelle API admin spéciale pour COLLABORATOR
      const response = await formationsApi.getMyAssignedFormations();
      
      // Transformer les assignations en formations pour compatibilité
      if (response.data?.success && response.data.data) {
        const transformedFormations: Formation[] = response.data.data.map((assignment: any) => {
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
            hasQuiz: assignment.formation.hasQuiz || false,
            createdBy: assignment.formation.createdBy || '',
            quizRequired: false,
            
            // Informations d'assignation
            assignmentStatus: assignment.status,
            assignmentProgress: assignment.progress || 0,
            assignedAt: assignment.assignedAt,
            dueDate: assignment.dueDate,
          };
        }).filter(formation => formation !== null);
        
        setLearnerFormations(transformedFormations);
      } else {
        setLearnerFormations([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error);
      setLearnerFormations([]);
    } finally {
      setLearnerLoading(false);
    }
  };

  // Les univers sont maintenant gérés par le hook de cache

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
        await refreshData();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // En cas d'erreur, recharger les données pour s'assurer de la cohérence
      await refreshData();
    }
  };

  const handleSaveQuiz = async (quizData: any) => {
    try {
      if (selectedFormation) {
        // Pour l'instant, on suppose qu'il n'y a pas de quiz existant
        // TODO: Vérifier si un quiz existe déjà
        await quizApi.createQuiz(selectedFormation.id, quizData);
        setShowQuizModal(false);
        refreshData();
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
        await refreshData();
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
        await refreshData();
    }
  };

  const handleAssignFormation = (formation: Formation) => {
    setSelectedFormation(formation);
    setShowAssignmentModal(true);
  };

  const handleScheduleFormation = (formation: Formation) => {
    setSelectedFormation(formation);
    setShowScheduleModal(true);
  };

  const handleSaveAssignments = async (assignments: any[]) => {
    try {
      if (!selectedFormation) return;

      // Utiliser notre nouvelle API d'assignation directe
      const assignmentPromises = assignments.map(assignment => 
        assignmentsApi.create({
          userId: assignment.userId,
          formationId: selectedFormation.id,
          assignedBy: authService.getCurrentUser()?.id || '',
          status: 'ASSIGNED',
          isMandatory: assignment.isMandatory || false,
          dueDate: assignment.dueDate
        })
      );

      await Promise.all(assignmentPromises);

      toast({
        title: "Succès",
        description: `${assignments.length} assignation(s) créée(s) avec succès`,
      });

      setShowAssignmentModal(false);
      refreshData(); // Recharger pour mettre à jour les stats
    } catch (error: any) {
      console.error('Erreur lors de l\'attribution:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'assignation des formations",
        variant: "destructive",
      });
    }
  };

  // Fonctions pour la sélection multiple
  const handleSelectFormation = (formationId: string) => {
    setSelectedFormations(prev => {
      if (prev.includes(formationId)) {
        return prev.filter(id => id !== formationId);
      } else {
        return [...prev, formationId];
      }
    });
  };

  const handleSelectAllFormations = () => {
    const formationsToDisplay = getFormationsToDisplay();
    if (selectedFormations.length === formationsToDisplay.length) {
      setSelectedFormations([]);
    } else {
      setSelectedFormations(formationsToDisplay.map(f => f.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      setBulkActionLoading(true);
      
      // Supprimer chaque formation sélectionnée
      for (const formationId of selectedFormations) {
        await formationsApi.deleteFormation(formationId);
      }
      
      // Recharger les formations et réinitialiser la sélection
      await refreshData();
      setSelectedFormations([]);
      setShowBulkDeleteModal(false);
      setShowBulkActions(false);
      
    } catch (error) {
      console.error('Erreur lors de la suppression en lot:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkMove = async (targetUniverseId: string | null) => {
    // TypeScript: targetUniverseId peut être null pour FSU
    try {
      setBulkActionLoading(true);
      
      // Fermer le modal immédiatement
      setShowBulkMoveModal(false);
      setShowBulkActions(false);
      
      console.log(`🔄 Déplacement en lot de ${selectedFormations.length} formations vers l'univers ${targetUniverseId || 'FSU'}`);
      
      // Mise à jour optimiste : mettre à jour toutes les formations sélectionnées
      const formationsToUpdate = formations.filter(f => selectedFormations.includes(f.id));
      formationsToUpdate.forEach(formation => {
        const updatedFormation = { ...formation, universeId: targetUniverseId || undefined };
        updateFormationOptimistically(updatedFormation);
      });
      
      // Réinitialiser la sélection
      setSelectedFormations([]);
      
      // Déplacer chaque formation sélectionnée en parallèle
      await Promise.all(
        selectedFormations.map(formationId => 
          universesApi.moveFormation(formationId, targetUniverseId)
        )
      );
      
      console.log('✅ Déplacement en lot réussi - pas de rechargement nécessaire');
      
    } catch (error) {
      console.error('❌ Erreur lors du déplacement en lot:', error);
      // En cas d'erreur, recharger pour restaurer l'état correct
      await refreshData();
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkAssign = async (assignments: any[]) => {
    try {
      setBulkActionLoading(true);
      
      // Utiliser la nouvelle API d'assignation en lot
      const { userFormationAssignmentApi } = await import('../../../api/adminApi');
      
      const result = await userFormationAssignmentApi.bulkAssignFormationsToUsers({
        formationIds: selectedFormations,
        userIds: assignments.map(a => a.userId),
        bankId: assignments[0]?.bankId || 'default-bank', // TODO: Récupérer la banque de l'utilisateur connecté
        isMandatory: assignments[0]?.isMandatory || false,
        dueDate: assignments[0]?.dueDate || null,
      });
      
      console.log('Assignation en lot réussie:', result);
      
      // Recharger les formations et réinitialiser la sélection
      await refreshData();
      setSelectedFormations([]);
      setShowBulkAssignModal(false);
      setShowBulkActions(false);
      
    } catch (error) {
      console.error('Erreur lors de l\'assignation en lot:', error);
    } finally {
      setBulkActionLoading(false);
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
          await refreshData();
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
      await refreshData();
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
      // Fermer le modal immédiatement pour une meilleure UX
      setShowMoveFormationModal(false);
      setFormationToMove(null);
      
      // Mise à jour optimiste : modifier immédiatement l'universeId de la formation
      const newUniverseId = targetUniverseId === '' ? null : targetUniverseId;
      const updatedFormation = { 
        ...formationToMove, 
        universeId: newUniverseId || undefined
      };
      updateFormationOptimistically(updatedFormation);
      
      console.log(`🔄 Déplacement de la formation ${formationToMove.id} vers l'univers ${newUniverseId || 'FSU'}`);
      
      // Un seul appel API pour déplacer la formation
      await universesApi.moveFormation(formationToMove.id, newUniverseId);
      
      console.log('✅ Déplacement réussi - pas de rechargement nécessaire');
      
    } catch (error) {
      console.error('❌ Erreur lors du déplacement:', error);
      
      // En cas d'erreur, restaurer l'état original et recharger
      updateFormationOptimistically(formationToMove);
      await refreshData();
    }
  };


  // Grouper les formations par univers pour l'affichage (utilise les données mémorisées)
  const getFormationsByUniverse = useCallback(() => {
    return formationsByUniverse;
  }, [formationsByUniverse]);

  // Obtenir les formations à afficher selon le contexte (utilise les données mémorisées)
  const getFormationsToDisplay = useCallback(() => {
    if (selectedUniverse) {
      // Si on est dans un univers spécifique, afficher ses formations
      return formationsByUniverse[selectedUniverse.id] || [];
    } else {
      // Sinon, afficher toutes les formations
      return filteredFormations;
    }
  }, [selectedUniverse, formationsByUniverse, filteredFormations]);

  // Grouper les formations par univers pour l'affichage avec sections
  const getFormationsGroupedByUniverse = () => {
    const grouped: { universe: Universe; formations: Formation[] }[] = [];
    
    universes.forEach(universe => {
      let universeFormations: Formation[] = [];
      
      if (universe.id === 'fsu') {
        universeFormations = filteredFormations.filter(f => !f.universeId);
      } else if (universe.id === 'mes-formations') {
        // Pour l'univers "Mes Formations" des COLLABORATOR, afficher toutes les formations
        universeFormations = filteredFormations;
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

      {/* Barre d'actions en lot - Visible uniquement pour les admins */}
      {showBulkActions && isAdmin() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedFormations.length} formation{selectedFormations.length > 1 ? 's' : ''} sélectionnée{selectedFormations.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={handleSelectAllFormations}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {selectedFormations.length === getFormationsToDisplay().length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkAssignModal(true)}
                disabled={bulkActionLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                Assigner
              </button>
              
              <button
                onClick={() => setShowBulkMoveModal(true)}
                disabled={bulkActionLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                <Move className="h-4 w-4" />
                Déplacer
              </button>
              
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={bulkActionLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
              
              <button
                onClick={() => setSelectedFormations([])}
                className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

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

          {/* Sélecteur de vue principale - Visible uniquement pour les admins */}
          {isAdmin() && (
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
          )}

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
          
          {viewMode === 'formations' && isAdmin() && (
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
        ) : (isAdmin() && viewMode === 'universes') ? (
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
                            {universeStats[universe.id]?.count || 0}
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
                          {formatDuration(universeStats[universe.id]?.totalDuration || 0)}
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
                      {universeStats[universe.id]?.count || 0} élément{(universeStats[universe.id]?.count || 0) > 1 ? 's' : ''}
                    </div>
                    
                    {/* Colonne Durée totale */}
                    <div className="w-24 text-gray-600 flex-shrink-0 text-right">
                      {formatDuration(universeStats[universe.id]?.totalDuration || 0)}
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
                        className={`bg-gradient-to-b from-white to-blue-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow relative ${
                          selectedFormations.includes(formation.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                      >
                        {/* Checkbox de sélection multiple */}
                        {isAdmin() && (
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={selectedFormations.includes(formation.id)}
                              onChange={() => handleSelectFormation(formation.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        )}

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

                        {/* Menu Apprenant (3 points) - Visible uniquement pour les apprenants */}
                        {!isAdmin() && (
                          <div className="absolute top-2 right-2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === formation.id ? null : formation.id);
                              }}
                              className="dropdown-trigger p-1 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                              title="Actions disponibles"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </button>

                            {/* Menu déroulant apprenant */}
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
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Planifier dans l'agenda
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
                  
                  // Recharger les données pour avoir l'univers réel
                  if (response.data.success) {
                    await refreshData();
                  }
                } catch (error) {
                  console.error('Erreur lors de la création de l\'univers:', error);
                  // En cas d'erreur, supprimer l'univers temporaire et recharger
                  removeUniverseOptimistically(`temp-${Date.now()}`);
                  await refreshData();
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

      {/* Modal de suppression en lot */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Supprimer les formations
                  </h3>
                  <p className="text-sm text-gray-600">
                    Cette action est irréversible
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Êtes-vous sûr de vouloir supprimer <strong>{selectedFormations.length}</strong> formation{selectedFormations.length > 1 ? 's' : ''} ?
                Toutes les données associées seront définitivement perdues.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {bulkActionLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de déplacement en lot */}
      {showBulkMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Move className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Déplacer les formations
                  </h3>
                  <p className="text-sm text-gray-600">
                    Sélectionnez l'univers de destination
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                Déplacer <strong>{selectedFormations.length}</strong> formation{selectedFormations.length > 1 ? 's' : ''} vers :
              </p>
              
              <div className="space-y-2 mb-6">
                {/* Option FSU */}
                <button
                  onClick={() => handleBulkMove(null)}
                  disabled={bulkActionLoading}
                  className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                    <span className="font-medium">FSU (Formations Sans Univers)</span>
                  </div>
                </button>
                
                {/* Autres univers */}
                {universes.map((universe) => (
                  <button
                    key={universe.id}
                    onClick={() => handleBulkMove(universe.id)}
                    disabled={bulkActionLoading}
                    className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: universe.color }}
                      ></div>
                      <span className="font-medium">{universe.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkMoveModal(false)}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'assignation en lot */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Assigner les formations
                  </h3>
                  <p className="text-sm text-gray-600">
                    Sélectionnez les collaborateurs et paramètres
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Assigner <strong>{selectedFormations.length}</strong> formation{selectedFormations.length > 1 ? 's' : ''} aux collaborateurs :
              </p>
              
              <div className="space-y-4 mb-6">
                {/* Sélection des collaborateurs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collaborateurs à assigner
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Sélectionnez les collaborateurs qui recevront ces formations :
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="all-users" className="rounded" />
                        <label htmlFor="all-users" className="text-sm text-gray-700">
                          Tous les collaborateurs de la banque
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="specific-users" className="rounded" />
                        <label htmlFor="specific-users" className="text-sm text-gray-700">
                          Collaborateurs spécifiques
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Paramètres d'assignation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paramètres d'assignation
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="is-mandatory" className="rounded" />
                      <label htmlFor="is-mandatory" className="text-sm text-gray-700">
                        Formation obligatoire
                      </label>
                    </div>
                    
                    <div>
                      <label htmlFor="due-date" className="block text-sm text-gray-600 mb-1">
                        Date d'échéance (optionnelle)
                      </label>
                      <input
                        type="date"
                        id="due-date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkAssignModal(false)}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    // TODO: Implémenter la logique de sélection des utilisateurs
                    const mockAssignments = [
                      { userId: 'user1', bankId: 'bank1', isMandatory: true, dueDate: null }
                    ];
                    handleBulkAssign(mockAssignments);
                  }}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {bulkActionLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Assigner les formations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de planification dans l'agenda */}
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
                  // Appel API pour planifier la formation
                  const { formationsApi } = await import('../../../api/learnerApi');
                  
                  await formationsApi.scheduleFormation({
                    formationId: selectedFormation.id,
                    date,
                    time,
                    title: selectedFormation.title,
                    description: `Formation planifiée : ${selectedFormation.title}`
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
                    description: "Impossible de planifier la formation",
                    variant: "destructive"
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

export default AdminFormationsPage; 