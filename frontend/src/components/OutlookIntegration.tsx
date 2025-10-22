import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ExternalLink, 
  Settings, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Download,
  Upload,
  AlertCircle
} from 'lucide-react';
import { CalendarService, CalendarIntegration } from '../services/calendarService';

interface OutlookIntegrationProps {
  onIntegrationChange?: (integrations: CalendarIntegration[]) => void;
}

const OutlookIntegration: React.FC<OutlookIntegrationProps> = ({ onIntegrationChange }) => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const outlookIntegration = integrations.find(i => i.type === 'OUTLOOK');

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
      
      const { authUrl } = await CalendarService.getOutlookAuthUrl();
      
      // Ouvrir la fenêtre OAuth
      const popup = window.open(
        authUrl,
        'outlook-auth',
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
      console.error('Erreur lors de la connexion Outlook:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la connexion Outlook');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await CalendarService.disconnectIntegration('OUTLOOK');
      setSuccess('Connexion Outlook déconnectée avec succès');
      
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

  const handleImportEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await CalendarService.importFromOutlook();
      setSuccess(`${result.imported} événements importés sur ${result.total} trouvés`);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setError('Erreur lors de l\'import des événements');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (settings: {
    syncEnabled: boolean;
    importEnabled: boolean;
    exportEnabled: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      await CalendarService.updateIntegrationSettings('OUTLOOK', settings);
      setSuccess('Paramètres mis à jour avec succès');
      
      // Recharger les intégrations
      await loadIntegrations();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      setError('Erreur lors de la mise à jour des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Jamais';
    const date = new Date(lastSync);
    return date.toLocaleString('fr-FR');
  };

  if (loading && integrations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement des intégrations...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Intégration Outlook Calendar</h3>
            <p className="text-sm text-gray-500">Synchronisez vos événements avec votre calendrier Outlook</p>
          </div>
        </div>
        
        {outlookIntegration?.isConnected && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Connecté</span>
          </div>
        )}
      </div>

      {/* Messages de statut */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <XCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 text-sm">{success}</span>
        </div>
      )}

      {!outlookIntegration?.isConnected ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Connectez votre calendrier Outlook
          </h4>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Synchronisez vos événements Outlook avec votre espace de formation et ajoutez automatiquement vos formations à votre calendrier.
          </p>
          
          <button
            onClick={handleConnect}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <ExternalLink className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Connexion...' : 'Se connecter à Outlook'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Informations de connexion */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Informations de connexion</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Actif
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Compte :</span>
                <span className="ml-2 font-medium text-gray-900">
                  {outlookIntegration.email || outlookIntegration.name || 'Non disponible'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Dernière synchronisation :</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatLastSync(outlookIntegration.lastSync)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleImportEvents}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-gray-900">Importer les événements</span>
            </button>
            
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-medium text-red-900">Déconnecter</span>
            </button>
          </div>

          {/* Paramètres de synchronisation */}
          <div className="border-t pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Paramètres de synchronisation</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">Synchronisation automatique</label>
                  <p className="text-sm text-gray-500">Synchronise automatiquement les événements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={outlookIntegration.syncEnabled}
                    onChange={(e) => handleUpdateSettings({
                      ...outlookIntegration,
                      syncEnabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">Import d'événements</label>
                  <p className="text-sm text-gray-500">Autorise l'import depuis Outlook vers l'application</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={outlookIntegration.importEnabled}
                    onChange={(e) => handleUpdateSettings({
                      ...outlookIntegration,
                      importEnabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">Export de formations</label>
                  <p className="text-sm text-gray-500">Ajoute automatiquement les formations à Outlook</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={outlookIntegration.exportEnabled}
                    onChange={(e) => handleUpdateSettings({
                      ...outlookIntegration,
                      exportEnabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Note d'information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-900 mb-1">Comment ça marche ?</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Import :</strong> Vos événements Outlook apparaîtront dans votre agenda</li>
                  <li>• <strong>Export :</strong> Vos formations seront automatiquement ajoutées à Outlook</li>
                  <li>• <strong>Sync :</strong> Les modifications sont synchronisées en temps réel</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutlookIntegration;







