#!/bin/bash

# Script de déploiement complet en production pour BAI Consulting
# Usage: ./scripts/deploy-production.sh [domain] [email] [server_ip]

set -e

DOMAIN=${1:-"votre-domaine.com"}
EMAIL=${2:-"admin@bai-consulting.com"}
SERVER_IP=${3:-$(curl -s ifconfig.me)}

echo "🚀 Déploiement en production BAI Consulting"
echo "==========================================="
echo "🌐 Domaine: $DOMAIN"
echo "📧 Email: $EMAIL"
echo "🖥️  Serveur: $SERVER_IP"
echo ""

# Vérification des prérequis
echo "🔍 Vérification des prérequis..."

# Vérification Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Vérification des ports
echo "🔌 Vérification des ports..."
for port in 80 443 3000 5432 6379; do
    if netstat -tuln | grep -q ":$port "; then
        echo "⚠️  Port $port déjà utilisé"
    else
        echo "✅ Port $port disponible"
    fi
done

# Création des répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p ssl
mkdir -p logs
mkdir -p backups
mkdir -p uploads

# Génération des secrets sécurisés
echo "🔐 Génération des secrets sécurisés..."
if [ ! -f .env.production ]; then
    cat > .env.production << EOF
# Configuration de production BAI Consulting
NODE_ENV=production

# Base de données PostgreSQL
DATABASE_URL="postgresql://bai_user:$(openssl rand -hex 32)@postgres:5432/bai_consulting"
POSTGRES_DB=bai_consulting
POSTGRES_USER=bai_user
POSTGRES_PASSWORD=$(openssl rand -hex 32)

# JWT Secrets
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=$(openssl rand -hex 32)
REDIS_DB=0

# OpenAI
OPENAI_API_KEY=CHANGEZ_MOI

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=CHANGEZ_MOI
SMTP_PASS=CHANGEZ_MOI
SMTP_FROM=noreply@$DOMAIN

# Sécurité
ENCRYPTION_KEY=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
BANNED_IPS=

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/custom/server.crt
SSL_KEY_PATH=/etc/ssl/custom/server.key
SSL_ENABLED=true

# Domaines autorisés
ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN,https://api.$DOMAIN,https://admin.$DOMAIN

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
EOF
    echo "✅ Fichier .env.production créé"
else
    echo "⚠️  Fichier .env.production existe déjà"
fi

# Configuration SSL
echo "🔒 Configuration SSL..."
if [ ! -f ssl/server.crt ] || [ ! -f ssl/server.key ]; then
    echo "🔐 Génération des certificats SSL..."
    
    # Génération de certificats auto-signés pour le démarrage
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/server.key \
        -out ssl/server.crt \
        -subj "/C=FR/ST=France/L=Paris/O=BAI Consulting/CN=$DOMAIN"
    
    chmod 600 ssl/server.key
    chmod 644 ssl/server.crt
    
    echo "✅ Certificats SSL générés"
else
    echo "✅ Certificats SSL existants trouvés"
fi

# Mise à jour de la configuration Docker Compose
echo "🐳 Configuration Docker Compose..."
if [ -f docker-compose.postgresql.yml ]; then
    # Mise à jour des domaines dans la configuration
    sed -i "s/votre-domaine.com/$DOMAIN/g" docker-compose.postgresql.yml
    sed -i "s/api.votre-domaine.com/api.$DOMAIN/g" docker-compose.postgresql.yml
    
    echo "✅ Configuration Docker Compose mise à jour"
else
    echo "❌ Fichier docker-compose.postgresql.yml non trouvé"
    exit 1
fi

# Construction des images Docker
echo "🔨 Construction des images Docker..."
docker-compose -f docker-compose.postgresql.yml build --no-cache

# Démarrage des services
echo "🚀 Démarrage des services..."
docker-compose -f docker-compose.postgresql.yml up -d

# Attente que les services soient prêts
echo "⏳ Attente que les services soient prêts..."
sleep 30

# Vérification de la santé des services
echo "🏥 Vérification de la santé des services..."

# PostgreSQL
if docker exec bai-postgres-prod pg_isready -U bai_user -d bai_consulting > /dev/null 2>&1; then
    echo "✅ PostgreSQL: En ligne"
else
    echo "❌ PostgreSQL: Hors ligne"
fi

