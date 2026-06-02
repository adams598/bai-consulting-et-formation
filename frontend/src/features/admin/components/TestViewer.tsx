// TestViewer.tsx
import React, { useEffect, useState, useRef } from 'react';
import { FileText, Presentation } from 'lucide-react';
import { FormationContent, QuizQuestion } from '../types';
import { Document, Page, pdfjs } from 'react-pdf';
import { useProgress } from '../../../contexts/ProgressContext';
import ResumePlaybackModal from '../../../components/ResumePlaybackModal';
import MidVideoQuizOverlay from '../../../components/MidVideoQuizOverlay';
import progressService from '../../../services/progressService';

interface TestViewerProps {
  lesson: any;
  fileUrl?: string;
  formationId?: string;
  userId?: string;
  onProgressUpdate?: (progress: any) => void;
  midVideoQuizzes?: any[];
}

function TestViewer({ lesson, fileUrl, formationId, userId, onProgressUpdate, midVideoQuizzes }: TestViewerProps) {
  // Interface étendue pour la progression des leçons
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
  const [pdfError, setPdfError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [presentationSlides, setPresentationSlides] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [totalSlides, setTotalSlides] = useState<number>(0);
  const [isPresentationLoading, setIsPresentationLoading] = useState<boolean>(false);
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);
  const [hasShownResumeModal, setHasShownResumeModal] = useState<boolean>(false);
  const [activeMidVideoQuizConfig, setActiveMidVideoQuizConfig] = useState<{
    questions: QuizQuestion[];
    questionTimeLimitSec?: number;
    currentTime?: number;
  } | null>(null);
  const [triggeredMidVideoQuizIndexes, setTriggeredMidVideoQuizIndexes] = useState<Set<number>>(new Set());
  const [resumeModalData, setResumeModalData] = useState<{
    currentTime: number;
    totalTime: number;
    progressPercentage: number;
  } | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to get current user ID
  const getCurrentUserId = () => userId || '';

  useEffect(() => {
    setActiveMidVideoQuizConfig(null);
    setTriggeredMidVideoQuizIndexes(new Set());
  }, [lesson.id, fileUrl]);

  // Effet pour bloquer les raccourcis clavier et captures d'écran
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Vérifier si l'événement provient d'un champ input, textarea ou élément éditable
      const target = e.target as HTMLElement;
      const isInputElement = target && (
        // ...existing code...
        false
      );
      if ((e.key === 'Meta' || // Cmd (Mac)
        e.key === 'ContextMenu') // Menu contextuel
      ) {
        e.preventDefault();
        e.stopPropagation();
        console.log('⚠️ Raccourci clavier bloqué pour la protection du contenu:', e.key);
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      console.log('⚠️ Menu contextuel bloqué');
        return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('⚠️ Glisser-déposer bloqué');
      return false;
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('⚠️ Sélection bloquée');
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('⚠️ Copie bloquée');
      return false;
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('⚠️ Couper bloqué');
      return false;
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('⚠️ Coller bloqué');
      return false;
    };

    // Ajouter tous les event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('cut', handleCut, true);
    document.addEventListener('paste', handlePaste, true);

    // Bloquer les outils de développement
    const originalConsole = window.console;
    window.console = {
      ...originalConsole,
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
      debug: () => {},
      trace: () => {},
      table: () => {},
      group: () => {},
      groupEnd: () => {},
      time: () => {},
      timeEnd: () => {},
      count: () => {},
      clear: () => {}
    };

    // Désactiver le clic droit sur tous les éléments
    document.addEventListener('mousedown', (e) => {
      if (e.button === 2) { // Clic droit
        e.preventDefault();
        e.stopPropagation();
        console.log('⚠️ Clic droit bloqué');
        return false;
      }
    }, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('cut', handleCut, true);
      document.removeEventListener('paste', handlePaste, true);
      
      // Restaurer la console
      window.console = originalConsole;
    };
  }, []);

  // Effet pour maintenir la vitesse de lecture à 0.85
  useEffect(() => {
    if (videoRef.current && mimeType.startsWith("video/")) {
      videoRef.current.playbackRate = 0.85;
    }
  }, [mimeType, videoRef.current]);

  // Effet pour vérifier périodiquement la durée de la vidéo (fallback si onLoadedMetadata ne se déclenche pas)
  useEffect(() => {
    if (!mimeType.startsWith("video/")) return;

    const checkDuration = () => {
      if (videoRef.current && totalTime <= 0) {
        const duration = videoRef.current.duration;
        if (!isNaN(duration) && duration > 0 && duration !== Infinity) {
          console.log(`🎬 useEffect checkDuration - Durée récupérée: ${duration}s`);
          setTotalTime(duration);
        }
      }
    };

    // Vérifier immédiatement si la vidéo est déjà chargée
    if (videoRef.current) {
      checkDuration();
    }

    // Vérifier périodiquement (toutes les 500ms) jusqu'à ce que la durée soit disponible
    const interval = setInterval(() => {
      if (totalTime <= 0 && videoRef.current) {
        checkDuration();
      } else if (totalTime > 0) {
        clearInterval(interval);
      }
    }, 500);

    // Nettoyer après 10 secondes maximum
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [mimeType, totalTime]);

  // Effet pour réinitialiser l'état quand la leçon change
  useEffect(() => {
    // console.log('🔄 TestViewer - Changement de leçon détecté:', lesson.id);
    
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
    setPresentationSlides([]);
    setCurrentSlide(0);
    setTotalSlides(0);
    setIsPresentationLoading(false);
    
    // console.log('✅ TestViewer - État réinitialisé pour nouvelle leçon');
  }, [lesson.id]); // Seulement quand lesson.id change

     // Fonction pour réinitialiser le worker PDF
   const resetPdfWorker = () => {
     if (typeof window !== 'undefined') {
       try {
         // Essayer d'abord le worker local
         pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
         // console.log('🔄 Worker PDF réinitialisé avec worker local');
         setPdfError(false);
         setRetryCount(0);
       } catch (error) {
         console.error('❌ Erreur worker local, tentative CDN:', error);
         try {
           // Fallback vers le CDN
           pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
           // console.log('🔄 Worker PDF réinitialisé avec CDN');
           setPdfError(false);
           setRetryCount(0);
         } catch (cdnError) {
           console.error('❌ Erreur lors de la réinitialisation du worker PDF:', cdnError);
         }
       }
     }
   };

   // Fonction pour vérifier la progression de la leçon
   const checkLessonProgress = async () => {
     if (!formationId) return;
    
     const currentUserId = getCurrentUserId();
     // console.log('🔍 Vérification de la progression...');
      // console.log('🔍 Lesson ID:', lesson.id);
      // console.log('🔍 Formation ID:', formationId);
     // console.log('🔍 User ID:', currentUserId);
     
     try {
       const savedProgress = progressService.getProgress(formationId, currentUserId, [])[lesson.id];
       // console.log('🔍 Progression trouvée:', savedProgress);
       
       if (savedProgress && savedProgress.progress > 0) {
        //  console.log('📊 Progression trouvée:', {
        //   lessonId: lesson.id,
        //   lessonTitle: lesson.title,
        //   progress: savedProgress.progress + '%',
        //   completed: savedProgress.completed ? 'Oui' : 'Non',
        //    lastUpdated: savedProgress.lastUpdated
        // });
      } else {
         console.log('📊 Aucune progression trouvée pour:', {
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
    // console.log('🔄 TestViewer - useEffect de chargement déclenché');
    // console.log('🔄 TestViewer - fileUrl:', fileUrl);
    // console.log('🔄 TestViewer - lesson.fileUrl:', lesson.fileUrl);
    // console.log('🔄 TestViewer - lesson.id:', lesson.id);
    
    // Déterminer l'URL à utiliser : priorité absolue à lesson.fileUrl si c'est une URL complète
    let urlToUse = fileUrl;
    
    // PRIORITÉ 1: Si lesson.fileUrl existe et est une URL complète (http/https), l'utiliser en priorité
    if (lesson.fileUrl && (lesson.fileUrl.startsWith('http://') || lesson.fileUrl.startsWith('https://'))) {
      urlToUse = lesson.fileUrl;
      const isCloudinary = lesson.fileUrl.includes('res.cloudinary.com');
      console.log(`✅ TestViewer - Utilisation de lesson.fileUrl (${isCloudinary ? 'Cloudinary' : 'URL complète'}):`, urlToUse);
    } else if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
      // PRIORITÉ 2: Si fileUrl est une URL complète, l'utiliser
      urlToUse = fileUrl;
      const isCloudinary = fileUrl.includes('res.cloudinary.com');
      console.log(`✅ TestViewer - Utilisation de fileUrl (${isCloudinary ? 'Cloudinary' : 'URL complète'}):`, urlToUse);
    } else if (lesson.fileUrl) {
      // PRIORITÉ 3: Si lesson.fileUrl existe mais n'est pas une URL complète, l'utiliser quand même
      urlToUse = lesson.fileUrl;
      // console.log('✅ TestViewer - Utilisation de lesson.fileUrl (chemin relatif):', urlToUse);
    }
    
    if (!urlToUse) {
      console.log('🔍 TestViewer - Pas d\'URL disponible, pas de chargement');
      return;
    }

    const loadFile = async () => {
      // console.log('🔄 TestViewer - Début du chargement du fichier');
      // console.log('   urlToUse:', urlToUse);
      // console.log('   lesson.fileUrl:', lesson.fileUrl);
      // console.log('   fileUrl (prop):', fileUrl);
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Si c'est une URL complète (Cloudinary, Hostinger, Render, etc.), l'utiliser directement sans fetch
        // Le navigateur peut charger directement les URLs publiques
        if (urlToUse && (urlToUse.startsWith('http://') || urlToUse.startsWith('https://'))) {
          const isCloudinary = urlToUse.includes('res.cloudinary.com');
          console.log(`☁️ TestViewer - URL complète détectée (${isCloudinary ? 'Cloudinary' : 'autre'}), chargement direct:`, urlToUse);
          
          // Détecter le type MIME depuis l'URL et le type de leçon
          let detectedMimeType = '';
          const urlLower = urlToUse.toLowerCase();
          
          // PRIORITÉ 1: Détection par le type de leçon
          if (lesson.type === 'VIDEO' || lesson.type === 'PRESENTATION') {
            // Pour les présentations, vérifier si c'est une vidéo ou un PDF
            if (urlLower.includes('/video/') || urlLower.endsWith('.mp4') || urlLower.endsWith('/video.mp4')) {
              detectedMimeType = 'video/mp4';
            } else if (urlLower.endsWith('.pdf') || urlLower.includes('/image/')) {
              detectedMimeType = lesson.type === 'VIDEO' ? 'video/mp4' : 'application/pdf';
            } else {
              // Par défaut pour PRESENTATION avec URL Cloudinary contenant /video/
              detectedMimeType = 'video/mp4';
            }
          } else if (lesson.type === 'PDF') {
            detectedMimeType = 'application/pdf';
          } else if (lesson.type === 'IMAGE') {
            detectedMimeType = 'image/jpeg';
          } else if (lesson.type === 'AUDIO') {
            detectedMimeType = 'audio/mpeg';
          }
          
          // PRIORITÉ 2: Détection par extension ou chemin dans l'URL si pas encore détecté
          if (!detectedMimeType) {
            if (urlLower.includes('/video/') || urlLower.endsWith('.mp4') || urlLower.endsWith('/video.mp4')) {
              detectedMimeType = 'video/mp4';
            } else if (urlLower.endsWith('.webm')) {
              detectedMimeType = 'video/webm';
            } else if (urlLower.endsWith('.ogg') || urlLower.endsWith('.ogv')) {
              detectedMimeType = 'video/ogg';
            } else if (urlLower.endsWith('.avi')) {
              detectedMimeType = 'video/avi';
            } else if (urlLower.endsWith('.mov')) {
              detectedMimeType = 'video/quicktime';
            } else if (urlLower.endsWith('.wmv')) {
              detectedMimeType = 'video/x-ms-wmv';
            } else if (urlLower.includes('/image/') || urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
              detectedMimeType = 'image/jpeg';
            } else if (urlLower.endsWith('.pdf')) {
              detectedMimeType = 'application/pdf';
            } else if (urlLower.endsWith('.mp3') || urlLower.endsWith('.wav') || urlLower.endsWith('.ogg')) {
              detectedMimeType = 'audio/mpeg';
            }
          }
          
          console.log(`📄 TestViewer - Type MIME détecté:`, {
            fromLessonType: lesson.type,
            fromUrl: detectedMimeType,
            final: detectedMimeType || 'Non détecté',
            urlToUse: urlToUse
          });
          
          // Si c'est Cloudinary, utiliser directement
          // Si c'est une autre URL (Hostinger/Render), essayer quand même mais avec gestion d'erreur
          setFullUrl(urlToUse);
          setBlobUrl(urlToUse); // Utiliser directement l'URL
          
          // Toujours définir le mimeType, même si la détection n'a pas fonctionné
          // Pour les URLs Cloudinary avec /video/, on assume que c'est une vidéo
          if (detectedMimeType) {
            setMimeType(detectedMimeType);
            console.log(`✅ TestViewer - MimeType défini: ${detectedMimeType}`);
          } else if (urlToUse.includes('/video/') || urlToUse.includes('/video.mp4')) {
            // Fallback: si l'URL contient /video/, c'est probablement une vidéo
            setMimeType('video/mp4');
            console.log(`✅ TestViewer - MimeType défini par fallback (video): video/mp4`);
          } else {
            console.warn(`⚠️ TestViewer - MimeType non détecté pour l'URL: ${urlToUse}`);
          }
          
          setIsLoading(false);
          
          // Pour les URLs non-Cloudinary, on laisse le navigateur essayer de charger
          // Si ça échoue, l'erreur sera gérée par onError du <video>
          return;
        }
        
        // Pour les URLs locales, utiliser fetch avec authentification
        const token = localStorage.getItem('accessToken');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const completeUrl = urlToUse.startsWith('http') ? urlToUse : `http://localhost:3000${urlToUse}`;
        setFullUrl(completeUrl);
        
        // console.log('🔄 TestViewer - URL complète (locale):', completeUrl);
        
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
        // console.log('✅ TestViewer - Blob reçu:', {
        //   size: blob.size,
        //   type: blob.type
        // });
        
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
           // console.log('✅ PDF détecté - react-pdf va gérer le chargement');
         }
         
         // Pour les présentations PowerPoint
         if (detectedMimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
           // console.log('✅ Présentation PowerPoint détectée - chargement avec pptx-preview');
           loadPresentation(blob);
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
  }, [fileUrl, lesson.fileUrl, lesson.id]); // Ajouter lesson.id comme dépendance

  // Effet pour charger la progression sauvegardée quand le PDF est chargé
  // SUPPRIMÉ - Le chargement se fait maintenant dans onLoadSuccess du Document

     // Effet pour sauvegarder automatiquement la progression quand la page change (PDF) ou le temps change (vidéo/audio)
   useEffect(() => {
     if (mimeType === "application/pdf" && pageCount && pageCount > 0 && currentPage > 0) {
      //  console.log(`📊 Sauvegarde automatique PDF: page ${currentPage}/${pageCount}`);
       // Utiliser updateProgress pour bénéficier de la logique non-régressive
       updateProgress();
     } else if ((mimeType.startsWith("video/") || mimeType.startsWith("audio/")) && totalTime > 0 && currentTime >= 0) {
       console.log(`🎬 useEffect sauvegarde - Déclenchement automatique`);
       console.log(`🎬 useEffect sauvegarde - Temps: ${Math.floor(currentTime / 60)}:${(currentTime % 60).toFixed(0).padStart(2, '0')}/${Math.floor(totalTime / 60)}:${(totalTime % 60).toFixed(0).padStart(2, '0')}`);
       console.log(`🎬 useEffect sauvegarde - Progression: ${Math.round((currentTime / totalTime) * 100)}%`);
       console.log(`🎬 useEffect sauvegarde - Conditions: mimeType=${mimeType}, totalTime=${totalTime}, currentTime=${currentTime}, isTrackingProgress=${isTrackingProgress}`);
       
       // Pour les vidéos/audios, toujours mettre à jour la progression si on a les données nécessaires
       // Ne pas dépendre de isTrackingProgress car il peut ne pas être encore initialisé
       if (currentTime > 0 && totalTime > 0) {
        //  console.log(`🎬 useEffect sauvegarde - Mise à jour de la progression (currentTime > 0)`);
         // Utiliser updateProgress pour bénéficier de la logique non-régressive
         updateProgress();
         
         // Démarrer le suivi si ce n'est pas déjà fait
         if (!isTrackingProgress) {
          //  console.log(`🎬 useEffect sauvegarde - Démarrage du suivi de progression`);
           startProgressTracking();
         }
       } else {
         console.log(`🎬 useEffect sauvegarde - Données insuffisantes: currentTime=${currentTime}, totalTime=${totalTime}`);
       }
     }
   }, [currentPage, pageCount, mimeType, currentTime, totalTime]);

  // Fonction pour charger le nombre de pages d'un PDF - SUPPRIMÉE car react-pdf gère tout

  // // Fonction pour rendre toutes les pages en canvas
  // const renderAllPages = async (pdf: any) => {
  //   try {
  //     // console.log('🔍 renderAllPages - Début du rendu de', pdf.numPages, 'pages');
      
  //     for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
  //       const page = await pdf.getPage(pageNum);
  //       const viewport = page.getViewport({ scale: 1.0 });
        
  //       // Créer un canvas pour cette page
  //       const canvas = document.createElement('canvas');
  //       const context = canvas.getContext('2d');
        
  //       if (!context) {
  //         console.error('❌ renderAllPages - Impossible de créer le contexte canvas pour la page', pageNum);
  //         continue;
  //       }
        
  //       // Ajuster la taille du canvas
  //       canvas.width = viewport.width;
  //       canvas.height = viewport.height;
        
  //       // Rendre la page sur le canvas
  //       const renderContext = {
  //         canvasContext: context,
  //         viewport: viewport
  //       };
        
  //       await page.render(renderContext).promise;
  //       console.log(`🔍 renderAllPages - Page ${pageNum} rendue sur canvas`);
        
  //       // Trouver le conteneur de la page et remplacer le contenu
  //       const pageContainer = document.getElementById(`pdf-page-${pageNum}`);
  //       if (pageContainer) {
  //         pageContainer.innerHTML = '';
  //         pageContainer.appendChild(canvas);
  //         canvas.style.width = '100%';
  //         canvas.style.height = '100%';
  //         canvas.style.objectFit = 'contain';
  //       }
  //     }
      
  //     // console.log('🔍 renderAllPages - Toutes les pages rendues avec succès');
  //   } catch (error) {
  //     console.error('❌ renderAllPages - Erreur lors du rendu des pages:', error);
  //   }
  // };

     // Fonction pour démarrer le suivi de progression
   const startProgressTracking = () => {
     console.log(`🎬 startProgressTracking appelée - mimeType: ${mimeType}, totalTime: ${totalTime}, isTrackingProgress: ${isTrackingProgress}`);
     
     // Ne pas utiliser d'intervalle pour les PDFs, la progression sera gérée par les événements de page
     if (mimeType === "application/pdf") {
       // console.log('📊 Suivi de progression PDF activé (événements de page)');
       setIsTrackingProgress(true);
       return;
     }
     
     // Pour les vidéos et audios, vérifier que les données sont disponibles
     if ((mimeType.startsWith("video/") || mimeType.startsWith("audio/")) && totalTime <= 0) {
       // console.log('🎬 startProgressTracking - Suivi différé - totalTime non disponible');
       console.log(`🎬 startProgressTracking - État actuel: totalTime=${totalTime}, currentTime=${currentTime}, mimeType=${mimeType}`);
       return;
     }
     
     if (isTrackingProgress) {
       // console.log('🎬 startProgressTracking - Suivi déjà actif, ignoré');
       return;
     }
     
     setIsTrackingProgress(true);
     // console.log('🎬 Suivi de progression média activé (intervalle 2s)');
     console.log(`🎬 État final - totalTime: ${totalTime}, currentTime: ${currentTime}, isTrackingProgress: true`);
     
     progressUpdateInterval.current = setInterval(() => {
       console.log(`⏰ Intervalle de progression déclenché - ${new Date().toLocaleTimeString()}`);
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

  // Fonctions pour les contrôles vidéo personnalisés
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleVideoClick = () => {
    togglePlayPause();
  };

  const handleVideoMouseMove = () => {
    setShowControls(true);
    
    // Masquer les contrôles après 3 secondes d'inactivité
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleVideoMouseLeave = () => {
    // Masquer les contrôles quand la souris quitte la vidéo
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1000);
  };

  // Fonction pour charger une présentation PowerPoint
  const loadPresentation = async (blob: Blob) => {
    try {
      setIsPresentationLoading(true);
      // console.log('📊 Chargement de la présentation PowerPoint...');
      
      // Pour l'instant, nous simulons une présentation avec des informations de base
      // Dans une version future, nous pourrions intégrer une vraie bibliothèque de lecture
      const mockSlides = [
        { id: '1', title: 'Diapositive 1', content: 'Contenu de la première diapositive' },
        { id: '2', title: 'Diapositive 2', content: 'Contenu de la deuxième diapositive' },
        { id: '3', title: 'Diapositive 3', content: 'Contenu de la troisième diapositive' }
      ];
      
      // console.log('✅ Présentation simulée chargée:', mockSlides);
      setPresentationSlides(mockSlides);
      setTotalSlides(mockSlides.length);
      setCurrentSlide(0);
      
      // Charger la progression sauvegardée
      if (formationId && userId) {
        // console.log('📊 Chargement de la progression présentation après chargement...');
        loadSavedProgress();
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la présentation:', error);
      setError('Erreur lors du chargement de la présentation PowerPoint');
    } finally {
      setIsPresentationLoading(false);
    }
  };

     // Fonction pour mettre à jour la progression
   const updateProgress = () => {
     console.log(`📊 updateProgress appelée - mimeType: ${mimeType}, pageCount: ${pageCount}, currentPage: ${currentPage}`);
     console.log(`📊 updateProgress - État actuel: totalTime=${totalTime}, currentTime=${currentTime}, isTrackingProgress=${isTrackingProgress}`);
     
     if (!formationId) return;
     
     const currentUserId = getCurrentUserId();
     
     if (mimeType === "application/pdf" && pageCount && pageCount > 0) {
       const progressPercentage = Math.round((currentPage / pageCount) * 100);
       console.log(`📊 updateProgress - PDF: ${currentPage}/${pageCount} = ${progressPercentage}%`);
       
       // Récupérer la progression actuelle pour éviter la régression
       const currentProgress = progressService.getProgress(formationId, currentUserId, [])[lesson.id];
         const savedProgressPercentage = currentProgress?.progress || 0;
       
       // Ne pas diminuer la progression si on recule
       const finalProgressPercentage = Math.max(progressPercentage, savedProgressPercentage);
       
       console.log(`📊 Progression: actuelle=${progressPercentage}%, sauvegardée=${savedProgressPercentage}%, finale=${finalProgressPercentage}%`);
       
       // Mettre à jour l'interface parent
       if (onProgressUpdate) {
         onProgressUpdate({
           timeSpent: currentPage, // Pour les PDFs, timeSpent = numéro de page
           progress: finalProgressPercentage,
           completed: finalProgressPercentage >= 100
         });
       }
       
       // Sauvegarder la progression
       saveLocalProgress(currentPage, pageCount, finalProgressPercentage);
            } else if (mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" && totalSlides > 0) {
         const progressPercentage = Math.round((currentSlide / totalSlides) * 100);
        //  console.log(`📊 updateProgress - Présentation: ${currentSlide}/${totalSlides} = ${progressPercentage}%`);
         
         // Récupérer la progression actuelle pour éviter la régression
       const currentProgress = progressService.getProgress(formationId, currentUserId, [])[lesson.id];
         const savedProgressPercentage = currentProgress?.progress || 0;
         
         // Ne pas diminuer la progression si on recule
         const finalProgressPercentage = Math.max(progressPercentage, savedProgressPercentage);
         
        //  console.log(`📊 Progression présentation: actuelle=${progressPercentage}%, sauvegardée=${savedProgressPercentage}%, finale=${finalProgressPercentage}%`);
         
         // Mettre à jour l'interface parent
         if (onProgressUpdate) {
           onProgressUpdate({
             timeSpent: currentSlide, // Pour les présentations, timeSpent = numéro de diapositive
             progress: finalProgressPercentage,
             completed: finalProgressPercentage >= 100
           });
         }
         
       // Sauvegarder la progression
         saveLocalProgress();
            } else if (mimeType.startsWith("video/") && videoRef.current) {
         const video = videoRef.current;
         // Récupérer directement depuis l'élément vidéo pour les vidéos distantes
         const currentTime = video.currentTime;
         const duration = video.duration;
         
        //  console.log(`🎬 updateProgress vidéo - currentTime: ${currentTime}s, duration: ${duration}s, isNaN: ${isNaN(currentTime)}/${isNaN(duration)}`);
        //  console.log(`🎬 updateProgress vidéo - readyState: ${video.readyState}, networkState: ${video.networkState}`);
         
         // Vérifier que la durée est disponible (nécessaire pour calculer la progression)
         if (duration > 0 && currentTime >= 0 && !isNaN(currentTime) && !isNaN(duration) && duration !== Infinity) {
           // Calculer la progression en pourcentage : (currentTime / duration) * 100
           const progress = Math.round((currentTime / duration) * 100);
           
           // Mettre à jour les états React avec les valeurs de l'élément vidéo
           setCurrentTime(currentTime);
           setTotalTime(duration);
           
           console.log(`🎬 updateProgress vidéo - Progression calculée: ${currentTime}s/${duration}s = ${progress}%`);
           
           // Récupérer la progression actuelle sauvegardée pour éviter la régression
           const currentProgress = progressService.getProgress(formationId, currentUserId, [])[lesson.id];
           const savedProgressPercentage = currentProgress?.progress || 0;
           
           // Ne pas diminuer la progression si on recule dans la vidéo
           const finalProgressPercentage = Math.max(progress, savedProgressPercentage);
           
           console.log(`🎬 Progression vidéo: actuelle=${progress}%, sauvegardée=${savedProgressPercentage}%, finale=${finalProgressPercentage}%`);
           console.log(`🎬 Temps formaté: ${Math.floor(currentTime / 60)}:${(currentTime % 60).toFixed(0).padStart(2, '0')}/${Math.floor(duration / 60)}:${(duration % 60).toFixed(0).padStart(2, '0')}`);
           
           // Mettre à jour l'interface parent avec la progression calculée
           if (onProgressUpdate) {
             onProgressUpdate({
               timeSpent: currentTime, // Temps réel en secondes depuis le début de la vidéo
               progress: finalProgressPercentage, // Progression en pourcentage (0-100)
               completed: finalProgressPercentage >= 100 // Marquer comme complété si >= 100%
             });
             console.log(`✅ Interface parent mise à jour avec: ${finalProgressPercentage}% (temps: ${currentTime}s)`);
           }
           
           // Sauvegarder la progression seulement si on a des données valides
           if (currentTime > 0 && duration > 0) {
             console.log(`💾 Sauvegarde de la progression vidéo...`);
             // saveLocalProgress utilisera les états currentTime et totalTime mis à jour ci-dessus
             saveLocalProgress();
           } else {
             console.log(`⚠️ Données invalides pour sauvegarde - currentTime: ${currentTime}, duration: ${duration}`);
           }
         } else {
           console.log(`⚠️ Conditions non remplies pour calcul de progression:`);
           console.log(`   - duration: ${duration} (doit être > 0 et !== Infinity)`);
           console.log(`   - currentTime: ${currentTime} (doit être >= 0)`);
           console.log(`   - isNaN(currentTime): ${isNaN(currentTime)}`);
           console.log(`   - isNaN(duration): ${isNaN(duration)}`);
           console.log(`   - duration === Infinity: ${duration === Infinity}`);
           
           // Si la durée n'est pas encore disponible, essayer de la récupérer
           if (video.readyState >= 1 && duration > 0 && !isNaN(duration) && duration !== Infinity) {
             console.log(`🔄 Tentative de récupération de la durée depuis readyState...`);
             setTotalTime(duration);
           }
         }
            } else if (mimeType.startsWith("audio/") && audioRef.current) {
         const audio = audioRef.current;
         const currentTime = audio.currentTime;
         const duration = audio.duration;
         
         if (duration > 0 && currentTime >= 0) {
           const progress = Math.round((currentTime / duration) * 100);
           setCurrentTime(currentTime);
           setTotalTime(duration);
           
           // Récupérer la progression actuelle pour éviter la régression
         const currentProgress = progressService.getProgress(formationId, currentUserId, [])[lesson.id];
           const savedProgressPercentage = currentProgress?.progress || 0;
           
           // Ne pas diminuer la progression si on recule
           const finalProgressPercentage = Math.max(progress, savedProgressPercentage);
           
           console.log(`📊 Progression audio: actuelle=${progress}%, sauvegardée=${savedProgressPercentage}%, finale=${finalProgressPercentage}%`);
           
           if (onProgressUpdate) {
             onProgressUpdate({
               timeSpent: currentTime, // Utiliser le temps réel en secondes
               progress: finalProgressPercentage,
               completed: finalProgressPercentage >= 100
             });
           }
           
         // Sauvegarder la progression seulement si on a des données valides
           if (currentTime > 0 && duration > 0) {
             saveLocalProgress();
           }
         }
     }
   };

     // Fonction pour sauvegarder la progression avec throttling
   const saveLocalProgress = async (currentPage?: number, totalPages?: number, progressPercentage?: number) => {
     console.log(`💾 saveLocalProgress appelée - mimeType: ${mimeType}, formationId: ${formationId}`);
     console.log(`💾 saveLocalProgress - Paramètres: currentPage=${currentPage}, totalPages=${totalPages}, progressPercentage=${progressPercentage}`);
     console.log(`💾 saveLocalProgress - États React: currentTime=${currentTime}, totalTime=${totalTime}, currentPage=${currentPage}, totalSlides=${totalSlides}`);
     
     if (!formationId) return;
     
     const currentUserId = getCurrentUserId();
       try {
         let finalProgress = 0;
       let timeSpent = 0;
         
         if (mimeType === "application/pdf" && currentPage && totalPages) {
           // Pour les PDFs
           finalProgress = progressPercentage !== undefined 
             ? progressPercentage 
             : Math.round((currentPage / totalPages) * 100);
         timeSpent = currentPage; // Pour les PDFs, timeSpent = numéro de page
         } else if (mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" && totalSlides > 0) {
           // Pour les présentations PowerPoint
           finalProgress = Math.round((currentSlide / totalSlides) * 100);
         timeSpent = currentSlide; // Pour les présentations, timeSpent = numéro de diapositive
           console.log(`📊 saveLocalProgress - Présentation: ${currentSlide}/${totalSlides} = ${finalProgress}%`);
         } else if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) {
           // Pour les vidéos et audios - utiliser currentTime et totalTime (duration) pour calculer la progression
           console.log(`🎬 saveLocalProgress - totalTime (duration): ${totalTime}s, currentTime: ${currentTime}s`);
           console.log(`🎬 saveLocalProgress - isNaN(totalTime): ${isNaN(totalTime)}, isNaN(currentTime): ${isNaN(currentTime)}`);
           console.log(`🎬 saveLocalProgress - totalTime === Infinity: ${totalTime === Infinity}`);
           
           // Vérifier que les temps sont valides (totalTime = duration de la vidéo)
           if (totalTime > 0 && currentTime >= 0 && !isNaN(totalTime) && !isNaN(currentTime) && totalTime !== Infinity) {
             // Calculer la progression : (currentTime / totalTime) * 100
             finalProgress = Math.round((currentTime / totalTime) * 100);
             timeSpent = currentTime; // Temps réel en secondes depuis le début de la vidéo
             
             console.log(`✅ saveLocalProgress - Progression calculée: ${currentTime}s/${totalTime}s = ${finalProgress}%`);
           } else {
             console.warn(`⚠️ Temps non disponibles ou invalides pour sauvegarde:`);
             console.warn(`   - totalTime: ${totalTime} (doit être > 0 et !== Infinity)`);
             console.warn(`   - currentTime: ${currentTime} (doit être >= 0)`);
             console.warn(`   - isNaN(totalTime): ${isNaN(totalTime)}`);
             console.warn(`   - isNaN(currentTime): ${isNaN(currentTime)}`);
             return; // Ne pas sauvegarder si les temps ne sont pas encore disponibles ou invalides
           }
         }
         
       // Sauvegarder via le service de progression
         const progressData = {
         timeSpent: timeSpent,
           progress: finalProgress,
         completed: finalProgress >= 100
       };
       
       console.log(`💾 Données à sauvegarder:`, progressData);
       console.log(`💾 FormationId: ${formationId}, UserId: ${currentUserId}, LessonId: ${lesson.id}`);
       
       progressService.updateProgress(formationId, currentUserId, lesson.id, progressData);
       
       // Vérifier que la sauvegarde a bien fonctionné
       const savedData = progressService.getProgress(formationId, currentUserId, [])[lesson.id];
       console.log(`✅ Données sauvegardées vérifiées:`, savedData);
         
         console.log(`📊 Progression sauvegardée: ${finalProgress}% (${mimeType}) - Temps: ${Math.floor(currentTime / 60)}:${(currentTime % 60).toFixed(0).padStart(2, '0')}/${Math.floor(totalTime / 60)}:${(totalTime % 60).toFixed(0).padStart(2, '0')}`);
       } catch (error) {
         console.error('❌ Erreur lors de la sauvegarde de la progression:', error);
     }
   };

     // Fonction pour charger la progression sauvegardée
   const loadSavedProgress = async () => {
     if (!formationId) return;
     
     const currentUserId = getCurrentUserId();
     try {
       const allProgress = progressService.getProgress(formationId, currentUserId, []);
       console.log('📊 loadSavedProgress - Toutes les progressions:', allProgress);
       
       const savedProgress = allProgress[lesson.id];
       console.log('📊 loadSavedProgress - Progression récupérée pour la leçon:', savedProgress, 'hasShownResumeModal:', hasShownResumeModal, 'mimeType:', mimeType, 'videoDuration:', videoRef.current?.duration);
       console.log('📊 loadSavedProgress - LessonId:', lesson.id, 'FormationId:', formationId, 'UserId:', currentUserId);
       
       if (savedProgress && savedProgress.progress > 0 && !hasShownResumeModal) {
         console.log('📊 loadSavedProgress - Condition satisfied: savedProgress.progress > 0 && !hasShownResumeModal');
         if ((mimeType.startsWith("video/") || mimeType.startsWith("audio/")) && savedProgress.progress > 5) {
          const savedTime = savedProgress.timeSpent || 0;
          const totallTime = videoRef.current?.duration || 0;
          let curTime = 0;
          if (totallTime > 0) {
            // If we know the real duration, compute time from progress percentage
            curTime = savedProgress.progress * totallTime / 100;
            console.log('📊 loadSavedProgress - computed curTime from progress% and duration:', curTime);
          } else {
            // Otherwise use savedTime as the best estimate
            curTime = savedTime;
            console.log('📊 loadSavedProgress - using savedTime as curTime fallback:', curTime);
          }
          const estimatedTotalTime = totallTime > 0 ? totallTime : (savedProgress.progress > 0 ? (savedTime / savedProgress.progress) * 100 : 0);
          // Set modal-specific data
          setResumeModalData({
            currentTime: curTime,
            totalTime: estimatedTotalTime,
            progressPercentage: savedProgress.progress
          });
          
          console.log('📊 loadSavedProgress - About to show resume modal with data:', { currentTime: curTime, totalTime: estimatedTotalTime, progress: savedProgress.progress });
          setShowResumeModal(true);
          setHasShownResumeModal(true);
          
          console.log(`🎬 Modal préparée - Temps sauvegardé: ${savedTime}s, Progression: ${savedProgress.progress}%, Durée estimée: ${estimatedTotalTime}s`);
        } else {
          console.log('📊 loadSavedProgress - Progress <=5 or not media, loading directly');
          loadProgressDirectly(savedProgress);
        }
      }else {
         console.log('📊 Aucune progression trouvée ou modal déjà affichée, utilisation des valeurs par défaut');
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
   };

   // Fonction pour charger la progression directement (sans modal)
   const loadProgressDirectly = (savedProgress: any) => {
           if (mimeType === "application/pdf") {
             // Pour les PDFs : restaurer la page exacte
             const lastPage = savedProgress.currentPage || 1;
             setCurrentPage(lastPage);
       console.log(`📊 Repositionnement PDF: page ${lastPage}`);
           } else if (mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
             // Pour les présentations : restaurer la diapositive exacte
             const lastSlide = savedProgress.currentSlide || 0;
             setCurrentSlide(lastSlide);
       console.log(`📊 Repositionnement présentation: diapositive ${lastSlide}`);
     } else if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) {
       // Pour les vidéos/audios : restaurer le temps exact
       const lastTime = savedProgress.timeSpent || 0;
       
       console.log(`🎬 loadProgressDirectly - Progression trouvée: timeSpent=${lastTime}s, progress=${savedProgress.progress}%`);
       console.log(`🎬 loadProgressDirectly - Temps formaté: ${Math.floor(lastTime / 60)}:${(lastTime % 60).toFixed(0).padStart(2, '0')}`);
       
       setCurrentTime(lastTime);
       
       // Calculer la durée totale estimée
       const estimatedTotalTime = savedProgress.progress > 0 ? (lastTime / savedProgress.progress) * 100 : 0;
       setTotalTime(estimatedTotalTime);
       
       console.log(`🎬 États mis à jour - currentTime: ${lastTime}, totalTime: ${estimatedTotalTime}`);
     }
           
           // Mettre à jour l'interface parent avec la progression chargée
           if (onProgressUpdate) {
             const progressPercentage = savedProgress.progress || 0;
             const timeSpent = savedProgress.timeSpent || 0;
             onProgressUpdate({
               timeSpent: timeSpent, // Utiliser le temps réel en secondes
               progress: progressPercentage,
               completed: progressPercentage >= 100
             });
           }
           
           console.log(`📊 Interface mise à jour avec la progression: ${savedProgress.progress}%`);
   };

   // Fonctions pour gérer la modal de reprise
   const handleResumePlayback = () => {
     // Utiliser la valeur fournie par la modal si disponible, sinon fallback sur l'état
     const timeToResume = resumeModalData?.currentTime ?? currentTime;
     const estimatedTotal = resumeModalData?.totalTime ?? totalTime;

     console.log(`🎬 handleResumePlayback - Reprise demandée à ${timeToResume}s (est. total: ${estimatedTotal}s)`);

     // Fermer la modal
     setShowResumeModal(false);
     setHasShownResumeModal(true);

     // Mettre à jour l'état
     setCurrentTime(timeToResume);
     if (estimatedTotal > 0) setTotalTime(estimatedTotal);

     // Positionner et lancer la lecture
     if (mimeType.startsWith("video/") && videoRef.current) {
       try {
         videoRef.current.currentTime = timeToResume;
         const playPromise = videoRef.current.play();
         if (playPromise !== undefined) {
           playPromise.catch((error) => console.warn('⚠️ Lecture bloquée par le navigateur:', error));
         }
         console.log(`🎬 Vidéo positionnée à ${timeToResume}s et tentative de lecture`);
       } catch (e) {
         console.warn('⚠️ Erreur lors du positionnement/lecture de la vidéo:', e);
       }
     } else if (mimeType.startsWith("audio/") && audioRef.current) {
       try {
         audioRef.current.currentTime = timeToResume;
         const playPromise = audioRef.current.play();
         if (playPromise !== undefined) {
           playPromise.catch((error) => console.warn('⚠️ Lecture audio bloquée par le navigateur:', error));
         }
         console.log(`🎬 Audio positionné à ${timeToResume}s et tentative de lecture`);
       } catch (e) {
         console.warn('⚠️ Erreur lors du positionnement/lecture de l\'audio:', e);
       }
     }
   };

   const handleRestartPlayback = () => {
     // console.log('🎬 Redémarrage depuis le début');
     setShowResumeModal(false);
     setCurrentTime(0);
     setHasShownResumeModal(true);
         
     // Remettre la vidéo/audio au début et relancer la lecture
     if (mimeType.startsWith("video/") && videoRef.current) {
       try {
         videoRef.current.currentTime = 0;
         const playPromise = videoRef.current.play();
         if (playPromise !== undefined) {
           playPromise.catch((error) => console.warn('⚠️ Lecture bloquée par le navigateur:', error));
         }
         console.log(`🎬 Vidéo remise au début et lecture lancée`);
       } catch (e) {
         console.warn('⚠️ Erreur lors du redémarrage de la vidéo:', e);
       }
     } else if (mimeType.startsWith("audio/") && audioRef.current) {
       try {
         audioRef.current.currentTime = 0;
         const playPromise = audioRef.current.play();
         if (playPromise !== undefined) {
           playPromise.catch((error) => console.warn('⚠️ Lecture audio bloquée par le navigateur:', error));
         }
         console.log(`🎬 Audio remis au début et lecture lancée`);
       } catch (e) {
         console.warn('⚠️ Erreur lors du redémarrage de l\'audio:', e);
       }
     }
   };

   const handleCloseResumeModal = () => {
     // console.log('🎬 Modal fermée sans action');
     setShowResumeModal(false);
   };



  // Nettoyer l'intervalle quand le composant se démonte
  useEffect(() => {
    return () => {
      // console.log('🧹 TestViewer - Nettoyage du composant');
      stopProgressTracking();
      
      // Nettoyer les timeouts
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Nettoyer les URLs blob
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, []); // Dépendances vides pour ne s'exécuter qu'au démontage

  // Nettoyer l'URL blob quand le composant se démonte

  return (
    <div className="min-h-screen bg-gray-50 lesson-player-protected">
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
          ) : blobUrl ? (
            <div>
          
                             {/* Vidéos */}
               {mimeType.startsWith("video/") && (
                 <div className="w-full h-[calc(100vh-120px)] border rounded bg-white">
                   <div className="relative group">
                     <video
                       ref={videoRef}
                       src={blobUrl}
                       className="w-full h-full object-contain bg-black select-none cursor-pointer video-protected"
                       style={{
                         userSelect: 'none',
                         WebkitUserSelect: 'none',
                         MozUserSelect: 'none',
                         msUserSelect: 'none',
                         pointerEvents: 'auto',
                         outline: 'none',
                         border: 'none'
                       }}
                       preload="metadata"
                       crossOrigin="anonymous"
                       disablePictureInPicture
                       controlsList="nodownload nofullscreen noremoteplayback"
                       onContextMenu={(e) => e.preventDefault()}
                       onDragStart={(e) => e.preventDefault()}
                       onDrop={(e) => e.preventDefault()}
                       onClick={handleVideoClick}
                       onMouseMove={handleVideoMouseMove}
                       onMouseLeave={handleVideoMouseLeave}
                       onLoadedMetadata={() => {
                        //  console.log('🎬 onLoadedMetadata - Événement déclenché');
                         if (videoRef.current) {
                           const duration = videoRef.current.duration;
                          //  console.log(`🎬 onLoadedMetadata - Durée vidéo: ${duration}s (${Math.floor(duration / 60)}:${(duration % 60).toFixed(0).padStart(2, '0')})`);
                          //  console.log(`🎬 onLoadedMetadata - isNaN(duration): ${isNaN(duration)}, readyState: ${videoRef.current.readyState}`);
                          //  console.log(`🎬 onLoadedMetadata - URL vidéo: ${blobUrl}`);
                           
                           // Définir la vitesse de lecture par défaut à 0.85
                           videoRef.current.playbackRate = 0.5;
                           
                           if (!isNaN(duration) && duration > 0 && duration !== Infinity) {
                             console.log(`✅ Durée valide détectée depuis onLoadedMetadata, mise à jour de totalTime: ${duration}s`);
                             setTotalTime(duration);
                             
                             // Charger la progression sauvegardée APRÈS que la vidéo soit prête
                             if (formationId && userId) {
                               loadSavedProgress();
                               
                               // Positionner la vidéo au temps sauvegardé
                               if (currentTime > 0 && videoRef.current) {
                                 console.log(`🎬 Positionnement vidéo à ${currentTime}s`);
                                 videoRef.current.currentTime = currentTime;
                               }
                             }
                             
                             // Démarrer le suivi de progression maintenant que tout est prêt
                             setTimeout(() => {
                               startProgressTracking();
                             }, 100);
                           } else {
                             console.warn(`⚠️ Durée vidéo invalide dans onLoadedMetadata: ${duration}`);
                             console.warn(`⚠️ Tentative de récupération via d'autres événements...`);
                           }
                         }
                       }}
                       onLoadedData={() => {
                         // Fallback si onLoadedMetadata ne se déclenche pas
                         if (videoRef.current && totalTime <= 0) {
                           const duration = videoRef.current.duration;
                           if (!isNaN(duration) && duration > 0 && duration !== Infinity) {
                             console.log(`🎬 onLoadedData - Durée récupérée: ${duration}s`);
                             setTotalTime(duration);
                             if (formationId && userId && !isTrackingProgress) {
                               loadSavedProgress();
                               if (currentTime > 0 && videoRef.current) {
                                 videoRef.current.currentTime = currentTime;
                               }
                               startProgressTracking();
                             }
                           }
                         }
                       }}
                       onCanPlay={() => {
                         // Fallback supplémentaire
                         if (videoRef.current && totalTime <= 0) {
                           const duration = videoRef.current.duration;
                           if (!isNaN(duration) && duration > 0 && duration !== Infinity) {
                             console.log(`🎬 onCanPlay - Durée récupérée: ${duration}s`);
                             setTotalTime(duration);
                             if (formationId && userId && !isTrackingProgress) {
                               loadSavedProgress();
                               if (currentTime > 0 && videoRef.current) {
                                 videoRef.current.currentTime = currentTime;
                               }
                               startProgressTracking();
                             }
                           }
                         }
                       }}
                       onDurationChange={() => {
                         // Fallback final - se déclenche quand la durée change
                         if (videoRef.current && totalTime <= 0) {
                           const duration = videoRef.current.duration;
                           if (!isNaN(duration) && duration > 0 && duration !== Infinity) {
                             console.log(`🎬 onDurationChange - Durée récupérée: ${duration}s`);
                             setTotalTime(duration);
                             if (formationId && userId && !isTrackingProgress) {
                               loadSavedProgress();
                               if (currentTime > 0 && videoRef.current) {
                                 videoRef.current.currentTime = currentTime;
                               }
                               startProgressTracking();
                             }
                           }
                         }
                       }}
                       onTimeUpdate={() => {
                         if (videoRef.current) {
                           const newCurrentTime = videoRef.current.currentTime;
                           const duration = videoRef.current.duration;
                           
                           console.log(`🎬 onTimeUpdate - Nouveau temps: ${newCurrentTime}s (${Math.floor(newCurrentTime / 60)}:${(newCurrentTime % 60).toFixed(0).padStart(2, '0')})`);
                           console.log(`🎬 onTimeUpdate - Durée: ${duration}s, totalTime actuel: ${totalTime}s`);
                           
                           setCurrentTime(newCurrentTime);

                           if (
                             midVideoQuizzes &&
                             midVideoQuizzes.length > 0 &&
                             !activeMidVideoQuizConfig
                           ) {
                             const nextQuizIndex = midVideoQuizzes.findIndex((quizConfig, index) => {
                               const safeTriggerTime = Math.max(0, Number(quizConfig.triggerTimeSec || 0));
                               return !triggeredMidVideoQuizIndexes.has(index) && newCurrentTime >= safeTriggerTime;
                             });

                             if (nextQuizIndex !== -1) {
                               const quizToShow = midVideoQuizzes[nextQuizIndex];
                               if (quizToShow.questions && quizToShow.questions.length > 0) {
                                 videoRef.current.pause();
                                 setIsPlaying(false);
                                 setActiveMidVideoQuizConfig({
                                   questions: quizToShow.questions,
                                   questionTimeLimitSec: quizToShow.questionTimeLimitSec,
                                 });
                                 setTriggeredMidVideoQuizIndexes((prev) => {
                                   const updated = new Set(prev);
                                   updated.add(nextQuizIndex);
                                   return updated;
                                 });
                               }
                             }
                           }
                           
                           // Si totalTime n'est pas encore défini mais que la durée est disponible
                           if (totalTime <= 0 && duration > 0 && !isNaN(duration) && duration !== Infinity) {
                             console.log(`🎬 onTimeUpdate - Récupération de la durée depuis onTimeUpdate: ${duration}s`);
                             setTotalTime(duration);
                             
                             // Démarrer le suivi de progression maintenant que totalTime est disponible
                             if (!isTrackingProgress) {
                               console.log('🎬 onTimeUpdate - Démarrage du suivi de progression (récupération tardive)');
                               startProgressTracking();
                             }
                           }
                           
                           // Mettre à jour la progression directement depuis onTimeUpdate si la durée est disponible
                           // Cela garantit que la progression est mise à jour même si isTrackingProgress n'est pas encore true
                           if (duration > 0 && newCurrentTime >= 0 && !isNaN(duration) && !isNaN(newCurrentTime) && duration !== Infinity) {
                             // Mettre à jour totalTime si nécessaire
                             if (totalTime !== duration) {
                               setTotalTime(duration);
                             }
                             
                             // Appeler updateProgress directement pour mettre à jour la progression en temps réel
                             // Cela fonctionne même si isTrackingProgress est false
                             if (formationId && userId) {
                               const progress = Math.round((newCurrentTime / duration) * 100);
                               const currentProgress = progressService.getProgress(formationId, getCurrentUserId(), [])[lesson.id];
                               const savedProgressPercentage = currentProgress?.progress || 0;
                               const finalProgressPercentage = Math.max(progress, savedProgressPercentage);
                               
                              //  console.log(`🎬 onTimeUpdate - Mise à jour directe: ${newCurrentTime}s/${duration}s = ${finalProgressPercentage}%`);
                               
                               if (onProgressUpdate) {
                                 onProgressUpdate({
                                   timeSpent: newCurrentTime,
                                   progress: finalProgressPercentage,
                                   completed: finalProgressPercentage >= 100
                                 });
                               }
                               
                               // Démarrer le suivi si ce n'est pas déjà fait
                               if (!isTrackingProgress) {
                                 startProgressTracking();
                               }
                             }
                           }
                         } else {
                           console.error('🎬 videoRef.current est null dans onTimeUpdate');
                         }
                       }}
                       onEnded={() => {
                         setIsPlaying(false);
                         stopProgressTracking();
                         if (onProgressUpdate) {
                           onProgressUpdate({
                             timeSpent: 100,
                             progress: 100,
                             completed: true
                           });
                         }
                       }}
                       onPlay={() => {
                         setIsPlaying(true);
                         // S'assurer que la vitesse de lecture reste à 0.85
                         if (videoRef.current) {
                           videoRef.current.playbackRate = 0.85;
                         }
                       }}
                       onPause={() => setIsPlaying(false)}
                     />

                      {activeMidVideoQuizConfig?.questions && activeMidVideoQuizConfig.questions.length > 0 && (
                        <MidVideoQuizOverlay
                          questions={activeMidVideoQuizConfig.questions}
                          questionTimeLimitSec={activeMidVideoQuizConfig.questionTimeLimitSec}
                          currentTime={activeMidVideoQuizConfig.currentTime || currentTime}
                          onComplete={() => {
                            setActiveMidVideoQuizConfig(null);
                            if (videoRef.current) {
                              videoRef.current.playbackRate = 0.85;
                              videoRef.current.play().catch(() => {});
                            }
                          }}
                        />
                      )}
                     
                  
                      {/* Contrôles de navigation
                      {totalSlides > 1 && (
                        <div className="absolute bottom-4 right-4 z-20 bg-white/95 p-3 rounded-lg shadow-lg border">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                const newSlide = Math.max(0, currentSlide - 1);
                                setCurrentSlide(newSlide);
                                console.log(`📊 Navigation présentation: Diapositive ${newSlide + 1}/${totalSlides}`);
                                updateProgress();
                              }}
                              className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 transition-colors text-sm font-medium"
                              disabled={currentSlide <= 0}
                            >
                              ← Précédente
                            </button>
                            
                            <span className="text-sm font-medium text-gray-700 px-2">
                              {currentSlide + 1} / {totalSlides}
                            </span>
                            
                            <button
                              onClick={() => {
                                const newSlide = Math.min(totalSlides - 1, currentSlide + 1);
                                setCurrentSlide(newSlide);
                                console.log(`📊 Navigation présentation: Diapositive ${newSlide + 1}/${totalSlides}`);
                                updateProgress();
                              }}
                              className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 transition-colors text-sm font-medium"
                              disabled={currentSlide >= totalSlides - 1}
                            >
                              Suivante →
                            </button>
                          </div>
                        </div>
                      )}

                       */}
                    </div>
                 
                    {/* <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Presentation className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Erreur de chargement
                        </h3>
                        <p className="text-gray-600">
                          La video n'a pas pu être chargée
                        </p>
                      </div>
                    </div> */}
                  
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
      </div>
      
      {/* Footer minimal */}
      {/* <div className="bg-white border-t px-6 py-2 text-center text-xs text-gray-500">
        © 2026 BAI Consulting - Lecteur de contenu sécurisé
      </div> */}

      {/* Modal de reprise de lecture */}
      <ResumePlaybackModal
        isOpen={showResumeModal}
        onResume={handleResumePlayback}
        onRestart={handleRestartPlayback}
        onClose={handleCloseResumeModal}
        progressPercentage={resumeModalData?.progressPercentage || 0}
        currentTime={resumeModalData?.currentTime || 0}
        totalTime={resumeModalData?.totalTime ?? videoRef.current?.duration ?? 0}
        lessonTitle={lesson.title}
      />
    </div>
  );
}

export default TestViewer;