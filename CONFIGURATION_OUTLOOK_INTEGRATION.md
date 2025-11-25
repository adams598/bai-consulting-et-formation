# Configuration de l'intégration Outlook Calendar

## Vue d'ensemble

Cette implémentation fournit une intégration complète avec Outlook Calendar pour :
- Authentification OAuth2 sécurisée avec Microsoft Graph
- Import d'événements depuis Outlook vers l'application
- Export de formations vers Outlook Calendar
- Synchronisation bidirectionnelle en temps réel
- Interface utilisateur intuitive pour la configuration

## Configuration requise

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` du backend :

```env
# Configuration OAuth Outlook Calendar
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
OUTLOOK_REDIRECT_URI=http://localhost:3001/calendar/callback/outlook

# Backend URL pour les appels internes
BACKEND_URL=http://localhost:3000
```

### 2. Configuration Microsoft Azure

1. **Rendez-vous sur [Microsoft Azure Portal](https://portal.azure.com/)**

2. **Créez une nouvelle inscription d'application :**
   - Allez dans "App registrations" → "New registration"
   - Nom : `BAI Consulting Calendar Integration`
   - Types de comptes pris en charge : `Comptes dans un annuaire organisationnel et comptes personnels Microsoft`
   - URI de redirection : `http://localhost:3001/calendar/callback/outlook`

3. **Configurez les permissions API :**
   - Allez dans "API permissions" → "Add a permission"
   - Sélectionnez "Microsoft Graph"
   - Ajoutez ces permissions :
     - `Calendars.ReadWrite` - Lire et écrire dans les calendriers
     - `User.Read` - Lire le profil utilisateur
   - Accordez le consentement administrateur si nécessaire

4. **Générez un secret client :**
   - Allez dans "Certificates & secrets" → "New client secret"
   - Copiez la valeur du secret (vous ne pourrez plus la voir après)

5. **Copiez l'Application (client) ID** depuis la page "Overview"

### 3. Configuration pour la production

Pour la production, assurez-vous de :
1. Modifier l'URI de redirection vers votre domaine HTTPS
2. Configurer les domaines autorisés dans Azure
3. Utiliser des secrets sécurisés
4. Activer les logs de sécurité

## Fonctionnalités disponibles

### 🔐 Authentification OAuth2
- Connexion sécurisée via Microsoft Graph
- Gestion automatique des tokens d'accès et de rafraîchissement
- Chiffrement des données sensibles en base

### 📅 Synchronisation bidirectionnelle
- **Import** : Les événements Outlook apparaissent dans l'agenda de l'application
- **Export** : Les formations planifiées sont automatiquement ajoutées à Outlook
- **Sync automatique** : Les modifications sont synchronisées en temps réel

### 🎯 Fonctionnalités utilisateur
- Interface de configuration intuitive
- Paramètres de synchronisation granulaires
- Statut de connexion en temps réel
- Import manuel des événements
- Gestion des permissions par type de calendrier

## Structure des fichiers créés

### Backend
- `backend/src/routes/calendarIntegration.js` - Routes d'intégration calendrier
- `backend/src/controllers/calendar.controller.js` - Contrôleur de gestion du calendrier
- `backend/prisma/schema.prisma` - Modèles CalendarIntegration et CalendarEvent mis à jour

### Frontend
- `frontend/src/services/calendarService.ts` - Service API pour le calendrier
- `frontend/src/components/OutlookIntegration.tsx` - Composant de configuration Outlook
- `frontend/src/components/CalendarWidget.tsx` - Widget calendrier avec intégration
- `frontend/src/pages/CalendarCallbackPage.tsx` - Page de callback OAuth
- `frontend/src/pages/CalendarSettingsPage.tsx` - Page de paramètres calendrier

## APIs disponibles

### Authentification
- `GET /api/calendar/outlook/auth-url` - Obtenir l'URL d'autorisation Outlook
- `POST /api/calendar/outlook/callback` - Callback Outlook OAuth

### Gestion des intégrations
- `GET /api/calendar/integrations` - Lister les intégrations utilisateur
- `PUT /api/calendar/integrations/outlook/settings` - Mettre à jour les paramètres
- `DELETE /api/calendar/integrations/outlook` - Déconnecter l'intégration

### Synchronisation
- `POST /api/calendar/outlook/import` - Importer depuis Outlook
- `POST /api/calendar/outlook/export-formation` - Exporter vers Outlook

### Gestion des événements
- `GET /api/calendar/events` - Obtenir les événements
- `POST /api/calendar/events` - Créer un événement
- `PUT /api/calendar/events/:id` - Mettre à jour un événement
- `DELETE /api/calendar/events/:id` - Supprimer un événement

## Utilisation

### 1. Connexion d'un calendrier Outlook

1. Aller dans l'espace apprenant → Mon agenda
2. Cliquer sur "Paramètres calendrier"
3. Cliquer sur "Se connecter à Outlook"
4. Autoriser l'application dans la fenêtre OAuth
5. La connexion est établie automatiquement

### 2. Configuration des paramètres

- **Import** : Synchronise les événements Outlook vers l'application
- **Export** : Permet d'ajouter les formations vers Outlook
- **Sync** : Active la synchronisation automatique

### 3. Import d'événements

```javascript
// Importer depuis Outlook
const response = await fetch('/api/calendar/outlook/import', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 4. Export de formations

```javascript
// Exporter une formation vers Outlook
const response = await fetch('/api/calendar/outlook/export-formation', {
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
- Protection CSRF intégrée

## Gestion des erreurs

L'API gère automatiquement :
- Expiration des tokens (renouvellement automatique)
- Erreurs de réseau
- Limites de l'API Microsoft Graph
- Événements en doublon
- Conflits de synchronisation

## Dépannage

### Erreur 404 lors de la connexion OAuth
Vérifiez que :
- Les URIs de redirection sont correctement configurées dans Azure
- Le serveur backend est démarré
- Les variables d'environnement sont correctement définies

### Erreur "Invalid client"
Vérifiez que :
- Le Client ID et Client Secret sont corrects
- L'application est correctement configurée dans Azure
- Les permissions API sont accordées

### Erreur de permissions
Vérifiez que :
- Les scopes requis sont activés dans Azure
- L'utilisateur a accordé les permissions nécessaires
- Le consentement administrateur est accordé si nécessaire

## Tests

### Tester la connexion OAuth
1. Accédez à `/admin/calendar-settings`
2. Cliquez sur "Se connecter à Outlook"
3. Vérifiez que la fenêtre OAuth s'ouvre
4. Complétez l'autorisation
5. Vérifiez que la connexion est établie

### Tester l'import d'événements
1. Avec un calendrier connecté, cliquez sur "Importer les événements"
2. Vérifiez que les événements Outlook apparaissent dans l'agenda

### Tester l'export de formations
1. Planifiez une formation dans l'application
2. Vérifiez qu'elle apparaît dans votre calendrier Outlook

## Support

Pour toute question ou problème :
1. Vérifiez les logs du serveur backend
2. Consultez la console du navigateur pour les erreurs frontend
3. Vérifiez la configuration Azure
4. Testez avec un compte Microsoft personnel d'abord




















