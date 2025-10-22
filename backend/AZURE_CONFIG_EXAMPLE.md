# Configuration Azure - Exemple

## Variables d'environnement à mettre dans backend/.env

```env
# Configuration OAuth Outlook Calendar
OUTLOOK_CLIENT_ID=12345678-1234-1234-1234-123456789abc
OUTLOOK_CLIENT_SECRET=VotreVraiSecretClient123456789
OUTLOOK_REDIRECT_URI=http://localhost:3001/calendar/callback/outlook

# Backend URL pour les appels internes
BACKEND_URL=http://localhost:3000
```

## Configuration Azure Portal

### 1. App Registration
- **Name**: BAI Consulting Calendar Integration
- **Supported account types**: ✅ "Accounts in any organizational directory and personal Microsoft accounts"
- **Redirect URI**: http://localhost:3001/calendar/callback/outlook

### 2. API Permissions (Microsoft Graph - Delegated)
- ✅ Calendars.ReadWrite
- ✅ User.Read
- ✅ Grant admin consent

### 3. Certificates & Secrets
- Créer un nouveau client secret
- Copier la VALUE (pas l'ID)

## Test de la configuration

Une fois configuré, redémarrez le serveur backend :
```bash
npm run dev
```

Puis testez le bouton Outlook dans l'agenda COLLABORATOR.







