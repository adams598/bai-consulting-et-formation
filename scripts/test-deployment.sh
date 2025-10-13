#!/bin/bash

# Script de test de déploiement pour BAI Consulting
# Usage: ./scripts/test-deployment.sh [domain]

set -e

DOMAIN=${1:-"localhost"}
BASE_URL="http://$DOMAIN"
API_URL="http://$DOMAIN:3001"

echo "🧪 Tests de déploiement BAI Consulting"
echo "====================================="
echo "🌐 Domaine: $DOMAIN"
echo "🔗 Base URL: $BASE_URL"
echo "🔗 API URL: $API_URL"
echo ""

# Couleurs pour les tests
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de test
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -n "🔍 Test $name... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✅ OK ($response)${NC}"
            return 0
        else
            echo -e "${RED}❌ FAIL ($response, attendu: $expected_status)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ FAIL (connexion impossible)${NC}"
        return 1
    fi
}

# Fonction de test avec contenu
test_endpoint_content() {
    local name="$1"
    local url="$2"
    local expected_content="$3"
    
    echo -n "🔍 Test $name... "
    
    if response=$(curl -s "$url" 2>/dev/null); then
        if echo "$response" | grep -q "$expected_content"; then
            echo -e "${GREEN}✅ OK${NC}"
            return 0
        else
            echo -e "${RED}❌ FAIL (contenu non trouvé)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ FAIL (connexion impossible)${NC}"
        return 1
    fi
}

# Compteurs
total_tests=0
passed_tests=0

# Tests des services Docker
echo "🐳 Tests des services Docker"
echo "----------------------------"

# Test PostgreSQL
if docker exec bai-postgres-prod pg_isready -U bai_user -d bai_consulting > /dev/null 2>&1; then
    echo -e "🔍 Test PostgreSQL... ${GREEN}✅ OK${NC}"
    ((passed_tests++))
else
    echo -e "🔍 Test PostgreSQL... ${RED}❌ FAIL${NC}"
fi
((total_tests++))

# Test Redis
if docker exec bai-redis-prod redis-cli ping > /dev/null 2>&1; then
    echo -e "🔍 Test Redis... ${GREEN}✅ OK${NC}"
    ((passed_tests++))
else
    echo -e "🔍 Test Redis... ${RED}❌ FAIL${NC}"
fi
((total_tests++))

# Test des conteneurs
if docker-compose -f docker-compose.postgresql.yml ps | grep -q "Up"; then
    echo -e "🔍 Test Conteneurs... ${GREEN}✅ OK${NC}"
    ((passed_tests++))
else
    echo -e "🔍 Test Conteneurs... ${RED}❌ FAIL${NC}"
fi
((total_tests++))

echo ""

# Tests HTTP/HTTPS
echo "🌐 Tests HTTP/HTTPS"
echo "-------------------"

# Test HTTP Frontend
if test_endpoint "Frontend HTTP" "$BASE_URL/health" 200; then
    ((passed_tests++))
fi
((total_tests++))

# Test HTTPS Frontend (si certificats disponibles)
if [ -f ssl/server.crt ] && [ -f ssl/server.key ]; then
    if test_endpoint "Frontend HTTPS" "https://$DOMAIN/health" 200; then
        ((passed_tests++))
    fi
    ((total_tests++))
else
    echo -e "🔍 Test Frontend HTTPS... ${YELLOW}⚠️ SKIP (pas de certificats)${NC}"
fi

# Test API Backend
if test_endpoint "API Backend" "$API_URL/api/admin/auth/health" 200; then
    ((passed_tests++))
fi
((total_tests++))

echo ""

# Tests de fonctionnalités
echo "⚙️ Tests de fonctionnalités"
echo "---------------------------"

# Test de la page d'accueil
if test_endpoint_content "Page d'accueil" "$BASE_URL" "BAI Consulting"; then
    ((passed_tests++))
fi
((total_tests++))

# Test de l'API de santé
if test_endpoint_content "API Santé" "$API_URL/api/admin/auth/health" "healthy"; then
    ((passed_tests++))
fi
((total_tests++))

# Test de l'API de métriques (si authentifié)
if test_endpoint "API Métriques" "$API_URL/api/admin/monitoring/metrics" 401; then
    ((passed_tests++))
