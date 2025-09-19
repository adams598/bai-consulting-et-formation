# 🚀 Guide de Déploiement Sécurisé - BAI Consulting

## 📋 Prérequis

### **Système**
- Ubuntu 20.04+ ou CentOS 8+
- Docker 20.10+
- Docker Compose 2.0+
- Nginx (pour reverse proxy)
- Certificats SSL (Let's Encrypt recommandé)

### **Sécurité**
- Firewall configuré (UFW ou iptables)
- Utilisateur non-root pour l'application
- Clés SSH configurées
- Mise à jour système récente

## 🔧 Installation

### **1. Préparation du serveur**

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# Configuration Docker
sudo systemctl enable docker
sudo systemctl start docker

# Ajout de l'utilisateur au groupe docker
sudo usermod -aG docker $USER
```

### **2. Configuration du firewall**

```bash
# Configuration UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Ports autorisés
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp # Backend (si accès direct)

# Activation
sudo ufw enable
```

### **3. Configuration SSL avec Let's Encrypt**

```bash
# Génération des certificats
sudo certbot --nginx -d votre-domaine.com -d api.votre-domaine.com

# Renouvellement automatique
sudo crontab -e
# Ajouter: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **4. Configuration des variables d'environnement**

```bash
# Création du fichier .env
cp .env.example .env

# Édition avec des valeurs sécurisées
nano .env
```

**Variables critiques à configurer :**
```env
# Générer des secrets forts
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 128)
REDIS_PASSWORD=$(openssl rand -base64 32)

# Configuration base de données
DATABASE_URL=postgresql://bai_user:mot_de_passe_fort@postgres:5432/bai_consulting
POSTGRES_PASSWORD=mot_de_passe_fort_postgres

# Domaines autorisés
ALLOWED_ORIGINS=https://votre-domaine.com,https://admin.votre-domaine.com
```

### **5. Déploiement avec Docker**

```bash
# Construction et démarrage
docker-compose up -d --build

# Vérification des services
docker-compose ps
docker-compose logs -f
```

### **6. Configuration Nginx**

```nginx
# /etc/nginx/sites-available/bai-consulting
server {
    listen 80;
    server_name votre-domaine.com api.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    # Configuration SSL sécurisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

## 🔒 Sécurisation Post-Déploiement

### **1. Configuration de la base de données**

```bash
# Migration vers PostgreSQL
docker-compose exec backend npx prisma migrate deploy

# Création des utilisateurs admin
docker-compose exec backend node scripts/create-admin-user.mjs
```

### **2. Sauvegarde automatique**

```bash
# Script de sauvegarde
cat > /usr/local/bin/backup-bai.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

# Sauvegarde base de données
docker-compose exec -T postgres pg_dump -U bai_user bai_consulting > $BACKUP_DIR/db_$DATE.sql

# Sauvegarde fichiers uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads/

# Nettoyage anciennes sauvegardes (30 jours)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-bai.sh

# Cron job quotidien
echo "0 2 * * * /usr/local/bin/backup-bai.sh" | sudo crontab -
```

### **3. Monitoring et alertes**

```bash
# Installation de monitoring
sudo apt install -y htop iotop nethogs

# Script de monitoring
cat > /usr/local/bin/monitor-bai.sh << 'EOF'
#!/bin/bash
echo "=== BAI Consulting Status ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo "Disk Usage: $(df -h /)"
echo "Memory Usage: $(free -h)"
echo "Docker Status:"
docker-compose ps
echo "Service Health:"
curl -s http://localhost:3001/api/admin/auth/health | jq .
EOF

chmod +x /usr/local/bin/monitor-bai.sh
```

### **4. Mise à jour automatique**

```bash
# Script de mise à jour
cat > /usr/local/bin/update-bai.sh << 'EOF'
#!/bin/bash
cd /opt/bai-consulting
git pull origin main
docker-compose down
docker-compose up -d --build
docker system prune -f
EOF

chmod +x /usr/local/bin/update-bai.sh
```

## 📊 Vérification du Déploiement

### **Tests de sécurité**

```bash
# Test SSL
curl -I https://votre-domaine.com

# Test API
curl -H "Content-Type: application/json" https://votre-domaine.com/api/admin/auth/health

# Test de charge
ab -n 1000 -c 10 https://votre-domaine.com/
```

### **Monitoring en temps réel**

```bash
# Logs en temps réel
docker-compose logs -f

# Métriques système
htop
iotop
nethogs
```

## 🚨 Procédures d'Urgence

### **En cas de problème**

```bash
# Redémarrage des services
docker-compose restart

# Redémarrage complet
docker-compose down && docker-compose up -d

# Restauration depuis sauvegarde
docker-compose exec postgres psql -U bai_user -d bai_consulting < /backups/db_YYYYMMDD_HHMMSS.sql
```

### **Contacts d'urgence**

- **Administrateur système** : admin@votre-domaine.com
- **Support technique** : support@votre-domaine.com
- **Sécurité** : security@votre-domaine.com

## 📈 Optimisations Performance

### **Configuration Redis**

```bash
# Optimisation Redis
docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### **Configuration PostgreSQL**

```sql
-- Optimisations PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

## 🔐 Checklist de Sécurité

- [ ] Firewall configuré et activé
- [ ] SSL/TLS configuré avec certificats valides
- [ ] Secrets générés et stockés de manière sécurisée
- [ ] Base de données PostgreSQL avec utilisateur dédié
- [ ] Redis avec mot de passe
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring et alertes en place
- [ ] Mises à jour automatiques configurées
- [ ] Tests de sécurité effectués
- [ ] Documentation mise à jour

## 📞 Support

Pour toute question ou problème :
- **Documentation** : [docs.votre-domaine.com](https://docs.votre-domaine.com)
- **Support** : support@votre-domaine.com
- **Urgences** : +33 1 23 45 67 89
