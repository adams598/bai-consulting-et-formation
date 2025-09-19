# Guide du Layout Unifié - BAI Consulting

## Vue d'ensemble

Le système de layout unifié permet aux administrateurs et aux apprenants d'utiliser la même interface avec des fonctionnalités adaptées selon leur rôle. L'interface s'adapte automatiquement en fonction du rôle de l'utilisateur connecté.

## Architecture

### Composants principaux

1. **UnifiedLayout** - Layout principal qui s'adapte selon le rôle
2. **IntranetGuard** - Guard d'authentification avec gestion des rôles
3. **RoleBasedRouter** - Router qui gère les redirections selon les rôles
4. **Composants spécifiques aux apprenants** :
   - LearnerDashboardPage
   - LearnerFormationsPage
   - LearnerProgressPage
   - LearnerCertificatesPage

### Rôles supportés

- **SUPER_ADMIN** : Accès complet à toutes les fonctionnalités admin
- **BANK_ADMIN** : Accès aux fonctionnalités admin (sauf certaines restrictions)
- **COLLABORATOR** : Accès aux fonctionnalités apprenant uniquement

## Fonctionnalités par rôle

### Administrateurs (SUPER_ADMIN, BANK_ADMIN)

**Menu disponible :**
- Traitement des opportunités commerciales
- Formations (gestion complète)
- Collaborateurs (gestion des utilisateurs)
- Banques (gestion des banques)
- Tableau de bord
- Statistiques
- Paramètres

**Pages accessibles :**
- `/admin/dashboard` - Tableau de bord admin
- `/admin/formations` - Gestion des formations
- `/admin/users` - Gestion des utilisateurs
- `/admin/banks` - Gestion des banques
- `/admin/stats` - Statistiques
- `/admin/settings` - Paramètres
- `/admin/opportunities` - Opportunités commerciales

### Apprenants (COLLABORATOR)

**Menu disponible :**
- Tableau de bord
- Mes formations
- Ma progression
- Mes certificats

**Pages accessibles :**
- `/admin/dashboard` - Tableau de bord apprenant
- `/admin/formations` - Mes formations assignées
- `/admin/progress` - Suivi de progression
- `/admin/certificates` - Mes certificats

## Utilisation

### Connexion

Les utilisateurs se connectent via `/admin/login`. Après connexion, ils sont automatiquement redirigés vers le tableau de bord approprié selon leur rôle.

### Navigation

Le menu de navigation s'adapte automatiquement selon le rôle :
- Les administrateurs voient toutes les options de gestion
- Les apprenants voient uniquement leurs fonctionnalités

### Protection des routes

Toutes les routes sont protégées par le `IntranetGuard` qui :
1. Vérifie l'authentification
2. Vérifie les permissions selon le rôle
3. Redirige vers la page appropriée si nécessaire

## APIs Backend

### Routes apprenants unifiées

Toutes les APIs apprenants sont disponibles sous `/api/learner-unified/` :

**Dashboard :**
- `GET /dashboard/stats` - Statistiques du dashboard
- `GET /dashboard/activities` - Activités récentes
- `GET /dashboard/deadlines` - Échéances à venir

**Formations :**
- `GET /formations` - Formations assignées
- `GET /formations/:id/content` - Contenu d'une formation
- `POST /formations/start-lesson` - Démarrer une leçon
- `PUT /formations/update-progress` - Mettre à jour la progression

**Certificats :**
- `GET /certificates` - Certificats obtenus
- `GET /certificates/stats` - Statistiques des certificats
- `GET /certificates/:id/download` - Télécharger un certificat
- `GET /certificates/:number/verify` - Vérifier un certificat

## Personnalisation

### Ajouter de nouvelles fonctionnalités apprenants

1. Créer le composant dans `frontend/src/features/admin/components/`
2. Ajouter l'élément de menu dans `learnerMenuItems` du `UnifiedLayout`
3. Ajouter la route dans le `renderContent()` du `UnifiedLayout`
4. Créer l'API correspondante dans le backend

### Modifier les permissions

Les permissions sont gérées dans :
- `frontend/src/services/authService.ts` - Méthode `hasPermission()`
- `frontend/src/components/guards/UnifiedAuthGuard.tsx` - Vérification des rôles
- `frontend/src/components/routing/RoleBasedRouter.tsx` - Routes autorisées

## Sécurité

### Authentification

- Toutes les routes sont protégées par JWT
- Les tokens sont stockés dans localStorage
- Vérification automatique de l'expiration

### Autorisation

- Vérification du rôle à chaque accès
- Redirection automatique si permissions insuffisantes
- Protection côté frontend et backend

## Développement

### Structure des fichiers

```
frontend/src/
├── features/admin/components/
│   ├── UnifiedLayout.tsx
│   ├── LearnerDashboardPage.tsx
│   ├── LearnerFormationsPage.tsx
│   ├── LearnerProgressPage.tsx
│   └── LearnerCertificatesPage.tsx
├── components/
│   ├── guards/
│   │   └── UnifiedAuthGuard.tsx
│   └── routing/
│       └── RoleBasedRouter.tsx
└── api/
    └── learnerApi.ts

backend/src/
├── controllers/
│   ├── learner-dashboard.controller.js
│   ├── learner-formations.controller.js
│   └── learner-certificates.controller.js
└── routes/
    └── learner-unified.routes.js
```

### Tests

Pour tester le système :

1. **Connexion admin :** Utiliser un compte avec rôle `SUPER_ADMIN` ou `BANK_ADMIN`
2. **Connexion apprenant :** Utiliser un compte avec rôle `COLLABORATOR`
3. **Vérifier les menus :** Le menu doit s'adapter selon le rôle
4. **Tester les redirections :** Accéder à des routes non autorisées doit rediriger

## Maintenance

### Ajout de nouveaux rôles

1. Ajouter le rôle dans `backend/src/types/index.js`
2. Mettre à jour `authService.hasPermission()` dans le frontend
3. Ajouter les routes autorisées dans `RoleBasedRouter`
4. Créer les éléments de menu appropriés dans `UnifiedLayout`

### Mise à jour des permissions

Les permissions sont centralisées dans `authService.hasPermission()`. Modifier cette méthode pour ajuster les permissions selon les besoins.

## Support

Pour toute question ou problème avec le système unifié, consulter :
- Les logs de la console pour les erreurs d'authentification
- Les logs du backend pour les erreurs d'API
- La documentation des composants individuels
