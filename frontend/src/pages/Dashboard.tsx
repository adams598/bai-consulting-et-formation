import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Award, BarChart, Settings, LogOut, TrendingUp, Folder, FolderOpen, Grid, List } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';
import * as Tabs from '@radix-ui/react-tabs';
import * as Avatar from '@radix-ui/react-avatar';
import { LearnerLayout, FormationCard, StatsCard } from '../features/learner/components';
import { LearnerFormationAssignment, LearnerStats, FormationStatus } from '../features/learner/types';
import { formationsApi, progressApi, universesApi } from '../api/learnerApi';
import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../providers/auth-provider';

interface Universe {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UniverseWithFormations extends Universe {
  formations: LearnerFormationAssignment[];
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('en-cours');
  const [formations, setFormations] = useState<LearnerFormationAssignment[]>([]);
  const [universes, setUniverses] = useState<UniverseWithFormations[]>([]);
  const [stats, setStats] = useState<LearnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'universes' | 'formations'>('universes');
  const [selectedUniverse, setSelectedUniverse] = useState<UniverseWithFormations | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [formationsResponse, statsResponse, universesResponse] = await Promise.all([
        formationsApi.getMyFormations(),
        progressApi.getStats(),
        universesApi.getAll()
      ]);
      
      const formationsData = formationsResponse.data;
      const universesData = universesResponse.data;
      
      setFormations(formationsData);
      setStats(statsResponse.data);
      
      // Organiser les formations par univers
      const universesWithFormations: UniverseWithFormations[] = universesData.map(universe => ({
        ...universe,
        formations: formationsData.filter(formation => 
          formation.formation.universeId === universe.id
        )
      }));
      
      // Ajouter un univers "Sans univers" pour les formations non assignées
      const formationsWithoutUniverse = formationsData.filter(formation => 
        !formation.formation.universeId
      );
      
      if (formationsWithoutUniverse.length > 0) {
        universesWithFormations.push({
          id: 'sans-univers',
          name: 'Autres formations',
          description: 'Formations non classées',
          color: '#6B7280',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          formations: formationsWithoutUniverse
        });
      }
      
      setUniverses(universesWithFormations);
      