# Redis
if docker exec bai-redis-prod redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: En ligne"
else
    echo "❌ Redis: Hors ligne"
fi

# Backend
if curl -f http://localhost:3001/api/admin/auth/health > /dev/null 2>&1; then
    echo "✅ Backend: En ligne"
else
    echo "❌ Backend: Hors ligne"
fi

# Frontend
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend: En ligne"
else
    echo "❌ Frontend: Hors ligne"
fi

# Configuration du firewall
echo "🔥 Configuration du firewall..."
if command -v ufw &> /dev/null; then
    # Ubuntu/Debian avec UFW
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    ufw --force enable
    echo "✅ Firewall UFW configuré"
elif command -v firewall-cmd &> /dev/null; then
    # CentOS/RHEL avec firewalld
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo "✅ Firewall firewalld configuré"
else
    echo "⚠️  Aucun firewall détecté, configuration manuelle requise"
fi

# Configuration du monitoring
echo "📊 Configuration du monitoring..."
cat > /usr/local/bin/monitor-bai.sh << 'EOF'
#!/bin/bash
# Script de monitoring BAI Consulting

echo "📊 Monitoring BAI Consulting - $(date)"
echo "======================================"

# Vérification des conteneurs
echo "🐳 Statut des conteneurs:"
docker-compose -f /path/to/docker-compose.postgresql.yml ps

# Vérification des ressources
echo "💾 Utilisation des ressources:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Vérification des logs d'erreur
echo "📝 Dernières erreurs:"
docker-compose -f /path/to/docker-compose.postgresql.yml logs --tail=10 | grep -i error

# Vérification de l'espace disque
echo "💿 Espace disque:"
df -h | grep -E "(/$|/var)"

echo "✅ Monitoring terminé"
EOF

chmod +x /usr/local/bin/monitor-bai.sh

# Configuration des sauvegardes automatiques
echo "💾 Configuration des sauvegardes automatiques..."
cat > /usr/local/bin/backup-bai.sh << 'EOF'
#!/bin/bash
# Script de sauvegarde BAI Consulting

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

echo "💾 Sauvegarde BAI Consulting - $DATE"

# Sauvegarde PostgreSQL
docker exec bai-postgres-prod pg_dump -U bai_user bai_consulting > $BACKUP_DIR/postgres_$DATE.sql
gzip $BACKUP_DIR/postgres_$DATE.sql

# Sauvegarde des uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Sauvegarde de la configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env.production ssl/ docker-compose.postgresql.yml

# Nettoyage (30 jours)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Sauvegarde terminée: $BACKUP_DIR"
EOF

chmod +x /usr/local/bin/backup-bai.sh

# Ajout au crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-bai.sh") | crontab -
(crontab -l 2>/dev/null; echo "*/15 * * * * /usr/local/bin/monitor-bai.sh >> /var/log/bai-monitor.log 2>&1") | crontab -

echo "✅ Monitoring et sauvegardes configurés"

# Test final
echo "🧪 Tests finaux..."
echo "Test HTTP:"
curl -I http://localhost/health

echo "Test HTTPS:"
curl -k -I https://localhost/health

echo "Test API:"
curl -I http://localhost:3001/api/admin/auth/health

echo ""
echo "🎉 Déploiement en production terminé avec succès !"
echo "=================================================="
echo "🌐 Application accessible sur:"
echo "   HTTP:  http://$DOMAIN"
echo "   HTTPS: https://$DOMAIN"
echo "   API:   https://api.$DOMAIN"
echo "   Admin: https://admin.$DOMAIN"
echo ""
echo "📊 Monitoring:"
echo "   Logs: docker-compose -f docker-compose.postgresql.yml logs -f"
echo "   Statut: docker-compose -f docker-compose.postgresql.yml ps"
echo "   Monitoring: /usr/local/bin/monitor-bai.sh"
echo ""
echo "💾 Sauvegardes:"
echo "   Automatiques: quotidiennes à 2h00"
echo "   Manuel: /usr/local/bin/backup-bai.sh"
echo ""
echo "🔧 Prochaines étapes:"
echo "1. Configurer votre DNS pour pointer vers $SERVER_IP"
echo "2. Obtenir des certificats SSL valides (Let's Encrypt)"
echo "3. Configurer votre domaine dans .env.production"
echo "4. Tester toutes les fonctionnalités"
echo "5. Configurer les alertes de monitoring"








