# 🌐 Guide de Configuration DNS - BAI Consulting

## 📋 Vue d'ensemble

Ce guide vous accompagne dans la configuration DNS pour déployer BAI Consulting en production avec des domaines personnalisés.

## 🎯 Architecture DNS Recommandée

### **Structure des Domaines**
```
votre-domaine.com          → Application principale
www.votre-domaine.com      → Redirection vers le domaine principal
api.votre-domaine.com      → API Backend
admin.votre-domaine.com    → Interface d'administration
cdn.votre-domaine.com      → CDN pour les médias (optionnel)
```

## 🔧 Configuration DNS par Fournisseur

### **1. Cloudflare (Recommandé)**

#### **Configuration de Base**
```bash
# Enregistrements A
Type    Nom                    Valeur           Proxy
A       votre-domaine.com      IP_DU_SERVEUR    ✅ Activé
A       www.votre-domaine.com  IP_DU_SERVEUR    ✅ Activé
A       api.votre-domaine.com  IP_DU_SERVEUR    ✅ Activé
A       admin.votre-domaine.com IP_DU_SERVEUR   ✅ Activé
```

#### **Configuration Avancée**
```bash
# Enregistrements CNAME (si nécessaire)
Type    Nom                    Valeur
CNAME   *.votre-domaine.com    votre-domaine.com

# Enregistrements TXT (pour la validation)
Type    Nom                    Valeur
TXT     votre-domaine.com      "v=spf1 include:_spf.google.com ~all"
TXT     _dmarc.votre-domaine.com "v=DMARC1; p=quarantine; rua=mailto:admin@votre-domaine.com"
```

#### **Configuration SSL/TLS**
```bash
# Dans Cloudflare Dashboard
SSL/TLS → Overview → Full (Strict)
SSL/TLS → Edge Certificates → Always Use HTTPS: ON
SSL/TLS → Edge Certificates → HSTS: ON
```

### **2. AWS Route 53**

#### **Configuration de Base**
```bash
# Création de la zone hébergée
aws route53 create-hosted-zone \
    --name votre-domaine.com \
    --caller-reference $(date +%s)

# Enregistrements A
aws route53 change-resource-record-sets \
    --hosted-zone-id Z123456789 \
    --change-batch file://dns-records.json
```

#### **Fichier dns-records.json**
```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "votre-domaine.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "IP_DU_SERVEUR"}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.votre-domaine.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "IP_DU_SERVEUR"}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.votre-domaine.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "IP_DU_SERVEUR"}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "admin.votre-domaine.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "IP_DU_SERVEUR"}]
      }
    }
  ]
}
```

### **3. Google Cloud DNS**

#### **Configuration de Base**
```bash
# Création de la zone DNS
gcloud dns managed-zones create bai-consulting-zone \
    --dns-name=votre-domaine.com \
    --description="Zone DNS pour BAI Consulting"

# Ajout des enregistrements
gcloud dns record-sets transaction start --zone=bai-consulting-zone
gcloud dns record-sets transaction add IP_DU_SERVEUR \
    --name=votre-domaine.com \
    --ttl=300 \
    --type=A \
    --zone=bai-consulting-zone
gcloud dns record-sets transaction execute --zone=bai-consulting-zone
```

### **4. OVH**

#### **Configuration dans l'Espace Client**
```bash
# Connexion à l'espace client OVH
# Domaine → votre-domaine.com → Zone DNS

# Enregistrements A
Type    Sous-domaine          Cible
A       @                     IP_DU_SERVEUR
A       www                   IP_DU_SERVEUR
A       api                   IP_DU_SERVEUR
A       admin                 IP_DU_SERVEUR
```

### **5. Gandi**

#### **Configuration via l'Interface**
```bash
# Connexion à l'interface Gandi
# Domaines → votre-domaine.com → Enregistrements DNS

# Enregistrements A
Type    Nom                    Valeur
A       @                      IP_DU_SERVEUR
A       www                    IP_DU_SERVEUR
A       api                    IP_DU_SERVEUR
A       admin                  IP_DU_SERVEUR
```

## 🔒 Configuration SSL avec Let's Encrypt

### **1. Installation de Certbot**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot

