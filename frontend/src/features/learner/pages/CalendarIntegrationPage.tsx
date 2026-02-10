import React, { useState } from 'react';
import { 
  Calendar, 
  Chrome, 
  Mail,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import GoogleIntegration from '../../../components/GoogleIntegration';
import OutlookIntegration from '../../../components/OutlookIntegration';

const CalendarIntegrationPage: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<'google' | 'outlook' | null>('google');

  const toggleSection = (section: 'google' | 'outlook') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Intégrations de calendrier
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Connectez vos calendriers externes (Google et Outlook) pour synchroniser automatiquement vos événements de formation
          </p>
        </div>

        {/* Infos principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Calendriers connectés</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">2</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Disponibles</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                <Settings className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Synchronisation</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">Actif</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Bidirectionnelle</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Format</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">iCalendar</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">RFC 5545</p>
          </div>
        </div>

        {/* Sections intégrations */}
        <div className="space-y-4 mb-8">
          {/* Google Calendar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => toggleSection('google')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Chrome className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Google Calendar</h2>
              </div>
              {expandedSection === 'google' ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSection === 'google' && (
              <div className="border-t border-gray-200 dark:border-slate-700 p-6">
                <GoogleIntegration />
              </div>
            )}
          </div>

          {/* Outlook Calendar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => toggleSection('outlook')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Outlook Calendar</h2>
              </div>
              {expandedSection === 'outlook' ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSection === 'outlook' && (
              <div className="border-t border-gray-200 dark:border-slate-700 p-6">
                <OutlookIntegration />
              </div>
            )}
          </div>
        </div>

        {/* Guide de configuration */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-8">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
            🚀 Premiers pas
          </h3>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <p>
              <strong>1. Connexion:</strong> Cliquez sur "Se connecter" pour chaque calendrier que vous souhaitez synchroniser.
            </p>
            <p>
              <strong>2. Autorisation:</strong> Une fenêtre d'authentification s'ouvrira. Connectez-vous avec votre compte Google ou Microsoft.
              </p>
            <p>
              <strong>3. Synchronisation:</strong> Une fois connecté, les événements seront synchronisés automatiquement ou vous pouvez forcer la synchronisation.
            </p>
            <p>
              <strong>4. Gestion:</strong> Utilisez les contrôles pour gérer la synchronisation, l'import et l'export des événements.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <a
              href="/docs/calendar-integration"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm flex items-center gap-2"
            >
              <span>Consulter la documentation complète</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarIntegrationPage;
