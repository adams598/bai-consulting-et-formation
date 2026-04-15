import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'banque' | 'assurance' | 'immobilier' | 'solutions' | 'courtage' | 'formation' | 'conseil';
  path: string;
}

// Données de recherche (à remplacer par une API plus tard)
const searchData: SearchResult[] = [
  // Banque
  {
    id: 'banque-quotidien',
    title: 'Banque au quotidien & PNB',
    description: 'Nous vous accompagnons sur la démarche relationnelle et commerciale qui entoure le choix des services bancaires. Découvrez comment guider vos clients dans le choix de leurs services bancaires et augmenter le Produit Net Bancaire grâce à des méthodes éprouvées et des outils adaptés.',
    type: 'banque',
    path: '/banque#quotidien'
  },
  {
    id: 'banque-activite',
    title: 'Activité choisie vs subie',
    description: "Accompagner les Chargés de Clientèle dans le pilotage de leur activité au quotidien afin d'être efficace dans la gestion de l'administratif et du temps commercial.",
    type: 'banque',
    path: '/banque#activite'
  },
  {
    id: 'banque-epargne',
    title: 'Epargne',
    description: "Optimisez la gestion de l'épargne de vos clients grâce à nos formations spécialisées. Maîtrisez les produits d'épargne et développez une stratégie de conseil personnalisée pour chaque profil client.",
    type: 'banque',
    path: '/banque#epargne'
  },
  {
    id: 'banque-metiers',
    title: 'Spécificités métiers',
    description: "Conseillers Accueils, Particuliers, Professionnels, Privé, Gestion de Patrimoine : aborder les spécificités propres à chaque métier.",
    type: 'banque',
    path: '/banque#metiers'
  },
  {
    id: 'banque-conquete',
    title: 'Conquête client',
    description: 'Prospection (terrain et téléphonique) et recommandation pour booster le développement du portefeuille clients.',
    type: 'banque',
    path: '/banque#conquete'
  },
  {
    id: 'banque-demarche',
    title: 'Démarche commerciale',
    description: 'Accompagnement à chaque étape de la démarche commerciale, de la prise de contact à la conclusion de la vente.',
    type: 'banque',
    path: '/banque#demarche'
  },
  {
    id: 'banque-rdv',
    title: 'Rendez-vous téléphonique',
    description: 'Intégrer le rendez-vous téléphonique dans l\'activité commerciale, posture et émotions à transmettre.',
    type: 'banque',
    path: '/banque#rdv'
  },
  {
    id: 'banque-kyc',
    title: 'KYC (Know Your Customer)',
    description: 'Importance de la mise à jour des données clients et des opportunités commerciales associées.',
    type: 'banque',
    path: '/banque#kyc'
  },
  {
    id: 'banque-digital',
    title: 'Digitalisation',
    description: 'Utilisation des services bancaires et d\'assurance en self-care, avantages de la digitalisation.',
    type: 'banque',
    path: '/banque#digital'
  },
  {
    id: 'banque-nps',
    title: 'Satisfaction client (NPS)',
    description: 'Impact de la satisfaction client sur le développement du PNB.',
    type: 'banque',
    path: '/banque#nps'
  },
  // Assurance
  {
    id: 'assurance-iard-part',
    title: 'Univers Particuliers - IARD Part (MRH, Auto, PNO)',
    description: 'MRH (Multirisque Habitation), Assurance Auto, PNO (Assurance propriétaire non occupant) : des solutions pour protéger les biens de vos clients particuliers.',
    type: 'assurance',
    path: '/assurance#iard-part'
  },
  {
    id: 'assurance-prev-part',
    title: 'Univers Particuliers - Prévoyance',
    description: 'GOBS (Garantie Obsèques), MAV/GAV/AAV (Assurance des accidents de la vie), Assurance Décès : protégez la famille et l\'avenir de vos clients.',
    type: 'assurance',
    path: '/assurance#prev-part'
  },
  {
    id: 'assurance-iard-pro',
    title: 'Univers Professionnels - IARD Pro',
    description: 'MRPRO (Multirisque Professionnelle), Assurance Auto Professionnelle : des solutions adaptées aux besoins des professionnels.',
    type: 'assurance',
    path: '/assurance#iard-pro'
  },
  {
    id: 'assurance-prev-pro',
    title: 'Univers Professionnels - Prévoyance Pro',
    description: 'Assurance Homme Clé, Prévoyance PRO+ (IJ + CAPITAL en cas de DCPTIA) : sécurisez l\'activité et la pérennité de l\'entreprise.',
    type: 'assurance',
    path: '/assurance#prev-pro'
  },
  // Immobilier
  {
    id: 'immo-location',
    title: 'Location immobilière',
    description: "Accompagnement des clients dans la recherche d'un bien immobilier à la location, avec différentes approches commerciales adaptées.",
    type: 'immobilier',
    path: '/immobilier#location'
  },
  {
    id: 'immo-vente',
    title: 'Vente immobilière',
    description: "Conseil et accompagnement dans la recherche et l'achat d'un bien immobilier, que ce soit pour un primo-accédant ou non, en abordant les spécificités des programmes immobiliers (VEFA).",
    type: 'immobilier',
    path: '/immobilier#vente'
  },
  {
    id: 'immo-hautdegamme',
    title: 'Immobilier Haut de Gamme',
    description: "Un focus particulier sur l'immobilier haut de gamme, nécessitant une démarche commerciale spécifique et personnalisée.",
    type: 'immobilier',
    path: '/immobilier#hautdegamme'
  },
  // Solutions
  {
    id: 'solutions-conference',
    title: 'Conférence',
    description: "Nos conférences sont conçues pour partager notre expertise et nos connaissances avec vos équipes. Animées par des professionnels expérimentés, elles permettent d'aborder des sujets spécifiques et d'échanger sur les meilleures pratiques du secteur.",
    type: 'solutions',
    path: '/solutions#conference'
  },
  {
    id: 'solutions-consulting',
    title: 'Consulting',
    description: "Notre service de consulting vous accompagne dans l'optimisation de vos processus commerciaux et la mise en place de stratégies efficaces. Nous analysons vos besoins spécifiques et vous proposons des solutions sur mesure pour améliorer vos performances.",
    type: 'solutions',
    path: '/solutions#consulting'
  },
  {
    id: 'solutions-formations',
    title: 'Formations',
    description: "Nos formations sont conçues pour développer les compétences de vos équipes commerciales. De la banque à l'assurance en passant par l'immobilier, nous proposons des parcours adaptés à chaque métier et niveau d'expérience.",
    type: 'solutions',
    path: '/solutions#formations'
  },
  // Courtage
  {
    id: 'courtage-achat',
    title: 'Achat Immobilier',
    description: 'Concrétisez vos projets immobiliers en Afrique avec notre accompagnement complet. Sourcing de biens, analyse de projets, négociation commerciale, financement adapté.',
    type: 'courtage',
    path: '/courtage#services'
  },
  {
    id: 'courtage-investissement',
    title: 'Investissement Locatif',
    description: 'Générez des revenus réguliers en investissant dans l\'immobilier africain. Analyse de rentabilité, sélection des biens, structuration fiscale, gestion locative.',
    type: 'courtage',
    path: '/courtage#services'
  },
  {
    id: 'courtage-credit',
    title: 'Accès au Crédit Local',
    description: 'Accédez facilement au crédit auprès des meilleures institutions bancaires africaines. Analyse de dossier, mise en relation bancaire, montage de dossier.',
    type: 'courtage',
    path: '/courtage#services'
  },
  {
    id: 'courtage-cameroun',
    title: 'Courtage Cameroun',
    description: 'Notre principal marché avec partenariats exclusifs. Résidences secondaires, investissement locatif, immobilier professionnel avec Crédit Foncier du Cameroun.',
    type: 'courtage',
    path: '/courtage#cameroun'
  },
  {
    id: 'courtage-cotedivoire',
    title: 'Courtage Côte d\'Ivoire',
    description: 'Marché dynamique avec fortes opportunités. Projets résidentiels, copropriétés, programmes commerciaux avec nos partenaires bancaires.',
    type: 'courtage',
    path: '/courtage#cotedivoire'
  },
  // Formation
  {
    id: 'formation-banque',
    title: 'Conseiller Bancaire',
    description: 'Formations sur mesure pour conseillers bancaires : techniques de négociation, gestion de portefeuille clients, développement commercial, épargne et placements.',
    type: 'formation',
    path: '/formation#nosformations'
  },
  {
    id: 'formation-assurance',
    title: 'Conseiller en Assurance',
    description: 'Formations pour aborder tous les univers d\'assurance : IARD, Prévoyance, techniques commerciales, accompagnement client, produits d\'assurance.',
    type: 'formation',
    path: '/formation#nosformations'
  },
  {
    id: 'formation-microfinance',
    title: 'Microfinance',
    description: 'Formations spécialisées en microfinance pour inclusion financière, accompagnement des petits entrepreneurs, évaluation du crédit, gestion des risques.',
    type: 'formation',
    path: '/formation#nosformations'
  },
  {
    id: 'formation-coaching',
    title: 'Coaching Commercial',
    description: 'Programmes de coaching intensifs pour développer compétences commerciales, techniques de vente, gestion d\'équipe, leadership commercial.',
    type: 'formation',
    path: '/formation#nosformations'
  },
  {
    id: 'formation-etudiants',
    title: 'Formation Étudiants',
    description: 'Préparation aux métiers de la finance et de l\'assurance dès les études. Du Bac à Bac+5, développez vos compétences pour une carrière réussie.',
    type: 'formation',
    path: '/formation#public'
  },
  {
    id: 'formation-reconversion',
    title: 'Reconversion Professionnelle',
    description: 'Changez de carrière en toute confiance avec nos formations adaptées. Accompagnement personnalisé et mise en relation avec nos partenaires recruteurs.',
    type: 'formation',
    path: '/formation#public'
  },
  // Conseil aux entreprises
  {
    id: 'conseil-structuration',
    title: 'Structuration Financière',
    description: 'Organisation professionnelle de votre activité : analyse complète, mise en place d\'indicateurs financiers, organisation des flux et gestion.',
    type: 'conseil',
    path: '/conseil#solutions'
  },
  {
    id: 'conseil-montage',
    title: 'Montage de Dossiers de Financement',
    description: 'Construction de votre dossier bancaire parfait : préparation de business plan, structuration du dossier, optimisation de votre profil emprunteur.',
    type: 'conseil',
    path: '/conseil#solutions'
  },
  {
    id: 'conseil-relation',
    title: 'Mise en Relation avec les Banques',
    description: 'Ouverture des portes des institutions financières : identification des partenaires adaptés, présentation de votre dossier, accompagnement jusqu\'à validation.',
    type: 'conseil',
    path: '/conseil#solutions'
  },
  {
    id: 'conseil-pme',
    title: 'Conseil PME en Croissance',
    description: 'Accélérez votre développement avec des financements adaptés. Structuration, optimisation des process et stratégie de financement pour PME.',
    type: 'conseil',
    path: '/conseil#public'
  },
  {
    id: 'conseil-entrepreneurs',
    title: 'Conseil Entrepreneurs',
    description: 'Structurez vos projets et accédez au financement. Accompagnement complet pour entrepreneurs africains en phase de structuration.',
    type: 'conseil',
    path: '/conseil#public'
  },
  {
    id: 'conseil-startups',
    title: 'Conseil Startups',
    description: 'Levez des fonds et développez votre activité rapidement. Accompagnement spécialisé pour startups africaines en recherche de financement.',
    type: 'conseil',
    path: '/conseil#public'
  },
];

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    // Découper la requête en mots-clés (séparés par espace)
    const keywords = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    // Appliquer le filtre même si keywords est vide (affichera tout si rien n'est saisi)
    if (keywords.length === 0) {
      setResults([]);
      return;
    }
    // Filtrer les résultats qui contiennent TOUS les mots-clés dans le titre, la description ou le path
    const filteredResults = searchData.filter(item =>
      keywords.every(kw =>
        item.title.toLowerCase().includes(kw) ||
        item.description.toLowerCase().includes(kw) ||
        item.path.toLowerCase().includes(kw)
      )
    );
    setResults(filteredResults);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={searchRef}>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-bg-secondary transition-colors"
        aria-label="Rechercher"
      >
        <Search className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-gray-200 dark:border-dark-border">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Rechercher une formation..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-brand-beige dark:focus:ring-dark-accent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-primary" />
              </button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-dark-bg-primary transition-colors border-b border-gray-200 dark:border-dark-border last:border-b-0"
                >
                  <div className="font-medium text-gray-900 dark:text-dark-text-primary">
                    {result.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    {result.description}
                  </div>
                  <div className="mt-1 text-xs text-brand-beige dark:text-dark-accent">
                    {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-dark-text-secondary">
              Aucun résultat trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
} 