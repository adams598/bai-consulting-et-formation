# Script de démarrage sécurisé pour BAI Consulting (Windows PowerShell)
# Usage: .\scripts\start-secure.ps1 [dev|prod]

param(
    [string]$Mode = "dev"
)

# Couleurs pour les logs
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Fonction de logging
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Log "✅ $Message" -Color $Green
}

function Write-LogWarning {
    param([string]$Message)
    Write-Log "⚠️ $Message" -Color $Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Log "❌ $Message" -Color $Red
}

# Fonction pour vérifier les prérequis
function Test-Prerequisites {
    Write-Log "Vérification des prérequis..." -Color $Blue
    
    # Vérifier Node.js
    try {
        $nodeVersion = node --version
        Write-LogSuccess "Node.js installé: $nodeVersion"
    }
    catch {
        Write-LogError "Node.js n'est pas installé"
        exit 1
    }
    
    # Vérifier npm
    try {
        $npmVersion = npm --version
        Write-LogSuccess "npm installé: $npmVersion"
    }
    catch {
        Write-LogError "npm n'est pas installé"
        exit 1
    }
    
    # Vérifier Docker (si mode production)
    if ($Mode -eq "prod") {
        try {
            $dockerVersion = docker --version
            Write-LogSuccess "Docker installé: $dockerVersion"
        }
        catch {
            Write-LogError "Docker n'est pas installé"
            exit 1
        }
    }
    
    Write-LogSuccess "Prérequis vérifiés"
}

# Fonction pour vérifier les variables d'environnement
function Test-Environment {
    Write-Log "Vérification des variables d'environnement..." -Color $Blue
    
    # Charger le fichier .env s'il existe
    if (Test-Path ".env") {
        Get-Content ".env" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
        Write-LogSuccess "Fichier .env chargé"
    }
    else {
        Write-LogWarning "Fichier .env non trouvé"
    }
    
    # Variables obligatoires
    $requiredVars = @("JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL")
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        $value = [Environment]::GetEnvironmentVariable($var, "Process")
        if (-not $value) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-LogError "Variables d'environnement manquantes: $($missingVars -join ', ')"
        Write-Log "Créez un fichier .env basé sur env.example" -Color $Blue
        Write-Log "Ou exécutez: node scripts/generate-secrets.js" -Color $Blue
        exit 1
    }
    
    # Vérifier la force du JWT_SECRET
    $jwtSecret = [Environment]::GetEnvironmentVariable("JWT_SECRET", "Process")
    if ($jwtSecret.Length -lt 32) {
        Write-LogWarning "JWT_SECRET est trop court (minimum 32 caractères)"
    }
    
    Write-LogSuccess "Variables d'environnement vérifiées"
}

# Fonction pour installer les dépendances
function Install-Dependencies {
    Write-Log "Installation des dépendances..." -Color $Blue
    
    # Backend
    if (Test-Path "backend/package.json") {
        Write-Log "Installation des dépendances backend..." -Color $Blue
        Set-Location "backend"
        npm ci --only=production
        Set-Location ".."
        Write-LogSuccess "Dépendances backend installées"
    }
    
    # Frontend
    if (Test-Path "frontend/package.json") {
        Write-Log "Installation des dépendances frontend..." -Color $Blue
        Set-Location "frontend"
        npm ci --only=production
        Set-Location ".."
        Write-LogSuccess "Dépendances frontend installées"
    }
}

# Fonction pour vérifier la base de données
function Test-Database {
    Write-Log "Vérification de la base de données..." -Color $Blue
    
    # Vérifier si la base de données existe
    $databaseUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
    if ($databaseUrl -like "file:*" -and -not (Test-Path "backend/prisma/dev.db")) {
        Write-Log "Initialisation de la base de données SQLite..." -Color $Blue
        Set-Location "backend"
        npx prisma db push
        npx prisma db seed
        Set-Location ".."
        Write-LogSuccess "Base de données initialisée"
    }
    
    # Vérifier les migrations
    if (Test-Path "backend/prisma/migrations") {
        Write-Log "Vérification des migrations..." -Color $Blue
        Set-Location "backend"
        npx prisma migrate status
        Set-Location ".."
        Write-LogSuccess "Migrations vérifiées"
    }
}

# Fonction pour démarrer en mode développement
function Start-Development {
    Write-Log "Démarrage en mode développement..." -Color $Blue
    
    # Démarrer le backend
    Write-Log "Démarrage du backend..." -Color $Blue
    Set-Location "backend"
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal
    Set-Location ".."
    
    # Attendre que le backend soit prêt
    Start-Sleep -Seconds 5
    
    # Démarrer le frontend
    Write-Log "Démarrage du frontend..." -Color $Blue
    Set-Location "frontend"
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal
    Set-Location ".."
    
    Write-LogSuccess "Application démarrée en mode développement"
    Write-Log "Backend: http://localhost:3000" -Color $Blue
    Write-Log "Frontend: http://localhost:3001" -Color $Blue
    Write-Log "Health Check: http://localhost:3000/api/admin/auth/health" -Color $Blue
}

# Fonction pour démarrer en mode production
function Start-Production {
    Write-Log "Démarrage en mode production..." -Color $Blue
    
    # Vérifier que Docker est disponible
    try {
        docker --version | Out-Null
    }
    catch {
        Write-LogError "Docker est requis pour le mode production"
        exit 1
    }
    
    # Construire les images
    Write-Log "Construction des images Docker..." -Color $Blue
    docker-compose -f docker-compose.yml build
    
    # Démarrer les services
    Write-Log "Démarrage des services..." -Color $Blue
    docker-compose -f docker-compose.yml up -d
    
    Write-LogSuccess "Application démarrée en mode production"
    Write-Log "Frontend: http://localhost:80" -Color $Blue
    Write-Log "Backend: http://localhost:3001" -Color $Blue
    Write-Log "Health Check: http://localhost:3001/api/admin/auth/health" -Color $Blue
    
    # Afficher les logs
    docker-compose -f docker-compose.yml logs -f
}

# Fonction principale
function Main {
    Write-Log "🚀 Démarrage de BAI Consulting en mode $Mode" -Color $Blue
    
    # Vérifications préliminaires
    Test-Prerequisites
    
    Test-Environment
    
    # Actions selon le mode
    switch ($Mode) {
        "dev" {
            Install-Dependencies
            Test-Database
            Start-Development
        }
        "prod" {
            Start-Production
        }
        default {
            Write-LogError "Mode invalide: $Mode. Utilisez 'dev' ou 'prod'"
            exit 1
        }
    }
}

# Exécution
Main




