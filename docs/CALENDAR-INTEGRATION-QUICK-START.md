# 📘 Guide de mise en pratique - Intégration Calendrier

## 🚀 Démarrage rapide (15 min)

### Étape 1: Configuration minimale locale

1. **Clonez le repo et installez les dépendances:**
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

2. **Créez un fichier `.env` dans `backend/`:**
   ```env
   # Copie minimale pour développement local
   PORT=3000
   NODE_ENV=development
   
   # Google Calendar (à récupérer depuis Google Cloud Console)
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
   GOOGLE_REDIRECT_URI=http://localhost:3001/learner/calendar
   
   # Outlook/Microsoft Graph (à récupérer depuis Azure Portal)
   OUTLOOK_CLIENT_ID=YOUR_OUTLOOK_CLIENT_ID
   OUTLOOK_CLIENT_SECRET=YOUR_OUTLOOK_CLIENT_SECRET
   OUTLOOK_REDIRECT_URI=http://localhost:3001/learner/calendar
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3001
   
   # Database (si vous utilisez PostgreSQL)
   DATABASE_URL="postgresql://user:password@localhost:5432/bai_db"
   ```

---

## 🔑 Configurer Google Calendar

### 1. Créer un projet Google Cloud

```
1. Allez à https://console.cloud.google.com/
2. Si c'est la première fois, acceptez les conditions
3. Cliquez sur le sélecteur de projet (haut à gauche)
4. Cliquez sur "NEW PROJECT"
5. Donnez un nom: "BAI Consulting" → Créez
```

### 2. Activer Google Calendar API

```
1. Dans Google Cloud Console, allez à "APIs & Services"
2. Cliquez sur "ENABLE APIS AND SERVICES"
3. Recherchez "Google Calendar API"
4. Cliquez sur celle-ci et cliquez "ENABLE"
5. Attendez quelques secondes que l'API soit activée
```

### 3. Créer les credentials OAuth

```
1. Allez à "APIs & Services" > "Credentials"
2. Cliquez sur "CREATE CREDENTIALS" > "OAuth client ID"
3. Si vous voyez une alerte "You need to configure the OAuth consent screen first"
   → Cliquez sur "CONFIGURE CONSENT SCREEN"
   
   3a. Configurez le consentement OAuth:
       - Type d'utilisateur: "External"
       - Remplissez les infos requises (nom app, email support, etc)
       - Cliquez "SAVE AND CONTINUE"
       - Ignorez les scopes pour l'instant
       - Cliquez "SAVE AND CONTINUE" jusqu'à la fin
   
4. Retournez à "Credentials" > "CREATE CREDENTIALS" > "OAuth client ID"
5. Sélectionnez "Web application"
6. Donnez un nom: "BAI Frontend"
7. Sous "Authorized redirect URIs", cliquez "ADD URI"
   - Ajoutez: http://localhost:3001/learner/calendar
8. Cliquez "CREATE"
9. Une fenêtre "OAuth client created" s'affiche:
   - Copiez le **CLIENT ID** et le **CLIENT SECRET**
   - Gardez cette fenêtre ouverte ou téléchargez le JSON
```

### 4. Ajouter les credentials dans le backend

```bash
# Dans backend/.env, mettez à jour:
GOOGLE_CLIENT_ID=votre-client-id-copié
GOOGLE_CLIENT_SECRET=votre-secret-copié
GOOGLE_REDIRECT_URI=http://localhost:3001/learner/calendar
```

---

## 🔑 Configurer Outlook/Microsoft Graph

### 1. Accéder à Azure Portal

```
1. Allez à https://portal.azure.com/
2. Si nécessaire, connectez-vous avec un compte Microsoft personnel ou professionnel
3. Allez à "Azure Active Directory" (cherchez dans la barre de recherche)
```

### 2. Enregistrer une nouvelle application

```
1. Dans "Azure Active Directory", allez à "App registrations"
2. Cliquez sur "New registration"
3. Nom: "BAI Consulting Calendar"
4. Sélectionnez "Accounts in any organizational directory and personal Microsoft accounts"
5. Cliquez "Register"
6. Vous êtes maintenant dans la page de l'application
```

### 3. Configurer les permissions

```
1. Dans le menu gauche, allez à "API permissions"
2. Cliquez "Add a permission"
3. Sélectionnez "Microsoft Graph"
4. Sélectionnez "Delegated permissions"
5. Recherchez et sélectionnez:
   - Calendars.ReadWrite (lire et modifier les calendriers)
   - User.Read (lire le profil utilisateur)
6. Cliquez "Add permissions"
```

### 4. Créer un client secret

```
1. Dans le menu gauche, allez à "Certificates & secrets"
2. Cliquez sur "New client secret"
3. Description: "Backend Access"
4. Expiration: "6 months" ou "24 months"
5. Cliquez "Add"
6. IMPORTANT: Copiez la VALUE (pas l'ID) avant de quitter cette page
   - C'est votre seule chance de la copier!
```

### 5. Configurer les redirect URIs

```
1. Dans le menu gauche, allez à "Authentication"
2. Sous "Redirect URIs", cliquez "Add a URI"
3. Ajoutez: http://localhost:3001/learner/calendar
4. Cochez "Authorize implicit grant flows"
5. Cliquez "Save"
```

### 6. Récupérer le Client ID

