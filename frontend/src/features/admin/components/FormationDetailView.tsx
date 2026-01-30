import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, Database, Plus, Edit, Trash2, X, RefreshCw, Users, Play, Lock, GripVertical, ArrowUpDown, CheckCircle, Layers, User as UserIcon, Globe, Target, List } from 'lucide-react';
import { Formation, FormationContent } from '../types';
import { getFormationCoverImageUrl, getLessonImageUrl } from '../../../utils/imageUtils';
import { formationContentApi, progressApi } from '../../../api/adminApi';
import { authService } from '../../../services/authService';
import ConfirmModal from './ConfirmModal';
import { FormationModal } from './FormationModal';
import BanksListView from './BanksListView';
import LessonModal from './LessonModal';
import LessonPlayer from './LessonPlayer';
import { useAuth } from '../../../providers/auth-provider';
import { 
  getFormationCode, 
  getFormationPedagogicalModality, 
  getFormationOrganization, 
  getFormationPrerequisites,
  getFormationObjectives,
  getFormationDetailedProgram,
  getFormationTargetAudience
} from '../utils/formationUtils';


interface FormationDetailViewProps {
  formation: Formation;
  formationStats?: { bankCount: number; userCount: number };
  onBack: () => void;
  onEdit: (formation: Formation) => void;
  onDelete: (formation: Formation) => void;
}

