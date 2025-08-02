#!/bin/bash

# Script de déploiement Intranet Admin
# Usage: ./scripts/deploy-intranet.sh [serveur]

set -e

# Configuration
SERVER=${1:-"admin.bai-consulting.local"}
REMOTE_PATH="/var/www/admin.bai-consulting.local"
BACKUP_PATH="/var/backups/admin.bai-consulting.local"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Déploiement Intranet Admin - BAI Consulting${NC}"
echo -e "${BLUE}==============================================${NC}"

# Vérifications préalables
echo -e "${YELLOW}📋 Vérifications préalables...${NC}"

# Vérifier si on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Vous devez être dans le répertoire frontend${NC}"
    exit 1
fi

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Erreur: Node.js n'est pas installé${NC}"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Erreur: npm n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Vérifications terminées${NC}"

# Nettoyage
echo -e "${YELLOW}🧹 Nettoyage des builds précédents...${NC}"
rm -rf dist-admin
rm -rf node_modules/.vite

# Installation des dépendances
echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
npm ci --silent

# Build pour l'intranet
echo -e "${YELLOW}🔨 Build de l'application admin...${NC}"
npm run build:admin

# Vérification du build
if [ ! -d "dist-admin" ]; then
    echo -e "${RED}❌ Erreur: Le build a échoué${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build terminé avec succès${NC}"

# Création du backup
echo -e "${YELLOW}💾 Création du backup...${NC}"
ssh root@$SERVER "mkdir -p $BACKUP_PATH"
ssh root@$SERVER "if [ -d $REMOTE_PATH ]; then cp -r $REMOTE_PATH $BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S); fi"

# Déploiement
echo -e "${YELLOW}🚀 Déploiement sur le serveur...${NC}"
rsync -avz --delete dist-admin/ root@$SERVER:$REMOTE_PATH/

# Vérification du déploiement
echo -e "${YELLOW}🔍 Vérification du déploiement...${NC}"
if ssh root@$SERVER "[ -f $REMOTE_PATH/index.html ]"; then
    echo -e "${GREEN}✅ Déploiement réussi${NC}"
else
    echo -e "${RED}❌ Erreur: Le déploiement a échoué${NC}"
    exit 1
fi

# Redémarrage des services
echo -e "${YELLOW}🔄 Redémarrage des services...${NC}"
ssh root@$SERVER "systemctl reload nginx"

# Tests de connectivité
echo -e "${YELLOW}🧪 Tests de connectivité...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "https://$SERVER" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Site accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Le site pourrait ne pas être accessible immédiatement${NC}"
fi

# Nettoyage local
echo -e "${YELLOW}🧹 Nettoyage local...${NC}"
rm -rf dist-admin

echo -e "${GREEN}🎉 Déploiement terminé avec succès !${NC}"
echo -e "${BLUE}📍 URL: https://$SERVER${NC}"
echo -e "${BLUE}📅 Date: $(date)${NC}" 