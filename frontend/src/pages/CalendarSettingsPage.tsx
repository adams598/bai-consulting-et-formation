import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Settings, 
  Bell, 
  Shield, 
  Info,
  ArrowLeft,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import OutlookIntegration from '../components/OutlookIntegration';
import { CalendarService, CalendarIntegration } from '../services/calendarService';

interface CalendarSettingsPageProps {
  onBack?: () => void;
}

const CalendarSettingsPage: React.FC<CalendarSettingsPageProps> = ({ onBack }) => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await CalendarService.getIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('Erreur lors du chargement des intégrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationChange = (newIntegrations: CalendarIntegration[]) => {
    setIntegrations(newIntegrations);
  };

  const getConnectedCount = () => {
    return integrations.filter(i => i.isConnected).length;
  };

  const getActiveSyncCount = () => {
    return integrations.filter(i => i.isConnected && i.syncEnabled).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Paramètres du calendrier
                  </h1>
                  <p className="text-sm text-gray-500">
                    Configurez l'intégration avec vos calendriers externes
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {getConnectedCount()} calendrier{getConnectedCount() > 1 ? 's' : ''} connecté{getConnectedCount() > 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500">
                  {getActiveSyncCount()} synchronisation{getActiveSyncCount() > 1 ? 's' : ''} active{getActiveSyncCount() > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Vue d'ensemble */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Info className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Vue d'ensemble</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">
                  {getConnectedCount()}
                </div>
                <div className="text-sm text-blue-700">
                  Calendrier{getConnectedCount() > 1 ? 's' : ''} connecté{getConnectedCount() > 1 ? 's' : ''}
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Bell className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">
                  {getActiveSyncCount()}
                </div>
                <div className="text-sm text-green-700">
                  Sync{getActiveSyncCount() > 1 ? 's' : ''} automatique{getActiveSyncCount() > 1 ? 's' : ''}
                </div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">
                  Sécurisé
                </div>
                <div className="text-sm text-purple-700">
                  OAuth 2.0
                </div>
              </div>
            </div>
          </div>

          {/* Intégration Outlook */}
          <OutlookIntegration onIntegrationChange={handleIntegrationChange} />

          {/* Informations de sécurité */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Sécurité et confidentialité</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Authentification sécurisée</h3>
                  <p className="text-sm text-gray-600">
                    Utilisation du protocole OAuth 2.0 pour une connexion sécurisée avec vos comptes calendrier.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Chiffrement des données</h3>
                  <p className="text-sm text-gray-600">
                    Tous vos tokens d'accès sont chiffrés et stockés de manière sécurisée.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Contrôle des permissions</h3>
                  <p className="text-sm text-gray-600">
                    Vous gardez le contrôle total sur les données partagées et pouvez révoquer l'accès à tout moment.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Important</h3>
                  <p className="text-sm text-gray-600">
                    Les événements importés depuis vos calendriers externes restent synchronisés. 
                    Les supprimer ici ne les supprimera pas de votre calendrier original.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fonctionnalités disponibles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Fonctionnalités disponibles</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Import depuis Outlook</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Synchronisation des événements existants</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Import automatique des nouveaux événements</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Préservation des détails (lieu, participants, etc.)</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Export vers Outlook</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Ajout automatique des formations planifiées</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Synchronisation des modifications</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Notifications et rappels intégrés</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Guide de démarrage */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Info className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Guide de démarrage</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Connectez votre compte</h3>
                  <p className="text-sm text-gray-600">
                    Cliquez sur "Se connecter à Outlook" et autorisez l'accès à votre calendrier.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Configurez la synchronisation</h3>
                  <p className="text-sm text-gray-600">
                    Activez l'import, l'export ou la synchronisation automatique selon vos besoins.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Profitez de l'intégration</h3>
                  <p className="text-sm text-gray-600">
                    Vos événements Outlook apparaîtront dans votre agenda et vos formations seront ajoutées à Outlook.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSettingsPage;




