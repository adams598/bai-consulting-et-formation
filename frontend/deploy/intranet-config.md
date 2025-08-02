# Configuration Intranet - BAI Consulting

## 🏗️ Architecture

```
Internet (Public)
    ↓
[Reverse Proxy] → [Espace Formation] (Public)
    ↓
Intranet (Privé)
    ↓
[Espace Admin] → [Base de données] → [Services Backend]
```

## 🌐 Configuration DNS

### URLs Recommandées

#### Intranet (Admin)
- **URL Admin** : `https://admin.bai-consulting.local`
- **URL API Admin** : `https://admin-api.bai-consulting.local`
- **Port** : 443 (HTTPS)

#### Internet (Formation)
- **URL Formation** : `https://formation.bai-consulting.com`
- **URL API Formation** : `https://api.bai-consulting.com`
- **Port** : 443 (HTTPS)

## 🔧 Configuration Serveur

### 1. Serveur Intranet (Admin)

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/admin.bai-consulting.local

server {
    listen 443 ssl http2;
    server_name admin.bai-consulting.local;

    # Certificat SSL interne
    ssl_certificate /etc/ssl/certs/admin.bai-consulting.local.crt;
    ssl_certificate_key /etc/ssl/private/admin.bai-consulting.local.key;

    # Sécurité renforcée
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Root directory
    root /var/www/admin.bai-consulting.local;
    index index.html;

    # Gestion des routes React
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/admin.bai-consulting.local.access.log;
    error_log /var/log/nginx/admin.bai-consulting.local.error.log;
}
```

### 2. Serveur Internet (Formation)

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/formation.bai-consulting.com

server {
    listen 443 ssl http2;
    server_name formation.bai-consulting.com;

    # Certificat SSL public
    ssl_certificate /etc/letsencrypt/live/formation.bai-consulting.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/formation.bai-consulting.com/privkey.pem;

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Root directory
    root /var/www/formation.bai-consulting.com;
    index index.html;

    # Gestion des routes React
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/formation.bai-consulting.com.access.log;
    error_log /var/log/nginx/formation.bai-consulting.com.error.log;
}
```

## 🔐 Authentification

### 1. Intranet (Admin)
- **Type** : Identifiants + Windows (optionnel)
- **Base de données** : Utilisateurs admin pré-configurés
- **Sessions** : JWT avec refresh token
- **Durée** : 8 heures (renouvelable)

### 2. Internet (Formation)
- **Type** : Identifiants uniquement
- **Base de données** : Collaborateurs par banque
- **Sessions** : JWT avec refresh token
- **Durée** : 24 heures (renouvelable)

## 🗄️ Base de Données

### Structure Recommandée
```sql
-- Base de données principale
CREATE DATABASE bai_consulting;

-- Tables séparées par environnement
USE bai_consulting;

-- Table des banques
CREATE TABLE banks (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('SUPER_ADMIN', 'BANK_ADMIN', 'COLLABORATOR') NOT NULL,
    bank_id VARCHAR(36),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES banks(id)
);

-- Table des formations
CREATE TABLE formations (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('VIDEO', 'SLIDES', 'DOCUMENT', 'MIXED') NOT NULL,
    duration INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_mandatory BOOLEAN DEFAULT false,
    bank_id VARCHAR(36),
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

## 🚀 Déploiement

### 1. Build des Applications

#### Admin (Intranet)
```bash
# Build pour l'intranet
npm run build:admin

# Ou avec Vite
npm run build -- --mode intranet
```

#### Formation (Internet)
```bash
# Build pour l'internet
npm run build:formation

# Ou avec Vite
npm run build -- --mode production
```

### 2. Variables d'Environnement

#### Admin (.env.intranet)
```env
VITE_API_URL=https://admin-api.bai-consulting.local
VITE_ENVIRONMENT=intranet
VITE_AUTH_TYPE=credentials
VITE_ALLOWED_ROLES=SUPER_ADMIN,BANK_ADMIN
```

#### Formation (.env.production)
```env
VITE_API_URL=https://api.bai-consulting.com
VITE_ENVIRONMENT=formation
VITE_AUTH_TYPE=credentials
VITE_ALLOWED_ROLES=COLLABORATOR
```

### 3. Scripts de Déploiement

#### Script Intranet
```bash
#!/bin/bash
# deploy-intranet.sh

echo "🚀 Déploiement Intranet Admin..."

# Build
npm run build:admin

# Copie vers le serveur
rsync -avz --delete dist/ /var/www/admin.bai-consulting.local/

# Redémarrage Nginx
sudo systemctl reload nginx

echo "✅ Déploiement terminé"
```

#### Script Formation
```bash
#!/bin/bash
# deploy-formation.sh

echo "🚀 Déploiement Formation Internet..."

# Build
npm run build:formation

# Copie vers le serveur
rsync -avz --delete dist/ /var/www/formation.bai-consulting.com/

# Redémarrage Nginx
sudo systemctl reload nginx

echo "✅ Déploiement terminé"
```

## 🔒 Sécurité

### 1. Firewall
```bash
# Autoriser uniquement l'intranet pour l'admin
sudo ufw allow from 192.168.0.0/16 to any port 443
sudo ufw deny 443/tcp
```

### 2. Certificats SSL
- **Intranet** : Certificat auto-signé ou CA interne
- **Internet** : Let's Encrypt ou certificat commercial

### 3. Monitoring
- **Logs** : Nginx + Application
- **Alertes** : Tentatives de connexion échouées
- **Backup** : Base de données + fichiers

## 📋 Checklist de Déploiement

- [ ] DNS configuré (admin.bai-consulting.local)
- [ ] Certificats SSL installés
- [ ] Nginx configuré
- [ ] Base de données créée
- [ ] Utilisateurs admin créés
- [ ] Applications buildées
- [ ] Firewall configuré
- [ ] Monitoring activé
- [ ] Tests de connexion effectués
- [ ] Documentation utilisateur créée

## 🆘 Support

En cas de problème :
1. Vérifier les logs Nginx
2. Vérifier les logs de l'application
3. Tester la connectivité réseau
4. Vérifier les certificats SSL
5. Contacter l'équipe technique 