# Script de déploiement automatique sur Hostinger pour BAI Consulting (PowerShell)
# Usage: .\scripts\deploy-hostinger.ps1 [domain] [username] [host]

param(
    [string]$Domain = "votre-domaine.com",
    [string]$HostingerUser = "votre_utilisateur",
    [string]$HostingerHost = "votre-serveur.hostinger.com"
)

Write-Host "🚀 Déploiement BAI Consulting sur Hostinger" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "🌐 Domaine: $Domain" -ForegroundColor Yellow
Write-Host "🖥️  Serveur: $HostingerHost" -ForegroundColor Yellow
Write-Host "👤 Utilisateur: $HostingerUser" -ForegroundColor Yellow
Write-Host ""

# Vérification des prérequis
Write-Host "🔍 Vérification des prérequis..." -ForegroundColor Cyan

# Test de connexion SSH
Write-Host "🔌 Test de connexion SSH..." -ForegroundColor Cyan
try {
    ssh -o ConnectTimeout=10 -o BatchMode=yes "$HostingerUser@$HostingerHost" exit
    Write-Host "✅ Connexion SSH réussie" -ForegroundColor Green
} catch {
    Write-Host "❌ Impossible de se connecter au serveur Hostinger" -ForegroundColor Red
    Write-Host "📝 Vérifiez vos credentials SSH" -ForegroundColor Yellow
    exit 1
}

# Construction des images Docker
Write-Host "🔨 Construction des images Docker..." -ForegroundColor Cyan
docker-compose -f docker-compose.postgresql.yml build --no-cache

# Création du package de déploiement
Write-Host "📦 Création du package de déploiement..." -ForegroundColor Cyan
if (Test-Path "deploy-package") {
    Remove-Item -Recurse -Force "deploy-package"
}
New-Item -ItemType Directory -Name "deploy-package" | Out-Null

# Copie des fichiers nécessaires
Copy-Item -Recurse "backend" "deploy-package/"
Copy-Item -Recurse "frontend" "deploy-package/"
Copy-Item "docker-compose.postgresql.yml" "deploy-package/"
Copy-Item "package.json" "deploy-package/"
Copy-Item "package-lock.json" "deploy-package/"

# Copie des scripts de déploiement
Copy-Item "scripts/deploy-hostinger.sh" "deploy-package/"
Copy-Item "scripts/migrate-to-postgresql.js" "deploy-package/"
Copy-Item "scripts/generate-secrets.js" "deploy-package/"

# Copie de la documentation
Copy-Item "DEPLOYMENT-HOSTINGER.md" "deploy-package/"
Copy-Item "DEPLOYMENT-PRODUCTION.md" "deploy-package/"

# Exclusion des fichiers inutiles
@"
node_modules
*.log
.env
uploads
"@ | Out-File -FilePath "deploy-package/.dockerignore" -Encoding UTF8

# Compression du package
Write-Host "🗜️ Compression du package..." -ForegroundColor Cyan
Compress-Archive -Path "deploy-package/*" -DestinationPath "bai-consulting-deploy.zip" -Force

# Upload vers Hostinger
Write-Host "📤 Upload vers Hostinger..." -ForegroundColor Cyan
scp "bai-consulting-deploy.zip" "$HostingerUser@$HostingerHost`:~/"

# Déploiement sur le serveur
Write-Host "🚀 Déploiement sur le serveur..." -ForegroundColor Cyan
$deployScript = @"
# Extraction du package
unzip -o bai-consulting-deploy.zip
cd deploy-package

# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# Note: Éditer manuellement .env avec les vraies valeurs

# Migration de la base de données
npm run db:migrate

# Construction des images Docker
docker-compose -f docker-compose.postgresql.yml build

# Démarrage des services
docker-compose -f docker-compose.postgresql.yml up -d

# Vérification du déploiement
sleep 30
docker-compose -f docker-compose.postgresql.yml ps

# Test de santé
curl -f http://localhost:3000/api/admin/auth/health || echo "Service non disponible"

echo "✅ Déploiement terminé"
"@

# Exécution du script de déploiement
ssh "$HostingerUser@$HostingerHost" $deployScript

# Nettoyage local
Remove-Item -Recurse -Force "deploy-package"
Remove-Item "bai-consulting-deploy.zip"

Write-Host "🎉 Déploiement sur Hostinger terminé !" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "🌐 Application accessible sur: https://$Domain" -ForegroundColor Yellow
Write-Host "📊 Monitoring: ssh $HostingerUser@$HostingerHost 'docker-compose -f deploy-package/docker-compose.postgresql.yml logs -f'" -ForegroundColor Yellow
Write-Host "🔧 Maintenance: ssh $HostingerUser@$HostingerHost 'cd deploy-package && docker-compose -f docker-compose.postgresql.yml restart'" -ForegroundColor Yellow


