import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  BarChart, 
  Award, 
  Settings, 
  LogOut, 
  Bell,
  User,
  Menu,
  X,
  Home,
  Target,
  Calendar
} from 'lucide-react';
import { LearnerProfile, LearnerNotification } from '../types';
import { profileApi, notificationsApi } from '../../../api/learnerApi';
import { useToast } from '../../../components/ui/use-toast';
import { useAuth } from '../../../providers/auth-provider';

interface LearnerLayoutProps {
  children: React.ReactNode;
}

const LearnerLayout: React.FC<LearnerLayoutProps> = ({ children }) => {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [notifications, setNotifications] = useState<LearnerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout: authLogout } = useAuth();

  // Menu items
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: <Home className="h-5 w-5" />,
      path: '/apprenant/dashboard',
      active: location.pathname === '/apprenant/dashboard' || location.pathname === '/apprenant'
    },
    {
      id: 'formations',
      label: 'Mes formations',
      icon: <BookOpen className="h-5 w-5" />,
      path: '/apprenant/courses',
      active: location.pathname.startsWith('/apprenant/courses')
    },
    {
      id: 'opportunities',
      label: 'Opportunités',
      icon: <Target className="h-5 w-5" />,
      path: '/apprenant/opportunities',
      active: location.pathname === '/apprenant/opportunities'
    },
    {
      id: 'agenda',
      // label: 'Mon agenda',
      icon: <Calendar className="h-5 w-5" />,
      path: '/apprenant/agenda',
      active: location.pathname === '/apprenant/agenda'
    },
    {
      id: 'progression',
      label: 'Progression',
      icon: <BarChart className="h-5 w-5" />,
      path: '/apprenant/progression',
      active: location.pathname === '/apprenant/progression'
    },
    {
      id: 'certificats',
      label: 'Certificats',
      icon: <Award className="h-5 w-5" />,
      path: '/apprenant/certificates',
      active: location.pathname === '/apprenant/certificates'
    },
    {
      id: 'parametres',
      label: 'Paramètres',
      icon: <Settings className="h-5 w-5" />,
      path: '/apprenant/parametres',
      active: location.pathname === '/apprenant/parametres'
    }
  ];

  // Charger le profil et les notifications
  useEffect(() => {
    loadProfile();
    loadNotifications();
  }, []);

  const loadProfile = async () => {
    try {
      // Utiliser les données du user connecté si disponibles
      if (user) {
        setProfile({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department,
          avatar: user.avatar,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Sinon charger depuis l'API
        const response = await profileApi.getProfile();
        setProfile(response.data);
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

  const loadNotifications = async () => {
    try {
      const [notifResponse, countResponse] = await Promise.all([
        notificationsApi.getMyNotifications(1, 5),
        notificationsApi.getUnreadCount()
      ]);
      
      setNotifications(notifResponse.data);
      setUnreadCount(countResponse.data.count);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  const handleNotificationClick = async (notification: LearnerNotification) => {
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
      }
    }

    // Navigation basée sur le type de notification
    if (notification.relatedFormationId) {
      navigate(`/apprenant/courses/${notification.relatedFormationId}`);
    }
    setIsNotificationsOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

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

                {/* Dropdown notifications */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(notification.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          Aucune notification
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-gray-200">
                      <Link
                        to="/apprenant/notifications"
                        className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        Voir toutes les notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profil utilisateur */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.firstName} {profile?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profile?.department || 'Apprenant'}
                  </p>
                </div>
                <div className="h-8 w-8 bg-[#C7B299] rounded-full flex items-center justify-center">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={`${profile.firstName} ${profile.lastName}`}
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
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  item.active
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
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
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={`${profile?.firstName} ${profile?.lastName}`}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.firstName} {profile?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profile?.department || 'Apprenant'}
                  </p>
                </div>
              </div>

              {/* Menu items mobile */}
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      item.active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
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
          {children}
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
};

export default LearnerLayout;
