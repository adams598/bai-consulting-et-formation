# 🚀 Guide de Développement - BAI Consulting

## 📋 Configuration des Ports

- **Backend** : Port 3000 (`http://localhost:3000`)
- **Frontend** : Port 3001 (`http://localhost:3001`)

## 🛠️ Démarrage Rapide

### Option 1 : Script Automatique (Recommandé)

#### Windows (PowerShell)
```powershell
.\start-dev.ps1
```

#### Linux/Mac (Bash)
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Option 2 : Démarrage Manuel

#### 1. Démarrer le Backend
```bash
cd backend
npm install
npm run dev
```

#### 2. Démarrer le Frontend (nouveau terminal)
```bash
cd frontend
npm install
npm run dev
```

## 🌐 URLs d'Accès

Une fois les serveurs démarrés, vous pouvez accéder à :

### **Espace Administration**
- **URL** : `http://localhost:3001/admin/login`
- **Fonctionnalités** :
  - Tableau de bord
  - Gestion des formations
  - Gestion des utilisateurs
  - Statistiques

### **Espace Formation**
- **URL** : `http://localhost:3001/formation/login`
- **Fonctionnalités** :
  - Connexion collaborateurs
  - Consultation des formations
  - Suivi de progression

### **API Backend**
- **URL** : `http://localhost:3000`
- **Documentation** : `http://localhost:3000/api/docs`

## 🔧 Configuration

### Variables d'Environnement

#### Backend (`.env`)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

#### Frontend (`.env.development`)
```env
VITE_API_URL=http://localhost:3000
VITE_ENVIRONMENT=development
```

## 📁 Structure du Projet

```
BAI-consulting/
├── backend/                 # API Backend (Port 3000)
│   ├── src/
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Services métier
│   │   ├── middleware/     # Middlewares
│   │   └── utils/          # Utilitaires
│   └── index.js           # Point d'entrée
├── frontend/               # Interface Frontend (Port 3001)
│   ├── src/
│   │   ├── app/           # Pages de l'application
│   │   ├── features/      # Fonctionnalités
│   │   ├── components/    # Composants réutilisables
│   │   └── config/        # Configuration
│   └── package.json
└── scripts/               # Scripts de déploiement
```

## 🎯 Fonctionnalités Disponibles

### **Espace Administration** (`/admin/*`)
- ✅ **Tableau de bord** avec statistiques
- ✅ **Gestion des formations** (CRUD complet)
- ✅ **Gestion des utilisateurs** (CRUD complet)
- ✅ **Gestion des banques** (CRUD complet)
- ✅ **Assignation de formations**
- ✅ **Suivi des progressions**

### **Espace Formation** (`/formation/*`)
- ✅ **Interface de connexion**
- ✅ **Tableau de bord collaborateur**
- ✅ **Consultation des formations**
- ✅ **Suivi de progression**
- ⏳ **Quiz et évaluations** (en développement)

## 🔐 Authentification

### **Test de Connexion**

#### Admin
- **Email** : `admin@bai-consulting.com`
- **Mot de passe** : `admin123`

#### Collaborateur
- **Email** : `collaborateur@banque.com`
- **Mot de passe** : `collab123`

> ⚠️ **Note** : Ces identifiants sont fictifs pour le développement. En production, ils seront gérés par la base de données.

## 🐛 Dépannage

### **Problèmes Courants**

#### 1. Port déjà utilisé
```bash
# Vérifier les ports utilisés
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Tuer le processus
taskkill /PID <PID> /F
```

#### 2. Erreurs de dépendances
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

#### 3. Erreurs CORS
- Vérifier que le backend tourne sur le port 3000
- Vérifier que le frontend tourne sur le port 3001
- Vérifier la configuration CORS dans `backend/index.js`

#### 4. Erreurs de build
```bash
# Nettoyer le cache
npm run clean
# ou
rm -rf dist node_modules/.vite
```

### **Logs et Debug**

#### Backend
```bash
cd backend
npm run dev
# Les logs apparaissent dans le terminal
```

#### Frontend
```bash
cd frontend
npm run dev
# Ouvrir les DevTools (F12) pour voir les erreurs
```

## 🚀 Déploiement

### **Développement**
```bash
# Script automatique
./start-dev.sh  # Linux/Mac
.\start-dev.ps1  # Windows
```

### **Production**
```bash
# Build frontend
cd frontend
npm run build:admin    # Pour l'intranet
npm run build:formation # Pour l'internet

# Déploiement
./scripts/deploy-intranet.sh
```

## 📞 Support

### **En cas de problème**
1. Vérifier les logs dans les terminaux
2. Vérifier la console du navigateur (F12)
3. Vérifier que les ports ne sont pas utilisés
4. Redémarrer les serveurs

### **Contact**
- **Support technique** : tech@bai-consulting.com
- **Documentation** : https://docs.bai-consulting.com

## 🔄 Mise à Jour

