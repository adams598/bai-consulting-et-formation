# Guide d'intégration OAuth pour Google Calendar et Outlook

Ce guide vous explique comment configurer l'intégration OAuth pour Google Calendar et Outlook dans votre application BAI Consulting.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration Google Calendar](#configuration-google-calendar)
3. [Configuration Outlook/Microsoft](#configuration-outlookmicrosoft)
4. [Configuration du Backend](#configuration-du-backend)
5. [Migration de la base de données](#migration-de-la-base-de-données)
6. [Utilisation](#utilisation)
7. [Dépannage](#dépannage)

## Prérequis

- Compte Google Developer Console
- Compte Microsoft Azure
- Node.js et npm installés
- Backend BAI Consulting configuré

## Configuration Google Calendar

### 1. Créer un projet Google Cloud

1. Accédez à [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Calendar :
   - Allez dans "APIs & Services" > "Library"
   - Recherchez "Google Calendar API"
   - Cliquez sur "Enable"

### 2. Configurer OAuth 2.0

1. Allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "OAuth client ID"
3. Configurez l'écran de consentement OAuth si ce n'est pas déjà fait :
   - Type d'application : External
   - Nom de l'application : BAI Consulting
   - Email d'assistance : votre-email@example.com
   - Scopes : Ajoutez les scopes suivants :
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`

4. Créez l'identifiant OAuth :
   - Type d'application : Web application
   - Nom : BAI Consulting Calendar Integration
   - URIs de redirection autorisés :
     - `http://localhost:3001/learner/calendar` (développement)
     - `https://votre-domaine.com/learner/calendar` (production)

5. Notez votre **Client ID** et **Client Secret**

### 3. Variables d'environnement Google

Ajoutez à votre fichier `.env` du backend :

```env
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/learner/calendar
```

## Configuration Outlook/Microsoft

### 1. Créer une application Azure AD

1. Accédez à [Azure Portal](https://portal.azure.com/)
2. Allez dans "Azure Active Directory" > "App registrations"
3. Cliquez sur "New registration"
4. Configurez l'application :
   - Nom : BAI Consulting Calendar Integration
   - Types de comptes pris en charge : Comptes dans un annuaire organisationnel et comptes Microsoft personnels
   - URI de redirection : Web
     - `http://localhost:3001/learner/calendar` (développement)
     - `https://votre-domaine.com/learner/calendar` (production)

### 2. Configurer les permissions API

1. Dans votre application, allez dans "API permissions"
2. Ajoutez les permissions suivantes (Microsoft Graph) :
   - `Calendars.ReadWrite` (Delegated)
   - `User.Read` (Delegated)
   - `offline_access` (Delegated)
3. Accordez le consentement administrateur si nécessaire

### 3. Créer un secret client

1. Allez dans "Certificates & secrets"
2. Cliquez sur "New client secret"
3. Donnez-lui une description et une date d'expiration
4. Notez la **valeur** du secret (elle ne sera affichée qu'une fois)

### 4. Variables d'environnement Outlook

Ajoutez à votre fichier `.env` du backend :

```env
OUTLOOK_CLIENT_ID=votre-application-id
OUTLOOK_CLIENT_SECRET=votre-client-secret
OUTLOOK_REDIRECT_URI=http://localhost:3001/learner/calendar
```

## Configuration du Backend

### 1. Installer les dépendances

Si ce n'est pas déjà fait, installez axios :

```bash
cd backend
npm install axios
```

### 2. Fichier .env complet

Votre fichier `.env` doit contenir :

```env
# Configuration du serveur
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Base de données
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Google Calendar OAuth
GOOGLE_CLIENT_ID=votre-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/learner/calendar

# Outlook/Microsoft OAuth
OUTLOOK_CLIENT_ID=votre-outlook-client-id
OUTLOOK_CLIENT_SECRET=votre-outlook-client-secret
OUTLOOK_REDIRECT_URI=http://localhost:3001/learner/calendar
```

## Migration de la base de données

### 1. Générer la migration Prisma

```bash
cd backend
npx prisma migrate dev --name add_calendar_integration
```

Cette commande va :
- Créer la table `calendar_integrations`
- Ajouter les champs `externalId` et `externalSource` à la table `calendar_events`
- Mettre à jour le client Prisma

### 2. Vérifier la migration

```bash
npx prisma studio
```

Vérifiez que la table `calendar_integrations` a été créée avec les champs :
- id
- userId
- type
- isConnected
- syncEnabled
- accessToken
- refreshToken
- tokenExpiresAt
- email
- name
- lastSync
- createdAt
- updatedAt

## Utilisation

### 1. Flow de connexion Google Calendar

1. L'utilisateur clique sur "Connecter" pour Google Calendar
2. Il est redirigé vers la page d'authentification Google
3. Après autorisation, il est redirigé vers `/learner/calendar?integration=success&type=google`
4. Le token est stocké en base de données de manière sécurisée

### 2. Flow de connexion Outlook

1. L'utilisateur clique sur "Connecter" pour Outlook
2. Il est redirigé vers la page d'authentification Microsoft
3. Après autorisation, il est redirigé vers `/learner/calendar?integration=success&type=outlook`
4. Le token est stocké en base de données de manière sécurisée

### 3. Synchronisation

Une fois connecté, l'utilisateur peut :
- Cliquer sur le bouton de synchronisation pour importer les événements
- Les événements externes sont marqués avec `type: 'EXTERNAL'`
- Un champ `externalId` permet de suivre les événements synchronisés

### 4. Déconnexion

L'utilisateur peut déconnecter son calendrier :
- Les tokens sont supprimés de la base de données
- Les événements importés restent dans le calendrier local
- La synchronisation est désactivée

## Endpoints API

### Backend

- `GET /api/calendar/integrations` - Liste des intégrations
- `GET /api/calendar/oauth/google/init` - Initier OAuth Google
- `GET /api/calendar/oauth/google/callback` - Callback OAuth Google
- `GET /api/calendar/oauth/outlook/init` - Initier OAuth Outlook
- `GET /api/calendar/oauth/outlook/callback` - Callback OAuth Outlook
- `DELETE /api/calendar/integrations/:id` - Déconnecter une intégration
- `POST /api/calendar/sync/google` - Synchroniser Google Calendar
- `POST /api/calendar/sync/outlook` - Synchroniser Outlook

### Frontend

Les fonctions sont disponibles dans `frontend/src/api/calendarApi.ts` :

```typescript
// Récupérer les intégrations
const integrations = await calendarApi.getIntegrations();

// Initier la connexion Google
const googleAuth = await calendarApi.initiateGoogleOAuth();
window.location.href = googleAuth.authUrl;

// Initier la connexion Outlook
const outlookAuth = await calendarApi.initiateOutlookOAuth();
window.location.href = outlookAuth.authUrl;

// Synchroniser
await calendarApi.syncGoogleCalendar();
await calendarApi.syncOutlookCalendar();

// Déconnecter
await calendarApi.disconnectIntegration(integrationId);
```

## Dépannage

### Erreur "redirect_uri_mismatch"

**Cause** : L'URI de redirection ne correspond pas à celle configurée dans Google Cloud Console ou Azure.

**Solution** :
1. Vérifiez que l'URI dans votre `.env` correspond exactement à celle configurée
2. Assurez-vous qu'il n'y a pas de slash final dans l'URI
3. Vérifiez le protocole (http vs https)

### Erreur "invalid_grant"

**Cause** : Le code d'autorisation a expiré ou a déjà été utilisé.

**Solution** :
1. Recommencez le processus d'authentification
2. Vérifiez que l'horloge du serveur est synchronisée

### Token expiré

**Cause** : Les tokens OAuth ont une durée de vie limitée.

**Solution** : 
- Pour l'instant, l'utilisateur doit se reconnecter
- À implémenter : Rafraîchissement automatique des tokens avec `refresh_token`

### Impossible de synchroniser

**Cause** : Token invalide ou permissions insuffisantes.

**Solution** :
1. Déconnectez et reconnectez le calendrier
2. Vérifiez que tous les scopes sont accordés
3. Vérifiez les logs du serveur pour plus de détails

## Sécurité

### Bonnes pratiques

1. **Ne jamais exposer les secrets** :
   - Les tokens sont stockés uniquement en backend
   - Utilisez HTTPS en production
   - Ne loggez jamais les tokens

2. **Rotation des secrets** :
   - Changez régulièrement les client secrets
   - Implémentez la révocation de tokens

3. **Validation** :
   - Vérifiez l'état OAuth pour éviter les attaques CSRF
   - Validez les tokens avant chaque utilisation

## Prochaines étapes

### Fonctionnalités à implémenter

1. **Rafraîchissement automatique des tokens** :
   ```javascript
   async function refreshGoogleToken(integration) {
     const response = await axios.post('https://oauth2.googleapis.com/token', {
       client_id: process.env.GOOGLE_CLIENT_ID,
       client_secret: process.env.GOOGLE_CLIENT_SECRET,
       refresh_token: integration.refreshToken,
       grant_type: 'refresh_token'
     });
     // Mettre à jour l'accessToken en base
   }
   ```

2. **Synchronisation bidirectionnelle** :
   - Créer des événements dans Google/Outlook depuis l'application
   - Mettre à jour les événements synchronisés

3. **Webhooks** :
   - Écouter les changements en temps réel depuis Google/Outlook
   - Implémenter Google Calendar Push Notifications
   - Implémenter Microsoft Graph Webhooks

4. **Export iCal** :
   - Permettre l'export au format .ics
   - Générer un lien de calendrier partageable

## Support

Pour toute question ou problème :
1. Consultez les logs du serveur
2. Vérifiez la documentation officielle :
   - [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
   - [Microsoft Graph Calendar](https://docs.microsoft.com/en-us/graph/api/resources/calendar)
3. Contactez l'équipe de développement

---

**Dernière mise à jour** : Octobre 2025

