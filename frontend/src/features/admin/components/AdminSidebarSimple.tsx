import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Building2, 
  BarChart3, 
  Settings,
  User,
  LogOut,
  Key,
  ChevronDown,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { authService } from '../../../services/authService';
import { useToast } from '../../../components/ui/use-toast';

const menuItems = [
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

export const AdminSidebarSimple: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getActiveId = (pathname: string) => {
    if (pathname.includes('/admin/formations')) return 'formations';
    if (pathname.includes('/admin/users')) return 'users';
    if (pathname.includes('/admin/banks')) return 'banks';
    if (pathname.includes('/admin/stats')) return 'stats';
    if (pathname.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  const activeId = getActiveId(location.pathname);

  // Fonction pour se déconnecter
  const handleLogout = () => {
    authService.logout();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès",
    });
    navigate('/admin/login');
  };

  // Fonction pour basculer la sidebar
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const currentUser = authService.getCurrentUser();

  return (
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
                <p className="text-sm text-blue-900 px-4 mt-1">Administration</p>
              </div>
            )}
          </div>
          
          {/* Navigation principale */}
          <div className="flex flex-col flex-1 gap-3">
            {menuItems.map((item) => {
              const isActive = activeId === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => {
                    console.log('🖱️ TEST - Clic sur:', item.label, '-> vers:', item.path);
                  }}
                  className={`flex items-center ${isSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-2'} mt-2 text-blue-900 rounded-lg transition-colors no-underline ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'hover:bg-blue-400 hover:text-white hover:shadow-md'
                  }`}
                  title={isSidebarCollapsed ? item.label : ''}
                >
                  <span className={`flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
                  {!isSidebarCollapsed && (
                    <span className="flex-1 text-left">{item.label}</span>
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
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-3 py-2'} text-sm font-medium text-blue-900 rounded-lg hover:bg-blue-200 transition-colors`}
            title={isSidebarCollapsed ? `${currentUser?.firstName} ${currentUser?.lastName}` : ''}
          >
            <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
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
                  <div className="font-medium">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </div>
                  <div className="text-xs">
                    {currentUser?.email}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-brand-blue transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {/* Menu déroulant du profil */}
          {showProfileMenu && (
            <div className={`absolute bottom-full ${isSidebarCollapsed ? 'left-0 w-48' : 'left-0 right-0'} mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-10`}>
              <div className="py-1">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                  Modifier le profil
                </button>
                <button
                  onClick={() => setShowProfileMenu(false)}
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
  );
};
