import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Calendar, 
  Building2, 
  Search,
  Eye,
  Edit
} from 'lucide-react';
import { StatsCard } from '../components';
import { useToast } from '../../../components/ui/use-toast';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  client: string;
  estimatedValue: number;
  deadline: string;
  status: 'PROSPECT' | 'EN_COURS' | 'FINALISEE' | 'PERDUE';
  priority: 'HAUTE' | 'MOYENNE' | 'BASSE';
  createdAt: string;
}

const OpportunitiesPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      // Données de démonstration
      const mockOpportunities: Opportunity[] = [
        {
          id: '1',
          title: 'Crédit immobilier - Famille Dupont',
          description: 'Demande de crédit pour achat résidence principale',
          client: 'M. et Mme Dupont',
          estimatedValue: 250000,
          deadline: '2024-01-15',
          status: 'EN_COURS',
          priority: 'HAUTE',
          createdAt: '2023-12-01'
        },
        {
          id: '2',
          title: 'Assurance vie - Entreprise Martin',
          description: 'Contrat groupe pour les employés',
          client: 'Entreprise Martin SARL',
          estimatedValue: 50000,
          deadline: '2024-02-01',
          status: 'PROSPECT',
          priority: 'MOYENNE',
          createdAt: '2023-12-05'
        }
      ];
      setOpportunities(mockOpportunities);
    } catch (error) {
      console.error('Erreur lors du chargement des opportunités:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les opportunités",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || opportunity.status === statusFilter;
    const matchesPriority = !priorityFilter || opportunity.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROSPECT': return 'bg-blue-100 text-blue-800';
      case 'EN_COURS': return 'bg-yellow-100 text-yellow-800';
      case 'FINALISEE': return 'bg-green-100 text-green-800';
      case 'PERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PROSPECT': return 'Prospect';
      case 'EN_COURS': return 'En cours';
      case 'FINALISEE': return 'Finalisée';
      case 'PERDUE': return 'Perdue';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HAUTE': return 'bg-red-100 text-red-800';
      case 'MOYENNE': return 'bg-yellow-100 text-yellow-800';
      case 'BASSE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunités Commerciales</h1>
          <p className="text-gray-600 mt-1">Gérez vos opportunités commerciales et suivez leur progression</p>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle opportunité</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total"
          value={opportunities.length.toString()}
          icon={Target}
          color="blue"
        />
        <StatsCard
          title="En cours"
          value={opportunities.filter(o => o.status === 'EN_COURS').length.toString()}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Finalisées"
          value={opportunities.filter(o => o.status === 'FINALISEE').length.toString()}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Perdues"
          value={opportunities.filter(o => o.status === 'PERDUE').length.toString()}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une opportunité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="PROSPECT">Prospect</option>
              <option value="EN_COURS">En cours</option>
              <option value="FINALISEE">Finalisée</option>
              <option value="PERDUE">Perdue</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les priorités</option>
              <option value="HAUTE">Haute</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="BASSE">Basse</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filteredOpportunities.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune opportunité trouvée</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter || priorityFilter 
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Commencez par créer votre première opportunité commerciale'
              }
            </p>
          </div>
        ) : (
          filteredOpportunities.map((opportunity) => (
            <div key={opportunity.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{opportunity.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(opportunity.status)}`}>
                      {getStatusLabel(opportunity.status)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(opportunity.priority)}`}>
                      {opportunity.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{opportunity.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Building2 className="h-4 w-4" />
                      <span>{opportunity.client}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>{opportunity.estimatedValue.toLocaleString('fr-FR')} €</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(opportunity.deadline).toLocaleDateString('fr-FR')}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Voir les détails"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OpportunitiesPage;
