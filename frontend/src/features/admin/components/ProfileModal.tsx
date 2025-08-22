import React, { useState, useEffect } from 'react';
import { X, User, Mail, Building } from 'lucide-react';
import { User as UserType } from '../types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';
import { AvatarUpload } from './AvatarUpload';

interface ProfileModalProps {
  user: UserType | null;
  onClose: () => void;
  onSave: (updatedUser: Partial<UserType>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    department: user?.department || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  // Mettre à jour le state quand les données de l'utilisateur changent
  useEffect(() => {
    console.log('ProfileModal - user data:', user);
    if (user) {
      const newFormData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        department: user.department || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      };
      console.log('ProfileModal - setting formData:', newFormData);
      setFormData(newFormData);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation basique
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive",
        });
        return;
      }

      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir une adresse email valide",
          variant: "destructive",
        });
        return;
      }

      await onSave(formData);
      
      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
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

  const handleAvatarChange = (avatarUrl: string) => {
    setFormData(prev => ({
      ...prev,
      avatar: avatarUrl
    }));
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: ''
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Modifier le profil</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <AvatarUpload
              currentAvatar={formData.avatar}
              onAvatarChange={handleAvatarChange}
              onRemoveAvatar={handleRemoveAvatar}
              disabled={isLoading}
            />
          </div>

          {/* Informations personnelles */}
          <div className="space-y-4">
            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="pl-10"
                placeholder="Votre prénom"
                required
              />
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="pl-10"
                placeholder="Votre nom"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
                placeholder="votre.email@exemple.com"
                required
              />
            </div>
          </div>

          {/* Département */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Département
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="pl-10"
                placeholder="Votre département"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+33 1 23 45 67 89"
            />
          </div>

          </div>

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
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 