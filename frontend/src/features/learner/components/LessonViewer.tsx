import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  FileText,
  Download,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { LearnerLesson, LessonType } from '../types';
import { contentVisitApi } from '../../../api/learnerApi';
import { useToast } from '../../../components/ui/use-toast';

interface LessonViewerProps {
  lesson: LearnerLesson;
  onComplete?: (lessonId: string, timeSpent: number) => void;
  onProgress?: (lessonId: string, progress: number, timeSpent: number) => void;
  autoStart?: boolean;
}

const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  onComplete,
  onProgress,
  autoStart = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(lesson.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();

  const { toast } = useToast();

  useEffect(() => {
    if (autoStart) {
      handlePlay();
    }
    
    // Démarrer le tracking du temps
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const spent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeSpent(spent);
      
      // Sauvegarder la progression toutes les 30 secondes
      if (spent > 0 && spent % 30 === 0) {
        recordVisit(spent, false);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Enregistrer la visite finale
      const finalTimeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (finalTimeSpent > 5) { // Seulement si plus de 5 secondes
        recordVisit(finalTimeSpent, completed);
      }
    };
  }, []);

  useEffect(() => {
    // Vérifier si la leçon est terminée
    if (duration > 0 && currentTime >= duration * 0.9) { // 90% de la durée
      if (!completed) {
        setCompleted(true);
        const finalTimeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        onComplete?.(lesson.id, finalTimeSpent);
        recordVisit(finalTimeSpent, true);
        toast({
          title: "Leçon terminée !",
          description: "Vous avez terminé cette leçon avec succès.",
          duration: 5000
        });
      }
    }
  }, [currentTime, duration, completed]);

  const recordVisit = async (timeSpent: number, completed: boolean) => {
    try {
      await contentVisitApi.recordVisit({
        formationId: lesson.formationId,
        lessonId: lesson.id,
        timeSpent,
        completed
      });
      
      // Notifier la progression
      const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
      onProgress?.(lesson.id, progress, timeSpent);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la visite:', error);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    } else if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    } else if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    } else if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMediaPlayer = () => {
    if (lesson.type === LessonType.VIDEO && lesson.fileUrl) {
      return (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={lesson.fileUrl}
            poster={lesson.coverImage}
            onLoadedMetadata={() => {
              setDuration(videoRef.current?.duration || lesson.duration || 0);
              setLoading(false);
            }}
            onTimeUpdate={() => {
              setCurrentTime(videoRef.current?.currentTime || 0);
            }}
            onEnded={() => {
              setIsPlaying(false);
              setCompleted(true);
            }}
            onError={() => {
              setError('Erreur lors du chargement de la vidéo');
              setLoading(false);
            }}
            className="w-full h-full"
            controls={false}
          />
          
          {/* Contrôles personnalisés */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-300 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              <button onClick={toggleMute} className="text-white hover:text-gray-300">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              
              <button onClick={toggleFullscreen} className="text-white hover:text-gray-300">
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderDocumentViewer = () => {
    if (lesson.type === LessonType.DOCUMENT && lesson.fileUrl) {
      return (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="font-medium">{lesson.title}</span>
            </div>
            <a
              href={lesson.fileUrl}
              download
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Télécharger</span>
            </a>
          </div>
          
          <div className="h-96">
            <iframe
              ref={iframeRef}
              src={`${lesson.fileUrl}#toolbar=0`}
              className="w-full h-full"
              onLoad={() => setLoading(false)}
              onError={() => {
                setError('Erreur lors du chargement du document');
                setLoading(false);
              }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  const renderPresentationViewer = () => {
    if (lesson.type === LessonType.PRESENTATION && lesson.fileUrl) {
      return (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="font-medium">{lesson.title}</span>
            </div>
          </div>
          
          <div className="h-96">
            <iframe
              ref={iframeRef}
              src={lesson.fileUrl}
              className="w-full h-full"
              onLoad={() => setLoading(false)}
              onError={() => {
                setError('Erreur lors du chargement de la présentation');
                setLoading(false);
              }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Chargement de la leçon...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {/* En-tête de la leçon */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{lesson.title}</h2>
            {lesson.description && (
              <p className="text-gray-600 mb-4">{lesson.description}</p>
            )}
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeSpent)} / {formatTime(duration)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>Temps passé: {formatTime(timeSpent)}</span>
              </div>
              {completed && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Terminé</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu de la leçon */}
      <div className="bg-gray-50 rounded-lg p-1">
        {lesson.type === LessonType.VIDEO && renderMediaPlayer()}
        {lesson.type === LessonType.DOCUMENT && renderDocumentViewer()}
        {lesson.type === LessonType.PRESENTATION && renderPresentationViewer()}
        
        {!lesson.fileUrl && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Contenu non disponible</h3>
            <p className="text-gray-600">Le contenu de cette leçon n'est pas encore disponible.</p>
          </div>
        )}
      </div>

      {/* Objectifs de la leçon */}
      {lesson.objectives && lesson.objectives.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Objectifs d'apprentissage</h3>
          <ul className="space-y-2">
            {lesson.objectives.map((objective, index) => (
              <li key={index} className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LessonViewer;
