# Gestion des Vidéos - BAI Consulting

## 🎥 Politique d'Exclusion des Vidéos

### Pourquoi exclure les vidéos de Git ?

1. **Taille des fichiers** : Les vidéos sont généralement très volumineuses
2. **Performance** : Ralentissent les clones et pulls
3. **Limites GitHub** : GitHub a des limites de taille de fichier (100MB)
4. **Coût** : Stockage et bande passante coûteux
5. **Sécurité** : Éviter de stocker des contenus sensibles

## 📁 Structure Recommandée pour les Vidéos

```
BAI-consulting/
├── videos/                    # Dossier local (non versionné)
│   ├── formations/
│   │   ├── banque/
│   │   ├── assurance/
│   │   └── immobilier/
│   ├── presentations/
│   └── marketing/
├── frontend/public/videos/    # Vidéos publiques (optionnel)
└── backend/uploads/videos/    # Uploads utilisateurs (optionnel)
```

## 🔧 Configuration Actuelle

### Formats Vidéo Exclus
- **Courants** : MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V
- **Professionnels** : ProRes, DNxHD, CineForm, RED, BRAW
- **Streaming** : M3U8, TS, F4V
- **Codecs** : H.264, H.265, HEVC, VP8, VP9, AV1

### Dossiers Exclus
```
**/videos/**
**/video/**
**/media/videos/**
**/assets/videos/**
**/public/videos/**
**/frontend/public/videos/**
**/frontend/src/assets/videos/**
**/backend/uploads/videos/**
**/uploads/videos/**
```

## 🚀 Solutions Alternatives

### 1. **Cloudinary (Recommandé)**
```javascript
// Exemple d'utilisation
import { Cloudinary } from '@cloudinary/url-gen';

const cld = new Cloudinary({
  cloud: {
    cloudName: 'your-cloud-name'
  }
});

// URL de vidéo optimisée
const videoUrl = cld.video('sample-video').toURL();
```

### 2. **YouTube/Vimeo**
- Uploader les vidéos sur YouTube/Vimeo
- Utiliser les URLs d'intégration
- Avantages : CDN, optimisation automatique

### 3. **AWS S3 + CloudFront**
- Stockage sur S3
- Distribution via CloudFront
- Contrôle total sur les fichiers

### 4. **Git LFS (Large File Storage)**
Si vous devez absolument versionner des vidéos :
```bash
# Installer Git LFS
git lfs install

# Track les vidéos
git lfs track "*.mp4"
git lfs track "*.mov"

# Ajouter .gitattributes
git add .gitattributes
```

## 📋 Workflow Recommandé

### Pour les Développeurs
1. **Ne jamais commiter de vidéos** dans Git
2. **Utiliser Cloudinary** pour les vidéos publiques
3. **Documenter les URLs** dans le code
4. **Tester les liens** avant déploiement

### Pour les Contributeurs
1. **Vérifier le .gitignore** avant de commiter
2. **Utiliser les scripts de nettoyage** si nécessaire
3. **Demander l'URL** si une vidéo est manquante

## 🧹 Scripts de Nettoyage

### Windows (PowerShell)
```powershell
.\scripts\clean-videos.ps1
```

### Linux/Mac (Bash)
```bash
./scripts/clean-videos.sh
```

### Manuel
```bash
# Vérifier les fichiers vidéo trackés
git ls-files | grep -E "\.(mp4|avi|mov|wmv|flv|webm|mkv)$"

# Supprimer du cache Git
git rm --cached path/to/video.mp4

# Nettoyer l'historique (⚠️ DANGEREUX)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch *.mp4" \
  --prune-empty --tag-name-filter cat -- --all
```

## ⚠️ Avertissements Importants

### Avant de Nettoyer l'Historique
1. **Sauvegarder** votre repository
2. **Coordonner** avec l'équipe
3. **Forcer le push** après nettoyage
4. **Notifier** tous les contributeurs

### Commandes Post-Nettoyage
```bash
# Forcer le push (après nettoyage)
git push origin --force --all
git push origin --force --tags

# Nettoyer les autres clones
git clone --mirror https://github.com/user/repo.git
git push --mirror
```

## 📊 Monitoring

### Vérifier la Taille du Repository
```bash
# Taille du .git
du -sh .git

# Fichiers les plus volumineux
git ls-files | xargs ls -la | sort -k5 -nr | head -10
```

### Alertes Automatiques
- **GitHub Actions** : Détecter les gros fichiers
- **Pre-commit hooks** : Empêcher les vidéos
- **CI/CD** : Vérifier la taille du build

## 🔗 Ressources Utiles

- [Git LFS Documentation](https://git-lfs.github.com/)
- [Cloudinary Video API](https://cloudinary.com/documentation/video_manipulation_and_delivery)
- [GitHub File Size Limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)

---

**Dernière mise à jour** : $(date)
**Responsable** : Équipe Technique BAI Consulting 