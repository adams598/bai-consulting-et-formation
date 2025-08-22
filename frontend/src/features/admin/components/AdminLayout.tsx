import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  Key,
  Shield
} from 'lucide-react';
import { User as UserType } from '../types';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../components/ui/use-toast';
import { authService } from '../../../services/authService';
import { profileApi } from '../../../api/adminApi';

// Import des composants de contenu
import { DashboardPage } from '../pages/DashboardPage';
import AdminFormationsPage from './AdminFormationsPage';
import AdminBanksPage from './AdminBanksPage';
import AdminUsersPage from './AdminUsersPage';
import AdminStatsPage from './AdminStatsPage';
import AdminSettingsPage from './AdminSettingsPage';
import BankDetailPage from './BankDetailPage';

// Import des modales
import { ProfileModal } from './ProfileModal';
import { ChangePasswordModal } from './ChangePasswordModal';

interface AdminLayoutProps {
  // Plus besoin de children car le contenu est géré dynamiquement
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  id: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  {
    label: 'Tableau de bord',
    icon: <LayoutDashboard className="w-5 h-5" />,
    id: 'dashboard'
  },
  {
    label: 'Formations',
    icon: <BookOpen className="w-5 h-5" />,
    id: 'formations'
  },
  {
    label: 'Collaborateurs',
    icon: <Users className="w-5 h-5" />,
    id: 'users'
  },
  {
    label: 'Banques',
    icon: <Building2 className="w-5 h-5" />,
    id: 'banks'
  },
  {
    label: 'Statistiques',
    icon: <BarChart3 className="w-5 h-5" />,
    id: 'stats'
  },
  {
    label: 'Paramètres',
    icon: <Settings className="w-5 h-5" />,
    id: 'settings'
  }
];

