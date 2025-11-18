#!/bin/bash

# Script de configuration initiale sur Hostinger pour BAI Consulting
# Usage: ./scripts/setup-hostinger.sh [domain] [username] [host]

set -e

DOMAIN=${1:-"votre-domaine.com"}
HOSTINGER_USER=${2:-"votre_utilisateur"}
HOSTINGER_HOST=${3:-"votre-serveur.hostinger.com"}

echo "🔧 Configuration initiale Hostinger pour BAI Consulting"
echo "====================================================="
echo "🌐 Domaine: $DOMAIN"
echo "🖥️  Serveur: $HOSTINGER_HOST"
echo "👤 Utilisateur: $HOSTINGER_USER"
echo ""

# Configuration du serveur Hostinger
echo "🚀 Configuration du serveur Hostinger..."
ssh $HOSTINGER_USER@$HOSTINGER_HOST << 'EOF'
# Mise à jour du système
echo "📦 Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
echo "🔧 Installation des dépendances..."
sudo apt install -y curl wget git nginx postgresql postgresql-contrib redis-server

# Installation de Node.js
echo "📦 Installation de Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installation de PM2
echo "🚀 Installation de PM2..."
sudo npm install -g pm2

# Installation de Docker (si nécessaire)
echo "🐳 Installation de Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation de Docker Compose
echo "🐳 Installation de Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configuration de PostgreSQL
echo "🗄️ Configuration de PostgreSQL..."
sudo -u postgres psql << 'POSTGRES_EOF'
CREATE DATABASE bai_consulting_prod;
CREATE USER bai_user WITH PASSWORD 'bai_password_secure_2024';
GRANT ALL PRIVILEGES ON DATABASE bai_consulting_prod TO bai_user;
\q
POSTGRES_EOF

# Configuration de Redis
echo "🔴 Configuration de Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Configuration de Nginx
echo "🌐 Configuration de Nginx..."
sudo tee /etc/nginx/sites-available/bai-consulting << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;
    
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
    root /home/votre_utilisateur/bai-consulting/frontend/dist;
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
NGINX_EOF

# Activation du site
sudo ln -sf /etc/nginx/sites-available/bai-consulting /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Configuration du firewall
echo "🔥 Configuration du firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# Création des répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p ~/bai-consulting/logs
mkdir -p ~/bai-consulting/backups
mkdir -p ~/bai-consulting/uploads

# Configuration des permissions
chmod 755 ~/bai-consulting
chmod 755 ~/bai-consulting/logs
chmod 755 ~/bai-consulting/backups
chmod 755 ~/bai-consulting/uploads

echo "✅ Configuration initiale terminée"
EOF

# Création du fichier de configuration PM2
echo "📝 Création de la configuration PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'bai-consulting-backend',
      script: './backend/index.js',
      cwd: '/home/votre_utilisateur/bai-consulting',
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
EOF

# Upload de la configuration PM2
scp ecosystem.config.js $HOSTINGER_USER@$HOSTINGER_HOST:~/bai-consulting/

# Création du script de démarrage
echo "📝 Création du script de démarrage..."
cat > start-hostinger.sh << 'EOF'
#!/bin/bash

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
EOF

# Upload du script de démarrage
scp start-hostinger.sh $HOSTINGER_USER@$HOSTINGER_HOST:~/bai-consulting/
ssh $HOSTINGER_USER@$HOSTINGER_HOST "chmod +x ~/bai-consulting/start-hostinger.sh"

# Création du script de monitoring
echo "📝 Création du script de monitoring..."
cat > monitor-hostinger.sh << 'EOF'
#!/bin/bash

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
EOF

# Upload du script de monitoring
scp monitor-hostinger.sh $HOSTINGER_USER@$HOSTINGER_HOST:~/bai-consulting/
ssh $HOSTINGER_USER@$HOSTINGER_HOST "chmod +x ~/bai-consulting/monitor-hostinger.sh"

# Nettoyage local
rm -f ecosystem.config.js start-hostinger.sh monitor-hostinger.sh

echo "🎉 Configuration initiale Hostinger terminée !"
echo "=============================================="
echo "📋 Prochaines étapes:"
echo "1. Configurer votre domaine dans le panneau Hostinger"
echo "2. Activer SSL gratuit"
echo "3. Exécuter le script de déploiement: ./scripts/deploy-hostinger.sh"
echo "4. Configurer les variables d'environnement sur le serveur"
echo "5. Démarrer l'application: ssh $HOSTINGER_USER@$HOSTINGER_HOST 'cd ~/bai-consulting && ./start-hostinger.sh'"
echo ""
echo "🔧 Commandes utiles:"
echo "Monitoring: ssh $HOSTINGER_USER@$HOSTINGER_HOST 'cd ~/bai-consulting && ./monitor-hostinger.sh'"
echo "Logs: ssh $HOSTINGER_USER@$HOSTINGER_HOST 'pm2 logs'"
echo "Redémarrage: ssh $HOSTINGER_USER@$HOSTINGER_HOST 'pm2 restart all'"



























