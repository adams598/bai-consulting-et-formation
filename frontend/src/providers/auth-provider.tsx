"use client";

import { createContext, useContext, useEffect, useState } from "react";
// import type { User } from "@prisma/client"; // Retirer l'importation de Prisma
import { useNavigate } from 'react-router-dom';
// Import unifié pour l'authentification
import { currentEnv } from '../config/environments';
import { useToast } from '../components/ui/use-toast';

// Définir le type User pour le frontend, en accord avec le backend
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "BANK_ADMIN" | "COLLABORATOR"; 
  avatar?: string;
  department?: string;
  phone?: string;
  bankId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  // resetPassword: (token: string, password: string) => Promise<void>; // Retiré pour l'instant
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fonction pour stocker le token de manière sécurisée (unifié admin/apprenant)
const setSecureToken = (token: string) => {
  // Utiliser le même système que l'admin
  localStorage.setItem('bai_auth_token', token);
  localStorage.setItem('accessToken', token); // Fallback pour compatibilité
  localStorage.setItem('auth_token', token); // Fallback pour compatibilité
  sessionStorage.setItem('auth_token', token);
};

const getSecureToken = (): string | null => {
  return localStorage.getItem('bai_auth_token') || 
         localStorage.getItem('accessToken') || 
         localStorage.getItem('auth_token') || 
         sessionStorage.getItem('auth_token');
};

