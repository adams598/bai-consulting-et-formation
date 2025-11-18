# Script PowerShell de test de déploiement pour BAI Consulting
# Usage: .\scripts\test-deployment.ps1 [domain]

param(
    [string]$Domain = "localhost"
)

$BaseUrl = "http://$Domain"
$ApiUrl = "http://$Domain:3001"

Write-Host "🧪 Tests de déploiement BAI Consulting" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "🌐 Domaine: $Domain" -ForegroundColor Cyan
Write-Host "🔗 Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "🔗 API URL: $ApiUrl" -ForegroundColor Cyan
Write-Host ""

# Compteurs
$TotalTests = 0
$PassedTests = 0

# Fonction de test
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "🔍 Test $Name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "✅ OK ($($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ FAIL ($($response.StatusCode), attendu: $ExpectedStatus)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ FAIL (connexion impossible)" -ForegroundColor Red
        return $false
    }
}

# Fonction de test avec contenu
function Test-EndpointContent {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExpectedContent
    )
    
    Write-Host "🔍 Test $Name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($response.Content -like "*$ExpectedContent*") {
            Write-Host "✅ OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ FAIL (contenu non trouvé)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ FAIL (connexion impossible)" -ForegroundColor Red
        return $false
    }
}

# Tests des services Docker
Write-Host "🐳 Tests des services Docker" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

# Test PostgreSQL
Write-Host "🔍 Test PostgreSQL... " -NoNewline
try {
    $pgTest = docker exec bai-postgres-test pg_isready -U bai_user -d bai_consulting 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ OK" -ForegroundColor Green
        $PassedTests++
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
}
$TotalTests++

# Test Redis
Write-Host "🔍 Test Redis... " -NoNewline
try {
    $redisTest = docker exec bai-redis-prod redis-cli ping 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ OK" -ForegroundColor Green
        $PassedTests++
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
}
$TotalTests++

Write-Host ""

# Tests HTTP
Write-Host "🌐 Tests HTTP" -ForegroundColor Yellow
Write-Host "-------------" -ForegroundColor Yellow

# Test Frontend
if (Test-Endpoint "Frontend" "$BaseUrl/health" 200) {
    $PassedTests++
}
$TotalTests++

# Test API Backend
if (Test-Endpoint "API Backend" "$ApiUrl/api/admin/auth/health" 200) {
    $PassedTests++
}
$TotalTests++

Write-Host ""

# Tests de fonctionnalités
Write-Host "⚙️ Tests de fonctionnalités" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Yellow

# Test de la page d'accueil
if (Test-EndpointContent "Page d'accueil" "$BaseUrl" "BAI Consulting") {
    $PassedTests++
}
$TotalTests++

# Test de l'API de santé
if (Test-EndpointContent "API Santé" "$ApiUrl/api/admin/auth/health" "healthy") {
    $PassedTests++
}
$TotalTests++

Write-Host ""

# Tests de sécurité
Write-Host "🔒 Tests de sécurité" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

# Test des headers de sécurité
Write-Host "🔍 Test Headers de sécurité... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri $BaseUrl -Method HEAD -TimeoutSec 10 -UseBasicParsing
    $securityHeaders = 0
    if ($response.Headers["X-Frame-Options"]) { $securityHeaders++ }
    if ($response.Headers["X-Content-Type-Options"]) { $securityHeaders++ }
    if ($response.Headers["X-XSS-Protection"]) { $securityHeaders++ }
    
    if ($securityHeaders -ge 2) {
        Write-Host "✅ OK ($securityHeaders/3 headers)" -ForegroundColor Green
        $PassedTests++
    } else {
        Write-Host "❌ FAIL ($securityHeaders/3 headers)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL (connexion impossible)" -ForegroundColor Red
}
$TotalTests++

Write-Host ""

# Tests de performance
Write-Host "⚡ Tests de performance" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Yellow

# Test de temps de réponse
Write-Host "🔍 Test Temps de réponse... " -NoNewline
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET -TimeoutSec 10 -UseBasicParsing
    $stopwatch.Stop()
    $responseTime = $stopwatch.Elapsed.TotalSeconds
    
    if ($responseTime -lt 2.0) {
        Write-Host "✅ OK ($([math]::Round($responseTime, 2))s)" -ForegroundColor Green
        $PassedTests++
    } else {
        Write-Host "⚠️ SLOW ($([math]::Round($responseTime, 2))s)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAIL (connexion impossible)" -ForegroundColor Red
}
$TotalTests++

Write-Host ""

# Tests de base de données
Write-Host "🗄️ Tests de base de données" -ForegroundColor Yellow
Write-Host "--------------------------" -ForegroundColor Yellow

# Test de connexion PostgreSQL
Write-Host "🔍 Test Connexion PostgreSQL... " -NoNewline
try {
    $dbTest = docker exec bai-postgres-test psql -U bai_user -d bai_consulting -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ OK" -ForegroundColor Green
        $PassedTests++
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
}
$TotalTests++

Write-Host ""

# Résumé des tests
Write-Host "📊 Résumé des tests" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow
Write-Host "Total des tests: $TotalTests" -ForegroundColor White
Write-Host "Tests réussis: $PassedTests" -ForegroundColor Green
Write-Host "Tests échoués: $($TotalTests - $PassedTests)" -ForegroundColor Red
$successRate = [math]::Round(($PassedTests * 100 / $TotalTests), 1)
Write-Host "Taux de réussite: $successRate%" -ForegroundColor Cyan

if ($PassedTests -eq $TotalTests) {
    Write-Host "`n🎉 Tous les tests sont passés ! Déploiement réussi !" -ForegroundColor Green
    exit 0
} elseif ($PassedTests -ge ($TotalTests * 80 / 100)) {
    Write-Host "`n⚠️ La plupart des tests sont passés. Déploiement acceptable." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`n❌ Trop de tests ont échoué. Déploiement problématique." -ForegroundColor Red
    exit 1
}



























