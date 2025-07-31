# Script PowerShell pour nettoyer l'historique Git des vidéos
# Usage: .\scripts\clean-videos.ps1

Write-Host "🧹 Nettoyage de l'historique Git des vidéos..." -ForegroundColor Green

# Formats vidéo à supprimer
$VIDEO_EXTENSIONS = @(
    "*.mp4",
    "*.avi",
    "*.mov",
    "*.wmv",
    "*.flv",
    "*.webm",
    "*.mkv",
    "*.m4v",
    "*.3gp",
    "*.ogv",
    "*.mpg",
    "*.mpeg",
    "*.ts",
    "*.mts",
    "*.m2ts",
    "*.vob",
    "*.asf",
    "*.rm",
    "*.rmvb",
    "*.divx",
    "*.xvid",
    "*.h264",
    "*.h265",
    "*.hevc",
    "*.vp8",
    "*.vp9",
    "*.av1",
    "*.prores",
    "*.dnxhd",
    "*.cineform",
    "*.red",
    "*.arw",
    "*.r3d",
    "*.braw",
    "*.crm",
    "*.dng",
    "*.m3u8",
    "*.f4v",
    "*.f4p",
    "*.f4a",
    "*.f4b"
)

# Supprimer les fichiers vidéo du cache Git
foreach ($ext in $VIDEO_EXTENSIONS) {
    Write-Host "Suppression des fichiers $ext..." -ForegroundColor Yellow
    git filter-branch --force --index-filter "git rm --cached --ignore-unmatch $ext" --prune-empty --tag-name-filter cat -- --all
}

# Nettoyer les références
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host "✅ Nettoyage terminé !" -ForegroundColor Green
Write-Host "⚠️  ATTENTION: Si vous avez déjà poussé vers GitHub, vous devrez forcer le push:" -ForegroundColor Red
Write-Host "   git push origin --force --all" -ForegroundColor Cyan
Write-Host "   git push origin --force --tags" -ForegroundColor Cyan 