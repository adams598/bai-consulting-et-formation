export interface EnvironmentConfig {
  name: string;
  apiUrl: string;
  isIntranet: boolean;
  authType: 'credentials' | 'windows' | 'both';
  allowedRoles: string[];
}

export const environments = {
  development: {
    name: 'Development',
    apiUrl: 'http://localhost:3000',
    isIntranet: false,
    authType: 'credentials' as const,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'COLLABORATOR']
  },
  
  intranet: {
    name: 'Intranet Admin',
    apiUrl: 'https://admin-api.bai-consulting.local',
    isIntranet: true,
    authType: 'credentials' as const,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN']
  },
  
  formation: {
    name: 'Formation Public',
    apiUrl: 'https://api.bai-consulting.com',
    isIntranet: false,
    authType: 'credentials' as const,
    allowedRoles: ['COLLABORATOR']
  },
  
  production: {
    name: 'Production',
    apiUrl: 'https://bai-consulting-et-formation-git-dev-adams-projects-b35f6371.vercel.app',
    isIntranet: false,
    authType: 'credentials' as const,
    allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'COLLABORATOR']
  }
};

// Détection automatique de l'environnement
export const getCurrentEnvironment = (): EnvironmentConfig => {
  // Priorité 1: Utiliser VITE_API_URL si défini (variable d'environnement au build)
  if (import.meta.env.VITE_API_URL) {
    return {
      name: 'Production',
      apiUrl: import.meta.env.VITE_API_URL,
      isIntranet: false,
      authType: 'credentials' as const,
      allowedRoles: ['SUPER_ADMIN', 'BANK_ADMIN', 'COLLABORATOR']
    };
  }
  
  const hostname = window.location.hostname;
  
  // Développement local
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return environments.development;
  }
  
  // Intranet/Admin
  if (hostname.includes('admin') || hostname.includes('intranet') || hostname.includes('.local')) {
    return environments.intranet;
  }
  
  // Production (Hostinger, etc.) - utiliser le backend Render
  if (hostname.includes('hostinger') || hostname.includes('hostingersite') || hostname.includes('.com') || hostname.includes('.net') || hostname.includes('.org')) {
    return environments.production;
  }
  
  // Par défaut: formation
  return environments.formation;
};

export const currentEnv = getCurrentEnvironment(); 