# 📅 Intégration Calendrier Google & Outlook

## 📖 Documentation complète

Bienvenue! Cette documentation couvre l'intégration complète des calendriers externes (Google Calendar et Outlook) dans l'application BAI Consulting.

### 📚 Guides disponibles

| Guide | Description | Public |
|-------|-------------|--------|
| [⚡ Quick Start](./CALENDAR-INTEGRATION-QUICK-START.md) | Configuration rapide en 15 minutes | Développeurs |
| [🔧 Setup Complet](./CALENDAR-INTEGRATION-SETUP.md) | Documentation détaillée de la configuration | Tous |
| [🏗️ Architecture](./CALENDAR-ARCHITECTURE.md) | Architecture système et flux de données | Développeurs |
| [🧪 Testing](./CALENDAR-TESTING.md) | Tests unitaires et d'intégration | QA/Développeurs |

---

## 🚀 Démarrage rapide (5 min)

### Pour les impatients

```bash
# 1. Backend: Ajouter les variables d'env
# Dans backend/.env, ajoutez:
GOOGLE_CLIENT_ID=votre-id
GOOGLE_CLIENT_SECRET=votre-secret
OUTLOOK_CLIENT_ID=votre-outlook-id
OUTLOOK_CLIENT_SECRET=votre-outlook-secret

# 2. Démarrer les serveurs
cd backend && npm run dev
cd frontend && npm run dev

# 3. Ouvrir le navigateur
# http://localhost:3001/learner/calendar
```

---

## 💡 Cas d'usage

### Pour l'utilisateur final

- ✅ **Synchroniser formations** : Les formations créées dans l'app apparaissent automatiquement dans Google/Outlook
- ✅ **Importer événements** : Les événements du calendrier externe s'ajoutent à votre calendrier local
- ✅ **Gestion simplifiée** : Centraliser tous les événements en un seul endroit
- ✅ **Rappels** : Recevoir des notifications pour les formations à venir

### Pour l'administrateur

- ✅ **Suivi des participations** : Voir qui a synchronisé son calendrier
- ✅ **Intégration seamless** : Sans serveur calendrier dédié
- ✅ **Sécurité** : Tokens OAuth 2.0, aucune exposition de credentials
- ✅ **Scalabilité** : Gère des centaines de synchronisations

---

## 🔑 Fonctionnalités

### Authentification
- ✨ OAuth 2.0 pour Google et Outlook
- 🔐 Tokens stockés de façon sécurisée
- 🔄 Rafraîchissement automatique des tokens

### Synchronisation
- 📤 Export automatique des formations vers Google/Outlook
- 📥 Import des événements externes
- 🔄 Synchronisation bidirectionnelle
- ⏰ Scheduling automatique

### Gestion
- 🖇️ Récurrence des événements (RFC 5545)
- 👥 Gestion des attendees
- 🎨 Couleurs personnalisées
- 🔔 Rappels configurables

---

## 🏗️ Architecture

### Composants principaux

```
Frontend (React)
├── GoogleIntegration.tsx    → UI Google Calendar
├── OutlookIntegration.tsx   → UI Outlook
└── CalendarIntegrationPage  → Page principale

Services
├── calendarService.ts       → API calls
└── useCalendarIntegration   → Hook React

Backend (Express)
├── routes/calendarIntegration.js      → Routes OAuth
├── controllers/calendar-integration.js  → Logique
├── services/googleCalendarService.js    → API Google
└── services/outlookCalendarService.js   → API Outlook
```

### Flux de données

```
[Utilisateur] 
    ↓
[Frontend - GoogleIntegration.tsx]
    ↓
[Backend API - /calendar/oauth/google/auth-url]
    ↓
[Google OAuth Server]
    ↓
[Backend - Échange code contre tokens]
    ↓
[Prisma - Sauvegarde CalendarIntegration]
    ↓
[Frontend - Affiche "Connecté"]
```

---

## 📦 Installation

### Prérequis

- Node.js 16+
- PostgreSQL 12+
- Compte Google (pour Google Calendar)
- Compte Microsoft (pour Outlook)

### Configuration (détaillée)

**Étape 1 : Créer credentials Google**

```
Aller à: https://console.cloud.google.com/
1. Créer nouveau projet
2. Activer "Google Calendar API"
3. Créer OAuth 2.0 credentials
4. Copier CLIENT_ID et CLIENT_SECRET
```

**Étape 2 : Créer credentials Microsoft**

