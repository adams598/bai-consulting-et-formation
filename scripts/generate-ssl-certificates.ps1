# Script PowerShell de génération de certificats SSL/TLS pour BAI Consulting
# Usage: .\scripts\generate-ssl-certificates.ps1 [domain]

param(
    [string]$Domain = "localhost"
)

$CertDir = ".\ssl"
$Days = 365

Write-Host "🔒 Génération de certificats SSL/TLS pour $Domain" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Création du répertoire SSL
if (!(Test-Path $CertDir)) {
    New-Item -ItemType Directory -Path $CertDir -Force
    Write-Host "📁 Répertoire SSL créé: $CertDir" -ForegroundColor Yellow
}

# Génération de certificats auto-signés avec PowerShell
Write-Host "🔑 Génération de certificats auto-signés..." -ForegroundColor Yellow

try {
    # Création d'un certificat auto-signé
    $cert = New-SelfSignedCertificate `
        -Subject "CN=$Domain, O=BAI Consulting, L=Paris, S=France, C=FR" `
        -DnsName @($Domain, "localhost", "127.0.0.1") `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -HashAlgorithm SHA256 `
        -NotAfter (Get-Date).AddDays($Days)

    # Export du certificat en format PEM
    $certPath = "$CertDir\server.crt"
    $keyPath = "$CertDir\server.key"
    
    # Export de la clé privée
    $cert.PrivateKey.ExportPkcs8PrivateKey() | Out-File -FilePath $keyPath -Encoding ASCII
    
    # Export du certificat
    $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert) | Out-File -FilePath $certPath -Encoding ASCII
    
    # Conversion en format PEM
    $certPem = "-----BEGIN CERTIFICATE-----`n"
    $certPem += [System.Convert]::ToBase64String($cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert), [System.Base64FormattingOptions]::InsertLineBreaks)
    $certPem += "`n-----END CERTIFICATE-----"
    
    $certPem | Out-File -FilePath $certPath -Encoding ASCII
    
    # Conversion de la clé en format PEM
    $keyBytes = $cert.PrivateKey.ExportPkcs8PrivateKey()
    $keyPem = "-----BEGIN PRIVATE KEY-----`n"
    $keyPem += [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
    $keyPem += "`n-----END PRIVATE KEY-----"
    
    $keyPem | Out-File -FilePath $keyPath -Encoding ASCII
    
    Write-Host "✅ Certificats générés avec succès !" -ForegroundColor Green
    Write-Host "📁 Répertoire: $CertDir" -ForegroundColor Cyan
    Write-Host "🔑 Clé privée: $keyPath" -ForegroundColor Cyan
    Write-Host "📜 Certificat: $certPath" -ForegroundColor Cyan
    
    # Affichage des informations du certificat
    Write-Host "`n📋 Informations du certificat:" -ForegroundColor Yellow
    Write-Host "Sujet: $($cert.Subject)" -ForegroundColor White
    Write-Host "Émetteur: $($cert.Issuer)" -ForegroundColor White
    Write-Host "Valide du: $($cert.NotBefore)" -ForegroundColor White
    Write-Host "Valide jusqu'au: $($cert.NotAfter)" -ForegroundColor White
    Write-Host "Empreinte: $($cert.Thumbprint)" -ForegroundColor White
    
    # Nettoyage du certificat du magasin
    Remove-Item -Path "Cert:\CurrentUser\My\$($cert.Thumbprint)" -Force
    
    Write-Host "`n🎉 Génération terminée avec succès !" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erreur lors de la génération des certificats: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Création d'un fichier de configuration pour Docker
$dockerConfig = @"
# Configuration SSL pour Docker Compose
# Ces certificats sont générés automatiquement pour le développement

# Variables d'environnement SSL
SSL_CERT_PATH=/etc/ssl/custom/server.crt
SSL_KEY_PATH=/etc/ssl/custom/server.key
SSL_ENABLED=true

# Domaines autorisés
ALLOWED_ORIGINS=https://$Domain,https://localhost
"@

$dockerConfig | Out-File -FilePath "$CertDir\.env.ssl" -Encoding UTF8

Write-Host "📝 Fichier de configuration Docker créé: $CertDir\.env.ssl" -ForegroundColor Cyan

Write-Host "`n🚀 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Copier les certificats dans le conteneur Docker:" -ForegroundColor White
Write-Host "   docker cp $CertDir\server.crt bai-frontend-prod:/etc/ssl/certs/" -ForegroundColor Gray
Write-Host "   docker cp $CertDir\server.key bai-frontend-prod:/etc/ssl/private/" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Redémarrer les services:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.postgresql.yml restart frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Tester l'accès HTTPS:" -ForegroundColor White
Write-Host "   Invoke-WebRequest -Uri https://localhost -SkipCertificateCheck" -ForegroundColor Gray















