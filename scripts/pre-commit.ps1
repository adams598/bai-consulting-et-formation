# Pre-commit hook PowerShell pour empêcher l'ajout de vidéos
# Usage: .\scripts\pre-commit.ps1

# Formats vidéo à bloquer (exclure les fichiers TypeScript)
$VIDEO_EXTENSIONS = @(
    "\.mp4$", "\.avi$", "\.mov$", "\.wmv$", "\.flv$", "\.webm$", "\.mkv$", 
    "\.m4v$", "\.3gp$", "\.ogv$", "\.mpg$", "\.mpeg$", "\.mts$", 
    "\.m2ts$", "\.vob$", "\.asf$", "\.rm$", "\.rmvb$", "\.divx$", "\.xvid$",
    "\.h264$", "\.h265$", "\.hevc$", "\.vp8$", "\.vp9$", "\.av1$", "\.prores$",
    "\.dnxhd$", "\.cineform$", "\.red$", "\.arw$", "\.r3d$", "\.braw$", 
    "\.crm$", "\.dng$", "\.m3u8$", "\.f4v$", "\.f4p$", "\.f4a$", "\.f4b$"
)

$MAX_SIZE = 104857600  # 100MB

# Vérifier les fichiers staged
$stagedFiles = git diff --cached --name-only

foreach ($file in $stagedFiles) {
    # Ignorer les fichiers TypeScript (.ts) mais pas les fichiers vidéo .mts et .m2ts
    if ($file -match "\.ts$" -and $file -notmatch "\.mts$|\.m2ts$") {
        continue
    }
    
    # Vérifier si c'est un fichier vidéo
    foreach ($ext in $VIDEO_EXTENSIONS) {
        if ($file -match $ext) {
            Write-Host "❌ ERREUR: Tentative d'ajout d'un fichier vidéo: $file" -ForegroundColor Red
            Write-Host "📝 Les vidéos ne doivent pas être versionnées dans Git." -ForegroundColor Yellow
            Write-Host "💡 Solutions alternatives:" -ForegroundColor Cyan
            Write-Host "   - Utiliser Cloudinary pour les vidéos publiques" -ForegroundColor White
            Write-Host "   - Stocker les URLs dans le code" -ForegroundColor White
            Write-Host "   - Utiliser Git LFS si nécessaire" -ForegroundColor White
            Write-Host ""
            Write-Host "🔧 Pour ignorer ce fichier:" -ForegroundColor Yellow
            Write-Host "   git reset HEAD $file" -ForegroundColor White
            Write-Host "   echo '$file' >> .gitignore" -ForegroundColor White
            exit 1
        }
    }
    
    # Vérifier la taille du fichier
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        if ($size -gt $MAX_SIZE) {
            $sizeMB = [math]::Round($size / 1MB, 2)
            Write-Host "❌ ERREUR: Fichier trop volumineux: $file ($sizeMB MB)" -ForegroundColor Red
            Write-Host "📝 GitHub limite les fichiers à 100MB." -ForegroundColor Yellow
            Write-Host "💡 Solutions:" -ForegroundColor Cyan
            Write-Host "   - Utiliser Git LFS" -ForegroundColor White
            Write-Host "   - Diviser le fichier" -ForegroundColor White
            Write-Host "   - Utiliser un service externe" -ForegroundColor White
            exit 1
        }
    }
}

Write-Host "✅ Pre-commit hook: Aucun fichier vidéo détecté" -ForegroundColor Green
exit 0 