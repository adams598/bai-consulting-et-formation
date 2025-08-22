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
    isActive: true,
    hasQuiz: false,
    quizRequired: true
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const isEditing = !!formation;

  useEffect(() => {
    if (formation) {
      setFormData({
        title: formation.title,
        description: formation.description,
        isActive: formation.isActive,
        hasQuiz: formation.hasQuiz || false,
        quizRequired: formation.quizRequired !== undefined ? formation.quizRequired : true
      });
    }
  }, [formation]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && formation) {
        await formationsApi.updateFormation(formation.id, formData);
        toast({
          title: "Succès",
          description: "Formation mise à jour avec succès",
        });
      } else {
        await formationsApi.createFormation(formData);
        toast({
          title: "Succès",
          description: "Formation créée avec succès",
        });
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