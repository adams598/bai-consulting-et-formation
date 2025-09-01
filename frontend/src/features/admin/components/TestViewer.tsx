// TestViewer.tsx
import React, { useEffect, useState, useRef } from 'react';
import { FileText } from 'lucide-react';
import { FormationContent } from '../types';
import ProgressTracker from './ProgressTracker';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';
import { Document, Page } from 'react-pdf';
import { useProgress } from '../../../contexts/ProgressContext';

// Configuration du worker pour react-pdf
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface TestViewerProps {
  lesson: FormationContent;
  fileUrl?: string;
  formationId?: string;
  userId?: string;
  onProgressUpdate?: (progress: {
    timeSpent: number;
    progress: number;
    completed: boolean;
  }) => void;
}

export default function TestViewer({ lesson, fileUrl, formationId, userId, onProgressUpdate }: TestViewerProps) {
  const { saveProgress: saveGlobalProgress, loadProgress: loadGlobalProgress, getProgress: getGlobalProgress } = useProgress();
  
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullUrl, setFullUrl] = useState<string>("");
  const [conversionStatus, setConversionStatus] = useState<any>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  
  // États pour la progression dynamique
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isTrackingProgress, setIsTrackingProgress] = useState<boolean>(false);
  const [scrollMode, setScrollMode] = useState<'vertical' | 'horizontal'>('vertical');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  // Effet pour bloquer les raccourcis clavier et captures d'écran
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.shiftKey && e.key === 'S') ||
        e.key === 'PrintScreen' ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        e.stopPropagation();
        console.log('⚠️ Raccourci clavier bloqué pour la protection du contenu');
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'VIDEO') {
        e.preventDefault();
        e.stopPropagation();
        console.log('⚠️ Menu contextuel bloqué sur la vidéo');
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, []);

  // Effet pour charger le fichier
  useEffect(() => {
    if (!fileUrl) {
      console.log('🔍 TestViewer - Pas de fileUrl fourni, pas de chargement');
      setMimeType("");
      setBlobUrl(null);
      setError(null);
      setFullUrl("");
      setConversionStatus(null);
      setIsConverting(false);
      setPdfUrl(null);
      setPdfDocument(null);
      setPageCount(null);
      setCurrentPage(1);
      setTotalPages(1);
      setCurrentTime(0);
      setTotalTime(0);
      setIsTrackingProgress(false);
      setScrollMode('vertical');
      setIsLoading(false);
      return;
    }

    const loadFile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('accessToken');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const completeUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:3000${fileUrl}`;
        setFullUrl(completeUrl);
        
        const response = await fetch(completeUrl, {
          method: "GET",
          credentials: "include",
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ TestViewer - Réponse non OK:', response.status, errorText);
          throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
        }

        const blob = await response.blob();
        let detectedMimeType = blob.type;
        if (blob.type === 'application/octet-stream' || blob.type === '') {
          const fileName = fileUrl?.split('/').pop() || '';
          if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            detectedMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            detectedMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          } else if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
            detectedMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          } else if (fileName.endsWith('.mp4') || fileName.endsWith('.webm') || fileName.endsWith('.ogg')) {
            detectedMimeType = 'video/mp4';
          } else if (fileName.endsWith('.avi') || fileName.endsWith('.mov') || fileName.endsWith('.wmv')) {
            detectedMimeType = 'video/avi';
          } else if (fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.ogg')) {
            detectedMimeType = 'audio/mpeg';
          }
        }
        
        setMimeType(detectedMimeType);
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        
        if (detectedMimeType === "application/pdf") {
          loadPdfPages(url);
        }

      } catch (err) {
        console.error("❌ Erreur chargement fichier:", err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [fileUrl]);

  // Effet pour charger la progression sauvegardée (une seule fois au montage)
  useEffect(() => {
    if (fileUrl && formationId && userId) {
      loadSavedProgress();
    }
  }, []); // Dépendances vides pour ne s'exécuter qu'une seule fois

  // Effet pour re-rendre les pages quand le mode change
  useEffect(() => {
    if (scrollMode === 'horizontal' && pageCount && pdfDocument) {
      renderAllPages(pdfDocument);
    }
  }, [scrollMode, pdfDocument]);

  // Fonction pour charger le nombre de pages d'un PDF
  const loadPdfPages = async (pdfUrl: string) => {
    try {
      GlobalWorkerOptions.workerSrc = pdfjsWorker;
      
      let pdfSource: string | ArrayBuffer = pdfUrl;
      if (pdfUrl.startsWith('blob:')) {
        try {
          const response = await fetch(pdfUrl);
          const arrayBuffer = await response.arrayBuffer();
          pdfSource = arrayBuffer;
        } catch (error) {
          console.error('❌ loadPdfPages - Erreur lors de la conversion du blob:', error);
        }
      }
      
      const loadingTask = getDocument(pdfSource);
      
      loadingTask.onProgress = (progress: any) => {
        // console.log('🔍 loadPdfPages - Progression:', progress);
      };
      
      loadingTask.promise.catch((error: any) => {
        console.error('❌ loadPdfPages - Erreur de la promesse:', error);
      });
      
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      setPageCount(numPages);
      setTotalPages(numPages);
      setPdfDocument(pdf);
      
      startProgressTracking();
      
    } catch (err) {
      console.error("❌ Erreur lors du chargement du PDF:", err);
      setPageCount(null);
      setTotalPages(1);
    }
  };

  // Fonction pour rendre toutes les pages en canvas
  const renderAllPages = async (pdf: any) => {
    try {
      console.log('🔍 renderAllPages - Début du rendu de', pdf.numPages, 'pages');
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Créer un canvas pour cette page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          console.error('❌ renderAllPages - Impossible de créer le contexte canvas pour la page', pageNum);
          continue;
        }
        
        // Ajuster la taille du canvas
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Rendre la page sur le canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        console.log(`🔍 renderAllPages - Page ${pageNum} rendue sur canvas`);
        
        // Trouver le conteneur de la page et remplacer le contenu
        const pageContainer = document.getElementById(`pdf-page-${pageNum}`);
        if (pageContainer) {
          pageContainer.innerHTML = '';
          pageContainer.appendChild(canvas);
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.objectFit = 'contain';
        }
      }
      
      console.log('🔍 renderAllPages - Toutes les pages rendues avec succès');
    } catch (error) {
      console.error('❌ renderAllPages - Erreur lors du rendu des pages:', error);
    }
  };

  // Fonction pour démarrer le suivi de progression
  const startProgressTracking = () => {
    if (isTrackingProgress) return;
    
    setIsTrackingProgress(true);
    
    progressUpdateInterval.current = setInterval(() => {
      updateProgress();
    }, 2000);
  };

  // Fonction pour arrêter le suivi de progression
  const stopProgressTracking = () => {
    if (progressUpdateInterval.current) {
      clearInterval(progressUpdateInterval.current);
      progressUpdateInterval.current = null;
    }
    setIsTrackingProgress(false);
  };

  // Fonction pour mettre à jour la progression
  const updateProgress = () => {
    if (mimeType === "application/pdf" && pageCount) {
      const estimatedProgress = Math.round((currentPage / pageCount) * 100);
      
      if (onProgressUpdate) {
        onProgressUpdate({
          timeSpent: estimatedProgress,
          progress: estimatedProgress,
          completed: estimatedProgress >= 100
        });
      }
    } else if (mimeType.startsWith("video/") && videoRef.current) {
      const video = videoRef.current;
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      if (duration > 0) {
        const progress = Math.round((currentTime / duration) * 100);
        setCurrentTime(currentTime);
        setTotalTime(duration);
        
        if (onProgressUpdate) {
          onProgressUpdate({
            timeSpent: progress,
            progress: progress,
            completed: progress >= 100
          });
        }
      }
    } else if (mimeType.startsWith("audio/") && audioRef.current) {
      const audio = audioRef.current;
      const currentTime = audio.currentTime;
      const duration = audio.duration;
      
      if (duration > 0) {
        const progress = Math.round((currentTime / duration) * 100);
        setCurrentTime(currentTime);
        setTotalTime(duration);
        
        if (onProgressUpdate) {
          onProgressUpdate({
            timeSpent: progress,
            progress: progress,
            completed: progress >= 100
          });
        }
      }
    }
  };

  // Fonction pour sauvegarder la progression avec throttling
  const saveProgress = async (currentPage: number, totalPages: number) => {
    if (fileUrl && formationId && userId) {
      try {
        await saveGlobalProgress({
          lessonId: lesson.id,
          formationId: formationId,
          userId: userId,
          currentPage: currentPage,
          totalPages: totalPages,
          currentTime: currentTime,
          totalTime: totalTime,
          progress: Math.round((currentPage / totalPages) * 100),
          completed: currentPage >= totalPages,
          lastAccessedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la progression:', error);
      }
    }
  };

  // Fonction pour charger la progression sauvegardée
  const loadSavedProgress = async () => {
    if (fileUrl && formationId && userId) {
      try {
        const savedProgress = await loadGlobalProgress(lesson.id, formationId, userId);
        if (savedProgress) {
          console.log('📊 Progression chargée:', savedProgress);
          setCurrentPage(savedProgress.currentPage || 1);
          setCurrentTime(savedProgress.currentTime || 0);
          
          // Mettre à jour l'interface parent
          if (onProgressUpdate) {
            onProgressUpdate({
              timeSpent: savedProgress.currentTime || 0,
              progress: savedProgress.progress || 0,
              completed: savedProgress.completed || false
            });
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement de la progression:', error);
      }
    }
  };

  // Nettoyer l'intervalle quand le composant se démonte
  useEffect(() => {
    return () => {
      stopProgressTracking();
    };
  }, []);

  // Nettoyer l'URL blob quand le composant se démonte
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contenu principal */}
      <div className="flex-1 p-6">
        {fileUrl ? (
          isLoading ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <FileText className="h-12 w-12 text-blue-600 animate-pulse" />
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-4">
                Chargement du fichier...
              </h4>
              <p className="text-gray-600">Veuillez patienter</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <FileText className="h-12 w-12 text-red-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-4">
                Erreur de chargement ❌
              </h4>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : blobUrl ? (
            <div>
              {/* Images */}
              {mimeType.startsWith("image/") && (
                <div className="w-full h-[calc(100vh-120px)] border rounded bg-white flex items-center justify-center">
                  <img
                    src={blobUrl}
                    alt="Aperçu fichier"
                    className="max-w-full max-h-full object-contain rounded shadow"
                  />
                </div>
              )}

              {/* PDFs */}
              {mimeType === "application/pdf" && (
                <div className="w-full h-[calc(100vh-120px)] border rounded bg-white relative">
                  <div className="w-full h-full relative p-4">
                    {/* Contrôles de navigation */}
                    {pageCount && pageCount > 1 && (
                      <div className="absolute bottom-4 right-4 z-20 bg-white/95 p-3 rounded-lg shadow-lg border">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              const newPage = Math.max(1, currentPage - 1);
                              setCurrentPage(newPage);
                              console.log(`📄 Navigation: Page ${newPage}/${pageCount}`);
                              
                              if (pageCount && pageCount > 0) {
                                const progressPercentage = Math.round((newPage / pageCount) * 100);
                                if (onProgressUpdate) {
                                  onProgressUpdate({
                                    timeSpent: currentTime,
                                    progress: progressPercentage,
                                    completed: progressPercentage >= 100
                                  });
                                }
                                saveProgress(newPage, pageCount);
                              }
                            }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 transition-colors text-sm font-medium"
                            disabled={currentPage <= 1}
                          >
                            ← Précédente
                          </button>
                          
                          <span className="text-sm font-medium text-gray-700 px-2">
                            {currentPage} / {pageCount}
                          </span>
                          
                          <button
                            onClick={() => {
                              const newPage = Math.min(pageCount, currentPage + 1);
                              setCurrentPage(newPage);
                              console.log(`📄 Navigation: Page ${newPage}/${pageCount}`);
                              
                              if (pageCount && pageCount > 0) {
                                const progressPercentage = Math.round((newPage / pageCount) * 100);
                                if (onProgressUpdate) {
                                  onProgressUpdate({
                                    timeSpent: currentTime,
                                    progress: progressPercentage,
                                    completed: progressPercentage >= 100
                                  });
                                }
                                saveProgress(newPage, pageCount);
                              }
                            }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 transition-colors text-sm font-medium"
                            disabled={currentPage >= pageCount}
                          >
                            Suivante →
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* PDF Viewer */}
                    <div className="w-full h-full flex items-center justify-center">
                      <Document
                        file={blobUrl}
                        onLoadSuccess={({ numPages }) => {
                          console.log('📄 PDF chargé avec react-pdf:', numPages, 'pages');
                          setPageCount(numPages);
                          setTotalPages(numPages);
                          
                          if (onProgressUpdate) {
                            const initialProgress = Math.round((1 / numPages) * 100);
                            onProgressUpdate({
                              timeSpent: 0,
                              progress: initialProgress,
                              completed: false
                            });
                            console.log(`📊 Progression initiale: 1/${numPages} = ${initialProgress}%`);
                          }
                        }}
                        onLoadError={(error) => {
                          console.error('❌ Erreur lors du chargement du PDF:', error);
                        }}
                      >
                        <Page
                          pageNumber={currentPage}
                          width={800}
                          scale={0.65}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          onLoadSuccess={() => {
                            console.log(`📄 Page ${currentPage} chargée avec succès`);
                            
                            if (pageCount && pageCount > 0) {
                              const progressPercentage = Math.round((currentPage / pageCount) * 100);
                              console.log(`📊 Progression: ${currentPage}/${pageCount} = ${progressPercentage}%`);
                              
                              if (onProgressUpdate) {
                                onProgressUpdate({
                                  timeSpent: currentTime,
                                  progress: progressPercentage,
                                  completed: progressPercentage >= 100
                                });
                              }
                              saveProgress(currentPage, pageCount);
                            }
                          }}
                          onLoadError={(error) => {
                            console.error(`❌ Erreur lors du chargement de la page ${currentPage}:`, error);
                          }}
                        />
                      </Document>
                    </div>
                  </div>
                </div>
              )}

              {/* Vidéos */}
              {mimeType.startsWith("video/") && (
                <div className="w-full h-[calc(100vh-120px)] border rounded bg-white">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={blobUrl}
                      controls
                      className="w-full h-full object-contain bg-black select-none"
                      style={{
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none',
                        pointerEvents: 'auto'
                      }}
                      preload="metadata"
                      controlsList="nodownload nofullscreen noremoteplayback"
                      disablePictureInPicture
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          setTotalTime(videoRef.current.duration);
                          startProgressTracking();
                        }
                      }}
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTime(videoRef.current.currentTime);
                        }
                      }}
                      onEnded={() => {
                        stopProgressTracking();
                        if (onProgressUpdate) {
                          onProgressUpdate({
                            timeSpent: 100,
                            progress: 100,
                            completed: true
                          });
                        }
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                    />
                  </div>
                </div>
              )}

              {/* Audio */}
              {mimeType.startsWith("audio/") && (
                <div className="w-full h-[80vh] border rounded bg-white">
                  <div className="bg-gray-50 p-4 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Lecteur audio
                        </h3>
                        <p className="text-sm text-gray-600">
                          Lecture de l'audio avec le lecteur HTML5
                        </p>
                      </div>
                      
                      {totalTime > 0 && (
                        <div className="bg-white/90 p-3 rounded-lg shadow border">
                          <div className="text-xs text-gray-600 mb-2 font-medium">Progression</div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-mono text-gray-800">
                              {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(currentTime / totalTime) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono text-gray-800">
                              {Math.floor(totalTime / 60)}:{(totalTime % 60).toFixed(0).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 text-center">
                            {Math.round((currentTime / totalTime) * 100)}% terminé
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center bg-gray-100">
                    <audio
                      ref={audioRef}
                      src={blobUrl}
                      controls
                      className="w-full max-w-md"
                      preload="metadata"
                      onLoadedMetadata={() => {
                        if (audioRef.current) {
                          setTotalTime(audioRef.current.duration);
                          startProgressTracking();
                        }
                      }}
                      onTimeUpdate={() => {
                        if (audioRef.current) {
                          setCurrentTime(audioRef.current.currentTime);
                        }
                      }}
                    >
                      Votre navigateur ne supporte pas la lecture audio.
                      <a href={blobUrl} download>Télécharger l'audio</a>
                    </audio>
                  </div>
                  
                  <div className="p-4 bg-gray-50 border-t">
                    <a
                      href={blobUrl}
                      download
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Télécharger l'audio
                    </a>
                  </div>
                </div>
              )}

              {/* Autres fichiers */}
              {!mimeType.startsWith("image/") && 
               mimeType !== "application/pdf" && 
               !mimeType.startsWith("video/") &&
               !mimeType.startsWith("audio/") && (
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <FileText className="h-12 w-12 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-4">
                    Fichier non prévisualisable
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Ce type de fichier ne peut pas être affiché directement
                  </p>
                  <a
                    href={blobUrl}
                    download
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Télécharger le fichier
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="w-24 h-24 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <FileText className="h-12 w-12 text-red-600" />
              </div>
              <h4 className="text-2xl font-semibold text-gray-800 mb-4">
                Aucun fichier disponible ❌
              </h4>
              <p className="text-gray-600 mb-4">
                Le fichier n'a pas pu être récupéré
              </p>
              <div className="bg-gray-100 p-4 rounded text-left text-sm">
                <p><strong>Debug info :</strong></p>
                <p>Lesson ID: {lesson.id}</p>
                <p>Lesson Title: {lesson.title}</p>
                <p>Lesson fileUrl: {lesson.fileUrl || 'null'}</p>
                <p>Lesson type: {lesson.type}</p>
                <p>FileUrl prop: {fileUrl}</p>
              </div>
            </div>
          )
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <FileText className="h-12 w-12 text-red-600" />
            </div>
            <h4 className="text-2xl font-semibold text-gray-800 mb-4">
              Aucun fichier disponible ❌
            </h4>
            <p className="text-gray-600 mb-4">
              Aucune URL de fichier fournie
            </p>
            <div className="bg-gray-100 p-4 rounded text-left text-sm">
              <p><strong>Debug info :</strong></p>
              <p>Lesson ID: {lesson.id}</p>
              <p>Lesson Title: {lesson.title}</p>
              <p>Lesson fileUrl: {lesson.fileUrl || 'null'}</p>
              <p>Lesson type: {lesson.type}</p>
              <p>FileUrl prop: {fileUrl}</p>
            </div>
          </div>
        )}

        {/* Composant de suivi de progression */}
        {formationId && userId && (
          <div className="mt-6">
            <ProgressTracker
              lessonId={lesson.id}
              formationId={formationId}
              userId={userId}
              lessonType={lesson.type}
              lessonDuration={lesson.duration}
              onProgressUpdate={(progress) => {
                console.log('📊 Progression mise à jour:', progress);
                onProgressUpdate?.({
                  timeSpent: progress,
                  progress: progress,
                  completed: progress >= 100
                });
              }}
            />
          </div>
        )}
      </div>
      
      {/* Footer minimal */}
      <div className="bg-white border-t px-6 py-2 text-center text-xs text-gray-500">
        © 2024 BAI Consulting - Lecteur de contenu sécurisé
      </div>
    </div>
  );
}