// TestViewer.tsx
import React, { useEffect, useState, useRef } from 'react';
import { FileText, Presentation } from 'lucide-react';
import { FormationContent } from '../types';
import { Document, Page } from 'react-pdf';
import { useProgress } from '../../../contexts/ProgressContext';
import ResumePlaybackModal from '../../../components/ResumePlaybackModal';
import progressService from '../../../services/progressService';

// Interface étendue pour la progression des leçons
interface ExtendedLessonProgress {
  lessonId: string;
  timeSpent: number;
  progress: number;
  completed: boolean;
  lastUpdated: string;
  currentPage?: number;
  totalPages?: number;
  currentSlide?: number;
  totalSlides?: number;
  currentTime?: number;
  totalTime?: number;
  lastAccessedAt?: string;
}

// Configuration du worker pour react-pdf et pdfjs-dist
import { pdfjs } from 'react-pdf';

// Configuration globale du worker - utiliser un worker local depuis public
if (typeof window !== 'undefined') {
  try {
    // Essayer d'abord le worker local
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    console.log('✅ Worker PDF configuré avec worker local');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du worker PDF local:', error);
    try {
      // Fallback vers le CDN
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      console.log('✅ Worker PDF configuré avec CDN');
    } catch (cdnError) {
      console.error('❌ Erreur lors de la configuration du worker PDF CDN:', cdnError);
    }
  }
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
  // Utiliser le service de progression directement
  const getCurrentUserId = () => {
    if (userId) {
      console.log('🔍 getCurrentUserId - Utilisation du userId passé en prop:', userId);
      return userId;
    }
    const serviceUserId = progressService.getCurrentUserId();
    console.log('🔍 getCurrentUserId - Utilisation du service:', serviceUserId);
    return serviceUserId;
  };
  
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Vérifier l'état du worker PDF au montage du composant
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        console.warn('⚠️ Worker PDF non configuré, tentative de configuration...');
        try {
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          console.log('✅ Worker PDF configuré avec worker local');
        } catch (error) {
          console.error('❌ Erreur worker local, tentative CDN:', error);
          try {
            pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
            console.log('✅ Worker PDF configuré avec CDN');
          } catch (cdnError) {
            console.error('❌ Erreur lors de la configuration du worker PDF:', cdnError);
          }
        }
      }
      console.log('🔍 État du worker PDF:', pdfjs.GlobalWorkerOptions.workerSrc);
    }
  }, []);
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presentationContainerRef = useRef<HTMLDivElement | null>(null);

  // Effet pour bloquer les raccourcis clavier et captures d'écran
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquer les raccourcis de capture et développement
      if (
        (e.ctrlKey && e.key === 's') || // Ctrl+S (sauvegarder)
        (e.ctrlKey && e.shiftKey && e.key === 'S') || // Ctrl+Shift+S
        (e.ctrlKey && e.key === 'u') || // Ctrl+U (code source)
        (e.ctrlKey && e.key === 'i') || // Ctrl+I (inspecteur)
        (e.ctrlKey && e.key === 'j') || // Ctrl+J (console)
        (e.ctrlKey && e.key === 'k') || // Ctrl+K (recherche)
        (e.ctrlKey && e.key === 'h') || // Ctrl+H (historique)
        (e.ctrlKey && e.key === 'r') || // Ctrl+R (actualiser)
        (e.ctrlKey && e.key === 'f') || // Ctrl+F (recherche)
        (e.ctrlKey && e.key === 'g') || // Ctrl+G (suivant)
        (e.ctrlKey && e.key === 'a') || // Ctrl+A (tout sélectionner)
        (e.ctrlKey && e.key === 'c') || // Ctrl+C (copier)
        (e.ctrlKey && e.key === 'v') || // Ctrl+V (coller)
        (e.ctrlKey && e.key === 'x') || // Ctrl+X (couper)
        (e.ctrlKey && e.key === 'z') || // Ctrl+Z (annuler)
        (e.ctrlKey && e.key === 'y') || // Ctrl+Y (refaire)
        (e.ctrlKey && e.key === 'p') || // Ctrl+P (imprimer)
        (e.ctrlKey && e.key === 'n') || // Ctrl+N (nouvelle fenêtre)
        (e.ctrlKey && e.key === 't') || // Ctrl+T (nouvel onglet)
        (e.ctrlKey && e.key === 'w') || // Ctrl+W (fermer onglet)
        (e.ctrlKey && e.key === 'd') || // Ctrl+D (marque-page)
        (e.ctrlKey && e.key === 'l') || // Ctrl+L (barre d'adresse)
        (e.ctrlKey && e.key === 'o') || // Ctrl+O (ouvrir fichier)
        (e.ctrlKey && e.key === 'e') || // Ctrl+E (recherche)
        (e.ctrlKey && e.key === 'b') || // Ctrl+B (barre de favoris)
        (e.ctrlKey && e.key === 'm') || // Ctrl+M (minimiser)
        (e.ctrlKey && e.key === 'q') || // Ctrl+Q (quitter)
        (e.ctrlKey && e.key === 'w') || // Ctrl+W (fermer)
        (e.ctrlKey && e.key === 'n') || // Ctrl+N (nouveau)
        (e.ctrlKey && e.key === 't') || // Ctrl+T (nouvel onglet)
        (e.ctrlKey && e.key === 'tab') || // Ctrl+Tab (changer d'onglet)
        (e.ctrlKey && e.key === 'shift') || // Ctrl+Shift
        (e.ctrlKey && e.key === 'alt') || // Ctrl+Alt
        (e.altKey && e.key === 'F4') || // Alt+F4 (fermer)
        (e.altKey && e.key === 'Tab') || // Alt+Tab (changer d'app)
        (e.altKey && e.key === 'F11') || // Alt+F11 (plein écran)
        (e.shiftKey && e.key === 'F10') || // Shift+F10 (menu contextuel)
        (e.shiftKey && e.key === 'F12') || // Shift+F12 (outils dev)
        e.key === 'PrintScreen' || // Impr écran
        e.key === 'F12' || // F12 (outils de développement)
        e.key === 'F11' || // F11 (plein écran)
        e.key === 'F10' || // F10 (menu)
        e.key === 'F9' || // F9
        e.key === 'F8' || // F8
        e.key === 'F7' || // F7
        e.key === 'F6' || // F6
        e.key === 'F5' || // F5 (actualiser)
        e.key === 'F4' || // F4
        e.key === 'F3' || // F3 (recherche)
        e.key === 'F2' || // F2
        e.key === 'F1' || // F1 (aide)
        e.key === 'Insert' || // Insert
        e.key === 'Delete' || // Delete
        e.key === 'Home' || // Home
        e.key === 'End' || // End
        e.key === 'PageUp' || // Page Up
        e.key === 'PageDown' || // Page Down
        e.key === 'ArrowUp' || // Flèche haut
        e.key === 'ArrowDown' || // Flèche bas
        e.key === 'ArrowLeft' || // Flèche gauche
        e.key === 'ArrowRight' || // Flèche droite
        e.key === 'Escape' || // Échap
        e.key === 'Tab' || // Tab
        e.key === 'Enter' || // Entrée
        e.key === 'Space' || // Espace
        e.key === 'Backspace' || // Retour arrière
        e.key === 'Meta' || // Cmd (Mac)
        e.key === 'ContextMenu' // Menu contextuel
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
    setPresentationSlides([]);
    setCurrentSlide(0);
    setTotalSlides(0);
    setIsPresentationLoading(false);
    
    console.log('✅ TestViewer - État réinitialisé pour nouvelle leçon');
  }, [lesson.id]); // Seulement quand lesson.id change

     // Fonction pour réinitialiser le worker PDF
   const resetPdfWorker = () => {
     if (typeof window !== 'undefined') {
       try {
         // Essayer d'abord le worker local
         pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
         console.log('🔄 Worker PDF réinitialisé avec worker local');
         setPdfError(false);
         setRetryCount(0);
       } catch (error) {
         console.error('❌ Erreur worker local, tentative CDN:', error);
         try {
           // Fallback vers le CDN
           pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
           console.log('🔄 Worker PDF réinitialisé avec CDN');
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
     console.log('🔍 Vérification de la progression...');
      console.log('🔍 Lesson ID:', lesson.id);
      console.log('🔍 Formation ID:', formationId);
     console.log('🔍 User ID:', currentUserId);
     
     try {
       const savedProgress = progressService.getProgress(formationId, currentUserId, [])[lesson.id];
       console.log('🔍 Progression trouvée:', savedProgress);
       
       if (savedProgress && savedProgress.progress > 0) {
         console.log('📊 Progression trouvée:', {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          progress: savedProgress.progress + '%',
          completed: savedProgress.completed ? 'Oui' : 'Non',
           lastUpdated: savedProgress.lastUpdated
        });
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
         
         // Pour les présentations PowerPoint
         if (detectedMimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
           console.log('✅ Présentation PowerPoint détectée - chargement avec pptx-preview');
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
  }, [fileUrl, lesson.id]); // Ajouter lesson.id comme dépendance

  // Effet pour charger la progression sauvegardée quand le PDF est chargé
  // SUPPRIMÉ - Le chargement se fait maintenant dans onLoadSuccess du Document

     // Effet pour sauvegarder automatiquement la progression quand la page change (PDF) ou le temps change (vidéo/audio)
   useEffect(() => {
     if (mimeType === "application/pdf" && pageCount && pageCount > 0 && currentPage > 0) {
       console.log(`📊 Sauvegarde automatique PDF: page ${currentPage}/${pageCount}`);
       // Utiliser updateProgress pour bénéficier de la logique non-régressive
       updateProgress();
     } else if ((mimeType.startsWith("video/") || mimeType.startsWith("audio/")) && totalTime > 0 && currentTime >= 0) {
       console.log(`🎬 useEffect sauvegarde - Déclenchement automatique`);
       console.log(`🎬 useEffect sauvegarde - Temps: ${Math.floor(currentTime / 60)}:${(currentTime % 60).toFixed(0).padStart(2, '0')}/${Math.floor(totalTime / 60)}:${(totalTime % 60).toFixed(0).padStart(2, '0')}`);
       console.log(`🎬 useEffect sauvegarde - Progression: ${Math.round((currentTime / totalTime) * 100)}%`);
       console.log(`🎬 useEffect sauvegarde - Conditions: mimeType=${mimeType}, totalTime=${totalTime}, currentTime=${currentTime}, isTrackingProgress=${isTrackingProgress}`);
       
       // Vérifier si on doit sauvegarder
       if (isTrackingProgress) {
         console.log(`🎬 useEffect sauvegarde - Sauvegarde autorisée, appel de updateProgress`);
         // Utiliser updateProgress pour bénéficier de la logique non-régressive
         updateProgress();
       } else {
         console.log(`🎬 useEffect sauvegarde - Sauvegarde bloquée, isTrackingProgress=false`);
       }
     }
   }, [currentPage, pageCount, mimeType, currentTime, totalTime]);

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
     console.log(`🎬 startProgressTracking appelée - mimeType: ${mimeType}, totalTime: ${totalTime}, isTrackingProgress: ${isTrackingProgress}`);
     
     // Ne pas utiliser d'intervalle pour les PDFs, la progression sera gérée par les événements de page
     if (mimeType === "application/pdf") {
       console.log('📊 Suivi de progression PDF activé (événements de page)');
       setIsTrackingProgress(true);
       return;
     }
     
     // Pour les vidéos et audios, vérifier que les données sont disponibles
     if ((mimeType.startsWith("video/") || mimeType.startsWith("audio/")) && totalTime <= 0) {
       console.log('🎬 startProgressTracking - Suivi différé - totalTime non disponible');
       console.log(`🎬 startProgressTracking - État actuel: totalTime=${totalTime}, currentTime=${currentTime}, mimeType=${mimeType}`);
       return;
     }
     
     if (isTrackingProgress) {
       console.log('🎬 startProgressTracking - Suivi déjà actif, ignoré');
       return;
     }
     
     setIsTrackingProgress(true);
     console.log('🎬 Suivi de progression média activé (intervalle 2s)');
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
      console.log('📊 Chargement de la présentation PowerPoint...');
      
      // Pour l'instant, nous simulons une présentation avec des informations de base
      // Dans une version future, nous pourrions intégrer une vraie bibliothèque de lecture
      const mockSlides = [
        { id: '1', title: 'Diapositive 1', content: 'Contenu de la première diapositive' },
        { id: '2', title: 'Diapositive 2', content: 'Contenu de la deuxième diapositive' },
        { id: '3', title: 'Diapositive 3', content: 'Contenu de la troisième diapositive' }
      ];
      
      console.log('✅ Présentation simulée chargée:', mockSlides);
      setPresentationSlides(mockSlides);
      setTotalSlides(mockSlides.length);
      setCurrentSlide(0);
      
      // Charger la progression sauvegardée
      if (formationId && userId) {
        console.log('📊 Chargement de la progression présentation après chargement...');
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
         console.log(`📊 updateProgress - Présentation: ${currentSlide}/${totalSlides} = ${progressPercentage}%`);
         
         // Récupérer la progression actuelle pour éviter la régression
       const currentProgress = progressService.getProgress(formationId, currentUserId, [])[lesson.id];
         const savedProgressPercentage = currentProgress?.progress || 0;
         
         // Ne pas diminuer la progression si on recule
         const finalProgressPercentage = Math.max(progressPercentage, savedProgressPercentage);
         
         console.log(`📊 Progression présentation: actuelle=${progressPercentage}%, sauvegardée=${savedProgressPercentage}%, finale=${finalProgressPercentage}%`);
         
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
         const currentTime = video.currentTime;
         const duration = video.duration;
         
         console.log(`🎬 updateProgress vidéo - currentTime: ${currentTime}s, duration: ${duration}s, isNaN: ${isNaN(currentTime)}/${isNaN(duration)}`);
         
         if (duration > 0 && currentTime >= 0 && !isNaN(currentTime) && !isNaN(duration)) {
           const progress = Math.round((currentTime / duration) * 100);
           setCurrentTime(currentTime);
           setTotalTime(duration);
           
           console.log(`🎬 updateProgress vidéo - Progression calculée: ${currentTime}s/${duration}s = ${progress}%`);
           
           // Récupérer la progression actuelle pour éviter la régression
         const currentProgress = progressService.getProgress(formationId, currentUserId, [])[lesson.id];
           const savedProgressPercentage = currentProgress?.progress || 0;
           
           // Ne pas diminuer la progression si on recule
           const finalProgressPercentage = Math.max(progress, savedProgressPercentage);
           
           console.log(`🎬 Progression vidéo: actuelle=${progress}%, sauvegardée=${savedProgressPercentage}%, finale=${finalProgressPercentage}%`);
           console.log(`🎬 Temps formaté: ${Math.floor(currentTime / 60)}:${(currentTime % 60).toFixed(0).padStart(2, '0')}/${Math.floor(duration / 60)}:${(duration % 60).toFixed(0).padStart(2, '0')}`);
           
           if (onProgressUpdate) {
             onProgressUpdate({
               timeSpent: currentTime, // Utiliser le temps réel en secondes
               progress: finalProgressPercentage,
               completed: finalProgressPercentage >= 100
             });
             console.log(`🎬 Interface parent mise à jour avec: ${finalProgressPercentage}% (temps: ${currentTime}s)`);
           }
           
         // Sauvegarder la progression seulement si on a des données valides
           if (currentTime > 0 && duration > 0) {
             console.log(`🎬 Sauvegarde de la progression vidéo...`);
             console.log(`🎬 États avant sauvegarde - currentTime: ${currentTime}, totalTime: ${totalTime}`);
             console.log(`🎬 États React - currentTime state: ${currentTime}, totalTime state: ${totalTime}`);
             // Pour les vidéos, saveLocalProgress utilise les états currentTime et totalTime
             saveLocalProgress();
           } else {
             console.log(`🎬 Données invalides - currentTime: ${currentTime}, duration: ${duration}`);
           }
         } else {
           console.log(`🎬 Conditions non remplies - duration: ${duration}, currentTime: ${currentTime}, isNaN: ${isNaN(currentTime)}/${isNaN(duration)}`);
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
           // Pour les vidéos et audios - vérifier que les temps sont disponibles
           console.log(`🎬 saveLocalProgress - totalTime: ${totalTime}, currentTime: ${currentTime}, isNaN: ${isNaN(totalTime)}/${isNaN(currentTime)}`);
           
           if (totalTime > 0 && currentTime >= 0 && !isNaN(totalTime) && !isNaN(currentTime)) {
             finalProgress = Math.round((currentTime / totalTime) * 100);
           timeSpent = currentTime; // Utiliser le temps réel en secondes
             console.log(`🎬 saveLocalProgress - Progression calculée: ${currentTime}s/${totalTime}s = ${finalProgress}%`);
           } else {
             console.log('🎬 Temps non disponibles ou invalides, sauvegarde différée');
             console.log(`🎬 Détails - totalTime: ${totalTime}, currentTime: ${currentTime}, conditions: totalTime>0=${totalTime > 0}, currentTime>=0=${currentTime >= 0}`);
             return; // Ne pas sauvegarder si les temps ne sont pas encore disponibles
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
       console.log('📊 loadSavedProgress - Progression récupérée pour la leçon:', savedProgress);
       console.log('📊 loadSavedProgress - LessonId:', lesson.id);
       console.log('📊 loadSavedProgress - FormationId:', formationId);
       console.log('📊 loadSavedProgress - UserId:', currentUserId);
       
       if (savedProgress && savedProgress.progress > 0 && !hasShownResumeModal) {
           console.log('📊 Progression chargée:', savedProgress);
           
         // Afficher la modal de reprise pour les vidéos/audios avec progression significative
         if ((mimeType.startsWith("video/") || mimeType.startsWith("audio/")) && savedProgress.progress > 5) {
           console.log('🎬 Affichage de la modal de reprise - Progression:', savedProgress.progress + '%');
           setShowResumeModal(true);
           setHasShownResumeModal(true);
           
           // Préparer les données pour la modal
           // Pour les vidéos, timeSpent contient le temps en secondes où l'utilisateur s'est arrêté
           const savedTime = savedProgress.timeSpent || 0;
           console.log(`🎬 Modal - savedProgress.timeSpent: ${savedProgress.timeSpent}`);
           console.log(`🎬 Modal - savedTime calculé: ${savedTime}`);
           console.log(`🎬 Modal - savedProgress.progress: ${savedProgress.progress}`);
           
           setCurrentTime(savedTime);
           
           // Calculer la durée totale estimée basée sur la progression
           const estimatedTotalTime = savedProgress.progress > 0 ? (savedTime / savedProgress.progress) * 100 : 0;
           setTotalTime(estimatedTotalTime);
           
           console.log(`🎬 Modal préparée - Temps sauvegardé: ${savedTime}s, Progression: ${savedProgress.progress}%, Durée estimée: ${estimatedTotalTime}s`);
           console.log(`🎬 Modal - currentTime state: ${savedTime}, totalTime state: ${estimatedTotalTime}`);
         } else {
           // Pour les autres types ou progression faible, charger directement
           loadProgressDirectly(savedProgress);
         }
         } else {
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
     console.log('🎬 Reprise de la lecture à', currentTime);
     setShowResumeModal(false);
     
     // Positionner la vidéo/audio au temps sauvegardé
     if (mimeType.startsWith("video/") && videoRef.current) {
       videoRef.current.currentTime = currentTime;
       console.log(`🎬 Vidéo positionnée à ${currentTime}s`);
     } else if (mimeType.startsWith("audio/") && audioRef.current) {
       audioRef.current.currentTime = currentTime;
       console.log(`🎬 Audio positionné à ${currentTime}s`);
     }
   };

   const handleRestartPlayback = () => {
     console.log('🎬 Redémarrage depuis le début');
     setShowResumeModal(false);
         setCurrentTime(0);
         
     // Remettre la vidéo/audio au début
     if (mimeType.startsWith("video/") && videoRef.current) {
       videoRef.current.currentTime = 0;
       console.log(`🎬 Vidéo remise au début`);
     } else if (mimeType.startsWith("audio/") && audioRef.current) {
       audioRef.current.currentTime = 0;
       console.log(`🎬 Audio remis au début`);
     }
   };

   const handleCloseResumeModal = () => {
     console.log('🎬 Modal fermée sans action');
     setShowResumeModal(false);
   };



  // Nettoyer l'intervalle quand le composant se démonte
  useEffect(() => {
    return () => {
      console.log('🧹 TestViewer - Nettoyage du composant');
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
                     {/* Message d'erreur PDF */}
                     {pdfError && retryCount >= 3 && (
                       <div className="absolute inset-0 bg-white/95 flex items-center justify-center z-30">
                         <div className="text-center p-6">
                           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                             <FileText className="h-8 w-8 text-red-600" />
                           </div>
                           <h3 className="text-lg font-semibold text-gray-800 mb-2">
                             Erreur de chargement PDF
                           </h3>
                           <p className="text-gray-600 mb-4">
                             Le PDF n'a pas pu être chargé après plusieurs tentatives.
                           </p>
                           <button
                             onClick={() => {
                               setPdfError(false);
                               setRetryCount(0);
                               resetPdfWorker();
                             }}
                             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                           >
                             Réessayer
                           </button>
                         </div>
                       </div>
                     )}
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
                             setPdfError(true);
                             
                             // Vérifier l'état du worker
                             if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions.workerSrc) {
                               console.log('🔍 Worker PDF configuré:', pdfjs.GlobalWorkerOptions.workerSrc);
                             } else {
                               console.error('❌ Worker PDF non configuré');
                               resetPdfWorker();
                             }
                             
                             // Réessayer automatiquement jusqu'à 3 fois
                             if (retryCount < 3) {
                               console.log(`🔄 Tentative de récupération ${retryCount + 1}/3...`);
                               setRetryCount(prev => prev + 1);
                               setTimeout(() => {
                                 resetPdfWorker();
                               }, 1000);
                             } else {
                               console.error('❌ Échec après 3 tentatives de récupération');
                             }
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
                               setPdfError(true);
                               
                               // Réessayer automatiquement jusqu'à 3 fois
                               if (retryCount < 3) {
                                 console.log(`🔄 Tentative de récupération page ${retryCount + 1}/3...`);
                                 setRetryCount(prev => prev + 1);
                                 setTimeout(() => {
                                   resetPdfWorker();
                                 }, 1000);
                               } else {
                                 console.error('❌ Échec après 3 tentatives de récupération de page');
                               }
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
                       disablePictureInPicture
                       controlsList="nodownload nofullscreen noremoteplayback"
                       onContextMenu={(e) => e.preventDefault()}
                       onDragStart={(e) => e.preventDefault()}
                       onDrop={(e) => e.preventDefault()}
                       onClick={handleVideoClick}
                       onMouseMove={handleVideoMouseMove}
                       onMouseLeave={handleVideoMouseLeave}
                       onLoadedMetadata={() => {
                         console.log('🎬 onLoadedMetadata - Événement déclenché');
                         if (videoRef.current) {
                           const duration = videoRef.current.duration;
                           console.log(`🎬 onLoadedMetadata - Durée vidéo: ${duration}s (${Math.floor(duration / 60)}:${(duration % 60).toFixed(0).padStart(2, '0')})`);
                           console.log(`🎬 onLoadedMetadata - isNaN(duration): ${isNaN(duration)}`);
                           console.log(`🎬 onLoadedMetadata - videoRef.current.duration: ${videoRef.current.duration}`);
                           console.log(`🎬 onLoadedMetadata - videoRef.current.readyState: ${videoRef.current.readyState}`);
                           
                                                        if (!isNaN(duration) && duration > 0) {
                               console.log(`🎬 Durée valide détectée, mise à jour de totalTime`);
                               setTotalTime(duration);
                               console.log(`🎬 État totalTime mis à jour: ${duration}s`);
                             
                             // Charger la progression sauvegardée APRÈS que la vidéo soit prête
                             if (formationId && userId) {
                               console.log('🎬 Chargement de la progression vidéo après chargement...');
                               loadSavedProgress();
                               
                               // Positionner la vidéo au temps sauvegardé
                               if (currentTime > 0 && videoRef.current) {
                                 console.log(`🎬 Positionnement vidéo à ${currentTime}s (${Math.floor(currentTime / 60)}:${(currentTime % 60).toFixed(0).padStart(2, '0')})`);
                                 videoRef.current.currentTime = currentTime;
                                 console.log(`🎬 Vidéo positionnée avec succès`);
                               } else {
                                 console.log(`🎬 Pas de positionnement - currentTime: ${currentTime}`);
                               }
                             }
                             
                             // Démarrer le suivi de progression maintenant que tout est prêt
                             setTimeout(() => {
                               console.log('🎬 Démarrage du suivi de progression vidéo...');
                               startProgressTracking();
                             }, 100);
                           } else {
                             console.error(`🎬 Durée vidéo invalide: ${duration}`);
                           }
                         } else {
                           console.error('🎬 videoRef.current est null dans onLoadedMetadata');
                         }
                       }}
                       onTimeUpdate={() => {
                         if (videoRef.current) {
                           const newCurrentTime = videoRef.current.currentTime;
                           const duration = videoRef.current.duration;
                           
                           console.log(`🎬 onTimeUpdate - Nouveau temps: ${newCurrentTime}s (${Math.floor(newCurrentTime / 60)}:${(newCurrentTime % 60).toFixed(0).padStart(2, '0')})`);
                           console.log(`🎬 onTimeUpdate - Durée: ${duration}s, totalTime actuel: ${totalTime}s`);
                           
                           setCurrentTime(newCurrentTime);
                           
                           // Si totalTime n'est pas encore défini mais que la durée est disponible
                           if (totalTime <= 0 && duration > 0 && !isNaN(duration)) {
                             console.log(`🎬 onTimeUpdate - Récupération de la durée depuis onTimeUpdate: ${duration}s`);
                             setTotalTime(duration);
                             
                             // Démarrer le suivi de progression maintenant que totalTime est disponible
                             if (!isTrackingProgress) {
                               console.log('🎬 onTimeUpdate - Démarrage du suivi de progression (récupération tardive)');
                               startProgressTracking();
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
                       onPlay={() => setIsPlaying(true)}
                       onPause={() => setIsPlaying(false)}
                     />
                     
                     {/* Contrôles personnalisés */}
                     <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${
                       showControls ? 'opacity-100' : 'opacity-0'
                     }`}>
                       <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center space-x-4">
                         {/* Bouton Play/Pause */}
                         <button
                           onClick={togglePlayPause}
                           className="text-white hover:text-blue-400 transition-colors"
                           aria-label={isPlaying ? 'Pause' : 'Lecture'}
                         >
                           {isPlaying ? (
                             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                               <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                             </svg>
                           ) : (
                             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                               <path d="M8 5v14l11-7z"/>
                             </svg>
                           )}
                         </button>
                         
                         {/* Temps actuel */}
                         <span className="text-white text-sm font-mono">
                           {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
                         </span>
                         
                         {/* Séparateur */}
                         <span className="text-white/50">/</span>
                         
                         {/* Temps total */}
                         <span className="text-white text-sm font-mono">
                           {Math.floor(totalTime / 60)}:{(totalTime % 60).toFixed(0).padStart(2, '0')}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>
               )}

              {/* Présentations PowerPoint */}
              {mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" && (
                <div className="w-full h-[calc(100vh-120px)] border rounded bg-white relative">
                  {isPresentationLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Presentation className="h-8 w-8 text-blue-600 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Chargement de la présentation...
                        </h3>
                        <p className="text-gray-600">
                          Veuillez patienter pendant le traitement
                        </p>
                      </div>
                    </div>
                  ) : presentationSlides.length > 0 ? (
                    <div className="w-full h-full relative">
                      {/* Header avec informations */}
                      <div className="bg-gray-50 p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              Présentation PowerPoint
                            </h3>
                            <p className="text-sm text-gray-600">
                              {lesson.title}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {totalSlides} diapositive{totalSlides > 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-gray-400">
                              Diapositive {currentSlide + 1} sur {totalSlides}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contenu de la diapositive actuelle */}
                      <div className="flex-1 p-6">
                        <div className="bg-white border rounded-lg p-6 h-full flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Presentation className="h-8 w-8 text-blue-600" />
                          </div>
                          <h4 className="text-xl font-semibold text-gray-800 mb-2">
                            {presentationSlides[currentSlide]?.title || 'Diapositive'}
                          </h4>
                          <p className="text-gray-600 text-center mb-6">
                            {presentationSlides[currentSlide]?.content || 'Contenu de la diapositive'}
                          </p>
                          
                          {/* Message informatif */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                            <div className="flex items-start">
                              <Presentation className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                              <div>
                                <h5 className="text-sm font-medium text-blue-800 mb-1">
                                  Lecture de présentation
                                </h5>
                                <p className="text-sm text-blue-700">
                                  Pour une lecture complète de cette présentation PowerPoint, 
                                  veuillez la télécharger et l'ouvrir avec Microsoft PowerPoint 
                                  ou un lecteur compatible.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contrôles de navigation */}
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

                      {/* Bouton de téléchargement */}
                      <div className="absolute bottom-4 left-4 z-20">
                        <a
                          href={blobUrl || ''}
                          download={`${lesson.title}.pptx`}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Télécharger la présentation
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Presentation className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Erreur de chargement
                        </h3>
                        <p className="text-gray-600">
                          La présentation n'a pas pu être chargée
                        </p>
                      </div>
                    </div>
                  )}
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
                           const duration = audioRef.current.duration;
                           setTotalTime(duration);
                           console.log(`📊 Audio chargé - Durée: ${Math.floor(duration / 60)}:${(duration % 60).toFixed(0).padStart(2, '0')}`);
                           
                           // Charger la progression sauvegardée APRÈS que l'audio soit prêt
                           if (formationId && userId) {
                             console.log('📊 Chargement de la progression audio après chargement...');
                             loadSavedProgress();
                             
                             // Positionner l'audio au temps sauvegardé
                             if (currentTime > 0 && audioRef.current) {
                               audioRef.current.currentTime = currentTime;
                               console.log(`📊 Audio positionné à ${Math.floor(currentTime / 60)}:${(currentTime % 60).toFixed(0).padStart(2, '0')}`);
                             }
                           }
                           
                           // Démarrer le suivi de progression maintenant que tout est prêt
                           setTimeout(() => {
                             startProgressTracking();
                           }, 100);
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
               mimeType !== "application/vnd.openxmlformats-officedocument.presentationml.presentation" &&
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

      {/* Modal de reprise de lecture */}
      <ResumePlaybackModal
        isOpen={showResumeModal}
        onResume={handleResumePlayback}
        onRestart={handleRestartPlayback}
        onClose={handleCloseResumeModal}
        progressPercentage={Math.round((currentTime / totalTime) * 100)}
        currentTime={currentTime}
        totalTime={totalTime}
        lessonTitle={lesson.title}
      />
    </div>
  );
}
