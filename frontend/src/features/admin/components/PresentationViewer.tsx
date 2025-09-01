// PresentationViewer.tsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Download, Maximize } from 'lucide-react';
import { FormationContent } from '../types';

interface PresentationViewerProps {
  lesson: FormationContent;
  fileUrl?: string; // URL du fichier à lire
  onProgressUpdate: (progress: {
    timeSpent: number;
    progress: number;
    completed: boolean;
  }) => void;
}

export default function PresentationViewer({ lesson, fileUrl, onProgressUpdate }: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [slideDuration] = useState(5); // 5 secondes par diapositive

  // Simuler le nombre total de diapositives
  useEffect(() => {
    setTotalSlides(lesson.metadata ? JSON.parse(lesson.metadata).slides || 8 : 8);
  }, [lesson]);

  // Démarrer le suivi du temps
  useEffect(() => {
    if (startTime === null) {
      setStartTime(Date.now());
    }
  }, [startTime]);

  // Mettre à jour le temps passé
  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        const newTimeSpent = Math.floor((Date.now() - startTime) / 1000);
        setTimeSpent(newTimeSpent);
        
        // Calculer la progression basée sur les diapositives
        const progress = (currentSlide / totalSlides) * 100;
        
        onProgressUpdate({
          timeSpent: newTimeSpent,
          progress,
          completed: progress >= 90
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, currentSlide, totalSlides, onProgressUpdate]);

  // Gestion de l'auto-play
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        if (currentSlide < totalSlides) {
          setCurrentSlide(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, slideDuration * 1000);

      setAutoPlayInterval(interval);
      return () => clearInterval(interval);
    } else if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      setAutoPlayInterval(null);
    }
  }, [isPlaying, currentSlide, totalSlides, slideDuration]);

  const goToSlide = (slide: number) => {
    if (slide >= 1 && slide <= totalSlides) {
      setCurrentSlide(slide);
    }
  };

  const nextSlide = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying);
  };

  const resetPresentation = () => {
    setCurrentSlide(1);
    setIsPlaying(false);
    setStartTime(null);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getSlideContent = (slideNumber: number) => {
    // Simuler le contenu des diapositives
    const slideContents = [
      "Introduction à la formation",
      "Objectifs d'apprentissage",
      "Concepts clés",
      "Exemples pratiques",
      "Exercices d'application",
      "Résumé des points importants",
      "Questions et réponses",
      "Conclusion et prochaines étapes"
    ];

    return slideContents[slideNumber - 1] || `Diapositive ${slideNumber}`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header de la leçon */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{lesson.title}</h2>
            {lesson.description && (
              <p className="text-gray-600">{lesson.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetPresentation}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Recommencer"
            >
              <RotateCcw className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={toggleAutoPlay}
              className={`p-2 rounded-lg transition-colors ${
                isPlaying 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              title={isPlaying ? 'Arrêter l\'auto-play' : 'Démarrer l\'auto-play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Zone de visualisation de la présentation */}
      <div className="flex-1 flex items-center justify-center p-6">
        {fileUrl ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden w-[800px] h-[600px]">
            {/* Simuler l'affichage d'une diapositive */}
            <div className="h-full flex flex-col">
              {/* En-tête de la diapositive */}
              <div className="bg-blue-600 text-white px-6 py-4">
                <h3 className="text-lg font-semibold">
                  Diapositive {currentSlide} sur {totalSlides}
                </h3>
                <p className="text-blue-100 text-sm">
                  {lesson.title}
                </p>
              </div>
              
              {/* Contenu de la diapositive */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-orange-600 font-bold text-2xl">
                      {currentSlide}
                    </div>
                  </div>
                  <h4 className="text-2xl font-semibold text-gray-800 mb-4">
                    {getSlideContent(currentSlide)}
                  </h4>
                  <p className="text-gray-600">
                    Contenu de la diapositive {currentSlide}
                  </p>
                </div>
              </div>
              
              {/* Pied de page */}
              <div className="bg-gray-100 px-6 py-3 text-center text-sm text-gray-600">
                {isPlaying && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <span>Lecture automatique en cours</span>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <div className="text-orange-600 font-bold text-2xl">PPT</div>
            </div>
            <p className="text-gray-600 mt-4 text-lg">Aucune présentation disponible</p>
            <p className="text-gray-500">Veuillez ajouter un fichier PowerPoint à cette leçon</p>
          </div>
        )}
      </div>

      {/* Contrôles de navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Navigation des diapositives */}
          <div className="flex items-center space-x-4">
            <button
              onClick={previousSlide}
              disabled={currentSlide <= 1}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max={totalSlides}
                value={currentSlide}
                onChange={(e) => goToSlide(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md text-sm"
              />
              <span className="text-sm text-gray-600">sur {totalSlides}</span>
            </div>
            
            <button
              onClick={nextSlide}
              disabled={currentSlide >= totalSlides}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </div>

          {/* Informations et actions */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              <span>Temps passé: {formatTime(timeSpent)}</span>
            </div>
            
                         {fileUrl && (
               <a
                 href={fileUrl}
                 download
                 className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                <Download className="h-4 w-4" />
                <span>Télécharger</span>
              </a>
            )}
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
            <span>Progression</span>
            <span>{Math.round((currentSlide / totalSlides) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
            />
          </div>
        </div>

        {/* Miniatures des diapositives */}
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
          {Array.from({ length: totalSlides }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => goToSlide(index + 1)}
              className={`flex-shrink-0 w-16 h-12 rounded-lg border-2 transition-all ${
                currentSlide === index + 1
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
