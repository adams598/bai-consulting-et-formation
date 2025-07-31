#!/bin/bash

# Script pour nettoyer l'historique Git des vidéos
# Usage: ./scripts/clean-videos.sh

echo "🧹 Nettoyage de l'historique Git des vidéos..."

# Formats vidéo à supprimer
VIDEO_EXTENSIONS=(
    "*.mp4"
    "*.avi"
    "*.mov"
    "*.wmv"
    "*.flv"
    "*.webm"
    "*.mkv"
    "*.m4v"
    "*.3gp"
    "*.ogv"
    "*.mpg"
    "*.mpeg"
    "*.ts"
    "*.mts"
    "*.m2ts"
    "*.vob"
    "*.asf"
    "*.rm"
    "*.rmvb"
    "*.divx"
    "*.xvid"
    "*.h264"
    "*.h265"
    "*.hevc"
    "*.vp8"
    "*.vp9"
    "*.av1"
    "*.prores"
    "*.dnxhd"
    "*.cineform"
    "*.red"
    "*.arw"
    "*.r3d"
    "*.braw"
    "*.crm"
    "*.dng"
    "*.m3u8"
    "*.f4v"
    "*.f4p"
    "*.f4a"
    "*.f4b"
)

# Supprimer les fichiers vidéo du cache Git
for ext in "${VIDEO_EXTENSIONS[@]}"; do
    echo "Suppression des fichiers $ext..."
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch $ext" \
        --prune-empty --tag-name-filter cat -- --all
done

# Nettoyer les références
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Nettoyage terminé !"
echo "⚠️  ATTENTION: Si vous avez déjà poussé vers GitHub, vous devrez forcer le push:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags" 