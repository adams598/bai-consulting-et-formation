import React from 'react';
import { CheckCircle, XCircle, Trophy, RotateCcw, Download } from 'lucide-react';
import { Button } from './ui/button';

interface QuizResult {
  score: number;
  isPassed: boolean;
  totalScore: number;
  userScore: number;
}

interface QuizResultProps {
  result: QuizResult;
  quizTitle: string;
  passingScore: number;
  onRetry: () => void;
  onClose: () => void;
  onDownloadCertificate?: () => void;
}

const QuizResult: React.FC<QuizResultProps> = ({
  result,
  quizTitle,
  passingScore,
  onRetry,
  onClose,
  onDownloadCertificate,
}) => {
  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return 'text-green-600';
    if (score >= passingScore * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number, passingScore: number) => {
    if (score >= passingScore) {
      return "Félicitations ! Vous avez réussi le quiz !";
    } else if (score >= passingScore * 0.8) {
      return "Vous êtes proche de la réussite. Essayez encore !";
    } else {
      return "Vous devez améliorer vos connaissances. Réessayez !";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className={`p-6 rounded-t-lg ${
          result.isPassed 
            ? 'bg-gradient-to-r from-green-600 to-green-700' 
            : 'bg-gradient-to-r from-red-600 to-red-700'
        } text-white`}>
          <div className="flex items-center justify-center mb-4">
            {result.isPassed ? (
              <Trophy className="w-12 h-12 mr-3" />
            ) : (
              <XCircle className="w-12 h-12 mr-3" />
            )}
            <h2 className="text-3xl font-bold">
              {result.isPassed ? 'Quiz Réussi !' : 'Quiz Échoué'}
            </h2>
          </div>
          
          <p className="text-center text-lg opacity-90">
            {getScoreMessage(result.score, passingScore)}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Score */}
          <div className="text-center mb-6">
            <div className={`text-6xl font-bold ${getScoreColor(result.score, passingScore)} mb-2`}>
              {result.score}%
            </div>
            <p className="text-gray-600 text-lg">
              Score obtenu: {result.userScore} / {result.totalScore} points
            </p>
            <p className="text-gray-500">
              Score minimum requis: {passingScore}%
            </p>
          </div>

          {/* Quiz Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Détails du quiz</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Quiz:</span> {quizTitle}</p>
              <p><span className="font-medium">Score obtenu:</span> {result.score}%</p>
              <p><span className="font-medium">Statut:</span> 
                <span className={`ml-1 font-medium ${
                  result.isPassed ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.isPassed ? 'Réussi' : 'Échoué'}
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            {result.isPassed && onDownloadCertificate && (
              <Button
                onClick={onDownloadCertificate}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger le certificat
              </Button>
            )}
            
            {!result.isPassed && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            )}
            
            <Button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Fermer
            </Button>
          </div>

          {/* Tips for improvement */}
          {!result.isPassed && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">
                💡 Conseils pour améliorer votre score
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Relisez attentivement les questions avant de répondre</li>
                <li>• Revoyez le contenu de la formation si nécessaire</li>
                <li>• Prenez votre temps pour analyser chaque réponse</li>
                <li>• Vous pouvez refaire le quiz autant de fois que nécessaire</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResult;

































