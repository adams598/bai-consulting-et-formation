# 🚀 Guide de démarrage rapide - Backend BAI Consulting

## 📋 Prérequis

- Node.js 18+ installé
- PostgreSQL installé et configuré
- npm ou yarn

## ⚡ Installation rapide

### 1. Installation des dépendances

```bash
cd backend
npm install
```

### 2. Configuration de l'environnement

```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer le fichier .env avec vos configurations
```

**Configuration minimale pour le développement :**

```env
# Configuration du serveur
PORT=3000
NODE_ENV=development

# Base de données (PostgreSQL local)
DATABASE_URL="postgresql://postgres:password@localhost:5432/bai_consulting_db"

# JWT (générer des clés sécurisées)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-secure
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-make-it-long-and-secure

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### 3. Configuration de la base de données

#### Option A : Base de données locale

```bash
# Créer la base de données PostgreSQL
createdb bai_consulting_db

# Ou via psql
psql -U postgres
CREATE DATABASE bai_consulting_db;
\q
```

#### Option B : Base de données distante

Modifiez `DATABASE_URL` dans `.env` avec votre URL de base de données.

### 4. Initialisation de la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers la base de données
npm run db:push

# Initialiser les données de test
npm run db:seed
```

### 5. Démarrage du serveur

```bash
# Mode développement
npm run dev

# Ou mode production
npm start
```

Le serveur sera accessible sur `http://localhost:3000`

## 🔑 Identifiants de test

Après l'initialisation, vous pouvez utiliser ces identifiants :

### Super Admin
- **Email :** `admin@bai-consulting.com`
- **Mot de passe :** `admin123`

### Admin de banque
- **Email :** `admin@banque-populaire.com`
- **Mot de passe :** `admin123`

### Collaborateurs
- **Email :** `marie.martin@banque-populaire.com`
- **Mot de passe :** `admin123`

- **Email :** `pierre.durand@banque-populaire.com`
- **Mot de passe :** `admin123`

## 🧪 Test de l'API

### Test de connexion

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bai-consulting.com",
    "password": "admin123"
  }'
```

### Test des formations

```bash
# Récupérer le token de la réponse précédente
TOKEN="your-access-token"

curl -X GET http://localhost:3000/api/admin/formations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## 🔧 Commandes utiles

```bash
# Générer le client Prisma
npm run db:generate

# Pousser les changements vers la base
npm run db:push

# Créer une migration
npm run db:migrate

# Ouvrir Prisma Studio (interface graphique)
npm run db:studio

# Initialiser les données
npm run db:seed

# Démarrer en mode développement
npm run dev
```

## 🚨 Dépannage

### Erreur de connexion à la base de données

1. Vérifiez que PostgreSQL est démarré
2. Vérifiez l'URL de connexion dans `.env`
3. Vérifiez les permissions de l'utilisateur

### Erreur "Module not found"

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur Prisma

```bash
# Régénérer le client Prisma
npm run db:generate
```

## 📚 Documentation complète

Pour plus de détails, consultez le [README du backend](./backend/README.md).

## 🎯 Prochaines étapes

1. **Configurer l'email** (optionnel) - Voir la section Email dans le README
2. **Configurer la sécurité** - Modifier les clés JWT en production
3. **Déployer en production** - Configurer les variables d'environnement
4. **Connecter le frontend** - Le frontend est déjà configuré pour utiliser ce backend

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez que tous les prérequis sont installés
2. Vérifiez la configuration dans `.env`
3. Consultez les logs du serveur
4. Vérifiez la documentation complète

---

**🎉 Félicitations ! Votre backend est maintenant opérationnel !** 

## 📋 Prérequis

- Node.js 18+ installé
- PostgreSQL installé et configuré
- npm ou yarn

## ⚡ Installation rapide

### 1. Installation des dépendances

```bash
cd backend
npm install
```

### 2. Configuration de l'environnement

```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer le fichier .env avec vos configurations
```

**Configuration minimale pour le développement :**

```env
# Configuration du serveur
PORT=3000
NODE_ENV=development

# Base de données (PostgreSQL local)
DATABASE_URL="postgresql://postgres:password@localhost:5432/bai_consulting_db"

# JWT (générer des clés sécurisées)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-secure
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-make-it-long-and-secure

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### 3. Configuration de la base de données

#### Option A : Base de données locale

```bash
# Créer la base de données PostgreSQL
createdb bai_consulting_db

# Ou via psql
psql -U postgres
CREATE DATABASE bai_consulting_db;
\q
```

#### Option B : Base de données distante

Modifiez `DATABASE_URL` dans `.env` avec votre URL de base de données.

### 4. Initialisation de la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers la base de données
npm run db:push

# Initialiser les données de test
npm run db:seed
```

### 5. Démarrage du serveur

```bash
# Mode développement
npm run dev

# Ou mode production
npm start
```

Le serveur sera accessible sur `http://localhost:3000`

## 🔑 Identifiants de test

Après l'initialisation, vous pouvez utiliser ces identifiants :

### Super Admin
- **Email :** `admin@bai-consulting.com`
- **Mot de passe :** `admin123`

### Admin de banque
- **Email :** `admin@banque-populaire.com`
- **Mot de passe :** `admin123`

### Collaborateurs
- **Email :** `marie.martin@banque-populaire.com`
- **Mot de passe :** `admin123`

- **Email :** `pierre.durand@banque-populaire.com`
- **Mot de passe :** `admin123`

## 🧪 Test de l'API

### Test de connexion

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bai-consulting.com",
    "password": "admin123"
  }'
```

### Test des formations

```bash
# Récupérer le token de la réponse précédente
TOKEN="your-access-token"

curl -X GET http://localhost:3000/api/admin/formations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## 🔧 Commandes utiles

```bash
# Générer le client Prisma
npm run db:generate

# Pousser les changements vers la base
npm run db:push

# Créer une migration
npm run db:migrate

# Ouvrir Prisma Studio (interface graphique)
npm run db:studio

# Initialiser les données
npm run db:seed

# Démarrer en mode développement
npm run dev
```

## 🚨 Dépannage

### Erreur de connexion à la base de données

1. Vérifiez que PostgreSQL est démarré
2. Vérifiez l'URL de connexion dans `.env`
3. Vérifiez les permissions de l'utilisateur

### Erreur "Module not found"

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur Prisma

```bash
# Régénérer le client Prisma
npm run db:generate
```

## 📚 Documentation complète

Pour plus de détails, consultez le [README du backend](./backend/README.md).

## 🎯 Prochaines étapes

1. **Configurer l'email** (optionnel) - Voir la section Email dans le README
2. **Configurer la sécurité** - Modifier les clés JWT en production
3. **Déployer en production** - Configurer les variables d'environnement
4. **Connecter le frontend** - Le frontend est déjà configuré pour utiliser ce backend

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez que tous les prérequis sont installés
2. Vérifiez la configuration dans `.env`
3. Consultez les logs du serveur
4. Vérifiez la documentation complète

---

**🎉 Félicitations ! Votre backend est maintenant opérationnel !** 