# Fonctionnalité d'édition de leçons dans LessonPlayer

## Vue d'ensemble

Une nouvelle fonctionnalité a été ajoutée au composant `LessonPlayer` permettant aux administrateurs de modifier directement les leçons depuis le lecteur de leçons.

## Fonctionnalités ajoutées

### 1. Bouton d'édition pour les admins
- **Localisation** : Header du LessonPlayer, à droite du titre de la formation
- **Visibilité** : Visible uniquement pour les utilisateurs avec le rôle `SUPER_ADMIN` ou `BANK_ADMIN`
- **Design** : Bouton bleu avec icône d'édition et texte "Modifier"
- **Condition** : Le bouton n'apparaît que si une leçon est sélectionnée

### 2. Intégration du LessonModal
- **Modal** : Utilise le composant `LessonModal` existant
- **Données** : Pré-remplit le modal avec toutes les informations de la leçon sélectionnée
- **Fonctionnalités** : Permet de modifier tous les aspects de la leçon (titre, description, fichier, image de couverture, durée, etc.)

### 3. Gestion des mises à jour
- **Callback** : Nouvelle prop `onLessonUpdate` dans `LessonPlayerProps`
- **Propagation** : Les modifications sont propagées vers les composants parents
- **Synchronisation** : Mise à jour automatique de la leçon sélectionnée et de la liste des leçons

## Modifications techniques

### LessonPlayer.tsx
```typescript
// Nouvelles imports
import { Edit } from 'lucide-react';
import LessonModal from './LessonModal';
import { authService } from '../../../services/authService';

// Nouvelle prop
interface LessonPlayerProps {
  // ... props existantes
  onLessonUpdate?: (updatedLesson: FormationContent) => void;
}

// Nouveaux états
const [showLessonModal, setShowLessonModal] = useState(false);

// Nouvelles fonctions
const isAdmin = () => {
  const currentUser = authService.getCurrentUser();
  return currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'BANK_ADMIN');
};

const handleSaveLesson = (lessonData: Partial<FormationContent>) => {
  // Logique de sauvegarde et propagation des changements
};
```

### Composants parents mis à jour
- **FormationDetailView.tsx** : Gestion des mises à jour dans la liste locale des leçons
- **AdminFormationsPage.tsx** : Synchronisation des modifications avec l'état local
- **LearnerFormationsPage.tsx** : Ajout de la prop (fonctionnalité désactivée pour les apprenants)

## Flux de fonctionnement

1. **Affichage** : L'utilisateur admin ouvre le LessonPlayer
2. **Sélection** : Une leçon est sélectionnée dans la sidebar
3. **Édition** : Clic sur le bouton "Modifier" dans le header
4. **Modal** : Le LessonModal s'ouvre avec les données de la leçon
5. **Modification** : L'admin modifie les informations de la leçon
6. **Sauvegarde** : Clic sur "Sauvegarder" dans le modal
7. **Propagation** : Les changements sont propagés vers le composant parent
8. **Mise à jour** : La leçon est mise à jour dans l'interface

## Sécurité

- **Vérification de rôle** : Seuls les `SUPER_ADMIN` et `BANK_ADMIN` peuvent voir le bouton d'édition
- **Validation** : Le bouton n'apparaît que si une leçon est sélectionnée
- **Isolation** : Les apprenants (`COLLABORATOR`) ne voient pas le bouton d'édition

## Avantages

1. **Workflow optimisé** : Modification directe depuis le lecteur de leçons
2. **Interface unifiée** : Réutilisation du LessonModal existant
3. **Sécurité** : Contrôle d'accès basé sur les rôles
4. **Flexibilité** : Fonctionnalité optionnelle via la prop `onLessonUpdate`
5. **Compatibilité** : Rétrocompatible avec les utilisations existantes

## Utilisation

```typescript
<LessonPlayer
  formation={formation}
  lessons={lessons}
  initialSelectedLesson={selectedLesson}
  onClose={() => setShowLessonPlayer(false)}
  onProgressUpdate={updateProgress}
  onLessonUpdate={(updatedLesson) => {
    // Gérer la mise à jour de la leçon
    setLessons(prevLessons => 
      prevLessons.map(lesson => 
        lesson.id === updatedLesson.id ? updatedLesson : lesson
      )
    );
  }}
/>
```






