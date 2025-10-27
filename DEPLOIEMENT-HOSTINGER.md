# 🚀 Guide de Déploiement sur Hostinger - BAI Consulting

## 📋 Prérequis Hostinger

### **Plan Hostinger Recommandé**
- **Business Hosting** ou **VPS** (recommandé pour les applications Node.js)
- **SSL gratuit** inclus
- **Base de données PostgreSQL** (ou MySQL)
- **Accès SSH** (pour VPS)

### **Vérifications Avant Déploiement**
- [ ] Compte Hostinger actif
- [ ] Domaine configuré
- [ ] Accès SSH activé (VPS)
- [ ] Base de données créée
- [ ] SSL configuré

## 🔧 Configuration Hostinger

### **1. Configuration de la Base de Données**

```sql
-- Création de la base de données PostgreSQL
CREATE DATABASE bai_consulting_prod;
CREATE USER bai_user WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE bai_consulting_prod TO bai_user;
```

### **2. Configuration des Variables d'Environnement**

```bash
# Variables d'environnement Hostinger
NODE_ENV=production
PORT=3000

# Base de données Hostinger
DATABASE_URL="postgresql://bai_user:votre_mot_de_passe@localhost:5432/bai_consulting_prod"

# JWT Secrets (générés précédemment)
JWT_SECRET=e79d648248b47daf3f5f86b457aa5193a0709220290b0637679429d826c792e2c48eef1aa681d5ca50d421bed51b136079f2f234d7051e38d28fe9d98ed30694
JWT_REFRESH_SECRET=68d82ac8977e67a6ddaa49d8f847aa042c4775bc9990b120aac8d7cce1c8e1e5f0dee97cef2be3a981933d4d6c1bd35d6e6755cd96f203d0c2725125f53286f15b95234df8e94e6bea5ad7239e3bd0eec031cb1e779bf68608e16b1b3c624b9a46d8528131d34fd5429a39ce32568e532e4f2bd1a46bca3f71d762f77aa37ae0

# Redis (si disponible)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=votre_redis_password

# Domaines Hostinger
FRONTEND_URL=https://votre-domaine.com
ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com

# Email Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=votre_email@votre-domaine.com
SMTP_PASS=votre_mot_de_passe_email

# Sécurité
ENCRYPTION_KEY=a16b8bec9eeb42cb6c929f4ad2faa1bf650a2b32acc33556f478f012be4c7361
SESSION_SECRET=e7790295ab2034597148a1e7611287cd04070d319470701abac159e31d58e2e864393551773c892ef1411368c47f7ff1458e70df38deab9fa04f4e879f907aae
```

## 🚀 Déploiement Automatique

### **Script de Déploiement Hostinger**

