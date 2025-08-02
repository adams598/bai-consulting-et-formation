import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  ChevronDown,
  Plus,
  User
} from 'lucide-react';
import { Bank, User as UserType } from '../types';
import { banksApi, adminAuthApi } from '../../../api/adminApi';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../components/ui/use-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  {
    label: 'Tableau de bord',
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: '/admin/dashboard'
  },
  {
    label: 'Formations',
    icon: <BookOpen className="w-5 h-5" />,
    href: '/admin/formations'
  },
  {
    label: 'Collaborateurs',
    icon: <Users className="w-5 h-5" />,
    href: '/admin/users'
  },
  {
    label: 'Banques',
    icon: <Building2 className="w-5 h-5" />,
    href: '/admin/banks'
  },
  {
    label: 'Statistiques',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/admin/stats'
  },
  {
    label: 'Paramètres',
    icon: <Settings className="w-5 h-5" />,
    href: '/admin/settings'
  }
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [notifications, setNotifications] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        // Données de test pour le développement
        const mockUser = {
          id: 'admin-1',
          firstName: 'Admin',
          lastName: 'BAI',
          email: 'admin@bai-consulting.com',
          role: 'SUPER_ADMIN',
          bankId: 'bank-1',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const mockBanks = [
          { id: 'bank-1', name: 'Banque Populaire', code: 'BP', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 'bank-2', name: 'Crédit Agricole', code: 'CA', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 'bank-3', name: 'BNP Paribas', code: 'BNP', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ];
        
        setCurrentUser(mockUser);
        setBanks(mockBanks);
        setSelectedBank(mockBanks[0]);
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        navigate('/admin/login');
      }
    };

    initializeAdmin();
  }, [navigate]);

  const handleBankChange = async (bank: Bank) => {
    try {
      // Simulation de changement de banque pour le développement
      setSelectedBank(bank);
      setShowBankDropdown(false);
      toast({
        title: "Banque changée",
        description: `Vous gérez maintenant ${bank.name}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de changer de banque",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Simulation de déconnexion pour le développement
      navigate('/admin/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">BAI Consulting</h1>
              </div>
            </div>

            {/* Actions de droite */}
            <div className="flex items-center space-x-4">
              {/* Sélecteur de banque */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowBankDropdown(!showBankDropdown)}
                  className="flex items-center space-x-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{selectedBank?.name || 'Sélectionner une banque'}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {showBankDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">Banques</h3>
                        <Button size="sm" variant="outline" className="flex items-center space-x-1">
                          <Plus className="w-3 h-3" />
                          <span>Nouvelle</span>
                        </Button>
                      </div>
                      
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {banks.map((bank) => (
                          <button
                            key={bank.id}
                            onClick={() => handleBankChange(bank)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 ${
                              selectedBank?.id === bank.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{bank.name}</span>
                              {!bank.isActive && (
                                <span className="text-xs text-gray-500">Inactive</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{bank.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>

              {/* Profil utilisateur */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-700">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Déconnexion</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <nav className="mt-8">
            <div className="px-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}; 
        {/* Contenu principal */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}; 