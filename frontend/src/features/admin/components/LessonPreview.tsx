import React from 'react';
import { FormationContent } from '../types';
import { Clock, FileText, Video, Image } from 'lucide-react';
import { getLessonImageUrl } from '../../../utils/imageUtils';

interface LessonPreviewProps {
  lesson: FormationContent;
  isVisible: boolean;
  position: { x: number; y: number };
}

const LessonPreview: React.FC<LessonPreviewProps> = ({ lesson, isVisible, position }) => {
  if (!isVisible) return null;

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'PRESENTATION':
        return <FileText className="h-4 w-4 text-brand-blue" />;
      case 'VIDEO':
        return <Video className="h-4 w-4 text-green-600" />;
      case 'DOCUMENT':
        return <FileText className="h-4 w-4 text-brand-beige" />;
      case 'INTERACTIVE':
        return <Image className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      {/* En-tête avec icône et titre */}
      <div className="flex items-center space-x-2 mb-3">
        {getContentIcon(lesson.type)}
        <h4 className="font-semibold text-gray-900 text-sm">{lesson.title}</h4>
      </div>

      {/* Description */}
      {lesson.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{lesson.description}</p>
      )}

      {/* Métadonnées */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(lesson.duration || 0)}</span>
        </div>
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
          Ordre: {lesson.order}
        </span>
      </div>

      {/* Image de couverture si disponible */}
      {lesson.coverImage && (
        <div className="mt-3">
          <img
            src={getLessonImageUrl(lesson.coverImage)}
            alt={`Aperçu de ${lesson.title}`}
            className="w-full h-20 object-cover rounded"
          />
        </div>
      )}
    </div>
  );
};

export default LessonPreview;
