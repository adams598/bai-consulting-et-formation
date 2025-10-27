// LessonPlayer.tsx
import React, { useState, useEffect, useContext } from 'react';
import { X, Play, FileText, Video, Presentation, Clock, CheckCircle, BookOpen, Lock, Edit, RefreshCw } from 'lucide-react';
import { FormationContent } from '../types';
import { getLessonImageUrl, getImageUrl, getLessonFileUrl } from '../../../utils/imageUtils';
import TestViewer from './TestViewer';
import '../../../components/LessonPlayer.css';
import { useAuth } from '../../../providers/auth-provider';
import progressService from '../../../services/progressService';
import { authService } from '../../../services/authService';

interface LessonPlayerProps {
  formation: {
    id: string;
    title: string;
    description?: string;
    duration?: number; // Ajouter la durée de la formation
  };
  lessons: FormationContent[];
  initialSelectedLesson?: FormationContent | null;
  onClose: () => void;
  onProgressUpdate?: (lessonId: string, progress: {
    timeSpent?: number;
    progress?: number;
    completed?: boolean;
  }) => void;
  onLessonUpdate?: (updatedLesson: FormationContent) => void;
}

interface LessonProgress {
  lessonId: string;
  timeSpent: number; // en secondes
  progress: number; // 0-100
  completed: boolean;
}

