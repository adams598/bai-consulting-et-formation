import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Upload, 
  Video, 
  FileText, 
  Layers,
  BookOpen,
  GripVertical
} from 'lucide-react';
import { Formation, FormationType, FormationContent, ContentType, Universe } from '../types';
import { formationsApi } from '../../../api/adminApi';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/use-toast';
import { getFormationCoverImageUrl } from '../../../utils/imageUtils';
import { imageUploadService } from '../../../services/imageUploadService';

interface FormationModalProps {
  formation?: Formation | null;
  onClose: () => void;
  onSave: () => void;
  universeId?: string;
  universes?: Universe[];
}

export const FormationModal: React.FC<FormationModalProps> = ({
  formation,
  onClose,
  onSave,
  universeId,
  universes = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isActive: true,
    hasQuiz: false,
    quizRequired: true,
    coverImage: '',
    // Nouveaux champs dynamiques
    code: '',
    pedagogicalModality: 'E-learning',
    organization: 'SHERPA Developpement',
    prerequisites: 'Aucune connaissance préalable n\'est nécessaire.',
    objectives: '',
    detailedProgram: '',
    targetAudience: '',
    // Nouveau champ pour le type de formation
    isOpportunity: false
  });
  
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const { toast } = useToast();

  const isEditing = !!formation;

  // Fonction pour convertir les JSON en textarea
  const parseJsonToTextarea = (jsonString?: string): string => {
    if (!jsonString) return '';
    
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        return parsed.join('\n');
      }
      return jsonString;
    } catch (error) {
      // Si ce n'est pas du JSON valide, retourner tel quel
      return jsonString;
    }
  };

  useEffect(() => {
    if (formation) {
      // Mode édition : charger les données de la formation existante
      setFormData({
        title: formation.title,
        description: formation.description,
        isActive: formation.isActive,
        hasQuiz: formation.hasQuiz || false,
        quizRequired: formation.quizRequired !== undefined ? formation.quizRequired : true,
        coverImage: formation.coverImage || '',
        // Nouveaux champs dynamiques
        code: formation.code || '',
        pedagogicalModality: formation.pedagogicalModality || 'E-learning',
        organization: formation.organization || 'SHERPA Developpement',
        prerequisites: formation.prerequisites || 'Aucune connaissance préalable n\'est nécessaire.',
        objectives: parseJsonToTextarea(formation.objectives),
        detailedProgram: parseJsonToTextarea(formation.detailedProgram),
        targetAudience: parseJsonToTextarea(formation.targetAudience),
        isOpportunity: formation.isOpportunity || false
      });
      // Initialiser l'univers sélectionné
      setSelectedUniverseId(formation.universeId || '');
    } else {
      // Mode création : réinitialiser complètement l'état
      setFormData({
        title: '',
        description: '',
        isActive: true,
        hasQuiz: false,
        quizRequired: true,
        coverImage: '',
        // Nouveaux champs dynamiques
        code: '',
        pedagogicalModality: 'E-learning',
        organization: 'SHERPA Developpement',
        prerequisites: 'Aucune connaissance préalable n\'est nécessaire.',
        objectives: '',
        detailedProgram: '',
        targetAudience: '',
        isOpportunity: false
      });
      setCoverImageFile(null);
      setSelectedUniverseId('');
    }
  }, [formation]);

  // Mettre à jour isOpportunity quand l'univers change
  useEffect(() => {
    const isOpportunity = selectedUniverseId === 'opportunites-commerciales';
    setFormData(prev => ({
      ...prev,
      isOpportunity
    }));
  }, [selectedUniverseId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier que le titre est saisi avant de permettre l'upload
      if (!formData.title || formData.title.trim() === '') {
        toast({
          title: "Attention",
          description: "Veuillez d'abord saisir le titre de la formation",
          variant: "destructive",
        });
        e.target.value = ''; // Réinitialiser l'input
        return;
      }
      
      console.log('🔍 handleCoverImageChange - Titre de la formation:', formData.title);
      
      setCoverImageFile(file);
      // Créer une URL temporaire pour l'aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          coverImage: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCoverImage = async (file: File): Promise<string> => {
    try {
      // Vérifier que le titre est présent
      if (!formData.title || formData.title.trim() === '') {
        throw new Error('Le titre de la formation est requis avant l\'upload de l\'image');
      }
      
      console.log('🔍 uploadCoverImage - Titre de la formation:', formData.title);
      
      // Utiliser le service d'upload avec le titre de la formation
      const imageUrl = await imageUploadService.uploadFormationCoverImage(file, formData.title);
      return imageUrl;
    } catch (error) {
      console.error('Erreur upload image:', error);
      throw error;
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le format MP4
      if (!file.type.includes('video/mp4')) {
        toast({
          title: "Format non supporté",
          description: "Seuls les fichiers MP4 sont acceptés",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      
      setVideoFile(file);
    }
  };

  // Fonction pour convertir les textareas en JSON
  const processFormData = (data: any) => {
    const processed = { ...data };
    
    // Convertir les textareas en JSON arrays
    if (processed.objectives) {
      const objectivesArray = processed.objectives
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
      processed.objectives = JSON.stringify(objectivesArray);
    }
    
    if (processed.detailedProgram) {
      const programArray = processed.detailedProgram
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
      processed.detailedProgram = JSON.stringify(programArray);
    }
    
    if (processed.targetAudience) {
      const audienceArray = processed.targetAudience
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
      processed.targetAudience = JSON.stringify(audienceArray);
    }
    
    return processed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

        try {
          // Validation : s'assurer qu'un univers est sélectionné
          if (!selectedUniverseId && !universeId) {
            setErrors({ universe: 'Veuillez sélectionner un univers' });
            toast({
              title: "Erreur",
              description: "Veuillez sélectionner un univers pour cette formation",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }

          // Validation : s'assurer qu'une formation appartient soit à un univers soit aux opportunités commerciales
          if (!formData.isOpportunity && !selectedUniverseId && !universeId) {
            toast({
              title: "Erreur",
              description: "Veuillez sélectionner un univers pour cette formation",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }

      // Validation : pour les formations d'univers, description et objectifs sont obligatoires
      if (!formData.isOpportunity) {
        if (!formData.description.trim()) {
          toast({
            title: "Erreur",
            description: "La description est obligatoire pour les formations d'univers",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        if (!formData.objectives.trim()) {
          toast({
            title: "Erreur",
            description: "Les objectifs pédagogiques sont obligatoires pour les formations d'univers",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      let finalFormData = processFormData(formData);
      let createdFormationId: string | null = null;
      
      // Créer ou mettre à jour la formation d'abord
      if (isEditing && formation) {
        // Mode édition : upload de l'image avant la mise à jour
        if (coverImageFile) {
          setIsUploadingImage(true);
          try {
            const imageUrl = await uploadCoverImage(coverImageFile);
            finalFormData.coverImage = imageUrl;
          } catch (error) {
            toast({
              title: "Erreur",
              description: "Erreur lors de l'upload de l'image de couverture",
              variant: "destructive",
            });
            setIsLoading(false);
            setIsUploadingImage(false);
            return;
          } finally {
            setIsUploadingImage(false);
          }
        }
        
        await formationsApi.updateFormation(formation.id, {
          ...finalFormData,
          universeId: formData.isOpportunity ? null : (selectedUniverseId || universeId),
          isOpportunity: formData.isOpportunity
        });
        toast({
          title: "Succès",
          description: "Formation mise à jour avec succès",
        });
      } else {
        // Mode création : créer la formation d'abord, puis uploader l'image
        const newFormation = await formationsApi.createFormation({
          ...finalFormData,
          universeId: formData.isOpportunity ? null : (selectedUniverseId || universeId),
          isOpportunity: formData.isOpportunity
        });
        createdFormationId = newFormation.data.data.id;
        
        // Upload de l'image de couverture après la création
        if (coverImageFile) {
          setIsUploadingImage(true);
          try {
            const imageUrl = await uploadCoverImage(coverImageFile);
            
            // Mettre à jour la formation avec l'image de couverture
            if (createdFormationId) {
              await formationsApi.updateFormation(createdFormationId, {
                ...finalFormData,
                coverImage: imageUrl
              });
            }
            
            toast({
              title: "Succès",
              description: "Formation créée avec succès et image uploadée",
            });
          } catch (error) {
            console.error('Erreur upload image après création:', error);
            toast({
              title: "Attention",
              description: "Formation créée mais erreur lors de l'upload de l'image",
              variant: "destructive",
            });
          } finally {
            setIsUploadingImage(false);
          }
        } else {
          toast({
            title: "Succès",
            description: "Formation créée avec succès",
          });
        }
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Modifier la formation' : 'Nouvelle formation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Titre de la formation"
              required
            />
          </div>

          {/* Sélection de l'univers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Univers *
            </label>
            <select
              value={selectedUniverseId}
              onChange={(e) => {
                setSelectedUniverseId(e.target.value);
                // Mettre à jour isOpportunity selon l'univers sélectionné
                const isOpportunity = e.target.value === 'opportunites-commerciales';
                handleInputChange('isOpportunity', isOpportunity);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionnez un univers</option>
              {universes.map((universe) => (
                <option key={universe.id} value={universe.id}>
                  {universe.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description {!formData.isOpportunity && '*'}
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description de la formation"
              rows={3}
              required={!formData.isOpportunity}
            />
            {formData.isOpportunity && (
              <p className="text-xs text-gray-500 mt-1">
                Optionnel pour les formations d'opportunités commerciales
              </p>
            )}
          </div>

          {/* Nouveaux champs dynamiques - cachés pour les formations d'opportunités */}
          {!formData.isOpportunity && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code Formation
                  </label>
                  <Input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="Ex: NL001008"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modalité Pédagogique
                  </label>
                  <select
                    value={formData.pedagogicalModality}
                    onChange={(e) => handleInputChange('pedagogicalModality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="E-learning">E-learning</option>
                    <option value="Présentiel">Présentiel</option>
                    <option value="Hybride">Hybride</option>
                    <option value="Webinaire">Webinaire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organisme de Formation
                </label>
                <Input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  placeholder="Ex: SHERPA Developpement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prérequis
                </label>
                <Textarea
                  value={formData.prerequisites}
                  onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                  placeholder="Ex: Aucune connaissance préalable n'est nécessaire."
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Champ vidéo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vidéo de formation (MP4 uniquement)
            </label>
            <input
              type="file"
              accept=".mp4,video/mp4"
              onChange={handleVideoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {videoFile && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Fichier sélectionné: {videoFile.name}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Seuls les fichiers MP4 sont acceptés. Un seul fichier par formation.
            </p>
          </div>

          {/* Objectifs pédagogiques - cachés pour les formations d'opportunités */}
          {!formData.isOpportunity && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objectifs Pédagogiques (un par ligne) *
              </label>
              <Textarea
                value={formData.objectives}
                onChange={(e) => handleInputChange('objectives', e.target.value)}
                placeholder="Ex:&#10;• Qualifier une opportunité d'achat&#10;• Guider les clients dans leur décision&#10;• Optimiser la mise en relation"
                rows={4}
                required={true}
              />
            </div>
          )}

          {/* Programme détaillé et public cible - cachés pour les formations d'opportunités */}
          {!formData.isOpportunity && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programme Détaillé (un par ligne)
                </label>
                <Textarea
                  value={formData.detailedProgram}
                  onChange={(e) => handleInputChange('detailedProgram', e.target.value)}
                  placeholder="Ex:&#10;1. Introduction&#10;2. Comprendre l'immobilier locatif&#10;3. Rôle du conseiller&#10;4. Bon à savoir"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Concerné (un par ligne)
                </label>
                <Textarea
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  placeholder="Ex:&#10;Chargé de clientèle&#10;particuliers&#10;Conseiller clientèle&#10;Téléconseiller"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Image de couverture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image de couverture
            </label>
            <div className="space-y-3">
              {/* Aperçu de l'image actuelle */}
              {formData.coverImage && (
                <div className="relative">
                  <img
                    src={getFormationCoverImageUrl(formData.coverImage)}
                    alt="Aperçu de la couverture"
                    className="w-32 h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, coverImage: '' }));
                      setCoverImageFile(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* Upload de nouvelle image */}
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {isUploadingImage && (
                  <div className="text-sm text-blue-600">Upload en cours...</div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Formats acceptés : JPG, PNG, GIF. Taille recommandée : 800x600px
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Formation active
                </span>
              </label>
            </div>


          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration du quiz</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.hasQuiz}
                    onChange={(e) => handleInputChange('hasQuiz', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Inclure un quiz de validation
                  </span>
                </label>
              </div>

              {formData.hasQuiz && (
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.quizRequired}
                      onChange={(e) => handleInputChange('quizRequired', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Quiz obligatoire pour valider
                    </span>
                  </label>
                </div>
              )}
            </div>

            {formData.hasQuiz && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Le quiz sera configuré après la création de la formation. 
                  Vous pourrez ajouter des questions, définir le seuil de réussite (80% par défaut) 
                  et configurer le temps limite.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Sauvegarde...' : (isEditing ? 'Mettre à jour' : 'Créer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 