const FormationDetailView: React.FC<FormationDetailViewProps> = ({
  formation,
  formationStats,
  onBack,
  onEdit,
  onDelete
}) => {
  // États pour les progressions et drag & drop
  const [lessonProgress, setLessonProgress] = useState<{[key: string]: {
    timeSpent: number;
    progress: number;
    completed: boolean;
  }}>({});
  const [lessons, setLessons] = useState<FormationContent[]>([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<FormationContent | null>(null);
  const [action, setAction] = useState<'create' | 'edit'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // État pour vérifier le rôle de l'utilisateur
  const [userRole, setUserRole] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  
  // Nouveaux états pour gérer les actions de formation
  const [showEditFormationModal, setShowEditFormationModal] = useState(false);
  const [showDeleteFormationModal, setShowDeleteFormationModal] = useState(false);
  const [localFormation, setLocalFormation] = useState<Formation>(formation);
  
  // État pour afficher la liste des banques
  const [showBanksList, setShowBanksList] = useState(false);
  
  // État pour le lecteur de leçons
  const [showLessonPlayer, setShowLessonPlayer] = useState(false);
  
  // État pour l'affichage complet de la description
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // État pour afficher les leçons (après clic sur LANCER)
  const [showLessons, setShowLessons] = useState(false);
  
  // États pour le drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLesson, setDraggedLesson] = useState<FormationContent | null>(null);
  
  // État pour la modale de réorganisation des leçons
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderLessons, setReorderLessons] = useState<FormationContent[]>([]);
  const [draggedReorderIndex, setDraggedReorderIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Fonctions utilitaires pour l'affichage des leçons
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'PRESENTATION':
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      case 'VIDEO':
        return <BookOpen className="h-5 w-5 text-green-600" />;
      case 'DOCUMENT':
        return <BookOpen className="h-5 w-5 text-blue-700" />;
      case 'INTERACTIVE':
        return <BookOpen className="h-5 w-5 text-purple-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'PRESENTATION':
        return 'Présentation';
      case 'VIDEO':
        return 'Vidéo';
      case 'DOCUMENT':
        return 'Document';
      case 'INTERACTIVE':
        return 'Interactif';
      default:
        return 'Autre';
    }
  };

  useEffect(() => {
    checkUserRole();
  }, [formation.id]);

  useEffect(() => {
    if (userRole) {
      loadLessons();
    }
  }, [formation.id, userRole]);

  // Vérifier le rôle de l'utilisateur
  const checkUserRole = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserRole(user.role);
        setIsAdmin(user.role === 'SUPER_ADMIN' || user.role === 'BANK_ADMIN');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error);
      setUserRole('COLLABORATOR');
      setIsAdmin(false);
    }
  };

  // Initialiser les progressions quand les leçons sont chargées
  useEffect(() => {
    if (lessons.length > 0) {
      initializeLessonProgress();
    }
  }, [lessons]);

  // Mettre à jour la formation locale quand elle change
  useEffect(() => {
    setLocalFormation(formation);
  }, [formation]);

  // Fonction pour forcer la synchronisation de l'état local
  const syncLocalFormation = (updatedFormation: Formation) => {
    setLocalFormation(updatedFormation);
    // Forcer un re-render en créant un nouvel objet
    setLocalFormation({ ...updatedFormation });
  };

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser l'API admin pour tous les rôles (les permissions sont gérées côté backend)
      const response = await formationContentApi.getByFormation(formation.id);
      
      // Filtrer seulement les leçons (pas les sections) et trier par ordre
      const lessonsOnly = response.data
        .filter((content: FormationContent) => content.contentType === 'LESSON')
        .sort((a: FormationContent, b: FormationContent) => (a.order || 0) - (b.order || 0));
      setLessons(lessonsOnly);
      
      // console.log('📚 Leçons chargées:', lessonsOnly.length);
      
    } catch (error) {
      console.error('Erreur lors du chargement des leçons:', error);
      setError('Erreur lors du chargement des leçons');
      setLessons([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialiser les progressions des leçons (comme dans LessonPlayer)
  const initializeLessonProgress = () => {
    const progressMap: {[key: string]: {
      timeSpent: number;
      progress: number;
      completed: boolean;
    }} = {};
    
    lessons.forEach(lesson => {
      progressMap[lesson.id] = {
        timeSpent: 0,
        progress: 0,
        completed: false
      };
    });
    
        setLessonProgress(progressMap);
    // console.log('📈 Progressions initialisées:', progressMap);
  };

  // Mettre à jour la progression d'une leçon avec vérification d'accessibilité
  const updateLessonProgressWithValidation = (lessonId: string, progress: {
    timeSpent?: number;
    progress?: number;
    completed?: boolean;
  }) => {
    // Trouver l'index de la leçon
    const lessonIndex = lessons.findIndex(lesson => lesson.id === lessonId);
    if (lessonIndex === -1) return;

    // Vérifier si la leçon est accessible
    const isAccessible = isLessonAccessible(lessons[lessonIndex], lessonIndex);
    
    if (!isAccessible) {
      // console.log('🚫 Progression bloquée pour', lessons[lessonIndex].title, '- Leçon non accessible');
      return;
    }

    // Mettre à jour l'état local
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        ...progress
      }
    }));
    // console.log('📊 Progression mise à jour pour', lessonId, ':', progress);
  };

  // Fonction de test pour simuler des progressions (à supprimer en production)
  const simulateProgress = () => {
    lessons.forEach((lesson, index) => {
      setTimeout(() => {
        const randomProgress = Math.floor(Math.random() * 100);
        const randomTimeSpent = Math.floor(Math.random() * 300); // 0-5 minutes
        updateLessonProgressWithValidation(lesson.id, {
          progress: randomProgress,
          timeSpent: randomTimeSpent,
          completed: randomProgress >= 90
        });
      }, index * 1000); // Délai de 1 seconde entre chaque leçon
    });
  };

  // Fonctions pour la réorganisation des leçons
  const handleOpenReorderModal = () => {
    setReorderLessons([...lessons]);
    setShowReorderModal(true);
  };

  const handleCloseReorderModal = () => {
    setShowReorderModal(false);
    setReorderLessons([]);
  };

  const handleReorderLesson = (fromIndex: number, toIndex: number) => {
    const newLessons = [...reorderLessons];
    const [movedLesson] = newLessons.splice(fromIndex, 1);
    newLessons.splice(toIndex, 0, movedLesson);
    setReorderLessons(newLessons);
  };

  // Fonctions de drag & drop pour la modale de réorganisation
  const handleReorderDragStart = (e: React.DragEvent, index: number) => {
    setDraggedReorderIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Nécessaire pour Firefox
  };

  const handleReorderDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(targetIndex);
  };

  const handleReorderDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleReorderDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedReorderIndex !== null && draggedReorderIndex !== targetIndex) {
      handleReorderLesson(draggedReorderIndex, targetIndex);
    }
    
    setDraggedReorderIndex(null);
    setDragOverIndex(null);
  };

  const handleReorderDragEnd = () => {
    setDraggedReorderIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveReorder = async () => {
    try {
      // Mettre à jour les ordres des leçons
      const updatedLessons = reorderLessons.map((lesson, index) => ({
        ...lesson,
        order: index + 1
      }));

      // Sauvegarder en base de données
      const lessonOrders = updatedLessons.map(lesson => ({
        id: lesson.id,
        order: lesson.order
      }));

      await formationContentApi.reorderLessons(formation.id, lessonOrders);
      
      // Mettre à jour l'état local
      setLessons(updatedLessons);
      setShowReorderModal(false);
      
      // console.log('✅ Ordre des leçons mis à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la réorganisation:', error);
    }
  };

  const handleCreateLesson = () => {
    setSelectedLesson(null);
    setAction('create');
    setShowLessonModal(true);
  };

  const handleEditLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setAction('edit');
    setShowLessonModal(true);
  };

  const handleDeleteLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setShowConfirmModal(true);
  };

  const handleSaveLesson = async (lessonData: any) => {
    try {
      // console.log('💾 Sauvegarde de la leçon:', lessonData);
      
      setIsSubmitting(true);
      setError(null);
      
      if (selectedLesson && action === 'edit') {
        // Mode édition : mettre à jour la leçon existante via l'API
        const response = await formationContentApi.updateLesson(selectedLesson.id, {
          title: lessonData.title,
          description: lessonData.description,
          type: lessonData.type,
          duration: lessonData.duration || 30,
          order: selectedLesson.order,
          coverImage: lessonData.coverImage,
          fileUrl: lessonData.fileUrl || undefined // Inclure l'URL Cloudinary si disponible
        });
        
        if (response.success) {
          // Mettre à jour la liste locale avec la réponse de l'API
          const updatedLessons = lessons.map(lesson => 
            lesson.id === selectedLesson.id 
              ? response.data
              : lesson
          );
          
          setLessons(updatedLessons);
          
          // Recalculer la durée totale
          const newTotalDuration = updatedLessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
          syncLocalFormation({
            ...localFormation,
            totalDuration: newTotalDuration
          });
          
          // Fermer le modal
          setShowLessonModal(false);
          
          // console.log('✏️ Leçon modifiée avec succès:', response.data);
          // console.log('⏱️ Nouvelle durée totale:', formatDuration(newTotalDuration));
        }
        
      } else {
        // Mode création : ajouter une nouvelle leçon via l'API
        const response = await formationContentApi.addLesson(localFormation.id, {
          title: lessonData.title,
          description: lessonData.description,
          type: lessonData.type,
          duration: lessonData.duration || 30,
          order: lessons.length + 1,
          coverImage: lessonData.coverImage,
          fileUrl: lessonData.fileUrl || undefined // Inclure l'URL Cloudinary si disponible
        });
        
        if (response.success) {
          // Ajouter la nouvelle leçon à la liste locale
          setLessons(prev => [...prev, response.data]);
          
          // Mettre à jour la durée totale de la formation
          const newTotalDuration = calculateTotalDuration() + response.data.duration;
          syncLocalFormation({
            ...localFormation,
            totalDuration: newTotalDuration
          });
          
          // Fermer le modal
          setShowLessonModal(false);
          
          // console.log('✅ Leçon créée avec succès:', response.data);
          // console.log('⏱️ Nouvelle durée totale:', formatDuration(newTotalDuration));
        }
      }
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde de la leçon:', error);
      setError(error.response?.data?.message || 'Erreur lors de la sauvegarde de la leçon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedLesson) {
      try {
        // Supprimer la leçon via l'API
        const response = await formationContentApi.deleteLesson(selectedLesson.id);
        
        if (response.success) {
          // Supprimer la leçon de la liste locale
          const updatedLessons = lessons.filter(lesson => lesson.id !== selectedLesson.id);
          setLessons(updatedLessons);
          
          // Recalculer la durée totale
          const newTotalDuration = updatedLessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
          syncLocalFormation({
            ...localFormation,
            totalDuration: newTotalDuration
          });
          
          setShowConfirmModal(false);
          
          // console.log('🗑️ Leçon supprimée avec succès:', selectedLesson.title);
          // console.log('⏱️ Nouvelle durée totale:', formatDuration(newTotalDuration));
        }
        
      } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
      }
    }
  };

  // Nouvelles fonctions pour gérer les actions de formation
  const handleEditFormation = () => {
    setShowEditFormationModal(true);
  };

  const handleDeleteFormation = () => {
    setShowDeleteFormationModal(true);
  };

  // Fonction pour gérer le clic sur le bouton banque
  const handleBanksClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanksList(true);
  };

  const handleEditFormationConfirm = async (updatedFormation: Formation) => {
    try {
      // Mettre à jour l'état local immédiatement
      syncLocalFormation(updatedFormation);
      setShowEditFormationModal(false);
      
      // Appeler la fonction parent pour la persistance
      await onEdit(updatedFormation);
      
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    }
  };

  const handleDeleteFormationConfirm = async () => {
    try {
      setShowDeleteFormationModal(false);
      // Appeler la fonction parent pour la suppression
      onDelete(localFormation);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // Fonction pour lancer la formation (affiche les leçons)
  const handleLaunchFormation = () => {
    // console.log('🚀 FormationDetailView - handleLaunchFormation appelé');
    // console.log('🚀 FormationDetailView - Formation:', localFormation.title);
    
    // Afficher les leçons de la formation
    setShowLessons(true);
    
    // console.log('🚀 FormationDetailView - Leçons vont s\'afficher');
  };

  // Fonction pour lancer une leçon (affiche l'interface de la leçon)
  const handleLaunchLesson = (lesson: FormationContent) => {
    // console.log('🚀 FormationDetailView - handleLaunchLesson appelé');
    // console.log('🚀 FormationDetailView - Leçon sélectionnée:', lesson.title);
    // console.log('🚀 FormationDetailView - Formation:', localFormation.title);
    
    // Afficher le lecteur de leçon avec la leçon sélectionnée
    setSelectedLesson(lesson);
    setShowLessonPlayer(true);
    
    // console.log('🚀 FormationDetailView - LessonPlayer va s\'afficher avec la leçon:', lesson.title);
  };

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

  // Calculer la durée totale des leçons
  const calculateTotalDuration = () => {
    return lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  };

  // Obtenir la durée totale (leçons + formation existante)
  const getTotalDuration = () => {
    const lessonsDuration = calculateTotalDuration();
    const formationDuration = localFormation.totalDuration || localFormation.duration || 0;
    
    // Si on a des leçons, prioriser leur durée totale
    if (lessons.length > 0) {
      return lessonsDuration;
    }
    
    // Sinon utiliser la durée de la formation
    return formationDuration;
  };

  // Vérifier si une leçon est accessible (logique séquentielle stricte)
  const isLessonAccessible = (lesson: FormationContent, index: number) => {
    // La première leçon est toujours accessible
    if (index === 0) return true;
    
    // Pour les autres leçons, vérifier que TOUTES les leçons précédentes sont terminées
    for (let i = 0; i < index; i++) {
      const previousLesson = lessons[i];
      if (!previousLesson) continue;
      
      const previousProgress = lessonProgress[previousLesson.id];
      if (!previousProgress?.completed) {
        return false; // Une leçon précédente n'est pas terminée
      }
    }
    
    return true; // Toutes les leçons précédentes sont terminées
  };

  // Obtenir le statut de déverrouillage d'une leçon
  const getLessonUnlockStatus = (lesson: FormationContent, index: number) => {
    if (index === 0) {
      return { isAccessible: true, reason: 'Première leçon' };
    }
    
    // Vérifier les leçons précédentes
    const incompleteLessons = [];
    for (let i = 0; i < index; i++) {
      const previousLesson = lessons[i];
      if (!previousLesson) continue;
      
      const previousProgress = lessonProgress[previousLesson.id];
      if (!previousProgress?.completed) {
        incompleteLessons.push(previousLesson.title);
      }
    }
    
    if (incompleteLessons.length === 0) {
      return { isAccessible: true, reason: 'Toutes les leçons précédentes sont terminées' };
    } else {
      return { 
        isAccessible: false, 
        reason: `Terminez d'abord: ${incompleteLessons.join(', ')}` 
      };
    }
  };

  // Obtenir le texte du bouton selon la progression
  const getButtonText = (lesson: FormationContent) => {
    const progress = lessonProgress[lesson.id];
    if (!progress || progress.progress === 0) return 'Commencer';
    if (progress.completed) return 'Terminée';
    return 'Continuer';
  };

  // Obtenir l'icône du bouton selon la progression
  const getButtonIcon = (lesson: FormationContent) => {
    const progressData = lessonProgress[lesson.id];
    const progress = progressData?.progress || 0;
    return progress === 0 ? <Play className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />;
  };

  // Fonctions de drag & drop
  const handleDragStart = (e: React.DragEvent, lesson: FormationContent) => {
    setDraggedLesson(lesson);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetLesson: FormationContent) => {
    e.preventDefault();
    
    if (!draggedLesson || draggedLesson.id === targetLesson.id) {
      setIsDragging(false);
      setDraggedLesson(null);
      return;
    }

    try {
      // Réorganiser les leçons localement
      const newLessons = [...lessons];
      const draggedIndex = newLessons.findIndex(l => l.id === draggedLesson.id);
      const targetIndex = newLessons.findIndex(l => l.id === targetLesson.id);
      
      // Déplacer l'élément
      const [removed] = newLessons.splice(draggedIndex, 1);
      newLessons.splice(targetIndex, 0, removed);
      
      // Mettre à jour les ordres
      const updatedLessons = newLessons.map((lesson, index) => ({
        ...lesson,
        order: index + 1
      }));
      
      setLessons(updatedLessons);
      
      // Sauvegarder l'ordre en base
      const lessonOrders = updatedLessons.map(lesson => ({
        id: lesson.id,
        order: lesson.order
      }));
      
      await formationContentApi.reorderLessons(formation.id, lessonOrders);
      
      // console.log('✅ Ordre des leçons mis à jour');
      
    } catch (error) {
      console.error('❌ Erreur lors de la réorganisation:', error);
      // Recharger les leçons en cas d'erreur
      loadLessons();
    } finally {
      setIsDragging(false);
      setDraggedLesson(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Si on affiche la liste des banques */}
      {showBanksList ? (
        <BanksListView 
          formation={localFormation}
          onBack={() => setShowBanksList(false)}
        />
      ) : showLessons ? (
        <>
          {/* En-tête avec bouton retour */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowLessons(false)}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour aux détails
            </button>
            
            {isAdmin && (
              <div className="flex space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditFormation();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFormation();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </button>
              </div>
            )}
          </div>

          {/* Section des leçons */}
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
            {/* En-tête de la section leçons */}
            <div className="bg-slate-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-4">
                    <BookOpen className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-normal text-slate-900">Leçons de la formation</h2>
                    <p className="text-slate-600 mt-1 text-sm">
                      {isAdmin ? 'Gérez le contenu pédagogique de votre formation' : 'Consultez le contenu pédagogique de la formation'}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateLesson();
                      }}
                      disabled={isLoading}
                      className="bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-md font-normal transition-colors duration-200 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isLoading ? 'Chargement...' : 'Ajouter une leçon'}
                    </button>
                    <button
                      onClick={loadLessons}
                      disabled={isLoading}
                      className="border border-gray-300 hover:border-gray-400 text-slate-700 hover:text-slate-900 hover:bg-white px-5 py-2.5 rounded-md font-normal transition-colors duration-200 flex items-center"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Rafraîchir
                    </button>

                    {/* <button
                      onClick={handleOpenReorderModal}
                      disabled={isLoading || lessons.length === 0}
                      className="border border-purple-300 hover:border-purple-400 text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-5 py-2.5 rounded-md font-normal transition-colors duration-200 flex items-center"
                    >
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Réorganiser
                    </button> */}
                  </div>
                )}
              </div>
            </div>

            {/* Contenu des leçons */}
            <div className="p-8">

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Chargement des leçons...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                <p className="text-lg">{error}</p>
                <p className="text-gray-400">Veuillez réessayer plus tard.</p>
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune leçon pour le moment</p>
                <p className="text-gray-400">Commencez par ajouter votre première leçon</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {lessons.map((lesson, index) => {
                  const progressData = lessonProgress[lesson.id];
                  const progress = progressData?.progress || 0;
                  const isAccessible = isLessonAccessible(lesson, index);
                  const isStarted = progress > 0;
                  const unlockStatus = getLessonUnlockStatus(lesson, index);
                  
                  console.log(`📊 Leçon ${lesson.title} (ID: ${lesson.id}):`, {
                    progressData,
                    progress,
                    isAccessible,
                    isStarted,
                    unlockStatus,
                    lessonProgressMap: lessonProgress
                  });
                  
                  return (
                    <div 
                      key={lesson.id} 
                      className={`group relative bg-white rounded-lg border transition-all duration-200 ${
                        !isStarted 
                          ? 'border-gray-200 bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isDragging && isAdmin ? 'cursor-move' : ''}`}
                      draggable={isAdmin}
                      onDragStart={isAdmin ? (e) => handleDragStart(e, lesson) : undefined}
                      onDragOver={isAdmin ? handleDragOver : undefined}
                      onDrop={isAdmin ? (e) => handleDrop(e, lesson) : undefined}
                    >
                      {/* Header avec drag handle et ordre */}
                      <div className="absolute top-3 left-3 z-10">
                        <div className="flex items-center space-x-2">
                          {isAdmin && (
                            <div className="bg-white rounded-md p-1 shadow-sm border border-gray-200">
                              <GripVertical className="h-3 w-3 text-gray-400 cursor-move" />
                            </div>
                          )}
                          <span className="bg-slate-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
                            #{lesson.order || index + 1}
                          </span>
                        </div>
                      </div>

                      {/* Actions en haut à droite - uniquement pour les admins */}
                      {isAdmin && (
                        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex space-x-1 bg-white rounded-md p-1 shadow-sm border border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLesson(lesson);
                              }}
                              className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors"
                              title="Modifier la leçon"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLesson(lesson);
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Supprimer la leçon"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Image de couverture */}
                      <div className="relative h-32 overflow-hidden rounded-t-lg">
                        {lesson.coverImage ? (
                          <div className="relative h-full">
                            <img 
                              src={getLessonImageUrl(lesson.coverImage)} 
                              alt={`Couverture de ${lesson.title}`}
                              className={`w-full h-full object-cover ${
                                !isAccessible ? 'filter grayscale opacity-50' : ''
                              }`}
                            />
                            
                            {/* Overlay de verrouillage */}
                            {!isAccessible && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="text-center text-white">
                                  <Lock className="h-6 w-6 mx-auto mb-1" />
                                  <p className="text-xs font-medium">Verrouillée</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`h-full flex items-center justify-center ${
                            !isAccessible 
                              ? 'bg-gray-200' 
                              : 'bg-slate-100'
                          }`}>
                            <div className="text-center">
                              {!isAccessible ? (
                                <div className="text-gray-500">
                                  <Lock className="h-8 w-8 mx-auto mb-1" />
                                  <div className="text-xs font-medium">Verrouillée</div>
                                </div>
                              ) : (
                                <div className="text-slate-600">
                                  <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center mx-auto mb-1">
                                    {getContentIcon(lesson.type)}
                                  </div>
                                  <div className="text-xs font-medium">Leçon {lesson.order || index + 1}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Contenu de la carte */}
                      <div className="p-4">
                        <h3 className={`text-sm font-normal line-clamp-2 mb-2 ${
                          !isStarted ? 'text-gray-500' : 'text-slate-900'
                        }`}>
                          {lesson.title}
                        </h3>
                        
                        {lesson.description && (
                          <p className={`text-xs mb-3 line-clamp-2 ${
                            !isStarted ? 'text-gray-400' : 'text-slate-600'
                          }`}>
                            {lesson.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center text-xs text-slate-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatDuration(lesson.duration || 0)}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-md font-normal text-xs ${
                            !isStarted 
                              ? 'bg-gray-200 text-gray-600' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {getContentTypeLabel(lesson.type)}
                          </span>
                        </div>
                        
                        {/* Barre de progression */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                            <span>Progression</span>
                            <span className="font-normal">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                progress === 0 ? 'bg-gray-400' : 'bg-slate-600'
                              }`} 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Bouton de lancement */}
                        <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAccessible) {
                              handleLaunchLesson(lesson);
                            }
                          }}
                          disabled={!isAccessible}
                          className={`w-full py-2 px-3 text-xs font-normal rounded-md transition-colors duration-200 flex items-center justify-center ${
                            !isAccessible
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : progress === 0
                              ? 'bg-slate-900 hover:bg-slate-800 text-white'
                              : 'bg-slate-600 hover:bg-slate-700 text-white'
                          }`}
                            title={!isAccessible ? unlockStatus.reason : undefined}
                        >
                          {!isAccessible ? (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Verrouillée
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              {getButtonText(lesson)}
                            </>
                          )}
                        </button>
                          
                          {/* Info-bulle pour les leçons verrouillées */}
                          {!isAccessible && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              <div className="text-center">
                                <div className="font-medium mb-1">Leçon verrouillée</div>
                                <div className="text-gray-300">{unlockStatus.reason}</div>
                              </div>
                              {/* Flèche vers le bas */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="min-h-screen bg-[#fafafa] dark:bg-dark-bg-primary">
           
            <main className="max-w-7xl mx-auto px-12 py-12">
              {/* Navigation retour */}
              <nav className="mb-12">
                <button
                  onClick={onBack}
                  className="inline-flex items-center text-sm font-medium text-[#64748b] dark:text-gray-400 hover:text-[#1e3a8a] dark:hover:text-blue-400 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                  Retour aux formations
                </button>
              </nav>

              {/* Header Formation */}
              <header className="text-center space-y-8 mb-16">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                      localFormation.isActive 
                        ? 'bg-blue-50 text-[#1e3a8a] dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800' 
                        : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-100 dark:border-gray-700'
                    }`}>
                      {localFormation.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-900 dark:text-gray-100 tracking-tight leading-snug max-w-4xl mx-auto">
                    {localFormation.title}
                  </h1>
                  <p className="text-[#64748b] dark:text-gray-400 text-base font-light max-w-3xl mx-auto">
                    {localFormation.description || "Une approche moderne pour développer vos compétences professionnelles."}
                  </p>
                </div>
                
                <div className="relative group">
                  {localFormation.coverImage ? (
                    <div className="aspect-[21/9] rounded-3xl overflow-hidden bg-[#002b45] relative">
                      <img 
                        alt="Course Cover" 
                        className="w-full h-full object-cover opacity-60 blur-sm scale-105" 
                        src={getFormationCoverImageUrl(localFormation.coverImage)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                          <Play className="text-white w-8 h-8" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[21/9] rounded-3xl overflow-hidden bg-gradient-to-br from-[#C7B299] to-[#8B7355] relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                          <Play className="text-white w-8 h-8" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={handleLaunchFormation}
                      className="bg-[#1e3a8a] dark:bg-blue-600 text-white px-10 py-4 rounded-full text-sm font-semibold tracking-wide hover:shadow-xl hover:shadow-blue-900/10 dark:hover:shadow-blue-900/20 transition-all transform hover:-translate-y-0.5"
                    >
                      LANCER LA FORMATION
                    </button>
                  </div>
                </div>
              </header>

              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-slate-100 dark:border-gray-700 max-w-5xl mx-auto">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400 dark:text-gray-500" />
                  <div>
                    <p className="text-[10px] text-[#64748b] dark:text-gray-400 uppercase tracking-wider font-medium">Durée</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDuration(getTotalDuration())}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-slate-400 dark:text-gray-500" />
                  <div>
                    <p className="text-[10px] text-[#64748b] dark:text-gray-400 uppercase tracking-wider font-medium">Contenu</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {lessons.length} leçons
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-slate-400 dark:text-gray-500" />
                  <div>
                    <p className="text-[10px] text-[#64748b] dark:text-gray-400 uppercase tracking-wider font-medium">Public</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {getFormationTargetAudience(localFormation).length > 0 
                        ? getFormationTargetAudience(localFormation)[0] || 'Tout niveau'
                        : 'Tout niveau'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-slate-400 dark:text-gray-500" />
                  <div>
                    <p className="text-[10px] text-[#64748b] dark:text-gray-400 uppercase tracking-wider font-medium">Langue</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Français</p>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="space-y-16 mt-16">
                {/* Objectifs Pédagogiques */}
                {getFormationObjectives(localFormation).length > 0 && (
                  <section className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                      <Target className="w-5 h-5 text-[#1e3a8a] dark:text-blue-400 opacity-50" />
                      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Objectifs Pédagogiques</h2>
                    </div>
                    <div className="space-y-4 text-slate-600 dark:text-gray-300 font-light leading-relaxed pl-10 border-l border-slate-100 dark:border-gray-700">
                      {getFormationObjectives(localFormation).map((objective, index) => (
                        <p key={index}>{objective}</p>
                      ))}
                    </div>
                  </section>
                )}

                {/* Prérequis */}
                <section className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <CheckCircle className="w-5 h-5 text-[#1e3a8a] dark:text-blue-400 opacity-50" />
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Prérequis</h2>
                  </div>
                  <div className="pl-10">
                    <p className="text-slate-500 dark:text-gray-400 font-light italic">{getFormationPrerequisites(localFormation)}</p>
                  </div>
                </section>

                {/* Programme de la formation */}
                {getFormationDetailedProgram(localFormation).length > 0 && (
                  <section className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                      <List className="w-5 h-5 text-[#1e3a8a] dark:text-blue-400 opacity-50" />
                      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Programme de la formation</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-gray-700 pl-10">
                      {getFormationDetailedProgram(localFormation).map((module, idx) => (
                        <div 
                          key={idx} 
                          className="py-5 flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-6">
                            <span className="text-xs font-medium text-slate-300 dark:text-gray-600 group-hover:text-[#1e3a8a] dark:group-hover:text-blue-400 transition-colors">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-sm text-slate-700 dark:text-gray-300 font-light">
                              {module}
                            </span>
                          </div>
                          <Play className="w-5 h-5 text-slate-300 dark:text-gray-600 group-hover:text-[#1e3a8a] dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Footer */}
              <footer className="mt-32 pt-12 border-t border-slate-100 dark:border-gray-700 text-center">
                <p className="text-[11px] text-slate-400 dark:text-gray-500 uppercase tracking-widest font-medium">
                  © 2024 BAI Formation • L'excellence par le savoir
                </p>
              </footer>
            </main>
          </div>
        </>
      )}

      {/* Modales */}
      {showLessonModal && (
        <LessonModal
          isOpen={showLessonModal}
          onClose={() => setShowLessonModal(false)}
          onSave={handleSaveLesson}
          formationId={localFormation.id}
          formationTitle={localFormation.title}
          sectionId={null}
          existingLesson={selectedLesson}
        />
      )}

      {showConfirmModal && (
        <ConfirmModal
          title="Supprimer la leçon"
          message={`Êtes-vous sûr de vouloir supprimer la leçon "${selectedLesson?.title}" ?`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowConfirmModal(false)}
          confirmText="Supprimer"
          variant="danger"
        />
      )}

      {/* Modales de formation */}
      {showEditFormationModal && (
        <FormationModal
          formation={localFormation}
          onClose={() => setShowEditFormationModal(false)}
          onSave={() => handleEditFormationConfirm(localFormation)}
        />
      )}

      {showDeleteFormationModal && (
        <ConfirmModal
          title="Supprimer la formation"
          message={`Êtes-vous sûr de vouloir supprimer la formation "${localFormation?.title}" ?`}
          onConfirm={handleDeleteFormationConfirm}
          onCancel={() => setShowDeleteFormationModal(false)}
          confirmText="Supprimer"
          variant="danger"
        />
      )}
      
      {/* Lecteur de leçons */}
      {showLessonPlayer && (
        <LessonPlayer
          formation={{
            id: localFormation.id,
            title: localFormation.title,
            description: localFormation.description,
            duration: localFormation.duration // Ajouter la durée de la formation
          }}
          lessons={lessons}
          initialSelectedLesson={selectedLesson}
          onClose={() => setShowLessonPlayer(false)}
          onProgressUpdate={updateLessonProgressWithValidation}
          onLessonUpdate={(updatedLesson) => {
            // Mettre à jour la leçon dans la liste locale
            setLessons(prevLessons => 
              prevLessons.map(lesson => 
                lesson.id === updatedLesson.id ? updatedLesson : lesson
              )
            );
            // console.log('✅ Leçon mise à jour dans FormationDetailView:', updatedLesson);
          }}
        />
      )}

      {/* Modale de réorganisation des leçons */}
      {showReorderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-normal text-gray-900">Réorganiser les leçons</h2>
                  <p className="text-gray-600 mt-1">Glissez-déposez pour modifier l'ordre des leçons</p>
                </div>
                <button
                  onClick={handleCloseReorderModal}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Liste des leçons */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="space-y-3">
                {reorderLessons.map((lesson, index) => {
                  // Afficher une ligne d'insertion avant l'élément si c'est la cible du drop
                  const showInsertionLine = dragOverIndex === index && draggedReorderIndex !== null && draggedReorderIndex !== index;
                  const progressData = lessonProgress[lesson.id];
                  const progress = progressData?.progress || 0;
                  const isCompleted = progressData?.completed || false;
                  
                  return (
                    <React.Fragment key={lesson.id}>
                      {/* Ligne d'insertion */}
                      {showInsertionLine && (
                        <div className="h-1 bg-blue-500 rounded-full mx-4 mb-3"></div>
                      )}
                      
                      <div
                        draggable
                        onDragStart={(e) => handleReorderDragStart(e, index)}
                        onDragOver={(e) => handleReorderDragOver(e, index)}
                        onDragLeave={handleReorderDragLeave}
                        onDrop={(e) => handleReorderDrop(e, index)}
                        onDragEnd={handleReorderDragEnd}
                        className={`flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-move ${
                          draggedReorderIndex === index 
                            ? 'opacity-50 bg-gray-50' 
                            : dragOverIndex === index 
                              ? 'border-blue-400 bg-blue-50' 
                              : ''
                        }`}
                      >
                      {/* Drag handle */}
                      <div className="mr-4 cursor-move">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                      </div>

                      {/* Numéro d'ordre */}
                      <div className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-normal mr-4">
                        {index + 1}
                      </div>

                      {/* Image de couverture */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-4">
                        {lesson.coverImage ? (
                          <img
                            src={getLessonImageUrl(lesson.coverImage)}
                            alt={`Couverture de ${lesson.title}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        )}
                      </div>

                      {/* Informations de la leçon */}
                      <div className="flex-1">
                        <h3 className="font-normal text-gray-900 mb-1">{lesson.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{getContentTypeLabel(lesson.type)}</span>
                          <span>{formatDuration(lesson.duration || 0)}</span>
                          {isCompleted && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span>Terminée</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div className="w-24 ml-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              progress === 0 ? 'bg-gray-400' : 'bg-slate-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Footer avec boutons */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={handleCloseReorderModal}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveReorder}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors font-normal"
              >
                Sauvegarder l'ordre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormationDetailView;
