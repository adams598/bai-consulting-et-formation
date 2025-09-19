import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Award, BarChart, Settings, LogOut, TrendingUp } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';
import * as Tabs from '@radix-ui/react-tabs';
import * as Avatar from '@radix-ui/react-avatar';
import { LearnerLayout, FormationCard, StatsCard } from '../features/learner/components';
import { LearnerFormationAssignment, LearnerStats, FormationStatus } from '../features/learner/types';
import { formationsApi, progressApi } from '../api/learnerApi';
import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../providers/auth-provider';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('en-cours');
  const [formations, setFormations] = useState<LearnerFormationAssignment[]>([]);
  const [stats, setStats] = useState<LearnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [formationsResponse, statsResponse] = await Promise.all([
        formationsApi.getMyFormations(),
        progressApi.getStats()
      ]);
      
      setFormations(formationsResponse.data);
      setStats(statsResponse.data);
      
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

  const getFormationsByStatus = (status: FormationStatus) => {
    return formations.filter(assignment => assignment.status === status);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour {user?.firstName} ! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Voici un aperçu de votre progression et de vos formations
          </p>
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

        {/* Actions rapides */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/apprenant/courses"
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Voir toutes mes formations</p>
                <p className="text-sm text-blue-600">Gérer mes formations</p>
              </div>
            </Link>
            
            <Link
              to="/apprenant/progression"
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <BarChart className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Voir ma progression</p>
                <p className="text-sm text-green-600">Analyser mes résultats</p>
              </div>
            </Link>
            
            <Link
              to="/apprenant/certificates"
              className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <Award className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">Mes certificats</p>
                <p className="text-sm text-yellow-600">Télécharger mes certificats</p>
              </div>
            </Link>
          </div>
          </div>
        </div>
      </LearnerLayout>
  );
}