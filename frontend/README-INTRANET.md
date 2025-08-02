# 🏢 Intranet Admin - BAI Consulting

## 📋 Vue d'ensemble

L'espace d'administration est déployé sur l'intranet de la banque pour des raisons de sécurité. Il permet aux administrateurs de gérer les formations, les utilisateurs et les banques.

## 🔐 Authentification

### Accès Intranet
- **URL** : `https://admin.bai-consulting.local`
- **Type** : Identifiants (email + mot de passe)
- **Rôles** : Super Admin, Admin Banque
- **Réseau** : Intranet uniquement

### Création d'un compte admin
```sql
-- Exemple de création d'un super admin
INSERT INTO users (
    id, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    is_active
) VALUES (
    UUID(),
    'admin@bai-consulting.com',
    '$2b$10$...', -- Hash bcrypt du mot de passe
    'Admin',
    'BAI',
    'SUPER_ADMIN',
    true
);
```

## 🚀 Déploiement

### Prérequis
- Node.js 18+
- npm ou yarn
- Accès SSH au serveur intranet
- Certificat SSL pour l'intranet

### Build et Déploiement

#### 1. Build local
```bash
# Dans le répertoire frontend
npm run build:admin
```

#### 2. Déploiement automatique
```bash
# Déploiement complet
./scripts/deploy-intranet.sh

# Déploiement sur un serveur spécifique
./scripts/deploy-intranet.sh admin.ma-banque.local
```

#### 3. Déploiement manuel
```bash
# Build
npm run build:admin

# Copie vers le serveur
rsync -avz --delete dist-admin/ root@admin.bai-consulting.local:/var/www/admin.bai-consulting.local/

# Redémarrage Nginx
ssh root@admin.bai-consulting.local "systemctl reload nginx"
```

## 🔧 Configuration

### Variables d'environnement
```env
# env.intranet
VITE_API_URL=https://admin-api.bai-consulting.local
VITE_ENVIRONMENT=intranet
VITE_AUTH_TYPE=credentials
VITE_ALLOWED_ROLES=SUPER_ADMIN,BANK_ADMIN
VITE_APP_TITLE=BAI Consulting - Administration
VITE_APP_DESCRIPTION=Espace d'administration intranet
VITE_IS_INTRANET=true
```

### Configuration Nginx
```nginx
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
}
```

## 🔒 Sécurité

### Firewall
```bash
# Autoriser uniquement l'intranet pour l'admin
sudo ufw allow from 192.168.0.0/16 to any port 443
sudo ufw deny 443/tcp
```

### Certificats SSL
- **Type** : Certificat auto-signé ou CA interne
- **Durée** : 1 an minimum
- **Renouvellement** : Automatique via cron

### Monitoring
- **Logs** : `/var/log/nginx/admin.bai-consulting.local.*.log`
- **Alertes** : Tentatives de connexion échouées
- **Backup** : Automatique quotidien

## 📊 Fonctionnalités

### Gestion des Formations
- ✅ Création et édition de formations
- ✅ Upload de contenu (vidéos, documents, diapositives)
- ✅ Gestion des types de formation
- ✅ Activation/désactivation
- ✅ Statut obligatoire

### Gestion des Utilisateurs
- ✅ CRUD des collaborateurs
- ✅ Gestion des rôles et permissions
- ✅ Réinitialisation de mots de passe
- ✅ Envoi automatique des identifiants
- ✅ Filtres par rôle et recherche

### Tableau de Bord
- ✅ Statistiques en temps réel
- ✅ Graphiques de progression
- ✅ Activité récente
- ✅ Alertes et notifications
- ✅ Vue par banque

### Gestion des Banques
- ✅ CRUD des banques
- ✅ Sélecteur de banque active
- ✅ Statistiques par banque
- ✅ Isolation des données

## 🆘 Dépannage

### Problèmes courants

#### 1. Erreur de certificat SSL
```bash
# Vérifier le certificat
openssl x509 -in /etc/ssl/certs/admin.bai-consulting.local.crt -text -noout

# Régénérer si nécessaire
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/admin.bai-consulting.local.key \
  -out /etc/ssl/certs/admin.bai-consulting.local.crt
```

#### 2. Erreur de connexion
```bash
# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/admin.bai-consulting.local.error.log

# Vérifier les logs de l'application
sudo journalctl -u nginx -f
```

#### 3. Problème de build
```bash
# Nettoyer le cache
rm -rf node_modules/.vite
rm -rf dist-admin

# Réinstaller les dépendances
npm ci

# Rebuild
npm run build:admin
```

### Contacts
- **Support technique** : tech@bai-consulting.com
- **Urgences** : +33 1 23 45 67 89
- **Documentation** : https://docs.bai-consulting.com

## 📈 Monitoring

### Métriques importantes
- **Temps de réponse** : < 2s
- **Disponibilité** : > 99.9%
- **Erreurs 5xx** : < 0.1%
- **Connexions simultanées** : < 100

### Alertes configurées
- ⚠️ Temps de réponse > 5s
- ⚠️ Erreurs 5xx > 1%
- ⚠️ Espace disque < 10%
- ⚠️ Mémoire utilisée > 80%
- ⚠️ Tentatives de connexion échouées > 10/min

## 🔄 Maintenance

### Tâches quotidiennes
- [ ] Vérification des logs d'erreur
- [ ] Sauvegarde de la base de données
- [ ] Monitoring des performances

### Tâches hebdomadaires
- [ ] Analyse des logs d'accès
- [ ] Vérification des certificats SSL
- [ ] Mise à jour des dépendances

### Tâches mensuelles
- [ ] Audit de sécurité
- [ ] Optimisation des performances
- [ ] Mise à jour de la documentation 