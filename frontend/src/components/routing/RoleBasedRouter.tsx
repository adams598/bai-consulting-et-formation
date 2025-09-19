import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';

interface RoleBasedRouterProps {
  children: React.ReactNode;
}

export const RoleBasedRouter: React.FC<RoleBasedRouterProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    handleRoleBasedRouting();
  }, [location.pathname]);

  const handleRoleBasedRouting = () => {
    // Vérifier si l'utilisateur est authentifié
    if (!authService.isAuthenticated()) {
      return; // Laisser le système de routage normal gérer la redirection vers login
    }

    const user = authService.getCurrentUser();
    if (!user) {
      return;
    }

    const currentPath = location.pathname;

    // Définir les routes autorisées pour chaque rôle
    const adminRoutes = [
      '/admin',
      '/admin/dashboard',
      '/admin/formations',
      '/admin/users',
      '/admin/banks',
      '/admin/stats',
      '/admin/settings',
      '/admin/opportunities'
    ];

    const learnerRoutes = [
      '/admin',
      '/admin/dashboard',
      '/admin/formations',
      '/admin/progress',
      '/admin/certificates'
    ];

    // Routes communes (accessibles par tous les utilisateurs authentifiés)
    const commonRoutes = [
      '/admin/login',
      '/admin/logout'
    ];

    // Vérifier si la route actuelle est autorisée pour le rôle de l'utilisateur
    const isAuthorizedRoute = () => {
      // Routes communes toujours autorisées
      if (commonRoutes.some(route => currentPath.startsWith(route))) {
        return true;
      }

      // Vérifier selon le rôle
      if (user.role === 'SUPER_ADMIN' || user.role === 'BANK_ADMIN') {
        return adminRoutes.some(route => currentPath.startsWith(route));
      } else if (user.role === 'COLLABORATOR') {
        return learnerRoutes.some(route => currentPath.startsWith(route));
      }

      return false;
    };

    // Si la route n'est pas autorisée, rediriger vers la page appropriée
    if (!isAuthorizedRoute()) {
      console.log(`Route non autorisée pour le rôle ${user.role}: ${currentPath}`);
      
      if (user.role === 'SUPER_ADMIN' || user.role === 'BANK_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'COLLABORATOR') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/admin/login', { replace: true });
      }
    }

    // Redirection automatique depuis la racine admin
    if (currentPath === '/admin' || currentPath === '/admin/') {
      if (user.role === 'SUPER_ADMIN' || user.role === 'BANK_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'COLLABORATOR') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  };

  return <>{children}</>;
};

// Hook pour obtenir la route par défaut selon le rôle
export const useDefaultRoute = () => {
  const user = authService.getCurrentUser();
  
  if (!user) {
    return '/admin/login';
  }

  switch (user.role) {
    case 'SUPER_ADMIN':
    case 'BANK_ADMIN':
      return '/admin/dashboard';
    case 'COLLABORATOR':
      return '/admin/dashboard';
    default:
      return '/admin/login';
  }
};

// Hook pour vérifier si une route est autorisée pour l'utilisateur actuel
export const useIsRouteAuthorized = (route: string) => {
  const user = authService.getCurrentUser();
  
  if (!user) {
    return false;
  }

  const adminRoutes = [
    '/admin',
    '/admin/dashboard',
    '/admin/formations',
    '/admin/users',
    '/admin/banks',
    '/admin/stats',
    '/admin/settings',
    '/admin/opportunities'
  ];

  const learnerRoutes = [
    '/admin',
    '/admin/dashboard',
    '/admin/formations',
    '/admin/progress',
    '/admin/certificates'
  ];

  const commonRoutes = [
    '/admin/login',
    '/admin/logout'
  ];

  // Routes communes toujours autorisées
  if (commonRoutes.some(r => route.startsWith(r))) {
    return true;
  }

  // Vérifier selon le rôle
  if (user.role === 'SUPER_ADMIN' || user.role === 'BANK_ADMIN') {
    return adminRoutes.some(r => route.startsWith(r));
  } else if (user.role === 'COLLABORATOR') {
    return learnerRoutes.some(r => route.startsWith(r));
  }

  return false;
};
