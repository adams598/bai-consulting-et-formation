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
    <div></div>
  );
};

export default OpportunitiesPage;
