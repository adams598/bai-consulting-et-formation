import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Key, 
  Bell, 
  Eye,
  EyeOff,
  Save,
  Camera,
  Check,
  X,
  Calendar as CalendarIcon,
  Shield,
  Lock,
} from 'lucide-react';
import { useToast } from '../../../components/ui/use-toast';
import { authService } from '../../../services/authService';
import { LearnerProfile } from '../../learner/types';

// Utiliser directement LearnerProfile au lieu de redéfinir

const LearnerSettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences'>('profile');
  
  // États pour les mots de passe
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // États pour le formulaire de profil
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: ''
  });

  // États pour le changement de mot de passe
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // États pour les notifications
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    formationReminders: true,
    progressUpdates: true,
    certificateAlerts: true,
    weeklyReports: false,
    pushNotifications: true,
    smsNotifications: false
  });

  // États pour les préférences
  const [preferences, setPreferences] = useState({
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light',
    autoSave: true,
    showTutorials: true
  });

  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données utilisateur depuis le service d'authentification
      const user = await authService.getCurrentUser();
      
      if (user) {
        // Convertir les données utilisateur en format LearnerProfile
        const profileData: LearnerProfile = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || '',
          department: user.department || '',
          avatar: user.avatar || undefined,
          bankId: user.bankId || '',
          bank: user.bank,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notificationSettings: {
            emailNotifications: true,
            formationReminders: true,
            progressUpdates: true,
            certificateAlerts: true,
            weeklyReports: false
          }
        };
        
        setProfile(profileData);
        setProfileForm({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          department: profileData.department || ''
        });
        
        // Charger les préférences par défaut
        if (profileData.notificationSettings) {
          setNotificationSettings(prev => ({ 
            ...prev, 
            emailNotifications: profileData.notificationSettings?.emailNotifications || true,
            formationReminders: profileData.notificationSettings?.formationReminders || true,
            progressUpdates: profileData.notificationSettings?.progressUpdates || true,
            certificateAlerts: profileData.notificationSettings?.certificateAlerts || true,
            weeklyReports: profileData.notificationSettings?.weeklyReports || false
          }));
        }
        
        console.log('✅ Profil chargé avec succès:', profileData);
      } else {
        throw new Error('Utilisateur non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre profil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Pour l'instant, simuler une mise à jour locale
      // TODO: Implémenter l'API de mise à jour du profil
      const updatedProfile = {
        ...profile!,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone,
        department: profileForm.department
      };
      
      setProfile(updatedProfile);
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès"
      });
      
      console.log('✅ Profil mis à jour:', updatedProfile);
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      // Pour l'instant, simuler le changement de mot de passe
      // TODO: Implémenter l'API de changement de mot de passe
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès"
      });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      console.log('✅ Mot de passe changé avec succès');
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier votre mot de passe",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // const handleNotificationSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
    
  //   try {
  //     setSaving(true);
      
  //     // Pour l'instant, simuler la sauvegarde des notifications
  //     // TODO: Implémenter l'API de mise à jour des notifications
  //     toast({
  //       title: "Préférences sauvegardées",
  //       description: "Vos préférences de notification ont été mises à jour"
  //     });
      
  //     console.log('✅ Notifications sauvegardées:', notificationSettings);
  //   } catch (error) {
  //     console.error('Erreur lors de la sauvegarde des notifications:', error);
  //     toast({
  //       title: "Erreur",
  //       description: "Impossible de sauvegarder vos préférences",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // const handlePreferencesSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
    
  //   try {
  //     setSaving(true);
      
  //     // Pour l'instant, simuler la sauvegarde des préférences
  //     // TODO: Implémenter l'API de mise à jour des préférences
  //     toast({
  //       title: "Préférences sauvegardées",
  //       description: "Vos préférences ont été mises à jour"
  //     });
      
  //     console.log('✅ Préférences sauvegardées:', preferences);
  //   } catch (error) {
  //     console.error('Erreur lors de la sauvegarde des préférences:', error);
  //     toast({
  //       title: "Erreur",
  //       description: "Impossible de sauvegarder vos préférences",
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // Fonction pour gérer le changement de photo de profil
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier image",
        variant: "destructive"
      });
      return;
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      // Pour l'instant, simuler l'upload de l'avatar
      // TODO: Implémenter l'API d'upload d'avatar
      const reader = new FileReader();
      reader.onload = (event) => {
        const avatarUrl = event.target?.result as string;
        
        if (profile) {
          const updatedProfile = {
            ...profile,
            avatar: avatarUrl
          };
          setProfile(updatedProfile);
          
          toast({
            title: "Photo mise à jour",
            description: "Votre photo de profil a été mise à jour avec succès"
          });
          
          console.log('✅ Avatar mis à jour:', avatarUrl);
        }
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Erreur lors du changement d\'avatar:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre photo de profil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const renderProfileTab = () => (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors cursor-pointer">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              disabled={saving}
            />
          </label>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Photo de profil</h3>
          <p className="text-sm text-gray-600">
            Cliquez sur l'icône caméra pour changer votre photo (max 5MB)
          </p>
          {saving && (
            <p className="text-sm text-blue-600 mt-1">Mise à jour en cours...</p>
          )}
        </div>
      </div>

      {/* Informations personnelles */}
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
              value={profileForm.firstName}
              onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              value={profileForm.lastName}
              onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              value={profileForm.email}
              onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              value={profileForm.phone}
              onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Département / Fonction
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={profileForm.department}
              onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Informations de la banque */}
      {profile?.bank && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Établissement</h3>
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">{profile.bank.name}</span>
            <span className="text-xs text-gray-500">({profile.bank.code})</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Cette information est gérée par votre administrateur
          </p>
        </div>
      )}

      <div className="flex justify-end">
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
  );

  const renderSecurityTab = () => (
    <form onSubmit={handlePasswordSubmit} className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Sécurité du mot de passe
            </h3>
            <div className="text-sm text-yellow-700 mt-1">
              <p>• Au moins 8 caractères</p>
              <p>• Mélange de lettres, chiffres et symboles recommandé</p>
              <p>• Évitez les mots de passe trop simples</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe actuel *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nouveau mot de passe *
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmer le nouveau mot de passe *
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {passwordForm.newPassword && passwordForm.confirmPassword && 
           passwordForm.newPassword !== passwordForm.confirmPassword && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <X className="h-4 w-4 mr-1" />
              Les mots de passe ne correspondent pas
            </p>
          )}
          {passwordForm.newPassword && passwordForm.confirmPassword && 
           passwordForm.newPassword === passwordForm.confirmPassword && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <Check className="h-4 w-4 mr-1" />
              Les mots de passe correspondent
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Modification...' : 'Modifier le mot de passe'}</span>
        </button>
      </div>
    </form>
  );



  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Sécurité
          </button>
          
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {/* {activeTab === 'notifications' && renderNotificationsTab()} */}
        {/* {activeTab === 'preferences' && renderPreferencesTab()} */}
      </div>
    </div>
  );
};

export default LearnerSettingsPage;
