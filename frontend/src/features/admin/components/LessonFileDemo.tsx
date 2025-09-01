import React from 'react';
import { FormationContent } from '../types';
import LessonFileViewer from './LessonFileViewer';

/**
 * Composant de démonstration pour tester LessonFileViewer
 * Ce composant simule une leçon avec des métadonnées pour tester l'affichage des fichiers
 */
const LessonFileDemo: React.FC = () => {
  // Simulation d'une leçon avec fichier attaché
  const mockLessonWithFile: FormationContent = {
    id: 'demo-lesson-1',
    formationId: 'demo-formation',
    title: 'Introduction à la finance',
    description: 'Cette leçon présente les bases de la finance moderne',
    type: 'PRESENTATION',
    contentType: 'LESSON',
    order: 1,
    duration: 45,
    fileUrl: null,
    fileSize: null,
    coverImage: null,
    metadata: JSON.stringify({
      contentUrl: 'https://example.com/finance-intro',
      attachedFile: 'introduction-finance.pptx',
      contentType: 'file'
    }),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Simulation d'une leçon sans fichier attaché
  const mockLessonWithoutFile: FormationContent = {
    id: 'demo-lesson-2',
    formationId: 'demo-formation',
    title: 'Vidéo de présentation',
    description: 'Vidéo d\'introduction aux concepts',
    type: 'VIDEO',
    contentType: 'LESSON',
    order: 2,
    duration: 30,
    fileUrl: null,
    fileSize: null,
    coverImage: null,
    metadata: JSON.stringify({
      contentUrl: 'https://example.com/video-intro',
      attachedFile: null,
      contentType: 'url'
    }),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="admin-title-xl admin-title-spacing mb-8">
          Démonstration - Affichage des Fichiers de Leçons
        </h1>
        
        <p className="admin-text-lg admin-body-spacing mb-8">
          Ce composant démontre comment les fichiers de leçons sont affichés et gérés.
        </p>

        {/* Leçon avec fichier attaché */}
        <section className="mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-4">
            Leçon avec fichier attaché
          </h2>
          <LessonFileViewer
            lesson={mockLessonWithFile}
            formationTitle="Formation Finance"
          />
        </section>

        {/* Leçon sans fichier attaché */}
        <section className="mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-4">
            Leçon sans fichier attaché (URL externe)
          </h2>
          <LessonFileViewer
            lesson={mockLessonWithoutFile}
            formationTitle="Formation Finance"
          />
        </section>

        {/* Informations techniques */}
        <section className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="admin-title-lg admin-title-spacing mb-4">
            Informations Techniques
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="admin-title-md admin-title-spacing mb-2">
                Structure des métadonnées
              </h3>
              <p className="admin-text-md admin-body-spacing">
                Les métadonnées de chaque leçon contiennent les informations nécessaires pour afficher et gérer les fichiers :
              </p>
              <pre className="bg-gray-100 p-3 rounded text-sm mt-2 overflow-x-auto">
{`{
  "contentUrl": "URL externe (optionnelle)",
  "attachedFile": "nom-du-fichier.ext",
  "contentType": "file" | "url"
}`}
              </pre>
            </div>

            <div>
              <h3 className="admin-title-md admin-title-spacing mb-2">
                Route API de téléchargement
              </h3>
              <p className="admin-text-md admin-body-spacing">
                Les fichiers sont récupérés via l'API : <code className="bg-blue-100 px-2 py-1 rounded">/api/admin/lesson-file/:formationTitle/:lessonTitle/:filename</code>
              </p>
            </div>

            <div>
              <h3 className="admin-title-md admin-title-spacing mb-2">
                Gestion des erreurs
              </h3>
              <p className="admin-text-md admin-body-spacing">
                Le composant gère automatiquement les cas où aucun fichier n'est attaché et propose des alternatives (URL externe).
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LessonFileDemo;
