#!/bin/bash

# Script de test DNS pour BAI Consulting
# Usage: ./scripts/test-dns.sh [domain] [expected_ip]

set -e

DOMAIN=${1:-"votre-domaine.com"}
EXPECTED_IP=${2:-$(curl -s ifconfig.me)}

echo "🔍 Test DNS pour BAI Consulting"
echo "==============================="
echo "🌐 Domaine: $DOMAIN"
echo "🖥️  IP attendue: $EXPECTED_IP"
echo ""

# Couleurs pour les tests
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de test
test_dns_record() {
    local domain=$1
    local expected_ip=$2
    local description=$3
    
    echo -n "🔍 Test $description ($domain)... "
    
    # Test avec dig
    ip=$(dig +short $domain | head -n1)
    
    if [ "$ip" = "$expected_ip" ]; then
        echo -e "${GREEN}✅ OK ($ip)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL ($ip, attendu: $expected_ip)${NC}"
        return 1
    fi
}

# Fonction de test de connectivité
test_connectivity() {
    local domain=$1
    local description=$2
    
    echo -n "🌐 Test connectivité $description ($domain)... "
    
    # Test HTTP
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$domain" 2>/dev/null || echo "000")
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
        echo -e "${GREEN}✅ OK (HTTP $http_code)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $http_code)${NC}"
        return 1
    fi
}

# Fonction de test HTTPS
test_https() {
    local domain=$1
    local description=$2
    
    echo -n "🔒 Test HTTPS $description ($domain)... "
    
    # Test HTTPS
    https_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" 2>/dev/null || echo "000")
    
    if [ "$https_code" = "200" ] || [ "$https_code" = "301" ] || [ "$https_code" = "302" ]; then
        echo -e "${GREEN}✅ OK (HTTPS $https_code)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTPS $https_code)${NC}"
        return 1
    fi
}

# Fonction de test de propagation DNS
test_dns_propagation() {
    local domain=$1
    local expected_ip=$2
    
    echo "🌍 Test de propagation DNS pour $domain"
    echo "======================================"
    
    # Serveurs DNS publics
    dns_servers=(
        "8.8.8.8:Google DNS"
        "1.1.1.1:Cloudflare DNS"
        "208.67.222.222:OpenDNS"
        "9.9.9.9:Quad9 DNS"
        "8.8.4.4:Google DNS Alt"
    )
    
    for dns_server in "${dns_servers[@]}"; do
        server_ip=$(echo $dns_server | cut -d':' -f1)
        server_name=$(echo $dns_server | cut -d':' -f2)
        
        echo -n "🔍 Test avec $server_name ($server_ip)... "
        
        ip=$(dig @$server_ip +short $domain | head -n1)
        
        if [ "$ip" = "$expected_ip" ]; then
            echo -e "${GREEN}✅ OK ($ip)${NC}"
        else
            echo -e "${YELLOW}⚠️  DIFFÉRENT ($ip)${NC}"
        fi
    done
}

# Fonction de test de certificat SSL
test_ssl_certificate() {
    local domain=$1
    local description=$2
    
    echo -n "🔒 Test certificat SSL $description ($domain)... "
    
    # Test du certificat SSL
    cert_info=$(echo | openssl s_client -connect $domain:443 -servername $domain 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
    
    if [ -n "$cert_info" ]; then
        echo -e "${GREEN}✅ OK${NC}"
        echo "   📅 Détails du certificat:"
        echo "$cert_info" | sed 's/^/   /'
    else
        echo -e "${RED}❌ FAIL (pas de certificat SSL)${NC}"
    fi
}

# Fonction de test de performance
test_performance() {
    local domain=$1
    local description=$2
    
    echo -n "⚡ Test performance $description ($domain)... "
    
    # Test de temps de réponse
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "http://$domain" 2>/dev/null || echo "999")
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        echo -e "${GREEN}✅ OK (${response_time}s)${NC}"
    elif (( $(echo "$response_time < 5.0" | bc -l) )); then
        echo -e "${YELLOW}⚠️  LENT (${response_time}s)${NC}"
    else
        echo -e "${RED}❌ FAIL (${response_time}s)${NC}"
    fi
}

# Compteurs
total_tests=0
passed_tests=0

# Tests des enregistrements DNS
echo "📋 Tests des enregistrements DNS"
echo "==============================="

# Test du domaine principal
if test_dns_record "$DOMAIN" "$EXPECTED_IP" "Domaine principal"; then
    ((passed_tests++))
fi
((total_tests++))

# Test du sous-domaine www
if test_dns_record "www.$DOMAIN" "$EXPECTED_IP" "Sous-domaine www"; then
    ((passed_tests++))
fi
((total_tests++))

# Test du sous-domaine api
if test_dns_record "api.$DOMAIN" "$EXPECTED_IP" "Sous-domaine api"; then
    ((passed_tests++))
fi
((total_tests++))

# Test du sous-domaine admin
if test_dns_record "admin.$DOMAIN" "$EXPECTED_IP" "Sous-domaine admin"; then
    ((passed_tests++))
fi
((total_tests++))

echo ""

