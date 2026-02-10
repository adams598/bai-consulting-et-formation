# 🏗️ Architecture de l'intégration calendrier

## Vue d'ensemble du système

```
┌─────────────────────────────────────────────────────────────┐
│                        UTILISATEUR                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼────────┐   ┌────────▼──────────┐
        │  FRONTEND      │   │   GOOGLE/OUTLOOK  │
        │  React         │   │   OAuth Servers   │
        └───────┬────────┘   └────────┬──────────┘
                │                     │
                └──────────┬──────────┘
                           │ HTTPS
        ┌──────────────────▼──────────────────┐
        │         API REST (Express)          │
        │                                      │
        │  ├─ /api/calendar/oauth/*           │
        │  ├─ /api/calendar/integrations      │
        │  ├─ /api/calendar/events            │
        │  └─ /api/calendar/sync/*            │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐    ┌──────▼──────┐
   │ Prisma  │      │  Services │    │   Cache     │
   │          │      │  Calendar │    │   Redis     │
   │ Database │      │            │    │             │
   │PostgreSQL│      │ (sync...)  │    └─────────────┘
   └──────────┘      └─────┬─────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼────────┐   ┌────────▼──────────┐
        │  Google        │   │   Microsoft Graph │
        │  Calendar API  │   │   (Outlook)       │
        └────────────────┘   └───────────────────┘
```

---

## 📦 Structure des fichiers

### Frontend (`frontend/src/`)

```
frontend/
├── components/
│   ├── GoogleIntegration.tsx          # Composant intégration Google
│   ├── OutlookIntegration.tsx         # Composant intégration Outlook
│   └── ConfirmDisconnectModal.tsx     # Modal de confirmation
│
├── services/
│   └── calendarService.ts            # Service API calendrier
│
├── hooks/
│   └── useCalendarIntegration.ts      # Hook personnalisé
│
└── features/learner/pages/
    └── CalendarIntegrationPage.tsx    # Page principale
```

### Backend (`backend/src/`)

```
backend/
├── routes/
│   └── calendarIntegration.js         # Routes OAuth et sync
│
├── controllers/
│   └── calendar-integration.controller.js  # Logique métier
│
├── middleware/
│   ├── auth.middleware.js             # Authentification JWT
│   └── errorHandler.js                # Gestion erreurs
│
├── services/
│   ├── googleCalendarService.js       # Intégration Google API
│   └── outlookCalendarService.js      # Intégration Microsoft Graph
│
└── models/
    └── schema.prisma                  # CalendarIntegration + CalendarEvent
```

---

## 🔄 Flux de données

### Authentification OAuth

```
1. FRONTEND - Utilisateur clique "Connecter"
   │
   ├─► getGoogleAuthUrl()
   │   └─► GET /api/calendar/oauth/google/auth-url
   │
2. BACKEND - Route /oauth/google/auth-url
   │
   ├─► Crée URL OAuth2 avec scopes
   │   ├─ https://www.googleapis.com/auth/calendar
   │   ├─ https://www.googleapis.com/auth/calendar.events
   │   └─ https://www.googleapis.com/auth/userinfo.email
   │
   ├─► Retourne authUrl au frontend
   │
3. FRONTEND - Ouvre popup
   │
   ├─► window.open(authUrl)
   │
4. GOOGLE - Affiche écran de connexion
   │
   ├─► Utilisateur se connecte
   ├─► Accepte les permissions
   │
5. GOOGLE - Redirige vers callback
   │
   ├─► Appelle: FRONTEND_URL/learner/calendar?code=AUTH_CODE&state=USER_ID
   │
6. FRONTEND - Récupère code et l'envoie au backend
   │
   ├─► POST /api/calendar/google/callback { code }
   │
7. BACKEND - Échange code contre tokens
   │
   ├─► POST https://oauth2.googleapis.com/token
   │   └─ code, client_id, client_secret
   │
   ├─► Reçoit access_token + refresh_token
   │
   ├─► Sauvegarde en BDD (CalendarIntegration)
   │   ├─ accessToken
   │   ├─ refreshToken
   │   ├─ tokenExpiresAt
   │   ├─ email
   │   └─ isConnected = true
   │
   └─► Retourne succès au frontend
   
8. FRONTEND - Affiche "Connecté"
```

### Synchronisation des événements

