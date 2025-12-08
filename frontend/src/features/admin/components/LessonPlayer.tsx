// LessonPlayer.tsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, FileText, Video, Presentation, Clock, CheckCircle, BookOpen, Lock, Edit, RefreshCw, HelpCircle, Plus, XCircle, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { FormationContent, Quiz } from '../types';
import { getLessonImageUrl, getImageUrl, getLessonFileUrl } from '../../../utils/imageUtils';
import TestViewer from './TestViewer';
import QuizConfigModal from './QuizConfigModal';
import '../../../components/LessonPlayer.css';
import { useAuth } from '../../../providers/auth-provider';
import progressService from '../../../services/progressService';
import { authService } from '../../../services/authService';
import { quizApi } from '../../../api/adminApi';

interface LessonPlayerProps {
  formation: {
    id: string;
    title: string;
    description?: string;
    duration?: number; // Ajouter la durée de la formation
  };
  lessons: FormationContent[];
  initialSelectedLesson?: FormationContent | null;
  onClose: () => void;
  onProgressUpdate?: (lessonId: string, progress: {
    timeSpent?: number;
    progress?: number;
    completed?: boolean;
  }) => void;
  onLessonUpdate?: (updatedLesson: FormationContent) => void;
}

interface LessonProgress {
  lessonId: string;
  timeSpent: number; // en secondes
  progress: number; // 0-100
  completed: boolean;
}

