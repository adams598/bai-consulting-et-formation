# BAI Consulting - Backend

Backend API pour la plateforme de formation BAI Consulting.

## 🚀 Installation

### Prérequis

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

### 1. Installation des dépendances

```bash
cd backend
npm install
```

### 2. Configuration de l'environnement

Copiez le fichier d'exemple et configurez vos variables d'environnement :

```bash
cp env.example .env
```

Éditez le fichier `.env` avec vos configurations :

```env
# Configuration du serveur
PORT=3000
NODE_ENV=development

# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/bai_consulting_db"

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@bai-consulting.com

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### 3. Configuration de la base de données

#### Option A : Base de données locale

1. Créez une base de données PostgreSQL :
```sql
CREATE DATABASE bai_consulting_db;
```

2. Générez le client Prisma :
```bash
npm run db:generate
```

3. Poussez le schéma vers la base de données :
```bash
npm run db:push
```

#### Option B : Base de données distante

1. Configurez votre `DATABASE_URL` dans le fichier `.env`
2. Générez le client Prisma :
```bash
npm run db:generate
```

3. Poussez le schéma vers la base de données :
```bash
npm run db:push
```

### 4. Initialisation des données

Exécutez le script d'initialisation pour créer les données de test :

```bash
npm run db:seed
```

## 🏃‍♂️ Démarrage

### Mode développement

```bash
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

### Mode production

```bash
npm start
```

## 📚 API Endpoints

### Authentification

- `POST /api/admin/auth/login` - Connexion
- `POST /api/admin/auth/logout` - Déconnexion
- `GET /api/admin/auth/me` - Utilisateur actuel
- `POST /api/admin/auth/refresh` - Rafraîchir le token
- `POST /api/admin/auth/switch-bank` - Changer de banque

### Banques

- `GET /api/admin/banks` - Liste des banques
- `GET /api/admin/banks/:id` - Détails d'une banque
- `POST /api/admin/banks` - Créer une banque
- `PUT /api/admin/banks/:id` - Modifier une banque
- `DELETE /api/admin/banks/:id` - Supprimer une banque

### Formations

- `GET /api/admin/formations` - Liste des formations
- `GET /api/admin/formations/:id` - Détails d'une formation
- `POST /api/admin/formations` - Créer une formation
- `PUT /api/admin/formations/:id` - Modifier une formation
- `DELETE /api/admin/formations/:id` - Supprimer une formation
- `PATCH /api/admin/formations/:id/toggle-active` - Activer/Désactiver
- `PATCH /api/admin/formations/:id/toggle-mandatory` - Rendre obligatoire/optionnel

### Utilisateurs

- `GET /api/admin/users` - Liste des utilisateurs
- `GET /api/admin/users/:id` - Détails d'un utilisateur
- `POST /api/admin/users` - Créer un utilisateur
- `PUT /api/admin/users/:id` - Modifier un utilisateur
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur
- `PATCH /api/admin/users/:id/toggle-active` - Activer/Désactiver
- `POST /api/admin/users/:id/reset-password` - Réinitialiser le mot de passe
- `POST /api/admin/users/:id/send-credentials` - Envoyer les identifiants

### Assignations

- `GET /api/admin/assignments` - Liste des assignations
- `POST /api/admin/assignments` - Créer une assignation
- `POST /api/admin/assignments/bulk` - Assignations en masse

### Tableau de bord

- `GET /api/admin/dashboard/stats` - Statistiques générales
- `GET /api/admin/dashboard/bank-stats` - Statistiques par banque
- `GET /api/admin/dashboard/recent-activity` - Activité récente

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Headers requis

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Rôles utilisateurs

- `SUPER_ADMIN` : Accès complet à toutes les fonctionnalités
- `BANK_ADMIN` : Accès limité à sa banque
- `COLLABORATOR` : Accès aux formations assignées

## 📧 Configuration Email

### Gmail

1. Activez l'authentification à 2 facteurs
2. Générez un mot de passe d'application
3. Configurez dans `.env` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Autres fournisseurs

Consultez la documentation de votre fournisseur SMTP pour les paramètres.

