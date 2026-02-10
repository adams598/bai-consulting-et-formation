import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDisconnectModalProps {
  isOpen: boolean;
  provider: 'Google' | 'Outlook';
  email?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmDisconnectModal: React.FC<ConfirmDisconnectModalProps> = ({
  isOpen,
  provider,
  email,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Déconnecter {provider}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex gap-3 mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-semibold mb-2">
                Êtes-vous sûr ?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vous allez déconnecter {provider}
                {email && <> ({email})</>}
              </p>
              <ul className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Les événements existants ne seront pas supprimés</li>
                <li>• Vous devrez vous reconnecter pour relancer la synchronisation</li>
                <li>• Vos données seront conservées de façon sécurisée</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            )}
            <span>{isLoading ? 'Déconnexion...' : 'Déconnecter'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDisconnectModal;