# Tests de connectivité
echo "🌐 Tests de connectivité"
echo "======================="

# Test HTTP du domaine principal
if test_connectivity "$DOMAIN" "Domaine principal"; then
    ((passed_tests++))
fi
((total_tests++))

# Test HTTP du sous-domaine www
if test_connectivity "www.$DOMAIN" "Sous-domaine www"; then
    ((passed_tests++))
fi
((total_tests++))

# Test HTTP du sous-domaine api
if test_connectivity "api.$DOMAIN" "Sous-domaine api"; then
    ((passed_tests++))
fi
((total_tests++))

# Test HTTP du sous-domaine admin
if test_connectivity "admin.$DOMAIN" "Sous-domaine admin"; then
    ((passed_tests++))
fi
((total_tests++))

echo ""

# Tests HTTPS
echo "🔒 Tests HTTPS"
echo "=============="

# Test HTTPS du domaine principal
if test_https "$DOMAIN" "Domaine principal"; then
    ((passed_tests++))
fi
((total_tests++))

# Test HTTPS du sous-domaine www
if test_https "www.$DOMAIN" "Sous-domaine www"; then
    ((passed_tests++))
fi
((total_tests++))

# Test HTTPS du sous-domaine api
if test_https "api.$DOMAIN" "Sous-domaine api"; then
    ((passed_tests++))
fi
((total_tests++))

# Test HTTPS du sous-domaine admin
if test_https "admin.$DOMAIN" "Sous-domaine admin"; then
    ((passed_tests++))
fi
((total_tests++))

echo ""

# Tests de certificats SSL
echo "🔐 Tests de certificats SSL"
echo "=========================="

# Test du certificat SSL du domaine principal
test_ssl_certificate "$DOMAIN" "Domaine principal"

# Test du certificat SSL du sous-domaine www
test_ssl_certificate "www.$DOMAIN" "Sous-domaine www"

# Test du certificat SSL du sous-domaine api
test_ssl_certificate "api.$DOMAIN" "Sous-domaine api"

# Test du certificat SSL du sous-domaine admin
test_ssl_certificate "admin.$DOMAIN" "Sous-domaine admin"

echo ""

# Tests de performance
echo "⚡ Tests de performance"
echo "====================="

# Test de performance du domaine principal
test_performance "$DOMAIN" "Domaine principal"

# Test de performance du sous-domaine www
test_performance "www.$DOMAIN" "Sous-domaine www"

# Test de performance du sous-domaine api
test_performance "api.$DOMAIN" "Sous-domaine api"

# Test de performance du sous-domaine admin
test_performance "admin.$DOMAIN" "Sous-domaine admin"

echo ""

# Test de propagation DNS
test_dns_propagation "$DOMAIN" "$EXPECTED_IP"

echo ""

# Tests avancés
echo "🔬 Tests avancés"
echo "==============="

# Test de redirection www
echo -n "🔄 Test redirection www... "
www_redirect=$(curl -s -o /dev/null -w "%{redirect_url}" "http://www.$DOMAIN" 2>/dev/null || echo "")
if [ -n "$www_redirect" ]; then
    echo -e "${GREEN}✅ OK ($www_redirect)${NC}"
else
    echo -e "${YELLOW}⚠️  Pas de redirection${NC}"
fi

# Test de redirection HTTPS
echo -n "🔄 Test redirection HTTPS... "
https_redirect=$(curl -s -o /dev/null -w "%{redirect_url}" "http://$DOMAIN" 2>/dev/null || echo "")
if [[ "$https_redirect" == https://* ]]; then
    echo -e "${GREEN}✅ OK ($https_redirect)${NC}"
else
    echo -e "${YELLOW}⚠️  Pas de redirection HTTPS${NC}"
fi

# Test de headers de sécurité
echo -n "🛡️ Test headers de sécurité... "
security_headers=$(curl -s -I "https://$DOMAIN" 2>/dev/null | grep -i "x-frame-options\|x-content-type-options\|x-xss-protection" | wc -l)
if [ "$security_headers" -ge 2 ]; then
    echo -e "${GREEN}✅ OK ($security_headers headers)${NC}"
else
    echo -e "${YELLOW}⚠️  Headers de sécurité manquants ($security_headers)${NC}"
fi

echo ""

# Résumé des tests
echo "📊 Résumé des tests"
echo "=================="
echo -e "Total des tests: $total_tests"
echo -e "Tests réussis: ${GREEN}$passed_tests${NC}"
echo -e "Tests échoués: ${RED}$((total_tests - passed_tests))${NC}"
success_rate=$(( passed_tests * 100 / total_tests ))
echo -e "Taux de réussite: $success_rate%"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n🎉 ${GREEN}Tous les tests sont passés ! Configuration DNS parfaite !${NC}"
    exit 0
elif [ $passed_tests -ge $((total_tests * 80 / 100)) ]; then
    echo -e "\n⚠️ ${YELLOW}La plupart des tests sont passés. Configuration DNS acceptable.${NC}"
    exit 0
else
    echo -e "\n❌ ${RED}Trop de tests ont échoué. Configuration DNS problématique.${NC}"
    exit 1
fi





















