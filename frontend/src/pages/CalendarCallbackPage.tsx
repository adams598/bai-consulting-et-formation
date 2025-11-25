import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { CalendarService } from '../services/calendarService';

const CalendarCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Vérifier s'il y a une erreur OAuth
        if (error) {
          setStatus('error');
          setError(errorDescription || error);
          return;
        }

        // Vérifier que le code est présent
        if (!code) {
          setStatus('error');
          setError('Code d\'autorisation manquant');
          return;
        }

        // Déterminer le type de calendrier basé sur l'URL
        const isGoogle = window.location.pathname.includes('/google');
        const isOutlook = window.location.pathname.includes('/outlook');

        if (isGoogle) {
          await CalendarService.googleCallback(code);
          setStatus('success');
          setMessage('Connexion à Google Calendar réussie !');
        } else if (isOutlook) {
          await CalendarService.outlookCallback(code);
          setStatus('success');
          setMessage('Connexion à Outlook Calendar réussie !');
        } else {
          setStatus('error');
          setError('Type de calendrier non reconnu');
          return;
        }

        // Fermer la fenêtre popup après 2 secondes
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ type: 'CALENDAR_CONNECTED', success: true }, '*');
            window.close();
          } else {
            navigate('/admin/calendar-settings');
          }
        }, 2000);

      } catch (error) {
        console.error('Erreur lors du callback OAuth:', error);
        setStatus('error');
        setError(error instanceof Error ? error.message : 'Erreur inconnue');
        
        // Fermer la fenêtre popup en cas d'erreur après 3 secondes
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ type: 'CALENDAR_CONNECTED', success: false, error: error }, '*');
            window.close();
          } else {
            navigate('/admin/calendar-settings');
          }
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="w-16 h-16 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-600" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-600" />;
      default:
        return <AlertCircle className="w-16 h-16 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Connexion en cours...';
      case 'success':
        return 'Connexion réussie !';
      case 'error':
        return 'Erreur de connexion';
      default:
        return 'Statut inconnu';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {getStatusTitle()}
        </h1>

        {status === 'loading' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Traitement de votre autorisation...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              {message}
            </p>
            <p className="text-sm text-gray-500">
              Cette fenêtre va se fermer automatiquement...
            </p>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <p className="text-red-600 font-medium">
              Une erreur s'est produite
            </p>
            <p className="text-sm text-gray-600">
              {error}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/admin/calendar-settings')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Retour aux paramètres
              </button>
              <button
                onClick={() => window.close()}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Informations de débogage en développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Informations de débogage :</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Code: {searchParams.get('code') ? '✓ Présent' : '✗ Manquant'}</div>
              <div>State: {searchParams.get('state') || 'Non défini'}</div>
              <div>Error: {searchParams.get('error') || 'Aucune'}</div>
              <div>URL: {window.location.pathname}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarCallbackPage;




















