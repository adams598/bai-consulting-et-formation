import React, { useState } from 'react';
import { X, Eye, EyeOff, Key, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSave: (currentPassword: string, newPassword: string) => void;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: 'Au moins 8 caractères',
    test: (password) => password.length >= 8
  },
  {
    label: 'Au moins une lettre majuscule',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    label: 'Au moins une lettre minuscule',
    test: (password) => /[a-z]/.test(password)
  },
  {
    label: 'Au moins un chiffre',
    test: (password) => /\d/.test(password)
  },
  {
    label: 'Au moins un caractère spécial',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
];

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation des champs
      if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs",
          variant: "destructive",
        });
        return;
      }

      // Validation du nouveau mot de passe
      const failedRequirements = passwordRequirements.filter(req => !req.test(formData.newPassword));
      if (failedRequirements.length > 0) {
        toast({
          title: "Erreur",
          description: "Le nouveau mot de passe ne respecte pas tous les critères de sécurité",
          variant: "destructive",
        });
        return;
      }

      // Validation de la confirmation
      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas",
          variant: "destructive",
        });
        return;
      }

      // Validation que le nouveau mot de passe est différent
      if (formData.currentPassword === formData.newPassword) {
        toast({
          title: "Erreur",
          description: "Le nouveau mot de passe doit être différent de l'actuel",
          variant: "destructive",
        });
        return;
      }

      await onSave(formData.currentPassword, formData.newPassword);
      
      toast({
        title: "Succès",
        description: "Mot de passe modifié avec succès",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le mot de passe",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRequirementStatus = (requirement: PasswordRequirement) => {
    const isValid = requirement.test(formData.newPassword);
    return {
      isValid,
      icon: isValid ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />,
      className: isValid ? 'text-green-600' : 'text-red-600'
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mot de passe actuel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe actuel *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className="pl-10 pr-10"
                placeholder="Votre mot de passe actuel"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className="pl-10 pr-10"
                placeholder="Votre nouveau mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmation du nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le nouveau mot de passe *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="pl-10 pr-10"
                placeholder="Confirmez votre nouveau mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Critères de sécurité */}
          {formData.newPassword && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Critères de sécurité :</h4>
              <div className="space-y-2">
                {passwordRequirements.map((requirement, index) => {
                  const status = getRequirementStatus(requirement);
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      {status.icon}
                      <span className={`text-sm ${status.className}`}>
                        {requirement.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Modification...' : 'Modifier le mot de passe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 