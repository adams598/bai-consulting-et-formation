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
    // console.log('✅ Worker PDF configuré avec worker local');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du worker PDF local:', error);
    try {
      // Fallback vers le CDN
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      // console.log('✅ Worker PDF configuré avec CDN');
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
      // console.log('🔍 getCurrentUserId - Utilisation du userId passé en prop:', userId);
      return userId;
    }
    const serviceUserId = progressService.getCurrentUserId();
    // console.log('🔍 getCurrentUserId - Utilisation du service:', serviceUserId);
    
    // Vérifier le localStorage pour debug
    const userInfo = localStorage.getItem('userInfo');
    const accessToken = localStorage.getItem('accessToken');
    // console.log('🔍 getCurrentUserId - userInfo dans localStorage:', userInfo);
    // console.log('🔍 getCurrentUserId - accessToken dans localStorage:', accessToken ? 'présent' : 'absent');
    
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
          // console.log('✅ Worker PDF configuré avec worker local');
        } catch (error) {
          console.error('❌ Erreur worker local, tentative CDN:', error);
          try {
            pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
            // console.log('✅ Worker PDF configuré avec CDN');
          } catch (cdnError) {
            console.error('❌ Erreur lors de la configuration du worker PDF:', cdnError);
          }
        }
      }
      // console.log('🔍 État du worker PDF:', pdfjs.GlobalWorkerOptions.workerSrc);
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
      // Vérifier si l'événement provient d'un champ input, textarea ou élément éditable
      const target = e.target as HTMLElement;
      const isInputElement = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        (target.closest && (target.closest('input') || target.closest('textarea') || target.closest('[contenteditable="true"]')))
      );

      // Permettre les touches de saisie normales dans les champs de formulaire
      const editableKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Tab', 'Space'];
      if (isInputElement && editableKeys.includes(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Laisser passer les touches d'édition normales dans les champs de saisie
        return;
      }

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
        (!isInputElement && e.key === 'Delete') || // Delete (seulement hors input)
        (!isInputElement && e.key === 'Home') || // Home (seulement hors input)
        (!isInputElement && e.key === 'End') || // End (seulement hors input)
        (!isInputElement && e.key === 'PageUp') || // Page Up (seulement hors input)
        (!isInputElement && e.key === 'PageDown') || // Page Down (seulement hors input)
        (!isInputElement && e.key === 'ArrowUp') || // Flèche haut (seulement hors input)
        (!isInputElement && e.key === 'ArrowDown') || // Flèche bas (seulement hors input)
        (!isInputElement && e.key === 'ArrowLeft') || // Flèche gauche (seulement hors input)
        (!isInputElement && e.key === 'ArrowRight') || // Flèche droite (seulement hors input)
        e.key === 'Escape' || // Échap
        (!isInputElement && e.key === 'Tab') || // Tab (seulement hors input)
        (!isInputElement && e.key === 'Enter') || // Entrée (seulement hors input)
        (!isInputElement && e.key === 'Space') || // Espace (seulement hors input)
        (!isInputElement && e.key === 'Backspace') || // Retour arrière (seulement hors input)
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
       console.log(`📊 Sauvegarde automatique PDF: page ${currentPage}/${pageCount}`);
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
         console.log(`🎬 useEffect sauvegarde - Mise à jour de la progression (currentTime > 0)`);
         // Utiliser updateProgress pour bénéficier de la logique non-régressive
         updateProgress();
         
         // Démarrer le suivi si ce n'est pas déjà fait
         if (!isTrackingProgress) {
           console.log(`🎬 useEffect sauvegarde - Démarrage du suivi de progression`);
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
         // Récupérer directement depuis l'élément vidéo pour les vidéos distantes
         const currentTime = video.currentTime;
         const duration = video.duration;
         
         console.log(`🎬 updateProgress vidéo - currentTime: ${currentTime}s, duration: ${duration}s, isNaN: ${isNaN(currentTime)}/${isNaN(duration)}`);
         console.log(`🎬 updateProgress vidéo - readyState: ${video.readyState}, networkState: ${video.networkState}`);
         
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
       // console.log('📊 loadSavedProgress - Toutes les progressions:', allProgress);
       
       const savedProgress = allProgress[lesson.id];
       // console.log('📊 loadSavedProgress - Progression récupérée pour la leçon:', savedProgress);
       // console.log('📊 loadSavedProgress - LessonId:', lesson.id);
       // console.log('📊 loadSavedProgress - FormationId:', formationId);
       // console.log('📊 loadSavedProgress - UserId:', currentUserId);
       
       if (savedProgress && savedProgress.progress > 0 && !hasShownResumeModal) {
           // console.log('📊 Progression chargée:', savedProgress);
           
         // Afficher la modal de reprise pour les vidéos/audios avec progression significative
         if ((mimeType.startsWith("video/") || mimeType.startsWith("audio/")) && savedProgress.progress > 5) {
           // console.log('🎬 Affichage de la modal de reprise - Progression:', savedProgress.progress + '%');
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
     // console.log('🎬 Reprise de la lecture à', currentTime);
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
     // console.log('🎬 Redémarrage depuis le début');
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
                <p>FileUrl (prop): {fileUrl}</p>
                <p>FileUrl (lesson): {lesson.fileUrl || 'Non défini'}</p>
                <p>URL utilisée: {blobUrl || fullUrl || 'Aucune'}</p>
                <p>MimeType: {mimeType}</p>
                <p>FullUrl: {fullUrl}</p>
              </div>
                             <button
                 onClick={() => {
                   // console.log('🔄 TestViewer - Tentative de rechargement');
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
                            // console.log('📄 PDF chargé avec react-pdf:', numPages, 'pages');
                            setPageCount(numPages);
                            setTotalPages(numPages);
                            
                            // Charger la progression sauvegardée APRÈS que le PDF soit prêt
                            if (formationId && userId) {
                              // console.log('📊 Chargement de la progression après chargement PDF...');
                              loadSavedProgress();
                            }
                            
                            console.log(`📊 PDF chargé: ${numPages} pages, page courante: ${currentPage}`);
                          }}
                                                     onLoadError={(error) => {
                             console.error('❌ Erreur lors du chargement du PDF:', error);
                             setPdfError(true);
                             
                             // Vérifier l'état du worker
                             if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions.workerSrc) {
                               // console.log('🔍 Worker PDF configuré:', pdfjs.GlobalWorkerOptions.workerSrc);
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
                         console.log('🎬 onLoadedMetadata - Événement déclenché');
                         if (videoRef.current) {
                           const duration = videoRef.current.duration;
                           console.log(`🎬 onLoadedMetadata - Durée vidéo: ${duration}s (${Math.floor(duration / 60)}:${(duration % 60).toFixed(0).padStart(2, '0')})`);
                           console.log(`🎬 onLoadedMetadata - isNaN(duration): ${isNaN(duration)}, readyState: ${videoRef.current.readyState}`);
                           console.log(`🎬 onLoadedMetadata - URL vidéo: ${blobUrl}`);
                           
                           // Définir la vitesse de lecture par défaut à 0.85
                           videoRef.current.playbackRate = 0.85;
                           
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
                 
                    <div className="flex items-center justify-center h-full">
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
                    </div>
                  )
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
      {/* <div className="bg-white border-t px-6 py-2 text-center text-xs text-gray-500">
        © 2026 BAI Consulting - Lecteur de contenu sécurisé
      </div> */}

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