export default function LessonPlayer({ formation, lessons: rawLessons, initialSelectedLesson, onClose, onProgressUpdate, onLessonUpdate }: LessonPlayerProps) {
  const { user } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<FormationContent | null>(null);
  const [lessonProgress, setLessonProgress] = useState<{[key: string]: LessonProgress}>({});
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [isCalculatingDuration, setIsCalculatingDuration] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  // Transformer les données des leçons pour s'assurer que toutes les propriétés sont bien définies
  // Principe similaire à la transformation des formations dans LearnerFormationsPage
  const lessons = React.useMemo(() => {
    return rawLessons.map((lesson: any) => ({
      id: lesson.id,
      formationId: lesson.formationId,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      contentType: lesson.contentType,
      sectionId: lesson.sectionId,
      order: lesson.order,
      duration: formation.duration || 0, // Utiliser la durée de la formation pour toutes les leçons
      fileUrl: lesson.fileUrl,
      fileSize: lesson.fileSize,
      coverImage: lesson.coverImage,
      metadata: lesson.metadata,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt
    }));
  }, [rawLessons, formation.duration]);

  // Fonction pour récupérer l'ID utilisateur
  const getCurrentUserId = () => {
    if (user && user.id) {
      return user.id;
    }
    
    // Fallback : essayer de récupérer depuis le localStorage
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const userData = JSON.parse(userInfo);
        return userData.id || 'default-user-id';
      } catch (error) {
        console.error('Erreur parsing userInfo:', error);
      }
    }
    
    // Essayer de récupérer depuis le token JWT
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.userId || payload.sub) {
          return payload.userId || payload.sub;
        }
      } catch (error) {
        console.error('Erreur décodage token JWT:', error);
      }
    }
    
    return 'default-user-id';
  };

  // Fonction pour vérifier si l'utilisateur est admin
  const isAdmin = () => {
    const currentUser = authService.getCurrentUser();
    return currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'BANK_ADMIN');
  };

  // Fonction pour calculer la durée réelle de la vidéo
  const calculateVideoDuration = async (lessonId: string): Promise<number> => {
    console.log('🔄 Calcul de la durée pour la leçon:', lessonId);
    
    // Essayer d'abord l'API (même si elle n'existe pas encore)
    try {
      const response = await fetch(`http://localhost:3000/api/admin/lessons/${lessonId}/duration`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const duration = data.duration || 0;
        console.log('🎥 Durée calculée via l\'API:', duration, 'secondes');
        return duration;
      } else {
        console.log('⚠️ API non disponible (404), passage au fallback...');
      }
    } catch (apiError) {
      console.log('⚠️ Erreur API, passage au fallback:', apiError);
    }
    
    // Fallback: utiliser fetch authentifié pour récupérer la vidéo
    try {
      console.log('🔄 Tentative avec fetch authentifié...');
      
      const videoUrl = buildLessonFileUrl(selectedLesson!);
      console.log('🎥 URL de la vidéo:', videoUrl);
      
      // Essayer de récupérer la vidéo avec authentification
      const videoResponse = await fetch(videoUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!videoResponse.ok) {
        throw new Error(`Erreur fetch vidéo: ${videoResponse.status}`);
      }
      
      // Créer un blob URL temporaire
      const videoBlob = await videoResponse.blob();
      const blobUrl = URL.createObjectURL(videoBlob);
      
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          const duration = Math.round(video.duration);
          console.log('🎥 Durée calculée via blob:', duration, 'secondes');
          URL.revokeObjectURL(blobUrl); // Nettoyer le blob URL
          resolve(duration);
        };
        
        video.onerror = (e) => {
          console.error('❌ Erreur lors du chargement de la vidéo blob:', e);
          URL.revokeObjectURL(blobUrl); // Nettoyer le blob URL
          reject(new Error('Impossible de charger la vidéo blob'));
        };
        
        video.src = blobUrl;
      });
      
    } catch (fallbackError) {
      console.error('❌ Erreur fallback:', fallbackError);
      throw new Error('Impossible de calculer la durée de la vidéo');
    }
  };

  // Fonction pour recalculer la durée de la leçon
  const handleRecalculateDuration = async () => {
    if (!selectedLesson || !selectedLesson.fileUrl) {
      console.log('❌ Aucune leçon sélectionnée ou pas de fichier vidéo');
      return;
    }

    setIsCalculatingDuration(true);
    setSuccessMessage(null);
    
    try {
      console.log('🔄 Calcul de la durée pour la leçon:', selectedLesson.title);
      
      // Calculer la durée via l'API ou fallback
      const realDuration = await calculateVideoDuration(selectedLesson.id);
      
      console.log('✅ Durée réelle calculée:', realDuration, 'secondes');
      console.log('📊 Durée actuelle de la formation:', formation.duration, 'secondes');
      
      // Mettre à jour la formation dans la base de données
      try {
        console.log('💾 Mise à jour de la formation dans la BDD...');
        
        const response = await fetch(`http://localhost:3000/api/admin/formations/${formation.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: formation.title, // Champ obligatoire
            description: formation.description || '',
            duration: realDuration
          })
        });
        
        if (response.ok) {
          console.log('✅ Formation mise à jour dans la BDD avec la durée:', realDuration, 'secondes');
          
          // Mettre à jour la leçon avec la durée réelle
          const updatedLesson = {
            ...selectedLesson,
            duration: realDuration
          };
          
          setSelectedLesson(updatedLesson);
          
          // Appeler la fonction parent pour sauvegarder
          if (onLessonUpdate) {
            onLessonUpdate(updatedLesson);
          }
          
          // Afficher le message de succès
          setSuccessMessage(`✅ Durée mise à jour avec succès ! Nouvelle durée : ${realDuration} secondes`);
          
          // Masquer le message après 5 secondes
          setTimeout(() => {
            setSuccessMessage(null);
          }, 5000);
          
          console.log('💾 Leçon mise à jour avec la durée réelle:', realDuration, 'secondes');
          
        } else {
          throw new Error(`Erreur lors de la mise à jour de la formation: ${response.status}`);
        }
        
      } catch (dbError) {
        console.error('❌ Erreur lors de la mise à jour de la BDD:', dbError);
        
        // Mettre à jour quand même localement
        const updatedLesson = {
          ...selectedLesson,
          duration: realDuration
        };
        
        setSelectedLesson(updatedLesson);
        
        if (onLessonUpdate) {
          onLessonUpdate(updatedLesson);
        }
        
        setSuccessMessage(`⚠️ Durée calculée (${realDuration}s) mais erreur lors de la sauvegarde en BDD`);
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du calcul de la durée:', error);
      setSuccessMessage('❌ Erreur lors du calcul de la durée de la vidéo');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } finally {
      setIsCalculatingDuration(false);
    }
  };

  // Charger les progressions au montage du composant
  useEffect(() => {
    const loadProgressions = () => {
      try {
        const userId = getCurrentUserId();
        const progress = progressService.getProgress(formation.id, userId, lessons);
        setLessonProgress(progress);
        console.log('📊 Progressions chargées dans LessonPlayer:', progress);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des progressions:', error);
      }
    };

    if (lessons.length > 0) {
      loadProgressions();
    }
  }, [formation.id, lessons]);

  // Sélectionner automatiquement la première leçon ou la leçon initiale
  useEffect(() => {
    if (lessons.length > 0 && !selectedLesson) {
      if (initialSelectedLesson) {
        setSelectedLesson(initialSelectedLesson);
      } else {
        setSelectedLesson(lessons[0]);
      }
    }
  }, [lessons, selectedLesson, initialSelectedLesson]);

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

  const handleLessonSelect = (lesson: FormationContent) => {
    const lessonIndex = lessons.findIndex(l => l.id === lesson.id);
    const isAccessible = isLessonAccessible(lesson, lessonIndex);
    
    if (isAccessible) {
      setSelectedLesson(lesson);
    } else {
      console.log('🚫 Sélection bloquée pour', lesson.title, '- Leçon non accessible');
    }
  };

  const updateLessonProgress = (lessonId: string, progress: Partial<LessonProgress>) => {
    // Trouver l'index de la leçon
    const lessonIndex = lessons.findIndex(lesson => lesson.id === lessonId);
    if (lessonIndex === -1) return;

    // Vérifier si la leçon est accessible
    const isAccessible = isLessonAccessible(lessons[lessonIndex], lessonIndex);
    
    if (!isAccessible) {
      console.log('🚫 Progression bloquée pour', lessons[lessonIndex].title, '- Leçon non accessible');
      return;
    }

    // Mettre à jour via le service de progression
    const userId = getCurrentUserId();
    progressService.updateProgress(formation.id, userId, lessonId, {
      timeSpent: progress.timeSpent || 0,
      progress: progress.progress || 0,
      completed: progress.completed || false
    });
    
    // Mettre à jour l'état local
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        ...progress,
        lessonId,
        lastUpdated: new Date().toISOString()
      }
    }));
    
    // Appeler la fonction parent si elle existe
    if (onProgressUpdate) {
      onProgressUpdate(lessonId, {
        timeSpent: progress.timeSpent || 0,
        progress: progress.progress || 0,
        completed: progress.completed || false
      });
    }
  };

  const getFileType = (lesson: FormationContent) => {
    if (lesson.fileUrl) {
      const extension = lesson.fileUrl.split('.').pop()?.toLowerCase();
      if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension || '')) return 'video';
      if (['pdf'].includes(extension || '')) return 'pdf';
      if (['docx', 'doc'].includes(extension || '')) return 'document';
      if (['pptx', 'ppt'].includes(extension || '')) return 'presentation';
    }
    return lesson.type.toLowerCase();
  };

  // Fonction pour construire l'URL du fichier de la leçon
  const buildLessonFileUrl = (lesson: FormationContent) => {
    console.log('🔍 buildLessonFileUrl - lesson:', lesson);
    console.log('🔍 buildLessonFileUrl - formation.title:', formation.title);
    console.log('🔍 buildLessonFileUrl - lesson.title:', lesson.title);
    
    // Utiliser la fonction importée de imageUtils
    const url = getLessonFileUrl(formation.title, lesson.title);
    console.log('🔍 buildLessonFileUrl - URL générée:', url);
    return url;
  };




  const getFileIcon = (lesson: FormationContent) => {
    const fileType = getFileType(lesson);
    switch (fileType) {
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'document':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'presentation':
        return <Presentation className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActionButtonText = (lesson: FormationContent) => {
    const fileType = getFileType(lesson);
    switch (fileType) {
      case 'video':
        return 'Lire la vidéo';
      case 'pdf':
      case 'document':
        return 'Lire le document';
      case 'presentation':
        return 'Voir la présentation';
      default:
        return 'Lire';
    }
  };

  const renderLessonContent = () => {
    if (!selectedLesson) return null;

    const fileType = getFileType(selectedLesson);

    // Utiliser TestViewer pour tous les types pour le moment
    const fileUrl = buildLessonFileUrl(selectedLesson);
    
    return (
      <TestViewer
        lesson={selectedLesson}
        fileUrl={fileUrl || undefined}
        formationId={formation.id}
        userId={getCurrentUserId()}
        onProgressUpdate={(progress: Partial<LessonProgress>) => updateLessonProgress(selectedLesson.id, progress)}
      />
    );
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Fonction pour formater la durée de la leçon (provenant de la BDD)
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return 'N/A';
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h`;
    }
  };

  return (
    <>
      {/* Overlay sombre */}
      <div className="fixed inset-0 bg-black bg-opacity-75 z-[9998]" onClick={onClose} />
      
      {/* Modale */}
      <div 
        className="fixed inset-0 bg-white z-[9999] flex flex-col shadow-2xl" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'white',
          zIndex: 9999
        }}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{formation.title}</h1>
            </div>
          </div>
          
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden bg-white">
          {/* Left Sidebar - Liste des leçons */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Leçons</h2>
              <div className="space-y-3">
                {lessons.map((lesson, index) => {
                  const progress = lessonProgress[lesson.id];
                  const isSelected = selectedLesson?.id === lesson.id;
                  const isAccessible = isLessonAccessible(lesson, index);
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handleLessonSelect(lesson)}
                      className={`p-4 bg-white rounded-lg border-2 transition-all ${
                        !isAccessible
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : isSelected 
                            ? 'border-blue-500 bg-blue-50 cursor-pointer hover:shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer hover:shadow-md'
                      }`}
                    >
                      {/* Image de couverture */}
                      {lesson.coverImage ? (
                        <div className="mb-3 relative overflow-hidden rounded-lg">
                          <img
                            src={getLessonImageUrl(lesson.coverImage)}
                            alt={`Couverture de ${lesson.title}`}
                            className={`w-full h-20 object-cover ${
                              !isAccessible ? 'filter grayscale opacity-50' : ''
                            }`}
                          />
                          {!isAccessible && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Lock className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`mb-3 w-full h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center ${
                          !isAccessible ? 'opacity-50' : ''
                        }`}>
                          {!isAccessible ? (
                            <Lock className="h-8 w-8 text-gray-400" />
                          ) : (
                            getFileIcon(lesson)
                          )}
                        </div>
                      )}

                      {/* Titre et type */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">
                          {lesson.title}
                        </h3>
                        <div className="flex items-center space-x-1 ml-2">
                          {getFileIcon(lesson)}
                          {progress?.completed && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {/* Bouton d'édition pour les admins sur la carte */}
                          {isAdmin() && isSelected && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🔍 MODIFIER - Clic détecté !');
                                setShowLessonModal(true);
                              }}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              title="Modifier cette leçon"
                              style={{ 
                                zIndex: 10,
                                position: 'relative'
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {lesson.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {/* {lesson.description} */}
                        </p>
                      )}

                      {/* Durée et temps passé */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(lesson.duration || 0)}</span>
                        </div>
                        {progress && progress.timeSpent > 0 && (
                          <span className="text-blue-600">
                            {formatTime(progress.timeSpent)} passés
                          </span>
                        )}
                      </div>

                      {/* Bouton d'action */}
                      <button
                        disabled={!isAccessible}
                        className={`w-full py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                          !isAccessible
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {!isAccessible ? (
                          <>
                            <Lock className="h-3 w-3 mr-1 inline" />
                            Verrouillée
                          </>
                        ) : (
                          getActionButtonText(lesson)
                        )}
                      </button>

                      {/* Barre de progression */}
                      {!isAccessible ? (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progression</span>
                            <span>0%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-gray-400 h-1.5 rounded-full w-0" />
                          </div>
                        </div>
                      ) : progress && progress.progress > 0 ? (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progression</span>
                            <span>{Math.round(progress.progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side - Contenu de la leçon */}
          <div className="flex-1 bg-white overflow-hidden">
            {selectedLesson ? (
              <div className="h-full">
                {renderLessonContent()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Sélectionnez une leçon pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'édition de leçon personnalisé */}
      {showLessonModal && selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du modal */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Modifier la leçon</h2>
              <button
                onClick={() => setShowLessonModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Informations de base */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de base</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre de la leçon
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedLesson.title}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de contenu
                      </label>
                      <select
                        defaultValue={selectedLesson.type}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="VIDEO">Vidéo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    defaultValue={selectedLesson.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description de la leçon..."
                  />
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (en secondes)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue={formation.duration || 0}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Durée en secondes"
                    />
                    <button
                      type="button"
                      onClick={handleRecalculateDuration}
                      disabled={isCalculatingDuration || !selectedLesson?.fileUrl}
                      className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      title="Recalculer la durée à partir de la vidéo"
                    >
                      <RefreshCw className={`h-4 w-4 ${isCalculatingDuration ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {isCalculatingDuration && (
                    <p className="text-sm text-blue-600 mt-1">🔄 Calcul de la durée en cours...</p>
                  )}
                </div>

                {/* Fichier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier de la leçon
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {selectedLesson.fileUrl && (
                      <span className="text-sm text-gray-500">
                        Fichier actuel: {selectedLesson.fileUrl.split('/').pop()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Image de couverture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image de couverture
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {selectedLesson.coverImage && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img
                          src={getLessonImageUrl(selectedLesson.coverImage)}
                          alt="Couverture actuelle"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer du modal */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowLessonModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('💾 Sauvegarde de la leçon:', selectedLesson);
                  setShowLessonModal(false);
                  // TODO: Implémenter la sauvegarde
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Message de succès */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-[10001] bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-in slide-in-from-right duration-300">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="flex-shrink-0 ml-4 text-green-200 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
