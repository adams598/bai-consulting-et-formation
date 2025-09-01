// DocumentViewer.tsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { FormationContent } from '../types';

interface DocumentViewerProps {
  lesson: FormationContent;
  fileType: 'pdf' | 'document';
  fileUrl?: string; // URL du fichier à lire
  onProgressUpdate: (progress: {
    timeSpent: number;
    progress: number;
    completed: boolean;
  }) => void;
}

export default function DocumentViewer({ lesson, fileType, fileUrl, onProgressUpdate }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);

  // Simuler le nombre total de pages (dans un vrai projet, cela viendrait de l'API)
  useEffect(() => {
    // Simuler des documents de différentes tailles
    if (fileType === 'pdf') {
      setTotalPages(lesson.metadata ? JSON.parse(lesson.metadata).pages || 10 : 10);
    } else {
      setTotalPages(lesson.metadata ? JSON.parse(lesson.metadata).pages || 5 : 5);
    }
  }, [lesson, fileType]);

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
        
        // Calculer la progression basée sur les pages
        const progress = (currentPage / totalPages) * 100;
        
        onProgressUpdate({
          timeSpent: newTimeSpent,
          progress,
          completed: progress >= 90
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, currentPage, totalPages, onProgressUpdate]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getFileIcon = () => {
    if (fileType === 'pdf') {
      return (
        <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
          <div className="text-red-600 font-bold text-lg">PDF</div>
        </div>
      );
    } else {
      return (
        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
          <div className="text-blue-600 font-bold text-lg">DOC</div>
        </div>
      );
    }
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
              onClick={handleRotate}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Pivoter"
            >
              <RotateCw className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut className="h-5 w-5 text-gray-700" />
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom avant"
            >
              <ZoomIn className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Zone de visualisation du document */}
      <div className="flex-1 flex items-center justify-center p-6">
        {fileUrl ? (
          <div 
            className="bg-white shadow-lg rounded-lg overflow-hidden"
            style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
          >
                         {fileType === 'pdf' ? (
               <iframe
                 src={`${fileUrl}#page=${currentPage}`}
                 className="w-[800px] h-[600px] border-0"
                 title={`Page ${currentPage} de ${lesson.title}`}
               />
             ) : (
              <div className="w-[800px] h-[600px] flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  {getFileIcon()}
                  <p className="text-gray-600 mt-2">Document Word</p>
                  <p className="text-sm text-gray-500">Page {currentPage} sur {totalPages}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            {getFileIcon()}
            <p className="text-gray-600 mt-4 text-lg">Aucun document disponible</p>
            <p className="text-gray-500">Veuillez ajouter un fichier à cette leçon</p>
          </div>
        )}
      </div>

      {/* Contrôles de navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Navigation des pages */}
          <div className="flex items-center space-x-4">
            <button
              onClick={previousPage}
              disabled={currentPage <= 1}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md text-sm"
              />
              <span className="text-sm text-gray-600">sur {totalPages}</span>
            </div>
            
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages}
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
            <span>{Math.round((currentPage / totalPages) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
