import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, BookOpen, Play, Pause } from 'lucide-react';

interface ProgressTrackerProps {
  lessonId: string;
  formationId: string;
  userId: string;
  lessonType: string;
  lessonDuration?: number; // en minutes
  onProgressUpdate?: (progress: number) => void;
}

interface ProgressData {
  id: string;
  progress: number;
  currentPage?: number;
  totalPages?: number;
  currentTime?: number;
  totalTime?: number;
  isCompleted: boolean;
  lastAccessedAt: string;
}

export default function ProgressTracker({
  lessonId,
  formationId,
  userId,
  lessonType,
  lessonDuration,
  onProgressUpdate
}: ProgressTrackerProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(lessonDuration ? lessonDuration * 60 : 0);
  const [isTracking, setIsTracking] = useState(false);

  // Charger la progression initiale
  useEffect(() => {
    loadProgress();
  }, [lessonId, userId]);

  // Charger la progression depuis l'API
  const loadProgress = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/admin/progress/${userId}/${lessonId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProgress(data.data);
        
        // Initialiser les valeurs locales
        if (data.data.currentPage) setCurrentPage(data.data.currentPage);
        if (data.data.totalPages) setTotalPages(data.data.totalPages);
        if (data.data.currentTime) setCurrentTime(data.data.currentTime);
        if (data.data.totalTime) setTotalTime(data.data.totalTime);
        
        // Notifier le composant parent
        onProgressUpdate?.(data.data.progress);
      }
    } catch (error) {
      console.error('❌ Erreur chargement progression:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour la progression
  const updateProgress = async (newProgress: number, additionalData?: any) => {
    try {
      const updateData = {
        progress: newProgress,
        currentPage: additionalData?.currentPage || currentPage,
        totalPages: additionalData?.totalPages || totalPages,
        currentTime: additionalData?.currentTime || currentTime,
        totalTime: additionalData?.totalTime || totalTime,
        lastPosition: JSON.stringify({
          page: additionalData?.currentPage || currentPage,
          time: additionalData?.currentTime || currentTime,
          timestamp: Date.now()
        })
      };

      const response = await fetch(
        `http://localhost:3000/api/admin/progress/${userId}/${lessonId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProgress(data.data);
        onProgressUpdate?.(newProgress);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour progression:', error);
    }
  };

  // Mettre à jour la page courante (pour PDFs)
  const updatePageProgress = (page: number, total: number) => {
    setCurrentPage(page);
    setTotalPages(total);
    
    const newProgress = Math.round((page / total) * 100);
    updateProgress(newProgress, { currentPage: page, totalPages: total });
  };

  // Mettre à jour le temps (pour vidéos/audio)
  const updateTimeProgress = (time: number, total: number) => {
    setCurrentTime(time);
    setTotalTime(total);
    
    const newProgress = Math.round((time / total) * 100);
    updateProgress(newProgress, { currentTime: time, totalTime: total });
  };

  // Marquer comme terminé
  const markAsCompleted = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/progress/${userId}/${lessonId}/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProgress(data.data);
        onProgressUpdate?.(100);
      }
    } catch (error) {
      console.error('❌ Erreur marquage terminé:', error);
    }
  };

  // Formater le temps en mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Formater la durée en minutes
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* En-tête avec titre et statut */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Suivi de progression
        </h3>
        {progress?.isCompleted && (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Terminé</span>
          </div>
        )}
      </div>

      {/* Barre de progression principale */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progression globale
          </span>
          <span className="text-sm font-medium text-blue-600">
            {progress?.progress || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress?.progress || 0}%` }}
          ></div>
        </div>
      </div>

      {/* Détails spécifiques selon le type de leçon */}
      {lessonType === 'DOCUMENT' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-2">
            <BookOpen className="h-4 w-4 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Lecture du document</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((currentPage / totalPages) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {lessonType === 'VIDEO' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-2">
            <Play className="h-4 w-4 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Visionnage de la vidéo</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(totalTime)}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((currentTime / totalTime) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentTime / totalTime) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Informations générales */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <div className="text-xs text-gray-600">Dernière visite</div>
          <div className="text-sm font-medium text-gray-800">
            {progress?.lastAccessedAt ? 
              new Date(progress.lastAccessedAt).toLocaleDateString('fr-FR') : 
              'Jamais'
            }
          </div>
        </div>
        
        {lessonDuration && (
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Play className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <div className="text-xs text-gray-600">Durée estimée</div>
            <div className="text-sm font-medium text-gray-800">
              {formatDuration(lessonDuration)}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {!progress?.isCompleted && (
          <button
            onClick={markAsCompleted}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Marquer comme terminé
          </button>
        )}
        
        <button
          onClick={loadProgress}
          className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          Actualiser
        </button>
      </div>

      {/* Debug info (à retirer en production) */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <div><strong>Debug:</strong></div>
          <div>Lesson ID: {lessonId}</div>
          <div>User ID: {userId}</div>
          <div>Type: {lessonType}</div>
          <div>Progress: {JSON.stringify(progress, null, 2)}</div>
        </div> */}
      {/* )} */}
    </div>
  );
}
