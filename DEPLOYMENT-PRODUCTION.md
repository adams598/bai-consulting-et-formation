# 🚀 Guide de Déploiement Production - BAI Consulting

## 📋 Prérequis Système

### **Serveur Minimum**
- **CPU** : 2 cœurs
- **RAM** : 4 GB
- **Stockage** : 50 GB SSD
- **OS** : Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### **Logiciels Requis**
- Docker 20.10+
- Docker Compose 2.0+
- Git
- Curl
- OpenSSL

## 🔧 Installation des Prérequis

### **Ubuntu/Debian**
```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation de Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Installation des outils
sudo apt install -y git curl openssl ufw
```

### **CentOS/RHEL**
```bash
# Mise à jour du système
sudo yum update -y

# Installation de Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Installation de Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Installation des outils
sudo yum install -y git curl openssl firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld
```

## 🚀 Déploiement Automatique

### **1. Clonage du Repository**
```bash
# Cloner le projet
git clone <votre-repo-url>
cd bai-consulting

# Rendre le script exécutable
chmod +x scripts/deploy-production.sh
```

### **2. Déploiement Complet**
```bash
# Déploiement automatique
./scripts/deploy-production.sh votre-domaine.com admin@votre-domaine.com

# Ou avec IP spécifique
./scripts/deploy-production.sh votre-domaine.com admin@votre-domaine.com 192.168.1.100
```

### **3. Vérification du Déploiement**
```bash
# Vérification des services
docker-compose -f docker-compose.postgresql.yml ps

# Vérification des logs
docker-compose -f docker-compose.postgresql.yml logs -f

# Test de santé
curl http://localhost/health
curl http://localhost:3001/api/admin/auth/health
```

## 🔒 Configuration SSL avec Let's Encrypt

### **1. Installation de Certbot**
```bash
# Ubuntu/Debian
sudo apt install -y certbot

# CentOS/RHEL
sudo yum install -y certbot
```

### **2. Génération des Certificats**
```bash
# Arrêt temporaire de Nginx
docker-compose -f docker-compose.postgresql.yml stop frontend

# Génération des certificats
sudo certbot certonly --standalone \
    --email admin@votre-domaine.com \
    --agree-tos \
    --no-eff-email \
    -d votre-domaine.com \
    -d www.votre-domaine.com \
    -d api.votre-domaine.com \
    -d admin.votre-domaine.com

# Copie des certificats
sudo cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem ssl/server.crt
sudo cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem ssl/server.key
sudo chown $USER:$USER ssl/server.crt ssl/server.key
```

### **3. Configuration du Renouvellement Automatique**
```bash
# Script de renouvellement
cat > /usr/local/bin/renew-ssl-bai.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem /path/to/bai-consulting/ssl/server.crt
cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem /path/to/bai-consulting/ssl/server.key
docker-compose -f /path/to/bai-consulting/docker-compose.postgresql.yml restart frontend
EOF

chmod +x /usr/local/bin/renew-ssl-bai.sh

# Ajout au crontab (renouvellement hebdomadaire)
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/renew-ssl-bai.sh") | crontab -
```

## 🌐 Configuration DNS

### **Enregistrements DNS Requis**
```
Type    Nom                    Valeur
A       votre-domaine.com      IP_DU_SERVEUR
A       www.votre-domaine.com  IP_DU_SERVEUR
A       api.votre-domaine.com  IP_DU_SERVEUR
A       admin.votre-domaine.com IP_DU_SERVEUR
CNAME   *.votre-domaine.com    votre-domaine.com
```

### **Vérification DNS**
```bash
# Vérification des enregistrements
nslookup votre-domaine.com
nslookup api.votre-domaine.com
nslookup admin.votre-domaine.com

# Test de résolution
ping votre-domaine.com
```

## 🔥 Configuration du Firewall

### **UFW (Ubuntu/Debian)**
```bash
# Configuration UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# Vérification
sudo ufw status
```

### **Firewalld (CentOS/RHEL)**
```bash
# Configuration Firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Vérification
sudo firewall-cmd --list-all
```

## 📊 Monitoring et Alertes

### **1. Installation de Monitoring**
```bash
# Installation de htop pour le monitoring système
sudo apt install -y htop iotop nethogs

# Installation de Docker stats
docker stats --no-stream
```

