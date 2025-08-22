import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, Upload, Link, Loader2 } from 'lucide-react';
import { FormationContent } from '../types';
import { uploadService } from '../../../services/imageUploadService';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FormationContent>) => void;
  formationId: string;
  sectionId?: string | null;
  existingLesson?: FormationContent | null;
}

const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formationId,
  sectionId,
  existingLesson
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PRESENTATION',
    duration: 30,
    order: 0,
    contentUrl: '',
    contentFile: null as File | null,
    coverImage: '',
    coverImageFile: null as File | null,
    coverImageUrl: '', // URL permanente de l'image
    learningObjectives: ''
  });

  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (existingLesson) {
      setFormData({
        title: existingLesson.title || '',
        description: existingLesson.description || '',
        type: existingLesson.type || 'PRESENTATION',
        duration: existingLesson.duration || 30,
        order: existingLesson.order || 0,
        contentUrl: (existingLesson.metadata as any)?.contentUrl || '',
        contentFile: null,
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
        duration: 30,
        order: 0,
        contentUrl: '',
        contentFile: null,
        coverImage: '',
        coverImageFile: null,
        coverImageUrl: '',
        learningObjectives: ''
      });
    }
  }, [existingLesson]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    const lessonData = {
      ...formData,
      sectionId: sectionId || undefined,
      coverImage: formData.coverImageUrl || formData.coverImage, // Utiliser l'URL permanente si disponible
      metadata: JSON.stringify({
        contentUrl: formData.contentUrl,
        learningObjectives: formData.learningObjectives,
        contentType: uploadMethod
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
      try {
        console.log('📸 Début de l\'upload de l\'image:', file.name, file.size, file.type);
        setIsUploadingImage(true);
        setFormData({ ...formData, coverImageFile: file });
        
        // Créer un aperçu immédiat avec FileReader (comme AvatarUpload)
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

  // Fonction séparée pour l'upload en arrière-plan
  const uploadImageInBackground = async (file: File, previewUrl: string) => {
    try {
      // Upload de l'image et récupération de l'URL permanente
      console.log('🚀 Upload vers le serveur...');
      const permanentImageUrl = await uploadService.uploadLessonImage(file, formData.title || 'sans-titre');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
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
          {/* Titre et Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Titre de la leçon *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                placeholder="Ex: Introduction aux concepts de base"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Type de contenu *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
              >
                {lessonTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all resize-none"
              placeholder="Description détaillée de la leçon..."
            />
          </div>

          {/* Image de couverture */}
          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
              Image de couverture
            </label>
            <div className="space-y-3">
              {/* Aperçu de l'image actuelle */}
              {formData.coverImage && (
                <div className="relative">
                  <img 
                    src={formData.coverImage} 
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
              <div className="flex space-x-3">
                <div className="flex-1">
                  <input
                    type="file"
                    id="coverImageFile"
                    onChange={handleCoverImageChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isUploadingImage}
                  />
                  <label htmlFor="coverImageFile" className={`cursor-pointer ${isUploadingImage ? 'opacity-50' : ''}`}>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors">
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="h-8 w-8 text-green-600 mx-auto mb-2 animate-spin" />
                          <p className="text-green-600 text-sm font-medium">
                            Upload en cours...
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm">
                            <span className="text-green-600 font-medium">Cliquez pour sélectionner</span> une image
                          </p>
                        </>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, GIF (max 5MB)
                      </p>
                    </div>
                  </label>
                </div>
                
                <div className="flex-1">
                  <input
                    type="url"
                    id="coverImageUrl"
                    value={formData.coverImage}
                    onChange={handleCoverImageUrlChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                    placeholder="Ou entrez une URL d'image..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL directe vers l'image
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Objectifs d'apprentissage */}
          <div>
            <label htmlFor="learningObjectives" className="block text-sm font-medium text-gray-700 mb-2">
              Objectifs d'apprentissage
            </label>
            <textarea
              id="learningObjectives"
              value={formData.learningObjectives}
              onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all resize-none"
              placeholder="Ce que l'apprenant saura faire à la fin de cette leçon..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Décrivez les compétences et connaissances que l'apprenant acquerra
            </p>
          </div>

          {/* Durée et Ordre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Durée estimée (minutes)
              </label>
              <input
                type="number"
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                min="1"
                max="480"
              />
              <p className="text-xs text-gray-500 mt-1">
                Durée estimée pour compléter cette leçon
              </p>
            </div>

            <div>
              <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
                Ordre d'affichage
              </label>
              <input
                type="number"
                id="order"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Position de la leçon dans la section
              </p>
            </div>
          </div>

          {/* Contenu de la leçon */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contenu de la leçon</h3>
            
            {/* Méthode d'upload */}
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setUploadMethod('file')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  uploadMethod === 'file'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Fichier
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  uploadMethod === 'url'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Link className="h-4 w-4 inline mr-2" />
                URL
              </button>
            </div>

            {/* Upload de fichier */}
            {uploadMethod === 'file' && (
              <div>
                <label htmlFor="contentFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier de la leçon
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  <input
                    type="file"
                    id="contentFile"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.avi,.mov"
                  />
                  <label htmlFor="contentFile" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      <span className="text-green-600 font-medium">Cliquez pour sélectionner</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, PowerPoint, Word, Vidéo (max 100MB)
                    </p>
                  </label>
                </div>
                {formData.contentFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Fichier sélectionné: {formData.contentFile.name}
                  </p>
                )}
              </div>
            )}

            {/* URL */}
            {uploadMethod === 'url' && (
              <div>
                <label htmlFor="contentUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  URL du contenu
                </label>
                <input
                  type="url"
                  id="contentUrl"
                  value={formData.contentUrl}
                  onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
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
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{existingLesson ? 'Modifier' : 'Créer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonModal;