## 🗄️ Base de données

### Schéma

Le schéma Prisma se trouve dans `prisma/schema.prisma`

### Commandes utiles

```bash
# Générer le client Prisma
npm run db:generate

# Pousser les changements vers la base
npm run db:push

# Créer une migration
npm run db:migrate

# Ouvrir Prisma Studio
npm run db:studio

# Initialiser les données
npm run db:seed
```

## 🔧 Scripts disponibles

- `npm start` - Démarrer en mode production
- `npm run dev` - Démarrer en mode développement avec hot reload
- `npm run db:generate` - Générer le client Prisma
- `npm run db:push` - Pousser le schéma vers la base
- `npm run db:migrate` - Créer et appliquer les migrations
- `npm run db:studio` - Ouvrir Prisma Studio
- `npm run db:seed` - Initialiser les données de test

## 🧪 Données de test

Après l'initialisation, vous pouvez utiliser ces identifiants :

### Super Admin
- Email : `admin@bai-consulting.com`
- Mot de passe : `admin123`

### Admin de banque
- Email : `admin@banque-populaire.com`
- Mot de passe : `admin123`

### Collaborateurs
- Email : `marie.martin@banque-populaire.com`
- Mot de passe : `admin123`

- Email : `pierre.durand@banque-populaire.com`
- Mot de passe : `admin123`

## 🛡️ Sécurité

- Rate limiting sur toutes les routes
- Validation des entrées avec Joi
- Sanitisation des données
- Headers de sécurité
- Authentification JWT
- Hachage des mots de passe avec bcrypt

## 📝 Logs

Les logs sont affichés dans la console. En production, configurez un système de logging approprié.

## 🚨 Dépannage

### Erreur de connexion à la base de données

1. Vérifiez que PostgreSQL est démarré
2. Vérifiez l'URL de connexion dans `.env`
3. Vérifiez les permissions de l'utilisateur

### Erreur d'envoi d'email

1. Vérifiez la configuration SMTP dans `.env`
2. Vérifiez que l'authentification à 2 facteurs est activée (Gmail)
3. Vérifiez le mot de passe d'application

### Erreur JWT

1. Vérifiez que `JWT_SECRET` et `JWT_REFRESH_SECRET` sont définis
2. Vérifiez que les secrets sont suffisamment longs et sécurisés

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement. 
SMTP_PASS=your-app-password
SMTP_FROM=noreply@bai-consulting.com

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### 3. Configuration de la base de données

#### Option A : Base de données locale

1. Créez une base de données PostgreSQL :
```sql
CREATE DATABASE bai_consulting_db;
```

2. Générez le client Prisma :
```bash
npm run db:generate
```

3. Poussez le schéma vers la base de données :
```bash
npm run db:push
```

#### Option B : Base de données distante

1. Configurez votre `DATABASE_URL` dans le fichier `.env`
2. Générez le client Prisma :
```bash
npm run db:generate
```

3. Poussez le schéma vers la base de données :
```bash
npm run db:push
```

### 4. Initialisation des données

Exécutez le script d'initialisation pour créer les données de test :

```bash
npm run db:seed
```

## 🏃‍♂️ Démarrage

### Mode développement

