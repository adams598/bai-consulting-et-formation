# Guide d'intégration calendrier (Google Calendar & Outlook)

## 📋 Vue d'ensemble

Ce guide explique comment configurer et utiliser l'intégration des calendriers externes (Google Calendar et Outlook) dans l'application BAI Consulting.

## 🔐 Configuration OAuth 2.0

### 1. Configuration Google Calendar

#### Étape 1 : Créer un projet Google Cloud

1. Allez à [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet (ex: "BAI Consulting Calendar")
3. Activez l'API Google Calendar:
   - Allez à "APIs & Services" > "Library"
   - Recherchez "Google Calendar API"
   - Cliquez sur "Enable"

#### Étape 2 : Créer les credentials OAuth 2.0

1. Allez à "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "OAuth client ID"
3. Sélectionnez "Web application"
4. Nommez-le "BAI Consulting Frontend"
5. Ajoutez les URIs autorisés :
   - **Development**: `http://localhost:3001`
   - **Production**: `https://votre-domaine.com`
6. Cliquez sur "Create"
7. Copiez votre **Client ID** et **Client Secret**

#### Étape 3 : Configurer les variables d'environnement

Dans `backend/.env`:
```env
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/learner/calendar
```

---

### 2. Configuration Outlook/Microsoft Graph

#### Étape 1 : Enregistrer l'application

1. Allez à [Azure Portal](https://portal.azure.com/)
2. Allez à "Azure Active Directory" > "App registrations"
3. Cliquez sur "New registration"
4. Nom: "BAI Consulting Calendar"
5. Sélectionnez "Accounts in any organizational directory and personal Microsoft accounts"
6. Cliquez sur "Register"

#### Étape 2 : Configurer les permissions

1. Allez à "API permissions"
2. Cliquez sur "Add a permission"
3. Sélectionnez "Microsoft Graph"
4. Sélectionnez "Delegated permissions"
5. Ajoutez les permissions:
   - `Calendars.ReadWrite` - Lire et écrire les calendriers
   - `User.Read` - Lire le profil utilisateur

#### Étape 3 : Créer un secret

1. Allez à "Certificates & secrets"
2. Cliquez sur "New client secret"
3. Copiez la **Value** (pas l'ID)

#### Étape 4 : Configurer les redirect URIs

1. Allez à "Authentication"
2. Sous "Redirect URIs", cliquez sur "Add a URI"
3. Ajoutez:
   - `http://localhost:3001/learner/calendar` (développement)
   - `https://votre-domaine.com/learner/calendar` (production)

#### Étape 5 : Configurer les variables d'environnement

Dans `backend/.env`:
```env
OUTLOOK_CLIENT_ID=votre-outlook-client-id
OUTLOOK_CLIENT_SECRET=votre-outlook-client-secret
OUTLOOK_REDIRECT_URI=http://localhost:3001/learner/calendar
```

---

## 🛠️ Architecture de l'intégration

### Backend (Express.js)

**Routes disponibles:**

```
GET  /api/calendar/oauth/google/auth-url      - Obtenir l'URL d'autorisation Google
GET  /api/calendar/oauth/outlook/auth-url     - Obtenir l'URL d'autorisation Outlook
POST /api/calendar/google/callback            - Callback OAuth Google
POST /api/calendar/outlook/callback           - Callback OAuth Outlook
GET  /api/calendar/integrations               - Lister les intégrations
GET  /api/calendar/integrations/:type         - Obtenir une intégration spécifique
DELETE /api/calendar/integrations/:id         - Déconnecter une intégration
POST /api/calendar/sync/google                - Synchroniser Google Calendar
POST /api/calendar/sync/outlook               - Synchroniser Outlook
POST /api/calendar/import/google              - Importer les événements Google
POST /api/calendar/import/outlook             - Importer les événements Outlook
```

### Frontend (React)

**Composants principaux:**

1. **CalendarPage** (`frontend/src/features/learner/pages/CalendarPage.tsx`)
   - Page principale de gestion du calendrier
   - Affiche les intégrations disponibles
   - Permet de connecter/déconnecter les calendriers

2. **OutlookIntegration** (`frontend/src/components/OutlookIntegration.tsx`)
   - Composant pour gérer l'intégration Outlook
   - Affiche le statut de connexion
   - Permet l'import/export des événements

3. **GoogleIntegration** (`frontend/src/components/GoogleIntegration.tsx`)
   - Composant pour gérer l'intégration Google
   - Affiche le statut de connexion
   - Permet l'import/export des événements

**Services:**

```typescript
// CalendarService - services/calendarService.ts
- getIntegrations()                      // Récupérer toutes les intégrations
- getGoogleAuthUrl()                     // URL d'auth Google
- getOutlookAuthUrl()                    // URL d'auth Outlook
- googleCallback(code: string)           // Traiter callback Google
- outlookCallback(code: string)          // Traiter callback Outlook
- disconnectIntegration(type: string)    // Déconnecter une intégration
- syncGoogleCalendar()                   // Synchroniser Google
- syncOutlookCalendar()                  // Synchroniser Outlook
- importFromGoogle()                     // Importer les événements Google
- importFromOutlook()                    // Importer les événements Outlook
```

---

## 📱 Flux d'authentification

### Flux OAuth 2.0 (Authorization Code Flow)

```
1. Utilisateur clique sur "Connecter Google/Outlook"
   ↓
2. Frontend appelle getAuthUrl() du backend
   ↓
3. Backend génère une URL OAuth et la retourne
   ↓
4. Frontend ouvre une popup avec cette URL
   ↓
5. Utilisateur se connecte chez Google/Outlook
   ↓
6. Google/Outlook redirige vers le callback avec un code
   ↓
7. Frontend récupère le code et l'envoie au backend
   ↓
8. Backend échange le code contre les tokens
   ↓
9. Backend sauvegarde les tokens en BDD
   ↓
10. Frontend affiche "Connecté avec succès"
```

---

## 🔄 Synchronisation des événements

### Processus de synchronisation

1. **Synchronisation bidirectionnelle:**
   - Les événements de formation créés dans l'app sont synchronisés vers Google/Outlook
   - Les événements créés dans Google/Outlook sont importés dans l'app

2. **Gestion des conflits:**
   - Les événements sont identifiés par `externalId` en BDD
   - Si un événement n'existe pas localement, il est créé
   - Si un événement existe déjà, il est mis à jour

3. **Récurrence:**
   - Les événements récurrents sont gérés avec les règles iCalendar (RFC 5545)
   - La propriété `recurrenceRule` contient la règle RRULE

---

## 💾 Modèle de données

### CalendarIntegration
```prisma
model CalendarIntegration {
  id             String    @id @default(cuid())
  userId         String
  type           String    // "GOOGLE" ou "OUTLOOK"
  isConnected    Boolean   @default(false)
  syncEnabled    Boolean   @default(true)
  importEnabled  Boolean   @default(false)
  exportEnabled  Boolean   @default(false)
  accessToken    String?
  refreshToken   String?
  tokenExpiresAt DateTime?
  email          String?
  name           String?
  lastSync       DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([userId, type])
}
```

### CalendarEvent
```prisma
model CalendarEvent {
  id              String   @id @default(cuid())
  userId          String
  title           String
  description     String?
  startDate       DateTime
  endDate         DateTime
  type            String   @default("PERSONAL")
  location        String?
  attendees       String?
  isAllDay        Boolean  @default(false)
  color           String?
  status          String   @default("CONFIRMED")
  reminders       String?
  formationId     String?
  lessonId        String?
  eventType       String?
  isRecurring     Boolean  @default(false)
  recurrenceRule  String?
  externalId      String?
  externalSource  String?  // "GOOGLE" ou "OUTLOOK"
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, externalId])
  @@index([userId, startDate])
}
```

---

## 🔒 Sécurité

### Bonnes pratiques appliquées

1. **Token Management:**
   - Les tokens d'accès sont stockés cryptés en BDD
   - Les tokens de refresh sont utilisés pour obtenir de nouveaux tokens
   - Les tokens expirent et sont automatiquement rafraîchis

2. **Authentification:**
   - Toutes les routes calendrier nécessitent l'authentification (`authMiddleware`)
   - L'utilisateur ne peut accéder qu'à ses propres données

3. **Scopes OAuth:**
   - Les scopes sont limités à ce qui est nécessaire
   - Google: `calendar`, `calendar.events`, `userinfo.email`, `userinfo.profile`
   - Outlook: `Calendars.ReadWrite`, `User.Read`

4. **Validation des données:**
   - Validation Joi sur tous les endpoints
   - Sanitisation des inputs
   - Vérification des permissions

---

## 🐛 Troubleshooting

### Problème: "Impossible d'ouvrir la fenêtre d'authentification"

**Solution:**
- Vérifiez que les popups ne sont pas bloqués dans le navigateur
- Ajoutez `localhost:3001` à la liste blanche des popups

### Problème: "Invalid redirect_uri"

**Solution:**
- Vérifiez que l'URI correspond exactement dans Google Cloud Console / Azure Portal
- Attention à `http://` vs `https://`
- Les URI doivent être enregistrées sans paramètres de query

### Problème: "Invalid scope"

**Solution:**
- Vérifiez les scopes dans le fichier `.env`
- Google: `https://www.googleapis.com/auth/calendar`
- Outlook: `https://graph.microsoft.com/calendars.readwrite`

### Problème: "Token expired"

**Solution:**
- L'app devrait automatiquement rafraîchir les tokens
- Vérifiez que le refresh token est présent en BDD
- Vérifiez les logs du backend pour les erreurs de refresh

---

## 📚 Ressources supplémentaires

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Microsoft Graph Calendar API](https://docs.microsoft.com/en-us/graph/api/resources/calendar)
- [OAuth 2.0 Authorization Code Flow](https://tools.ietf.org/html/rfc6749#section-4.1)
- [RFC 5545 - iCalendar](https://tools.ietf.org/html/rfc5545)

---

## ✅ Checklist de mise en production

- [ ] Credentials Google Cloud créés et configurés
- [ ] Credentials Azure/Outlook créés et configurés
- [ ] Variables d'environnement configurées sur le serveur
- [ ] URLs de redirection configurées pour le domaine production
- [ ] Tests de synchronisation effectués
- [ ] Gestion des erreurs et logs en place
- [ ] HTTPS activé en production
- [ ] Permissions CORS correctement configurées
- [ ] Plan de rotation des tokens en place
- [ ] Documentation utilisateur créée

