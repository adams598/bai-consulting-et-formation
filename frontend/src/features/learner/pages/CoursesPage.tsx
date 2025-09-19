import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, BookOpen, Clock, Award, TrendingUp } from 'lucide-react';
import { LearnerLayout, FormationCard, StatsCard } from '../components';
import { LearnerFormationAssignment, FormationStatus, LearnerStats } from '../types';
import { formationsApi, progressApi } from '../../../api/learnerApi';
import { useToast } from '../../../components/ui/use-toast';

const CoursesPage: React.FC = () => {
  const [formations, setFormations] = useState<LearnerFormationAssignment[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<LearnerFormationAssignment[]>([]);
  const [stats, setStats] = useState<LearnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormationStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'dueDate' | 'progress' | 'assignedAt'>('assignedAt');
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortFormations();
  }, [formations, searchTerm, statusFilter, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [formationsResponse, statsResponse] = await Promise.all([
        formationsApi.getMyFormations(),
        progressApi.getStats()
      ]);
      
      setFormations(formationsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos formations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortFormations = () => {
    let filtered = [...formations];

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.formation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.formation.organization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.formation.title.localeCompare(b.formation.title);
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'progress':
          const progressA = a.progress?.progress || 0;
          const progressB = b.progress?.progress || 0;
          return progressB - progressA;
        case 'assignedAt':
        default:
          return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
      }
    });

    setFilteredFormations(filtered);
  };

  const getStatusCount = (status: FormationStatus) => {
    return formations.filter(assignment => assignment.status === status).length;
  };

  const statusOptions = [
    { value: 'ALL', label: 'Toutes', count: formations.length },
    { value: FormationStatus.NOT_STARTED, label: 'Non commencées', count: getStatusCount(FormationStatus.NOT_STARTED) },
    { value: FormationStatus.IN_PROGRESS, label: 'En cours', count: getStatusCount(FormationStatus.IN_PROGRESS) },
    { value: FormationStatus.COMPLETED, label: 'Terminées', count: getStatusCount(FormationStatus.COMPLETED) },
    { value: FormationStatus.OVERDUE, label: 'En retard', count: getStatusCount(FormationStatus.OVERDUE) }
  ];

  if (loading) {
    return (
      <LearnerLayout>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="w-12 h-6 bg-gray-200 rounded"></div>
                </div>
                <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes formations</h1>
            <p className="text-gray-600 mt-1">
              Gérez et suivez votre progression dans vos formations assignées
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Formations totales"
              value={stats.totalFormations}
              icon={BookOpen}
              color="blue"
            />
            <StatsCard
              title="En cours"
              value={stats.inProgressFormations}
              icon={TrendingUp}
              color="yellow"
              subtitle={`${Math.round(stats.averageProgress)}% de progression moyenne`}
            />
            <StatsCard
              title="Terminées"
              value={stats.completedFormations}
              icon={Award}
              color="green"
              subtitle={`${stats.certificatesEarned} certificat${stats.certificatesEarned > 1 ? 's' : ''} obtenu${stats.certificatesEarned > 1 ? 's' : ''}`}
            />
            <StatsCard
              title="Temps d'apprentissage"
              value={`${Math.floor(stats.totalTimeSpent / 60)}h${stats.totalTimeSpent % 60 > 0 ? ` ${stats.totalTimeSpent % 60}min` : ''}`}
              icon={Clock}
              color="purple"
              subtitle="Temps total passé"
            />
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Barre de recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Filtre par statut */}
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as FormationStatus | 'ALL')}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tri */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="assignedAt">Plus récentes</option>
                <option value="title">Titre A-Z</option>
                <option value="dueDate">Échéance</option>
                <option value="progress">Progression</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des formations */}
        {filteredFormations.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredFormations.map((assignment) => (
              <FormationCard
                key={assignment.id}
                assignment={assignment}
                variant={viewMode === 'list' ? 'compact' : 'detailed'}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Aucune formation trouvée' 
                : 'Aucune formation assignée'
              }
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Essayez de modifier vos critères de recherche ou de filtrage.'
                : 'Vous n\'avez pas encore de formations assignées. Contactez votre administrateur.'
              }
            </p>
            {(searchTerm || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </LearnerLayout>
  );
};

export default CoursesPage;
