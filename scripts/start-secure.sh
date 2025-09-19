#!/bin/bash

# Script de démarrage sécurisé pour BAI Consulting
# Usage: ./scripts/start-secure.sh [dev|prod]

set -e  # Arrêter en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker (si mode production)
    if [ "$1" = "prod" ] && ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker Compose (si mode production)
    if [ "$1" = "prod" ] && ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Fonction pour vérifier les variables d'environnement
check_environment() {
    log "Vérification des variables d'environnement..."
    
    # Variables obligatoires
    required_vars=(
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "DATABASE_URL"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Variables d'environnement manquantes: ${missing_vars[*]}"
        log "Créez un fichier .env basé sur env.example"
        exit 1
    fi
    
    # Vérifier la force du JWT_SECRET
    if [ ${#JWT_SECRET} -lt 32 ]; then
        log_warning "JWT_SECRET est trop court (minimum 32 caractères)"
    fi
    
    log_success "Variables d'environnement vérifiées"
}

# Fonction pour installer les dépendances
install_dependencies() {
    log "Installation des dépendances..."
    
    # Backend
    if [ -f "backend/package.json" ]; then
        log "Installation des dépendances backend..."
        cd backend
        npm ci --only=production
        cd ..
        log_success "Dépendances backend installées"
    fi
    
    # Frontend
    if [ -f "frontend/package.json" ]; then
        log "Installation des dépendances frontend..."
        cd frontend
        npm ci --only=production
        cd ..
        log_success "Dépendances frontend installées"
    fi
}

# Fonction pour vérifier la base de données
check_database() {
    log "Vérification de la base de données..."
    
    # Vérifier si la base de données existe
    if [ ! -f "backend/prisma/dev.db" ] && [[ "$DATABASE_URL" == *"file:"* ]]; then
        log "Initialisation de la base de données SQLite..."
        cd backend
        npx prisma db push
        npx prisma db seed
        cd ..
        log_success "Base de données initialisée"
    fi
    
    # Vérifier les migrations
    if [ -d "backend/prisma/migrations" ]; then
        log "Vérification des migrations..."
        cd backend
        npx prisma migrate status
        cd ..
        log_success "Migrations vérifiées"
    fi
}

# Fonction pour démarrer Redis
start_redis() {
    log "Démarrage de Redis..."
    
    if command -v redis-server &> /dev/null; then
        # Redis local
        redis-server --daemonize yes --port 6379
        log_success "Redis démarré localement"
    elif command -v docker &> /dev/null; then
        # Redis avec Docker
        docker run -d --name bai-redis -p 6379:6379 redis:7-alpine
        log_success "Redis démarré avec Docker"
    else
        log_warning "Redis non disponible - le cache sera désactivé"
    fi
}

# Fonction pour démarrer en mode développement
start_dev() {
    log "Démarrage en mode développement..."
    
    # Démarrer Redis
    start_redis
    
    # Démarrer le backend
    log "Démarrage du backend..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Attendre que le backend soit prêt
    sleep 5
    
    # Démarrer le frontend
    log "Démarrage du frontend..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    log_success "Application démarrée en mode développement"
    log "Backend: http://localhost:3000"
    log "Frontend: http://localhost:3001"
    log "Health Check: http://localhost:3000/api/admin/auth/health"
    
    # Fonction de nettoyage
    cleanup() {
        log "Arrêt de l'application..."
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        docker stop bai-redis 2>/dev/null || true
        docker rm bai-redis 2>/dev/null || true
        log_success "Application arrêtée"
        exit 0
    }
    
    # Capturer les signaux d'arrêt
    trap cleanup SIGINT SIGTERM
    
    # Attendre
    wait
}

# Fonction pour démarrer en mode production
start_prod() {
    log "Démarrage en mode production..."
    
    # Vérifier que Docker est disponible
    if ! command -v docker &> /dev/null; then
        log_error "Docker est requis pour le mode production"
        exit 1
    fi
    
    # Construire les images
    log "Construction des images Docker..."
    docker-compose -f docker-compose.yml build
    
    # Démarrer les services
    log "Démarrage des services..."
    docker-compose -f docker-compose.yml up -d
    
    log_success "Application démarrée en mode production"
    log "Frontend: http://localhost:80"
    log "Backend: http://localhost:3001"
    log "Health Check: http://localhost:3001/api/admin/auth/health"
    
    # Afficher les logs
    docker-compose -f docker-compose.yml logs -f
}

# Fonction principale
main() {
    local mode=${1:-dev}
    
    log "🚀 Démarrage de BAI Consulting en mode $mode"
    
    # Vérifications préliminaires
    check_prerequisites "$mode"
    
    # Charger les variables d'environnement
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    check_environment
    
    # Actions selon le mode
    case $mode in
        "dev")
            install_dependencies
            check_database
            start_dev
            ;;
        "prod")
            start_prod
            ;;
        *)
            log_error "Mode invalide: $mode. Utilisez 'dev' ou 'prod'"
            exit 1
            ;;
    esac
}

# Exécution
main "$@"
