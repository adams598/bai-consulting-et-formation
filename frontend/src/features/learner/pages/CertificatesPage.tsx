import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Download, 
  Eye, 
  Calendar, 
  CheckCircle, 
  Clock,
  Search,
  Filter,
  Share2,
  ExternalLink
} from 'lucide-react';
import { LearnerLayout, StatsCard } from '../components';
import { LearnerCertificate } from '../types';
import { certificatesApi } from '../../../api/learnerApi';
import { useToast } from '../../../components/ui/use-toast';

const CertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<LearnerCertificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<LearnerCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'expired'>('all');
  const [downloading, setDownloading] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  useEffect(() => {
    loadCertificates();
  }, []);

  useEffect(() => {
    filterCertificates();
  }, [certificates, searchTerm, statusFilter]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const response = await certificatesApi.getMyCertificates();
      setCertificates(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des certificats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos certificats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCertificates = () => {
    let filtered = [...certificates];

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(cert =>
        cert.formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.formation.organization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      if (statusFilter === 'valid') {
        filtered = filtered.filter(cert => cert.isValid);
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(cert => !cert.isValid);
      }
    }

    setFilteredCertificates(filtered);
  };

  const handleDownload = async (certificateId: string) => {
    try {
      setDownloading(prev => new Set([...prev, certificateId]));
      
      // Télécharger le certificat via l'API
      const blob = await certificatesApi.downloadCertificate(certificateId);
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificat-${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Téléchargement réussi",
        description: "Votre certificat a été téléchargé avec succès",
      });
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le certificat",
        variant: "destructive"
      });
    } finally {
      setDownloading(prev => {
        const newSet = new Set(prev);
        newSet.delete(certificateId);
        return newSet;
      });
    }
  };

  const handleShare = (certificate: LearnerCertificate) => {
    const shareText = `Je viens d'obtenir mon certificat "${certificate.formation.title}" ! 🎓`;
    const shareUrl = `${window.location.origin}/certificate/${certificate.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Mon certificat de formation',
        text: shareText,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast({
        title: "Lien copié",
        description: "Le lien de votre certificat a été copié dans le presse-papiers",
      });
    }
  };

  const getValidCertificates = () => certificates.filter(cert => cert.isValid);
  const getExpiredCertificates = () => certificates.filter(cert => !cert.isValid);
  const getRecentCertificates = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return certificates.filter(cert => new Date(cert.issuedAt) > thirtyDaysAgo);
  };

  if (loading) {
    return (
      <LearnerLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
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
          <h1 className="text-2xl font-bold text-gray-900">Mes certificats</h1>
          <p className="text-gray-600 mt-1">
            Consultez et gérez tous vos certificats de formation obtenus
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total des certificats"
            value={certificates.length}
            icon={Award}
            color="blue"
          />
          <StatsCard
            title="Certificats valides"
            value={getValidCertificates().length}
            icon={CheckCircle}
            color="green"
            subtitle="Actuellement actifs"
          />
          <StatsCard
            title="Certificats expirés"
            value={getExpiredCertificates().length}
            icon={Clock}
            color="red"
            subtitle="À renouveler"
          />
          <StatsCard
            title="Obtenus ce mois"
            value={getRecentCertificates().length}
            icon={Calendar}
            color="purple"
            subtitle="Derniers 30 jours"
          />
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Barre de recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher un certificat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtre par statut */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les certificats</option>
                <option value="valid">Certificats valides</option>
                <option value="expired">Certificats expirés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des certificats */}
        {filteredCertificates.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCertificates.map((certificate) => (
              <div
                key={certificate.id}
                className={`bg-white rounded-lg border-2 overflow-hidden transition-all hover:shadow-md ${
                  certificate.isValid ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                {/* Header du certificat */}
                <div className={`p-4 ${certificate.isValid ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className={`h-6 w-6 ${certificate.isValid ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${
                        certificate.isValid ? 'text-green-800' : 'text-gray-600'
                      }`}>
                        {certificate.isValid ? 'Certificat valide' : 'Certificat expiré'}
                      </span>
                    </div>
                    
                    {certificate.isValid && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenu du certificat */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {certificate.formation.title}
                  </h3>
                  
                  {certificate.formation.organization && (
                    <p className="text-sm text-gray-600 mb-4">
                      Délivré par {certificate.formation.organization}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Obtenu le {new Date(certificate.issuedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {certificate.expiresAt && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className={certificate.isValid ? 'text-gray-600' : 'text-red-600'}>
                          {certificate.isValid ? 'Expire le' : 'Expiré le'} {' '}
                          {new Date(certificate.expiresAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleDownload(certificate.id)}
                      disabled={downloading.has(certificate.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      <span>
                        {downloading.has(certificate.id) ? 'Téléchargement...' : 'Télécharger'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleShare(certificate)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Partager</span>
                    </button>

                    {certificate.certificateUrl && (
                      <button
                        onClick={() => window.open(certificate.certificateUrl, '_blank')}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Voir</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucun certificat trouvé' 
                : 'Aucun certificat obtenu'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Terminez vos formations pour obtenir des certificats.'
              }
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}

        {/* Informations sur les certificats */}
        {certificates.length > 0 && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  À propos de vos certificats
                </h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Les certificats sont automatiquement générés à la fin de chaque formation réussie</p>
                  <p>• Vous pouvez télécharger vos certificats au format PDF à tout moment</p>
                  <p>• Certains certificats ont une date d'expiration et doivent être renouvelés</p>
                  <p>• Partagez vos réussites sur vos réseaux professionnels</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LearnerLayout>
  );
};

export default CertificatesPage;
