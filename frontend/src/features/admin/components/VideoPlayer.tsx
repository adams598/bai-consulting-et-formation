// VideoPlayer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { FormationContent } from '../types';

interface VideoPlayerProps {
  lesson: FormationContent;
  fileUrl?: string; // URL du fichier à lire
  onProgressUpdate: (progress: {
    timeSpent: number;
    progress: number;
    completed: boolean;
  }) => void;
}

export default function VideoPlayer({ lesson, fileUrl, onProgressUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Démarrer le suivi du temps quand la vidéo commence
  useEffect(() => {
    if (startTime === null && isPlaying) {
      setStartTime(Date.now());
    }
  }, [isPlaying, startTime]);

  // Mettre à jour la progression
  useEffect(() => {
    if (duration > 0 && currentTime > 0) {
      const progress = (currentTime / duration) * 100;
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      
      onProgressUpdate({
        timeSpent,
        progress,
        completed: progress >= 90 // Considérer comme terminé à 90%
      });
    }
  }, [currentTime, duration, startTime, onProgressUpdate]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const resetVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setStartTime(null);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header de la leçon */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{lesson.title}</h2>
        {lesson.description && (
          <p className="text-gray-600">{lesson.description}</p>
        )}
      </div>

      {/* Lecteur vidéo */}
      <div className="flex-1 flex items-center justify-center relative">
        <video
          ref={videoRef}
          className="max-w-full max-h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        >
          {fileUrl && (
            <source src={fileUrl} type="video/mp4" />
          )}
          Votre navigateur ne supporte pas la lecture de vidéos.
        </video>

        {/* Overlay de contrôle central */}
        {!isPlaying && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 hover:bg-opacity-60 transition-all"
          >
            <div className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all">
              <Play className="h-12 w-12 text-gray-800 ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Contrôles de la vidéo */}
      <div className="bg-white border-t border-gray-200 p-4">
        {/* Barre de progression */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Contrôles principaux */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-gray-700" />
              ) : (
                <Play className="h-5 w-5 text-gray-700" />
              )}
            </button>

            {/* Reset */}
            <button
              onClick={resetVideo}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Recommencer"
            >
              <RotateCcw className="h-5 w-5 text-gray-700" />
            </button>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-gray-700" />
                ) : (
                  <Volume2 className="h-4 w-4 text-gray-700" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Contrôles de droite */}
          <div className="flex items-center space-x-2">
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Maximize className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Styles pour le slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
