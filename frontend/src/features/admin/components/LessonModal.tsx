import React, { useState, useEffect } from 'react';
import { X, Upload, Link, Save, Loader2, BookOpen } from 'lucide-react';
import { FormationContent } from '../types';
import { uploadService } from '../../../services/imageUploadService';
import { getLessonImageUrl } from '../../../utils/imageUtils';
import '../../../components/LessonModal.css';
import LessonDuration from './LessonDuration';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FormationContent>) => void;
  formationId: string;
  formationTitle: string; // Nouveau : titre de la formation pour la structure des dossiers
  sectionId?: string | null;
  existingLesson?: FormationContent | null;
}

const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formationId,
  formationTitle,
  sectionId,
  existingLesson
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PRESENTATION',
    duration: '00:30' as string, // Format HH:MM au lieu de minutes
    order: 0,
    contentUrl: '',
    contentFile: null as File | null,
    contentFileUrl: '', // URL du fichier joint uploadé
    coverImage: '',
    coverImageFile: null as File | null,
    coverImageUrl: '', // URL permanente de l'image
    learningObjectives: ''
  });

  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (existingLesson) {
      // Convertir les minutes en format HH:MM
      const convertMinutesToTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      };
      
      setFormData({
        title: existingLesson.title || '',
        description: existingLesson.description || '',
        type: existingLesson.type || 'PRESENTATION',
        duration: convertMinutesToTime(existingLesson.duration || 30), // Convertir en HH:MM
        order: existingLesson.order || 0,
        contentUrl: (existingLesson.metadata as any)?.contentUrl || '',
        contentFile: null,
        contentFileUrl: '', // Ajouter cette propriété manquante
        coverImage: existingLesson.coverImage || '',
        coverImageFile: null,
        coverImageUrl: existingLesson.coverImage || '', // URL permanente = aperçu actuel
        learningObjectives: (existingLesson.metadata as any)?.learningObjectives || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'PRESENTATION',
        duration: '00:30', // Format HH:MM par défaut
        order: 0,
        contentUrl: '',
        contentFile: null,
        contentFileUrl: '', // Ajouter cette propriété manquante
        coverImage: '',
        coverImageFile: null,
        coverImageUrl: '',
        learningObjectives: ''
      });
    }
  }, [existingLesson]);

  // Vérifier les fichiers existants quand le titre change
  useEffect(() => {
    if (formData.title.trim() && formationTitle) {
      checkExistingFiles();
    } else {
      setExistingFiles([]);
    }
  }, [formData.title, formationTitle]);

  // Fonction pour vérifier les fichiers existants
  const checkExistingFiles = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/upload/check-lesson-files/${encodeURIComponent(formationTitle)}/${encodeURIComponent(formData.title)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setExistingFiles(data.data.files || []);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des fichiers existants:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    // Convertir le format HH:MM en minutes
    const convertTimeToMinutes = (timeString: string): number => {
      if (!timeString || typeof timeString !== 'string') return 0;
      const [hours, minutes] = timeString.split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    };
    
    const lessonData = {
      ...formData,
      duration: convertTimeToMinutes(formData.duration as string), // Convertir en minutes
      sectionId: sectionId || undefined,
      coverImage: formData.coverImageUrl || formData.coverImage, // Utiliser l'URL permanente si disponible
      metadata: JSON.stringify({
        contentUrl: formData.contentUrl || formData.contentFileUrl, // Utiliser l'URL du fichier joint si disponible
        learningObjectives: formData.learningObjectives,
        contentType: uploadMethod,
        attachedFile: formData.contentFileUrl // Ajouter l'URL du fichier joint
      })
    };
    
    onSave(lessonData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, contentFile: file });
    }
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier que le titre de la leçon est saisi avant l'upload
      if (!formData.title || formData.title.trim() === '') {
        alert('Veuillez d\'abord saisir le titre de la leçon avant d\'ajouter une image de couverture');
        e.target.value = ''; // Réinitialiser l'input
        return;
      }
      
      try {
        console.log('📸 Début de l\'upload de l\'image:', file.name, file.size, file.type);
        console.log('🔍 Upload image - Titre leçon:', formData.title);
        console.log('🔍 Upload image - Formation:', formationTitle);
        
        setIsUploadingImage(true);
        setFormData({ ...formData, coverImageFile: file });
        
        // Créer un aperçu immédiat avec FileReader
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewUrl = e.target?.result as string;
          // Garder l'aperçu temporaire pour l'affichage immédiat
          setFormData(prev => ({ ...prev, coverImage: previewUrl }));
          
          // Upload de l'image en arrière-plan après avoir créé l'aperçu
          uploadImageInBackground(file, previewUrl);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('❌ Erreur lors de l\'upload de l\'image:', error);
        // L'aperçu temporaire reste affiché en cas d'erreur
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // Gestion de l'upload des fichiers joints
  const handleContentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier que le titre de la leçon est saisi avant l'upload
      if (!formData.title || formData.title.trim() === '') {
        alert('Veuillez d\'abord saisir le titre de la leçon avant d\'ajouter un fichier joint');
        e.target.value = ''; // Réinitialiser l'input
        return;
      }
      
      console.log('🔍 Upload fichier joint - Titre leçon:', formData.title);
      console.log('🔍 Upload fichier joint - Formation:', formationTitle);
      
      // Vérifier s'il y a des fichiers existants
      if (existingFiles.length > 0) {
        setPendingFile(file);
        setShowReplaceConfirm(true);
        e.target.value = ''; // Réinitialiser l'input
        return;
      }
      
      // Pas de fichier existant, procéder à l'upload
      await uploadFile(file);
    }
  };

  // Fonction pour uploader un fichier
  const uploadFile = async (file: File) => {
    try {
      console.log('🔍 Upload fichier joint - Titre leçon:', formData.title);
      console.log('🔍 Upload fichier joint - Formation:', formationTitle);
      
      // Upload du fichier joint avec la nouvelle structure
      const fileUrl = await uploadService.uploadLessonFile(file, formationTitle, formData.title);
      
      setFormData(prev => ({
        ...prev,
        contentFile: file,
        contentFileUrl: fileUrl
      }));
      
      console.log('✅ Fichier joint uploadé:', fileUrl);
    } catch (error) {
      console.error('❌ Erreur upload fichier joint:', error);
      alert('Erreur lors de l\'upload du fichier joint');
    }
  };

  // Fonction pour confirmer le remplacement
  const confirmReplace = async () => {
    if (!pendingFile) return;
    
    try {
      // Supprimer les fichiers existants
      const response = await fetch(
        `http://localhost:3000/api/admin/upload/delete-lesson-files/${encodeURIComponent(formationTitle)}/${encodeURIComponent(formData.title)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      
      if (response.ok) {
        // Uploader le nouveau fichier
        await uploadFile(pendingFile);
        setExistingFiles([]);
      } else {
        alert('Erreur lors de la suppression des fichiers existants');
      }
    } catch (error) {
      console.error('❌ Erreur lors du remplacement:', error);
      alert('Erreur lors du remplacement du fichier');
    } finally {
      setShowReplaceConfirm(false);
      setPendingFile(null);
    }
  };

  // Fonction séparée pour l'upload en arrière-plan
  const uploadImageInBackground = async (file: File, previewUrl: string) => {
    try {
      // Upload de l'image et récupération de l'URL permanente
      console.log('🚀 Upload vers le serveur...');
      const permanentImageUrl = await uploadService.uploadLessonCoverImage(file, formationTitle, formData.title);
      console.log('✅ Image uploadée avec succès, URL permanente:', permanentImageUrl);
      
      // Stocker l'URL permanente séparément, garder l'aperçu visible
      setFormData(prev => ({ 
        ...prev, 
        coverImage: previewUrl, // Garder l'aperçu visible
        coverImageUrl: permanentImageUrl // Stocker l'URL permanente séparément
      }));
      
      console.log('🖼️ Aperçu temporaire gardé pour l\'affichage, URL permanente stockée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload en arrière-plan:', error);
    }
  };

  const handleCoverImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, coverImage: e.target.value });
  };

  if (!isOpen) return null;

  const lessonTypes = [
    { value: 'PRESENTATION', label: 'Présentation', icon: '📊' },
    { value: 'VIDEO', label: 'Vidéo', icon: '🎥' },
    { value: 'DOCUMENT', label: 'Document', icon: '📄' },
    { value: 'INTERACTIVE', label: 'Interactif', icon: '🔄' }
  ];

  return (
    <div className="fixed inset-0 lesson-modal-overlay flex items-center justify-center z-50">
      <div className="lesson-modal-content bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6" />
              <h2 className="text-xl font-semibold font-sans">
                {existingLesson ? 'Modifier la leçon' : 'Nouvelle leçon'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre et description */}
          <div className="lesson-section">
            <h3>Informations de base</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="title" className="lesson-label">
                  Titre de la leçon
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="lesson-input"
                  placeholder="Titre de la leçon"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="order" className="lesson-label">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  id="order"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="lesson-input"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="lesson-label">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="lesson-input resize-none"
                placeholder="Description de la leçon..."
              />
            </div>
          </div>

          {/* Durée */}
          <div className="lesson-section">
            <h3>Durée de la leçon</h3>
            
            <LessonDuration
              value={formData.duration}
              onChange={(value) => setFormData({ ...formData, duration: value })}
            />
          </div>

          {/* Objectifs d'apprentissage */}
          <div className="lesson-section">
            <h3>Objectifs d'apprentissage</h3>
            
            <textarea
              id="learningObjectives"
              value={formData.learningObjectives}
              onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
              rows={3}
              className="lesson-input resize-none"
              placeholder="Ce que l'apprenant saura faire à la fin de cette leçon..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Décrivez les compétences et connaissances que l'apprenant acquerra
            </p>
          </div>

          {/* Image de couverture */}
          <div className="lesson-section">
            <h3>Image de couverture</h3>
            
            <div className="space-y-4">
              {/* Aperçu de l'image actuelle */}
              {formData.coverImage && (
                <div className="relative inline-block">
                  <img 
                    src={getLessonImageUrl(formData.coverImage)} 
                    alt="Aperçu de la couverture" 
                    className="w-32 h-20 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImage: '', coverImageFile: null })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    title="Supprimer l'image"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* Upload d'image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="file"
                    id="coverImageFile"
                    onChange={handleCoverImageChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isUploadingImage}
                  />
                  <label htmlFor="coverImageFile" className={`cursor-pointer block ${isUploadingImage ? 'opacity-50' : ''}`}>
                    <div className="lesson-drag-zone">
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-spin" />
                          <p className="text-blue-600 text-sm font-medium">
                            Upload en cours...
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm">
                            <span className="text-blue-600 font-medium">Cliquez pour sélectionner</span> une image
                          </p>
                        </>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, GIF (max 5MB)
                      </p>
                    </div>
                  </label>
                </div>
                
                <div>
                  <label htmlFor="coverImageUrl" className="lesson-label">
                    Ou entrez une URL d'image
                  </label>
                  <input
                    type="url"
                    id="coverImageUrl"
                    value={formData.coverImage}
                    onChange={handleCoverImageUrlChange}
                    className="lesson-input"
                    placeholder="https://exemple.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL directe vers l'image
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu de la leçon */}
          <div className="lesson-section">
            <h3>Contenu de la leçon</h3>
            
            {/* Méthode d'upload */}
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setUploadMethod('file')}
                className={`upload-method-btn ${uploadMethod === 'file' ? 'active' : ''}`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Fichier
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`upload-method-btn ${uploadMethod === 'url' ? 'active' : ''}`}
              >
                <Link className="h-4 w-4 inline mr-2" />
                URL
              </button>
            </div>

            {/* Upload de fichier */}
            {uploadMethod === 'file' && (
              <div>
                <label htmlFor="contentFile" className="lesson-label">
                  Fichier de la leçon
                </label>
                
                {/* Affichage des fichiers existants */}
                {existingFiles.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-yellow-800 text-sm font-medium">⚠️ Fichier(s) existant(s)</span>
                    </div>
                    <div className="space-y-2">
                      {existingFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-yellow-700">{file.name}</span>
                          <span className="text-yellow-600">({Math.round(file.size / 1024)} KB)</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                      Si vous ajoutez un nouveau fichier, l'ancien sera remplacé.
                    </p>
                  </div>
                )}
                
                <div className="lesson-drag-zone">
                  <input
                    type="file"
                    id="contentFile"
                    onChange={handleContentFileChange}
                    className="hidden"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.avi,.mov"
                  />
                  <label htmlFor="contentFile" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      <span className="text-blue-600 font-medium">Cliquez pour sélectionner</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, PowerPoint, Word, Vidéo (max 50MB)
                    </p>
                  </label>
                </div>
                {formData.contentFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Fichier sélectionné: {formData.contentFile.name}
                  </p>
                )}
                {formData.contentFileUrl && (
                  <p className="text-sm text-blue-600 mt-2">
                    ✓ Fichier uploadé: <a href={formData.contentFileUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">{formData.contentFileUrl.split('/').pop()}</a>
                  </p>
                )}
              </div>
            )}

            {/* URL */}
            {uploadMethod === 'url' && (
              <div>
                <label htmlFor="contentUrl" className="lesson-label">
                  URL du contenu
                </label>
                <input
                  type="url"
                  id="contentUrl"
                  value={formData.contentUrl}
                  onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                  className="lesson-input"
                  placeholder="https://example.com/content"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lien vers le contenu de la leçon (YouTube, Google Drive, etc.)
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="lesson-btn lesson-btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="lesson-btn lesson-btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{existingLesson ? 'Modifier' : 'Créer'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modale de confirmation de remplacement */}
      {showReplaceConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-yellow-600 text-2xl">⚠️</span>
              <h3 className="text-lg font-semibold text-gray-900">
                Remplacer le fichier existant ?
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-3">
                Cette leçon contient déjà {existingFiles.length} fichier(s) :
              </p>
              <div className="bg-gray-50 p-3 rounded border">
                {existingFiles.map((file, index) => (
                  <div key={index} className="text-sm text-gray-700 mb-1">
                    • {file.name} ({Math.round(file.size / 1024)} KB)
                  </div>
                ))}
              </div>
              <p className="text-red-600 text-sm mt-2">
                ⚠️ L'ancien fichier sera définitivement supprimé !
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowReplaceConfirm(false);
                  setPendingFile(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmReplace}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remplacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonModal;