fi
((total_tests++))

echo ""

# Tests de sécurité
echo "🔒 Tests de sécurité"
echo "-------------------"

# Test des headers de sécurité
echo -n "🔍 Test Headers de sécurité... "
if headers=$(curl -s -I "$BASE_URL" 2>/dev/null); then
    security_headers=0
    if echo "$headers" | grep -q "X-Frame-Options"; then ((security_headers++)); fi
    if echo "$headers" | grep -q "X-Content-Type-Options"; then ((security_headers++)); fi
    if echo "$headers" | grep -q "X-XSS-Protection"; then ((security_headers++)); fi
    
    if [ $security_headers -ge 2 ]; then
        echo -e "${GREEN}✅ OK ($security_headers/3 headers)${NC}"
        ((passed_tests++))
    else
        echo -e "${RED}❌ FAIL ($security_headers/3 headers)${NC}"
    fi
else
    echo -e "${RED}❌ FAIL (connexion impossible)${NC}"
fi
((total_tests++))

# Test de rate limiting
echo -n "🔍 Test Rate Limiting... "
if response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/admin/auth/login" -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' 2>/dev/null); then
    if [ "$response" = "429" ] || [ "$response" = "400" ]; then
        echo -e "${GREEN}✅ OK ($response)${NC}"
        ((passed_tests++))
    else
        echo -e "${YELLOW}⚠️ PARTIAL ($response)${NC}"
    fi
else
    echo -e "${RED}❌ FAIL (connexion impossible)${NC}"
fi
((total_tests++))

echo ""

# Tests de performance
echo "⚡ Tests de performance"
echo "----------------------"

# Test de temps de réponse
echo -n "🔍 Test Temps de réponse... "
if time_response=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/health" 2>/dev/null); then
    if (( $(echo "$time_response < 2.0" | bc -l) )); then
        echo -e "${GREEN}✅ OK (${time_response}s)${NC}"
        ((passed_tests++))
    else
        echo -e "${YELLOW}⚠️ SLOW (${time_response}s)${NC}"
    fi
else
    echo -e "${RED}❌ FAIL (connexion impossible)${NC}"
fi
((total_tests++))

# Test de charge simple
echo -n "🔍 Test Charge simple... "
success_count=0
for i in {1..10}; do
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null | grep -q "200"; then
        ((success_count++))
    fi
done

if [ $success_count -ge 8 ]; then
    echo -e "${GREEN}✅ OK ($success_count/10)${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ FAIL ($success_count/10)${NC}"
fi
((total_tests++))

echo ""

# Tests de base de données
echo "🗄️ Tests de base de données"
echo "--------------------------"

# Test de connexion PostgreSQL
echo -n "🔍 Test Connexion PostgreSQL... "
if docker exec bai-postgres-prod psql -U bai_user -d bai_consulting -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ FAIL${NC}"
fi
((total_tests++))

# Test des tables
echo -n "🔍 Test Tables PostgreSQL... "
if tables=$(docker exec bai-postgres-prod psql -U bai_user -d bai_consulting -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null); then
    if [ "$tables" -gt 0 ]; then
        echo -e "${GREEN}✅ OK ($tables tables)${NC}"
        ((passed_tests++))
    else
        echo -e "${RED}❌ FAIL (0 tables)${NC}"
    fi
else
    echo -e "${RED}❌ FAIL (connexion impossible)${NC}"
fi
((total_tests++))

echo ""

# Résumé des tests
echo "📊 Résumé des tests"
echo "=================="
echo -e "Total des tests: $total_tests"
echo -e "Tests réussis: ${GREEN}$passed_tests${NC}"
echo -e "Tests échoués: ${RED}$((total_tests - passed_tests))${NC}"
echo -e "Taux de réussite: $(( passed_tests * 100 / total_tests ))%"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n🎉 ${GREEN}Tous les tests sont passés ! Déploiement réussi !${NC}"
    exit 0
elif [ $passed_tests -ge $((total_tests * 80 / 100)) ]; then
    echo -e "\n⚠️ ${YELLOW}La plupart des tests sont passés. Déploiement acceptable.${NC}"
    exit 0
else
    echo -e "\n❌ ${RED}Trop de tests ont échoué. Déploiement problématique.${NC}"
    exit 1
fi












