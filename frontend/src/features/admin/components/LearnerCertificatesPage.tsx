import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Download, 
  Calendar,
  Clock,
  CheckCircle,
  Share2,
  Eye,
  FileText,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';
import '../styles/admin-typography.css';
import { authService } from '../../../services/authService';

interface Certificate {
  id: string;
  formationTitle: string;
  formationCode?: string;
  certificateNumber: string;
  issuedAt: Date;
  completedAt: Date;
  score?: number; // score obtenu au quiz (si applicable)
  duration: number; // durée totale de la formation en minutes
  organization: string;
  isValid: boolean;
  expiresAt?: Date;
  downloadUrl?: string;
  verificationUrl?: string;
}

const LearnerCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'expired'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadCertificates();
  }, []);

  useEffect(() => {
    filterCertificates();
  }, [certificates, searchTerm, statusFilter]);

  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      // TODO: Appel API pour charger les certificats de l'apprenant
      // Simulation des données pour l'instant
      const mockCertificates: Certificate[] = [
        {
          id: '1',
          formationTitle: 'Sécurité Bancaire',
          formationCode: 'SEC001',
          certificateNumber: 'CERT-SEC001-2024-001',
          issuedAt: new Date('2024-01-20'),
          completedAt: new Date('2024-01-20'),
          score: 92,
          duration: 120,
          organization: 'BAI Consulting',
          isValid: true,
          expiresAt: new Date('2025-01-20'),
          downloadUrl: '/api/certificates/download/1',
          verificationUrl: '/api/certificates/verify/CERT-SEC001-2024-001'
        },
        {
          id: '2',
          formationTitle: 'Gestion des Risques',
          formationCode: 'RISK001',
          certificateNumber: 'CERT-RISK001-2024-002',
          issuedAt: new Date('2024-01-18'),
          completedAt: new Date('2024-01-18'),
          score: 88,
          duration: 180,
          organization: 'BAI Consulting',
          isValid: true,
          expiresAt: new Date('2025-01-18'),
          downloadUrl: '/api/certificates/download/2',
          verificationUrl: '/api/certificates/verify/CERT-RISK001-2024-002'
        },
        {
          id: '3',
          formationTitle: 'Conformité RGPD',
          formationCode: 'RGPD001',
          certificateNumber: 'CERT-RGPD001-2023-015',
          issuedAt: new Date('2023-12-15'),
          completedAt: new Date('2023-12-15'),
          score: 95,
          duration: 90,
          organization: 'BAI Consulting',
          isValid: false, // Expiré
          expiresAt: new Date('2024-01-15'),
          downloadUrl: '/api/certificates/download/3',
          verificationUrl: '/api/certificates/verify/CERT-RGPD001-2023-015'
        },
        {
          id: '4',
          formationTitle: 'Anti-Blanchiment',
          formationCode: 'ABL001',
          certificateNumber: 'CERT-ABL001-2024-003',
          issuedAt: new Date('2024-01-25'),
          completedAt: new Date('2024-01-25'),
          score: 90,
          duration: 150,
          organization: 'BAI Consulting',
          isValid: true,
          expiresAt: new Date('2025-01-25'),
          downloadUrl: '/api/certificates/download/4',
          verificationUrl: '/api/certificates/verify/CERT-ABL001-2024-003'
        }
      ];

      setCertificates(mockCertificates);
    } catch (error) {
      console.error('Erreur lors du chargement des certificats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCertificates = () => {
    let filtered = certificates;

    // Filtrage par terme de recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(certificate =>
        certificate.formationTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        certificate.formationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        certificate.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(certificate => 
        statusFilter === 'valid' ? certificate.isValid : !certificate.isValid
      );
    }

    setFilteredCertificates(filtered);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusText = (isValid: boolean) => {
    return isValid ? 'Valide' : 'Expiré';
  };

  const handleDownloadCertificate = (certificate: Certificate) => {
    // TODO: Implémenter le téléchargement du certificat
    console.log('Téléchargement du certificat:', certificate.id);
    // Simulation du téléchargement
    const link = document.createElement('a');
    link.href = certificate.downloadUrl || '#';
    link.download = `certificat-${certificate.formationCode}.pdf`;
    link.click();
  };

  const handleShareCertificate = (certificate: Certificate) => {
    // TODO: Implémenter le partage du certificat
    console.log('Partage du certificat:', certificate.id);
    if (navigator.share) {
      navigator.share({
        title: `Certificat ${certificate.formationTitle}`,
        text: `J'ai obtenu le certificat ${certificate.formationTitle} de ${certificate.organization}`,
        url: certificate.verificationUrl
      });
    } else {
      // Fallback: copier l'URL dans le presse-papiers
      navigator.clipboard.writeText(certificate.verificationUrl || '');
      alert('Lien de vérification copié dans le presse-papiers');
    }
  };

  const handleViewCertificate = (certificate: Certificate) => {
    // TODO: Implémenter la visualisation du certificat
    console.log('Visualisation du certificat:', certificate.id);
    window.open(certificate.verificationUrl, '_blank');
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
      {/* Contrôles de vue et recherche */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Barre de recherche */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Rechercher un certificat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filtres et contrôles */}
        <div className="flex items-center gap-3">
          {/* Filtre par statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="valid">Valides</option>
            <option value="expired">Expirés</option>
          </select>

          {/* Sélecteur de vue */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vue grille"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vue liste"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total</p>
              <p className="text-xl font-bold text-gray-900">{certificates.length}</p>
            </div>
            <Award className="w-6 h-6 text-gray-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Valides</p>
              <p className="text-xl font-bold text-green-600">
                {certificates.filter(c => c.isValid).length}
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Expirés</p>
              <p className="text-xl font-bold text-red-600">
                {certificates.filter(c => !c.isValid).length}
              </p>
            </div>
            <Clock className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Score moyen</p>
              <p className="text-xl font-bold text-blue-600">
                {certificates.length > 0 
                  ? Math.round(certificates.reduce((sum, c) => sum + (c.score || 0), 0) / certificates.length)
                  : 0}%
              </p>
            </div>
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="bg-gradient-to-b from-white to-blue-50 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="admin-title-md admin-title-spacing">
            Mes certificats ({filteredCertificates.length})
          </h2>
        </div>

        {filteredCertificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun certificat trouvé</p>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucun certificat ne correspond à vos critères de recherche.' 
                : 'Vous n\'avez pas encore de certificats.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Vue grille */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* En-tête de la carte */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {certificate.formationTitle}
                    </h3>
                    {certificate.formationCode && (
                      <p className="text-sm text-gray-600 mb-2">Code: {certificate.formationCode}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(certificate.isValid)}`}>
                      {getStatusText(certificate.isValid)}
                    </span>
                  </div>
                </div>

                {/* Informations du certificat */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="w-4 h-4 mr-2" />
                    <span className="font-mono text-xs">{certificate.certificateNumber}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Émis le {formatDate(certificate.issuedAt)}</span>
                  </div>
                  {certificate.expiresAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Expire le {formatDate(certificate.expiresAt)}</span>
                    </div>
                  )}
                  {certificate.score && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span>Score: {certificate.score}%</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>Durée: {formatDuration(certificate.duration)}</span>
                  </div>
                </div>

                {/* Organisation */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Organisme</p>
                  <p className="text-sm font-medium text-gray-800">{certificate.organization}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewCertificate(certificate)}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Voir le certificat"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareCertificate(certificate)}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      title="Partager"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleDownloadCertificate(certificate)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Vue liste */
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* En-tête des colonnes */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center text-sm font-medium text-gray-700">
              <div className="flex-1">Certificat</div>
              <div className="w-24 text-center">Statut</div>
              <div className="w-20 text-center">Score</div>
              <div className="w-32 text-center">Date d'émission</div>
              <div className="w-32 text-center">Expiration</div>
              <div className="w-32 text-center">Actions</div>
            </div>
            
            {filteredCertificates.map((certificate) => (
              <div 
                key={certificate.id} 
                className="flex items-center py-3 px-4 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm"
              >
                {/* Colonne Certificat */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-gray-900 font-medium truncate">
                        {certificate.formationTitle}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {certificate.formationCode && `Code: ${certificate.formationCode}`}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {certificate.certificateNumber}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Colonne Statut */}
                <div className="w-24 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(certificate.isValid)}`}>
                    {getStatusText(certificate.isValid)}
                  </span>
                </div>
                
                {/* Colonne Score */}
                <div className="w-20 text-gray-600 text-center">
                  {certificate.score ? `${certificate.score}%` : '-'}
                </div>
                
                {/* Colonne Date d'émission */}
                <div className="w-32 text-gray-600 text-center">
                  {formatDate(certificate.issuedAt)}
                </div>
                
                {/* Colonne Expiration */}
                <div className="w-32 text-gray-600 text-center">
                  {certificate.expiresAt ? formatDate(certificate.expiresAt) : '-'}
                </div>
                
                {/* Colonne Actions */}
                <div className="w-32 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={() => handleViewCertificate(certificate)}
                      className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Voir le certificat"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareCertificate(certificate)}
                      className="p-1 text-green-600 hover:text-green-700 transition-colors"
                      title="Partager"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadCertificate(certificate)}
                      className="p-1 text-gray-600 hover:text-gray-700 transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerCertificatesPage;
