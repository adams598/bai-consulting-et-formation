"use client";

import { createContext, useContext, useEffect, useState } from "react";
// import type { User } from "@prisma/client"; // Retirer l'importation de Prisma
import { useNavigate } from 'react-router-dom';
import { login as authLoginApi } from '../api/authApi'; // Importez le login depuis authApi

// Définir le type User pour le frontend, en accord avec le backend
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "LEARNER"; 
  avatar?: string;
  company?: string;
  position?: string;
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

// Fonction pour stocker le token de manière sécurisée
const setSecureToken = (token: string) => {
  // En production, utiliser des cookies httpOnly
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    // Essayer d'utiliser des cookies sécurisés
    document.cookie = `auth_token=${token}; path=/; secure; samesite=strict; max-age=${7 * 24 * 60 * 60}`;
  } else {
    // Fallback vers localStorage avec préfixe sécurisé
    localStorage.setItem('bai_auth_token', token);
  }
};

const getSecureToken = (): string | null => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    // Récupérer depuis les cookies
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }
  return localStorage.getItem('bai_auth_token');
};

const removeSecureToken = () => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
  localStorage.removeItem('bai_auth_token');
  localStorage.removeItem('user');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUserFromSession() {
      const token = getSecureToken();
      if (token) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/learner';
        console.log('API URL used for profile:', apiUrl);
        try {
          const response = await fetch(`${apiUrl}/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data);
          } else {
            let errorMessage = 'Échec de la récupération de profil.';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
              const textError = await response.text();
              errorMessage = textError || errorMessage;
              console.warn("La réponse d'erreur n'est pas JSON:", textError);
            }
            console.error("Erreur de récupération de profil:", errorMessage);
            removeSecureToken(); 
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
      const { token, user: userData } = await authLoginApi(email, password);
      setSecureToken(token);
      setUser(userData);

      // Redirection basée sur le rôle de l'utilisateur
      if (userData.role === "ADMIN") {
        navigate("/admin"); // Assurez-vous d'avoir une route /admin
      } else {
        navigate("/apprenant/dashboard"); // Redirection vers le dashboard apprenant
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeSecureToken();
    setUser(null);
    navigate("/");
  };

  const requestPasswordReset = async (email: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/learner';
    const response = await fetch(`${apiUrl}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la demande de réinitialisation');
    }

    return response.json();
  };

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