```bash
#!/bin/bash
# scripts/deploy-hostinger.sh

set -e

DOMAIN=${1:-"votre-domaine.com"}
HOSTINGER_USER=${2:-"votre_utilisateur"}
HOSTINGER_HOST=${3:-"votre-serveur.hostinger.com"}

echo "🚀 Déploiement BAI Consulting sur Hostinger"
echo "=========================================="
echo "🌐 Domaine: $DOMAIN"
echo "🖥️  Serveur: $HOSTINGER_HOST"
echo "👤 Utilisateur: $HOSTINGER_USER"
echo ""

# Vérification des prérequis
echo "🔍 Vérification des prérequis..."

if ! command -v rsync &> /dev/null; then
    echo "❌ rsync n'est pas installé"
    exit 1
fi

if ! command -v ssh &> /dev/null; then
    echo "❌ ssh n'est pas installé"
    exit 1
fi

# Test de connexion SSH
echo "🔌 Test de connexion SSH..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $HOSTINGER_USER@$HOSTINGER_HOST exit; then
    echo "❌ Impossible de se connecter au serveur Hostinger"
    echo "📝 Vérifiez vos credentials SSH"
    exit 1
fi

echo "✅ Connexion SSH réussie"

# Construction des images Docker
echo "🔨 Construction des images Docker..."
docker-compose -f docker-compose.postgresql.yml build --no-cache

# Création du package de déploiement
echo "📦 Création du package de déploiement..."
mkdir -p deploy-package

# Copie des fichiers nécessaires
cp -r backend deploy-package/
cp -r frontend deploy-package/
cp docker-compose.postgresql.yml deploy-package/
cp package.json deploy-package/
cp package-lock.json deploy-package/

# Copie des scripts de déploiement
cp scripts/deploy-hostinger.sh deploy-package/
cp scripts/migrate-to-postgresql.js deploy-package/
cp scripts/generate-secrets.js deploy-package/

# Copie de la documentation
cp DEPLOYMENT-HOSTINGER.md deploy-package/
cp DEPLOYMENT-PRODUCTION.md deploy-package/

# Exclusion des fichiers inutiles
echo "node_modules" > deploy-package/.dockerignore
echo "*.log" >> deploy-package/.dockerignore
echo ".env" >> deploy-package/.dockerignore
echo "uploads" >> deploy-package/.dockerignore

# Compression du package
echo "🗜️ Compression du package..."
tar -czf bai-consulting-deploy.tar.gz deploy-package/

# Upload vers Hostinger
echo "📤 Upload vers Hostinger..."
scp bai-consulting-deploy.tar.gz $HOSTINGER_USER@$HOSTINGER_HOST:~/

# Déploiement sur le serveur
echo "🚀 Déploiement sur le serveur..."
ssh $HOSTINGER_USER@$HOSTINGER_HOST << 'EOF'
# Extraction du package
tar -xzf bai-consulting-deploy.tar.gz
cd deploy-package

# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# Note: Éditer manuellement .env avec les vraies valeurs

# Migration de la base de données
npm run db:migrate

# Construction des images Docker
docker-compose -f docker-compose.postgresql.yml build

# Démarrage des services
docker-compose -f docker-compose.postgresql.yml up -d

# Vérification du déploiement
sleep 30
docker-compose -f docker-compose.postgresql.yml ps

# Test de santé
curl -f http://localhost:3000/api/admin/auth/health || echo "Service non disponible"

echo "✅ Déploiement terminé"
EOF

# Nettoyage local
rm -rf deploy-package/
rm -f bai-consulting-deploy.tar.gz

echo "🎉 Déploiement sur Hostinger terminé !"
echo "======================================"
echo "🌐 Application accessible sur: https://$DOMAIN"
echo "📊 Monitoring: ssh $HOSTINGER_USER@$HOSTINGER_HOST 'docker-compose -f deploy-package/docker-compose.postgresql.yml logs -f'"
echo "🔧 Maintenance: ssh $HOSTINGER_USER@$HOSTINGER_HOST 'cd deploy-package && docker-compose -f docker-compose.postgresql.yml restart'"
```

## 🔧 Configuration Hostinger Spécifique

### **1. Configuration Nginx Hostinger**

```nginx
# Configuration Nginx pour Hostinger
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Certificats SSL Hostinger
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Root et index
    root /home/votre_utilisateur/deploy-package/frontend/dist;
    index index.html;
    
    # Gestion des routes SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### **2. Configuration PM2 pour Hostinger**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'bai-consulting-backend',
      script: './backend/index.js',
      cwd: '/home/votre_utilisateur/deploy-package',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

### **3. Script de Démarrage Hostinger**

```bash
#!/bin/bash
# scripts/start-hostinger.sh

echo "🚀 Démarrage BAI Consulting sur Hostinger"
echo "========================================="

# Vérification de l'environnement
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant"
    exit 1
fi

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm install --production

# Migration de la base de données
echo "🗄️ Migration de la base de données..."
npm run db:migrate

# Construction du frontend
echo "🔨 Construction du frontend..."
cd frontend
npm install
npm run build
cd ..

# Démarrage avec PM2
echo "🚀 Démarrage avec PM2..."
pm2 start ecosystem.config.js

# Configuration du démarrage automatique
pm2 startup
pm2 save

echo "✅ Application démarrée avec succès"
echo "🌐 Accessible sur: https://votre-domaine.com"
```

## 📊 Monitoring Hostinger

### **Script de Monitoring**

```bash
#!/bin/bash
# scripts/monitor-hostinger.sh

echo "📊 Monitoring BAI Consulting sur Hostinger"
echo "========================================="

# Vérification des services
echo "🔍 Vérification des services..."

# Backend
if curl -f http://localhost:3000/api/admin/auth/health > /dev/null 2>&1; then
    echo "✅ Backend: En ligne"