export default function LessonPlayer({ formation, lessons: rawLessons, initialSelectedLesson, onClose, onProgressUpdate, onLessonUpdate }: LessonPlayerProps) {
  const { user } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<FormationContent | null>(null);
  const [lessonProgress, setLessonProgress] = useState<{[key: string]: LessonProgress}>({});
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [isCalculatingDuration, setIsCalculatingDuration] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // États pour la gestion du quiz
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isQuizSelected, setIsQuizSelected] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    isPassed: boolean;
    totalScore: number;
    userScore: number;
    correctAnswers?: number;
    totalQuestions?: number;
    answers?: Record<string, string | string[]>;
  } | null>(null);
  const [lastAttempt, setLastAttempt] = useState<any | null>(null);
  const [showQuizRecap, setShowQuizRecap] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);


  // Transformer les données des leçons pour s'assurer que toutes les propriétés sont bien définies
  // Principe similaire à la transformation des formations dans LearnerFormationsPage
  const lessons = React.useMemo(() => {
    return rawLessons.map((lesson: any) => ({
      id: lesson.id,
      formationId: lesson.formationId,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      contentType: lesson.contentType,
      sectionId: lesson.sectionId,
      order: lesson.order,
      duration: formation.duration || 0, // Utiliser la durée de la formation pour toutes les leçons
      fileUrl: lesson.fileUrl,
      fileSize: lesson.fileSize,
      coverImage: lesson.coverImage,
      metadata: lesson.metadata,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt
    }));
  }, [rawLessons, formation.duration]);

  // Fonction pour récupérer l'ID utilisateur
  const getCurrentUserId = () => {
    if (user && user.id) {
      return user.id;
    }
    
    // Fallback : essayer de récupérer depuis le localStorage
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const userData = JSON.parse(userInfo);
        return userData.id || 'default-user-id';
      } catch (error) {
        console.error('Erreur parsing userInfo:', error);
      }
    }
    
    // Essayer de récupérer depuis le token JWT
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.userId || payload.sub) {
          return payload.userId || payload.sub;
        }
      } catch (error) {
        console.error('Erreur décodage token JWT:', error);
      }
    }
    
    return 'default-user-id';
  };

  // Fonction pour vérifier si l'utilisateur est admin
  const isAdmin = () => {
    const currentUser = authService.getCurrentUser();
    return currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'BANK_ADMIN');
  };

  // Fonction pour récupérer le quiz de la formation
  const fetchQuiz = async () => {
    if (!isAdmin()) return;
    
    setIsLoadingQuiz(true);
    try {
      const response = await fetch(`http://localhost:3000/api/admin/formations/${formation.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.quiz) {
          setQuiz(data.data.quiz);
          // Charger la dernière tentative si le quiz existe
          await fetchLastAttempt(data.data.quiz.id);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du quiz:', error);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Fonction pour récupérer la dernière tentative
  const fetchLastAttempt = async (quizId: string) => {
    try {
      const response = await quizApi.getLastAttempt(quizId);
      if (response.data.success && response.data.data) {
        setLastAttempt(response.data.data);
      } else {
        setLastAttempt(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la dernière tentative:', error);
      setLastAttempt(null);
    }
  };

  // Vérifier si toutes les leçons sont complétées
  const areAllLessonsCompleted = () => {
    // Filtrer uniquement les leçons (pas les sections)
    const actualLessons = lessons.filter(lesson => lesson.contentType === 'LESSON');
    
    if (actualLessons.length === 0) {
      return true; // Pas de leçons, le quiz peut être joué
    }
    
    // Vérifier que toutes les leçons sont complétées
    return actualLessons.every(lesson => {
      const progress = lessonProgress[lesson.id];
      return progress?.completed === true;
    });
  };

  // Fonction pour déterminer l'état du quiz et les actions disponibles
  const getQuizState = () => {
    const allLessonsCompleted = areAllLessonsCompleted();
    
    if (!quiz) {
      return {
        canPlay: false,
        canRetry: false,
        canFinish: false,
        buttonText: 'Jouer',
        buttonVariant: 'primary' as const,
        allLessonsCompleted: false,
        reason: 'Aucun quiz configuré'
      };
    }

    // Si toutes les leçons ne sont pas complétées et qu'il n'y a pas eu de tentative précédente
    if (!allLessonsCompleted && !lastAttempt) {
      return {
        canPlay: false,
        canRetry: false,
        canFinish: false,
        buttonText: 'Jouer',
        buttonVariant: 'primary' as const,
        allLessonsCompleted: false,
        reason: 'Complétez d\'abord toutes les leçons'
      };
    }

    if (!lastAttempt) {
      return {
        canPlay: allLessonsCompleted,
        canRetry: false,
        canFinish: false,
        buttonText: 'Jouer',
        buttonVariant: 'primary' as const,
        allLessonsCompleted,
        reason: allLessonsCompleted ? undefined : 'Complétez d\'abord toutes les leçons'
      };
    }

    const score = lastAttempt.score;
    // answers peut être soit une string (JSON) soit déjà un objet
    let answersObj = null;
    if (lastAttempt.answers) {
      if (typeof lastAttempt.answers === 'string') {
        try {
          answersObj = JSON.parse(lastAttempt.answers);
        } catch (e) {
          console.error('Erreur parsing answers:', e);
          answersObj = null;
        }
      } else {
        answersObj = lastAttempt.answers;
      }
    }
    const correctAnswers = answersObj ? Object.keys(answersObj).length : 0;

    // 100% = Terminer uniquement (peut toujours être cliqué même si leçons non complétées)
    if (score === 100) {
      return {
        canPlay: false,
        canRetry: false,
        canFinish: true,
        buttonText: 'Terminer',
        buttonVariant: 'success' as const,
        allLessonsCompleted: true,
        reason: undefined
      };
    }

    // Réussi entre 80-99% = Rejouer (optionnel) + Terminer (mis en avant)
    if (score >= quiz.passingScore && score < 100) {
      return {
        canPlay: false,
        canRetry: allLessonsCompleted, // Rejouer seulement si toutes les leçons sont complétées
        canFinish: true,
        buttonText: 'Rejouer',
        buttonVariant: 'secondary' as const,
        primaryAction: 'finish' as const,
        allLessonsCompleted,
        reason: allLessonsCompleted ? undefined : 'Complétez toutes les leçons pour rejouer'
      };
    }

    // Échec <80% = Rejouer (obligatoire, mais seulement si toutes les leçons sont complétées)
    if (score < quiz.passingScore) {
      return {
        canPlay: false,
        canRetry: allLessonsCompleted, // Rejouer seulement si toutes les leçons sont complétées
        canFinish: false,
        buttonText: 'Rejouer',
        buttonVariant: 'warning' as const,
        allLessonsCompleted,
        reason: allLessonsCompleted ? 'Vous devez rejouer le quiz' : 'Complétez toutes les leçons avant de rejouer'
      };
    }

    return {
      canPlay: allLessonsCompleted,
      canRetry: false,
      canFinish: false,
      buttonText: 'Jouer',
      buttonVariant: 'primary' as const,
      allLessonsCompleted,
      reason: allLessonsCompleted ? undefined : 'Complétez d\'abord toutes les leçons'
    };
  };

  // Fonction pour sauvegarder le quiz
  const handleSaveQuiz = async (quizData: any) => {
    try {
      console.log('💾 Sauvegarde du quiz:', quizData);
      
      if (quiz && quiz.id) {
        // Mise à jour du quiz existant
        const response = await quizApi.updateQuiz(quiz.id, {
          title: quizData.title || '',
          description: quizData.description || '',
          passingScore: quizData.passingScore || 80,
          timeLimit: quizData.timeLimit || undefined,
          questions: quizData.questions || []
        });
        
        if (response.data.success) {
          console.log('✅ Quiz mis à jour:', response.data.data);
          setQuiz(response.data.data);
          setSuccessMessage('Quiz mis à jour avec succès !');
          setTimeout(() => setSuccessMessage(null), 5000);
          // Recharger le quiz depuis l'API
          await fetchQuiz();
        }
      } else {
        // Création d'un nouveau quiz
        const response = await quizApi.createQuiz(formation.id, {
          title: quizData.title || '',
          description: quizData.description || '',
          passingScore: quizData.passingScore || 80,
          timeLimit: quizData.timeLimit || undefined,
          questions: quizData.questions || []
        });
        
        if (response.data.success) {
          console.log('✅ Quiz créé:', response.data.data);
          setQuiz(response.data.data);
          setSuccessMessage('Quiz créé avec succès !');
          setTimeout(() => setSuccessMessage(null), 5000);
          // Recharger le quiz depuis l'API
          await fetchQuiz();
        }
      }
      setShowQuizModal(false);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du quiz:', error);
      setSuccessMessage('Erreur lors de la sauvegarde du quiz');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  // Fonction pour calculer la durée réelle de la vidéo
  const calculateVideoDuration = async (lessonId: string): Promise<number> => {
    console.log('🔄 Calcul de la durée pour la leçon:', lessonId);
    
    // Essayer d'abord l'API (même si elle n'existe pas encore)
    try {
      const response = await fetch(`http://localhost:3000/api/admin/lessons/${lessonId}/duration`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const duration = data.duration || 0;
        console.log('🎥 Durée calculée via l\'API:', duration, 'secondes');
        return duration;
      } else {
        console.log('⚠️ API non disponible (404), passage au fallback...');
      }
    } catch (apiError) {
      console.log('⚠️ Erreur API, passage au fallback:', apiError);
    }
    
    // Fallback: utiliser fetch authentifié pour récupérer la vidéo
    try {
      console.log('🔄 Tentative avec fetch authentifié...');
      
      const videoUrl = buildLessonFileUrl(selectedLesson!);
      console.log('🎥 URL de la vidéo:', videoUrl);
      
      // Essayer de récupérer la vidéo avec authentification
      const videoResponse = await fetch(videoUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!videoResponse.ok) {
        throw new Error(`Erreur fetch vidéo: ${videoResponse.status}`);
      }
      
      // Créer un blob URL temporaire
      const videoBlob = await videoResponse.blob();
      const blobUrl = URL.createObjectURL(videoBlob);
      
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          const duration = Math.round(video.duration);
          console.log('🎥 Durée calculée via blob:', duration, 'secondes');
          URL.revokeObjectURL(blobUrl); // Nettoyer le blob URL
          resolve(duration);
        };
        
        video.onerror = (e) => {
          console.error('❌ Erreur lors du chargement de la vidéo blob:', e);
          URL.revokeObjectURL(blobUrl); // Nettoyer le blob URL
          reject(new Error('Impossible de charger la vidéo blob'));
        };
        
        video.src = blobUrl;
      });
      
    } catch (fallbackError) {
      console.error('❌ Erreur fallback:', fallbackError);
      throw new Error('Impossible de calculer la durée de la vidéo');
    }
  };

  // Fonction pour recalculer la durée de la leçon
  const handleRecalculateDuration = async () => {
    if (!selectedLesson || !selectedLesson.fileUrl) {
      console.log('❌ Aucune leçon sélectionnée ou pas de fichier vidéo');
      return;
    }

    setIsCalculatingDuration(true);
    setSuccessMessage(null);
    
    try {
      console.log('🔄 Calcul de la durée pour la leçon:', selectedLesson.title);
      
      // Calculer la durée via l'API ou fallback
      const realDuration = await calculateVideoDuration(selectedLesson.id);
      
      console.log('✅ Durée réelle calculée:', realDuration, 'secondes');
      console.log('📊 Durée actuelle de la formation:', formation.duration, 'secondes');
      
      // Mettre à jour la formation dans la base de données
      try {
        console.log('💾 Mise à jour de la formation dans la BDD...');
        
        const response = await fetch(`http://localhost:3000/api/admin/formations/${formation.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: formation.title, // Champ obligatoire
            description: formation.description || '',
            duration: realDuration
          })
        });
        
        if (response.ok) {
          console.log('✅ Formation mise à jour dans la BDD avec la durée:', realDuration, 'secondes');
          
          // Mettre à jour la leçon avec la durée réelle
          const updatedLesson = {
            ...selectedLesson,
            duration: realDuration
          };
          
          setSelectedLesson(updatedLesson);
          
          // Appeler la fonction parent pour sauvegarder
          if (onLessonUpdate) {
            onLessonUpdate(updatedLesson);
          }
          
          // Afficher le message de succès
          setSuccessMessage(`✅ Durée mise à jour avec succès ! Nouvelle durée : ${realDuration} secondes`);
          
          // Masquer le message après 5 secondes
          setTimeout(() => {
            setSuccessMessage(null);
          }, 5000);
          
          console.log('💾 Leçon mise à jour avec la durée réelle:', realDuration, 'secondes');
          
        } else {
          throw new Error(`Erreur lors de la mise à jour de la formation: ${response.status}`);
        }
        
      } catch (dbError) {
        console.error('❌ Erreur lors de la mise à jour de la BDD:', dbError);
        
        // Mettre à jour quand même localement
        const updatedLesson = {
          ...selectedLesson,
          duration: realDuration
        };
        
        setSelectedLesson(updatedLesson);
        
        if (onLessonUpdate) {
          onLessonUpdate(updatedLesson);
        }
        
        setSuccessMessage(`⚠️ Durée calculée (${realDuration}s) mais erreur lors de la sauvegarde en BDD`);
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du calcul de la durée:', error);
      setSuccessMessage('❌ Erreur lors du calcul de la durée de la vidéo');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } finally {
      setIsCalculatingDuration(false);
    }
  };

  // Charger les progressions au montage du composant
  useEffect(() => {
    const loadProgressions = () => {
      try {
        const userId = getCurrentUserId();
        const progress = progressService.getProgress(formation.id, userId, lessons);
        setLessonProgress(progress);
        console.log('📊 Progressions chargées dans LessonPlayer:', progress);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des progressions:', error);
      }
    };

    if (lessons.length > 0) {
      loadProgressions();
    }
    
    // Recharger les progressions périodiquement pour détecter les changements
    // (utile quand une leçon est complétée dans un autre onglet ou composant)
    const interval = setInterval(() => {
      if (lessons.length > 0) {
        loadProgressions();
      }
    }, 3000); // Recharger toutes les 3 secondes
    
    return () => clearInterval(interval);
  }, [formation.id, lessons]);

  // Charger le quiz au montage du composant (pour les admins)
  useEffect(() => {
    if (isAdmin()) {
      fetchQuiz();
    }
  }, [formation.id]);

  // Effet de débogage pour surveiller l'état de la modal
  useEffect(() => {
    if (showQuizModal) {
      console.log('📌 showQuizModal est maintenant true, la modal devrait s\'afficher');
    }
  }, [showQuizModal]);

  // Sélectionner automatiquement la première leçon ou la leçon initiale
  useEffect(() => {
    if (lessons.length > 0 && !selectedLesson) {
      if (initialSelectedLesson) {
        setSelectedLesson(initialSelectedLesson);
      } else {
        setSelectedLesson(lessons[0]);
      }
    }
  }, [lessons, selectedLesson, initialSelectedLesson]);

  // Vérifier si une leçon est accessible (logique séquentielle stricte)
  const isLessonAccessible = (lesson: FormationContent, index: number) => {
    // La première leçon est toujours accessible
    if (index === 0) return true;
    
    // Pour les autres leçons, vérifier que TOUTES les leçons précédentes sont terminées
    for (let i = 0; i < index; i++) {
      const previousLesson = lessons[i];
      if (!previousLesson) continue;
      
      const previousProgress = lessonProgress[previousLesson.id];
      if (!previousProgress?.completed) {
        return false; // Une leçon précédente n'est pas terminée
      }
    }
    
    return true; // Toutes les leçons précédentes sont terminées
  };

  const handleLessonSelect = (lesson: FormationContent) => {
    const lessonIndex = lessons.findIndex(l => l.id === lesson.id);
    const isAccessible = isLessonAccessible(lesson, lessonIndex);
    
    if (isAccessible) {
      setSelectedLesson(lesson);
      setIsQuizSelected(false); // Désélectionner le quiz si une leçon est sélectionnée
      setQuizResult(null);
    } else {
      console.log('🚫 Sélection bloquée pour', lesson.title, '- Leçon non accessible');
    }
  };

  const updateLessonProgress = (lessonId: string, progress: Partial<LessonProgress>) => {
    // Trouver l'index de la leçon
    const lessonIndex = lessons.findIndex(lesson => lesson.id === lessonId);
    if (lessonIndex === -1) return;

    // Vérifier si la leçon est accessible
    const isAccessible = isLessonAccessible(lessons[lessonIndex], lessonIndex);
    
    if (!isAccessible) {
      console.log('🚫 Progression bloquée pour', lessons[lessonIndex].title, '- Leçon non accessible');
      return;
    }

    // Mettre à jour via le service de progression
    const userId = getCurrentUserId();
    progressService.updateProgress(formation.id, userId, lessonId, {
      timeSpent: progress.timeSpent || 0,
      progress: progress.progress || 0,
      completed: progress.completed || false
    });
    
    // Mettre à jour l'état local
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        ...progress,
        lessonId,
        lastUpdated: new Date().toISOString()
      }
    }));
    
    // Appeler la fonction parent si elle existe
    if (onProgressUpdate) {
      onProgressUpdate(lessonId, {
        timeSpent: progress.timeSpent || 0,
        progress: progress.progress || 0,
        completed: progress.completed || false
      });
    }
  };

  const getFileType = (lesson: FormationContent) => {
    if (lesson.fileUrl) {
      const extension = lesson.fileUrl.split('.').pop()?.toLowerCase();
      if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension || '')) return 'video';
      if (['pdf'].includes(extension || '')) return 'pdf';
      if (['docx', 'doc'].includes(extension || '')) return 'document';
      if (['pptx', 'ppt'].includes(extension || '')) return 'presentation';
    }
    return lesson.type.toLowerCase();
  };

  // Fonction pour construire l'URL du fichier de la leçon
  const buildLessonFileUrl = (lesson: FormationContent) => {
    console.log('🔍 buildLessonFileUrl - lesson:', lesson);
    console.log('🔍 buildLessonFileUrl - formation.title:', formation.title);
    console.log('🔍 buildLessonFileUrl - lesson.title:', lesson.title);
    console.log('🔍 buildLessonFileUrl - lesson.fileUrl:', lesson.fileUrl);
    
    // Utiliser la fonction importée de imageUtils avec l'URL Cloudinary si disponible
    const url = getLessonFileUrl(formation.title, lesson.title, undefined, lesson.fileUrl);
    console.log('🔍 buildLessonFileUrl - URL générée:', url);
    return url;
  };




  const getFileIcon = (lesson: FormationContent) => {
    const fileType = getFileType(lesson);
    switch (fileType) {
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'document':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'presentation':
        return <Presentation className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActionButtonText = (lesson: FormationContent) => {
    const fileType = getFileType(lesson);
    switch (fileType) {
      case 'video':
        return 'Lire la vidéo';
      case 'pdf':
      case 'document':
        return 'Lire le document';
      case 'presentation':
        return 'Voir la présentation';
      default:
        return 'Lire';
    }
  };

  const renderLessonContent = () => {
    if (!selectedLesson) return null;

    const fileType = getFileType(selectedLesson);

    // Utiliser TestViewer pour tous les types pour le moment
    // buildLessonFileUrl utilise déjà lesson.fileUrl si c'est une URL Cloudinary
    const fileUrl = buildLessonFileUrl(selectedLesson);
    
    console.log('🎬 LessonPlayer - renderLessonContent:', {
      lessonId: selectedLesson.id,
      lessonTitle: selectedLesson.title,
      lessonFileUrl: selectedLesson.fileUrl,
      builtFileUrl: fileUrl,
      isCloudinary: selectedLesson.fileUrl?.startsWith('https://res.cloudinary.com') || selectedLesson.fileUrl?.startsWith('http://res.cloudinary.com')
    });
    
    return (
      <TestViewer
        lesson={selectedLesson}
        fileUrl={fileUrl || undefined}
        formationId={formation.id}
        userId={getCurrentUserId()}
        onProgressUpdate={(progress: Partial<LessonProgress>) => updateLessonProgress(selectedLesson.id, progress)}
      />
    );
  };

  const renderQuizContent = () => {
    if (!quiz) return null;

    // Si on a un résultat, afficher les résultats
    if (quizResult) {
      return (
        <div className="h-full flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              {quizResult.isPassed ? (
                <>
                  <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-green-600 mb-2">Quiz réussi !</h2>
                  <p className="text-gray-600 mb-6">Félicitations, vous avez réussi le quiz avec un score de {quizResult.score}%</p>
                </>
              ) : (
                <>
                  <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-red-600 mb-2">Quiz échoué</h2>
                  <p className="text-gray-600 mb-6">Vous avez obtenu {quizResult.score}% sur {quizResult.totalScore} points. Le score minimum requis est {quiz.passingScore}%</p>
                </>
              )}
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Votre score</p>
                    <p className="text-2xl font-bold text-gray-900">{quizResult.userScore} / {quizResult.totalScore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pourcentage</p>
                    <p className="text-2xl font-bold text-gray-900">{quizResult.score}%</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        quizResult.isPassed ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${quizResult.score}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setQuizResult(null);
                  setIsQuizSelected(false);
                  setSelectedLesson(null);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retour aux leçons
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Sinon, afficher le quiz inline
    return <InlineQuizPlayer 
      quiz={quiz} 
      onComplete={async (result) => {
        setQuizResult(result);
        // Recharger la dernière tentative après sauvegarde
        await fetchLastAttempt(quiz.id);
      }} 
      onClose={() => setIsQuizSelected(false)} 
    />;
  };

  // Composant Quiz Player Inline - Inspiré de QuizPreviewModal
  const InlineQuizPlayer = ({ quiz, onComplete, onClose }: { quiz: Quiz; onComplete: (result: any) => void; onClose: () => void }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | number[] | string | string[]>>({});
    const [showResults, setShowResults] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatTime = (seconds: number): string => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionIndex: number, answerIndex: number | string, isMultiple: boolean = false) => {
      if (isMultiple && typeof answerIndex === 'number') {
        // Pour choix multiples : toggle avec indices numériques
        setSelectedAnswers(prev => {
          const current = prev[questionIndex];
          let currentArray: number[] = [];
          if (Array.isArray(current)) {
            currentArray = current.filter(c => typeof c === 'number') as number[];
          } else if (typeof current === 'number') {
            currentArray = [current];
          }
          
          const newArray = currentArray.includes(answerIndex)
            ? currentArray.filter(id => id !== answerIndex)
            : [...currentArray, answerIndex];
          
          if (newArray.length === 0) {
            const newPrev = { ...prev };
            delete newPrev[questionIndex];
            return newPrev;
          }
          return { ...prev, [questionIndex]: newArray as number[] };
        });
      } else if (!isMultiple) {
        // Pour radio/text (une seule réponse)
        setSelectedAnswers(prev => ({
          ...prev,
          [questionIndex]: answerIndex
        }));
      }
    };

    const calculateScore = () => {
      let correctAnswers = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      quiz.questions.forEach((question, qIndex) => {
        const selectedAnswer = selectedAnswers[qIndex];
        const points = question.points || 1;
        totalPoints += points;

        if (question.type === 'text') {
          // Pour les questions texte libre, on considère qu'elles sont correctes (évaluation manuelle)
          if (selectedAnswer && selectedAnswer.toString().trim()) {
            earnedPoints += points;
            correctAnswers++;
          }
        } else if (question.type === 'fill_in_blank') {
          // Pour les phrases à trous : vérifier chaque trou
          const expectedAnswers = question.answers.map(a => a.answer.toLowerCase().trim());
          let userAnswers: string[] = [];
          
          if (Array.isArray(selectedAnswer)) {
            userAnswers = selectedAnswer
              .filter((ans): ans is string => typeof ans === 'string')
              .map(ans => ans.toLowerCase().trim());
          }
          
          // Vérifier si toutes les réponses sont correctes
          const allCorrect = expectedAnswers.length > 0 &&
            expectedAnswers.length === userAnswers.length &&
            expectedAnswers.every((expected, idx) => expected === userAnswers[idx]);
          
          if (allCorrect) {
            earnedPoints += points;
            correctAnswers++;
          }
        } else if (question.type === 'multiple_choice') {
          // Pour choix multiples : vérifier si toutes les bonnes réponses sont sélectionnées
          const correctAnswerIndices = question.answers
            .map((answer, aIndex) => answer.isCorrect ? aIndex : null)
            .filter(index => index !== null) as number[];
          
          let userAnswers: number[] = [];
          if (Array.isArray(selectedAnswer)) {
            userAnswers = selectedAnswer.filter(a => typeof a === 'number') as number[];
          } else if (typeof selectedAnswer === 'number') {
            userAnswers = [selectedAnswer];
          }
          
          const allCorrect = correctAnswerIndices.length > 0 && 
            correctAnswerIndices.every(correctIndex => userAnswers.includes(correctIndex)) &&
            userAnswers.length === correctAnswerIndices.length;
          
          if (allCorrect) {
            earnedPoints += points;
            correctAnswers++;
          }
        } else if (question.answers && typeof selectedAnswer === 'number') {
          // Pour radio/vrai-faux
          const answer = question.answers[selectedAnswer];
          if (answer?.isCorrect) {
            earnedPoints += points;
            correctAnswers++;
          }
        }
      });

      const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = percentage >= quiz.passingScore;

      return {
        correctAnswers,
        totalQuestions: quiz.questions.length,
        earnedPoints,
        totalPoints,
        percentage,
        passed
      };
    };

    const handleSubmitQuiz = useCallback(async () => {
      setIsSubmitting(true);
      const results = calculateScore();
      
      // Convertir les réponses d'indices vers des IDs de questions/réponses pour l'API
      const answersForApi: Record<string, string | string[]> = {};
      quiz.questions.forEach((question, qIndex) => {
        const selectedAnswer = selectedAnswers[qIndex];
        if (selectedAnswer !== undefined) {
          if (question.type === 'fill_in_blank') {
            // Phrases à trous : garder le tableau de réponses (strings)
            if (Array.isArray(selectedAnswer)) {
              answersForApi[question.id] = selectedAnswer.filter((ans): ans is string => typeof ans === 'string');
            } else if (typeof selectedAnswer === 'string') {
              answersForApi[question.id] = [selectedAnswer];
            }
          } else if (Array.isArray(selectedAnswer) && question.type === 'multiple_choice') {
            // Choix multiples : convertir les indices en IDs de réponses
            const indices = selectedAnswer.filter((val): val is number => typeof val === 'number');
            answersForApi[question.id] = indices.map(index => question.answers[index].id);
          } else if (typeof selectedAnswer === 'number') {
            // Radio/vrai-faux : convertir l'indice en ID de réponse
            answersForApi[question.id] = question.answers[selectedAnswer].id;
          } else if (typeof selectedAnswer === 'string') {
            // Texte libre : garder tel quel
            answersForApi[question.id] = selectedAnswer;
          }
        }
      });

      // Sauvegarder les résultats dans la base de données
      try {
        const timeSpent = timeLeft !== null && startTime !== null 
          ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
          : undefined;
        
        const response = await quizApi.submitAttempt(quiz.id, {
          answers: answersForApi,
          timeSpent,
        });

        if (response.data.success) {
          console.log('✅ Résultats sauvegardés:', response.data.data);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des résultats:', error);
      }

      // Appeler onComplete avec les résultats et les réponses
      onComplete({
        score: results.percentage,
        isPassed: results.passed,
        totalScore: results.totalPoints,
        userScore: results.earnedPoints,
        correctAnswers: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        answers: selectedAnswers // Garder les réponses originales pour le récapitulatif
      });
      setShowResults(true);
      setIsSubmitting(false);
    }, [selectedAnswers, quiz, onComplete, timeLeft, startTime]);

    // Initialiser le timer si nécessaire
    useEffect(() => {
      if (quiz.timeLimit && !startTime && !showResults) {
        setTimeLeft(quiz.timeLimit * 60); // Convertir en secondes
        setStartTime(new Date());
      }
    }, [quiz.timeLimit, startTime, showResults]);

    // Timer countdown
    useEffect(() => {
      if (timeLeft === null || timeLeft <= 0 || showResults) return;

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [timeLeft, showResults, handleSubmitQuiz]);

    const results = showResults ? calculateScore() : null;
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const correctAnswersCount = currentQuestion ? currentQuestion.answers.filter(a => a.isCorrect).length : 0;
    const isMultipleChoice = currentQuestion?.type === "multiple_choice" && correctAnswersCount > 1;

    return (
      <div className="h-full flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {quiz.title}
            </h2>
            {timeLeft !== null && (
              <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {quiz.description && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">{quiz.description}</p>
            </div>
          )}

          {!showResults ? (
            <>
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Question {currentQuestionIndex + 1} sur {quiz.questions.length}</span>
                  <span>Seuil de réussite : {quiz.passingScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Question actuelle */}
              {currentQuestion && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-medium text-gray-900 flex-1">
                      {currentQuestion.question}
                    </h3>
                    <div className="ml-4 flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {currentQuestion.points || 1} point(s)
                      </span>
                    </div>
                  </div>

                  {/* Indication pour choix multiples */}
                  {isMultipleChoice && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">
                        Plusieurs réponses sont attendues
                      </p>
                    </div>
                  )}

                  {correctAnswersCount === 1 && currentQuestion.type === 'multiple_choice' && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">
                        Une seule réponse attendue
                      </p>
                    </div>
                  )}

                      <div className="space-y-3">
                        {currentQuestion.type === 'text' ? (
                          <textarea
                            value={typeof selectedAnswers[currentQuestionIndex] === 'string' 
                              ? selectedAnswers[currentQuestionIndex] as string 
                              : ''}
                            onChange={(e) => handleAnswerSelect(currentQuestionIndex, e.target.value, false)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                            placeholder="Tapez votre réponse ici..."
                          />
                        ) : currentQuestion.type === 'fill_in_blank' ? (
                          // Phrases à trous
                          <div className="space-y-4">
                            {(() => {
                              // Parser la phrase pour extraire les parties et les trous
                              const parts = currentQuestion.question.split(/(\{[^}]+\})/g);
                              const blanks = currentQuestion.question.match(/\{([^}]+)\}/g) || [];
                              const rawAnswers = selectedAnswers[currentQuestionIndex];
                              const currentAnswers: string[] = Array.isArray(rawAnswers) 
                                ? rawAnswers.filter((ans): ans is string => typeof ans === 'string')
                                : [];
                              
                              let blankIndex = 0;
                              
                              return (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {parts.map((part, partIdx) => {
                                      if (part.match(/^\{[^}]+\}$/)) {
                                        // C'est un trou
                                        const currentBlankIndex = blankIndex;
                                        blankIndex++;
                                        return (
                                          <input
                                            key={partIdx}
                                            type="text"
                                            value={currentAnswers[currentBlankIndex] || ''}
                                            onChange={(e) => {
                                              const newAnswers: string[] = [...currentAnswers];
                                              newAnswers[currentBlankIndex] = e.target.value;
                                              setSelectedAnswers(prev => ({
                                                ...prev,
                                                [currentQuestionIndex]: newAnswers
                                              }));
                                            }}
                                            className="px-3 py-1 border-2 border-blue-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-600 min-w-[120px] bg-white"
                                            placeholder={`Trou ${currentBlankIndex + 1}`}
                                          />
                                        );
                                      } else {
                                        // C'est du texte normal
                                        return (
                                          <span key={partIdx} className="text-gray-900">
                                            {part}
                                          </span>
                                        );
                                      }
                                    })}
                                  </div>
                                  <div className="mt-3 text-xs text-gray-500">
                                    <AlertCircle className="h-3 w-3 inline mr-1" />
                                    Remplissez les {blanks.length} trou{blanks.length > 1 ? 's' : ''} de la phrase
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          currentQuestion.answers.map((answer, aIndex) => {
                            const selected = selectedAnswers[currentQuestionIndex];
                            const isSelected = currentQuestion.type === "multiple_choice"
                              ? Array.isArray(selected) && selected.some((val) => val === aIndex)
                              : selected === aIndex;

                        return (
                          <label
                            key={aIndex}
                            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type={currentQuestion.type === "multiple_choice" ? "checkbox" : "radio"}
                              name={`question-${currentQuestionIndex}`}
                              checked={isSelected}
                              onChange={() => handleAnswerSelect(currentQuestionIndex, aIndex, currentQuestion.type === "multiple_choice")}
                              className={currentQuestion.type === "multiple_choice" 
                                ? "text-blue-600 focus:ring-blue-500 rounded" 
                                : "text-blue-600 focus:ring-blue-500"}
                            />
                            <span className="text-gray-900">{answer.answer}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>

                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Suivant
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Soumission..." : "Terminer le quiz"}
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Résultats */
            <div className="space-y-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  results!.passed ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {results!.passed ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {results!.passed ? 'Quiz réussi !' : 'Quiz échoué'}
                </h3>
                <p className="text-gray-600">
                  Vous avez obtenu {results!.percentage}% ({results!.earnedPoints}/{results!.totalPoints} points)
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{results!.correctAnswers}</div>
                  <div className="text-sm text-gray-600">Bonnes réponses</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{results!.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{results!.earnedPoints}</div>
                  <div className="text-sm text-gray-600">Points obtenus</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{results!.percentage}%</div>
                  <div className="text-sm text-gray-600">Score final</div>
                </div>
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setCurrentQuestionIndex(0);
                    setSelectedAnswers({});
                    setShowResults(false);
                    setTimeLeft(quiz.timeLimit ? quiz.timeLimit * 60 : null);
                    setStartTime(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Recommencer
                </button>
                <button
                  onClick={() => {
                    setShowResults(false);
                    setIsQuizSelected(false);
                    setQuizResult(null);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Fonction pour formater la durée de la leçon (provenant de la BDD)
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return 'N/A';
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h`;
    }
  };

  return (
    <>
      {/* Overlay sombre */}
      <div className="fixed inset-0 bg-black bg-opacity-75 z-[9998]" onClick={onClose} />
      
      {/* Modale */}
      <div 
        className="fixed inset-0 bg-white z-[9999] flex flex-col shadow-2xl" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'white',
          zIndex: 9999
        }}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{formation.title}</h1>
            </div>
          </div>
          
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden bg-white">
          {/* Left Sidebar - Liste des leçons */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Leçons</h2>
              <div className="space-y-3">
                {lessons.map((lesson, index) => {
                  const progress = lessonProgress[lesson.id];
                  const isSelected = selectedLesson?.id === lesson.id;
                  const isAccessible = isLessonAccessible(lesson, index);
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handleLessonSelect(lesson)}
                      className={`p-4 bg-white rounded-lg border-2 transition-all ${
                        !isAccessible
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : isSelected 
                            ? 'border-blue-500 bg-blue-50 cursor-pointer hover:shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer hover:shadow-md'
                      }`}
                    >
                      {/* Image de couverture
                      {lesson.coverImage ? (
                        <div className="mb-3 relative overflow-hidden rounded-lg">
                          <img
                            src={getLessonImageUrl(lesson.coverImage)}
                            alt={`Couverture de ${lesson.title}`}
                            className={`w-full h-20 object-cover ${
                              !isAccessible ? 'filter grayscale opacity-50' : ''
                            }`}
                          />
                          {!isAccessible && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Lock className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`mb-3 w-full h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center ${
                          !isAccessible ? 'opacity-50' : ''
                        }`}>
                          {!isAccessible ? (
                            <Lock className="h-8 w-8 text-gray-400" />
                          ) : (
                            getFileIcon(lesson)
                          )}
                        </div>
                      )} */}

                      {/* Titre et type */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">
                          {lesson.title}
                        </h3>
                        <div className="flex items-center space-x-1 ml-2">
                          {/* {getFileIcon(lesson)} */}
                          {progress?.completed && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {/* Bouton d'édition pour les admins sur la carte */}
                          {isAdmin() && isSelected && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🔍 MODIFIER - Clic détecté !');
                                setShowLessonModal(true);
                              }}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              title="Modifier cette leçon"
                              style={{ 
                                zIndex: 10,
                                position: 'relative'
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {lesson.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {/* {lesson.description} */}
                        </p>
                      )}

                      {/* Durée et temps passé */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(lesson.duration || 0)}</span>
                        </div>
                        {progress && progress.timeSpent > 0 && (
                          <span className="text-blue-600">
                            {formatTime(progress.timeSpent)} passés
                          </span>
                        )}
                      </div>

                      {/* Bouton d'action
                      <button
                        disabled={!isAccessible}
                        className={`w-full py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                          !isAccessible
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {!isAccessible ? (
                          <>
                            <Lock className="h-3 w-3 mr-1 inline" />
                            Verrouillée
                          </>
                        ) : (
                          getActionButtonText(lesson)
                        )}
                      </button> */}

                      {/* Barre de progression */}
                      {!isAccessible ? (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progression</span>
                            <span>0%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-gray-400 h-1.5 rounded-full w-0" />
                          </div>
                        </div>
                      ) : progress && progress.progress > 0 ? (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progression</span>
                            <span>{Math.round(progress.progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {/* Carte Quiz pour les admins */}
                {isAdmin() && (
                  <div
                    className={`p-4 bg-white rounded-lg border-2 transition-all ${
                      !quiz
                        ? 'border-dashed border-gray-300 hover:border-blue-400 cursor-pointer hover:shadow-md'
                        : isQuizSelected
                          ? 'border-purple-500 bg-purple-50 cursor-pointer hover:shadow-md'
                          : 'border-purple-200 hover:border-purple-300 cursor-pointer hover:shadow-md'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!quiz) {
                        // Si pas de quiz, ouvrir la modal de configuration
                        console.log('🎯 Clic sur la carte Quiz - ouverture de la modal, showQuizModal:', showQuizModal);
                        setShowQuizModal(true);
                        console.log('✅ showQuizModal mis à true');
                      }
                      // Ne pas jouer automatiquement au clic sur la carte, utiliser les boutons
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <div className={`p-2 rounded-md ${
                          quiz 
                            ? 'bg-purple-100' 
                            : 'bg-gray-100'
                        }`}>
                          <HelpCircle className={`h-5 w-5 ${
                            quiz 
                              ? 'text-purple-600' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">
                            {quiz ? quiz.title : 'Quiz de validation'}
                          </h3>
                          {quiz && quiz.questions && (
                            <p className="text-xs text-gray-500 mt-1">
                              {quiz.questions.length} question{quiz.questions.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {quiz ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowQuizModal(true);
                            }}
                            className="p-1 hover:bg-purple-100 rounded transition-colors"
                            title="Modifier le quiz"
                          >
                            <Edit className="h-4 w-4 text-purple-600" />
                          </button>
                        ) : (
                          <Plus className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </div>

                    {quiz && (
                      <>
                        <div className="mt-2 text-xs text-gray-500">
                          {lastAttempt ? (
                            <div>
                              <span>Dernier score: {lastAttempt.score}%</span>
                              {lastAttempt.isPassed ? (
                                <span className="ml-2 text-green-600">✓ Réussi</span>
                              ) : (
                                <span className="ml-2 text-red-600">✗ Échoué</span>
                              )}
                            </div>
                          ) : (
                            <span>Pas encore joué</span>
                          )}
                        </div>
                        
                        {/* Boutons d'action selon l'état */}
                        {(() => {
                          const quizState = getQuizState();
                          const canPlayQuiz = quizState.allLessonsCompleted;
                          const actualLessons = lessons.filter(l => l.contentType === 'LESSON');
                          const completedLessons = actualLessons.filter(l => lessonProgress[l.id]?.completed).length;
                          
                          return (
                            <div className="mt-3 flex flex-col space-y-2">
                              {/* Message informatif si toutes les leçons ne sont pas complétées */}
                              {!canPlayQuiz && quiz && (
                                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                  <p className="text-xs text-yellow-800">
                                    <Lock className="h-3 w-3 inline mr-1" />
                                    {completedLessons} / {actualLessons.length} leçon{actualLessons.length > 1 ? 's' : ''} complétée{actualLessons.length > 1 ? 's' : ''}
                                  </p>
                                  <p className="text-xs text-yellow-700 mt-1">
                                    Complétez toutes les leçons pour accéder au quiz
                                  </p>
                                </div>
                              )}
                              
                              {quizState.canPlay && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (canPlayQuiz) {
                                      setIsQuizSelected(true);
                                      setSelectedLesson(null);
                                      setQuizResult(null);
                                    }
                                  }}
                                  disabled={!canPlayQuiz}
                                  className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                                    canPlayQuiz
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  Jouer
                                </button>
                              )}
                              
                              {quizState.canRetry && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (canPlayQuiz) {
                                      setIsQuizSelected(true);
                                      setSelectedLesson(null);
                                      setQuizResult(null);
                                    }
                                  }}
                                  disabled={!canPlayQuiz}
                                  className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                                    !canPlayQuiz
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : quizState.buttonVariant === 'warning'
                                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  Rejouer
                                </button>
                              )}
                              
                              {quizState.canFinish && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Action terminer : fermer le quiz
                                    setIsQuizSelected(false);
                                    setQuizResult(null);
                                  }}
                                  className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                                    quizState.primaryAction === 'finish'
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-green-500 text-white hover:bg-green-600'
                                  }`}
                                >
                                  Terminer
                                </button>
                              )}
                              
                              {lastAttempt && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowQuizRecap(true);
                                  }}
                                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                                >
                                  Récap
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}

                    {!quiz && (
                      <div className="flex items-center justify-center pt-2">
                        <span className="text-xs text-blue-600">
                          Cliquez pour ajouter un quiz de validation
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Contenu de la leçon ou quiz */}
          <div className="flex-1 bg-white overflow-hidden">
            {isQuizSelected && quiz ? (
              <div className="h-full overflow-y-auto">
                {renderQuizContent()}
              </div>
            ) : selectedLesson ? (
              <div className="h-full">
                {renderLessonContent()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Sélectionnez une leçon ou le quiz pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'édition de leçon personnalisé */}
      {showLessonModal && selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du modal */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Modifier la leçon</h2>
              <button
                onClick={() => setShowLessonModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Informations de base */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de base</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre de la leçon
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedLesson.title}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de contenu
                      </label>
                      <select
                        defaultValue={selectedLesson.type}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="VIDEO">Vidéo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    defaultValue={selectedLesson.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description de la leçon..."
                  />
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (en secondes)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue={formation.duration || 0}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Durée en secondes"
                    />
                    <button
                      type="button"
                      onClick={handleRecalculateDuration}
                      disabled={isCalculatingDuration || !selectedLesson?.fileUrl}
                      className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      title="Recalculer la durée à partir de la vidéo"
                    >
                      <RefreshCw className={`h-4 w-4 ${isCalculatingDuration ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {isCalculatingDuration && (
                    <p className="text-sm text-blue-600 mt-1">🔄 Calcul de la durée en cours...</p>
                  )}
                </div>

                {/* Fichier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier de la leçon
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {selectedLesson.fileUrl && (
                      <span className="text-sm text-gray-500">
                        Fichier actuel: {selectedLesson.fileUrl.split('/').pop()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Image de couverture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image de couverture
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {selectedLesson.coverImage && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img
                          src={getLessonImageUrl(selectedLesson.coverImage)}
                          alt="Couverture actuelle"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer du modal */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowLessonModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('💾 Sauvegarde de la leçon:', selectedLesson);
                  setShowLessonModal(false);
                  // TODO: Implémenter la sauvegarde
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Message de succès */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-[10001] bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-in slide-in-from-right duration-300">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="flex-shrink-0 ml-4 text-green-200 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modal de configuration du Quiz - Rendu via portail pour éviter les restrictions CSS */}
      {showQuizModal && typeof document !== 'undefined' && createPortal(
        <QuizConfigModal
          isOpen={showQuizModal}
          formationId={formation.id}
          existingQuiz={quiz ? {
            id: quiz.id,
            formationId: quiz.formationId,
            title: quiz.title,
            description: quiz.description,
            passingScore: quiz.passingScore,
            timeLimit: quiz.timeLimit,
            isActive: quiz.isActive,
            createdAt: quiz.createdAt,
            updatedAt: quiz.updatedAt,
            questions: quiz.questions
          } : undefined}
          onClose={() => setShowQuizModal(false)}
          onSave={handleSaveQuiz}
        />,
        document.body
      )}

      {/* Modal de récapitulatif du quiz */}
      {showQuizRecap && quiz && lastAttempt && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10002] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-brand-blue text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Récapitulatif du quiz</h2>
                  <p className="text-purple-100">{quiz.title}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span>Score: {lastAttempt.score}%</span>
                    <span>•</span>
                    <span>{lastAttempt.isPassed ? '✓ Réussi' : '✗ Échoué'}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowQuizRecap(false);
                    setSelectedQuestionIndex(null);
                  }}
                  className="text-white hover:text-purple-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedQuestionIndex === null ? (
                <>
                  {/* Grille de questions */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions</h3>
                    <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 gap-2">
                      {quiz.questions.map((question, index) => {
                        // answers peut être soit une string (JSON) soit déjà un objet
                        let userAnswers: Record<string, any> = {};
                        if (lastAttempt.answers) {
                          if (typeof lastAttempt.answers === 'string') {
                            try {
                              userAnswers = JSON.parse(lastAttempt.answers);
                            } catch (e) {
                              userAnswers = {};
                            }
                          } else {
                            userAnswers = lastAttempt.answers as Record<string, any>;
                          }
                        }
                        const userAnswer = userAnswers[question.id];
                        
                        // Vérifier si la réponse est correcte
                        let isCorrect: boolean = false;
                        if (question.type === 'fill_in_blank') {
                          // Phrases à trous : comparer les réponses
                          const expectedAnswers = question.answers.map(a => a.answer.toLowerCase().trim());
                          const userAnswersArray = Array.isArray(userAnswer) 
                            ? userAnswer.map((ans: string) => ans.toLowerCase().trim())
                            : [];
                          isCorrect = expectedAnswers.length > 0 &&
                            expectedAnswers.length === userAnswersArray.length &&
                            expectedAnswers.every((expected, idx) => expected === userAnswersArray[idx]);
                        } else if (question.type === 'multiple_choice') {
                          const correctAnswerIds = question.answers.filter(a => a.isCorrect).map(a => a.id);
                          const userAnswerIds = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                          isCorrect = correctAnswerIds.length > 0 && 
                            correctAnswerIds.every(id => userAnswerIds.includes(id)) &&
                            userAnswerIds.length === correctAnswerIds.length;
                        } else if (question.type === 'true_false') {
                          const correctAnswer = question.answers.find(a => a.isCorrect);
                          isCorrect = Boolean(correctAnswer && userAnswer === correctAnswer.id);
                        }

                        return (
                          <button
                            key={question.id}
                            onClick={() => setSelectedQuestionIndex(index)}
                            className={`w-10 h-10 flex items-center justify-center rounded-md font-semibold text-sm transition-all hover:scale-110 ${
                              isCorrect
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Légende */}
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-gray-700">Réponse correcte</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-gray-700">Réponse incorrecte</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Détail de la question */}
                  <button
                    onClick={() => setSelectedQuestionIndex(null)}
                    className="mb-4 flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Retour à la grille
                  </button>

                  {(() => {
                    const question = quiz.questions[selectedQuestionIndex];
                    // answers peut être soit une string (JSON) soit déjà un objet
                    let userAnswers: Record<string, any> = {};
                    if (lastAttempt.answers) {
                      if (typeof lastAttempt.answers === 'string') {
                        try {
                          userAnswers = JSON.parse(lastAttempt.answers);
                        } catch (e) {
                          userAnswers = {};
                        }
                      } else {
                        userAnswers = lastAttempt.answers as Record<string, any>;
                      }
                    }
                    const userAnswer = question.id ? userAnswers[question.id] : undefined;
                    
                    // Vérifier si la réponse est correcte
                    let isCorrect: boolean = false;
                    if (question.type === 'fill_in_blank') {
                      // Phrases à trous : comparer les réponses
                      const expectedAnswers = question.answers.map(a => a.answer.toLowerCase().trim());
                      const userAnswersArray = Array.isArray(userAnswer) 
                        ? userAnswer.map((ans: string) => ans.toLowerCase().trim())
                        : [];
                      isCorrect = expectedAnswers.length > 0 &&
                        expectedAnswers.length === userAnswersArray.length &&
                        expectedAnswers.every((expected, idx) => expected === userAnswersArray[idx]);
                    } else if (question.type === 'multiple_choice') {
                      const correctAnswerIds = question.answers.filter(a => a.isCorrect).map(a => a.id);
                      const userAnswerIds = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                      isCorrect = correctAnswerIds.length > 0 && 
                        correctAnswerIds.every(id => userAnswerIds.includes(id)) &&
                        userAnswerIds.length === correctAnswerIds.length;
                    } else if (question.type === 'true_false') {
                      const correctAnswer = question.answers.find(a => a.isCorrect);
                      isCorrect = Boolean(correctAnswer && userAnswer === correctAnswer.id);
                    }

                    return (
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              Question {selectedQuestionIndex + 1}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              isCorrect 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {isCorrect ? '✓ Correcte' : '✗ Incorrecte'}
                            </span>
                          </div>
                          <p className="text-lg text-gray-700">{question.question}</p>
                        </div>

                        <div className="space-y-4">
                          {question.type === 'fill_in_blank' ? (
                            // Affichage spécial pour phrases à trous
                            <>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Votre phrase complétée :</h4>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  {(() => {
                                    const parts = question.question.split(/(\{[^}]+)\}/g);
                                    const userAnswersArray = Array.isArray(userAnswer) ? userAnswer : [];
                                    let blankIdx = 0;
                                    
                                    return (
                                      <p className="text-gray-900">
                                        {parts.map((part, idx) => {
                                          if (part.match(/^\{[^}]+$/)) {
                                            const answer = userAnswersArray[blankIdx] || '____';
                                            blankIdx++;
                                            return (
                                              <span key={idx} className="font-medium text-blue-700 underline">
                                                {answer}
                                              </span>
                                            );
                                          }
                                          return <span key={idx}>{part}</span>;
                                        })}
                                      </p>
                                    );
                                  })()}
                                </div>
                              </div>
                              
                              {!isCorrect && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">Phrase correcte :</h4>
                                  <div className="bg-green-50 p-4 rounded-lg">
                                    {(() => {
                                      const parts = question.question.split(/(\{[^}]+)\}/g);
                                      const correctAnswers = question.answers.map(a => a.answer);
                                      let blankIdx = 0;
                                      
                                      return (
                                        <p className="text-gray-900">
                                          {parts.map((part, idx) => {
                                            if (part.match(/^\{[^}]+$/)) {
                                              const answer = correctAnswers[blankIdx] || '';
                                              blankIdx++;
                                              return (
                                                <span key={idx} className="font-medium text-green-700 underline">
                                                  {answer}
                                                </span>
                                              );
                                            }
                                            return <span key={idx}>{part}</span>;
                                          })}
                                        </p>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            // Affichage standard pour choix multiples, vrai/faux, etc.
                            <>
                              {/* Vos réponses */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Vos réponses :</h4>
                                <div className="space-y-2">
                                  {question.answers.map((answer) => {
                                    const userAnswerIds = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                                    const isSelected = userAnswerIds.includes(answer.id);
                                    
                                    return (
                                      <div
                                        key={answer.id}
                                        className={`p-3 rounded-lg border-2 ${
                                          isSelected
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className={isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}>
                                            {answer.answer}
                                          </span>
                                          {isSelected && (
                                            <span className="text-blue-600 font-medium">✓ Sélectionnée</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Bonnes réponses */}
                              {!isCorrect && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">Bonne(s) réponse(s) :</h4>
                                  <div className="space-y-2">
                                    {question.answers
                                      .filter(a => a.isCorrect)
                                      .map((answer) => (
                                        <div
                                          key={answer.id}
                                          className="p-3 rounded-lg border-2 border-green-500 bg-green-50"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900">{answer.answer}</span>
                                            <span className="text-green-600 font-medium">✓ Correcte</span>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
