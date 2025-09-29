import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  Shield,
  Menu,
  ChevronLeft,
  ChevronDown,
  FileText,
  Award,
  TrendingUp,
  Clock,
  Bell,
  X,
  Home,
  Target,
  Calendar
} from 'lucide-react';
import { User as UserType } from '../types';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../components/ui/use-toast';
import { authService } from '../../../services/authService';
import { profileApi } from '../../../api/adminApi';
import { SidebarProvider, useSidebar } from '../../../contexts/SidebarContext';

// Import des composants de contenu admin
import { EnhancedDashboardPage } from './EnhancedDashboardPage';
import AdminFormationsPage from './AdminFormationsPage';
import AdminBanksPage from './AdminBanksPage';
import AdminUsersPage from './AdminUsersPage';
import AdminStatsPage from './AdminStatsPage';
import AdminSettingsPage from './AdminSettingsPage';
import BankDetailPage from './BankDetailPage';

// Import des composants de contenu apprenant
import LearnerDashboardPage from './LearnerDashboardPage';
import LearnerFormationsPage from './LearnerFormationsPage';
import LearnerProgressPage from './LearnerProgressPage';
import LearnerCertificatesPage from './LearnerCertificatesPage';
import LearnerSettingsPage from './LearnerSettingsPage';

// Import des nouvelles pages apprenant
import CalendarPage from '../../learner/pages/CalendarPage';

// Import des modales
import { ProfileModal } from './ProfileModal';
import { ChangePasswordModal } from './ChangePasswordModal';

interface UnifiedLayoutProps {
  // Plus besoin de children car le contenu est géré dynamiquement
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  id: string;
  badge?: number;
  roles: string[]; // Rôles autorisés à voir cet élément
}

// Menu items pour les admins
const adminMenuItems: MenuItem[] = [
  {
    label: 'Formations',
    icon: <BookOpen className="w-5 h-5" />,
    id: 'formations',
    roles: ['SUPER_ADMIN', 'BANK_ADMIN']
  },
  {
    label: 'Collaborateurs',
    icon: <Users className="w-5 h-5" />,
    id: 'users',
    roles: ['SUPER_ADMIN', 'BANK_ADMIN']
  },
  {
    label: 'Banques',
    icon: <Building2 className="w-5 h-5" />,
    id: 'banks',
    roles: ['SUPER_ADMIN', 'BANK_ADMIN']
  },
  {
    label: 'Tableau de bord',
    icon: <LayoutDashboard className="w-5 h-5" />,
    id: 'dashboard',
    roles: ['SUPER_ADMIN', 'BANK_ADMIN']
  },
  {
    label: 'Paramètres',
    icon: <Settings className="w-5 h-5" />,
    id: 'settings',
    roles: ['SUPER_ADMIN', 'BANK_ADMIN']
  }
];

// Menu items pour les apprenants (navigation horizontale)
const learnerMenuItems: MenuItem[] = [
  {
    label: 'Tableau de bord',
    icon: <Home className="h-5 w-5" />,
    id: 'dashboard',
    roles: ['COLLABORATOR']
  },
  {
    label: 'Mes formations',
    icon: <BookOpen className="h-5 w-5" />,
    id: 'formations',
    roles: ['COLLABORATOR']
  },
  {
    label: 'Mon agenda',
    icon: <Calendar className="h-5 w-5" />,
    id: 'calendar',
    roles: ['COLLABORATOR']
  },
  // {
  //   label: 'Progression',
  //   icon: <BarChart3 className="h-5 w-5" />,
  //   id: 'progress',
  //   roles: ['COLLABORATOR']
  // },
  // {
  //   label: 'Certificats',
  //   icon: <Award className="h-5 w-5" />,
  //   id: 'certificates',
  //   roles: ['COLLABORATOR']
  // },
  {
    label: 'Paramètres',
    icon: <Settings className="h-5 w-5" />,
    id: 'settings',
    roles: ['COLLABORATOR']
  }
];

const UnifiedLayoutContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { isCollapsed: isSidebarCollapsed, setIsCollapsed: setIsSidebarCollapsed, toggleSidebar } = useSidebar();
  
  // États spécifiques aux apprenants
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { toast } = useToast();

  // Déterminer si l'utilisateur est admin ou apprenant
  const isAdmin = (): boolean => {
    return !!(currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'BANK_ADMIN'));
  };

  const isLearner = (): boolean => {
    return !!(currentUser && currentUser.role === 'COLLABORATOR');
  };

  // Obtenir le menu approprié selon le rôle
  const getMenuItems = (): MenuItem[] => {
    if (isAdmin()) {
      return adminMenuItems;
    } else if (isLearner()) {
      return learnerMenuItems;
    }
    return [];
  };

  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('🔍 Initialisation UnifiedLayout...');
        console.log('🔑 authService.isAuthenticated():', authService.isAuthenticated());
        console.log('👤 authService.getCurrentUser():', authService.getCurrentUser());
        
        // Vérifier l'authentification via le service
        if (authService.isAuthenticated()) {
          const authUser = authService.getCurrentUser();
          console.log('✅ Utilisateur authentifié:', authUser);
          if (authUser) {
            // Convertir AuthUser en User compatible
            const user: UserType = {
              ...authUser,
              isActive: true, // Valeur par défaut
              createdAt: new Date(), // Valeur par défaut
              updatedAt: new Date(), // Valeur par défaut
              lastLogin: new Date() // Valeur par défaut
            };
            setCurrentUser(user);
            setIsLoading(false);
            console.log('✅ UnifiedLayout initialisé avec succès');
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

    initializeUser();
  }, []); // Exécuter seulement au montage du composant

  // Mettre à jour activeView quand l'URL change
  useEffect(() => {
    const path = location.pathname;
    console.log('📍 URL changée:', path, 'activeView actuel:', activeView);
    
    let newView = activeView;
    
    if (path.includes('/admin/banks/') && params.bankId) {
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
    } else if (path.includes('/admin/progress')) {
      newView = 'progress';
    } else if (path.includes('/admin/certificates')) {
      newView = 'certificates';
    } else if (path.includes('/admin/calendar')) {
      newView = 'calendar';
    }
    
    // Mettre à jour seulement si la vue a changé
    if (newView !== activeView) {
      console.log('🔄 Mise à jour activeView:', activeView, '->', newView);
      setActiveView(newView);
    }
  }, [location.pathname, params.bankId, activeView]);

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
  const handleViewChange = useCallback((viewId: string) => {
    console.log('🔄 Changement de vue:', viewId, 'depuis:', location.pathname);
    
    // Éviter les changements inutiles
    if (activeView === viewId) {
      console.log('⚠️ Vue déjà active, pas de changement');
      return;
    }
    
    setActiveView(viewId);
    
    // Naviguer vers la nouvelle vue seulement si nécessaire
    const targetPath = `/admin/${viewId}`;
    
    if (location.pathname !== targetPath) {
      console.log('🚀 Navigation vers:', targetPath);
      navigate(targetPath, { replace: true });
    }
  }, [activeView, location.pathname, navigate, isLearner]);

  // Fonction pour rendre le contenu dynamique selon le rôle
  const renderContent = () => {
    // Détecter si on est sur une route de détail de banque ET que l'utilisateur n'a pas choisi une autre vue
    if (location.pathname.includes('/admin/banks/') && params.bankId && activeView === 'banks') {
      return <BankDetailPage />;
    }

    // Contenu pour les admins
    if (isAdmin()) {
      switch (activeView) {
        case 'dashboard':
          return <EnhancedDashboardPage />;
        case 'formations':
          return <AdminFormationsPage />;
        case 'users':
          return <AdminUsersPage />;
        case 'banks':
          return <AdminBanksPage />;
        case 'settings':
          return <AdminSettingsPage />;
        default:
          return <EnhancedDashboardPage />;
      }
    }
    
    // Contenu pour les apprenants
    if (isLearner()) {
      switch (activeView) {
        case 'dashboard':
          return <LearnerDashboardPage />;
        case 'formations':
          return <LearnerFormationsPage />;
        case 'progress':
          return <LearnerProgressPage />;
        case 'certificates':
          return <LearnerCertificatesPage />;
        case 'calendar':
          return <CalendarPage />;
        case 'settings':
          return <LearnerSettingsPage />;
        default:
          return <LearnerDashboardPage />;
      }
    }

    return <div>Rôle non reconnu</div>;
  };

  // Fonction pour obtenir le titre de la vue active
  const getActiveViewTitle = () => {
    // Si l'utilisateur a choisi une vue spécifique, l'utiliser
    if (activeView !== 'banks') {
      const activeItem = getMenuItems().find(item => item.id === activeView);
      return activeItem ? activeItem.label : 'Tableau de bord';
    }

    // Si on est sur une page de détail de banque ET que l'utilisateur est sur l'onglet banques
    if (location.pathname.includes('/admin/banks/') && params.bankId && activeView === 'banks') {
      return 'Détails de la banque';
    }

    // Sinon, utiliser le titre normal
    const activeItem = getMenuItems().find(item => item.id === activeView);
    return activeItem ? activeItem.label : 'Tableau de bord';
  };

  // Fonction pour obtenir la description selon le rôle et la vue
  const getActiveViewDescription = () => {
    if (isAdmin()) {
      switch (activeView) {
        case 'dashboard': return 'Vue d\'ensemble de votre plateforme de formation';
        case 'formations': return 'Gérez les formations de votre plateforme';
        case 'users': return 'Gérez les collaborateurs de votre plateforme';
        case 'banks': return 'Gérez les banques de votre plateforme';
        // case 'stats': return 'Analysez les performances de votre plateforme';
        case 'settings': return 'Configurez votre plateforme';
        default: return '';
      }
    } else if (isLearner()) {
      switch (activeView) {
        case 'dashboard': return 'Vue d\'ensemble de vos formations et progression';
        case 'formations': return 'Consultez vos formations assignées';
        // case 'progress': return 'Suivez votre progression dans les formations';
        // case 'certificates': return 'Consultez vos certificats obtenus';
        // case 'calendar': return '';
        case 'settings': return 'Gérez vos préférences et paramètres';
        default: return '';
      }
    }
    return '';
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
        <p className="ml-4 text-gray-600">Chargement de l'interface...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirection vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  // Interface différente selon le rôle
  if (isLearner()) {
    // Interface apprenant avec navigation horizontale
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo et titre */}
              <div className="flex items-center">
                <button
                  className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                <div className="flex items-center ml-2 lg:ml-0">
                  <span className="text-2xl font-bold text-[#00314B]">BAI</span>
                  <span className="ml-2 text-xl text-[#C7B299] font-semibold">Formation</span>
                </div>
              </div>

              {/* Actions utilisateur */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full relative"
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Profil utilisateur */}
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentUser?.department || 'Apprenant'}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-[#C7B299] rounded-full flex items-center justify-center">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={`${currentUser.firstName} ${currentUser.lastName}`}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation horizontale sous le header */}
        <nav className="bg-white border-b border-gray-200 sticky top-16 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto">
              {learnerMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeView === item.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
              <div className="p-6 pt-20">
                {/* Informations utilisateur */}
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="h-10 w-10 bg-[#C7B299] rounded-full flex items-center justify-center">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={`${currentUser?.firstName} ${currentUser?.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentUser?.department || 'Apprenant'}
                    </p>
                  </div>
                </div>

                {/* Menu items mobile */}
                <div className="space-y-2">
                  {learnerMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleViewChange(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors w-full text-left ${
                        activeView === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Bouton de déconnexion mobile */}
                <div className="absolute bottom-6 left-6 right-6">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <main className="flex-1">
          <div className="p-6 lg:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{getActiveViewTitle()}</h1>
              <p className="text-gray-600 mt-1">{getActiveViewDescription()}</p>
            </div>
            {renderContent()}
          </div>
        </main>

        {/* Overlay pour notifications */}
        {isNotificationsOpen && (
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsNotificationsOpen(false)}
          />
        )}
      </div>
    );
  }

  // Interface admin avec sidebar (existante)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen bg-gray-100">
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
                    className="p-2 text-blue-900 hover:bg-blue-200 rounded-lg transition-colors flex items-center justify-center"
                    title={isSidebarCollapsed ? 'Ouvrir la sidebar' : 'Fermer la sidebar'}
                  >
                    {isSidebarCollapsed ? (
                      <Menu className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                    )}
                  </button>
                </div>

                {/* Titre */}
                {!isSidebarCollapsed && (
                  <div>
                    <div className="flex items-center px-4 py-2 text-blue-900">
                      <h1 className="text-xl font-bold">BAI Consulting</h1>
                    </div>
                    <p className="text-sm text-blue-900 px-4 mt-1">
                      {isAdmin() ? 'Administration' : 'Espace Apprenant'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Navigation principale */}
              <div className="flex flex-col flex-1 gap-3">
                {getMenuItems().map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        console.log('🖱️ Clic sur bouton:', item.id);
                        handleViewChange(item.id);
                      }}
                      className={`flex items-center ${isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-2'} mt-2 text-blue-900 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'hover:bg-blue-400 hover:text-white hover:shadow-md'
                      }`}
                      title={isSidebarCollapsed ? item.label : ''}
                    >
                      <span className={`flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
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
                    </button>
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
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white flex-shrink-0" />
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <>
                    <div className="flex-1 text-left ml-3">
                      <div className="font-medium text-blue-900">
                        {currentUser?.firstName} {currentUser?.lastName}
                      </div>
                      <div className="text-xs text-blue-700">
                        {currentUser?.email}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {isAdmin() ? 'Administrateur' : 'Apprenant'}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </>
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
                      <User className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                      Modifier le profil
                    </button>
                    <button
                      onClick={handleChangePassword}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Key className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                      Changer le mot de passe
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Contenu principal */}
        <main className={`flex flex-col flex-1 overflow-y-auto transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-4' : 'ml-4'
        }`}>
          <div className="flex items-center justify-between h-12 bg-white border-b border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center px-4">
              <div className="relative mx-auto text-gray-600">
                {/* Barre de recherche - peut être adaptée selon le rôle */}
                <button type="submit" className="absolute right-1 top-0 mt-3 mr-4">
                  <svg className="text-gray-600 h-4 w-4 fill-current"
                       xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1"
                       viewBox="0 0 56.966 56.966" xmlSpace="preserve" width="512px" height="512px">
                    <path d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23 
                     s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92 
                     c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17 
                     s-17-7.626-17-17S14.61,6,23.984,6z"/>
                  </svg>
                </button>
              </div>
            </div>
            {/* notification */}
            <div className="flex items-center space-x-4 mr-4">
              {/* Icônes de notification peuvent être ajoutées ici */}
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              {/* Titre dynamique */}
              <div>
                <h1 className="admin-title-lg admin-title-spacing">{getActiveViewTitle()}</h1>
                <p className="admin-text-lg admin-body-spacing">
                  {getActiveViewDescription()}
                </p>
              </div>
              
              {/* Contenu dynamique */}
              {renderContent()}
            </div>
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

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = () => {
  return (
    <SidebarProvider>
      <UnifiedLayoutContent />
    </SidebarProvider>
  );
};
