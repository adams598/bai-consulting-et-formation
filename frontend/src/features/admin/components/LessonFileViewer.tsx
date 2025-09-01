import React, { useState } from 'react';
import { Download, FileText, Play, Eye, AlertCircle, Link } from 'lucide-react';
import { FormationContent } from '../types';
import { getLessonFileUrl } from '../../../utils/imageUtils';
import '../styles/admin-typography.css';

interface LessonFileViewerProps {
  lesson: FormationContent;
  formationTitle: string;
}

const LessonFileViewer: React.FC<LessonFileViewerProps> = ({
  lesson,
  formationTitle
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extraire les informations du fichier depuis les métadonnées
  const getFileInfo = () => {
    if (!lesson.metadata) return null;
    
    try {
      const metadata = JSON.parse(lesson.metadata);
      return {
        contentUrl: metadata.contentUrl,
        attachedFile: metadata.attachedFile,
        contentType: metadata.contentType
      };
    } catch (e) {
      console.error('Erreur lors du parsing des métadonnées:', e);
      return null;
    }
  };

  const fileInfo = getFileInfo();

  // Déterminer le type de contenu et l'icône appropriée
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'PRESENTATION':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'VIDEO':
        return <Play className="h-5 w-5 text-green-600" />;
      case 'DOCUMENT':
        return <FileText className="h-5 w-5 text-blue-700" />;
      case 'INTERACTIVE':
        return <Eye className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  // Gérer le téléchargement du fichier
  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construire l'URL de téléchargement (utilise automatiquement le fichier le plus récent)
      const downloadUrl = getLessonFileUrl(
        formationTitle,
        lesson.title
      );

      if (!downloadUrl) {
        throw new Error('Impossible de construire l\'URL de téléchargement');
      }

      // Créer un lien temporaire pour le téléchargement
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'lecon'; // Nom générique car on récupère le fichier le plus récent
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      setError('Erreur lors du téléchargement du fichier');
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer l'ouverture du fichier dans un nouvel onglet
  const handleOpenFile = () => {
    try {
      const fileUrl = getLessonFileUrl(
        formationTitle,
        lesson.title
      );

      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
    } catch (err) {
      console.error('Erreur lors de l\'ouverture du fichier:', err);
      setError('Erreur lors de l\'ouverture du fichier');
    }
  };

  // Si pas de métadonnées, on continue quand même car on récupère automatiquement le fichier le plus récent
  // Les métadonnées ne sont plus nécessaires pour le fonctionnement

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* En-tête avec icône et titre */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {getContentIcon(lesson.type)}
          <div className="ml-3">
            <h3 className="admin-card-title admin-title-spacing">
              {lesson.title}
            </h3>
            <p className="admin-text-sm admin-badge text-gray-600">
              {lesson.type} • {lesson.duration ? `${lesson.duration} min` : 'Durée non définie'}
            </p>
          </div>
        </div>
      </div>

      {/* Informations du fichier */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-4 w-4 text-gray-500 mr-2" />
            <span className="admin-text-sm text-gray-700">
              {fileInfo?.attachedFile ? `Fichier: ${fileInfo.attachedFile}` : 'Fichier le plus récent de la leçon'}
            </span>
          </div>
          <span className="admin-badge bg-blue-100 text-blue-800">
            {fileInfo?.attachedFile ? 'Fichier joint' : 'Fichier automatique'}
          </span>
        </div>
        {fileInfo?.contentUrl && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <a
              href={fileInfo.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 admin-text-sm"
            >
              <Link className="h-4 w-4 mr-1" />
              URL externe disponible
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center admin-button"
        >
          <Download className="h-4 w-4 mr-2" />
          {isLoading ? 'Téléchargement...' : 'Télécharger'}
        </button>
        
        <button
          onClick={handleOpenFile}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center admin-button"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ouvrir
        </button>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="admin-text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Description de la leçon */}
      {lesson.description && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="admin-text-md font-medium text-gray-900 mb-2">
            Description
          </h4>
          <p className="admin-text-sm text-gray-700">{lesson.description}</p>
        </div>
      )}
    </div>
  );
};

export default LessonFileViewer;
