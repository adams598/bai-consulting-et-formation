import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Building2 } from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { usersApi } from '../../../api/adminApi';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';

interface UserModalProps {
  user?: UserType | null;
  bankId: string;
  onClose: () => void;
  onSave: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  user,
  bankId,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: UserRole.COLLABORATOR,
    department: '',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department || '',
        isActive: user.isActive
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const userData = {
        ...formData,
        bankId
      };

      if (isEditing && user) {
        await usersApi.update(user.id, userData);
        toast({
          title: "Succès",
          description: "Utilisateur mis à jour avec succès",
        });
      } else {
        await usersApi.create(userData);
        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès",
        });
      }
      
      onSave();
    } catch (error) {
      toast({
        title: "Erreur",
        description: isEditing ? "Impossible de mettre à jour l'utilisateur" : "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin';
      case UserRole.BANK_ADMIN:
        return 'Admin Banque';
      case UserRole.COLLABORATOR:
        return 'Collaborateur';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Prénom"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Nom"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email professionnel *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@banque.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={UserRole.COLLABORATOR}>Collaborateur</option>
              <option value={UserRole.BANK_ADMIN}>Admin Banque</option>
              {!isEditing && <option value={UserRole.SUPER_ADMIN}>Super Admin</option>}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Département
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Ex: Finance, RH, IT..."
                className="pl-10"
              />
            </div>
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
              <span className="ml-2 text-sm text-gray-700">Actif</span>
            </label>
          </div>

          {/* Informations importantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <User className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  {isEditing ? 'Modification d\'utilisateur' : 'Création d\'utilisateur'}
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  {isEditing 
                    ? 'Les modifications seront appliquées immédiatement.'
                    : 'Un mot de passe sécurisé sera généré automatiquement et envoyé par email.'
                  }
                </p>
              </div>
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