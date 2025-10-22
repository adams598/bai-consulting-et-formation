#!/bin/bash

# Script de sauvegarde automatique pour BAI Consulting sur Hostinger
# Usage: ./scripts/backup-hostinger.sh [username] [host]

set -e

HOSTINGER_USER=${1:-"votre_utilisateur"}
HOSTINGER_HOST=${2:-"votre-serveur.hostinger.com"}

echo "💾 Sauvegarde BAI Consulting sur Hostinger"
echo "=========================================="
echo "🖥️  Serveur: $HOSTINGER_HOST"
echo "👤 Utilisateur: $HOSTINGER_USER"
echo ""

# Exécution de la sauvegarde sur le serveur
echo "🚀 Exécution de la sauvegarde sur le serveur..."
ssh $HOSTINGER_USER@$HOSTINGER_HOST << 'EOF'
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
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /home/votre_utilisateur/bai-consulting

# Sauvegarde de la configuration
echo "⚙️ Sauvegarde de la configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /home/votre_utilisateur/bai-consulting/.env /home/votre_utilisateur/bai-consulting/ecosystem.config.js

# Sauvegarde des logs
echo "📝 Sauvegarde des logs..."
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /home/votre_utilisateur/bai-consulting/logs

# Nettoyage des anciennes sauvegardes (30 jours)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Sauvegarde terminée: $BACKUP_DIR"
echo "📊 Taille des sauvegardes:"
du -h $BACKUP_DIR/*$DATE*
EOF

# Téléchargement des sauvegardes locales
echo "📥 Téléchargement des sauvegardes..."
mkdir -p backups/hostinger
scp -r $HOSTINGER_USER@$HOSTINGER_HOST:~/backups/* backups/hostinger/

echo "🎉 Sauvegarde terminée avec succès !"
echo "===================================="
echo "📁 Sauvegardes locales: backups/hostinger/"
echo "📁 Sauvegardes serveur: /home/$HOSTINGER_USER/backups/"
echo ""
echo "🔧 Commandes utiles:"
echo "Liste des sauvegardes: ssh $HOSTINGER_USER@$HOSTINGER_HOST 'ls -la ~/backups/'"
echo "Restauration DB: ssh $HOSTINGER_USER@$HOSTINGER_HOST 'gunzip -c ~/backups/postgres_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U bai_user bai_consulting_prod'"
echo "Restauration fichiers: ssh $HOSTINGER_USER@$HOSTINGER_HOST 'tar -xzf ~/backups/files_YYYYMMDD_HHMMSS.tar.gz -C /'"















