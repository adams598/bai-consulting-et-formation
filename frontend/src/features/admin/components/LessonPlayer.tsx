// LessonPlayer.tsx
import React, { useState, useEffect } from 'react';
import { X, Play, FileText, Video, Presentation, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { FormationContent } from '../types';
import { getLessonImageUrl, getImageUrl, getLessonFileUrl } from '../../../utils/imageUtils';
import TestViewer from './TestViewer';
import '../../../components/LessonPlayer.css';

interface LessonPlayerProps {
  formation: {
    id: string;
    title: string;
    description?: string;
  };
  lessons: FormationContent[];
  onClose: () => void;
}

interface LessonProgress {
  lessonId: string;
  timeSpent: number; // en secondes
  progress: number; // 0-100
  completed: boolean;
}

export default function LessonPlayer({ formation, lessons, onClose }: LessonPlayerProps) {
  const [selectedLesson, setSelectedLesson] = useState<FormationContent | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Map<string, LessonProgress>>(new Map());

  // Initialiser la progression pour chaque leçon
  useEffect(() => {
    const initialProgress = new Map<string, LessonProgress>();
    lessons.forEach(lesson => {
      initialProgress.set(lesson.id, {
        lessonId: lesson.id,
        timeSpent: 0,
        progress: 0,
        completed: false
      });
    });
    setLessonProgress(initialProgress);
  }, [lessons]);

  // Sélectionner automatiquement la première leçon
  useEffect(() => {
    if (lessons.length > 0 && !selectedLesson) {
      setSelectedLesson(lessons[0]);
    }
  }, [lessons, selectedLesson]);

  const handleLessonSelect = (lesson: FormationContent) => {
    setSelectedLesson(lesson);
  };

  const updateLessonProgress = (lessonId: string, progress: Partial<LessonProgress>) => {
    setLessonProgress(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(lessonId) || {
        lessonId,
        timeSpent: 0,
        progress: 0,
        completed: false
      };
      newMap.set(lessonId, { ...current, ...progress });
      return newMap;
    });
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
    // console.log('🔍 buildLessonFileUrl - lesson:', lesson);
    
    // Utiliser la fonction importée de imageUtils
    return getLessonFileUrl(formation.title, lesson.title);
  };

  // Fonction pour récupérer l'ID de l'utilisateur connecté
  const getCurrentUserId = (): string => {
    // Récupérer depuis le localStorage ou le contexte d'authentification
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        return user.id || 'default-user-id';
      } catch (error) {
        console.error('Erreur parsing userInfo:', error);
      }
    }
    
    // Fallback : utiliser un ID par défaut pour les tests
    return 'default-user-id';
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
                {lessons.map((lesson) => {
                  const progress = lessonProgress.get(lesson.id);
                  const isSelected = selectedLesson?.id === lesson.id;
                  
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handleLessonSelect(lesson)}
                      className={`p-4 bg-white rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Image de couverture */}
                      {lesson.coverImage ? (
                        <div className="mb-3 relative overflow-hidden rounded-lg">
                          <img
                            src={getLessonImageUrl(lesson.coverImage)}
                            alt={`Couverture de ${lesson.title}`}
                            className="w-full h-20 object-cover"
                          />
                        </div>
                      ) : (
                        <div className="mb-3 w-full h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(lesson)}
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
                        className={`w-full py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {getActionButtonText(lesson)}
                      </button>

                      {/* Barre de progression */}
                      {progress && progress.progress > 0 && (
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
                      )}
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
