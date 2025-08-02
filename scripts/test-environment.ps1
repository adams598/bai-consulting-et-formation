# Script PowerShell pour démarrer l'environnement de test BAI Consulting
# Usage: .\scripts\test-environment.ps1 [start|stop|restart|status|logs]

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "clean")]
    [string]$Action = "start"
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DockerComposeFile = Join-Path $ProjectRoot "docker-compose.test.yml"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Test-Docker {
    try {
        docker --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-DockerCompose {
    try {
        docker-compose --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Start-TestEnvironment {
    Write-Info "Démarrage de l'environnement de test..."
    
    if (-not (Test-Docker)) {
        Write-Error "Docker n'est pas installé ou n'est pas accessible"
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "Docker Compose n'est pas installé ou n'est pas accessible"
        exit 1
    }
    
    # Vérifier si le fichier docker-compose.test.yml existe
    if (-not (Test-Path $DockerComposeFile)) {
        Write-Error "Le fichier docker-compose.test.yml n'existe pas"
        exit 1
    }
    
    # Démarrer les services
    try {
        Set-Location $ProjectRoot
        docker-compose -f docker-compose.test.yml up -d
        
        Write-Info "Environnement de test démarré avec succès!"
        Write-Info "Services disponibles:"
        Write-Info "  - Frontend: http://localhost:3003"
        Write-Info "  - Backend: http://localhost:3002"
        Write-Info "  - Nginx: http://localhost:8080"
        Write-Info "  - PostgreSQL: localhost:5433"
        
        # Attendre que les services soient prêts
        Write-Info "Attente du démarrage des services..."
        Start-Sleep -Seconds 10
        
        # Vérifier le statut des services
        docker-compose -f docker-compose.test.yml ps
    }
    catch {
        Write-Error "Erreur lors du démarrage de l'environnement de test: $_"
        exit 1
    }
}

function Stop-TestEnvironment {
    Write-Info "Arrêt de l'environnement de test..."
    
    try {
        Set-Location $ProjectRoot
        docker-compose -f docker-compose.test.yml down
        
        Write-Info "Environnement de test arrêté avec succès!"
    }
    catch {
        Write-Error "Erreur lors de l'arrêt de l'environnement de test: $_"
        exit 1
    }
}

function Restart-TestEnvironment {
    Write-Info "Redémarrage de l'environnement de test..."
    Stop-TestEnvironment
    Start-Sleep -Seconds 5
    Start-TestEnvironment
}

function Get-TestEnvironmentStatus {
    Write-Info "Statut de l'environnement de test..."
    
    try {
        Set-Location $ProjectRoot
        docker-compose -f docker-compose.test.yml ps
    }
    catch {
        Write-Error "Erreur lors de la vérification du statut: $_"
        exit 1
    }
}

function Show-TestEnvironmentLogs {
    Write-Info "Affichage des logs de l'environnement de test..."
    
    try {
        Set-Location $ProjectRoot
        docker-compose -f docker-compose.test.yml logs -f
    }
    catch {
        Write-Error "Erreur lors de l'affichage des logs: $_"
        exit 1
    }
}

function Clean-TestEnvironment {
    Write-Warning "Nettoyage complet de l'environnement de test..."
    Write-Warning "Cette action supprimera tous les conteneurs, volumes et images de test"
    
    $confirmation = Read-Host "Êtes-vous sûr de vouloir continuer? (y/N)"
    if ($confirmation -eq "y" -or $confirmation -eq "Y") {
        try {
            Set-Location $ProjectRoot
            docker-compose -f docker-compose.test.yml down -v --rmi all
            
            Write-Info "Environnement de test nettoyé avec succès!"
        }
        catch {
            Write-Error "Erreur lors du nettoyage: $_"
            exit 1
        }
    }
    else {
        Write-Info "Nettoyage annulé"
    }
}

# Exécution de l'action demandée
switch ($Action) {
    "start" { Start-TestEnvironment }
    "stop" { Stop-TestEnvironment }
    "restart" { Restart-TestEnvironment }
    "status" { Get-TestEnvironmentStatus }
    "logs" { Show-TestEnvironmentLogs }
    "clean" { Clean-TestEnvironment }
    default { Start-TestEnvironment }
} 