### **Mettre à jour les dépendances**
```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### **Mettre à jour le code**
```bash
git pull origin main
npm install  # Dans backend et frontend
```

---

**🎉 Prêt à développer !** 

## 📋 Configuration des Ports

- **Backend** : Port 3000 (`http://localhost:3000`)
- **Frontend** : Port 3001 (`http://localhost:3001`)

## 🛠️ Démarrage Rapide

### Option 1 : Script Automatique (Recommandé)

#### Windows (PowerShell)
```powershell
.\start-dev.ps1
```

#### Linux/Mac (Bash)
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Option 2 : Démarrage Manuel

#### 1. Démarrer le Backend
```bash
cd backend
npm install
npm run dev
```

#### 2. Démarrer le Frontend (nouveau terminal)
```bash
cd frontend
npm install
npm run dev
```

## 🌐 URLs d'Accès

Une fois les serveurs démarrés, vous pouvez accéder à :

### **Espace Administration**
- **URL** : `http://localhost:3001/admin/login`
- **Fonctionnalités** :
  - Tableau de bord
  - Gestion des formations
  - Gestion des utilisateurs
  - Statistiques

### **Espace Formation**
- **URL** : `http://localhost:3001/formation/login`
- **Fonctionnalités** :
  - Connexion collaborateurs
  - Consultation des formations
  - Suivi de progression

### **API Backend**
- **URL** : `http://localhost:3000`
- **Documentation** : `http://localhost:3000/api/docs`

## 🔧 Configuration

### Variables d'Environnement

#### Backend (`.env`)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

#### Frontend (`.env.development`)
```env
VITE_API_URL=http://localhost:3000
VITE_ENVIRONMENT=development
```

## 📁 Structure du Projet

```
BAI-consulting/
├── backend/                 # API Backend (Port 3000)
│   ├── src/
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Services métier
│   │   ├── middleware/     # Middlewares
│   │   └── utils/          # Utilitaires
│   └── index.js           # Point d'entrée
├── frontend/               # Interface Frontend (Port 3001)
│   ├── src/
│   │   ├── app/           # Pages de l'application
│   │   ├── features/      # Fonctionnalités
│   │   ├── components/    # Composants réutilisables
│   │   └── config/        # Configuration
│   └── package.json
└── scripts/               # Scripts de déploiement
```

## 🎯 Fonctionnalités Disponibles

### **Espace Administration** (`/admin/*`)
- ✅ **Tableau de bord** avec statistiques
- ✅ **Gestion des formations** (CRUD complet)
- ✅ **Gestion des utilisateurs** (CRUD complet)
- ✅ **Gestion des banques** (CRUD complet)
- ✅ **Assignation de formations**
- ✅ **Suivi des progressions**

### **Espace Formation** (`/formation/*`)
- ✅ **Interface de connexion**
- ✅ **Tableau de bord collaborateur**
- ✅ **Consultation des formations**
- ✅ **Suivi de progression**
- ⏳ **Quiz et évaluations** (en développement)

## 🔐 Authentification

### **Test de Connexion**

#### Admin
- **Email** : `admin@bai-consulting.com`
- **Mot de passe** : `admin123`

#### Collaborateur
- **Email** : `collaborateur@banque.com`
- **Mot de passe** : `collab123`

> ⚠️ **Note** : Ces identifiants sont fictifs pour le développement. En production, ils seront gérés par la base de données.

## 🐛 Dépannage

### **Problèmes Courants**

#### 1. Port déjà utilisé
```bash
# Vérifier les ports utilisés
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Tuer le processus
taskkill /PID <PID> /F
```

#### 2. Erreurs de dépendances
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

#### 3. Erreurs CORS
- Vérifier que le backend tourne sur le port 3000
- Vérifier que le frontend tourne sur le port 3001
- Vérifier la configuration CORS dans `backend/index.js`

#### 4. Erreurs de build
```bash
# Nettoyer le cache
npm run clean
# ou
rm -rf dist node_modules/.vite
```

### **Logs et Debug**

#### Backend
```bash
cd backend
npm run dev
# Les logs apparaissent dans le terminal
```

#### Frontend
```bash
cd frontend
npm run dev
# Ouvrir les DevTools (F12) pour voir les erreurs
```

## 🚀 Déploiement

### **Développement**
```bash
# Script automatique
./start-dev.sh  # Linux/Mac
.\start-dev.ps1  # Windows
```

### **Production**
```bash
# Build frontend
cd frontend
npm run build:admin    # Pour l'intranet
npm run build:formation # Pour l'internet

# Déploiement
./scripts/deploy-intranet.sh
```

## 📞 Support

### **En cas de problème**
1. Vérifier les logs dans les terminaux
2. Vérifier la console du navigateur (F12)
3. Vérifier que les ports ne sont pas utilisés
4. Redémarrer les serveurs

### **Contact**
- **Support technique** : tech@bai-consulting.com
- **Documentation** : https://docs.bai-consulting.com

## 🔄 Mise à Jour

### **Mettre à jour les dépendances**
```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### **Mettre à jour le code**
```bash
git pull origin main
npm install  # Dans backend et frontend
```

---

**🎉 Prêt à développer !** 