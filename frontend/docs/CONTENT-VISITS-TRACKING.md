# Système de Suivi des Consultations de Contenu

## Vue d'ensemble

Ce système permet de tracker automatiquement toutes les consultations de contenu par les utilisateurs sur la plateforme, ainsi que leurs connexions. Il enregistre des métadonnées détaillées pour chaque visite et fournit des APIs pour analyser l'activité des utilisateurs.

## Fonctionnalités implémentées

### 1. Suivi automatique des consultations
- **Enregistrement automatique** de chaque visite de page/contenu
- **Détection intelligente** du type de contenu (formation, leçon, quiz, etc.)
- **Métadonnées enrichies** : durée, user agent, IP, référent
- **Performance optimisée** : enregistrement asynchrone pour ne pas ralentir l'interface

### 2. Suivi des connexions utilisateurs
- **Enregistrement automatique** de chaque connexion
- **Champ `lastLoginAt`** ajouté au modèle User
- **Compatibilité** avec les systèmes existants (`lastLogin`)

### 3. API de consultation des données
- **Consultations récentes** d'un utilisateur
- **Dernière consultation** d'un type de contenu spécifique
- **Statistiques détaillées** avec graphiques d'activité
- **Sécurité** : seuls les admins peuvent consulter les données d'autres utilisateurs

### 4. Interface utilisateur enrichie
- **Nouvel onglet "Consultations"** dans le modal de progression
- **Affichage détaillé** des consultations récentes
- **Informations contextuelles** : type de contenu, durée, formation associée
- **Actualisation en temps réel** des données

## Architecture technique

### Base de données

#### Modèle ContentVisit
```prisma
model ContentVisit {
  id          String   @id @default(cuid())
  userId      String
  contentType String   // 'formation', 'lesson', 'quiz', 'page', etc.
  contentId   String?  // ID du contenu spécifique
  contentTitle String? // Titre du contenu
  url         String?  // URL de la page visitée
  duration    Int?     // Durée de la visite en secondes
  visitedAt   DateTime @default(now())
  
  // Métadonnées
  userAgent   String?  // User agent du navigateur
  ipAddress   String?  // Adresse IP
  referrer    String?  // Page de référence
  
  // Relations
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId, visitedAt])
  @@index([contentType, contentId])
  @@index([visitedAt])
}
```

#### Modèle User (mis à jour)
```prisma
model User {
  // ... champs existants
  lastLoginAt DateTime? // Nouveau champ pour la dernière connexion
  contentVisits ContentVisit[] // Relation vers les consultations
}
```

### Backend

#### Middleware de suivi (`content-visit.middleware.js`)
- **Détection automatique** du type de contenu basée sur l'URL
- **Configuration flexible** : types de contenu, chemins exclus, métadonnées
- **Performance optimisée** : enregistrement asynchrone
- **Gestion d'erreurs** : continue même en cas d'échec

#### Contrôleur (`content-visits.controller.js`)
- **`getUserRecentVisits`** : Consultations récentes avec enrichissement des données
- **`getLastContentVisit`** : Dernière consultation d'un type spécifique
- **`getUserVisitStats`** : Statistiques complètes avec graphiques

#### Routes (`content-visits.routes.js`)
- **`GET /api/content-visits/user/:userId/recent`** : Consultations récentes
- **`GET /api/content-visits/user/:userId/last`** : Dernière consultation
- **`GET /api/content-visits/user/:userId/stats`** : Statistiques

### Frontend

#### API (`contentVisitsApi.ts`)
- **Interface TypeScript** pour toutes les APIs de consultation
- **Types définis** pour les données de consultation
- **Gestion d'erreurs** intégrée

#### Interface utilisateur (`UserProgressModal.tsx`)
- **Nouvel onglet "Consultations"** avec icône Eye
- **Affichage enrichi** des consultations avec badges de type
- **Informations contextuelles** : formation associée, durée, URL
- **Bouton d'actualisation** pour recharger les données

## Types de contenu trackés

