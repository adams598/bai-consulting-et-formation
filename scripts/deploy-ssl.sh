#!/bin/bash

# Script de déploiement SSL/TLS pour BAI Consulting
# Usage: ./scripts/deploy-ssl.sh [domain] [email]

set -e

DOMAIN=${1:-"localhost"}
EMAIL=${2:-"admin@bai-consulting.com"}
CERT_DIR="./ssl"
NGINX_CONF="./frontend/nginx-ssl.conf"

echo "🔒 Déploiement SSL/TLS pour $DOMAIN"
echo "=================================="

# Vérification des prérequis
echo "🔍 Vérification des prérequis..."

if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL n'est pas installé"
    exit 1
fi

if ! command -v certbot &> /dev/null; then
    echo "⚠️  Certbot n'est pas installé (optionnel pour Let's Encrypt)"
fi

# Création du répertoire SSL
mkdir -p "$CERT_DIR"

# Génération des certificats selon l'environnement
if [ "$DOMAIN" = "localhost" ]; then
    echo "🛠️ Génération de certificats auto-signés pour le développement..."
    
    # Génération de la clé privée
    openssl genrsa -out "$CERT_DIR/server.key" 2048
    
    # Génération du certificat avec SAN pour localhost
    cat > "$CERT_DIR/server.conf" << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = FR
ST = France
L = Paris
O = BAI Consulting
OU = IT Department
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

    openssl req -new -x509 -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.crt" -days 365 -config "$CERT_DIR/server.conf" -extensions v3_req
    
    echo "✅ Certificats de développement générés"
    
else
    echo "🌐 Configuration pour le domaine de production: $DOMAIN"
    
    # Vérification que le domaine pointe vers ce serveur
    echo "🔍 Vérification DNS..."
    DOMAIN_IP=$(dig +short $DOMAIN | head -n1)
    SERVER_IP=$(curl -s ifconfig.me)
    
    if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
        echo "⚠️  ATTENTION: Le domaine $DOMAIN ne pointe pas vers ce serveur ($SERVER_IP)"
        echo "📝 IP du domaine: $DOMAIN_IP"
        echo "📝 IP du serveur: $SERVER_IP"
        read -p "Continuer quand même ? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Génération avec Let's Encrypt si certbot est disponible
    if command -v certbot &> /dev/null; then
        echo "🔐 Génération de certificats Let's Encrypt..."
        
        # Arrêt temporaire de nginx si il tourne
        if systemctl is-active --quiet nginx; then
            echo "⏸️  Arrêt temporaire de Nginx..."
            sudo systemctl stop nginx
        fi
        
        # Génération des certificats
        sudo certbot certonly --standalone \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN \
            -d www.$DOMAIN \
            -d api.$DOMAIN \
            -d admin.$DOMAIN
        
        # Copie des certificats
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem "$CERT_DIR/server.crt"
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem "$CERT_DIR/server.key"
        sudo chown $USER:$USER "$CERT_DIR/server.crt" "$CERT_DIR/server.key"
        
        echo "✅ Certificats Let's Encrypt générés"
        
    else
        echo "🔧 Génération de certificats auto-signés pour la production..."
        echo "⚠️  ATTENTION: Ces certificats ne seront pas reconnus par les navigateurs"
        
        openssl genrsa -out "$CERT_DIR/server.key" 2048
        
        cat > "$CERT_DIR/server.conf" << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = FR
ST = France
L = Paris
O = BAI Consulting
OU = IT Department
CN = $DOMAIN

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = www.$DOMAIN
DNS.3 = api.$DOMAIN
DNS.4 = admin.$DOMAIN
EOF

        openssl req -new -x509 -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.crt" -days 365 -config "$CERT_DIR/server.conf" -extensions v3_req
        
        echo "✅ Certificats auto-signés générés"
    fi
fi

# Génération du paramètre DH
echo "🔐 Génération du paramètre DH..."
openssl dhparam -out "$CERT_DIR/dhparam.pem" 2048

# Configuration des permissions
chmod 600 "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/server.crt"
chmod 644 "$CERT_DIR/dhparam.pem"

# Mise à jour de la configuration Nginx
echo "📝 Mise à jour de la configuration Nginx..."
if [ -f "$NGINX_CONF" ]; then
    # Remplacement du domaine dans la configuration
    sed -i "s/localhost/$DOMAIN/g" "$NGINX_CONF"
    echo "✅ Configuration Nginx mise à jour"
else
    echo "⚠️  Fichier de configuration Nginx non trouvé: $NGINX_CONF"
fi

# Création du script de renouvellement automatique
if command -v certbot &> /dev/null && [ "$DOMAIN" != "localhost" ]; then
    echo "🔄 Configuration du renouvellement automatique..."
    
    cat > "/tmp/renew-ssl.sh" << EOF
#!/bin/bash
# Script de renouvellement automatique des certificats SSL

echo "🔄 Renouvellement des certificats SSL pour $DOMAIN"

# Renouvellement avec certbot
certbot renew --quiet

# Copie des nouveaux certificats
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERT_DIR/server.crt
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $CERT_DIR/server.key

# Redémarrage des services
docker-compose -f docker-compose.postgresql.yml restart frontend

echo "✅ Certificats renouvelés et services redémarrés"
EOF

    chmod +x "/tmp/renew-ssl.sh"
    sudo mv "/tmp/renew-ssl.sh" "/usr/local/bin/renew-ssl-bai.sh"
    
    # Ajout au crontab pour renouvellement automatique
    (crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/renew-ssl-bai.sh") | crontab -
    
    echo "✅ Renouvellement automatique configuré"
fi

# Test des certificats
echo "🧪 Test des certificats..."
if openssl x509 -in "$CERT_DIR/server.crt" -text -noout > /dev/null 2>&1; then
    echo "✅ Certificat valide"
    
    # Affichage des informations du certificat
    echo "📋 Informations du certificat:"
    openssl x509 -in "$CERT_DIR/server.crt" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:|IP Address:)"
    
else
    echo "❌ Certificat invalide"
    exit 1
fi

echo ""
echo "🎉 Déploiement SSL terminé avec succès !"
echo "========================================"
echo "📁 Répertoire des certificats: $CERT_DIR"
echo "🔑 Clé privée: $CERT_DIR/server.key"
echo "📜 Certificat: $CERT_DIR/server.crt"
echo "🔐 Paramètre DH: $CERT_DIR/dhparam.pem"
echo ""
echo "🚀 Prochaines étapes:"
echo "1. Redémarrer les services Docker:"
echo "   docker-compose -f docker-compose.postgresql.yml up -d"
echo ""
echo "2. Tester l'accès HTTPS:"
echo "   curl -k https://$DOMAIN/health"
echo ""
echo "3. Vérifier la configuration SSL:"
echo "   openssl s_client -connect $DOMAIN:443 -servername $DOMAIN"
echo ""
if [ "$DOMAIN" != "localhost" ]; then
    echo "4. Tester avec SSL Labs:"
    echo "   https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
fi















