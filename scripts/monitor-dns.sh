#!/bin/bash

# Script de monitoring DNS pour BAI Consulting
# Usage: ./scripts/monitor-dns.sh [domain] [expected_ip] [interval]

set -e

DOMAIN=${1:-"votre-domaine.com"}
EXPECTED_IP=${2:-$(curl -s ifconfig.me)}
INTERVAL=${3:-300} # 5 minutes par défaut

echo "📊 Monitoring DNS pour BAI Consulting"
echo "====================================="
echo "🌐 Domaine: $DOMAIN"
echo "🖥️  IP attendue: $EXPECTED_IP"
echo "⏰ Intervalle: $INTERVAL secondes"
echo ""

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fichier de log
LOG_FILE="/var/log/dns-monitor.log"
mkdir -p "$(dirname "$LOG_FILE")"

# Fonction de log
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[$timestamp] INFO: $message${NC}"
            ;;
        "WARN")
            echo -e "${YELLOW}[$timestamp] WARN: $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[$timestamp] ERROR: $message${NC}"
            ;;
        "DEBUG")
            echo -e "${BLUE}[$timestamp] DEBUG: $message${NC}"
            ;;
    esac
    
    echo "[$timestamp] $level: $message" >> "$LOG_FILE"
}

# Fonction de test DNS
test_dns_record() {
    local domain=$1
    local expected_ip=$2
    
    local ip=$(dig +short $domain | head -n1)
    
    if [ "$ip" = "$expected_ip" ]; then
        return 0
    else
        return 1
    fi
}

# Fonction de test de connectivité
test_connectivity() {
    local domain=$1
    
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$domain" 2>/dev/null || echo "000")
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
        return 0
    else
        return 1
    fi
}

# Fonction de test HTTPS
test_https() {
    local domain=$1
    
    local https_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" 2>/dev/null || echo "000")
    
    if [ "$https_code" = "200" ] || [ "$https_code" = "301" ] || [ "$https_code" = "302" ]; then
        return 0
    else
        return 1
    fi
}

