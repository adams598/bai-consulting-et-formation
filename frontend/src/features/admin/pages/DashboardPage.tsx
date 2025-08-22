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
  AlertTriangle
} from 'lucide-react';

import { dashboardApi } from '../../../api/adminApi';
import { AdminDashboardStats, BankStats } from '../types';
import { useToast } from '../../../components/ui/use-toast';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType = 'neutral' }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="ml-4 flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {change && (
          <p className={`text-sm ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {change}
          </p>
        )}
      </div>
    </div>
  </div>
);

interface RecentActivityItem {
  id: string;
  type: 'formation_created' | 'user_registered' | 'formation_completed' | 'assignment_created';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [bankStats, setBankStats] = useState<BankStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Charger les vraies données depuis l'API
      const [statsResponse, banksResponse] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getBankStats()
      ]);
      
      setStats(statsResponse.data);
      setBankStats(banksResponse.data);
      setRecentActivity([]); // Pas d'activité récente pour l'instant
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'formation_created':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'user_registered':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'formation_completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'assignment_created':
        return <Clock className="w-4 h-4 text-orange-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'formation_created':
        return 'bg-blue-50 border-blue-200';
      case 'user_registered':
        return 'bg-green-50 border-green-200';
      case 'formation_completed':
        return 'bg-green-50 border-green-200';
      case 'assignment_created':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
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

        {/* Statistiques principales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Banques"
              value={stats.totalBanks}
              icon={<Building2 className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Utilisateurs"
              value={stats.totalUsers}
              icon={<Users className="w-5 h-5 text-green-600" />}
            />
            <StatCard
              title="Formations"
              value={stats.totalFormations}
              icon={<BookOpen className="w-5 h-5 text-purple-600" />}
            />
            <StatCard
              title="Formations terminées"
              value={stats.completedFormations}
              icon={<CheckCircle className="w-5 h-5 text-green-600" />}
              change={(stats.totalFormations || 0) > 0 ? `${Math.round(((stats.completedFormations || 0) / (stats.totalFormations || 1)) * 100)}% taux de réussite` : "0% taux de réussite"}
              changeType="positive"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statistiques par banque */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Statistiques par banque</h3>
                <p className="text-sm text-gray-600">Performance des formations par établissement</p>
              </div>
              <div className="p-6">
                {bankStats.length > 0 ? (
                  <div className="space-y-4">
                    {bankStats.map((bank) => (
                      <div key={bank.bankId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{bank.bankName}</p>
                            <p className="text-sm text-gray-600">{bank.totalUsers} utilisateurs</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {bank.completedFormations}/{bank.totalFormations} formations
                          </p>
                          <p className="text-sm text-gray-600">
                            Score moyen: {bank.averageScore}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune banque</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Commencez par créer votre première banque.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Activité récente</h3>
              <p className="text-sm text-gray-600">Dernières actions sur la plateforme</p>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}>
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        {activity.user && (
                          <p className="text-xs text-gray-500">par {activity.user}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
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

        {/* Graphiques et métriques avancées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progression des formations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Progression des formations</h3>
              <p className="text-sm text-gray-600">Taux de completion par formation</p>
            </div>
            <div className="p-6">
              {stats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Formations actives</span>
                                         <span className="text-sm font-semibold text-gray-900">
                       {(stats.totalFormations || 0) - (stats.completedFormations || 0)}
                     </span>
                  </div>
                                       <div className="w-full bg-gray-200 rounded-full h-2">
                       <div 
                         className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                         style={{ 
                           width: `${(stats.totalFormations || 0) > 0 ? Math.min(((stats.completedFormations || 0) / (stats.totalFormations || 1)) * 100, 100) : 0}%` 
                         }}
                       ></div>
                     </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alertes et notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Alertes</h3>
              <p className="text-sm text-gray-600">Points d'attention importants</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats && stats.activeAssignments > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        {stats.activeAssignments} assignations en attente
                      </p>
                      <p className="text-xs text-orange-700">
                        Des formations nécessitent votre attention
                      </p>
                    </div>
                  </div>
                )}
                
                {stats && stats.averageScore < 80 && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        Score moyen: {stats.averageScore}%
                      </p>
                      <p className="text-xs text-yellow-700">
                        Considérez améliorer le contenu des formations
                      </p>
                    </div>
                  </div>
                )}

                {(!stats || (stats.activeAssignments === 0 && stats.averageScore >= 80)) && (
                  <div className="text-center py-4">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-600" />
                    <p className="mt-2 text-sm font-medium text-green-900">Tout va bien !</p>
                    <p className="text-xs text-green-700">Aucune alerte en cours</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}; 