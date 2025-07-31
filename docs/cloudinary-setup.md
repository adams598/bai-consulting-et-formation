# Migration des médias vers Cloudinary (Solution Gratuite)

## Pourquoi Cloudinary ?

- **Gratuit** : 25 GB stockage + 25 GB bande passante/mois
- **Optimisation automatique** : Images et vidéos optimisées automatiquement
- **CDN global** : Distribution rapide dans le monde entier
- **API simple** : Intégration facile avec React
- **Transformations** : Redimensionnement, compression, formats adaptatifs

## Étape 1 : Créer un compte Cloudinary

1. Aller sur [cloudinary.com](https://cloudinary.com)
2. Cliquer sur "Sign Up For Free"
3. Créer un compte avec votre email
4. Noter vos identifiants :
   - Cloud Name
   - API Key
   - API Secret

## Étape 2 : Installer les dépendances

```bash
cd frontend
npm install cloudinary @cloudinary/url-gen
```

## Étape 3 : Configuration

Créer un fichier de configuration :

```javascript
// frontend/src/config/cloudinary.js
import { Cloudinary } from '@cloudinary/url-gen';

const cld = new Cloudinary({
  cloud: {
    cloudName: 'VOTRE_CLOUD_NAME'
  }
});

export default cld;
```

## Étape 4 : Variables d'environnement

```env
# frontend/.env
VITE_CLOUDINARY_CLOUD_NAME=votre_cloud_name
VITE_CLOUDINARY_API_KEY=votre_api_key
VITE_CLOUDINARY_API_SECRET=votre_api_secret
```

## Étape 5 : Upload des médias existants

### Script d'upload automatique :

```javascript
// scripts/upload-to-cloudinary.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFolder = async (folderPath, cloudinaryFolder) => {
  const files = fs.readdirSync(folderPath);
  
  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov)$/i)) {
      const filePath = path.join(folderPath, file);
      const publicId = `${cloudinaryFolder}/${path.parse(file).name}`;
      
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          public_id: publicId,
          resource_type: 'auto',
          folder: cloudinaryFolder
        });
        
        console.log(`✅ Uploadé: ${file} -> ${result.secure_url}`);
      } catch (error) {
        console.error(`❌ Erreur upload ${file}:`, error.message);
      }
    }
  }
};

// Upload des images
uploadFolder('./frontend/public/images', 'bai-consulting/images');
// Upload des vidéos
uploadFolder('./frontend/public/videos', 'bai-consulting/videos');
```

## Étape 6 : Mise à jour du code

### Remplacer les URLs locales par Cloudinary :

```javascript
// Avant
src="/images/assurance.webp"
src="/videos/assurance.mp4"

// Après
src="https://res.cloudinary.com/votre-cloud-name/image/upload/v1/bai-consulting/images/assurance.webp"
src="https://res.cloudinary.com/votre-cloud-name/video/upload/v1/bai-consulting/videos/assurance.mp4"
```

### Exemple de composant optimisé :

```javascript
// frontend/src/components/OptimizedImage.jsx
import { AdvancedImage, responsive, placeholder } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';

const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  }
});

export const OptimizedImage = ({ publicId, alt, className }) => {
  const image = cld.image(publicId);
  
  return (
    <AdvancedImage
      cldImg={image}
      plugins={[responsive(), placeholder()]}
      alt={alt}
      className={className}
    />
  );
};
```

## Étape 7 : Optimisations

### Images responsives automatiques :
```javascript
// URL avec transformations
const imageUrl = `https://res.cloudinary.com/votre-cloud-name/image/upload/f_auto,q_auto,w_800/bai-consulting/images/assurance.webp`;
```

### Vidéos optimisées :
```javascript
// URL vidéo avec compression
const videoUrl = `https://res.cloudinary.com/votre-cloud-name/video/upload/f_auto,q_auto/bai-consulting/videos/assurance.mp4`;
```

## Étape 8 : Mise à jour du .gitignore

```gitignore
# Supprimer les médias du repo
frontend/public/images/*
frontend/public/videos/*
!frontend/public/images/.gitkeep
!frontend/public/videos/.gitkeep
```

## Étape 9 : Script de migration

```bash
# 1. Installer les dépendances
npm install cloudinary

# 2. Configurer les variables d'environnement
# 3. Exécuter le script d'upload
node scripts/upload-to-cloudinary.js

# 4. Mettre à jour les URLs dans le code
# 5. Tester le site
# 6. Supprimer les fichiers locaux
```

## Avantages de cette solution :

✅ **Gratuit** pour votre volume actuel  
✅ **Performance** : CDN global  
✅ **Optimisation** automatique des médias  
✅ **Scalabilité** : Facile d'ajouter plus de stockage  
✅ **Sécurité** : URLs signées possibles  
✅ **Backup** : Sauvegarde automatique  

## Coûts futurs (si dépassement) :

- **25-50 GB** : ~$0.04/GB/mois
- **Bande passante** : ~$0.04/GB
- **Transformations** : Gratuites dans la limite

Cette solution vous permettra de réduire drastiquement la taille de votre repo et d'améliorer les performances de votre site ! 