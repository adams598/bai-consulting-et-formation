#!/bin/bash

# Script de configuration DNS automatique pour BAI Consulting
# Usage: ./scripts/configure-dns.sh [provider] [domain] [server_ip] [token]

set -e

PROVIDER=${1:-"cloudflare"}
DOMAIN=${2:-"votre-domaine.com"}
SERVER_IP=${3:-$(curl -s ifconfig.me)}
TOKEN=${4:-""}

echo "🌐 Configuration DNS automatique pour BAI Consulting"
echo "=================================================="
echo "🔧 Fournisseur: $PROVIDER"
echo "🌐 Domaine: $DOMAIN"
echo "🖥️  Serveur: $SERVER_IP"
echo ""

# Vérification des prérequis
echo "🔍 Vérification des prérequis..."

if ! command -v curl &> /dev/null; then
    echo "❌ curl n'est pas installé"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "❌ jq n'est pas installé"
    exit 1
fi

# Fonction pour Cloudflare
configure_cloudflare() {
    echo "☁️ Configuration Cloudflare..."
    
    if [ -z "$TOKEN" ]; then
        echo "❌ Token Cloudflare requis"
        echo "📝 Obtenez votre token sur: https://dash.cloudflare.com/profile/api-tokens"
        exit 1
    fi
    
    # Récupération de la zone ID
    echo "🔍 Récupération de la zone ID..."
    ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" | jq -r '.result[0].id')
    
    if [ "$ZONE_ID" = "null" ] || [ -z "$ZONE_ID" ]; then
        echo "❌ Zone DNS non trouvée pour $DOMAIN"
        echo "📝 Créez d'abord la zone dans Cloudflare"
        exit 1
    fi
    
    echo "✅ Zone ID: $ZONE_ID"
    
    # Fonction pour créer un enregistrement A
    create_a_record() {
        local name=$1
        local ip=$2
        
        echo "🔧 Création de l'enregistrement A: $name → $ip"
        
        # Vérification si l'enregistrement existe déjà
        existing_record=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$name&type=A" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" | jq -r '.result[0].id')
        
        if [ "$existing_record" != "null" ] && [ -n "$existing_record" ]; then
            echo "⚠️  Enregistrement existant, mise à jour..."
            curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$existing_record" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json" \
                --data "{
                    \"type\": \"A\",
                    \"name\": \"$name\",
                    \"content\": \"$ip\",
                    \"ttl\": 300,
                    \"proxied\": true
                }" | jq -r '.success'
        else
            echo "➕ Création d'un nouvel enregistrement..."
            curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json" \
                --data "{
                    \"type\": \"A\",
                    \"name\": \"$name\",
                    \"content\": \"$ip\",
                    \"ttl\": 300,
                    \"proxied\": true
                }" | jq -r '.success'
        fi
    }
    
    # Création des enregistrements
    create_a_record "$DOMAIN" "$SERVER_IP"
    create_a_record "www.$DOMAIN" "$SERVER_IP"
    create_a_record "api.$DOMAIN" "$SERVER_IP"
    create_a_record "admin.$DOMAIN" "$SERVER_IP"
    
    echo "✅ Configuration Cloudflare terminée"
}

# Fonction pour Route 53
configure_route53() {
    echo "☁️ Configuration AWS Route 53..."
    
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI n'est pas installé"
        echo "📝 Installez AWS CLI: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    if [ -z "$TOKEN" ]; then
        echo "❌ Profil AWS requis"
        echo "📝 Configurez AWS CLI: aws configure"
        exit 1
    fi
    
    # Création de la zone hébergée
    echo "🔧 Création de la zone hébergée..."
    ZONE_ID=$(aws route53 create-hosted-zone \
        --name $DOMAIN \
        --caller-reference $(date +%s) \
        --profile $TOKEN \
        --query 'HostedZone.Id' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$ZONE_ID" ]; then
        echo "⚠️  Zone existante, récupération de l'ID..."
        ZONE_ID=$(aws route53 list-hosted-zones \
            --profile $TOKEN \
            --query "HostedZones[?Name=='$DOMAIN.'].Id" \
            --output text | cut -d'/' -f3)
    fi
    
    echo "✅ Zone ID: $ZONE_ID"
    
    # Création du fichier de configuration
    cat > dns-records.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "$SERVER_IP"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.$DOMAIN",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "$SERVER_IP"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.$DOMAIN",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "$SERVER_IP"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "admin.$DOMAIN",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "$SERVER_IP"}]
      }
    }
  ]
}
EOF
    
    # Application des changements
    echo "🔧 Application des changements DNS..."
    aws route53 change-resource-record-sets \
        --hosted-zone-id $ZONE_ID \
        --change-batch file://dns-records.json \
        --profile $TOKEN
    
    # Nettoyage
    rm -f dns-records.json
    
    echo "✅ Configuration Route 53 terminée"
}

