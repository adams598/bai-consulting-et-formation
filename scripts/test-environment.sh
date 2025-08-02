#!/bin/bash

# Script bash pour démarrer l'environnement de test BAI Consulting
# Usage: ./scripts/test-environment.sh [start|stop|restart|status|logs|clean]

set -e

ACTION=${1:-start}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.test.yml"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérifier si Docker est installé
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé ou n'est pas accessible"
        exit 1
    fi
}

# Vérifier si Docker Compose est installé
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé ou n'est pas accessible"
        exit 1
    fi
}

# Démarrer l'environnement de test
start_test_environment() {
    log_info "Démarrage de l'environnement de test..."
    
    check_docker
    check_docker_compose
    
    # Vérifier si le fichier docker-compose.test.yml existe
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "Le fichier docker-compose.test.yml n'existe pas"
        exit 1
    fi
    
    # Démarrer les services
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml up -d
    
    log_info "Environnement de test démarré avec succès!"
    log_info "Services disponibles:"
    log_info "  - Frontend: http://localhost:3003"
    log_info "  - Backend: http://localhost:3002"
    log_info "  - Nginx: http://localhost:8080"
    log_info "  - PostgreSQL: localhost:5433"
    
    # Attendre que les services soient prêts
    log_info "Attente du démarrage des services..."
    sleep 10
    
    # Vérifier le statut des services
    docker-compose -f docker-compose.test.yml ps
}

# Arrêter l'environnement de test
stop_test_environment() {
    log_info "Arrêt de l'environnement de test..."
    
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml down
    
    log_info "Environnement de test arrêté avec succès!"
}

# Redémarrer l'environnement de test
restart_test_environment() {
    log_info "Redémarrage de l'environnement de test..."
    stop_test_environment
    sleep 5
    start_test_environment
}

# Afficher le statut de l'environnement de test
get_test_environment_status() {
    log_info "Statut de l'environnement de test..."
    
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml ps
}

# Afficher les logs de l'environnement de test
show_test_environment_logs() {
    log_info "Affichage des logs de l'environnement de test..."
    
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml logs -f
}

# Nettoyer l'environnement de test
clean_test_environment() {
    log_warning "Nettoyage complet de l'environnement de test..."
    log_warning "Cette action supprimera tous les conteneurs, volumes et images de test"
    
    read -p "Êtes-vous sûr de vouloir continuer? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$PROJECT_ROOT"
        docker-compose -f docker-compose.test.yml down -v --rmi all
        
        log_info "Environnement de test nettoyé avec succès!"
    else
        log_info "Nettoyage annulé"
    fi
}

# Exécution de l'action demandée
case $ACTION in
    "start")
        start_test_environment
        ;;
    "stop")
        stop_test_environment
        ;;
    "restart")
        restart_test_environment
        ;;
    "status")
        get_test_environment_status
        ;;
    "logs")
        show_test_environment_logs
        ;;
    "clean")
        clean_test_environment
        ;;
    *)
        log_error "Action inconnue: $ACTION"
        log_info "Actions disponibles: start, stop, restart, status, logs, clean"
        exit 1
        ;;
esac 