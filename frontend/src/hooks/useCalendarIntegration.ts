import { useState, useCallback, useEffect } from 'react';
import { CalendarService, CalendarIntegration } from '../services/calendarService';

interface UseCalendarIntegrationOptions {
  autoLoad?: boolean;
  refreshInterval?: number; // en ms
}

export const useCalendarIntegration = (options: UseCalendarIntegrationOptions = {}) => {
  const {
    autoLoad = true,
    refreshInterval = 0, // pas de refresh auto par défaut
  } = options;

  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger les intégrations
  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CalendarService.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
      console.error('Erreur loadIntegrations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialiser et charger les intégrations au montage
  useEffect(() => {
    if (autoLoad) {
      loadIntegrations();
    }
  }, [autoLoad, loadIntegrations]);

  // Refresh automatique
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      loadIntegrations();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, loadIntegrations]);

  // Connexion à Google
  const connectGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { authUrl } = await CalendarService.getGoogleAuthUrl();

      return new Promise<void>((resolve, reject) => {
        const popup = window.open(
          authUrl,
          'google-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          reject(new Error('Impossible d\'ouvrir la fenêtre d\'authentification'));
          return;
        }

        const checkInterval = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkInterval);
            loadIntegrations(); // Recharger après fermeture
            resolve();
          }
        }, 500);

        // Timeout après 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          popup.close();
          reject(new Error('Authentification timeout'));
        }, 5 * 60 * 1000);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la connexion Google';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadIntegrations]);

  // Connexion à Outlook
  const connectOutlook = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { authUrl } = await CalendarService.getOutlookAuthUrl();

      return new Promise<void>((resolve, reject) => {
        const popup = window.open(
          authUrl,
          'outlook-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          reject(new Error('Impossible d\'ouvrir la fenêtre d\'authentification'));
          return;
        }

        const checkInterval = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkInterval);
            loadIntegrations();
            resolve();
          }
        }, 500);

        setTimeout(() => {
          clearInterval(checkInterval);
          popup.close();
          reject(new Error('Authentification timeout'));
        }, 5 * 60 * 1000);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la connexion Outlook';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadIntegrations]);

  // Déconnexion
  const disconnect = useCallback(async (integrationId: string) => {
    try {
      setLoading(true);
      setError(null);

      await CalendarService.disconnectIntegration(integrationId);
      setSuccess('Calendrier déconnecté avec succès');

      // Recharger les intégrations
      await loadIntegrations();

      // Masquer le message après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la déconnexion';
      setError(message);
      console.error('Erreur disconnect:', err);
    } finally {
      setLoading(false);
    }
  }, [loadIntegrations]);

  // Synchronisation Google
  const syncGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await CalendarService.syncGoogleCalendar();
      setSuccess('Google Calendar synchronisé');

      // Recharger après sync
      await loadIntegrations();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la synchronisation';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadIntegrations]);

  // Synchronisation Outlook
  const syncOutlook = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await CalendarService.syncOutlookCalendar();
      setSuccess('Outlook Calendar synchronisé');

      await loadIntegrations();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la synchronisation';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadIntegrations]);

  // Import Google
  const importGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await CalendarService.importFromGoogle();
      setSuccess(`${result.imported} événement(s) importé(s) sur ${result.total}`);

      await loadIntegrations();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'import';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadIntegrations]);

  // Import Outlook
  const importOutlook = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await CalendarService.importFromOutlook();
      setSuccess(`${result.imported} événement(s) importé(s) sur ${result.total}`);

      await loadIntegrations();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'import';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadIntegrations]);

  // Obtenir l'intégration par type
  const getIntegrationByType = useCallback((type: 'GOOGLE' | 'OUTLOOK') => {
    return integrations.find(i => i.type === type);
  }, [integrations]);

  // Vérifier si connecté
  const isConnected = useCallback((type: 'GOOGLE' | 'OUTLOOK') => {
    const integration = getIntegrationByType(type);
    return integration?.isConnected ?? false;
  }, [getIntegrationByType]);

  // Effacer les messages
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    // État
    integrations,
    loading,
    error,
    success,

    // Actions
    loadIntegrations,
    connectGoogle,
    connectOutlook,
    disconnect,
    syncGoogle,
    syncOutlook,
    importGoogle,
    importOutlook,

    // Utilitaires
    getIntegrationByType,
    isConnected,
    clearMessages,
  };
};

export default useCalendarIntegration;
