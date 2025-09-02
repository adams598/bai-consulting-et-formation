// TestViewer.tsx
import React, { useEffect, useState, useRef } from 'react';
import { FileText } from 'lucide-react';
import { FormationContent } from '../types';
import { Document, Page } from 'react-pdf';
import { useProgress } from '../../../contexts/ProgressContext';

// Configuration du worker pour react-pdf et pdfjs-dist
import { pdfjs } from 'react-pdf';

// Configuration globale du worker - utiliser un worker local depuis public
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  console.log('✅ Worker PDF configuré avec worker local');
}

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

  // Effet pour réinitialiser l'état quand la leçon change
  useEffect(() => {
    console.log('🔄 TestViewer - Changement de leçon détecté:', lesson.id);
    
    // Vérifier la progression en base de données pour cette leçon
    if (formationId && userId) {
      checkLessonProgress();
    }
    
    // Nettoyer les URLs blob existantes
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    
    // Arrêter le suivi de progression
    if (progressUpdateInterval.current) {
      clearInterval(progressUpdateInterval.current);
      progressUpdateInterval.current = null;
    }
    
    // Réinitialiser tous les états
    setBlobUrl(null);
    setMimeType("");
    setIsLoading(false);
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
    
    console.log('✅ TestViewer - État réinitialisé pour nouvelle leçon');
  }, [lesson.id]); // Seulement quand lesson.id change

  // Fonction pour vérifier la progression de la leçon en base de données
  const checkLessonProgress = async () => {
    if (!formationId || !userId) return;
    
    try {
      console.log('🔍 Vérification de la progression en base de données...');
      console.log('🔍 Lesson ID:', lesson.id);
      console.log('🔍 Formation ID:', formationId);
      console.log('🔍 User ID:', userId);
      const savedProgress = await loadGlobalProgress(lesson.id, formationId, userId);
      console.log('🔍 Progression trouvée en base de données:', savedProgress);
      if (savedProgress) {
        console.log('📊 Progression trouvée en base de données:', {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          currentPage: savedProgress.currentPage,
          totalPages: savedProgress.totalPages,
          progress: savedProgress.progress + '%',
          completed: savedProgress.completed ? 'Oui' : 'Non',
          lastAccessed: savedProgress.lastAccessedAt
        });
      } else {
        console.log('📊 Aucune progression trouvée en base de données pour:', {
          lessonId: lesson.id,
          lessonTitle: lesson.title
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la progression:', error);
    }
  };

  // Effet pour charger le fichier
  useEffect(() => {
    console.log('🔄 TestViewer - useEffect de chargement déclenché');
    console.log('🔄 TestViewer - fileUrl:', fileUrl);
    console.log('🔄 TestViewer - lesson.id:', lesson.id);
    
    if (!fileUrl) {
      console.log('🔍 TestViewer - Pas de fileUrl fourni, pas de chargement');
      // Ne pas réinitialiser l'état ici, juste ne pas charger
      return;
    }

    const loadFile = async () => {
      console.log('🔄 TestViewer - Début du chargement du fichier:', fileUrl);
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
        
        console.log('🔄 TestViewer - URL complète:', completeUrl);
        
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
        console.log('✅ TestViewer - Blob reçu:', {
          size: blob.size,
          type: blob.type
        });
        
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
         
         // Pour les PDFs, react-pdf gère tout automatiquement
         if (detectedMimeType === "application/pdf") {
           console.log('✅ PDF détecté - react-pdf va gérer le chargement');
         }

             } catch (err) {
         console.error("❌ Erreur chargement fichier:", err);
         setError(err instanceof Error ? err.message : 'Erreur inconnue');
         // Ne pas réinitialiser complètement l'état, juste marquer l'erreur
       } finally {
         setIsLoading(false);
       }
    };

    loadFile();
  }, [fileUrl, lesson.id]); // Ajouter lesson.id comme dépendance

  // Effet pour charger la progression sauvegardée quand le PDF est chargé
  // SUPPRIMÉ - Le chargement se fait maintenant dans onLoadSuccess du Document

  // Effet pour sauvegarder automatiquement la progression quand la page change
  useEffect(() => {
    if (mimeType === "application/pdf" && pageCount && pageCount > 0 && currentPage > 0) {
      console.log(`📊 Sauvegarde automatique: page ${currentPage}/${pageCount}`);
      console.log(`📊 État actuel - currentPage: ${currentPage}, pageCount: ${pageCount}, mimeType: ${mimeType}`);
      // Utiliser updateProgress pour bénéficier de la logique non-régressive
      updateProgress();
    }
  }, [currentPage, pageCount, mimeType]);

  // Fonction pour charger le nombre de pages d'un PDF - SUPPRIMÉE car react-pdf gère tout

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
    // Ne pas utiliser d'intervalle pour les PDFs, la progression sera gérée par les événements de page
    if (mimeType === "application/pdf") {
      console.log('📊 Suivi de progression PDF activé (événements de page)');
      return;
    }
    
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
    console.log(`📊 updateProgress appelée - mimeType: ${mimeType}, pageCount: ${pageCount}, currentPage: ${currentPage}`);
    if (mimeType === "application/pdf" && pageCount && pageCount > 0) {
      const progressPercentage = Math.round((currentPage / pageCount) * 100);
      console.log(`📊 updateProgress - PDF: ${currentPage}/${pageCount} = ${progressPercentage}%`);
      
      // Récupérer la progression actuelle pour éviter la régression
      const currentProgress = getGlobalProgress(lesson.id, formationId || '', userId || '');
      const savedProgressPercentage = currentProgress?.progress || 0;
      
      // Ne pas diminuer la progression si on recule
      const finalProgressPercentage = Math.max(progressPercentage, savedProgressPercentage);
      
      console.log(`📊 Progression: actuelle=${progressPercentage}%, sauvegardée=${savedProgressPercentage}%, finale=${finalProgressPercentage}%`);
      
      // Mettre à jour l'interface parent
      if (onProgressUpdate) {
        onProgressUpdate({
          timeSpent: finalProgressPercentage,
          progress: finalProgressPercentage,
          completed: finalProgressPercentage >= 100
        });
      }
      
      // Toujours sauvegarder la progression actuelle en base de données
      saveLocalProgress(currentPage, pageCount, finalProgressPercentage);
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
  const saveLocalProgress = async (currentPage: number, totalPages: number, progressPercentage?: number) => {
    if (fileUrl && formationId && userId) {
      try {
        // Utiliser le pourcentage fourni ou calculer à partir de la page actuelle
        const finalProgress = progressPercentage !== undefined 
          ? progressPercentage 
          : Math.round((currentPage / totalPages) * 100);
        
        await saveGlobalProgress({
          lessonId: lesson.id,
          formationId: formationId,
          userId: userId,
          currentPage: currentPage,
          totalPages: totalPages,
          currentTime: currentTime,
          totalTime: totalTime,
          progress: finalProgress,
          completed: finalProgress >= 100,
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
          
          // Restaurer la page exacte où l'utilisateur s'était arrêté
          const lastPage = savedProgress.currentPage || 1;
          setCurrentPage(lastPage);
          setCurrentTime(savedProgress.currentTime || 0);
          
          console.log(`📊 Repositionnement exact: page ${lastPage}/${savedProgress.totalPages || '?'}`);
          
          // Mettre à jour l'interface parent avec la progression chargée
          if (onProgressUpdate) {
            const progressPercentage = savedProgress.progress || 0;
            onProgressUpdate({
              timeSpent: progressPercentage,
              progress: progressPercentage,
              completed: progressPercentage >= 100
            });
          }
          
          console.log(`📊 Interface mise à jour avec la progression: ${savedProgress.progress}%`);
        } else {
          console.log('📊 Aucune progression trouvée, utilisation des valeurs par défaut');
          // Pas de progression sauvegardée, utiliser les valeurs par défaut
          setCurrentPage(1);
          setCurrentTime(0);
          
          if (onProgressUpdate) {
            onProgressUpdate({
              timeSpent: 0,
              progress: 0,
              completed: false
            });
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement de la progression:', error);
        // En cas d'erreur, utiliser les valeurs par défaut
        setCurrentPage(1);
        setCurrentTime(0);
        
        if (onProgressUpdate) {
          onProgressUpdate({
            timeSpent: 0,
            progress: 0,
            completed: false
          });
        }
      }
    }
  };



  // Nettoyer l'intervalle quand le composant se démonte
  useEffect(() => {
    return () => {
      console.log('🧹 TestViewer - Nettoyage du composant');
      stopProgressTracking();
      
      // Nettoyer les URLs blob
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, []); // Dépendances vides pour ne s'exécuter qu'au démontage

  // Nettoyer l'URL blob quand le composant se démonte

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
              <div className="bg-gray-100 p-4 rounded text-left text-sm mb-4">
                <p><strong>Debug info :</strong></p>
                <p>Lesson ID: {lesson.id}</p>
                <p>Lesson Title: {lesson.title}</p>
                <p>FileUrl: {fileUrl}</p>
                <p>MimeType: {mimeType}</p>
                <p>FullUrl: {fullUrl}</p>
              </div>
                             <button
                 onClick={() => {
                   console.log('🔄 TestViewer - Tentative de rechargement');
                   // Réinitialiser les états nécessaires
                   setError(null);
                   setIsLoading(true);
                   // Déclencher un nouveau chargement
                   if (fileUrl) {
                     const event = new CustomEvent('retryLoad', { detail: { fileUrl, lessonId: lesson.id } });
                     window.dispatchEvent(event);
                   }
                 }}
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
                             // La progression sera mise à jour automatiquement par l'useEffect
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
                             // La progression sera mise à jour automatiquement par l'useEffect
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
                           
                           // Charger la progression sauvegardée APRÈS que le PDF soit prêt
                           if (formationId && userId) {
                             console.log('📊 Chargement de la progression après chargement PDF...');
                             loadSavedProgress();
                           }
                           
                           console.log(`📊 PDF chargé: ${numPages} pages, page courante: ${currentPage}`);
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
                             // La progression est maintenant gérée par l'useEffect automatique
                           }}
                           onLoadError={(error) => {
                             console.error(`❌ Erreur lors du chargement de la page ${currentPage}:`, error);
                             // Erreur de chargement de page
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
             <div className="bg-white p-4 rounded-lg shadow border">
               <h3 className="text-lg font-semibold text-gray-800 mb-2">Suivi de progression</h3>
               <div className="text-sm text-gray-600">
                 <p>• Progression basée sur la navigation des pages</p>
                 <p>• Sauvegarde automatique de votre position</p>
                 <p>• Rechargement de la progression à la reconnexion</p>
               </div>
             </div>
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