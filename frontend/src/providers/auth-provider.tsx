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
      navigate("/admin/login"); // Utiliser la page de login unifiée
    }
  };

  const requestPasswordReset = async (email: string) => {
    // Cette fonctionnalité sera implémentée plus tard côté backend
    throw new Error('Fonctionnalité de réinitialisation de mot de passe non encore disponible');
  };

  // Le suivi d'inactivité forcé provoquait des déconnexions pendant l'usage.
  // On s'appuie désormais uniquement sur l'expiration naturelle du token côté backend.

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