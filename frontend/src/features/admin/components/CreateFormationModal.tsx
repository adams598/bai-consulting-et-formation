import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useToast } from '../../../components/ui/use-toast';
import { formationsApi } from '../../../api/adminApi';

interface CreateFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormationCreated: () => void;
}

const CreateFormationModal: React.FC<CreateFormationModalProps> = ({
  isOpen,
  onClose,
  onFormationCreated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    hasQuiz: true,
    quizRequired: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre et la description sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await formationsApi.createFormation(formData);
      
      toast({
        title: "Succès",
        description: "Formation créée avec succès",
      });
      
      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        duration: 60,
        hasQuiz: true,
        quizRequired: false
      });
      
      onFormationCreated();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la création de la formation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Créer une formation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Titre */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Titre *
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Formation Sécurité Bancaire"
              className="mt-1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description *
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description détaillée de la formation..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              required
            />
          </div>

          {/* Durée */}
          <div>
            <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
              Durée (en minutes) *
            </Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
              className="mt-1"
              required
            />
          </div>

          {/* Quiz */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasQuiz"
                checked={formData.hasQuiz}
                onChange={(e) => setFormData(prev => ({ ...prev, hasQuiz: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="hasQuiz" className="text-sm font-medium text-gray-700">
                Inclure un quiz
              </Label>
            </div>

            {formData.hasQuiz && (
              <div className="ml-6 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="quizRequired"
                  checked={formData.quizRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, quizRequired: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="quizRequired" className="text-sm font-medium text-gray-700">
                  Quiz obligatoire pour valider la formation
                </Label>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Création...</span>
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer la formation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFormationModal;