export const AdminLayout: React.FC<AdminLayoutProps> = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        console.log('🔍 Initialisation AdminLayout...');
        console.log('🔑 authService.isAuthenticated():', authService.isAuthenticated());
        console.log('👤 authService.getCurrentUser():', authService.getCurrentUser());
        
        // Vérifier l'authentification via le service
        if (authService.isAuthenticated()) {
          const user = authService.getCurrentUser();
          console.log('✅ Utilisateur authentifié:', user);
          if (user) {
            setCurrentUser(user);
            setIsLoading(false);
            console.log('✅ AdminLayout initialisé avec succès');
          } else {
            console.log('❌ Utilisateur non trouvé, redirection vers login');
            // Utilisateur non trouvé, rediriger vers login
            navigate('/admin/login');
          }
        } else {
          console.log('❌ Pas authentifié, redirection vers login');
          // Pas authentifié, rediriger vers login
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        navigate('/admin/login');
      }
    };

    initializeAdmin();
  }, [navigate]);

  // Mettre à jour activeView quand l'URL change
  useEffect(() => {
    if (location.pathname.includes('/admin/banks/') && params.bankId) {
      setActiveView('banks');
    }
  }, [location.pathname, params.bankId]);

  // Fermer le menu profil quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showProfileMenu && !target.closest('.profile-menu')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Fonction pour changer de vue
  const handleViewChange = (viewId: string) => {
    setActiveView(viewId);
    
    // Si on était sur une page de détail de banque et qu'on change de vue, naviguer vers la vue générale
    if (location.pathname.includes('/admin/banks/') && params.bankId && viewId !== 'banks') {
      navigate(`/admin/${viewId}`);
    }
  };

  // Fonction pour rendre le contenu dynamique
  const renderContent = () => {
    // Détecter si on est sur une route de détail de banque ET que l'utilisateur n'a pas choisi une autre vue
    if (location.pathname.includes('/admin/banks/') && params.bankId && activeView === 'banks') {
      return <BankDetailPage />;
    }

    // Sinon, utiliser la navigation normale
    switch (activeView) {
      case 'dashboard':
        return <DashboardPage />;
      case 'formations':
        return <AdminFormationsPage />;
      case 'users':
        return <AdminUsersPage />;
      case 'banks':
        return <AdminBanksPage />;
      case 'stats':
        return <AdminStatsPage />;
      case 'settings':
        return <AdminSettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  // Fonction pour obtenir le titre de la vue active
  const getActiveViewTitle = () => {
    // Si l'utilisateur a choisi une vue spécifique, l'utiliser
    if (activeView !== 'banks') {
      const activeItem = menuItems.find(item => item.id === activeView);
      return activeItem ? activeItem.label : 'Tableau de bord';
    }

    // Si on est sur une page de détail de banque ET que l'utilisateur est sur l'onglet banques
    if (location.pathname.includes('/admin/banks/') && params.bankId && activeView === 'banks') {
      return 'Détails de la banque';
    }

    // Sinon, utiliser le titre normal
    const activeItem = menuItems.find(item => item.id === activeView);
    return activeItem ? activeItem.label : 'Tableau de bord';
  };

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès",
    });
    navigate('/admin/login');
  };

  // Fonction pour gérer le profil
  const handleProfile = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Fonction pour changer de mot de passe
  const handleChangePassword = () => {
    setShowPasswordModal(true);
    setShowProfileMenu(false);
  };

  // Fonction pour éditer le profil
  const handleEditProfile = () => {
    console.log('handleEditProfile - currentUser:', currentUser);
    setShowProfileModal(true);
    setShowProfileMenu(false);
  };

  // Fonction pour sauvegarder le profil
  const handleSaveProfile = async (updatedUser: Partial<UserType>) => {
    try {
      const response = await profileApi.updateProfile(updatedUser);
      console.log('handleSaveProfile - API response:', response);
      console.log('handleSaveProfile - response.data:', response.data);
      
      // Le backend retourne { success: true, data: {...} }
      const userData = response.data.data || response.data;
      console.log('handleSaveProfile - userData to set:', userData);
      
      setCurrentUser(userData);
      authService.updateUser(userData);
      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Fonction pour sauvegarder le mot de passe
  const handleSavePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await profileApi.changePassword({ currentPassword, newPassword });
      toast({
        title: "Succès",
        description: "Mot de passe modifié avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le mot de passe",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen flex flex-col">
          {/* Titre */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">BAI Consulting</h1>
            <p className="text-sm text-gray-500 mt-1">Administration</p>
          </div>
          
          {/* Navigation principale */}
          <nav className="flex-1 mt-4">
            <div className="px-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Section Profil Utilisateur */}
          <div className="p-4 border-t border-gray-200">
            <div className="relative profile-menu">
              {/* Bouton profil */}
              <button
                onClick={handleProfile}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentUser?.email}
                  </div>
                </div>
              </button>

              {/* Menu déroulant du profil */}
              {showProfileMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={handleEditProfile}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 mr-3 text-gray-500" />
                      Modifier le profil
                    </button>
                    <button
                      onClick={handleChangePassword}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Key className="w-4 h-4 mr-3 text-gray-500" />
                      Changer le mot de passe
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-8">
          <div className="space-y-6">
            {/* Titre dynamique */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getActiveViewTitle()}</h1>
              <p className="text-gray-600">
                {activeView === 'dashboard' && 'Vue d\'ensemble de votre plateforme de formation'}
                {activeView === 'formations' && 'Gérez les formations de votre plateforme'}
                {activeView === 'users' && 'Gérez les collaborateurs de votre plateforme'}
                {activeView === 'banks' && 'Gérez les banques de votre plateforme'}
                {activeView === 'stats' && 'Analysez les performances de votre plateforme'}
                {activeView === 'settings' && 'Configurez votre plateforme'}
              </p>
            </div>
            
            {/* Contenu dynamique */}
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Modales */}
      {showProfileModal && (
        <ProfileModal
          key={currentUser?.id || 'no-user'}
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onSave={handleSaveProfile}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSave={handleSavePassword}
        />
      )}
    </div>
  );
}; 