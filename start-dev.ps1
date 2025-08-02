# Script PowerShell pour démarrer le backend et le frontend en mode développement
# Backend sur le port 3000, Frontend sur le port 3001

Write-Host "🚀 Démarrage de l'environnement de développement BAI Consulting" -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "package.json") -and -not (Test-Path "backend/package.json")) {
    Write-Host "⚠️  Veuillez exécuter ce script depuis la racine du projet" -ForegroundColor Yellow
    exit 1
}

# Fonction pour démarrer le backend
function Start-Backend {
    Write-Host "🔧 Démarrage du backend sur le port 3000..." -ForegroundColor Blue
    Set-Location backend
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"
    Set-Location ..
    Write-Host "✅ Backend démarré" -ForegroundColor Green
}

# Fonction pour démarrer le frontend
function Start-Frontend {
    Write-Host "🎨 Démarrage du frontend sur le port 3001..." -ForegroundColor Blue
    Set-Location frontend
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"
    Set-Location ..
    Write-Host "✅ Frontend démarré" -ForegroundColor Green
}

# Vérifier les dépendances
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Yellow

# Vérifier le backend
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "📦 Installation des dépendances backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Vérifier le frontend
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "📦 Installation des dépendances frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host "✅ Dépendances vérifiées" -ForegroundColor Green

# Démarrer les serveurs
Start-Backend
Start-Sleep -Seconds 2
Start-Frontend

Write-Host ""
Write-Host "🎉 Environnement de développement prêt !" -ForegroundColor Green
Write-Host "📍 URLs d'accès :" -ForegroundColor Blue
Write-Host "   🌐 Frontend (Admin) : http://localhost:3001/admin/login" -ForegroundColor Green
Write-Host "   🌐 Frontend (Formation) : http://localhost:3001/formation/login" -ForegroundColor Green
Write-Host "   🔧 Backend API : http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Appuyez sur Ctrl+C pour arrêter les serveurs" -ForegroundColor Yellow

# Attendre que les serveurs soient prêts
Start-Sleep -Seconds 5

# Vérifier que les serveurs sont bien démarrés
Write-Host ""
Write-Host "🔍 Vérification des serveurs..." -ForegroundColor Blue

# Vérifier le backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend accessible sur http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend non accessible sur http://localhost:3000" -ForegroundColor Yellow
}

# Vérifier le frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Frontend accessible sur http://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend non accessible sur http://localhost:3001" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Prêt à développer !" -ForegroundColor Blue
Write-Host "Appuyez sur une touche pour arrêter les serveurs..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 