import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Building2,
  BarChart3,
  Calendar,
  AlertTriangle,
  Activity,
  Award,
  Eye,
  UserCheck,
  Timer,
  Target,
  Zap,
  TrendingDown
} from 'lucide-react';

import { dashboardApi } from '../../../api/adminApi';
import { useToast } from '../../../components/ui/use-toast';
import { 
  DashboardStats, 
  FormationPerformance, 
  RecentActivity, 
  Alert, 
  BankStats 
} from '../types';

// Composant de carte statistique moderne
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  trend?: number;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  changeType = 'neutral', 
  trend,
  isLoading = false 
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-600';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                value
              )}
            </p>
          </div>
        </div>
        {(change || trend !== undefined) && (
          <div className="text-right">
            {trend !== undefined && (
              <div className={`flex items-center ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium ml-1">
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
            {change && (
              <p className={`text-xs mt-1 ${
                changeType === 'positive' ? 'text-green-600' : 
                changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Composant de graphique simple avec barres
interface SimpleBarChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
  maxValue?: number;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, title, maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-24 text-sm text-gray-600 truncate">
              {item.label}
            </div>
            <div className="flex-1">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${max > 0 ? (item.value / max) * 100 : 0}%`,
                    backgroundColor: item.color
                  }}
                ></div>
              </div>
            </div>
            <div className="w-12 text-sm font-medium text-gray-900 text-right">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant d'alerte
interface AlertCardProps {
  alert: Alert;
  onAction?: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAction }) => {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Activity className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertColor = () => {
    switch (alert.type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getAlertColor()}`}>
      <div className="flex items-start space-x-3">
        {getAlertIcon()}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
          {alert.count > 1 && (
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-white rounded-full">
              {alert.count} éléments
            </span>
          )}
        </div>
        {alert.action && onAction && (
          <button
            onClick={onAction}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {alert.action}
          </button>
        )}
      </div>
    </div>
  );
};

export const EnhancedDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [formationPerformance, setFormationPerformance] = useState<FormationPerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bankStats, setBankStats] = useState<BankStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh toutes les 5 minutes
    const interval = setInterval(() => {
      refreshDashboardData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      await loadAllData();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // Utiliser des données de test
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDashboardData = async () => {
    try {
      setRefreshing(true);
      await loadAllData();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadAllData = async () => {
    try {
      console.log('📊 Chargement des données depuis les APIs...');
      
      // Charger les APIs qui fonctionnent
      const [statsResponse, bankStatsResponse, alertsResponse] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getBankStats(),
        dashboardApi.getAlerts()
      ]);

      console.log('📊 Réponses API reçues:', {
        stats: statsResponse.data,
        bankStats: bankStatsResponse.data,
        alerts: alertsResponse.data
      });

      setStats(statsResponse.data);
      setBankStats(bankStatsResponse.data);
      setAlerts(alertsResponse.data);

      // Pour les APIs qui ne fonctionnent pas encore, utiliser des données de base
      setRecentActivity([]);
      setFormationPerformance([]);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // En cas d'erreur, utiliser les données de test
      loadMockData();
    }
  };

  const loadMockData = () => {
    // Données de test réalistes
    setStats({
      totalUsers: 156,
      totalFormations: 24,
      totalBanks: 8,
      completedFormations: 89,
      activeUsers: 42,
      pendingAssignments: 18,
      onlineUsers: 12,
      averageCompletionTime: 45,
      quizSuccessRate: 87,
      totalQuizAttempts: 234
    });

    setFormationPerformance([
      {
        formationId: '1',
        formationTitle: 'Compliance Bancaire',
        enrollments: 45,
        completions: 38,
        averageScore: 85,
        averageTime: 120,
        completionRate: 84
      },
      {
        formationId: '2', 
        formationTitle: 'Gestion des Risques',
        enrollments: 32,
        completions: 28,
        averageScore: 78,
        averageTime: 95,
        completionRate: 88
      },
      {
        formationId: '3',
        formationTitle: 'Produits Bancaires',
        enrollments: 28,
        completions: 15,
        averageScore: 72,
        averageTime: 85,
        completionRate: 54
      }
    ]);

    setRecentActivity([
      {
        id: '1',
        type: 'formation_completed',
        description: 'Formation "Compliance Bancaire" terminée',
        user: 'Marie Dubois',
        timestamp: new Date(Date.now() - 2 * 60 * 1000)
      },
      {
        id: '2',
        type: 'user_registered',
        description: 'Nouvel utilisateur inscrit',
        user: 'Pierre Martin',
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        id: '3',
        type: 'quiz_failed',
        description: 'Échec au quiz "Gestion des Risques"',
        user: 'Jean Dupont',
        timestamp: new Date(Date.now() - 45 * 60 * 1000)
      }
    ]);

    setAlerts([
      {
        id: '1',
        type: 'warning',
        title: 'Formations en retard',
        message: 'Des apprenants ont dépassé leur date limite',
        count: 12,
        action: 'Voir les détails'
      },
      {
        id: '2',
        type: 'error',
        title: 'Échecs aux quiz',
        message: 'Plusieurs échecs récents nécessitent une attention',
        count: 5,
        action: 'Consulter'
      },
      {
        id: '3',
        type: 'info',
        title: 'Nouvelles inscriptions',
        message: 'De nouveaux utilisateurs attendent une attribution',
        count: 8,
        action: 'Attribuer'
      }
    ]);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600">Vue d'ensemble de votre plateforme de formation</p>
        </div>
        <button
          onClick={refreshDashboardData}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Activity className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
        </button>
      </div>

      {/* KPIs principaux */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Banques"
            value={stats.totalBanks}
            icon={<Building2 className="w-5 h-5 text-blue-600" />}
            change={`${stats.totalUsers} utilisateurs`}
            changeType="positive"
          />
          <StatCard
            title="Utilisateurs"
            value={stats.totalUsers}
            icon={<Users className="w-5 h-5 text-light-blue-600" />}
            change={`${stats.activeUsers} actifs`}
            changeType="positive"
          />
          <StatCard
            title="Formations"
            value={stats.totalFormations}
            icon={<BookOpen className="w-5 h-5 text-purple-600" />}
            change={`${stats.completedFormations} terminées`}
            changeType="positive"
          />
          <StatCard
            title="Formations Terminées"
            value={stats.completedFormations}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            change={`${Math.round((stats.completedFormations / stats.totalFormations) * 100)}% taux de réussite`}
            changeType="positive"
          />
        </div>
      )}

      {/* Statistiques par banque */}
      {bankStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="w-5 h-5 text-blue-600 mr-2" />
            Statistiques par banque
          </h3>
          <p className="text-sm text-gray-600 mb-4">Performance des formations par établissement</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankStats.map((bank) => (
              <div key={bank.bankId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">{bank.bankName}</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Utilisateurs:</span>
                    <span className="text-sm font-medium">{bank.userCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Formations:</span>
                    <span className="text-sm font-medium">{bank.formationCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Taux de complétion:</span>
                    <span className="text-sm font-medium text-green-600">{bank.completionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Assignations:</span>
                    <span className="text-sm font-medium">{bank.totalAssignments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertes importantes */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 text-yellow-500 mr-2" />
            Alertes importantes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAction={() => console.log('Action pour alerte:', alert.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance des formations */}
        <div className="lg:col-span-2">
          {formationPerformance.length > 0 ? (
            <SimpleBarChart
              title="Performance des Formations"
              data={formationPerformance.map(f => ({
                label: f.formationTitle,
                value: f.completionRate,
                color: f.completionRate > 80 ? '#10B981' : f.completionRate > 60 ? '#F59E0B' : '#EF4444'
              }))}
              maxValue={100}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progression des formations</h3>
              <p className="text-sm text-gray-600 mb-4">Taux de completion par formation</p>
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Formations actives</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {stats?.totalFormations || 0} formations disponibles
                </p>
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-blue-600 transition-all duration-500"
                      style={{
                        width: `${stats && stats.totalFormations > 0 ? (stats.completedFormations / stats.totalFormations) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>{stats && stats.totalFormations > 0 ? Math.round((stats.completedFormations / stats.totalFormations) * 100) : 0}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 text-blue-600 mr-2" />
              Activité Récente
            </h3>
            <p className="text-sm text-gray-600">Dernières actions sur la plateforme</p>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">{activity.user}</p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">{getTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune activité</h3>
                <p className="mt-1 text-sm text-gray-500">
                  L'activité récente apparaîtra ici.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top formations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
          Top Formations
        </h3>
        
        {formationPerformance.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plus populaires */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                Plus suivies
              </h4>
              <div className="space-y-3">
                {formationPerformance
                  .sort((a, b) => b.enrollments - a.enrollments)
                  .slice(0, 3)
                  .map((formation, index) => (
                    <div key={formation.formationId} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formation.formationTitle}</p>
                          <p className="text-xs text-gray-600">{formation.enrollments} inscriptions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-700">{formation.completionRate}%</p>
                        <p className="text-xs text-gray-600">réussite</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Moins performantes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                À améliorer
              </h4>
              <div className="space-y-3">
                {formationPerformance
                  .sort((a, b) => a.completionRate - b.completionRate)
                  .slice(0, 3)
                  .map((formation, index) => (
                    <div key={formation.formationId} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          !
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formation.formationTitle}</p>
                          <p className="text-xs text-gray-600">{formation.enrollments} inscriptions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-700">{formation.completionRate}%</p>
                        <p className="text-xs text-gray-600">réussite</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune donnée de performance</h3>
            <p className="mt-1 text-sm text-gray-500">
              Les statistiques de performance des formations apparaîtront ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Fonctions utilitaires pour l'activité
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'formation_created':
      return <BookOpen className="w-4 h-4" />;
    case 'user_registered':
      return <Users className="w-4 h-4" />;
    case 'formation_completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'quiz_failed':
      return <AlertTriangle className="w-4 h-4" />;
    case 'assignment_created':
      return <Clock className="w-4 h-4" />;
    default:
      return <BarChart3 className="w-4 h-4" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'formation_created':
      return 'bg-blue-100';
    case 'user_registered':
      return 'bg-green-100';
    case 'formation_completed':
      return 'bg-green-100';
    case 'quiz_failed':
      return 'bg-red-100';
    case 'assignment_created':
      return 'bg-orange-100';
    default:
      return 'bg-gray-100';
  }
};
