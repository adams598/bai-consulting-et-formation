import React, { useState, useRef } from 'react';
import { 
  User, 
  Camera, 
  Save, 
  Edit,
  Check,
  X,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Shield
} from 'lucide-react';
import { LearnerProfile } from '../types';
import { profileApi } from '../../../api/learnerApi';
import { useAuth } from '../../../providers/auth-provider';
import { useToast } from '../../../components/ui/use-toast';

interface ProfileManagerProps {
  profile: LearnerProfile;
  onProfileUpdate?: (updatedProfile: LearnerProfile) => void;
  editable?: boolean;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({
  profile,
  onProfileUpdate,
  editable = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone || '',
    position: profile.position || ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await profileApi.updateProfile(formData);
      
      onProfileUpdate?.(response.data);
      setIsEditing(false);
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès"
      });
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone || '',
      position: profile.position || ''
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifications
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      toast({
        title: "Fichier trop volumineux",
        description: "L'image doit faire moins de 5MB",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner une image",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      
      // Créer un FormData pour l'upload
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Simuler l'upload (en réalité, cela ferait appel à une API d'upload)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Créer une URL temporaire pour l'aperçu
      const avatarUrl = URL.createObjectURL(file);
      
      // Mettre à jour le profil avec la nouvelle image
      const updatedProfile = { ...profile, avatar: avatarUrl };
      onProfileUpdate?.(updatedProfile);
      
      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été mise à jour"
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre photo",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header avec avatar */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
              
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            
            {editable && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-white text-gray-600 rounded-full shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Informations principales */}
          <div className="flex-1 text-white">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold">
                {profile.firstName} {profile.lastName}
              </h2>
              {editable && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="space-y-1 text-blue-100">
              <p className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>{profile.position || 'Apprenant'}</span>
              </p>
              
              {profile.bank && (
                <p className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.bank.name}</span>
                </p>
              )}
              
              <p className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Membre depuis {formatDate(profile.createdAt)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire d'édition ou informations */}
      <div className="p-6">
        {isEditing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poste / Fonction
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Annuler</span>
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Informations de contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-gray-900">{profile.email}</p>
                    </div>
                  </div>
                  
                  {profile.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Téléphone</p>
                        <p className="text-gray-900">{profile.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {profile.position && (
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Poste</p>
                        <p className="text-gray-900">{profile.position}</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.bank && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Établissement</p>
                        <p className="text-gray-900">{profile.bank.name}</p>
                        <p className="text-sm text-gray-500">Code: {profile.bank.code}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informations système */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations système</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Compte créé</p>
                    <p>{formatDate(profile.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Dernière mise à jour</p>
                    <p>{formatDate(profile.updatedAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">ID utilisateur</p>
                    <p className="font-mono text-xs">{profile.id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiques du profil */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-gray-600">Formations suivies</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">8</p>
                  <p className="text-sm text-gray-600">Certificats obtenus</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">24h</p>
                  <p className="text-sm text-gray-600">Temps d'apprentissage</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileManager;