```
┌─────────────────────────────────────────┐
│  FRONTEND - Utilisateur clique Sync     │
└──────────────┬──────────────────────────┘
               │
               └─► POST /api/calendar/sync/google
                   
               BACKEND
               ├─► 1. Récupère CalendarIntegration
               │      (accessToken, refreshToken)
               │
               ├─► 2. Si token expiré, rafraîchit
               │      PUT https://oauth2.googleapis.com/token
               │      └─ refresh_token
               │
               ├─► 3. Appelle Google Calendar API
               │      GET https://www.googleapis.com/calendar/v3/calendars/primary/events
               │      ├─ accessToken pour auth
               │      ├─ timeMin, timeMax pour plage de dates
               │      └─ optionalParams: maxResults, etc
               │
               ├─► 4. Pour chaque événement Google
               │      ├─ Vérifie si existe en BDD (externalId)
               │      │
               │      ├─ Si n'existe pas
               │      │  └─ Crée CalendarEvent avec:
               │      │     ├─ title, description
               │      │     ├─ startDate, endDate
               │      │     ├─ externalId (event.id)
               │      │     ├─ externalSource = "GOOGLE"
               │      │     └─ attendees (JSON array)
               │      │
               │      └─ Si existe
               │         └─ Met à jour les propriétés
               │
               ├─► 5. Sauvegarde lastSync dans CalendarIntegration
               │
               └─► 6. Retourne { imported: X, synced: Y }

               FRONTEND
               └─► Affiche "X événements synchronisés"
```

### Import des événements

```
FRONTEND - POST /api/calendar/import/google
│
BACKEND - ImportService
├─► 1. Récupère tous les calendriers de l'utilisateur
│      GET /calendars?minAccessRole=reader
│
├─► 2. Pour chaque calendrier
│      GET /calendars/{calendarId}/events
│      │
│      └─► Pour chaque événement
│          ├─ Crée CalendarEvent (si n'existe pas)
│          ├─ Sauvegarde synchronisation
│          └─ Notifie utilisateur si formation
│
├─► 3. Met à jour lastSync
│
└─► 4. Retourne { imported: total }
```

---

## 🔐 Gestion des tokens

### Stockage sécurisé

```
CalendarIntegration
├─ accessToken     → Stocké en BDD (PostgreSQL)
│                    Utilisé pour les requêtes API
│                    Expire généralement en 1 heure
│
├─ refreshToken    → Stocké en BDD
│                    Utilisé pour obtenir un nouveau accessToken
│                    N'expire pas (sauf révocation)
│
└─ tokenExpiresAt  → DateTime pour savoir si rafraîchissement nécessaire
                    Comparé à new Date()
```

### Rafraîchissement automatique

```
À chaque requête API avec Google/Outlook:

1. Vérifier if (tokenExpiresAt <= now())
   │
   ├─ OUI → Token expiré
   │  │
   │  └─ POST oauth2/token
   │     ├─ grant_type: "refresh_token"
   │     ├─ refresh_token
   │     └─ client_id, client_secret
   │
   │  Reçoit nouveau accessToken
   │  │
   │  └─ Sauvegarde nouveau accessToken + expiration
   │
   └─ NON → Token valide
      │
      └─ Utilise accessToken actuel
```

---

## 📊 Modèles de données

### CalendarIntegration

```prisma
model CalendarIntegration {
  id             String    @id @default(cuid())          // Identifiant unique
  userId         String                                   // Lien vers User
  type           String    // "GOOGLE" ou "OUTLOOK"
  isConnected    Boolean   @default(false)                // Connecté?
  syncEnabled    Boolean   @default(true)                 // Sync activée?
  importEnabled  Boolean   @default(false)                // Import activé?
  exportEnabled  Boolean   @default(false)                // Export activé?
  
  // Tokens OAuth
  accessToken    String?                                  // Pour appels API
  refreshToken   String?                                  // Pour renouvellement
  tokenExpiresAt DateTime?                               // Expiration token
  
  // Infos utilisateur
  email          String?                                  // Email du compte
  name           String?                                  // Nom affichage
  
  // Métadonnées
  lastSync       DateTime?                               // Dernière synchro
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  // Relations
  user           User      @relation(fields: [userId], references: [id])
  
  @@unique([userId, type])  // Un utilisateur = une intégration par type
}
```

### CalendarEvent