# macOS
brew install certbot
```

### **2. Génération des Certificats**
```bash
# Génération des certificats pour tous les domaines
sudo certbot certonly --standalone \
    --email admin@votre-domaine.com \
    --agree-tos \
    --no-eff-email \
    -d votre-domaine.com \
    -d www.votre-domaine.com \
    -d api.votre-domaine.com \
    -d admin.votre-domaine.com
```

### **3. Configuration du Renouvellement Automatique**
```bash
# Script de renouvellement
cat > /usr/local/bin/renew-ssl-bai.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem /path/to/bai-consulting/ssl/server.crt
cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem /path/to/bai-consulting/ssl/server.key
docker-compose -f /path/to/bai-consulting/docker-compose.postgresql.yml restart frontend
EOF

chmod +x /usr/local/bin/renew-ssl-bai.sh

# Ajout au crontab
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/renew-ssl-bai.sh") | crontab -
```

## 🌐 Configuration Nginx pour Multi-Domaines

### **Configuration Nginx Avancée**
```nginx
# /etc/nginx/sites-available/bai-consulting
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;
    
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.votre-domaine.com;
    
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    location / {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name admin.votre-domaine.com;
    
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔍 Tests de Configuration DNS

### **1. Vérification des Enregistrements**
```bash
# Vérification des enregistrements A
nslookup votre-domaine.com
nslookup www.votre-domaine.com
nslookup api.votre-domaine.com
nslookup admin.votre-domaine.com

# Vérification avec dig
dig votre-domaine.com
dig www.votre-domaine.com
dig api.votre-domaine.com
dig admin.votre-domaine.com
```

### **2. Test de Connectivité**
```bash
# Test de connectivité HTTP
curl -I http://votre-domaine.com
curl -I http://www.votre-domaine.com
curl -I http://api.votre-domaine.com
curl -I http://admin.votre-domaine.com

# Test de connectivité HTTPS
curl -I https://votre-domaine.com
curl -I https://www.votre-domaine.com
curl -I https://api.votre-domaine.com
curl -I https://admin.votre-domaine.com
```

### **3. Test de Propagation DNS**
```bash
# Vérification de la propagation mondiale
# Utilisez des outils en ligne comme :
# - https://www.whatsmydns.net/
# - https://dnschecker.org/
# - https://www.dnswatch.info/
```

## 🚀 Script de Configuration DNS Automatique

### **Script de Configuration Cloudflare**
```bash
#!/bin/bash
# scripts/configure-cloudflare-dns.sh

DOMAIN=$1
SERVER_IP=$2
CLOUDFLARE_TOKEN=$3

if [ -z "$DOMAIN" ] || [ -z "$SERVER_IP" ] || [ -z "$CLOUDFLARE_TOKEN" ]; then
    echo "Usage: $0 <domain> <server_ip> <cloudflare_token>"
    exit 1
fi

echo "🌐 Configuration DNS Cloudflare pour $DOMAIN"
echo "=========================================="

# Récupération de la zone ID
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
    -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
    -H "Content-Type: application/json" | jq -r '.result[0].id')

if [ "$ZONE_ID" = "null" ]; then
    echo "❌ Zone DNS non trouvée pour $DOMAIN"
    exit 1
fi

echo "✅ Zone ID: $ZONE_ID"

# Fonction pour créer un enregistrement A
create_a_record() {
    local name=$1
    local ip=$2
    
    echo "🔧 Création de l'enregistrement A: $name → $ip"
    
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
        -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{
            \"type\": \"A\",
            \"name\": \"$name\",
            \"content\": \"$ip\",
            \"ttl\": 300,
            \"proxied\": true
        }" | jq -r '.success'
}

# Création des enregistrements
create_a_record "$DOMAIN" "$SERVER_IP"
create_a_record "www.$DOMAIN" "$SERVER_IP"
create_a_record "api.$DOMAIN" "$SERVER_IP"
create_a_record "admin.$DOMAIN" "$SERVER_IP"

echo "✅ Configuration DNS terminée"
```

### **Script de Configuration Route 53**
```bash
#!/bin/bash
# scripts/configure-route53-dns.sh

DOMAIN=$1
SERVER_IP=$2
AWS_PROFILE=$3

if [ -z "$DOMAIN" ] || [ -z "$SERVER_IP" ] || [ -z "$AWS_PROFILE" ]; then
    echo "Usage: $0 <domain> <server_ip> <aws_profile>"
    exit 1
fi

echo "🌐 Configuration DNS Route 53 pour $DOMAIN"
echo "=========================================="

# Création de la zone hébergée
ZONE_ID=$(aws route53 create-hosted-zone \
    --name $DOMAIN \
    --caller-reference $(date +%s) \
    --profile $AWS_PROFILE \
    --query 'HostedZone.Id' \
    --output text)

echo "✅ Zone créée: $ZONE_ID"

# Création du fichier de configuration
cat > dns-records.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "$SERVER_IP"}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.$DOMAIN",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "$SERVER_IP"}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.$DOMAIN",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "$SERVER_IP"}]
      }
    },
    {
      "Action": "CREATE",
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
aws route53 change-resource-record-sets \
    --hosted-zone-id $ZONE_ID \
    --change-batch file://dns-records.json \
    --profile $AWS_PROFILE

echo "✅ Configuration DNS terminée"
```

## 📊 Monitoring DNS

### **Script de Monitoring DNS**
```bash
#!/bin/bash
# scripts/monitor-dns.sh

DOMAIN=$1
EXPECTED_IP=$2

if [ -z "$DOMAIN" ] || [ -z "$EXPECTED_IP" ]; then
    echo "Usage: $0 <domain> <expected_ip>"
    exit 1
fi

echo "🔍 Monitoring DNS pour $DOMAIN"
echo "=============================="

# Vérification des enregistrements
for subdomain in "" "www." "api." "admin."; do
    full_domain="${subdomain}${DOMAIN}"
    echo -n "🔍 Vérification de $full_domain... "
    
    ip=$(dig +short $full_domain | head -n1)
    
    if [ "$ip" = "$EXPECTED_IP" ]; then
        echo "✅ OK ($ip)"
    else
        echo "❌ FAIL ($ip, attendu: $EXPECTED_IP)"
    fi
done

# Test de connectivité
echo ""
echo "🌐 Test de connectivité:"
for subdomain in "" "www." "api." "admin."; do
    full_domain="${subdomain}${DOMAIN}"
    echo -n "🔍 Test $full_domain... "
    
    if curl -s -o /dev/null -w "%{http_code}" "https://$full_domain" | grep -q "200"; then
        echo "✅ OK"
    else
        echo "❌ FAIL"
    fi
done
```

## ✅ Checklist de Configuration DNS

- [ ] Domaine principal configuré
- [ ] Sous-domaines configurés (www, api, admin)
- [ ] Enregistrements A pointant vers le serveur
- [ ] SSL/TLS configuré pour tous les domaines
- [ ] Redirection HTTP vers HTTPS
- [ ] Tests de connectivité réussis
- [ ] Propagation DNS vérifiée
- [ ] Monitoring DNS en place
- [ ] Renouvellement SSL automatique configuré
- [ ] Documentation mise à jour

## 🚨 Dépannage DNS

### **Problèmes Courants**

#### **1. Propagation DNS Lente**
```bash
# Vérification de la propagation
dig @8.8.8.8 votre-domaine.com
dig @1.1.1.1 votre-domaine.com
dig @208.67.222.222 votre-domaine.com
```

#### **2. Enregistrements DNS Incorrects**
```bash
# Vérification des enregistrements
nslookup -type=A votre-domaine.com
nslookup -type=AAAA votre-domaine.com
nslookup -type=MX votre-domaine.com
```

#### **3. Problèmes SSL**
```bash
# Vérification des certificats
openssl s_client -connect votre-domaine.com:443 -servername votre-domaine.com
curl -I https://votre-domaine.com
```

#### **4. Problèmes de Connectivité**
```bash
# Test de connectivité
ping votre-domaine.com
traceroute votre-domaine.com
telnet votre-domaine.com 80
telnet votre-domaine.com 443
```

## 📞 Support

Pour toute question ou problème :
- **Documentation DNS** : [docs.votre-domaine.com/dns](https://docs.votre-domaine.com/dns)
- **Support technique** : support@votre-domaine.com
- **Urgences DNS** : +33 1 23 45 67 89

















