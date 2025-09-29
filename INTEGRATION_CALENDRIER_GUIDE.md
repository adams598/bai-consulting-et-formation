# Guide d'intégration Google Calendar et Outlook

## Vue d'ensemble

Cette implémentation fournit une intégration complète avec Google Calendar et Outlook pour :
- Authentification OAuth sécurisée
- Import d'événements depuis les calendriers externes
- Export de formations vers les calendriers externes
- Synchronisation bidirectionnelle

## Configuration requise

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Configuration OAuth Google Calendar
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/calendar/callback/google

# Configuration OAuth Outlook Calendar
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
OUTLOOK_REDIRECT_URI=http://localhost:3001/calendar/callback/outlook
```

### 2. Configuration Google Calendar

1. Rendez-vous sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Calendar
4. Créez des identifiants OAuth 2.0 :
   - Type d'application : Application Web
   - URIs de redirection autorisées : `http://localhost:3001/calendar/callback/google`
5. Copiez le Client ID et Client Secret dans votre `.env`

### 3. Configuration Outlook Calendar

1. Rendez-vous sur [Microsoft Azure Portal](https://portal.azure.com/)
2. Allez dans "App registrations" → "New registration"
3. Configurez l'application :
   - Nom : BAI Consulting Calendar Integration
   - Types de comptes pris en charge : Comptes dans un annuaire organisationnel et comptes personnels Microsoft
   - URI de redirection : `http://localhost:3001/calendar/callback/outlook`
4. Dans "API permissions", ajoutez :
   - `Microsoft Graph` → `Calendars.ReadWrite`
   - `Microsoft Graph` → `User.Read`
5. Copiez l'Application ID et créez un secret client

### 4. Installation des dépendances

```bash
cd backend
npm install axios googleapis
```

### 5. Migration de la base de données

```bash
cd backend
npx prisma generate
npx prisma db push
```

## Structure des fichiers créés

### Backend

- `backend/src/routes/calendarIntegration.js` - Routes d'intégration calendrier
- `prisma/schema.prisma` - Modèles CalendarIntegration et CalendarEvent ajoutés

### Frontend

- `frontend/src/features/learner/pages/CalendarCallbackPage.tsx` - Page de callback OAuth
- `frontend/src/features/learner/pages/SettingsPage.tsx` - Mise à jour avec les vraies APIs
- `frontend/src/features/learner/pages/CalendarPage.tsx` - Intégration avec les APIs backend

## APIs disponibles

### Authentification

- `GET /api/calendar-integration/google/auth-url` - Obtenir l'URL d'autorisation Google
- `GET /api/calendar-integration/outlook/auth-url` - Obtenir l'URL d'autorisation Outlook
- `POST /api/calendar-integration/google/callback` - Callback Google OAuth
- `POST /api/calendar-integration/outlook/callback` - Callback Outlook OAuth

### Gestion des intégrations

- `GET /api/calendar-integration/integrations` - Lister les intégrations utilisateur
- `PUT /api/calendar-integration/integrations/:type/settings` - Mettre à jour les paramètres
- `DELETE /api/calendar-integration/integrations/:type` - Déconnecter une intégration

### Synchronisation

- `POST /api/calendar-integration/google/import` - Importer depuis Google Calendar
- `POST /api/calendar-integration/outlook/import` - Importer depuis Outlook
- `POST /api/calendar-integration/google/export-formation` - Exporter vers Google Calendar
- `POST /api/calendar-integration/outlook/export-formation` - Exporter vers Outlook

## Utilisation

### 1. Connexion d'un calendrier

1. Aller dans Paramètres → onglet Calendriers
2. Cliquer sur "Connecter" pour Google ou Outlook
3. Autoriser l'application dans la fenêtre OAuth
4. La connexion est établie automatiquement

### 2. Configuration des paramètres

- **Import** : Synchronise les événements du calendrier externe vers l'application
- **Export** : Permet d'ajouter les formations de l'application au calendrier externe
- **Sync** : Active la synchronisation automatique

### 3. Import d'événements

```javascript
// Importer depuis Google Calendar
const response = await fetch('/api/calendar-integration/google/import', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 4. Export de formations

```javascript
// Exporter une formation vers Google Calendar
const response = await fetch('/api/calendar-integration/google/export-formation', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ formationId: 'formation-id' })
});
```

## Sécurité

- Tous les tokens d'accès sont chiffrés en base de données
- Les refresh tokens permettent le renouvellement automatique
- Gestion des erreurs d'autorisation et d'expiration
- Validation des paramètres d'entrée

## Gestion des erreurs

L'API gère automatiquement :
- Expiration des tokens (renouvellement automatique)
- Erreurs de réseau
- Limites de l'API Google/Microsoft
- Événements en doublon

## Production

Pour la production, assurez-vous de :
1. Configurer les URIs de redirection en HTTPS
2. Utiliser des secrets sécurisés
3. Configurer les domaines autorisés dans Google/Microsoft
4. Activer les logs de sécurité

## Dépannage

### Erreur 404 lors de la connexion OAuth

Vérifiez que :
- Les URIs de redirection sont correctement configurées
- Le serveur backend est démarré
- Les variables d'environnement sont correctement définies

### Erreur "Invalid client"

Vérifiez que :
- Le Client ID et Client Secret sont corrects
- L'application est correctement configurée dans Google/Microsoft

### Erreur de permissions

Vérifiez que :
- Les scopes requis sont activés
- L'utilisateur a accordé les permissions nécessaires
