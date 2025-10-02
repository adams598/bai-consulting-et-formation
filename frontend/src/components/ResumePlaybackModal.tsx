import React from 'react';
import { Play, RotateCcw, Clock } from 'lucide-react';

interface ResumePlaybackModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onClose: () => void;
  progressPercentage: number;
  currentTime: number;
  totalTime: number;
  lessonTitle: string;
}

export default function ResumePlaybackModal({
  isOpen,
  onResume,
  onRestart,
  onClose,
  progressPercentage,
  currentTime,
  totalTime,
  lessonTitle
}: ResumePlaybackModalProps) {
  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[10000] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Reprendre la lecture
          </h2>
          <p className="text-gray-600">
            Vous avez déjà commencé cette leçon
          </p>
        </div>

        {/* Lesson info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">{lessonTitle}</h3>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Progression</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Arrêté à {formatTime(currentTime)} / {formatTime(totalTime)}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Play className="h-5 w-5" />
            <span>Reprendre à {formatTime(currentTime)}</span>
          </button>
          
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Recommencer depuis le début</span>
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-4 text-gray-500 hover:text-gray-700 transition-colors text-sm"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