const removeSecureToken = () => {
  localStorage.removeItem('bai_auth_token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('currentUser');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function loadUserFromSession() {
      const token = getSecureToken();
      
      if (token) {
        try {
          // Utiliser l'API admin unifiée pour tous les utilisateurs
          const response = await fetch(`${currentEnv.apiUrl}/api/admin/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
              // L'API retourne { user: {...} }, donc extraire l'utilisateur
              const userData = data.data.user || data.data;
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              localStorage.setItem('currentUser', JSON.stringify(userData));
            } else {
              console.warn('Données invalides dans la réponse API');
              removeSecureToken();
              window.location.href = '/login';
            }
          } else {
            // Token invalide ou expiré
            console.warn('Token invalide ou expiré, redirection vers la connexion');
            removeSecureToken();
            
            // Si on est sur une page protégée, rediriger vers login
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/admin') || currentPath.startsWith('/apprenant')) {
              window.location.href = '/login';
            }
          }
        } catch (error) {
          console.error("Échec de la récupération de la session utilisateur:", error);
          removeSecureToken();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    loadUserFromSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Utiliser l'API admin unifiée pour tous les utilisateurs
      const response = await fetch(`${currentEnv.apiUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de connexion');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const { user: userData, accessToken } = data.data;
        
        setUser(userData);
        setSecureToken(accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(userData));

        // Redirection unifiée - tous les utilisateurs authentifiés vont vers /admin
        // Le UnifiedLayoutWrapper s'occupera d'afficher l'interface selon le rôle
        navigate("/admin");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Utiliser l'API admin unifiée pour la déconnexion
      const token = getSecureToken();
      if (token) {
        await fetch(`${currentEnv.apiUrl}/api/admin/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      removeSecureToken();
      setUser(null);
      navigate("/login"); // Utiliser la page de login unifiée
    }
  };

  const requestPasswordReset = async (email: string) => {
    // Cette fonctionnalité sera implémentée plus tard côté backend
    throw new Error('Fonctionnalité de réinitialisation de mot de passe non encore disponible');
  };

  // Gestion de l'expiration de session - géré directement dans AuthProvider
  const [sessionTimeoutRef, setSessionTimeoutRef] = useState<NodeJS.Timeout | null>(null);
  const [sessionWarningRef, setSessionWarningRef] = useState<NodeJS.Timeout | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  const WARNING_TIME = 2 * 60 * 1000; // Avertir 2 minutes avant l'expiration

  const clearSessionTimers = () => {
    if (sessionTimeoutRef) {
      clearTimeout(sessionTimeoutRef);
      setSessionTimeoutRef(null);
    }
    if (sessionWarningRef) {
      clearTimeout(sessionWarningRef);
      setSessionWarningRef(null);
    }
  };

  const refreshUserToken = async () => {
    try {
      const currentToken = getSecureToken();
      if (!currentToken) return;

      // Appeler l'endpoint /me pour rafraîchir la session côté serveur
      const response = await fetch(`${currentEnv.apiUrl}/api/admin/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // L'API retourne { user: {...} }, donc extraire l'utilisateur
          const userData = data.data.user || data.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('currentUser', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.warn('Erreur lors du rafraîchissement du token:', error);
    }
  };

  const resetSessionTimer = async () => {
    if (!user) return;

    clearSessionTimers();
    setLastActivity(Date.now());
    
    // Vérifier si le token doit être rafraîchi (toutes les heures)
    const currentToken = getSecureToken();
    if (currentToken) {
      try {
        // Décoder le token pour vérifier sa date d'expiration
        const payload = JSON.parse(atob(currentToken.split('.')[1]));
        const tokenExpiry = payload.exp * 1000; // Convertir en millisecondes
        const now = Date.now();
        const timeUntilExpiry = tokenExpiry - now;
        
        // Si le token expire dans moins de 30 minutes, le rafraîchir
        if (timeUntilExpiry < 30 * 60 * 1000) {
          await refreshUserToken();
        }
      } catch (error) {
        // Si on ne peut pas décoder le token, on continue sans rafraîchir
        console.warn('Impossible de décoder le token pour vérification');
      }
    }

    // Timer d'avertissement - notification discrète 2min avant expiration
    const warningTimer = setTimeout(() => {
      toast({
        title: "⏰ Session bientôt expirée",
        description: "Votre session expirera dans 2 minutes d'inactivité. Bougez la souris pour la prolonger.",
        duration: 8000, // Afficher pendant 8 secondes
      });
    }, INACTIVITY_TIMEOUT - WARNING_TIME);
    setSessionWarningRef(warningTimer);

    // Timer d'expiration - rechargement automatique
    const timeoutTimer = setTimeout(() => {
      // Nettoyer les tokens
      removeSecureToken();
      
      // Notification rapide avant rechargement
      toast({
        title: "🔒 Session expirée",
        description: "Redirection vers la page de connexion...",
        variant: "destructive",
        duration: 2000,
      });
      
      // Recharger la page après un court délai pour voir la notification
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }, INACTIVITY_TIMEOUT);
    setSessionTimeoutRef(timeoutTimer);

  };

  const trackActivity = () => {
    if (!user) return;
    resetSessionTimer();
  };

  // Gestionnaire d'activité avec throttle
  useEffect(() => {
    if (!user) {
      clearSessionTimers();
      return;
    }

    // Initialiser le timer
    resetSessionTimer();

    // Liste des événements à surveiller pour l'activité
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle pour éviter trop d'appels - mais reset immédiat
    let lastResetTime = 0;
    const throttledTrackActivity = (eventType: string) => {
      const now = Date.now();
      const timeSinceLastReset = now - lastResetTime;
      
      // Throttle plus court pour permettre le reset régulier
      if (timeSinceLastReset < 2000) { // 2 secondes de throttle
        return;
      }
      lastResetTime = now;
      trackActivity();
    };

    // Ajouter les listeners d'événements
    const listeners: { [key: string]: () => void } = {};
    events.forEach(event => {
      const listener = () => throttledTrackActivity(event);
      listeners[event] = listener;
      document.addEventListener(event, listener, true);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, listeners[event], true);
      });
      
      clearSessionTimers();
    };
  }, [user]);

  // Les fonctions d'extension de session ne sont plus nécessaires
  // car l'activité de l'utilisateur prolonge automatiquement la session

  // Les fonctions requestPasswordReset et resetPassword sont commentées car les routes backend ne sont pas encore prêtes pour cela.
  // Si vous les implémentez côté backend, vous pourrez les décommenter ici et les connecter à authApi.ts.

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        requestPasswordReset,
        // resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}