# Fonction de test de certificat SSL
test_ssl_certificate() {
    local domain=$1
    
    local cert_info=$(echo | openssl s_client -connect $domain:443 -servername $domain 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
    
    if [ -n "$cert_info" ]; then
        return 0
    else
        return 1
    fi
}

# Fonction de test de performance
test_performance() {
    local domain=$1
    
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" "http://$domain" 2>/dev/null || echo "999")
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        return 0
    else
        return 1
    fi
}

# Fonction de test complet
run_full_test() {
    local domain=$1
    local expected_ip=$2
    local test_name=$3
    
    local dns_ok=0
    local http_ok=0
    local https_ok=0
    local ssl_ok=0
    local perf_ok=0
    
    # Test DNS
    if test_dns_record "$domain" "$expected_ip"; then
        dns_ok=1
    fi
    
    # Test HTTP
    if test_connectivity "$domain"; then
        http_ok=1
    fi
    
    # Test HTTPS
    if test_https "$domain"; then
        https_ok=1
    fi
    
    # Test SSL
    if test_ssl_certificate "$domain"; then
        ssl_ok=1
    fi
    
    # Test Performance
    if test_performance "$domain"; then
        perf_ok=1
    fi
    
    # Calcul du score
    local score=$((dns_ok + http_ok + https_ok + ssl_ok + perf_ok))
    local total=5
    
    # Log du résultat
    if [ $score -eq $total ]; then
        log_message "INFO" "$test_name: Tous les tests passés ($score/$total)"
    elif [ $score -ge 4 ]; then
        log_message "WARN" "$test_name: Tests majoritairement passés ($score/$total)"
    else
        log_message "ERROR" "$test_name: Tests échoués ($score/$total)"
    fi
    
    return $score
}

# Fonction d'alerte
send_alert() {
    local message=$1
    
    # Log de l'alerte
    log_message "ERROR" "ALERTE: $message"
    
    # Envoi d'email (si configuré)
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "Alerte DNS - $DOMAIN" "$ALERT_EMAIL"
    fi
    
    # Envoi de notification Slack (si configuré)
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Alerte DNS: $message\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    # Envoi de notification Discord (si configuré)
    if [ -n "$DISCORD_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"🚨 Alerte DNS: $message\"}" \
            "$DISCORD_WEBHOOK"
    fi
}

# Fonction de monitoring continu
monitor_continuous() {
    local domain=$1
    local expected_ip=$2
    local interval=$3
    
    log_message "INFO" "Démarrage du monitoring continu pour $domain"
    
    local previous_status=""
    local alert_count=0
    
    while true; do
        local current_status=""
        local all_ok=true
        
        # Test du domaine principal
        if run_full_test "$domain" "$expected_ip" "Domaine principal"; then
            current_status+="OK "
        else
            current_status+="FAIL "
            all_ok=false
        fi
        
        # Test du sous-domaine www
        if run_full_test "www.$domain" "$expected_ip" "Sous-domaine www"; then
            current_status+="OK "
        else
            current_status+="FAIL "
            all_ok=false
        fi
        
        # Test du sous-domaine api
        if run_full_test "api.$domain" "$expected_ip" "Sous-domaine api"; then
            current_status+="OK "
        else
            current_status+="FAIL "
            all_ok=false
        fi
        
        # Test du sous-domaine admin
        if run_full_test "admin.$domain" "$expected_ip" "Sous-domaine admin"; then
            current_status+="OK "
        else
            current_status+="FAIL "
            all_ok=false
        fi
        
        # Gestion des alertes
        if [ "$all_ok" = false ]; then
            alert_count=$((alert_count + 1))
            
            if [ $alert_count -eq 1 ]; then
                send_alert "Problème détecté sur $domain"
            elif [ $alert_count -eq 5 ]; then
                send_alert "Problème persistant sur $domain (5 tentatives)"
            elif [ $alert_count -eq 10 ]; then
                send_alert "Problème critique sur $domain (10 tentatives)"
            fi
        else
            if [ $alert_count -gt 0 ]; then
                log_message "INFO" "Problème résolu sur $domain"
                alert_count=0
            fi
        fi
        
        # Attente avant le prochain test
        sleep $interval
    done
}

# Fonction de test unique
run_single_test() {
    local domain=$1
    local expected_ip=$2
    
    log_message "INFO" "Exécution d'un test unique pour $domain"
    
    local total_score=0
    local total_tests=0
    
    # Test du domaine principal
    if run_full_test "$domain" "$expected_ip" "Domaine principal"; then
        total_score=$((total_score + $?))
    fi
    total_tests=$((total_tests + 5))
    
    # Test du sous-domaine www
    if run_full_test "www.$domain" "$expected_ip" "Sous-domaine www"; then
        total_score=$((total_score + $?))
    fi
    total_tests=$((total_tests + 5))
    
    # Test du sous-domaine api
    if run_full_test "api.$domain" "$expected_ip" "Sous-domaine api"; then
        total_score=$((total_score + $?))
    fi
    total_tests=$((total_tests + 5))
    
    # Test du sous-domaine admin
    if run_full_test "admin.$domain" "$expected_ip" "Sous-domaine admin"; then
        total_score=$((total_score + $?))
    fi
    total_tests=$((total_tests + 5))
    
    # Résumé
    local success_rate=$(( total_score * 100 / total_tests ))
    log_message "INFO" "Test terminé: $total_score/$total_tests ($success_rate%)"
    
    if [ $success_rate -ge 80 ]; then
        log_message "INFO" "Configuration DNS en bon état"
        exit 0
    else
        log_message "ERROR" "Configuration DNS problématique"
        exit 1
    fi
}

# Fonction d'affichage des logs
show_logs() {
    local lines=${1:-50}
    
    echo "📋 Derniers logs de monitoring DNS"
    echo "=================================="
    
    if [ -f "$LOG_FILE" ]; then
        tail -n $lines "$LOG_FILE"
    else
        echo "Aucun log trouvé"
    fi
}

# Fonction de nettoyage des logs
cleanup_logs() {
    local days=${1:-30}
    
    log_message "INFO" "Nettoyage des logs de plus de $days jours"
    
    if [ -f "$LOG_FILE" ]; then
        # Sauvegarde des logs récents
        cp "$LOG_FILE" "$LOG_FILE.backup"
        
        # Nettoyage des logs anciens
        find "$(dirname "$LOG_FILE")" -name "*.log" -mtime +$days -delete
        
        log_message "INFO" "Nettoyage terminé"
    fi
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 [OPTIONS] [DOMAIN] [EXPECTED_IP] [INTERVAL]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Afficher cette aide"
    echo "  -c, --continuous        Monitoring continu"
    echo "  -s, --single            Test unique"
    echo "  -l, --logs [LINES]      Afficher les logs (défaut: 50)"
    echo "  --cleanup [DAYS]        Nettoyer les logs (défaut: 30 jours)"
    echo "  --alert-email EMAIL     Email pour les alertes"
    echo "  --slack-webhook URL     Webhook Slack pour les alertes"
    echo "  --discord-webhook URL   Webhook Discord pour les alertes"
    echo ""
    echo "Exemples:"
    echo "  $0 -s votre-domaine.com 192.168.1.100"
    echo "  $0 -c votre-domaine.com 192.168.1.100 300"
    echo "  $0 -l 100"
    echo "  $0 --cleanup 7"
}

# Parsing des arguments
MODE="single"
ALERT_EMAIL=""
SLACK_WEBHOOK=""
DISCORD_WEBHOOK=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--continuous)
            MODE="continuous"
            shift
            ;;
        -s|--single)
            MODE="single"
            shift
            ;;
        -l|--logs)
            show_logs "$2"
            exit 0
            ;;
        --cleanup)
            cleanup_logs "$2"
            exit 0
            ;;
        --alert-email)
            ALERT_EMAIL="$2"
            shift 2
            ;;
        --slack-webhook)
            SLACK_WEBHOOK="$2"
            shift 2
            ;;
        --discord-webhook)
            DISCORD_WEBHOOK="$2"
            shift 2
            ;;
        *)
            break
            ;;
    esac
done

# Exécution selon le mode
case $MODE in
    "continuous")
        monitor_continuous "$DOMAIN" "$EXPECTED_IP" "$INTERVAL"
        ;;
    "single")
        run_single_test "$DOMAIN" "$EXPECTED_IP"
        ;;
    *)
        show_help
        exit 1
        ;;
esac




























