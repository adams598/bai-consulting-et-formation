import React, { useState, useEffect } from 'react';
import { X, Save, FolderOpen } from 'lucide-react';
import { FormationContent } from '../types';

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FormationContent>) => void;
  formationId: string;
  existingSection?: FormationContent | null;
}

const SectionModal: React.FC<SectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formationId,
  existingSection
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0
  });

  useEffect(() => {
    if (existingSection) {
      setFormData({
        title: existingSection.title || '',
        description: existingSection.description || '',
        order: existingSection.order || 0
      });
    } else {
      setFormData({
        title: '',
        description: '',
        order: 0
      });
    }
  }, [existingSection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-blue to-brand-blue/90 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FolderOpen className="h-6 w-6" />
              <h2 className="text-xl font-semibold font-sans">
                {existingSection ? 'Modifier la section' : 'Nouvelle section'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-brand-beige transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Titre de la section *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
              placeholder="Ex: Introduction aux bases"
              required
            />
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all resize-none"
              placeholder="Description optionnelle de la section..."
            />
          </div>

          {/* Ordre */}
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
              Ordre d'affichage
            </label>
            <input
              type="number"
              id="order"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Plus le nombre est petit, plus la section apparaîtra en premier
            </p>
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
              className="flex-1 px-4 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{existingSection ? 'Modifier' : 'Créer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SectionModal;