```
1. Dans la page Overview de l'application
2. Copiez le "Application (client) ID"
```

### 7. Ajouter les credentials dans le backend

```bash
# Dans backend/.env, mettez à jour:
OUTLOOK_CLIENT_ID=votre-application-id
OUTLOOK_CLIENT_SECRET=votre-secret-value
OUTLOOK_REDIRECT_URI=http://localhost:3001/learner/calendar
```

---

## 🧪 Tester localement

### 1. Démarrez les serveurs

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Devrait afficher: Server running on port 3000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Devrait afficher: Local: http://localhost:3001
```

### 2. Testez la connexion

```
1. Ouvrez http://localhost:3001
2. Allez à la page Calendrier (selon votre navigation)
3. Cliquez sur "Se connecter avec Google"
4. Une popup s'ouvre pour vous connecter
5. Acceptez les permissions
6. La popup devrait se fermer et afficher "Connecté"
```

### 3. Testez Outlook

```
1. Sur la même page calendrier
2. Cliquez sur "Se connecter avec Outlook"
3. Une popup s'ouvre
4. Connectez-vous avec un compte Microsoft
5. Acceptez les permissions
6. La popup se ferme et affiche "Connecté"
```

---

## 🔄 Synchronisation

### Test de synchronisation Google

```bash
# Via l'UI:
1. Si connecté à Google, cliquez "Synchroniser"
2. Vous devriez voir un message de succès
3. Vérifiez que les événements apparaissent

# Via API (curl):
curl -X POST http://localhost:3000/api/calendar/sync/google \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test d'import Outlook

```bash
# Via l'UI:
1. Si connecté à Outlook, cliquez "Importer"
2. Les événements d'Outlook s'ajoutent à votre calendrier local

# Via API:
curl -X POST http://localhost:3000/api/calendar/import/outlook \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Résolution des problèmes

### ❌ Erreur: "Invalid redirect_uri"

**Cause:** L'URI dans Google Cloud Console / Azure Portal ne correspond pas exactement

**Solution:**
```
1. Vérifiez que http://localhost:3001/learner/calendar
   est exactement enregistré (pas de trailing slash, pas de paramètres)
2. Le protocole (http vs https) doit correspondre
3. Le port doit être correct (3001 pour frontend)
4. Attendez quelques minutes que le changement soit appliqué
```

### ❌ Erreur: "Impossible d'ouvrir la fenêtre d'authentification"

**Cause:** Les popups sont bloquées ou le blocage des popups est trop strict

**Solution:**
```
1. Vérifiez les paramètres des popups du navigateur
2. Ajoutez localhost:3001 à la liste blanche
3. Essayez avec Ctrl+Click pour maintenir la fenêtre
4. Essayez avec un autre navigateur (Chrome, Firefox, etc)
```

### ❌ Erreur: "CORS error"

**Cause:** Les origins CORS ne sont pas configurés correctement

**Solution:**
```
1. Vérifiez que CORS_ORIGIN dans backend/.env inclut:
   http://localhost:3001
2. Redémarrez le serveur backend
3. Videz le cache du navigateur (Ctrl+Shift+Delete)
```

### ❌ Erreur: "Token has expired"

**Cause:** Le token d'accès a expiré

**Solution:**
```
1. C'est normal - l'app devrait rafraîchir automatiquement
2. Vérifiez que refreshToken est stocké en BDD
3. Essayez de vous reconnecter
4. Vérifiez les logs du backend pour des erreurs de refresh
```

---

## 📚 Commandes utiles

### Logs du backend
```bash
# Pour voir les détails des erreurs OAuth
tail -f backend/logs/app.log

# Ou si vous avez npm logs actif
# Les logs s'affichent directement dans le terminal
```

### Vérifier la configuration
```bash
# Vérifier que les variables d'env sont chargées
cd backend
node -e "console.log(process.env.GOOGLE_CLIENT_ID)"
```

### Tester un endpoint API
```bash
# Obtenir l'URL Google Auth (sans JWT)
curl http://localhost:3000/api/calendar/oauth/google/auth-url

# Vérifier les intégrations (nécessite JWT)
curl -X GET http://localhost:3000/api/calendar/integrations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ✅ Checklist de configuration

- [ ] Google Cloud project créé
- [ ] Google Calendar API activée
- [ ] Google OAuth credentials créées
- [ ] GOOGLE_CLIENT_ID dans backend/.env
- [ ] GOOGLE_CLIENT_SECRET dans backend/.env
- [ ] Azure AD app enregistrée
- [ ] Permissions Microsoft Graph configurées
- [ ] Secret client Outlook créé et copié
- [ ] OUTLOOK_CLIENT_ID dans backend/.env
- [ ] OUTLOOK_CLIENT_SECRET dans backend/.env
- [ ] backend démarré (npm run dev)
- [ ] frontend démarré (npm run dev)
- [ ] Google Calendar test effectué
- [ ] Outlook Calendar test effectué
- [ ] Synchronisation testée

---

## 📞 Support et ressources

- **Documentation complète:** Voir [CALENDAR-INTEGRATION-SETUP.md](./CALENDAR-INTEGRATION-SETUP.md)
- **Google Calendar API:** https://developers.google.com/calendar/api
- **Microsoft Graph API:** https://docs.microsoft.com/en-us/graph/api/
- **OAuth 2.0:** https://tools.ietf.org/html/rfc6749

