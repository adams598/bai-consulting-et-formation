import { useState, useRef, useEffect } from 'react';

// Fonction de sanitisation pour prévenir XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Supprimer les balises HTML
    .replace(/javascript:/gi, '') // Supprimer les protocoles dangereux
    .replace(/on\w+=/gi, '') // Supprimer les événements JavaScript
    .trim();
};

// Fonction de validation des entrées
const validateMessage = (message: string): { isValid: boolean; error?: string } => {
  if (!message || message.trim().length === 0) {
    return { isValid: false, error: 'Le message ne peut pas être vide' };
  }
  
  if (message.length > 1000) {
    return { isValid: false, error: 'Le message ne peut pas dépasser 1000 caractères' };
  }
  
  // Vérifier les caractères dangereux
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(message)) {
      return { isValid: false, error: 'Le message contient du contenu non autorisé' };
    }
  }
  
  return { isValid: true };
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Formation {
  id: string;
  titre: string;
  description: string;
  domaine: 'banque' | 'assurance' | 'immobilier';
  niveau: 'débutant' | 'intermédiaire' | 'avancé';
  motsCles: string[];
  lien: string;
}

// Base de données des formations avec mots-clés
const formations: Formation[] = [
  {
    id: '1',
    titre: 'Introduction à la Banque Digitale',
    description: 'Découvrez les fondamentaux de la transformation digitale dans le secteur bancaire.',
    domaine: 'banque',
    niveau: 'débutant',
    motsCles: ['banque', 'digitale', 'digital', 'transformation', 'bancaire', 'technologie', 'innovation', 'fintech', 'mobile', 'online', 'internet', 'web'],
    lien: '/banque'
  },
  {
    id: '2',
    titre: 'Fondamentaux de la Banque Commerciale',
    description: 'Découvrir les bases du secteur bancaire, les produits, la relation client et la conformité.',
    domaine: 'banque',
    niveau: 'débutant',
    motsCles: ['banque', 'commerciale', 'produits', 'client', 'conformité', 'réglementation', 'crédit', 'épargne', 'compte', 'prêt', 'financement'],
    lien: '/banque'
  },
  {
    id: '3',
    titre: 'Conformité bancaire - Niveau 1',
    description: 'Maîtriser les fondamentaux de la conformité et de la réglementation bancaire.',
    domaine: 'banque',
    niveau: 'intermédiaire',
    motsCles: ['conformité', 'réglementation', 'banque', 'lbcft', 'kyc', 'vigilance', 'risque', 'contrôle', 'audit', 'normes'],
    lien: '/banque'
  },
  {
    id: '4',
    titre: 'Introduction à l\'Assurance et la Prévoyance',
    description: 'Vue d\'ensemble des produits d\'assurance, prévoyance, risques et sinistres.',
    domaine: 'assurance',
    niveau: 'débutant',
    motsCles: ['assurance', 'prévoyance', 'risque', 'sinistre', 'police', 'contrat', 'garantie', 'protection', 'sécurité'],
    lien: '/assurance'
  },
  {
    id: '5',
    titre: 'Gestion des risques en assurance',
    description: 'Maîtriser les fondamentaux de la gestion des risques et sinistres.',
    domaine: 'assurance',
    niveau: 'intermédiaire',
    motsCles: ['risque', 'gestion', 'assurance', 'sinistre', 'évaluation', 'prévention', 'analyse', 'contrôle', 'sécurité'],
    lien: '/assurance'
  },
  {
    id: '6',
    titre: 'Bases de la Transaction Immobilière',
    description: 'Apprendre les processus d\'achat, de vente et de gestion locative.',
    domaine: 'immobilier',
    niveau: 'débutant',
    motsCles: ['immobilier', 'transaction', 'achat', 'vente', 'location', 'gestion', 'bien', 'propriété', 'investissement', 'marché'],
    lien: '/immobilier'
  },
  {
    id: '7',
    titre: 'Expertise en évaluation immobilière',
    description: 'Acquérir les compétences pour l\'évaluation professionnelle de biens immobiliers.',
    domaine: 'immobilier',
    niveau: 'avancé',
    motsCles: ['évaluation', 'expertise', 'immobilier', 'bien', 'prix', 'marché', 'analyse', 'estimation', 'professionnel'],
    lien: '/immobilier'
  }
];

