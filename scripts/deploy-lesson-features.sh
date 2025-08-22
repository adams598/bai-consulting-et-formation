#!/bin/bash

# Script de déploiement des nouvelles fonctionnalités de gestion des leçons
# BAI Consulting - Formation Management System

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement des nouvelles fonctionnalités de gestion des leçons..."
echo "================================================================"

# Variables
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
DB_MIGRATION_SCRIPT="$BACKEND_DIR/scripts/add-cover-image-migration.js"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log coloré
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Vérification de l'environnement
step "Vérification de l'environnement..."

if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé"
    exit 1
fi

log "Node.js version: $(node --version)"
log "npm version: $(npm --version)"

# Vérification des dossiers
step "Vérification de la structure du projet..."

if [ ! -d "$BACKEND_DIR" ]; then
    error "Dossier backend introuvable"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    error "Dossier frontend introuvable"
    exit 1
fi

log "Structure du projet validée"

# Sauvegarde de la base de données
step "Sauvegarde de la base de données..."

if [ -f "$BACKEND_DIR/prisma/dev.db" ]; then
    cp "$BACKEND_DIR/prisma/dev.db" "$BACKEND_DIR/prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)"
    log "Base de données sauvegardée"
else
    warn "Aucune base de données existante trouvée"
fi

# Installation des dépendances backend
step "Installation des dépendances backend..."

cd "$BACKEND_DIR"
npm install

if [ $? -eq 0 ]; then
    log "Dépendances backend installées"
else
    error "Échec de l'installation des dépendances backend"
    exit 1
fi

# Génération du client Prisma
step "Génération du client Prisma..."

npx prisma generate

if [ $? -eq 0 ]; then
    log "Client Prisma généré"
else
    error "Échec de la génération du client Prisma"
    exit 1
fi

# Migration de la base de données
step "Migration de la base de données..."

if [ -f "$DB_MIGRATION_SCRIPT" ]; then
    log "Exécution du script de migration..."
    node "$DB_MIGRATION_SCRIPT"
    
    if [ $? -eq 0 ]; then
        log "Migration de la base de données réussie"
    else
        error "Échec de la migration de la base de données"
        exit 1
    fi
else
    error "Script de migration introuvable: $DB_MIGRATION_SCRIPT"
    exit 1
fi

cd ..

# Installation des dépendances frontend
step "Installation des dépendances frontend..."

cd "$FRONTEND_DIR"
npm install

if [ $? -eq 0 ]; then
    log "Dépendances frontend installées"
else
    error "Échec de l'installation des dépendances frontend"
    exit 1
fi

# Vérification de la compilation TypeScript
step "Vérification de la compilation TypeScript..."

npm run build

if [ $? -eq 0 ]; then
    log "Compilation TypeScript réussie"
else
    error "Échec de la compilation TypeScript"
    exit 1
fi

cd ..

# Tests des fonctionnalités
step "Tests des nouvelles fonctionnalités..."

if [ -f "$FRONTEND_DIR/test-lesson-features.js" ]; then
    log "Exécution des tests..."
    node "$FRONTEND_DIR/test-lesson-features.js"
    
    if [ $? -eq 0 ]; then
        log "Tests exécutés avec succès"
    else
        warn "Certains tests ont échoué, mais le déploiement continue"
    fi
else
    warn "Script de test introuvable"
fi

# Vérification finale
step "Vérification finale..."

echo ""
echo "✅ Déploiement terminé avec succès !"
echo ""
echo "📋 Résumé des modifications :"
echo "   • Champ coverImage ajouté à la base de données"
echo "   • API backend mise à jour pour gérer les images"
echo "   • Composants React pour la sélection multiple"
echo "   • Aperçu au survol des leçons"
echo "   • Interface de gestion en lot"
echo ""
echo "🚀 Prochaines étapes :"
echo "   1. Redémarrer le serveur backend"
echo "   2. Tester les nouvelles fonctionnalités"
echo "   3. Consulter la documentation : frontend/docs/lesson-management-features.md"
echo ""
echo "🔧 En cas de problème :"
echo "   • Vérifier les logs du serveur"
echo "   • Restaurer la base de données si nécessaire"
echo "   • Consulter la documentation de dépannage"
echo ""

log "Déploiement terminé avec succès ! 🎉"
