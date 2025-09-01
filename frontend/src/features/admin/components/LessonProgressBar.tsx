import React, { useEffect, useState } from 'react';
import { useProgress } from '../../../contexts/ProgressContext';

interface LessonProgressBarProps {
  lessonId: string;
  formationId: string;
  userId: string;
  lessonType: string;
  onProgressUpdate?: (progress: number) => void;
  className?: string;
}

const LessonProgressBar: React.FC<LessonProgressBarProps> = ({
  lessonId,
  formationId,
  userId,
  lessonType,
  onProgressUpdate,
  className = ""
}) => {
  const { getProgress, globalProgress } = useProgress();
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    // Récupérer la progression depuis le contexte global
    const currentProgress = getProgress(lessonId, formationId, userId);
    if (currentProgress) {
      setProgress(currentProgress);
      onProgressUpdate?.(currentProgress.progress);
    } else {
      setProgress(null);
    }
  }, [lessonId, formationId, userId, globalProgress, getProgress, onProgressUpdate]);

  // Si pas de progression, afficher une barre vide
  if (!progress) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progression</span>
          <span>0%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gray-300 h-2 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>
    );
  }

  const progressPercentage = progress?.progress || 0;
  const isCompleted = progress?.completed || false;

  // Déterminer la couleur de la barre selon la progression
  const getProgressColor = () => {
    if (isCompleted) return 'bg-green-500';
    if (progressPercentage >= 75) return 'bg-blue-500';
    if (progressPercentage >= 50) return 'bg-yellow-500';
    if (progressPercentage >= 25) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  // Formater les détails selon le type de leçon
  const getProgressDetails = () => {
    if (!progress) return null;

    if (lessonType === 'PDF' && progress.currentPage && progress.totalPages) {
      return `Page ${progress.currentPage}/${progress.totalPages}`;
    }

    if ((lessonType === 'VIDEO' || lessonType === 'AUDIO') && progress.currentTime && progress.totalTime) {
      const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
      };

      return `${formatTime(progress.currentTime)} / ${formatTime(progress.totalTime)}`;
    }

    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span className="flex items-center">
          {isCompleted ? (
            <>
              <span className="text-green-600 mr-1">✓</span>
              Terminé
            </>
          ) : (
            'Progression'
          )}
        </span>
        <span className="font-medium">{Math.round(progressPercentage)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* Détails de la progression */}
      {getProgressDetails() && (
        <div className="text-xs text-gray-500 mt-1 text-center">
          {getProgressDetails()}
        </div>
      )}

      {/* Dernière activité */}
      {progress?.lastAccessedAt && (
        <div className="text-xs text-gray-400 mt-1 text-center">
          Dernière activité: {new Date(progress.lastAccessedAt).toLocaleDateString('fr-FR')}
        </div>
      )}
    </div>
  );
};

export default LessonProgressBar;