### **2. Configuration des Alertes**
```bash
# Script de monitoring avancé
cat > /usr/local/bin/monitor-bai-advanced.sh << 'EOF'
#!/bin/bash

# Seuils d'alerte
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90

# Vérification CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$CPU_USAGE > $CPU_THRESHOLD" | bc -l) )); then
    echo "ALERTE: CPU usage élevé: ${CPU_USAGE}%"
fi

# Vérification mémoire
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt $MEMORY_THRESHOLD ]; then
    echo "ALERTE: Mémoire usage élevé: ${MEMORY_USAGE}%"
fi

# Vérification espace disque
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt $DISK_THRESHOLD ]; then
    echo "ALERTE: Espace disque critique: ${DISK_USAGE}%"
fi

# Vérification des conteneurs
if ! docker-compose -f /path/to/docker-compose.postgresql.yml ps | grep -q "Up"; then
    echo "ALERTE: Conteneurs non fonctionnels"
fi
EOF

chmod +x /usr/local/bin/monitor-bai-advanced.sh

# Surveillance toutes les 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/monitor-bai-advanced.sh >> /var/log/bai-alerts.log 2>&1") | crontab -
```

## 💾 Sauvegardes et Récupération

### **1. Sauvegarde Automatique**
```bash
# Le script de sauvegarde est déjà configuré par deploy-production.sh
# Sauvegarde quotidienne à 2h00

# Sauvegarde manuelle
/usr/local/bin/backup-bai.sh
```

### **2. Récupération depuis Sauvegarde**
```bash
# Restauration PostgreSQL
gunzip -c /backups/postgres_YYYYMMDD_HHMMSS.sql.gz | docker exec -i bai-postgres-prod psql -U bai_user -d bai_consulting

# Restauration des uploads
tar -xzf /backups/uploads_YYYYMMDD_HHMMSS.tar.gz

# Restauration de la configuration
tar -xzf /backups/config_YYYYMMDD_HHMMSS.tar.gz
```

## 🔧 Maintenance et Mises à Jour

### **1. Mise à Jour de l'Application**
```bash
# Arrêt des services
docker-compose -f docker-compose.postgresql.yml down

# Sauvegarde avant mise à jour
/usr/local/bin/backup-bai.sh

# Mise à jour du code
git pull origin main

# Reconstruction des images
docker-compose -f docker-compose.postgresql.yml build --no-cache

# Redémarrage
docker-compose -f docker-compose.postgresql.yml up -d
```

### **2. Mise à Jour du Système**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y

# Redémarrage si nécessaire
sudo reboot
```

## 🚨 Procédures d'Urgence

### **En cas de Panne**
```bash
# Redémarrage des services
docker-compose -f docker-compose.postgresql.yml restart

# Redémarrage complet
docker-compose -f docker-compose.postgresql.yml down
docker-compose -f docker-compose.postgresql.yml up -d

# Vérification des logs
docker-compose -f docker-compose.postgresql.yml logs --tail=100
```

### **En cas de Problème de Performance**
```bash
# Vérification des ressources
docker stats
htop
iotop

# Nettoyage des logs
docker system prune -f

# Redémarrage des conteneurs problématiques
docker-compose -f docker-compose.postgresql.yml restart backend
```

## 📞 Support et Contacts

### **En cas de Problème**
1. **Vérifier les logs** : `docker-compose logs -f`
2. **Vérifier les ressources** : `docker stats`
3. **Tester la connectivité** : `curl -I http://localhost/health`
4. **Contacter le support** : support@bai-consulting.com

### **Informations de Débogage**
```bash
# Informations système
uname -a
docker version
docker-compose version

# Informations des conteneurs
docker-compose -f docker-compose.postgresql.yml ps
docker-compose -f docker-compose.postgresql.yml logs --tail=50

# Informations réseau
netstat -tuln
ss -tuln
```

## ✅ Checklist de Déploiement

- [ ] Serveur configuré avec les prérequis
- [ ] Docker et Docker Compose installés
- [ ] Repository cloné
- [ ] Script de déploiement exécuté
- [ ] Services démarrés et fonctionnels
- [ ] SSL configuré (Let's Encrypt)
- [ ] DNS configuré et propagé
- [ ] Firewall configuré
- [ ] Monitoring en place
- [ ] Sauvegardes automatiques configurées
- [ ] Tests de fonctionnalité effectués
- [ ] Documentation mise à jour

## 🎯 Optimisations Post-Déploiement

### **Performance**
- Configuration du cache Redis
- Optimisation des requêtes PostgreSQL
- Compression des assets statiques
- CDN pour les médias

### **Sécurité**
- Audit de sécurité régulier
- Mise à jour des dépendances
- Surveillance des logs de sécurité
- Tests de pénétration

### **Scalabilité**
- Load balancing
- Clustering de base de données
- Cache distribué
- Microservices





