# Fonction pour Google Cloud DNS
configure_gcloud() {
    echo "☁️ Configuration Google Cloud DNS..."
    
    if ! command -v gcloud &> /dev/null; then
        echo "❌ Google Cloud CLI n'est pas installé"
        echo "📝 Installez gcloud: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if [ -z "$TOKEN" ]; then
        echo "❌ Projet Google Cloud requis"
        echo "📝 Configurez gcloud: gcloud config set project YOUR_PROJECT"
        exit 1
    fi
    
    # Création de la zone DNS
    echo "🔧 Création de la zone DNS..."
    gcloud dns managed-zones create bai-consulting-zone \
        --dns-name=$DOMAIN \
        --description="Zone DNS pour BAI Consulting" \
        --project=$TOKEN 2>/dev/null || echo "⚠️  Zone existante"
    
    # Ajout des enregistrements
    echo "🔧 Ajout des enregistrements DNS..."
    gcloud dns record-sets transaction start --zone=bai-consulting-zone --project=$TOKEN
    
    gcloud dns record-sets transaction add $SERVER_IP \
        --name=$DOMAIN \
        --ttl=300 \
        --type=A \
        --zone=bai-consulting-zone \
        --project=$TOKEN
    
    gcloud dns record-sets transaction add $SERVER_IP \
        --name=www.$DOMAIN \
        --ttl=300 \
        --type=A \
        --zone=bai-consulting-zone \
        --project=$TOKEN
    
    gcloud dns record-sets transaction add $SERVER_IP \
        --name=api.$DOMAIN \
        --ttl=300 \
        --type=A \
        --zone=bai-consulting-zone \
        --project=$TOKEN
    
    gcloud dns record-sets transaction add $SERVER_IP \
        --name=admin.$DOMAIN \
        --ttl=300 \
        --type=A \
        --zone=bai-consulting-zone \
        --project=$TOKEN
    
    gcloud dns record-sets transaction execute --zone=bai-consulting-zone --project=$TOKEN
    
    echo "✅ Configuration Google Cloud DNS terminée"
}

# Fonction pour OVH
configure_ovh() {
    echo "☁️ Configuration OVH..."
    
    if [ -z "$TOKEN" ]; then
        echo "❌ Token OVH requis"
        echo "📝 Obtenez votre token sur: https://eu.api.ovh.com/"
        exit 1
    fi
    
    # Récupération de la zone DNS
    echo "🔍 Récupération de la zone DNS..."
    ZONE_ID=$(curl -s -X GET "https://eu.api.ovh.com/1.0/domain/zone/$DOMAIN" \
        -H "X-Ovh-Application: $TOKEN" \
        -H "X-Ovh-Consumer: $TOKEN" \
        -H "Content-Type: application/json" | jq -r '.id')
    
    if [ "$ZONE_ID" = "null" ] || [ -z "$ZONE_ID" ]; then
        echo "❌ Zone DNS non trouvée pour $DOMAIN"
        exit 1
    fi
    
    echo "✅ Zone ID: $ZONE_ID"
    
    # Fonction pour créer un enregistrement A
    create_a_record() {
        local name=$1
        local ip=$2
        
        echo "🔧 Création de l'enregistrement A: $name → $ip"
        
        curl -s -X POST "https://eu.api.ovh.com/1.0/domain/zone/$DOMAIN/record" \
            -H "X-Ovh-Application: $TOKEN" \
            -H "X-Ovh-Consumer: $TOKEN" \
            -H "Content-Type: application/json" \
            --data "{
                \"fieldType\": \"A\",
                \"subDomain\": \"$name\",
                \"target\": \"$ip\",
                \"ttl\": 300
            }" | jq -r '.id'
    }
    
    # Création des enregistrements
    create_a_record "" "$SERVER_IP"
    create_a_record "www" "$SERVER_IP"
    create_a_record "api" "$SERVER_IP"
    create_a_record "admin" "$SERVER_IP"
    
    echo "✅ Configuration OVH terminée"
}

