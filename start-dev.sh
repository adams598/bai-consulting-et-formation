#!/bin/bash

# Script pour démarrer le backend et le frontend en mode développement
# Backend sur le port 3000, Frontend sur le port 3001

echo "🚀 Démarrage de l'environnement de développement BAI Consulting"
echo "================================================================"

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si on est dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -f "backend/package.json" ]; then
    echo -e "${YELLOW}⚠️  Veuillez exécuter ce script depuis la racine du projet${NC}"
    exit 1
fi

# Fonction pour démarrer le backend
start_backend() {
    echo -e "${BLUE}🔧 Démarrage du backend sur le port 3000...${NC}"
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Backend démarré (PID: $BACKEND_PID)${NC}"
}

# Fonction pour démarrer le frontend
start_frontend() {
    echo -e "${BLUE}🎨 Démarrage du frontend sur le port 3001...${NC}"
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Frontend démarré (PID: $FRONTEND_PID)${NC}"
}

# Fonction pour arrêter les serveurs
cleanup() {
    echo -e "\n${YELLOW}🛑 Arrêt des serveurs...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend arrêté${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend arrêté${NC}"
    fi
    exit 0
}

# Capturer Ctrl+C pour arrêter proprement
trap cleanup SIGINT

# Vérifier les dépendances
echo -e "${YELLOW}📦 Vérification des dépendances...${NC}"

# Vérifier le backend
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances backend...${NC}"
    cd backend
    npm install
    cd ..
fi

# Vérifier le frontend
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances frontend...${NC}"
    cd frontend
    npm install
    cd ..
fi

echo -e "${GREEN}✅ Dépendances vérifiées${NC}"

# Démarrer les serveurs
start_backend
sleep 2
start_frontend

echo -e "\n${GREEN}🎉 Environnement de développement prêt !${NC}"
echo -e "${BLUE}📍 URLs d'accès :${NC}"
echo -e "   🌐 Frontend (Admin) : ${GREEN}http://localhost:3001/admin/login${NC}"
echo -e "   🌐 Frontend (Formation) : ${GREEN}http://localhost:3001/formation/login${NC}"
echo -e "   🔧 Backend API : ${GREEN}http://localhost:3000${NC}"
echo -e "\n${YELLOW}💡 Appuyez sur Ctrl+C pour arrêter les serveurs${NC}"

# Attendre que les serveurs soient prêts
sleep 5

# Vérifier que les serveurs sont bien démarrés
echo -e "\n${BLUE}🔍 Vérification des serveurs...${NC}"

# Vérifier le backend
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Backend accessible sur http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend non accessible sur http://localhost:3000${NC}"
fi

# Vérifier le frontend
if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✅ Frontend accessible sur http://localhost:3001${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend non accessible sur http://localhost:3001${NC}"
fi

echo -e "\n${BLUE}🚀 Prêt à développer !${NC}"

# Attendre indéfiniment
wait 