// Fonction pour analyser les mots-clés dans un message
function analyserMotsCles(message: string): Formation[] {
  const messageLower = message.toLowerCase();
  const motsClesDetectes = new Map<string, number>();
  
  formations.forEach(formation => {
    let score = 0;
    formation.motsCles.forEach(motCle => {
      if (messageLower.includes(motCle.toLowerCase())) {
        score += 1;
      }
    });
    if (score > 0) {
      motsClesDetectes.set(formation.id, score);
    }
  });
  
  const formationsTriees = Array.from(motsClesDetectes.entries())
    .sort(([,a], [,b]) => b - a)
    .map(([id]) => formations.find(f => f.id === id)!)
    .filter(Boolean);
  
  return formationsTriees;
}

// Fonction pour générer une réponse basée sur les mots-clés
function genererReponse(message: string): string {
  const formationsRecommandees = analyserMotsCles(message);
  
  if (formationsRecommandees.length === 0) {
    return `Bonjour ! Je suis MAIA, votre assistante virtuelle pour les formations BAI Consulting. 😊

Je n'ai pas trouvé de formation correspondant exactement à votre demande. Voici nos domaines de formation :

🏦 **Banque** : Transformation digitale, conformité, produits bancaires
🛡️ **Assurance** : Gestion des risques, produits d'assurance
🏠 **Immobilier** : Transactions, évaluation, gestion locative

Pouvez-vous me préciser votre domaine d'intérêt ou votre niveau d'expérience ?`;
  }
  
  if (formationsRecommandees.length === 1) {
    const formation = formationsRecommandees[0];
    return `Parfait ! J'ai trouvé une formation qui correspond à votre demande : 😊

**${formation.titre}**
📝 ${formation.description}
📊 Niveau : ${formation.niveau}
🏷️ Domaine : ${formation.domaine.charAt(0).toUpperCase() + formation.domaine.slice(1)}

Cette formation vous intéresse-t-elle ? Vous pouvez la découvrir en visitant notre page ${formation.domaine}.`;
  }
  
  return `Excellent ! J'ai trouvé ${formationsRecommandees.length} formations qui correspondent à votre demande : 😊

${formationsRecommandees.slice(0, 3).map((formation, index) => 
  `${index + 1}. **${formation.titre}** (${formation.niveau})
   📝 ${formation.description}
   🏷️ Domaine : ${formation.domaine.charAt(0).toUpperCase() + formation.domaine.slice(1)}`
).join('\n\n')}`;
}

