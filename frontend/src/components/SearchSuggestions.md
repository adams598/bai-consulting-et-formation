# SearchSuggestions

Composant de suggestions de recherche intelligent pour les formations et univers.

## Fonctionnalités

- **Suggestions en temps réel** : Affiche des suggestions pendant la saisie
- **Format [univers]/[formation]** : Affiche les formations avec leur univers associé
- **Navigation clavier** : Support des flèches ↑↓, Entrée et Échap
- **Mise en évidence** : Surligne les termes de recherche correspondants
- **Score de pertinence** : Trie les suggestions par pertinence
- **Recherche multi-critères** : Recherche dans les titres, descriptions et noms d'univers

## Utilisation

```tsx
import SearchSuggestions from '../components/SearchSuggestions';

<SearchSuggestions
  searchTerm={searchTerm}
  formations={formations}
  universes={universes}
  onSuggestionClick={handleSuggestionClick}
  onClose={handleClose}
  isVisible={showSuggestions}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `searchTerm` | `string` | Terme de recherche saisi par l'utilisateur |
| `formations` | `Formation[]` | Liste des formations disponibles |
| `universes` | `Universe[]` | Liste des univers disponibles |
| `onSuggestionClick` | `(formation: Formation) => void` | Callback appelé lors du clic sur une suggestion |
| `onClose` | `() => void` | Callback appelé pour fermer les suggestions |
| `isVisible` | `boolean` | Contrôle la visibilité du composant |

## Algorithme de score

Le composant utilise un système de score de pertinence :

1. **Score 100** : Le terme commence par le texte
2. **Score 80** : Le terme commence par un mot du texte
3. **Score 60** : Le terme est contenu dans le texte
4. **Score 20** : Correspondance partielle par mot

## Navigation clavier

- `↑` : Naviguer vers le haut
- `↓` : Naviguer vers le bas
- `Entrée` : Sélectionner la suggestion
- `Échap` : Fermer les suggestions

## Format d'affichage

- **Formations** : `[Nom de l'univers]/[Titre de la formation]`
- **Univers** : `Univers: [Nom de l'univers]`
- **Opportunités commerciales** : `Opportunités commerciales/[Titre de la formation]`

## Exemple d'intégration

```tsx
const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
const [searchTerm, setSearchTerm] = useState('');

const handleSearchInputFocus = () => {
  setShowSearchSuggestions(true);
};

const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchTerm(e.target.value);
  setShowSearchSuggestions(true);
};

const handleSuggestionClick = (formation: Formation) => {
  // Ouvrir la formation sélectionnée
  handleFormationClick(formation);
  setSearchTerm('');
  setShowSearchSuggestions(false);
};

return (
  <div className="relative search-suggestions-container">
    <input
      type="text"
      placeholder="Rechercher une formation..."
      value={searchTerm}
      onChange={handleSearchInputChange}
      onFocus={handleSearchInputFocus}
    />
    
    <SearchSuggestions
      searchTerm={searchTerm}
      formations={formations}
      universes={universes}
      onSuggestionClick={handleSuggestionClick}
      onClose={() => setShowSearchSuggestions(false)}
      isVisible={showSearchSuggestions}
    />
  </div>
);
```

## Styles CSS requis

Le composant utilise Tailwind CSS. Assurez-vous que les classes suivantes sont disponibles :

- `absolute`, `top-full`, `left-0`, `right-0`
- `z-50`, `bg-white`, `border`, `border-gray-200`
- `rounded-lg`, `shadow-lg`, `mt-1`
- `max-h-80`, `overflow-y-auto`
- `p-2`, `px-3`, `py-2`
- `text-xs`, `text-sm`, `font-medium`
- `text-gray-500`, `text-gray-900`, `text-blue-600`
- `bg-blue-50`, `bg-gray-50`, `bg-yellow-200`
- `hover:bg-gray-50`, `transition-colors`
- `cursor-pointer`, `truncate`
- `flex`, `items-center`, `gap-3`
- `flex-1`, `min-w-0`, `flex-shrink-0`
