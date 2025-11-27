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
  }
};

// Détection automatique de l'environnement
export const getCurrentEnvironment = (): EnvironmentConfig => {
  const hostname = window.location.hostname;
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return environments.development;
  }
  
  if (hostname.includes('admin') || hostname.includes('intranet') || hostname.includes('.local')) {
    return environments.intranet;
  }
  
  return environments.formation;
};

export const currentEnv = getCurrentEnvironment(); 