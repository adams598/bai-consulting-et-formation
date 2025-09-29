import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Bank } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { useConfirmation } from '../../../hooks/useConfirmation';

interface BankModalProps {
  bank?: Bank | null;
  isOpen?: boolean;
  onClose: () => void;
  onSave: (data: Partial<Bank>) => void;
}

const BankModal: React.FC<BankModalProps> = ({ bank, isOpen = true, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isActive: true
  });
  
  // Hook de confirmation
  const confirmation = useConfirmation();

  // Fonction pour générer le code de la banque
  const generateBankCode = (bankName: string): string => {
    if (!bankName.trim()) return '';
    
    // Prendre les 3 premières lettres du nom, en majuscules
    const code = bankName
      .trim()
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 3);
    
    // Ajouter un timestamp pour l'unicité
    const timestamp = Date.now().toString().slice(-4);
    
    return `${code}${timestamp}`;
  };

  // Mettre à jour le code quand le nom change
  const handleNameChange = (name: string) => {
    const newCode = generateBankCode(name);
    setFormData(prev => ({ 
      ...prev, 
      name,
      code: newCode
    }));
  };

  useEffect(() => {
    if (bank) {
      setFormData({
        name: bank.name,
        code: bank.code || '',
        isActive: bank.isActive
      });
    }
  }, [bank]);

  // Gérer la fermeture avec la touche Échap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || !formData.code.trim()) {
      confirmation.showConfirmation({
        title: 'Champs requis',
        message: 'Veuillez remplir tous les champs obligatoires avant de sauvegarder.',
        confirmText: 'Compris',
        type: 'warning',
        onConfirm: () => {}
      });
      return;
    }
    
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {bank ? 'Modifier la banque' : 'Nouvelle banque'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la banque *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nom de la banque"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code de la banque *
            </label>
            <input
              type="text"
              value={formData.code}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
              placeholder="Code généré automatiquement"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Le code est généré automatiquement à partir du nom de la banque
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Banque active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {bank ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankModal;