# Fonction pour Gandi
configure_gandi() {
    echo "☁️ Configuration Gandi..."
    
    if [ -z "$TOKEN" ]; then
        echo "❌ Token Gandi requis"
        echo "📝 Obtenez votre token sur: https://account.gandi.net/"
        exit 1
    fi
    
    # Fonction pour créer un enregistrement A
    create_a_record() {
        local name=$1
        local ip=$2
        
        echo "🔧 Création de l'enregistrement A: $name → $ip"
        
        curl -s -X POST "https://api.gandi.net/v5/livedns/domains/$DOMAIN/records" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            --data "{
                \"rrset_name\": \"$name\",
                \"rrset_type\": \"A\",
                \"rrset_values\": [\"$ip\"],
                \"rrset_ttl\": 300
            }" | jq -r '.message'
    }
    
    # Création des enregistrements
    create_a_record "@" "$SERVER_IP"
    create_a_record "www" "$SERVER_IP"
    create_a_record "api" "$SERVER_IP"
    create_a_record "admin" "$SERVER_IP"
    
    echo "✅ Configuration Gandi terminée"
}

# Configuration selon le fournisseur
case $PROVIDER in
    "cloudflare")
        configure_cloudflare
        ;;
    "route53")
        configure_route53
        ;;
    "gcloud")
        configure_gcloud
        ;;
    "ovh")
        configure_ovh
        ;;
    "gandi")
        configure_gandi
        ;;
    *)
        echo "❌ Fournisseur non supporté: $PROVIDER"
        echo "📝 Fournisseurs supportés: cloudflare, route53, gcloud, ovh, gandi"
        exit 1
        ;;
esac

# Tests de vérification
echo ""
echo "🧪 Tests de vérification..."
echo "=========================="

# Attente de la propagation
echo "⏳ Attente de la propagation DNS (30 secondes)..."
sleep 30

# Test des enregistrements
for subdomain in "" "www." "api." "admin."; do
    full_domain="${subdomain}${DOMAIN}"
    echo -n "🔍 Vérification de $full_domain... "
    
    ip=$(dig +short $full_domain | head -n1)
    
    if [ "$ip" = "$SERVER_IP" ]; then
        echo "✅ OK ($ip)"
    else
        echo "⚠️  Propagation en cours ($ip, attendu: $SERVER_IP)"
    fi
done

# Test de connectivité
echo ""
echo "🌐 Test de connectivité:"
for subdomain in "" "www." "api." "admin."; do
    full_domain="${subdomain}${DOMAIN}"
    echo -n "🔍 Test $full_domain... "
    
    if curl -s -o /dev/null -w "%{http_code}" "http://$full_domain" | grep -q "200\|301\|302"; then
        echo "✅ OK"
    else
        echo "⚠️  En cours de propagation"
    fi
done

echo ""
echo "🎉 Configuration DNS terminée !"
echo "==============================="
echo "🌐 Domaines configurés:"
echo "   - $DOMAIN"
echo "   - www.$DOMAIN"
echo "   - api.$DOMAIN"
echo "   - admin.$DOMAIN"
echo ""
echo "🔧 Prochaines étapes:"
echo "1. Attendre la propagation DNS complète (jusqu'à 24h)"
echo "2. Configurer SSL avec Let's Encrypt"
echo "3. Tester toutes les fonctionnalités"
echo "4. Configurer le monitoring DNS"
echo ""
echo "📊 Monitoring DNS:"
echo "   - https://www.whatsmydns.net/"
echo "   - https://dnschecker.org/"
echo "   - https://www.dnswatch.info/"



