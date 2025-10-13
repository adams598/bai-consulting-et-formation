# Exemple d'utilisation SearchSuggestions

## Comportement attendu

### 1. Au focus de la barre de recherche (sans saisie)
- ✅ Affiche toutes les formations et univers par ordre alphabétique
- ✅ Limite à 10 suggestions
- ✅ Format : `[Univers]/[Formation]` pour les formations
- ✅ Format : `Univers: [Nom]` pour les univers
- ✅ Message : "X formations et univers disponibles"
- ✅ Indication : "Tapez pour filtrer"

### 2. Pendant la saisie
- ✅ Filtre les suggestions selon le terme
- ✅ Met en évidence les termes correspondants
- ✅ Trie par score de pertinence
- ✅ Message : "X suggestions trouvées"

### 3. Navigation clavier
- ✅ Flèches ↑↓ : Navigation
- ✅ Entrée : Sélection
- ✅ Échap : Fermeture

## Test manuel

1. **Ouvrir une page avec SearchSuggestions**
   - AdminFormationsPage ou LearnerFormationsPage

2. **Tester le focus**
   - Cliquer dans la barre de recherche
   - Vérifier l'affichage des suggestions par ordre alphabétique

3. **Tester la saisie**
   - Taper quelques lettres
   - Vérifier le filtrage et la mise en évidence

4. **Tester la navigation**
   - Utiliser les flèches du clavier
   - Appuyer sur Entrée pour sélectionner
   - Appuyer sur Échap pour fermer

## Données de test

```javascript
// Formations de test
const formations = [
  { id: '1', title: 'Formation A', universeId: 'univ-1' },
  { id: '2', title: 'Formation B', universeId: 'univ-2' },
  { id: '3', title: 'Formation C', universeId: 'univ-1' }
];

// Univers de test
const universes = [
  { id: 'univ-1', name: 'Univers Alpha' },
  { id: 'univ-2', name: 'Univers Beta' }
];
```

## Résultat attendu au focus

1. Formation A (Univers Alpha/Formation A)
2. Formation B (Univers Beta/Formation B)
3. Formation C (Univers Alpha/Formation C)
4. Univers Alpha (Univers: Univers Alpha)
5. Univers Beta (Univers: Univers Beta)

## Résultat attendu avec "Formation"

1. Formation A (Univers Alpha/Formation A) - Score 100
2. Formation B (Univers Beta/Formation B) - Score 100
3. Formation C (Univers Alpha/Formation C) - Score 100