```prisma
model CalendarEvent {
  id              String   @id @default(cuid())
  userId          String                                  // Propriétaire
  title           String                                  // Titre
  description     String?                                 // Description
  startDate       DateTime                               // Début
  endDate         DateTime                               // Fin
  
  // Type d'événement
  type            String   @default("PERSONAL")
  location        String?                                 // Lieu
  attendees       String?  // JSON: ["email1@test.com", "email2@test.com"]
  isAllDay        Boolean  @default(false)               // Journée complète?
  color           String?                                // Couleur hex
  status          String   @default("CONFIRMED")         // CONFIRMED, CANCELLED, PENDING
  
  // Rappels
  reminders       String?  // JSON: [15, 60] (minutes avant)
  
  // Lien à formation
  formationId     String?                                 // Lien formation
  lessonId        String?                                 // Lien lesson
  eventType       String?  // "formation", "lesson", "quiz"
  
  // Récurrence
  isRecurring     Boolean  @default(false)
  recurrenceRule  String?  // RFC 5545: RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
  
  // Intégration externe
  externalId      String?  // ID chez Google/Outlook
  externalSource  String?  // "GOOGLE" ou "OUTLOOK"
  
  // Métadonnées
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  user            User     @relation(fields: [userId], references: [id])
  formation       Formation? @relation(fields: [formationId], references: [id])
  
  @@unique([userId, externalId])         // Empêche doublons
  @@index([userId, startDate])           // Recherche par date
}
```

---

## 🔌 Intégrations externes

### Google Calendar API

**Endpoints utilisés:**

```
GET  /auth/oauth2/v2/userinfo
     → Récupérer infos utilisateur

GET  /calendar/v3/calendars/primary
     → Récupérer infos calendrier principal

GET  /calendar/v3/calendars/primary/events
     → Lister les événements
     Params: timeMin, timeMax, maxResults, pageToken

POST /calendar/v3/calendars/primary/events
     → Créer un événement

PUT  /calendar/v3/calendars/primary/events/{eventId}
     → Mettre à jour un événement

DELETE /calendar/v3/calendars/primary/events/{eventId}
     → Supprimer un événement
```

### Microsoft Graph API

**Endpoints utilisés:**

```
GET  /me
     → Récupérer infos utilisateur

GET  /me/calendars
     → Lister les calendriers

GET  /me/calendars/inbox/events
     → Lister les événements

POST /me/events
     → Créer un événement

PATCH /me/events/{eventId}
     → Mettre à jour un événement

DELETE /me/events/{eventId}
     → Supprimer un événement
```

---

## ⚙️ Configuration et variables d'environnement

### Backend

```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
GOOGLE_REDIRECT_URI=http://localhost:3001/learner/calendar

# Microsoft OAuth 2.0
OUTLOOK_CLIENT_ID=xxxx
OUTLOOK_CLIENT_SECRET=xxxx
OUTLOOK_REDIRECT_URI=http://localhost:3001/learner/calendar

# Frontend
FRONTEND_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# JWT pour authentification
JWT_SECRET=secret-key
JWT_REFRESH_SECRET=refresh-key
```

---

## 🧪 Tests et débogage

### Vérifier les logs

```bash
# Backend
NODE_ENV=development npm run dev

# Chercher:
# ✓ "Intégration Google créée avec succès"
# ✗ "Erreur lors du rafraîchissement du token"
# ✗ "Code ou userId manquant"
```

### Tester avec cURL

```bash
# Obtenir URL auth Google
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:3000/api/calendar/oauth/google/auth-url

# Récupérer intégrations
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:3000/api/calendar/integrations
```

### Inspecter la BDD

```bash
# Ouvrir Prisma Studio
cd backend && npx prisma studio

# Ou avec SQL direct
SELECT * FROM calendar_integrations WHERE user_id = 'USER_ID';
SELECT * FROM calendar_events WHERE user_id = 'USER_ID';
```

---

## 📈 Performance et optimisations

### Caching

```typescript
// Cache les intégrations de l'utilisateur pendant 5 minutes
const getIntegrations = cachedFn(
  async (userId: string) => prisma.calendarIntegration.findMany({
    where: { userId }
  }),
  { ttl: 5 * 60 * 1000, key: `integrations:${userId}` }
);
```

### Pagination

```typescript
// Limiter les événements importés pour éviter timeout
GET /calendar/v3/calendars/primary/events?maxResults=50&pageToken=...
```

### Rate limiting

```javascript
// Respecter les quotas API
// Google Calendar: 50 req/sec
// Microsoft Graph: 2000 req/min
```

---

## 🚀 Déploiement en production

### Checklist

- [ ] Credentials Google et Outlook configurés
- [ ] Variables d'environnement sécurisées (utiliser secrets manager)
- [ ] URLs de redirection HTTPS
- [ ] Certificats SSL/TLS en place
- [ ] CORS configuré pour domaine production
- [ ] Logs activés et surveillés
- [ ] Backup régulier de la BDD
- [ ] Plan de rotation des tokens

### Recommandations

```
1. Utiliser un secrets manager (AWS Secrets Manager, HashiCorp Vault)
2. Chiffrer les tokens en base de données
3. Implémenter rate limiting strict
4. Monitorer les erreurs OAuth
5. Mettre à jour les tokens de façon sécurisée
6. Implémenter un circuit breaker pour les API externes
```

