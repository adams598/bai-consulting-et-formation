#!/bin/bash

# Script de génération de certificats SSL/TLS pour BAI Consulting
# Usage: ./scripts/generate-ssl-certificates.sh [domain]

set -e

DOMAIN=${1:-"localhost"}
CERT_DIR="./ssl"
DAYS=365

echo "🔒 Génération de certificats SSL/TLS pour $DOMAIN"
echo "=============================================="

# Création du répertoire SSL
mkdir -p "$CERT_DIR"

# Génération de la clé privée
echo "🔑 Génération de la clé privée..."
openssl genrsa -out "$CERT_DIR/server.key" 2048

# Génération du certificat auto-signé
echo "📜 Génération du certificat auto-signé..."
openssl req -new -x509 -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.crt" -days $DAYS -subj "/C=FR/ST=France/L=Paris/O=BAI Consulting/OU=IT Department/CN=$DOMAIN"

# Génération du certificat pour le développement (avec SAN)
echo "🛠️ Génération du certificat de développement..."
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
DNS.2 = localhost
DNS.3 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Génération du certificat avec SAN
openssl req -new -x509 -key "$CERT_DIR/server.key" -out "$CERT_DIR/server-dev.crt" -days $DAYS -config "$CERT_DIR/server.conf" -extensions v3_req

# Génération du certificat pour Let's Encrypt (production)
echo "🌐 Préparation pour Let's Encrypt..."
cat > "$CERT_DIR/letsencrypt.conf" << EOF
# Configuration pour Let's Encrypt
# Usage: certbot certonly --config-dir $CERT_DIR/letsencrypt --work-dir $CERT_DIR/letsencrypt/work --logs-dir $CERT_DIR/letsencrypt/logs

# Domaine principal
$DOMAIN

# Sous-domaines
www.$DOMAIN
api.$DOMAIN
admin.$DOMAIN
EOF

# Génération d'un certificat de test pour la production
echo "🧪 Génération du certificat de test..."
openssl req -new -x509 -key "$CERT_DIR/server.key" -out "$CERT_DIR/server-prod.crt" -days $DAYS -subj "/C=FR/ST=France/L=Paris/O=BAI Consulting/OU=IT Department/CN=$DOMAIN"

# Configuration des permissions
chmod 600 "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/server.crt"
chmod 644 "$CERT_DIR/server-dev.crt"
chmod 644 "$CERT_DIR/server-prod.crt"

echo "✅ Certificats générés avec succès !"
echo "====================================="
echo "📁 Répertoire: $CERT_DIR"
echo "🔑 Clé privée: $CERT_DIR/server.key"
echo "📜 Certificat développement: $CERT_DIR/server-dev.crt"
echo "📜 Certificat production: $CERT_DIR/server-prod.crt"
echo ""
echo "🔍 Vérification des certificats:"
echo "openssl x509 -in $CERT_DIR/server-dev.crt -text -noout"
echo ""
echo "🌐 Pour la production avec Let's Encrypt:"
echo "certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN -d admin.$DOMAIN"
echo ""
echo "⚠️  IMPORTANT: Remplacez ces certificats auto-signés par des certificats valides en production !"



