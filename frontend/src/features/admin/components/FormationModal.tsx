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
import { Formation, FormationType, FormationContent, ContentType } from '../types';
import { formationsApi } from '../../../api/adminApi';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/use-toast';

interface FormationModalProps {
  formation?: Formation | null;
  onClose: () => void;
  onSave: () => void;
}

export const FormationModal: React.FC<FormationModalProps> = ({
  formation,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: FormationType.MIXED,
    duration: 0,
    isActive: true,
    isMandatory: false,
    content: [] as FormationContent[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  
  const { toast } = useToast();

  const isEditing = !!formation;

  useEffect(() => {
    if (formation) {
      setFormData({
        title: formation.title,
        description: formation.description,
        type: formation.type,
        duration: formation.duration,
        isActive: formation.isActive,
        isMandatory: formation.isMandatory,
        content: formation.content || []
      });
    }
  }, [formation]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContentChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addContent = () => {
    const newContent: FormationContent = {
      id: `temp-${Date.now()}`,
      title: '',
      type: ContentType.VIDEO,
      order: formData.content.length,
      description: '',
      duration: 0
    };
    
    setFormData(prev => ({
      ...prev,
      content: [...prev.content, newContent]
    }));
  };

  const removeContent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index)
    }));
  };

  const moveContent = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const newContent = [...prev.content];
      const [movedItem] = newContent.splice(fromIndex, 1);
      newContent.splice(toIndex, 0, movedItem);
      
      // Mettre à jour l'ordre
      return {
        ...prev,
        content: newContent.map((item, index) => ({ ...item, order: index }))
      };
    });
  };

  const handleFileUpload = async (file: File, contentIndex: number) => {
    if (!formation) {
      toast({
        title: "Erreur",
        description: "Vous devez d'abord sauvegarder la formation",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingFile(`content-${contentIndex}`);
      const response = await formationsApi.uploadContent(
        formation.id,
        file,
        formData.content[contentIndex].type
      );
      
      handleContentChange(contentIndex, 'filePath', response.data.filePath);
      handleContentChange(contentIndex, 'url', response.data.url);
      
      toast({
        title: "Succès",
        description: "Fichier uploadé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'uploader le fichier",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(null);
    }
  };

  const calculateTotalDuration = () => {
    return formData.content.reduce((total, content) => total + (content.duration || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est obligatoire",
        variant: "destructive",
      });
      return;
    }

    if (formData.content.length === 0) {
      toast({
        title: "Erreur",
        description: "Ajoutez au moins un élément de contenu",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const formationData = {
        ...formData,
        duration: calculateTotalDuration(),
        createdBy: 'current-user-id' // TODO: Récupérer l'ID de l'utilisateur connecté
      };

      if (isEditing && formation) {
        await formationsApi.update(formation.id, formationData);
        toast({
          title: "Succès",
          description: "Formation mise à jour avec succès",
        });
      } else {
        await formationsApi.create(formationData);
        toast({
          title: "Succès",
          description: "Formation créée avec succès",
        });
      }
      
      onSave();
    } catch (error) {
      toast({
        title: "Erreur",
        description: isEditing ? "Impossible de mettre à jour la formation" : "Impossible de créer la formation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case ContentType.VIDEO:
        return <Video className="w-4 h-4" />;
      case ContentType.SLIDE:
        return <Layers className="w-4 h-4" />;
      case ContentType.DOCUMENT:
        return <FileText className="w-4 h-4" />;
      case ContentType.QUIZ:
        return <BookOpen className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case ContentType.VIDEO:
        return 'Vidéo';
      case ContentType.SLIDE:
        return 'Diapositive';
      case ContentType.DOCUMENT:
        return 'Document';
      case ContentType.QUIZ:
        return 'Quiz';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Modifier la formation' : 'Nouvelle formation'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Titre de la formation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de formation
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={FormationType.VIDEO}>Vidéo</option>
                <option value={FormationType.SLIDES}>Diapositives</option>
                <option value={FormationType.DOCUMENT}>Document</option>
                <option value={FormationType.MIXED}>Mixte</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description de la formation"
              rows={3}
            />
          </div>

          {/* Options */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isMandatory}
                onChange={(e) => handleInputChange('isMandatory', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Obligatoire</span>
            </label>
          </div>

          {/* Contenu de la formation */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Contenu de la formation</h3>
              <Button
                type="button"
                onClick={addContent}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter du contenu</span>
              </Button>
            </div>

            {formData.content.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun contenu</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par ajouter du contenu à votre formation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.content.map((content, index) => (
                  <div key={content.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <div className="flex items-center space-x-2">
                        {getContentTypeIcon(content.type)}
                        <span className="text-sm font-medium text-gray-700">
                          Élément {index + 1}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContent(index)}
                        className="ml-auto text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Titre
                        </label>
                        <Input
                          value={content.title}
                          onChange={(e) => handleContentChange(index, 'title', e.target.value)}
                          placeholder="Titre du contenu"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <select
                          value={content.type}
                          onChange={(e) => handleContentChange(index, 'type', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={ContentType.VIDEO}>Vidéo</option>
                          <option value={ContentType.SLIDE}>Diapositive</option>
                          <option value={ContentType.DOCUMENT}>Document</option>
                          <option value={ContentType.QUIZ}>Quiz</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Durée (minutes)
                        </label>
                        <Input
                          type="number"
                          value={content.duration || ''}
                          onChange={(e) => handleContentChange(index, 'duration', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fichier
                        </label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, index);
                              }
                            }}
                            accept="video/*,application/pdf,image/*,.ppt,.pptx"
                            disabled={uploadingFile === `content-${index}`}
                          />
                          {uploadingFile === `content-${index}` && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <Textarea
                        value={content.description || ''}
                        onChange={(e) => handleContentChange(index, 'description', e.target.value)}
                        placeholder="Description du contenu"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Durée totale */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Durée totale</span>
              <span className="text-lg font-semibold text-gray-900">
                {Math.floor(calculateTotalDuration() / 60)}h {calculateTotalDuration() % 60}min
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                isEditing ? 'Mettre à jour' : 'Créer'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 