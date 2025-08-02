import { currentEnv } from '../config/environments';
import { User, UserRole } from '../features/admin/types';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  bankId?: string;
  department?: string;
  isActive: boolean;
  lastLogin?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

class AuthService {
  private readonly API_URL = currentEnv.apiUrl;
  private readonly STORAGE_KEY = 'bai_auth_token';
  private readonly USER_KEY = 'bai_auth_user';

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    if (!token || !user) {
      return false;
    }

    // Vérifier si le token n'est pas expiré
    const expiresAt = localStorage.getItem('bai_auth_expires');
    if (expiresAt && new Date(expiresAt) < new Date()) {
      this.logout();
      return false;
    }

    return true;
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Obtenir le token d'authentification
  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  // Connexion avec identifiants
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.API_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur de connexion');
    }

    const data = await response.json();
    
    // Sauvegarder les données d'authentification
    this.saveAuthData(data.data);
    
    return data.data;
  }

  // Connexion Windows (pour intranet)
  async loginWindows(): Promise<AuthResponse> {
    if (!currentEnv.isIntranet) {
      throw new Error('Authentification Windows non disponible en dehors de l\'intranet');
    }

    const response = await fetch(`${this.API_URL}/auth/windows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclure les cookies Windows
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur d\'authentification Windows');
    }

    const data: AuthResponse = await response.json();
    this.saveAuthData(data);
    
    return data;
  }

  // Vérifier les permissions
  hasPermission(requiredRole: UserRole): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Vérifier si l'utilisateur a le rôle requis
    if (user.role === UserRole.SUPER_ADMIN) {
      return true; // Super admin a tous les droits
    }

    return user.role === requiredRole;
  }

  // Vérifier si l'utilisateur peut accéder à l'espace admin
  canAccessAdmin(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.BANK_ADMIN;
  }

  // Vérifier si l'utilisateur peut accéder à l'espace formation
  canAccessFormation(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.role === UserRole.COLLABORATOR || 
           user.role === UserRole.BANK_ADMIN || 
           user.role === UserRole.SUPER_ADMIN;
  }

  // Rafraîchir le token
  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('bai_refresh_token');
    if (!refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    const response = await fetch(`${this.API_URL}/admin/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Impossible de rafraîchir le token');
    }

    const data = await response.json();
    this.saveAuthData(data.data);
  }

  // Déconnexion
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('bai_refresh_token');
    localStorage.removeItem('bai_auth_expires');
    
    // Rediriger vers la page de connexion appropriée
    if (currentEnv.isIntranet) {
      window.location.href = '/admin/login';
    } else {
      window.location.href = '/formation/login';
    }
  }

  // Sauvegarder les données d'authentification
  private saveAuthData(data: AuthResponse): void {
    localStorage.setItem(this.STORAGE_KEY, data.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    
    if (data.refreshToken) {
      localStorage.setItem('bai_refresh_token', data.refreshToken);
    }
  }

  // Obtenir les headers d'authentification pour les requêtes API
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Vérifier et rafraîchir automatiquement le token si nécessaire
  async ensureValidToken(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Utilisateur non authentifié');
    }

    // Pour l'instant, on ne fait pas de vérification automatique d'expiration
    // Le backend gère l'expiration des tokens
  }
}

export const authService = new AuthService(); 