import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Mail,
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Download,
  AlertCircle,
  Loader
} from 'lucide-react';
import { CalendarService, CalendarIntegration } from '../services/calendarService';

interface GoogleIntegrationProps {
  onIntegrationChange?: (integrations: CalendarIntegration[]) => void;
}

const GoogleIntegration: React.FC<GoogleIntegrationProps> = ({ onIntegrationChange }) => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);

  const googleIntegration = integrations.find(i => i.type === 'GOOGLE');

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await CalendarService.getIntegrations();
      setIntegrations(data);
      onIntegrationChange?.(data);
    } catch (error) {
      console.error('Erreur lors du chargement des intégrations:', error);
      setError('Erreur lors du chargement des intégrations');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { authUrl } = await CalendarService.getGoogleAuthUrl();
      
      // Ouvrir la fenêtre OAuth
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'authentification. Vérifiez que les popups sont autorisés.');
      }

      // Écouter la fermeture de la fenêtre
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          loadIntegrations(); // Recharger les intégrations
        }
      }, 1000);

    } catch (error) {
      console.error('Erreur lors de la connexion Google:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la connexion Google');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!googleIntegration) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await CalendarService.disconnectIntegration(googleIntegration.id);
      setSuccess('Connexion Google déconnectée avec succès');
      
      // Recharger les intégrations
      await loadIntegrations();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setError('Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      await CalendarService.syncGoogleCalendar();
      setSuccess('Calendrier Google synchronisé avec succès');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      setError('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const handleImportEvents = async () => {
    try {
      setImporting(true);
      setError(null);
      
      const result = await CalendarService.importFromGoogle();
      setSuccess(`${result.imported} événement(s) importé(s) sur ${result.total}`);
      
      // Recharger les intégrations pour mettre à jour lastSync
      await loadIntegrations();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setError('Erreur lors de l\'import des événements');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Google Calendar</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Synchronisez vos événements de formation</p>
        </div>
      </div>

      {/* Messages d'erreur/succès */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        {!googleIntegration?.isConnected ? (
          // État non connecté
          <div className="p-8">
            <div className="text-center space-y-4 mb-6">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Non connecté</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm">
                Connectez votre compte Google Calendar pour synchroniser automatiquement vos événements de formation
              </p>
            </div>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="h-5 w-5 animate-spin" /> : null}
              <span>Se connecter avec Google</span>
            </button>
          </div>
        ) : (
          // État connecté
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {/* Infos de connexion */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Connecté</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Email:</span> {googleIntegration.email}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Nom:</span> {googleIntegration.name}
                    </p>
                    {googleIntegration.lastSync && (
                      <p className="text-gray-500 dark:text-gray-500 text-xs">
                        Dernière sync: {new Date(googleIntegration.lastSync).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                  Actif
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="p-6 space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Options</h4>
              
              {/* Synchronisation */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Synchronisation</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {googleIntegration.syncEnabled ? 'Activée' : 'Désactivée'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing || !googleIntegration.syncEnabled}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  {syncing ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span>{syncing ? 'Synchro...' : 'Synchroniser'}</span>
                </button>
              </div>

              {/* Import */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Import des événements</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {googleIntegration.importEnabled ? 'Activé' : 'Désactivé'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleImportEvents}
                  disabled={importing || !googleIntegration.importEnabled}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  {importing ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span>{importing ? 'Import...' : 'Importer'}</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 dark:bg-slate-800 flex gap-3">
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Déconnecter</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Infos supplémentaires */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>ℹ️ Info:</strong> Une fois connecté, vos événements de formation seront automatiquement synchronisés avec votre calendrier Google. Vous pouvez contrôler la synchronisation dans les paramètres ci-dessus.
        </p>
      </div>
    </div>
  );
};

export default GoogleIntegration;
