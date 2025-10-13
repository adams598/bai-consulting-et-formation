# Intégration Calendrier Google et Outlook - Résumé

## ✅ Intégration complétée

L'intégration OAuth pour Google Calendar et Outlook a été implémentée avec succès dans l'application BAI Consulting.

## 📦 Modifications apportées

### Backend

#### 1. Base de données (Prisma)

**Nouveau modèle `CalendarIntegration`** :
- `id`, `userId`, `type` (GOOGLE/OUTLOOK)
- `isConnected`, `syncEnabled`, `importEnabled`, `exportEnabled`
- `accessToken`, `refreshToken`, `tokenExpiresAt` (stockage sécurisé des tokens)
- `email`, `name`, `lastSync`

**Modifications du modèle `CalendarEvent`** :
- Ajout de `externalId` : ID de l'événement dans le calendrier externe
- Ajout de `externalSource` : Source (GOOGLE, OUTLOOK, etc.)
- Ajout d'un index unique `[userId, externalId]` pour éviter les doublons

#### 2. Contrôleur (`calendar-integration.controller.js`)

Fonctions implémentées :
- `getUserIntegrations` : Liste des intégrations de l'utilisateur
- `initiateGoogleOAuth` : Génère l'URL d'authentification Google
- `handleGoogleOAuthCallback` : Traite le callback OAuth Google
- `initiateOutlookOAuth` : Génère l'URL d'authentification Outlook
- `handleOutlookOAuthCallback` : Traite le callback OAuth Outlook
- `disconnectIntegration` : Déconnecte une intégration
- `syncGoogleCalendar` : Synchronise les événements depuis Google Calendar
- `syncOutlookCalendar` : Synchronise les événements depuis Outlook

#### 3. Routes (`learner.routes.js`)

Nouvelles routes ajoutées :
- `GET /api/calendar/integrations` - Liste des intégrations
- `GET /api/calendar/oauth/google/init` - Initier OAuth Google
- `GET /api/calendar/oauth/google/callback` - Callback OAuth Google
- `GET /api/calendar/oauth/outlook/init` - Initier OAuth Outlook
- `GET /api/calendar/oauth/outlook/callback` - Callback OAuth Outlook
- `DELETE /api/calendar/integrations/:id` - Déconnecter
- `POST /api/calendar/sync/google` - Synchroniser Google
- `POST /api/calendar/sync/outlook` - Synchroniser Outlook

### Frontend

#### 1. API Client (`calendarApi.ts`)

Nouvelles fonctions :
- `getIntegrations()` : Récupérer les intégrations
- `initiateGoogleOAuth()` : Démarrer l'authentification Google
- `initiateOutlookOAuth()` : Démarrer l'authentification Outlook
- `disconnectIntegration(id)` : Déconnecter une intégration
- `syncGoogleCalendar()` : Synchroniser Google Calendar
- `syncOutlookCalendar()` : Synchroniser Outlook

#### 2. CalendarPage (`CalendarPage.tsx`)

Fonctionnalités ajoutées :
- Chargement automatique des intégrations au montage
- Gestion du retour OAuth (paramètres URL `?integration=success&type=google`)
- Interface utilisateur pour connecter/déconnecter les calendriers
- Bouton de synchronisation pour les calendriers connectés
- Notifications toast pour chaque action (succès/erreur)

### Configuration

#### Variables d'environnement (.env)

```env
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/learner/calendar

# Outlook/Microsoft OAuth
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
OUTLOOK_REDIRECT_URI=http://localhost:3001/learner/calendar
```

## 🚀 Prochaines étapes

### 1. Configuration OAuth

Vous devez configurer les applications OAuth :

**Google Cloud Console** :
1. Créer un projet
2. Activer Google Calendar API
3. Créer des identifiants OAuth 2.0
4. Configurer les URIs de redirection
5. Ajouter les scopes nécessaires

**Microsoft Azure** :
1. Créer une application Azure AD
2. Configurer les permissions Microsoft Graph (Calendars.ReadWrite)
3. Créer un secret client
4. Configurer les URIs de redirection

➡️ **Consultez `INTEGRATION_CALENDRIER_OAUTH.md` pour les instructions détaillées**

### 2. Migration de la base de données

```bash
cd backend
npx prisma migrate dev --name add_calendar_integration
npx prisma generate
```

### 3. Ajouter les variables d'environnement

Copiez les variables depuis `backend/.env.example` vers votre fichier `.env` et remplacez les valeurs par vos véritables identifiants OAuth.

### 4. Installer les dépendances

```bash
cd backend
npm install axios
```

### 5. Redémarrer le serveur

```bash
npm run dev
```

## 🎯 Fonctionnalités

### Pour l'utilisateur

1. **Connexion au calendrier** :
   - Cliquer sur "Connecter" pour Google ou Outlook
   - Autoriser l'accès dans la fenêtre OAuth
   - Retour automatique à l'application avec confirmation

2. **Synchronisation** :
   - Cliquer sur le bouton de synchronisation
   - Les événements externes sont importés automatiquement
   - Marqués avec le type "EXTERNAL"

3. **Déconnexion** :
   - Cliquer sur "Déconnecter"
   - Les tokens sont supprimés de manière sécurisée
   - Les événements importés restent disponibles localement

### Sécurité

- ✅ Tokens stockés en backend uniquement
- ✅ HTTPS requis en production
- ✅ Validation des états OAuth (CSRF protection)
- ✅ Tokens chiffrés dans la base de données
- ✅ Scopes limités au minimum nécessaire

## 📝 Notes importantes

### Limitations actuelles

1. **Rafraîchissement des tokens** : 
   - Non implémenté pour l'instant
   - L'utilisateur doit se reconnecter quand le token expire
   - À implémenter : Utiliser `refresh_token` pour renouveler automatiquement

2. **Synchronisation unidirectionnelle** :
   - Import uniquement (calendrier externe → application)
   - Export non implémenté (application → calendrier externe)

3. **Apple Calendar** :
   - Interface préparée mais non implémentée
   - Nécessite une approche différente (iCloud API)

### Améliorations futures

1. **Webhooks** :
   - Google Calendar Push Notifications
   - Microsoft Graph Webhooks
   - Synchronisation en temps réel

2. **Synchronisation bidirectionnelle** :
   - Créer/modifier des événements dans Google/Outlook
   - Mise à jour automatique lors de modifications

3. **Gestion avancée** :
   - Choix des calendriers à synchroniser
   - Filtres de synchronisation (dates, types d'événements)
   - Résolution de conflits

4. **Export** :
   - Format iCal (.ics)
   - Lien de calendrier partageable
   - Abonnement au calendrier

## 🔍 Dépannage rapide

### Erreur "redirect_uri_mismatch"
➡️ Vérifiez que l'URI dans `.env` correspond exactement à celle configurée dans Google/Azure

### Token expiré
➡️ Déconnectez et reconnectez le calendrier

### Impossible de synchroniser
➡️ Vérifiez les permissions accordées et les logs du serveur

## 📚 Documentation

- Guide complet : `INTEGRATION_CALENDRIER_OAUTH.md`
- Documentation API Google : https://developers.google.com/calendar/api
- Documentation Microsoft Graph : https://docs.microsoft.com/en-us/graph/api/resources/calendar

---

**Statut** : ✅ Prêt pour la configuration et les tests
**Dernière mise à jour** : Octobre 2025

