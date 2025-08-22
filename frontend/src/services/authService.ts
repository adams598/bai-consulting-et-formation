import { User } from '../features/admin/types';
import { currentEnv } from '../config/environments';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  bankId?: string;
  bank?: any;
  department?: string;
  phone?: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private readonly USER_KEY = 'currentUser';
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  // Connexion
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${currentEnv.apiUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de connexion');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Stocker les données d'authentification
        this.setCurrentUser(data.data.user);
        this.setAccessToken(data.data.accessToken);
        this.setRefreshToken(data.data.refreshToken);
        
        return data.data;
      } else {
        throw new Error(data.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  }

  // Connexion Windows (SSO)
  async loginWindows(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${currentEnv.apiUrl}/api/admin/auth/login-windows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de connexion Windows');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Stocker les données d'authentification
        this.setCurrentUser(data.data.user);
        this.setAccessToken(data.data.accessToken);
        this.setRefreshToken(data.data.refreshToken);
        
        return data.data;
      } else {
        throw new Error(data.message || 'Erreur de connexion Windows');
      }
    } catch (error) {
      console.error('Erreur de connexion Windows:', error);
      throw error;
    }
  }

  // Rafraîchir le token
  async refreshToken(): Promise<RefreshResponse> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('Aucun refresh token disponible');
      }

      const response = await fetch(`${currentEnv.apiUrl}/api/admin/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de rafraîchissement du token');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Mettre à jour les tokens
        this.setAccessToken(data.data.accessToken);
        if (data.data.refreshToken) {
          this.setRefreshToken(data.data.refreshToken);
        }
        
        return data.data;
      } else {
        throw new Error(data.message || 'Erreur de rafraîchissement du token');
      }
    } catch (error) {
      console.error('Erreur de rafraîchissement du token:', error);
      throw error;
    }
  }

  // Déconnexion
  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const token = this.getAccessToken();
    return !!(user && token);
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Erreur lors du parsing de l\'utilisateur:', error);
        return null;
      }
    }
    return null;
  }

  // Obtenir le token d'accès
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // Obtenir le refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Définir l'utilisateur actuel
  private setCurrentUser(user: AuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Définir le token d'accès
  private setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  // Définir le refresh token
  private setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  // Vérifier les permissions
  hasPermission(requiredRole: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Logique de permissions basée sur les rôles
    if (user.role === 'SUPER_ADMIN') {
      return true; // Super admin a tous les droits
    }

    // Permissions pour les administrateurs de banque
    if (requiredRole === 'BANK_ADMIN') {
      return user.role === 'SUPER_ADMIN' || user.role === 'BANK_ADMIN';
    }

    // Permissions pour les collaborateurs
    if (requiredRole === 'COLLABORATOR') {
      return user.role === 'COLLABORATOR' ||
             user.role === 'BANK_ADMIN' ||
             user.role === 'SUPER_ADMIN';
    }

    return false;
  }

  // Mettre à jour les données utilisateur (après modification du profil)
  updateUser(userData: AuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
  }
}

export const authService = new AuthService(); 