### Types automatiquement détectés
- **`formation_detail`** : Pages de détail de formation
- **`lesson_detail`** : Pages de détail de leçon
- **`quiz_detail`** : Pages de détail de quiz
- **`formation_list`** : Liste des formations
- **`user_list`** : Liste des utilisateurs
- **`dashboard`** : Tableaux de bord
- **`learner_formations`** : Formations apprenant
- **`learner_progress`** : Progression apprenant
- **`learner_certificates`** : Certificats apprenant

### Métadonnées collectées
- **URL complète** de la page visitée
- **Durée de la visite** (en secondes)
- **User Agent** du navigateur
- **Adresse IP** de l'utilisateur
- **Page de référence** (referrer)
- **Horodatage précis** de la visite

## Sécurité et permissions

### Contrôle d'accès
- **Authentification requise** pour toutes les APIs
- **Autorisation admin** : seuls les `SUPER_ADMIN` et `BANK_ADMIN` peuvent consulter les données d'autres utilisateurs
- **Auto-consultation** : les utilisateurs peuvent consulter leurs propres données

### Données sensibles
- **IP anonymisée** : stockée mais non exposée dans l'interface
- **User Agent** : stocké pour analyse mais non exposé
- **URLs** : stockées pour contexte mais filtrées si nécessaire

## Utilisation

### Pour les administrateurs
1. **Accéder au suivi** : Admin > Collaborateurs > Bouton "Suivre"
2. **Onglet Consultations** : Voir l'activité récente de l'utilisateur
3. **Analyser l'engagement** : Durée des visites, types de contenu consultés
4. **Détecter les problèmes** : Utilisateurs inactifs, contenus peu consultés

### Pour les développeurs
```javascript
// Enregistrer manuellement une consultation
import { recordContentVisit } from './middleware/content-visit.middleware.js';

await recordContentVisit({
  userId: 'user123',
  contentType: 'formation_detail',
  contentId: 'formation456',
  contentTitle: 'Sécurité Bancaire',
  url: '/admin/formations/formation456',
  duration: 120
});

// Récupérer les consultations récentes
import { getUserRecentVisits } from './middleware/content-visit.middleware.js';

const visits = await getUserRecentVisits('user123', 10);
```

## Configuration

### Middleware (dans `index.js`)
```javascript
app.use(contentVisitMiddleware({
  trackDuration: true,      // Enregistrer la durée
  trackUserAgent: true,     // Enregistrer le user agent
  trackIpAddress: true,     // Enregistrer l'IP
  trackReferrer: true,     // Enregistrer le référent
  excludePaths: [           // Chemins exclus
    '/api/auth',
    '/api/admin/login',
    '/api/learner/login'
  ]
}));
```

### Types de contenu personnalisés
```javascript
const contentTypes = {
  '/admin/formations': 'formation_list',
  '/admin/users': 'user_list',
  '/custom-page': 'custom_content'
};
```

## Tests

Un script de test complet est disponible : `backend/test-content-visits-api.mjs`

```bash
cd backend
node test-content-visits-api.mjs
```

## Évolutions possibles

### Analytics avancées
1. **Graphiques d'activité** : Visualisation des consultations dans le temps
2. **Heatmaps** : Pages les plus consultées
3. **Funnel analysis** : Parcours utilisateur typiques
4. **Cohort analysis** : Comportement par groupes d'utilisateurs

### Notifications intelligentes
1. **Alertes d'inactivité** : Utilisateurs non connectés depuis X jours
2. **Suggestions de contenu** : Basées sur l'historique de consultation
3. **Rappels automatiques** : Formations non consultées

### Export et reporting
1. **Export CSV/Excel** : Données de consultation pour analyse externe
2. **Rapports automatisés** : Statistiques hebdomadaires/mensuelles
3. **Dashboard analytics** : Vue d'ensemble de l'activité de la plateforme

### Performance et optimisation
1. **Agrégation des données** : Tables de synthèse pour les requêtes fréquentes
2. **Archivage automatique** : Suppression des anciennes consultations
3. **Cache intelligent** : Mise en cache des statistiques fréquemment consultées
