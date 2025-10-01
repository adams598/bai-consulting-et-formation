# 🚀 Guide Complet de Déploiement sur Hostinger

## 📋 Vue d'ensemble

Ce guide vous accompagne étape par étape dans le déploiement de votre application BAI Consulting sur Hostinger, avec migration vers Cloudinary pour la gestion des fichiers.

## 🎯 Plan de Déploiement

### **Phase 1 : Préparation**
1. ✅ Configuration du compte Hostinger
2. ✅ Création de la base de données
3. ✅ Configuration SSL
4. ✅ Préparation des fichiers

### **Phase 2 : Migration des Fichiers**
1. ✅ Configuration Cloudinary
2. ✅ Migration des fichiers existants
3. ✅ Mise à jour de la base de données
4. ✅ Tests de migration

### **Phase 3 : Déploiement**
1. ✅ Configuration du serveur
2. ✅ Installation des dépendances
3. ✅ Déploiement de l'application
4. ✅ Tests de fonctionnement

### **Phase 4 : Optimisation**
1. ✅ Configuration du monitoring
2. ✅ Mise en place des sauvegardes
3. ✅ Optimisation des performances
4. ✅ Tests de sécurité

## 🔧 Étape 1 : Configuration Hostinger

### **1.1 Création du Compte**

```bash
# Inscription sur Hostinger
https://www.hostinger.com/

# Choix du plan recommandé
- Business Hosting (pour les applications Node.js)
- VPS (pour plus de contrôle)
```

### **1.2 Configuration de la Base de Données**

```sql
-- Via le panneau de contrôle Hostinger
-- Base de données > Créer une nouvelle base de données

CREATE DATABASE bai_consulting_prod;
CREATE USER bai_user WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE bai_consulting_prod TO bai_user;
```

### **1.3 Configuration SSL**

```bash
# Via le panneau de contrôle Hostinger
# SSL > Activer SSL gratuit
# Redirection > Forcer HTTPS
```

## 🌐 Étape 2 : Configuration Cloudinary

### **2.1 Création du Compte Cloudinary**

```bash
# Inscription sur Cloudinary
https://cloudinary.com/signup

# Récupération des credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### **2.2 Installation des Dépendances**

```bash
# Backend
npm install cloudinary multer-storage-cloudinary

# Frontend (optionnel)
npm install @cloudinary/react @cloudinary/url-gen
```

### **2.3 Configuration des Variables d'Environnement**

```bash
# .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

## 🚀 Étape 3 : Déploiement Automatique

### **3.1 Configuration Initiale du Serveur**

```bash
# Exécution du script de configuration
./scripts/setup-hostinger.sh votre-domaine.com votre_utilisateur votre-serveur.hostinger.com
```

### **3.2 Migration des Fichiers vers Cloudinary**

```bash
# Exécution de la migration
node scripts/migrate-to-cloudinary-hostinger.js
```

### **3.3 Déploiement de l'Application**

```bash
# Exécution du script de déploiement
./scripts/deploy-hostinger.sh votre-domaine.com votre_utilisateur votre-serveur.hostinger.com
```

## 📊 Étape 4 : Configuration du Monitoring

### **4.1 Script de Monitoring**

```bash
# Exécution du monitoring
ssh votre_utilisateur@votre-serveur.hostinger.com 'cd ~/bai-consulting && ./monitor-hostinger.sh'
```

### **4.2 Configuration des Sauvegardes**

```bash
# Exécution de la sauvegarde
./scripts/backup-hostinger.sh votre_utilisateur votre-serveur.hostinger.com
```

## 🔒 Étape 5 : Sécurité et Optimisation

### **5.1 Configuration du Firewall**

```bash
# Configuration UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

### **5.2 Optimisation des Performances**

```bash
# Configuration PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 📋 Checklist de Déploiement

### **Pré-déploiement**
- [ ] Compte Hostinger configuré
- [ ] Base de données créée
- [ ] SSL activé
- [ ] Compte Cloudinary créé
- [ ] Variables d'environnement configurées

### **Migration**
- [ ] Fichiers migrés vers Cloudinary
- [ ] Base de données mise à jour
- [ ] Tests de migration effectués
- [ ] URLs Cloudinary fonctionnelles

### **Déploiement**
- [ ] Serveur configuré
- [ ] Dépendances installées
- [ ] Application déployée
- [ ] Services démarrés

### **Post-déploiement**
- [ ] Tests de fonctionnement
- [ ] Monitoring configuré
- [ ] Sauvegardes automatiques
- [ ] Documentation mise à jour

## 🚨 Procédures d'Urgence

### **En cas de Problème**

```bash
# Redémarrage des services
ssh votre_utilisateur@votre-serveur.hostinger.com 'pm2 restart all'

# Vérification des logs
ssh votre_utilisateur@votre-serveur.hostinger.com 'pm2 logs'

# Redémarrage complet
ssh votre_utilisateur@votre-serveur.hostinger.com 'pm2 stop all && pm2 start ecosystem.config.js'
```

### **Restauration depuis Sauvegarde**

```bash
# Restauration PostgreSQL
ssh votre_utilisateur@votre-serveur.hostinger.com 'gunzip -c ~/backups/postgres_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U bai_user bai_consulting_prod'

# Restauration des fichiers
ssh votre_utilisateur@votre-serveur.hostinger.com 'tar -xzf ~/backups/files_YYYYMMDD_HHMMSS.tar.gz -C /'
```

## 📞 Support et Maintenance

### **Commandes Utiles**

```bash
# Monitoring
ssh votre_utilisateur@votre-serveur.hostinger.com 'cd ~/bai-consulting && ./monitor-hostinger.sh'

# Logs
ssh votre_utilisateur@votre-serveur.hostinger.com 'pm2 logs'

# Redémarrage
ssh votre_utilisateur@votre-serveur.hostinger.com 'pm2 restart all'

# Sauvegarde
./scripts/backup-hostinger.sh votre_utilisateur votre-serveur.hostinger.com
```

### **Contacts**

- **Support Hostinger** : support@hostinger.com
- **Support Cloudinary** : https://cloudinary.com/support
- **Support technique** : support@bai-consulting.com

## 🎉 Félicitations !

Votre application BAI Consulting est maintenant déployée sur Hostinger avec :

- ✅ **Stockage cloud** : Fichiers migrés vers Cloudinary
- ✅ **Performance optimisée** : CDN mondial
- ✅ **Sécurité renforcée** : SSL, firewall, monitoring
- ✅ **Sauvegardes automatiques** : Base de données et fichiers
- ✅ **Monitoring complet** : Logs, métriques, alertes

Votre application est maintenant **prête pour la production** ! 🚀