else
    echo "❌ Backend: Hors ligne"
fi

# Frontend
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend: En ligne"
else
    echo "❌ Frontend: Hors ligne"
fi

# Base de données
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL: En ligne"
else
    echo "❌ PostgreSQL: Hors ligne"
fi

# Utilisation des ressources
echo ""
echo "💾 Utilisation des ressources:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Mémoire: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "Espace disque: $(df / | tail -1 | awk '{print $5}')"

# Logs récents
echo ""
echo "📝 Logs récents:"
pm2 logs --lines 10
```

## 🔒 Sécurité Hostinger

### **Configuration Firewall**

```bash
# Configuration UFW pour Hostinger
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

### **Configuration SSL Hostinger**

```bash
# Activation SSL automatique Hostinger
# Via le panneau de contrôle Hostinger :
# 1. Aller dans "SSL"
# 2. Activer "SSL gratuit"
# 3. Configurer la redirection HTTPS
```

## 💾 Sauvegardes Hostinger

### **Script de Sauvegarde**

```bash
#!/bin/bash
# scripts/backup-hostinger.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/votre_utilisateur/backups"
mkdir -p $BACKUP_DIR

echo "💾 Sauvegarde BAI Consulting sur Hostinger"
echo "=========================================="

# Sauvegarde de la base de données
echo "🗄️ Sauvegarde PostgreSQL..."
pg_dump -h localhost -U bai_user bai_consulting_prod > $BACKUP_DIR/postgres_$DATE.sql
gzip $BACKUP_DIR/postgres_$DATE.sql

# Sauvegarde des fichiers
echo "📁 Sauvegarde des fichiers..."
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /home/votre_utilisateur/deploy-package

# Sauvegarde de la configuration
echo "⚙️ Sauvegarde de la configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env ecosystem.config.js

# Nettoyage des anciennes sauvegardes (30 jours)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Sauvegarde terminée: $BACKUP_DIR"
```

## 🚨 Procédures d'Urgence Hostinger

### **En cas de Problème**

```bash
# Redémarrage des services
pm2 restart all

# Redémarrage complet
pm2 stop all
pm2 start ecosystem.config.js

# Vérification des logs
pm2 logs

# Redémarrage du serveur
sudo reboot
```

### **Restauration depuis Sauvegarde**

```bash
# Restauration PostgreSQL
gunzip -c /home/votre_utilisateur/backups/postgres_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U bai_user bai_consulting_prod

# Restauration des fichiers
tar -xzf /home/votre_utilisateur/backups/files_YYYYMMDD_HHMMSS.tar.gz -C /

# Restauration de la configuration
tar -xzf /home/votre_utilisateur/backups/config_YYYYMMDD_HHMMSS.tar.gz
```

## ✅ Checklist de Déploiement Hostinger

- [ ] Compte Hostinger configuré
- [ ] Base de données créée
- [ ] SSL activé
- [ ] Variables d'environnement configurées
- [ ] Script de déploiement exécuté
- [ ] Services démarrés et fonctionnels
- [ ] Tests de connectivité réussis
- [ ] Monitoring configuré
- [ ] Sauvegardes automatiques configurées
- [ ] Documentation mise à jour

## 📞 Support Hostinger

### **En cas de Problème**
1. **Vérifier les logs** : `pm2 logs`
2. **Vérifier les ressources** : `htop`
3. **Tester la connectivité** : `curl -I https://votre-domaine.com`
4. **Contacter le support Hostinger** : support@hostinger.com

### **Informations de Débogage**
```bash
# Informations système
uname -a
node --version
npm --version
pm2 --version

# Informations des services
pm2 status
pm2 logs --lines 50

# Informations réseau
netstat -tuln
ss -tuln
```

## 🎯 Optimisations Hostinger

### **Performance**
- Configuration du cache Redis
- Optimisation des requêtes PostgreSQL
- Compression des assets statiques
- CDN Hostinger

### **Sécurité**
- Firewall UFW configuré
- SSL/TLS activé
- Headers de sécurité
- Monitoring des logs

### **Scalabilité**
- PM2 pour la gestion des processus
- Sauvegardes automatiques
- Monitoring des ressources
- Plan de récupération d'urgence

Votre application BAI Consulting est maintenant prête pour le déploiement sur Hostinger ! 🚀

















