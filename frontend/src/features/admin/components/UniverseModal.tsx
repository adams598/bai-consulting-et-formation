import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Universe } from '../types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/use-toast';

interface UniverseModalProps {
  universe?: Universe | null;
  onClose: () => void;
  onSave: (universeData: Partial<Universe>) => void;
}

// Couleurs prédéfinies pour les univers
const PREDEFINED_COLORS = [
  { name: 'Bleu', value: '#3B82F6' },
  { name: 'Vert', value: '#10B981' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Jaune', value: '#FBBF24' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Emeraude', value: '#059669' },
];

export const UniverseModal: React.FC<UniverseModalProps> = ({
  universe,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'folder',
    isActive: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const { toast } = useToast();
  const isEditing = !!universe;

  useEffect(() => {
    if (universe) {
      // Mode édition : charger les données de l'univers existant
      setFormData({
        name: universe.name || '',
        description: universe.description || '',
        color: universe.color || '#3B82F6',
        icon: universe.icon || 'folder',
        isActive: universe.isActive !== undefined ? universe.isActive : true
      });
    }
  }, [universe]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de l\'univers est requis';
    }
    
    if (!formData.color) {
      newErrors.color = 'Une couleur doit être sélectionnée';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      // Appeler la fonction onSave avec les données
      await onSave(formData);
      
      toast({
        title: "Succès",
        description: isEditing ? "Univers mis à jour avec succès" : "Univers créé avec succès",
      });
      
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde de l\'univers:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Modifier l\'univers' : 'Créer un nouvel univers'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom de l'univers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'univers <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Finance, Conformité, Digital..."
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description de l'univers de formations..."
              rows={3}
            />
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-3">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange('color', color.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    formData.color === color.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-xs text-gray-600">{color.name}</span>
                </button>
              ))}
            </div>
            {errors.color && (
              <p className="text-red-500 text-sm mt-1">{errors.color}</p>
            )}
          </div>

          {/* Couleur personnalisée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ou choisir une couleur personnalisée
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-600 font-mono">{formData.color}</span>
            </div>
          </div>

          {/* Statut */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Univers actif
            </label>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UniverseModal;

