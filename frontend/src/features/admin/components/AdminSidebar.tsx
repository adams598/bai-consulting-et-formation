import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import '../styles/admin-typography.css';
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
  Menu,
  ChevronLeft
} from 'lucide-react';
import { User as UserType } from '../types';
import { useToast } from '../../../components/ui/use-toast';
import { authService } from '../../../services/authService';
import { profileApi } from '../../../api/adminApi';

// Import des modales
import { ProfileModal } from './ProfileModal';
import { ChangePasswordModal } from './ChangePasswordModal';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  id: string;
  path: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  {
    label: 'Tableau de bord',
    icon: <LayoutDashboard className="w-5 h-5" />,
    id: 'dashboard',
    path: '/admin/dashboard'
  },
  {
    label: 'Formations',
    icon: <BookOpen className="w-5 h-5" />,
    id: 'formations',
    path: '/admin/formations'
  },
  {
    label: 'Collaborateurs',
    icon: <Users className="w-5 h-5" />,
    id: 'users',
    path: '/admin/users'
  },
  {
    label: 'Banques',
    icon: <Building2 className="w-5 h-5" />,
    id: 'banks',
    path: '/admin/banks'
  },
  {
    label: 'Statistiques',
    icon: <BarChart3 className="w-5 h-5" />,
    id: 'stats',
    path: '/admin/stats'
  },
  {
    label: 'Paramètres',
    icon: <Settings className="w-5 h-5" />,
    id: 'settings',
    path: '/admin/settings'
  }
];

export const AdminSidebar: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        console.log('🔍 Initialisation AdminSidebar...');
        
        if (authService.isAuthenticated()) {
          const authUser = authService.getCurrentUser();
          if (authUser) {
            const user: UserType = {
              ...authUser,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLogin: new Date()
            };
            setCurrentUser(user);
            setIsLoading(false);
          } else {
            navigate('/admin/login');
          }
        } else {
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
    const path = location.pathname;
    console.log('📍 URL changée:', path);
    
    let newView = 'dashboard';
    
    if (path.includes('/admin/banks/')) {
      newView = 'banks';
    } else if (path === '/admin' || path === '/admin/') {
      newView = 'dashboard';
    } else if (path.includes('/admin/dashboard')) {
      newView = 'dashboard';
    } else if (path.includes('/admin/formations')) {
      newView = 'formations';
    } else if (path.includes('/admin/users')) {
      newView = 'users';
    } else if (path.includes('/admin/banks')) {
      newView = 'banks';
    } else if (path.includes('/admin/stats')) {
      newView = 'stats';
    } else if (path.includes('/admin/settings')) {
      newView = 'settings';
    }
    
    if (newView !== activeView) {
      console.log('🔄 Mise à jour activeView:', activeView, '->', newView);
      setActiveView(newView);
    }
  }, [location.pathname, activeView]);

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
    setShowProfileModal(true);
    setShowProfileMenu(false);
  };

  // Fonction pour sauvegarder le profil
  const handleSaveProfile = async (updatedUser: Partial<UserType>) => {
    try {
      const response = await profileApi.updateProfile(updatedUser);
      const userData = response.data.data || response.data;
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

  // Fonction pour basculer la sidebar
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (isLoading) {
    return (
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-white to-blue-50">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </aside>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <>
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col bg-gradient-to-b from-white to-blue-50 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex flex-col flex-1 overflow-y-auto px-2 py-4 gap-10">
            {/* Bouton toggle et Titre */}
            <div className="flex flex-col gap-4">
              {/* Bouton toggle */}
              <div className="flex justify-end px-2">
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-blue-900 hover:bg-blue-200 rounded-lg transition-colors"
                  title={isSidebarCollapsed ? 'Ouvrir la sidebar' : 'Fermer la sidebar'}
                >
                  {isSidebarCollapsed ? (
                    <Menu className="w-5 h-5" />
                  ) : (
                    <ChevronLeft className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Titre */}
              {!isSidebarCollapsed && (
                <div>
                  <div className="flex items-center px-4 py-2 text-blue-900">
                    <h1 className="text-xl font-bold">BAI Consulting</h1>
                  </div>
                  <p className="text-sm text-blue-900 px-4 mt-1">Administration</p>
                </div>
              )}
            </div>
            
            {/* Navigation principale */}
            <div className="flex flex-col flex-1 gap-3">
              {menuItems.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => {
                      console.log('🖱️ Clic sur lien:', item.id, '-> navigation vers:', item.path);
                    }}
                    className={`flex items-center ${isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-2'} mt-2 text-blue-900 rounded-lg transition-colors no-underline ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'hover:bg-blue-400 hover:text-white hover:shadow-md'
                    }`}
                    title={isSidebarCollapsed ? item.label : ''}
                  >
                    <span className={isSidebarCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                    {!isSidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Section Profil Utilisateur */}
        <div className={`p-4 border-t border-blue-50 bg-blue-50 ${isSidebarCollapsed ? 'px-2' : ''}`}>
          <div className="relative profile-menu">
            {/* Bouton profil */}
            <button
              onClick={handleProfile}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-3 py-2'} text-sm font-medium text-blue-900 rounded-lg hover:bg-blue-200 transition-colors`}
              title={isSidebarCollapsed ? `${currentUser?.firstName} ${currentUser?.lastName}` : ''}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 text-left ml-3">
                  <div className="font-medium text-blue-900">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </div>
                  <div className="text-xs text-blue-700">
                    {currentUser?.email}
                  </div>
                </div>
              )}
            </button>

            {/* Menu déroulant du profil */}
            {showProfileMenu && (
              <div className={`absolute bottom-full ${isSidebarCollapsed ? 'left-0 w-48' : 'left-0 right-0'} mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-10`}>
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
    </>
  );
};
