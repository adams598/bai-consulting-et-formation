// LessonPlayer.tsx
import React, { useState, useEffect, useContext } from 'react';
import { X, Play, FileText, Video, Presentation, Clock, CheckCircle, BookOpen, Lock } from 'lucide-react';
import { FormationContent } from '../types';
import { getLessonImageUrl, getImageUrl, getLessonFileUrl } from '../../../utils/imageUtils';
import TestViewer from './TestViewer';
import '../../../components/LessonPlayer.css';
import { useAuth } from '../../../providers/auth-provider';
import progressService from '../../../services/progressService';

interface LessonPlayerProps {
  formation: {
    id: string;
    title: string;
    description?: string;
  };
  lessons: FormationContent[];
  initialSelectedLesson?: FormationContent | null;
  onClose: () => void;
  onProgressUpdate?: (lessonId: string, progress: {
    timeSpent?: number;
    progress?: number;
    completed?: boolean;
  }) => void;
}

interface LessonProgress {
  lessonId: string;
  timeSpent: number; // en secondes
  progress: number; // 0-100
  completed: boolean;
}

export default function LessonPlayer({ formation, lessons, initialSelectedLesson, onClose, onProgressUpdate }: LessonPlayerProps) {
  const { user } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<FormationContent | null>(null);
  const [lessonProgress, setLessonProgress] = useState<{[key: string]: LessonProgress}>({});

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
                        </div>
                      </div>

                      {/* Description */}
                      {lesson.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {lesson.description}
                        </p>
                      )}

                      {/* Durée et temps passé */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{lesson.duration ? `${Math.floor(lesson.duration / 60)}m` : 'N/A'}</span>
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
    </>
  );
}
