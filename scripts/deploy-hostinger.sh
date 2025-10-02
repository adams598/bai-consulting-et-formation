#!/bin/bash

# Script de déploiement automatique sur Hostinger pour BAI Consulting
# Usage: ./scripts/deploy-hostinger.sh [domain] [username] [host]

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









