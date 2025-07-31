import React from 'react';
import { Certificate as CertificateType } from '../types';
import { Download, Share2, CheckCircle } from 'lucide-react';

interface CertificateProps {
  certificate: CertificateType;
  courseTitle: string;
  userName: string;
  completionDate: Date;
}

export default function Certificate({ certificate, courseTitle, userName, completionDate }: CertificateProps) {
  const handleDownload = () => {
    // Logique de téléchargement du certificat
    window.open(certificate.downloadUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificat de ${courseTitle}`,
          text: `Je viens d'obtenir mon certificat pour le cours "${courseTitle}" sur BAI Consulting !`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Erreur lors du partage:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue/80 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Certificat de réussite</h2>
            <p className="opacity-90">Ce certificat est décerné à</p>
          </div>
          <CheckCircle className="h-12 w-12 text-white/20" />
        </div>
      </div>

      {/* Contenu du certificat */}
      <div className="p-8">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">{userName}</h3>
          <p className="text-gray-600 mb-2">pour avoir complété avec succès</p>
          <h4 className="text-xl font-medium text-brand-blue">{courseTitle}</h4>
        </div>

        <div className="border-t border-b border-gray-200 py-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Date d'obtention</p>
              <p className="font-medium text-gray-900">
                {completionDate.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Code de vérification</p>
              <p className="font-medium text-gray-900">{certificate.verificationCode}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-blue text-white py-3 px-4 rounded-lg hover:bg-brand-blue/90 transition-colors"
          >
            <Download className="h-5 w-5" />
            Télécharger
          </button>
          {typeof navigator.share !== 'undefined' && (
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 className="h-5 w-5" />
              Partager
            </button>
          )}
        </div>
      </div>

      {/* Pied de page */}
      <div className="bg-gray-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Vérifiez ce certificat sur</p>
            <a
              href={`/verification/${certificate.verificationCode}`}
              className="text-brand-blue hover:underline"
            >
              bai-consulting.com/verification
            </a>
          </div>
          <img
            src="/images/optimized/logo.webp"
            alt="BAI Consulting"
            className="h-8"
          />
        </div>
      </div>
    </div>
  );
} 