// Questions suggérées adaptées à MAIA
const suggestedQuestions = [
  "Les formations réglementaires (Banque et Assurance)",
  "La démarche relationnelle et commerciale",
  "Cours d'assurance pour débutant",
  "Formation immobilier transaction",
  "La Multirisque Habitation",
  "La Multirisque Professionnelle",
  "La prévoyance pour les débutants (Pro et Part)",
  "Le rendez-vous téléphonique",
  "Equipement bancaire et PNB Banque",
  "L'assurance décès"
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pendingFeedback, setPendingFeedback] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<'yes' | 'no' | null>(null);
  const showSuggestions = messages.length === 0;
  const [showResetModal, setShowResetModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent, suggestedMsg?: string) => {
    e?.preventDefault();

    const messageToSend = suggestedMsg || input.trim();
    if (!messageToSend) return;

    // Validation et sanitisation
    const validation = validateMessage(messageToSend);
    if (!validation.isValid) {
      // Afficher l'erreur à l'utilisateur
      const errorMessage: Message = { 
        role: 'assistant', 
        content: `❌ Erreur: ${validation.error}` 
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const sanitizedMessage = sanitizeInput(messageToSend);
    const userMessage: Message = { role: 'user', content: sanitizedMessage };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setPendingFeedback(false);
    setLastFeedback(null);

    // Simuler un délai de traitement
    setTimeout(() => {
      const reponse = genererReponse(sanitizedMessage);
      const assistantMessage: Message = { role: 'assistant', content: reponse };
      setMessages(prev => [...prev, assistantMessage]);
      setPendingFeedback(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleFeedback = (value: 'yes' | 'no') => {
    setLastFeedback(value);
    setPendingFeedback(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <div className="flex flex-col items-end space-y-2">
          {/* Message de bienvenue avec croix de fermeture */}
          {showWelcome && (
            <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 max-w-xs">
              <button
                className="absolute top-1 right-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 text-lg font-bold p-1 rounded-full focus:outline-none"
                aria-label="Fermer la bulle de bienvenue"
                onClick={() => setShowWelcome(false)}
              >
                &times;
              </button>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Bonjour, je suis MAIA 🙂<br/>
                Comment puis-je vous aider dans le choix de votre formation ?
              </p>
            </div>
          )}
          
          {/* Bouton du chatbot */}
          <button
            onClick={() => setIsOpen(true)}
            className="bg-brand-blue text-white p-4 rounded-full shadow-lg hover:bg-brand-blue/90 transition-colors dark:bg-brand-blue dark:hover:bg-brand-blue/80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-96 h-[600px] flex flex-col dark:bg-gray-900 dark:text-gray-100">
          <div className="p-4 border-b flex justify-between items-center bg-brand-blue text-white rounded-t-lg dark:bg-gray-800 dark:text-white">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mr-3">
                <span className="text-brand-blue font-bold text-sm dark:text-brand-blue">M</span>
              </div>
              <h3 className="font-semibold">MAIA</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 dark:text-gray-200 dark:hover:text-gray-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-600 text-sm dark:text-gray-300">
                <p>👋 Bonjour ! Je suis MAIA, votre assistante virtuelle.</p>
                <p className="mt-2">Comment puis-je vous aider dans le choix de votre formation&nbsp;?</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-brand-blue text-white dark:bg-brand-blue dark:text-white'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  <div className="whitespace-pre-line">{message.content}</div>
                  {index === messages.length - 1 && message.role === 'assistant' && pendingFeedback && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span>Cette réponse vous a-t-elle aidé&nbsp;?</span>
                      <button
                        onClick={() => handleFeedback('yes')}
                        className="rounded-full bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 ml-2 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-300"
                        aria-label="Oui"
                      >👍</button>
                      <button
                        onClick={() => handleFeedback('no')}
                        className="rounded-full bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 ml-1 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300"
                        aria-label="Non"
                      >👎</button>
                    </div>
                  )}
                  {index === messages.length - 1 && message.role === 'assistant' && lastFeedback === 'yes' && (
                    <div className="mt-2 text-green-700 text-xs dark:text-green-300">Merci pour votre retour&nbsp;!</div>
                  )}
                  {index === messages.length - 1 && message.role === 'assistant' && lastFeedback === 'no' && (
                    <div className="mt-2 text-red-700 text-xs dark:text-red-300">N'hésitez pas à reformuler votre question ou à <a href="/contact" className="underline text-brand-blue dark:text-brand-blue">contacter notre support</a>.</div>
                  )}
                  {index === messages.length - 1 && message.role === 'assistant' && (
                    <div className="mt-4 flex justify-center">
                      <a href="/contact" className="bg-brand-blue text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-brand-beige/90 transition-colors dark:bg-brand-blue dark:hover:bg-brand-blue/80">
                        Nous contacter
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Suggestions */}
            {showSuggestions && (
              <div className="flex flex-col space-y-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-gray-600 text-sm dark:text-gray-300">Suggestions :</p>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSubmit(undefined, question)}
                    className="text-left text-brand-blue hover:underline text-sm p-2 bg-gray-100 rounded-md dark:bg-gray-800 dark:text-gray-100"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce dark:bg-gray-500" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100 dark:bg-gray-500" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200 dark:bg-gray-500" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Décrivez ce que vous cherchez..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90 transition-colors disabled:opacity-50 dark:bg-brand-blue dark:hover:bg-brand-blue/80"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </form>

          {/* Bouton Nouvelle conversation */}
          {messages.length > 0 && (
            <div className="p-4 border-t flex justify-center bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
              <button
                onClick={() => setShowResetModal(true)}
                className="bg-brand-beige text-brand-blue font-semibold px-4 py-2 rounded-full shadow hover:bg-brand-beige/90 transition-colors dark:bg-gray-700 dark:text-brand-beige dark:hover:bg-gray-600"
              >
                Nouvelle conversation
              </button>
            </div>
          )}

          {/* Modale de confirmation de reset */}
          {showResetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 dark:bg-opacity-70">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto flex flex-col items-center dark:bg-gray-900 dark:text-gray-100">
                <h2 className="text-lg font-bold text-brand-blue mb-2 dark:text-brand-beige">Nouvelle conversation</h2>
                <p className="text-gray-700 mb-6 text-center dark:text-gray-200">Voulez-vous vraiment démarrer une nouvelle conversation&nbsp;?<br/>Votre échange actuel sera perdu.</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      setMessages([]);
                      setInput('');
                      setPendingFeedback(false);
                      setLastFeedback(null);
                      setShowResetModal(false);
                    }}
                    className="px-4 py-2 rounded bg-brand-blue text-white font-semibold hover:bg-brand-blue/90 dark:bg-brand-blue dark:hover:bg-brand-blue/80"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 