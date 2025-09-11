import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, Database, Plus, Edit, Trash2, X, RefreshCw, Users, Play, Lock, GripVertical } from 'lucide-react';
import { Formation, FormationContent } from '../types';
import { getFormationCoverImageUrl, getLessonImageUrl } from '../../../utils/imageUtils';
import { formationContentApi, progressApi } from '../../../api/adminApi';
import { authService } from '../../../services/authService';
import ConfirmModal from './ConfirmModal';
import { FormationModal } from './FormationModal';
import BanksListView from './BanksListView';
import LessonModal from './LessonModal';
import LessonPlayer from './LessonPlayer';
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
  const [lessons, setLessons] = useState<FormationContent[]>([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<FormationContent | null>(null);
  const [action, setAction] = useState<'create' | 'edit'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  // États pour les progressions et drag & drop
  const [lessonProgress, setLessonProgress] = useState<{[key: string]: number}>({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLesson, setDraggedLesson] = useState<FormationContent | null>(null);

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
    loadLessons();
    loadLessonProgress();
  }, [formation.id]);

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
      
      const response = await formationContentApi.getByFormation(formation.id);
      // Filtrer seulement les leçons (pas les sections) et trier par ordre
      const lessonsOnly = response.data
        .filter((content: FormationContent) => content.contentType === 'LESSON')
        .sort((a: FormationContent, b: FormationContent) => (a.order || 0) - (b.order || 0));
      setLessons(lessonsOnly);
      
      console.log('📚 Leçons chargées:', lessonsOnly.length);
      
    } catch (error) {
      console.error('Erreur lors du chargement des leçons:', error);
      setError('Erreur lors du chargement des leçons');
      setLessons([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les progressions des leçons pour l'utilisateur connecté
  const loadLessonProgress = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return;

      const response = await formationContentApi.getLessonProgress(formation.id, currentUser.id);
      if (response.success) {
        // Convertir en objet {lessonId: progressPercent}
        const progressMap: {[key: string]: number} = {};
        response.data.forEach((progress: any) => {
          progressMap[progress.lessonId] = progress.progressPercent || 0;
        });
        setLessonProgress(progressMap);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des progressions:', error);
      // En cas d'erreur, toutes les progressions à 0%
      setLessonProgress({});
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
      console.log('💾 Sauvegarde de la leçon:', lessonData);
      
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
          coverImage: lessonData.coverImage
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
          
          console.log('✏️ Leçon modifiée avec succès:', response.data);
          console.log('⏱️ Nouvelle durée totale:', formatDuration(newTotalDuration));
        }
        
      } else {
        // Mode création : ajouter une nouvelle leçon via l'API
        const response = await formationContentApi.addLesson(localFormation.id, {
          title: lessonData.title,
          description: lessonData.description,
          type: lessonData.type,
          duration: lessonData.duration || 30,
          order: lessons.length + 1,
          coverImage: lessonData.coverImage
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
          
          console.log('✅ Leçon créée avec succès:', response.data);
          console.log('⏱️ Nouvelle durée totale:', formatDuration(newTotalDuration));
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
          
          console.log('🗑️ Leçon supprimée avec succès:', selectedLesson.title);
          console.log('⏱️ Nouvelle durée totale:', formatDuration(newTotalDuration));
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
    console.log('🚀 FormationDetailView - handleLaunchFormation appelé');
    console.log('🚀 FormationDetailView - Formation:', localFormation.title);
    
    // Afficher les leçons de la formation
    setShowLessons(true);
    
    console.log('🚀 FormationDetailView - Leçons vont s\'afficher');
  };

  // Fonction pour lancer une leçon (affiche l'interface de la leçon)
  const handleLaunchLesson = (lesson: FormationContent) => {
    console.log('🚀 FormationDetailView - handleLaunchLesson appelé');
    console.log('🚀 FormationDetailView - Leçon sélectionnée:', lesson.title);
    console.log('🚀 FormationDetailView - Formation:', localFormation.title);
    
    // Afficher le lecteur de leçon avec la leçon sélectionnée
    setSelectedLesson(lesson);
    setShowLessonPlayer(true);
    
    console.log('🚀 FormationDetailView - LessonPlayer va s\'afficher');
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

  // Vérifier si une leçon est accessible (logique séquentielle)
  const isLessonAccessible = (lesson: FormationContent, index: number) => {
    // La première leçon est toujours accessible
    if (index === 0) return true;
    
    // Pour les autres leçons, vérifier que la précédente est terminée
    const previousLesson = lessons[index - 1];
    if (!previousLesson) return true;
    
    const previousProgress = lessonProgress[previousLesson.id] || 0;
    return previousProgress >= 100; // Leçon précédente terminée
  };

  // Obtenir le texte du bouton selon la progression
  const getButtonText = (lesson: FormationContent) => {
    const progress = lessonProgress[lesson.id] || 0;
    return progress === 0 ? 'Commencer' : 'Continuer';
  };

  // Obtenir l'icône du bouton selon la progression
  const getButtonIcon = (lesson: FormationContent) => {
    const progress = lessonProgress[lesson.id] || 0;
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
      
      console.log('✅ Ordre des leçons mis à jour');
      
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
                    <h2 className="text-xl font-semibold text-slate-900">Leçons de la formation</h2>
                    <p className="text-slate-600 mt-1 text-sm">Gérez le contenu pédagogique de votre formation</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateLesson();
                    }}
                    disabled={isLoading}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-md font-semibold transition-colors duration-200 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isLoading ? 'Chargement...' : 'Ajouter une leçon'}
                  </button>
                  <button
                    onClick={loadLessons}
                    disabled={isLoading}
                    className="border border-gray-300 hover:border-gray-400 text-slate-700 hover:text-slate-900 hover:bg-white px-5 py-2.5 rounded-md font-semibold transition-colors duration-200 flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rafraîchir
                  </button>
                </div>
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
                  const progress = lessonProgress[lesson.id] || 0;
                  const isAccessible = isLessonAccessible(lesson, index);
                  const isStarted = progress > 0;
                  
                  return (
                    <div 
                      key={lesson.id} 
                      className={`group relative bg-white rounded-lg border transition-all duration-200 ${
                        !isStarted 
                          ? 'border-gray-200 bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isDragging ? 'cursor-move' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lesson)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, lesson)}
                    >
                      {/* Header avec drag handle et ordre */}
                      <div className="absolute top-3 left-3 z-10">
                        <div className="flex items-center space-x-2">
                          <div className="bg-white rounded-md p-1 shadow-sm border border-gray-200">
                            <GripVertical className="h-3 w-3 text-gray-400 cursor-move" />
                          </div>
                          <span className="bg-slate-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
                            #{lesson.order || index + 1}
                          </span>
                        </div>
                      </div>

                      {/* Actions en haut à droite */}
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
                        <h3 className={`text-sm font-semibold line-clamp-2 mb-2 ${
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
                          <span className={`px-2 py-1 rounded-md font-medium text-xs ${
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
                            <span className="font-semibold">{Math.round(progress)}%</span>
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAccessible) {
                              handleLaunchLesson(lesson);
                            }
                          }}
                          disabled={!isAccessible}
                          className={`w-full py-2 px-3 text-xs font-semibold rounded-md transition-colors duration-200 flex items-center justify-center ${
                            !isAccessible
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : progress === 0
                              ? 'bg-slate-900 hover:bg-slate-800 text-white'
                              : 'bg-slate-600 hover:bg-slate-700 text-white'
                          }`}
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
          {/* En-tête avec bouton retour */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour aux formations
            </button>
            
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
          </div>

          {/* Interface principale avec charte graphique du site */}
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
            <div className="flex min-h-[700px]">
              {/* Sidebar gauche - Informations de la formation */}
              <div className="w-80 bg-gradient-to-b from-stone-50 to-stone-100 p-8 border-r border-stone-200">
                <div className="space-y-6">
                  {/* Code formation */}
                  <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center mb-4">
                      <div className="w-2.5 h-2.5 bg-blue-900 rounded-full mr-3 shadow-sm"></div>
                      <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Code Formation</h3>
                    </div>
                    <p className="text-xl font-mono font-semibold text-gray-900 tracking-wide">{getFormationCode(localFormation)}</p>
                  </div>

                  {/* Public concerné */}
                  <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center mb-4">
                      <div className="w-2.5 h-2.5 bg-blue-900 rounded-full mr-3 shadow-sm"></div>
                      <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Public Concerné</h3>
                    </div>
                    <div className="space-y-3">
                      {getFormationTargetAudience(localFormation).length > 0 ? (
                        getFormationTargetAudience(localFormation).map((item, index) => (
                          <div key={index} className="flex items-center group">
                            <div className="w-1.5 h-1.5 bg-blue-900 rounded-full mr-3 group-hover:bg-blue-700 transition-colors duration-200"></div>
                            <p className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors duration-200">{item}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-stone-400 rounded-full mr-3"></div>
                          <p className="text-sm text-stone-500 italic">Non spécifié</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modalité pédagogique */}
                  <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center mb-4">
                      <div className="w-2.5 h-2.5 bg-blue-900 rounded-full mr-3 shadow-sm"></div>
                      <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Modalité</h3>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-4 shadow-sm">
                        <BookOpen className="h-4 w-4 text-blue-900" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{getFormationPedagogicalModality(localFormation)}</p>
                    </div>
                  </div>

                  {/* Durée */}
                  <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center mb-4">
                      <div className="w-2.5 h-2.5 bg-blue-900 rounded-full mr-3 shadow-sm"></div>
                      <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Durée</h3>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-4 shadow-sm">
                        <Clock className="h-4 w-4 text-blue-900" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatDuration(getTotalDuration())}</p>
                    </div>
                  </div>

                  {/* Organisme de formation */}
                  <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center mb-4">
                      <div className="w-2.5 h-2.5 bg-blue-900 rounded-full mr-3 shadow-sm"></div>
                      <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Organisme</h3>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{getFormationOrganization(localFormation)}</p>
                  </div>
                </div>
              </div>

              {/* Contenu principal */}
              <div className="flex-1 p-10">
                <div className="max-w-4xl">
                  {/* En-tête de la formation */}
                  <div className="mb-12">
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex-1">
                        <h1 className="text-3xl font-semibold text-gray-900 mb-4 leading-tight tracking-tight">{localFormation.title}</h1>
                        <p className="text-lg text-gray-600 leading-relaxed font-medium">{localFormation.description}</p>
                      </div>
                      <div className="ml-8">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm ${
                          localFormation.isActive 
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 border border-blue-200' 
                            : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 shadow-sm ${
                            localFormation.isActive ? 'bg-blue-900' : 'bg-red-500'
                          }`}></div>
                          {localFormation.isActive ? 'ACTIF' : 'INACTIF'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sections de contenu */}
                  <div className="space-y-12">
                    {/* Objectifs Pédagogiques */}
                    <div className="group">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-4 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                          <Clock className="h-5 w-5 text-blue-900" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Objectifs Pédagogiques</h2>
                      </div>
                      <div className="bg-gradient-to-br from-stone-50 to-white rounded-lg p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="space-y-3">
                          {getFormationObjectives(localFormation).length > 0 ? (
                            getFormationObjectives(localFormation).map((objective, index) => (
                              <div key={index} className="flex items-start group/item">
                                <div className="w-5 h-5 bg-gradient-to-br from-blue-900 to-blue-800 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 shadow-sm group-hover/item:shadow-md transition-shadow duration-200">
                                  <span className="text-white text-xs font-semibold">{index + 1}</span>
                                </div>
                                <p className="text-gray-700 leading-relaxed font-medium group-hover/item:text-gray-900 transition-colors duration-200">{objective}</p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-stone-500 italic">Aucun objectif pédagogique défini</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Prérequis */}
                    <div className="group">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-4 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                          <BookOpen className="h-5 w-5 text-blue-900" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Prérequis</h2>
                      </div>
                      <div className="bg-gradient-to-br from-stone-50 to-white rounded-lg p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center group/item">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-900 to-blue-800 rounded-full flex items-center justify-center mr-4 shadow-sm group-hover/item:shadow-md transition-shadow duration-200">
                            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-gray-700 font-semibold group-hover/item:text-gray-900 transition-colors duration-200">{getFormationPrerequisites(localFormation)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Programme détaillé */}
                    <div className="group">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-4 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                          <BookOpen className="h-5 w-5 text-blue-900" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Programme Détaillé</h2>
                      </div>
                      <div className="bg-gradient-to-br from-stone-50 to-white rounded-lg p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="space-y-3">
                          {getFormationDetailedProgram(localFormation).length > 0 ? (
                            getFormationDetailedProgram(localFormation).map((module, index) => (
                              <div key={index} className="flex items-center group/item">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 shadow-sm group-hover/item:shadow-md transition-shadow duration-200">
                                  <span className="text-white text-xs font-semibold">{index + 1}</span>
                                </div>
                                <p className="text-gray-700 font-semibold group-hover/item:text-gray-900 transition-colors duration-200">{module}</p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-stone-500 italic">Aucun programme détaillé défini</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar droite - Image et actions */}
              <div className="w-96 bg-gradient-to-b from-stone-50 to-stone-100 p-8 border-l border-stone-200">
                <div className="space-y-8">
                  {/* Image de couverture avec bouton LANCER */}
                  <div className="relative group">
                    <div className="relative overflow-hidden rounded-xl border border-stone-200 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                      {localFormation.coverImage ? (
                        <img
                          src={getFormationCoverImageUrl(localFormation.coverImage)}
                          alt={`Couverture de ${localFormation.title}`}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            console.error('❌ Erreur de chargement de l\'image de couverture:', localFormation.coverImage);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback si pas d'image */}
                      <div className={`w-full h-64 bg-gradient-to-br from-stone-100 to-stone-200 rounded-xl flex items-center justify-center ${localFormation.coverImage ? 'hidden' : ''}`}>
                        <div className="text-center">
                          <BookOpen className="h-16 w-16 text-stone-400 mx-auto mb-3" />
                          <p className="text-sm text-stone-500 font-semibold">Image de couverture</p>
                        </div>
                      </div>
                      
                      {/* Bouton LANCER positionné en bas de l'image */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <button
                          onClick={handleLaunchFormation}
                          className="w-full bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center transform hover:-translate-y-0.5"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          LANCER
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques rapides */}
                  <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-5">Statistiques</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                            <Clock className="h-4 w-4 text-blue-900" />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">Durée totale</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{formatDuration(getTotalDuration())}</span>
                      </div>
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                            <BookOpen className="h-4 w-4 text-blue-900" />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">Leçons</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{lessons.length}</span>
                      </div>
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                            <Users className="h-4 w-4 text-blue-900" />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">Utilisateurs</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{formationStats?.userCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="space-y-4">
                    <button className="w-full border-2 border-stone-300 hover:border-stone-400 text-gray-700 hover:text-gray-900 hover:bg-white py-4 px-6 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md">
                      <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Exporter PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
            description: localFormation.description
          }}
          lessons={lessons}
          onClose={() => setShowLessonPlayer(false)}
        />
      )}
    </div>
  );
};

export default FormationDetailView;
