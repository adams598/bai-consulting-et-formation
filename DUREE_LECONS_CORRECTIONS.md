# Corrections pour la gestion des durées de leçons

## Problème identifié
Les durées des leçons étaient mal interprétées car le système mélangeait les formats HH:MM et MM:SS, et stockait parfois en minutes au lieu de secondes.

## Modifications effectuées

### 1. Schéma Prisma (`prisma/schema.prisma`)
```prisma
duration Int? // en secondes (corrigé depuis "en minutes")
```
- **Changement** : Documentation mise à jour pour clarifier que la durée est en secondes

### 2. Composant de saisie de durée (`frontend/src/features/admin/components/LessonDuration.tsx`)
- **Ancien format** : HH:MM (heures:minutes) avec input type="time"
- **Nouveau format** : MM:SS (minutes:secondes) avec deux inputs séparés
- **Avantages** :
  - Plus intuitif pour les vidéos courtes (< 1 heure)
  - Validation automatique (max 59 secondes)
  - Format clair pour l'utilisateur

### 3. Fonction de conversion (`frontend/src/features/admin/components/LessonModal.tsx`)
```javascript
const convertTimeToSeconds = (timeString: string): number => {
  if (!timeString || typeof timeString !== 'string') return 0;
  const parts = timeString.split(':').map(Number);
  
  if (parts.length === 3) {
    // Format HH:MM:SS
    const [hours, minutes, seconds] = parts;
    return (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
  } else if (parts.length === 2) {
    // Format MM:SS (minutes:secondes)
    const [minutes, seconds] = parts;
    return (minutes || 0) * 60 + (seconds || 0);
  }
  return 0;
};
```
- **Support des formats** :
  - MM:SS → minutes:secondes (format principal)
  - HH:MM:SS → heures:minutes:secondes (pour vidéos longues)

### 4. Affichage des durées (`frontend/src/features/admin/components/LessonPlayer.tsx`)
```javascript
const formatDuration = (seconds: number) => {
  if (!seconds || seconds === 0) return 'N/A';
  
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  }
};
```
- Affichage adaptatif selon la durée

### 5. Script de vérification (`backend/scripts/fix-lesson-durations.mjs`)
- Permet de vérifier les durées stockées en BDD
- Affiche l'interprétation en minutes et secondes

## Usage

### Créer une nouvelle leçon
1. Dans le champ "Durée estimée (MM:SS)", entrer :
   - Minutes (jusqu'à 999)
   - Secondes (jusqu'à 59)
   - Exemple : 02:30 pour 2 minutes 30 secondes

### Vérifier les durées en BDD
```bash
cd backend
node scripts/fix-lesson-durations.mjs
```

## Important
- **Format de stockage** : Toujours en secondes (entier)
- **Format de saisie** : MM:SS (minutes:secondes)
- **Format d'affichage** : Adaptatif (22m, 1h, 45s)

## Migration des données existantes
Si vos leçons ont été créées avec l'ancien système et affichent des durées incorrectes :
1. Vérifier la durée réelle de la vidéo
2. Éditer la leçon et entrer la durée correcte au format MM:SS
3. Sauvegarder

Ou utiliser un script SQL si beaucoup de leçons sont concernées.







