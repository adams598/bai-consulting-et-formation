import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { currentEnv } from '../../config/environments';
import { authService } from '../../services/authService';
import { UserRole } from '../../features/admin/types';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface IntranetGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

export const IntranetGuard: React.FC<IntranetGuardProps> = ({
  children,
  requiredRole,
  fallback
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, [location.pathname]);

  const checkAccess = async () => {
    try {
      setIsChecking(true);
      setError(null);

      // 1. Vérifier si on est sur l'intranet (sauf en développement)
      if (!currentEnv.isIntranet && currentEnv.name !== 'Development') {
        setError('Accès intranet requis');
        setHasAccess(false);
        return;
      }

      // 2. Vérifier l'authentification (simulation pour le développement)
      if (currentEnv.name === 'Development') {
        // En développement, on simule une authentification réussie
        setHasAccess(true);
        return;
      }

      // Vérifications normales pour la production
      if (!authService.isAuthenticated()) {
        setError('Authentification requise');
        setHasAccess(false);
        return;
      }

      // 3. Vérifier les permissions
      const user = authService.getCurrentUser();
      if (!user) {
        setError('Utilisateur non trouvé');
        setHasAccess(false);
        return;
      }

      // Vérifier si l'utilisateur peut accéder à l'admin
      if (!authService.canAccessAdmin()) {
        setError('Accès administrateur requis');
        setHasAccess(false);
        return;
      }

      // Vérifier le rôle spécifique si demandé
      if (requiredRole && !authService.hasPermission(requiredRole)) {
        setError(`Permission ${requiredRole} requise`);
        setHasAccess(false);
        return;
      }

      // 4. Rafraîchir le token si nécessaire
      await authService.ensureValidToken();

      setHasAccess(true);
    } catch (error) {
      console.error('Erreur de vérification d\'accès:', error);
      setError('Erreur de vérification d\'accès');
      setHasAccess(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogin = () => {
    navigate('/admin/login');
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de l'accès...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Accès Restreint
            </h2>
            
            <p className="mt-2 text-gray-600">
              {error || 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.'}
            </p>

            <div className="mt-6 space-y-3">
              {!authService.isAuthenticated() ? (
                <Button onClick={handleLogin} className="w-full">
                  Se connecter
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        Vous êtes connecté mais n'avez pas les permissions admin.
                      </span>
                    </div>
                  </div>
                  
                  <Button variant="outline" onClick={handleLogout} className="w-full">
                    Se déconnecter
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Environnement: {currentEnv.name}
              </p>
              <p className="text-xs text-gray-500">
                URL: {window.location.hostname}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 