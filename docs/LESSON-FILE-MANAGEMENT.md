# 📚 Gestion des Fichiers de Leçons - BAI Consulting

## 🎯 Vue d'ensemble

Ce document explique comment la plateforme BAI Consulting gère l'affichage et le téléchargement des fichiers de leçons.

## 🔧 Architecture Technique

### Backend

#### Route API de téléchargement
```
GET /api/admin/lesson-file/:formationTitle/:lessonTitle/:filename
```

**Paramètres :**
- `formationTitle` : Titre de la formation (sanitizé)
- `lessonTitle` : Titre de la leçon (sanitizé)  
- `filename` : Nom du fichier à télécharger

**Fonctionnalités :**
- Vérification de l'existence du fichier
- Détermination automatique du type MIME
- En-têtes appropriés pour le téléchargement
- Gestion des erreurs 404/500

#### Structure des dossiers
```
uploads/
├── formations/
│   ├── {formation-title}/
│   │   ├── couverture-{timestamp}.jpg
│   │   └── lessons/
│   │       └── {lesson-title}/
│   │           ├── couverture-{timestamp}.jpg
│   │           └── {filename}
```

### Frontend

#### Composant LessonFileViewer
Le composant `LessonFileViewer` gère l'affichage et l'interaction avec les fichiers de leçons.

**Fonctionnalités :**
- Affichage des informations du fichier
- Boutons de téléchargement et d'ouverture
- Gestion des erreurs et cas limites
- Support des URLs externes

#### Utilitaire getLessonFileUrl
```typescript
export const getLessonFileUrl = (
  formationTitle: string,
  lessonTitle: string,
  filename: string
): string
```

**Exemple d'utilisation :**
```typescript
const downloadUrl = getLessonFileUrl(
  "Introduction à la Finance",
  "Bases de la Finance",
  "presentation.pptx"
);
// Résultat : http://localhost:3000/api/admin/lesson-file/introduction_a_la_finance/bases_de_la_finance/presentation.pptx
```

## 📋 Structure des Métadonnées

Chaque leçon stocke ses informations de fichier dans le champ `metadata` au format JSON :

```json
{
  "contentUrl": "https://example.com/external-content",
  "attachedFile": "presentation.pptx",
  "contentType": "file"
}
```

**Champs :**
- `contentUrl` : URL externe (optionnelle)
- `attachedFile` : Nom du fichier attaché (optionnel)
- `contentType` : Type de contenu ("file" ou "url")

## 🚀 Utilisation

### 1. Affichage dans FormationDetailView

Le composant `LessonFileViewer` est automatiquement intégré dans l'affichage des leçons :

```tsx
<LessonFileViewer
  lesson={lesson}
  formationTitle={formation.title}
/>
```

### 2. Téléchargement manuel

```typescript
import { getLessonFileUrl } from '../utils/imageUtils';

const handleDownload = () => {
  const downloadUrl = getLessonFileUrl(
    formationTitle,
    lessonTitle,
    filename
  );
  
  // Créer un lien temporaire pour le téléchargement
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.click();
};
```

## 🔒 Sécurité

### Sanitization des titres
Les titres de formation et de leçon sont automatiquement sanitizés :
- Remplacement des caractères spéciaux par des underscores
- Conversion en minuscules
- Suppression des caractères non autorisés

### Authentification
La route de téléchargement nécessite :
- Token JWT valide
- Rôle administrateur approprié

## 🐛 Gestion des Erreurs

### Cas d'erreur courants

1. **Fichier non trouvé (404)**
   - Vérifier que le fichier existe dans le bon dossier
   - Vérifier la correspondance des titres sanitizés

2. **Erreur d'authentification (401/403)**
   - Vérifier la validité du token JWT
   - Vérifier les permissions utilisateur

3. **Erreur serveur (500)**
   - Vérifier les logs du serveur
   - Vérifier les permissions sur les dossiers

### Debug
Les logs du serveur incluent :
- Chemin du fichier recherché
- Vérification de l'existence
- Informations de téléchargement

## 📱 Interface Utilisateur

### États d'affichage

1. **Avec fichier attaché**
   - Affichage du nom du fichier
   - Boutons de téléchargement et d'ouverture
   - Informations sur le type de contenu

2. **Sans fichier attaché**
   - Message d'information
   - Lien vers l'URL externe si disponible
   - Suggestion de contacter l'administrateur

3. **En cours de téléchargement**
   - Indicateur de chargement
   - Bouton désactivé

### Responsive Design
Le composant s'adapte automatiquement aux différentes tailles d'écran avec Tailwind CSS.

## 🔄 Évolutions Futures

### Fonctionnalités prévues
- [ ] Prévisualisation des fichiers (PDF, images)
- [ ] Lecteur vidéo intégré
- [ ] Gestion des versions de fichiers
- [ ] Historique des téléchargements
- [ ] Notifications de nouveaux fichiers

### Améliorations techniques
- [ ] Cache des fichiers fréquemment téléchargés
- [ ] Compression automatique des gros fichiers
- [ ] Support des formats de fichier supplémentaires
- [ ] Intégration avec un CDN

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs du serveur
2. Consulter la documentation des erreurs
3. Contacter l'équipe de développement

---

**Version :** 1.0.0  
**Dernière mise à jour :** Décembre 2024  
**Auteur :** Équipe BAI Consulting
