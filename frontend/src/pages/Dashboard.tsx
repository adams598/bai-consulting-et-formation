import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Award, BarChart, Settings, LogOut } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';
import * as Tabs from '@radix-ui/react-tabs';
import * as Avatar from '@radix-ui/react-avatar';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('en-cours');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation latérale */}
      <nav className="fixed top-0 left-0 h-full w-64 bg-brand-blue text-white p-6">
        <div className="flex items-center mb-8">
          <span className="text-2xl font-bold">BAI</span>
          <span className="ml-2 text-brand-beige text-xl">Formation</span>
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar.Root className="w-12 h-12 rounded-full bg-brand-beige flex items-center justify-center">
              <Avatar.Fallback className="text-white text-lg">JD</Avatar.Fallback>
            </Avatar.Root>
            <div>
              <p className="font-medium">Jean Dupont</p>
              <p className="text-sm text-gray-300">Apprenant</p>
            </div>
          </div>

          <div className="space-y-2">
            <Link to="/apprenant" className="flex items-center space-x-3 p-3 rounded-lg bg-white/10">
              <BookOpen className="h-5 w-5" />
              <span>Mes formations</span>
            </Link>
            <Link to="/apprenant/progression" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10">
              <BarChart className="h-5 w-5" />
              <span>Progression</span>
            </Link>
            <Link to="/apprenant/certificats" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10">
              <Award className="h-5 w-5" />
              <span>Certificats</span>
            </Link>
            <Link to="/apprenant/parametres" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10">
              <Settings className="h-5 w-5" />
              <span>Paramètres</span>
            </Link>
          </div>
        </div>

        <button className="absolute bottom-6 left-6 flex items-center space-x-3 text-gray-300 hover:text-white">
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
      </nav>

      {/* Contenu principal */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord</h1>

          {/* Statistiques */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-brand-blue" />
                </div>
                <span className="text-2xl font-bold">4</span>
              </div>
              <p className="text-gray-600">Formations en cours</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold">2</span>
              </div>
              <p className="text-gray-600">Formations terminées</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="text-2xl font-bold">12h</span>
              </div>
              <p className="text-gray-600">Temps d'apprentissage</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-2xl font-bold">85%</span>
              </div>
              <p className="text-gray-600">Progression globale</p>
            </div>
          </div>

          {/* Onglets des formations */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List className="flex space-x-4 border-b border-gray-200 mb-6">
              <Tabs.Trigger
                value="en-cours"
                className={`pb-4 text-sm font-medium ${
                  activeTab === 'en-cours'
                    ? 'text-brand-blue border-b-2 border-brand-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                En cours
              </Tabs.Trigger>
              <Tabs.Trigger
                value="terminees"
                className={`pb-4 text-sm font-medium ${
                  activeTab === 'terminees'
                    ? 'text-brand-blue border-b-2 border-brand-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Terminées
              </Tabs.Trigger>
              <Tabs.Trigger
                value="a-venir"
                className={`pb-4 text-sm font-medium ${
                  activeTab === 'a-venir'
                    ? 'text-brand-blue border-b-2 border-brand-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                À venir
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="en-cours">
              <div className="grid grid-cols-2 gap-6">
                {/* Formation en cours */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="h-48 bg-gray-200 relative">
                    <img
                      src="/images/optimized/pexels-banque-7821702-medium.webp"
                      alt="Formation Banque"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      En cours
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Conformité bancaire - Niveau 1
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Dernière activité&nbsp;: il y a 2 jours</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>65%</span>
                      </div>
                      <Progress.Root className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <Progress.Indicator
                          className="h-full bg-brand-blue transition-all"
                          style={{ width: '65%' }}
                        />
                      </Progress.Root>
                    </div>
                    <button className="mt-4 w-full bg-brand-blue text-white py-2 px-4 rounded hover:bg-brand-blue/90 transition-colors">
                      Continuer
                    </button>
                  </div>
                </div>

                {/* Autre formation en cours */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="h-48 bg-gray-200 relative">
                    <img
                      src="/images/optimized/pexels-assurance-7821701-medium.webp"
                      alt="Formation Assurance"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      En cours
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Gestion des risques en assurance
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Dernière activité&nbsp;: aujourd'hui</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>30%</span>
                      </div>
                      <Progress.Root className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <Progress.Indicator
                          className="h-full bg-brand-blue transition-all"
                          style={{ width: '30%' }}
                        />
                      </Progress.Root>
                    </div>
                    <button className="mt-4 w-full bg-brand-blue text-white py-2 px-4 rounded hover:bg-brand-blue/90 transition-colors">
                      Continuer
                    </button>
                  </div>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="terminees">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden opacity-75">
                  <div className="h-48 bg-gray-200 relative">
                    <img
                      src="/images/optimized/pexels-immobilier-7578986-medium.webp"
                      alt="Formation Immobilier"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-gray-500 text-white text-xs px-2 py-1 rounded">
                      Terminée
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Introduction à l'immobilier
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Award className="h-4 w-4 mr-2" />
                      <span>Certificat obtenu</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>100%</span>
                      </div>
                      <Progress.Root className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <Progress.Indicator
                          className="h-full bg-green-500 transition-all"
                          style={{ width: '100%' }}
                        />
                      </Progress.Root>
                    </div>
                    <button className="mt-4 w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors">
                      Revoir le cours
                    </button>
                  </div>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="a-venir">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="h-48 bg-gray-200 relative">
                    <img
                      src="/images/optimized/pexels-presentation-3184465-medium.webp"
                      alt="Formation à venir"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      À venir
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Expertise en évaluation immobilière
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Début&nbsp;: 15 juin 2025</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      Cette formation vous permettra d'acquérir les compétences nécessaires pour
                      l'évaluation professionnelle de biens immobiliers.
                    </p>
                    <button className="mt-4 w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors">
                      Voir le programme
                    </button>
                  </div>
                </div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </main>
    </div>
  );
}