      // Sélectionner le premier univers par défaut
      if (universesWithFormations.length > 0) {
        setSelectedUniverse(universesWithFormations[0]);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFormationsByStatus = (status: FormationStatus, universeFormations?: LearnerFormationAssignment[]) => {
    const formationsToFilter = universeFormations || formations;
    return formationsToFilter.filter(assignment => assignment.status === status);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const getUniverseStats = (universe: UniverseWithFormations) => {
    const totalFormations = universe.formations.length;
    const completedFormations = getFormationsByStatus(FormationStatus.COMPLETED, universe.formations).length;
    const inProgressFormations = getFormationsByStatus(FormationStatus.IN_PROGRESS, universe.formations).length;
    const pendingFormations = getFormationsByStatus(FormationStatus.NOT_STARTED, universe.formations).length;
    
    return {
      totalFormations,
      completedFormations,
      inProgressFormations,
      pendingFormations,
      completionRate: totalFormations > 0 ? Math.round((completedFormations / totalFormations) * 100) : 0
    };
  };

  if (loading) {
    return (
      <LearnerLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </LearnerLayout>
    );
  }

  return (
    <LearnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bonjour {user?.firstName} ! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Voici un aperçu de votre progression et de vos formations
            </p>
          </div>
          
          {/* Toggle View Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('universes')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'universes'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Folder className="w-4 h-4 inline mr-1" />
              Par univers
            </button>
            <button
              onClick={() => setViewMode('formations')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'formations'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4 inline mr-1" />
              Toutes formations
            </button>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Formations en cours"
              value={stats.inProgressFormations}
              icon={BookOpen}
              color="blue"
              subtitle={`${stats.totalFormations} au total`}
            />
            <StatsCard
              title="Formations terminées"
              value={stats.completedFormations}
              icon={Award}
              color="green"
              subtitle={`${stats.certificatesEarned} certificat${stats.certificatesEarned > 1 ? 's' : ''}`}
            />
            <StatsCard
              title="Temps d'apprentissage"
              value={formatTime(stats.totalTimeSpent)}
              icon={Clock}
              color="yellow"
              subtitle="Temps total passé"
            />
            <StatsCard
              title="Progression globale"
              value={`${Math.round(stats.averageProgress)}%`}
              icon={TrendingUp}
              color="purple"
              subtitle="Moyenne de progression"
            />
          </div>
        )}

        {/* Vue par univers */}
        {viewMode === 'universes' && (
          <div className="space-y-6">
            {/* Liste des univers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {universes.map((universe) => {
                const universeStats = getUniverseStats(universe);
                return (
                  <div
                    key={universe.id}
                    onClick={() => setSelectedUniverse(universe)}
                    className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
                      selectedUniverse?.id === universe.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: universe.color || '#3B82F6' }}
                        >
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{universe.name}</h3>
                          <p className="text-sm text-gray-500">{universe.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Formations</span>
                        <span className="font-medium">{universeStats.totalFormations}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Terminées</span>
                        <span className="font-medium text-green-600">{universeStats.completedFormations}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">En cours</span>
                        <span className="font-medium text-blue-600">{universeStats.inProgressFormations}</span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progression</span>
                          <span>{universeStats.completionRate}%</span>
                        </div>
                        <Progress.Root className="w-full bg-gray-200 rounded-full h-2">
                          <Progress.Indicator
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${universeStats.completionRate}%` }}
                          />
                        </Progress.Root>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formations de l'univers sélectionné */}
            {selectedUniverse && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: selectedUniverse.color || '#3B82F6' }}
                    >
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedUniverse.name}</h2>
                      <p className="text-gray-600">{selectedUniverse.description}</p>
                    </div>
                  </div>
                </div>

                {/* Onglets des formations */}
                <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                  <Tabs.List className="flex space-x-4 border-b border-gray-200 mb-6">
                    <Tabs.Trigger
                      value="en-cours"
                      className={`pb-4 text-sm font-medium ${
                        activeTab === 'en-cours'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      En cours ({getFormationsByStatus(FormationStatus.IN_PROGRESS, selectedUniverse.formations).length})
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="terminees"
                      className={`pb-4 text-sm font-medium ${
                        activeTab === 'terminees'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Terminées ({getFormationsByStatus(FormationStatus.COMPLETED, selectedUniverse.formations).length})
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="non-commencees"
                      className={`pb-4 text-sm font-medium ${
                        activeTab === 'non-commencees'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Non commencées ({getFormationsByStatus(FormationStatus.NOT_STARTED, selectedUniverse.formations).length})
                    </Tabs.Trigger>
                  </Tabs.List>

                  <Tabs.Content value="en-cours">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {getFormationsByStatus(FormationStatus.IN_PROGRESS, selectedUniverse.formations).length > 0 ? (
                        getFormationsByStatus(FormationStatus.IN_PROGRESS, selectedUniverse.formations).map((assignment) => (
                          <FormationCard key={assignment.id} assignment={assignment} />
                        ))
                      ) : (
                        <div className="col-span-full bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune formation en cours</h3>
                          <p className="text-gray-600">Commencez une nouvelle formation pour voir votre progression ici.</p>
                        </div>
                      )}
                    </div>
                  </Tabs.Content>

                  <Tabs.Content value="terminees">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {getFormationsByStatus(FormationStatus.COMPLETED, selectedUniverse.formations).length > 0 ? (
                        getFormationsByStatus(FormationStatus.COMPLETED, selectedUniverse.formations).map((assignment) => (
                          <FormationCard key={assignment.id} assignment={assignment} />
                        ))
                      ) : (
                        <div className="col-span-full bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
                          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune formation terminée</h3>
                          <p className="text-gray-600">Terminez vos formations pour obtenir des certificats.</p>
                        </div>
                      )}
                    </div>
                  </Tabs.Content>

                  <Tabs.Content value="non-commencees">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {getFormationsByStatus(FormationStatus.NOT_STARTED, selectedUniverse.formations).length > 0 ? (
                        getFormationsByStatus(FormationStatus.NOT_STARTED, selectedUniverse.formations).map((assignment) => (
                          <FormationCard key={assignment.id} assignment={assignment} />
                        ))
                      ) : (
                        <div className="col-span-full bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Toutes les formations sont démarrées</h3>
                          <p className="text-gray-600">Félicitations ! Vous avez commencé toutes vos formations assignées.</p>
                        </div>
                      )}
                    </div>
                  </Tabs.Content>
                </Tabs.Root>
              </div>
            )}
          </div>
        )}

        {/* Vue classique (toutes formations) */}
        {viewMode === 'formations' && (
          <div className="space-y-6">
            {/* Onglets des formations */}
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List className="flex space-x-4 border-b border-gray-200 mb-6">
                <Tabs.Trigger
                  value="en-cours"
                  className={`pb-4 text-sm font-medium ${
                    activeTab === 'en-cours'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  En cours ({getFormationsByStatus(FormationStatus.IN_PROGRESS).length})
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="terminees"
                  className={`pb-4 text-sm font-medium ${
                    activeTab === 'terminees'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Terminées ({getFormationsByStatus(FormationStatus.COMPLETED).length})
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="non-commencees"
                  className={`pb-4 text-sm font-medium ${
                    activeTab === 'non-commencees'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Non commencées ({getFormationsByStatus(FormationStatus.NOT_STARTED).length})
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="en-cours">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFormationsByStatus(FormationStatus.IN_PROGRESS).length > 0 ? (
                    getFormationsByStatus(FormationStatus.IN_PROGRESS).map((assignment) => (
                      <FormationCard key={assignment.id} assignment={assignment} />
                    ))
                  ) : (
                    <div className="col-span-full bg-white rounded-lg border border-gray-200 p-12 text-center">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune formation en cours</h3>
                      <p className="text-gray-600">Commencez une nouvelle formation pour voir votre progression ici.</p>
                    </div>
                  )}
                </div>
              </Tabs.Content>

              <Tabs.Content value="terminees">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFormationsByStatus(FormationStatus.COMPLETED).length > 0 ? (
                    getFormationsByStatus(FormationStatus.COMPLETED).map((assignment) => (
                      <FormationCard key={assignment.id} assignment={assignment} />
                    ))
                  ) : (
                    <div className="col-span-full bg-white rounded-lg border border-gray-200 p-12 text-center">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune formation terminée</h3>
                      <p className="text-gray-600">Terminez vos formations pour obtenir des certificats.</p>
                    </div>
                  )}
                </div>
              </Tabs.Content>

              <Tabs.Content value="non-commencees">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFormationsByStatus(FormationStatus.NOT_STARTED).length > 0 ? (
                    getFormationsByStatus(FormationStatus.NOT_STARTED).map((assignment) => (
                      <FormationCard key={assignment.id} assignment={assignment} />
                    ))
                  ) : (
                    <div className="col-span-full bg-white rounded-lg border border-gray-200 p-12 text-center">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Toutes les formations sont démarrées</h3>
                      <p className="text-gray-600">Félicitations ! Vous avez commencé toutes vos formations assignées.</p>
                    </div>
                  )}
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        )}
      </div>
    </LearnerLayout>
  );
}