import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, Database, Plus, Edit, Trash2, X, RefreshCw, Users, Play } from 'lucide-react';
import { Formation, FormationContent } from '../types';
import { getFormationCoverImageUrl, getLessonImageUrl } from '../../../utils/imageUtils';
import { formationContentApi } from '../../../api/adminApi';
import ConfirmModal from './ConfirmModal';
import { FormationModal } from './FormationModal';
import BanksListView from './BanksListView';
import LessonModal from './LessonModal';
import LessonPlayer from './LessonPlayer';


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
      
      // Debug: vérifier l'état de l'authentification
      const token = localStorage.getItem('bai_auth_token') || localStorage.getItem('accessToken');
      console.log('🔍 État de l\'authentification:');
      console.log('  - Token disponible:', !!token);
      console.log('  - Token (bai_auth_token):', localStorage.getItem('bai_auth_token'));
      console.log('  - Token (accessToken):', localStorage.getItem('accessToken'));
      console.log('  - Formation ID:', formation.id);
      
      const response = await formationContentApi.getByFormation(formation.id);
      // Filtrer seulement les leçons (pas les sections)
      const lessonsOnly = response.data.filter((content: FormationContent) => content.contentType === 'LESSON');
      setLessons(lessonsOnly);
      
      console.log('📚 Leçons chargées:', lessonsOnly.length);
      
    } catch (error) {
      console.error('Erreur lors du chargement des leçons:', error);
      setError('Erreur lors du chargement des leçons');
      setLessons([]); // En cas d'erreur, tableau vide
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Si on affiche la liste des banques */}
      {showBanksList ? (
        <BanksListView 
          formation={localFormation}
          onBack={() => setShowBanksList(false)}
        />
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

          {/* Informations de la formation */}
          <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md overflow-hidden">
            <div className="relative h-64 bg-gray-200">
              {localFormation.coverImage ? (
                <img
                  src={getFormationCoverImageUrl(localFormation.coverImage)}
                  alt={`Couverture de ${localFormation.title}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('❌ Erreur de chargement de l\'image de couverture:', localFormation.coverImage);
                    // Cacher l'image et afficher le fallback
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              
              {/* Fallback si pas d'image ou si l'image ne charge pas */}
              <div className={`w-full h-full flex items-center justify-center ${localFormation.coverImage ? 'hidden' : ''}`}>
                <BookOpen className="h-24 w-24 text-gray-400" />
              </div>
              
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  localFormation.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {localFormation.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{localFormation.title}</h1>
              <p className="text-lg text-gray-600 mb-6">{localFormation.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="flex items-center text-gray-700">
                  <Clock className="h-6 w-6 mr-3 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Durée totale</p>
                    <p className="font-semibold">{formatDuration(getTotalDuration())}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <BookOpen className="h-6 w-6 mr-3 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Leçons</p>
                    <p className="font-semibold">{lessons.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <Users className="h-6 w-6 mr-3 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-500">Utilisateurs</p>
                    <p className="font-semibold">{formationStats?.userCount || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <Database className="h-6 w-6 mr-3 text-purple-600" />
                  <div 
                    className="cursor-pointer hover:text-purple-800 transition-colors"
                    onClick={handleBanksClick}
                  >
                    <p className="text-sm text-gray-500">Banques</p>
                    <p className="font-semibold">{formationStats?.bankCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section des leçons */}
          <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Leçons de la formation</h2>
              <div className="flex space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateLesson();
                  }}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isLoading ? 'Chargement...' : 'Ajouter une leçon'}
                </button>
                <button
                  onClick={loadLessons}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rafraîchir
                </button>
              </div>
            </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="bg-gradient-to-b from-white to-blue-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {/* Image de couverture */}
                    {lesson.coverImage ? (
                      <div className="mb-4 relative overflow-hidden rounded-lg border-2 border-gray-200">
                        <img 
                          src={getLessonImageUrl(lesson.coverImage)} 
                          alt={`Couverture de ${lesson.title}`}
                          className="w-full h-32 object-cover hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            // Fallback si l'image ne charge pas
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                          style={{ minHeight: '128px' }}
                        />
                        {/* Fallback si pas d'image */}
                        <div className="hidden w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          {getContentIcon(lesson.type)}
                        </div>
                      </div>
                    ) : (
                      // Placeholder si pas d'image de couverture
                      <div className="mb-4 w-full h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-300">
                        <div className="text-center">
                          <div className="text-blue-600 mb-2 text-sm">Pas d'image de couverture</div>
                          {getContentIcon(lesson.type)}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{lesson.title}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLesson(lesson);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLesson(lesson);
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {lesson.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{lesson.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{formatDuration(lesson.duration || 0)}</span>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium text-xs">
                        {getContentTypeLabel(lesson.type)}
                      </span>
                    </div>
                    
                    {/* Bouton de lancement et barre de progression */}
                    <div className="mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchLesson(lesson);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Lancer la leçon
                      </button>
                      
                      {/* Barre de progression */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progression</span>
                          <span>0%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
        </>
      )}
    </div>
  );
};

export default FormationDetailView;
