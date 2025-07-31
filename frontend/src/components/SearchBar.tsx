import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'banque' | 'assurance' | 'immobilier' | 'solutions';
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