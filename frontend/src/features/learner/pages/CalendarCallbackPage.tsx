import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const CalendarCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      // Envoyer l'erreur à la fenêtre parent
      if (window.opener) {
        window.opener.postMessage(
          { type: 'oauth-error', error: error },
          window.location.origin
        );
      }
      window.close();
      return;
    }

    if (code && state) {
      // Envoyer le code d'autorisation à la fenêtre parent
      if (window.opener) {
        window.opener.postMessage(
          { type: 'oauth-success', code: code, state: state },
          window.location.origin
        );
      }
      window.close();
      return;
    }

    // Si aucun paramètre valide, rediriger vers les paramètres
    navigate('/settings?tab=calendars');
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Traitement de l'autorisation...
        </h2>
        <p className="text-gray-600">
          Veuillez patienter pendant que nous finalisons la connexion.
        </p>
      </div>
    </div>
  );
};

export default CalendarCallbackPage;