```bash
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

### Mode production

```bash
npm start
```

## 📚 API Endpoints

### Authentification

- `POST /api/admin/auth/login` - Connexion
- `POST /api/admin/auth/logout` - Déconnexion
- `GET /api/admin/auth/me` - Utilisateur actuel
- `POST /api/admin/auth/refresh` - Rafraîchir le token
- `POST /api/admin/auth/switch-bank` - Changer de banque

### Banques

- `GET /api/admin/banks` - Liste des banques
- `GET /api/admin/banks/:id` - Détails d'une banque
- `POST /api/admin/banks` - Créer une banque
- `PUT /api/admin/banks/:id` - Modifier une banque
- `DELETE /api/admin/banks/:id` - Supprimer une banque

### Formations

- `GET /api/admin/formations` - Liste des formations
- `GET /api/admin/formations/:id` - Détails d'une formation
- `POST /api/admin/formations` - Créer une formation
- `PUT /api/admin/formations/:id` - Modifier une formation
- `DELETE /api/admin/formations/:id` - Supprimer une formation
- `PATCH /api/admin/formations/:id/toggle-active` - Activer/Désactiver
- `PATCH /api/admin/formations/:id/toggle-mandatory` - Rendre obligatoire/optionnel

### Utilisateurs

- `GET /api/admin/users` - Liste des utilisateurs
- `GET /api/admin/users/:id` - Détails d'un utilisateur
- `POST /api/admin/users` - Créer un utilisateur
- `PUT /api/admin/users/:id` - Modifier un utilisateur
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur
- `PATCH /api/admin/users/:id/toggle-active` - Activer/Désactiver
- `POST /api/admin/users/:id/reset-password` - Réinitialiser le mot de passe
- `POST /api/admin/users/:id/send-credentials` - Envoyer les identifiants

### Assignations

- `GET /api/admin/assignments` - Liste des assignations
- `POST /api/admin/assignments` - Créer une assignation
- `POST /api/admin/assignments/bulk` - Assignations en masse

### Tableau de bord

- `GET /api/admin/dashboard/stats` - Statistiques générales
- `GET /api/admin/dashboard/bank-stats` - Statistiques par banque
- `GET /api/admin/dashboard/recent-activity` - Activité récente

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Headers requis

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Rôles utilisateurs

- `SUPER_ADMIN` : Accès complet à toutes les fonctionnalités
- `BANK_ADMIN` : Accès limité à sa banque
- `COLLABORATOR` : Accès aux formations assignées

## 📧 Configuration Email

### Gmail

1. Activez l'authentification à 2 facteurs
2. Générez un mot de passe d'application
3. Configurez dans `.env` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Autres fournisseurs

Consultez la documentation de votre fournisseur SMTP pour les paramètres.

## 🗄️ Base de données

### Schéma

Le schéma Prisma se trouve dans `prisma/schema.prisma`

### Commandes utiles

```bash
# Générer le client Prisma
npm run db:generate

# Pousser les changements vers la base
npm run db:push

# Créer une migration
npm run db:migrate

# Ouvrir Prisma Studio
npm run db:studio

# Initialiser les données
npm run db:seed
```

## 🔧 Scripts disponibles

- `npm start` - Démarrer en mode production
- `npm run dev` - Démarrer en mode développement avec hot reload
- `npm run db:generate` - Générer le client Prisma
- `npm run db:push` - Pousser le schéma vers la base
- `npm run db:migrate` - Créer et appliquer les migrations
- `npm run db:studio` - Ouvrir Prisma Studio
- `npm run db:seed` - Initialiser les données de test

## 🧪 Données de test

Après l'initialisation, vous pouvez utiliser ces identifiants :

### Super Admin
- Email : `admin@bai-consulting.com`
- Mot de passe : `admin123`

### Admin de banque
- Email : `admin@banque-populaire.com`
- Mot de passe : `admin123`

### Collaborateurs
- Email : `marie.martin@banque-populaire.com`
- Mot de passe : `admin123`

- Email : `pierre.durand@banque-populaire.com`
- Mot de passe : `admin123`

## 🛡️ Sécurité

- Rate limiting sur toutes les routes
- Validation des entrées avec Joi
- Sanitisation des données
- Headers de sécurité
- Authentification JWT
- Hachage des mots de passe avec bcrypt

## 📝 Logs

Les logs sont affichés dans la console. En production, configurez un système de logging approprié.

## 🚨 Dépannage

### Erreur de connexion à la base de données

1. Vérifiez que PostgreSQL est démarré
2. Vérifiez l'URL de connexion dans `.env`
3. Vérifiez les permissions de l'utilisateur

### Erreur d'envoi d'email

1. Vérifiez la configuration SMTP dans `.env`
2. Vérifiez que l'authentification à 2 facteurs est activée (Gmail)
3. Vérifiez le mot de passe d'application

### Erreur JWT

1. Vérifiez que `JWT_SECRET` et `JWT_REFRESH_SECRET` sont définis
2. Vérifiez que les secrets sont suffisamment longs et sécurisés

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement. 