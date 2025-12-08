# Dépannage : Connexion à la base de données Neon en local

## Problème
L'URL fonctionne en production mais pas en local. Timeout de connexion.

## Solutions à essayer

### 1. Vérifier le firewall Windows
```powershell
# Ouvrir PowerShell en administrateur
# Autoriser le port 5432
New-NetFirewallRule -DisplayName "PostgreSQL Neon" -Direction Outbound -LocalPort 5432 -Protocol TCP -Action Allow
```

### 2. Désactiver temporairement l'antivirus
- Désactivez temporairement votre antivirus pour tester
- Si ça fonctionne, ajoutez une exception pour Node.js

### 3. Utiliser un VPN ou un autre réseau
- Essayez depuis un hotspot mobile
- Utilisez un VPN si votre réseau bloque les connexions

### 4. Vérifier les restrictions IP dans Neon
- Allez sur https://neon.tech
- Vérifiez les paramètres de sécurité/IP allowlist
- Ajoutez votre IP publique si nécessaire

### 5. Utiliser un tunnel SSH (si vous avez accès au serveur de production)
```bash
ssh -L 5432:ep-young-river-adgkr8vl.c-2.us-east-1.aws.neon.tech:5432 user@votre-serveur-production
```
Puis utilisez `localhost:5432` dans votre DATABASE_URL

### 6. Vérifier votre IP publique
```powershell
# Dans PowerShell
Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing
```
Vérifiez si cette IP est autorisée dans Neon.

## Solution temporaire : Utiliser la base de production via le serveur
Si rien ne fonctionne, vous pouvez :
1. Développer en local sans base de données
2. Tester directement sur le serveur de production
3. Utiliser une base de données locale pour le développement