```
Aller à: https://portal.azure.com/
1. Créer nouvelle "App registration"
2. Ajouter permissions: Calendars.ReadWrite, User.Read
3. Créer client secret
4. Copier CLIENT_ID et CLIENT_SECRET
```

**Étape 3 : Configurer .env**

```bash
# backend/.env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=yyy
OUTLOOK_CLIENT_ID=aaa
OUTLOOK_CLIENT_SECRET=bbb
```

---

## 🧪 Tests

### Tests locaux

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tous les tests
npm run test
```

### Test manuel

```bash
# 1. Démarrer backend et frontend
npm run dev

# 2. Ouvrir http://localhost:3001/learner/calendar

# 3. Cliquer "Connecter Google"
# → Popup OAuth s'ouvre
# → Vous connecter
# → Popup se ferme
# → "Connecté" s'affiche

# 4. Cliquer "Synchroniser"
# → Message de succès
# → Événements synchronisés
```

---

## 🔒 Sécurité

### Bonnes pratiques appliquées

- ✅ OAuth 2.0 Authorization Code Flow
- ✅ Tokens stockés cryptés en BDD
- ✅ Refresh tokens automatiques
- ✅ JWT pour authentification
- ✅ CORS configuré correctement
- ✅ Validation de tous les inputs
- ✅ Logs sans exposition de secrets

### Permissions minimales

**Google Calendar:**
- `calendar` : Lire/écrire calendriers
- `calendar.events` : Lire/écrire événements
- `userinfo.email` : Obtenir email utilisateur
- `userinfo.profile` : Obtenir infos profil

**Microsoft Graph:**
- `Calendars.ReadWrite` : Lire/écrire calendriers
- `User.Read` : Lire profil utilisateur

---

## 🐛 Troubleshooting

### Erreur: "Invalid redirect_uri"

```
Cause: L'URI ne correspond pas dans Google Cloud/Azure Portal

Solution:
1. Vérifier que l'URI est enregistré exactement:
   http://localhost:3001/learner/calendar
2. Pas de trailing slash
3. Protocole (http/https) correct
4. Attendre quelques minutes que le changement soit appliqué
```

### Erreur: "Impossible d'ouvrir la fenêtre"

```
Cause: Popups bloquées

Solution:
1. Vérifier les paramètres des popups du navigateur
2. Ajouter localhost:3001 à la whitelist
3. Essayer avec un autre navigateur
```

### Erreur: "Token has expired"

```
Cause: Token d'accès expiré

Solution:
1. Refresh automatique devrait fonctionner
2. Si pas de refresh token, reconnecter
3. Vérifier les logs du backend pour erreurs
```

---

## 📊 Performance

### Benchmarks

| Opération | Temps | Événements |
|-----------|-------|-----------|
| Import Google | < 5s | 100 |
| Sync Outlook | < 3s | 50 |
| Créer événement | < 1s | 1 |
| Supprimer événement | < 1s | 1 |

### Optimisations

- Pagination pour les imports (50 par défaut)
- Cache des intégrations (5 min)
- Compression des réponses API
- Rate limiting respecté

---

## 📞 Support

### Documentation supplémentaire

- **Google Calendar API**: https://developers.google.com/calendar
- **Microsoft Graph**: https://docs.microsoft.com/en-us/graph
- **OAuth 2.0**: https://tools.ietf.org/html/rfc6749

### Contacter le support

- 📧 Email: support@bai-consulting.com
- 💬 Slack: #calendar-integration
- 🐛 Issues: GitHub Issues

---

## 📋 Checklist de production

- [ ] Credentials configurés
- [ ] Variables d'env sécurisées
- [ ] URLs HTTPS activées
- [ ] Certificats SSL en place
- [ ] CORS configuré
- [ ] Logs en place
- [ ] Monitoring actif
- [ ] Plan de backup
- [ ] Documentation utilisateur
- [ ] Tests passants

---

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Intégration Google Calendar
- ✅ Intégration Outlook/Microsoft Graph
- ✅ Synchronisation bidirectionnelle
- ✅ Gestion des tokens OAuth
- ✅ Interface utilisateur complète

### v1.1.0 (Roadmap)
- [ ] Apple Calendar
- [ ] Synchronisation de groupe calendrier
- [ ] Notifications temps réel
- [ ] Analytics et rapports

---

## 📄 Licence

Cette intégration fait partie de l'application BAI Consulting.
Propriété de BAI Consulting - Tous droits réservés.

---

## 👥 Équipe

- **Développement**: Équipe BAI Consulting
- **Documentation**: Équipe Technique
- **Support**: Team Support

**Dernière mise à jour:** 10 février 2026

