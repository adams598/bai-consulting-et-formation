import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Folder } from 'lucide-react';
import { Formation, Universe } from '../features/admin/types';

interface SearchSuggestionsProps {
  searchTerm: string;
  formations: Formation[];
  universes: Universe[];
  onSuggestionClick: (formation: Formation) => void;
  onClose: () => void;
  isVisible: boolean;
}

interface SearchSuggestion {
  id: string;
  type: 'formation' | 'universe';
  title: string;
  subtitle?: string;
  formation?: Formation;
  universe?: Universe;
  score: number;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  searchTerm,
  formations,
  universes,
  onSuggestionClick,
  onClose,
  isVisible
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fonction de calcul de score de pertinence
  const calculateScore = (text: string, searchTerm: string): number => {
    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    
    // Score plus élevé si le terme commence par le texte
    if (lowerText.startsWith(lowerSearch)) return 100;
    
    // Score élevé si le terme est au début d'un mot
    const words = lowerText.split(/\s+/);
    const startsWithWord = words.some(word => word.startsWith(lowerSearch));
    if (startsWithWord) return 80;
    
    // Score moyen si le terme est contenu dans le texte
    if (lowerText.includes(lowerSearch)) return 60;
    
    // Score faible pour les correspondances partielles
    const searchWords = lowerSearch.split(/\s+/);
    const matches = searchWords.filter(word => 
      words.some(textWord => textWord.includes(word))
    );
    return matches.length * 20;
  };

  // Générer les suggestions
  useEffect(() => {
    if (!searchTerm.trim() || !isVisible) {
      setSuggestions([]);
      return;
    }

    const newSuggestions: SearchSuggestion[] = [];

    // Ajouter les formations
    formations.forEach(formation => {
      const universe = universes.find(u => u.id === formation.universeId);
      const universeName = universe?.name || (formation.isOpportunity ? 'Opportunités commerciales' : 'Sans univers');
      
      // Calculer le score pour le titre de la formation
      const titleScore = calculateScore(formation.title, searchTerm);
      
      // Calculer le score pour le nom de l'univers
      const universeScore = calculateScore(universeName, searchTerm);
      
      // Calculer le score pour la description
      const descriptionScore = formation.description 
        ? calculateScore(formation.description, searchTerm) 
        : 0;

      // Prendre le score le plus élevé
      const maxScore = Math.max(titleScore, universeScore, descriptionScore);

      if (maxScore > 0) {
        newSuggestions.push({
          id: `formation-${formation.id}`,
          type: 'formation',
          title: formation.title,
          subtitle: `${universeName}/${formation.title}`,
          formation,
          score: maxScore
        });
      }
    });

    // Ajouter les univers
    universes.forEach(universe => {
      const score = calculateScore(universe.name, searchTerm);
      
      if (score > 0) {
        newSuggestions.push({
          id: `universe-${universe.id}`,
          type: 'universe',
          title: universe.name,
          subtitle: `Univers: ${universe.name}`,
          universe,
          score
        });
      }
    });

    // Trier par score décroissant et limiter à 8 suggestions
    const sortedSuggestions = newSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    setSuggestions(sortedSuggestions);
    setSelectedIndex(0);
  }, [searchTerm, formations, universes, isVisible]);

  // Gérer la navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            handleSuggestionClick(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, suggestions, selectedIndex, onClose]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'formation' && suggestion.formation) {
      onSuggestionClick(suggestion.formation);
    }
    onClose();
  };

  // Mettre en évidence le terme de recherche dans le texte
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-brand-beige px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div 
      ref={suggestionsRef}
      className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto"
    >
      <div className="p-2">
        <div className="text-xs text-gray-500 mb-2 px-2">
          {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} trouvée{suggestions.length > 1 ? 's' : ''}
        </div>
        
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
              index === selectedIndex 
                ? 'bg-stone-100 border border-gray-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <div className="flex-shrink-0">
              {suggestion.type === 'formation' ? (
                <BookOpen className="h-4 w-4 text-brand-beige" />
              ) : (
                <Folder className="h-4 w-4 text-blue-950" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {highlightText(suggestion.title, searchTerm)}
              </div>
              {suggestion.subtitle && (
                <div className="text-xs text-gray-500 truncate">
                  {highlightText(suggestion.subtitle, searchTerm)}
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0">
              <div className="text-xs text-gray-400">
                {suggestion.type === 'formation' ? 'Formation' : 'Univers'}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-200 px-3 py-2 bg-gray-50">
        <div className="text-xs text-gray-500">
          <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">↑↓</kbd> pour naviguer
          <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs ml-2">↵</kbd> pour sélectionner
          <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs ml-2">Esc</kbd> pour fermer
        </div>
      </div>
    </div>
  );
};

export default SearchSuggestions;
