# Guide d'Optimisation des Performances - BAI Consulting

## 🚀 Optimisations Implémentées

### 1. Configuration Vite Optimisée
- **Code Splitting** : Séparation automatique du bundle en chunks
- **Compression** : Gzip et Brotli pour tous les assets
- **Tree Shaking** : Élimination du code mort
- **Minification** : Terser avec suppression des console.log

### 2. Optimisation des Images
- **Lazy Loading** : Chargement différé des images
- **Formats modernes** : WebP avec fallback JPEG
- **Tailles multiples** : Images responsives (thumbnail, small, medium, large)
- **Compression intelligente** : Qualité optimisée selon l'usage

### 3. Optimisation des Vidéos
- **Compression H.264** : Réduction drastique de la taille
- **Tailles adaptatives** : Mobile (640p), Tablet (720p), Desktop (1080p)
- **Lazy Loading** : Chargement à la demande
- **Preload metadata** : Chargement rapide des métadonnées

### 4. Composants Optimisés
- **OptimizedMedia** : Composant unifié pour images et vidéos
- **Lazy Loading** : Suspense pour les composants non critiques
- **Mémorisation** : useMemo et useCallback pour éviter les re-renders
- **Placeholders** : Images de chargement optimisées

### 5. Configuration Nginx
- **Compression Gzip** : Réduction de 70-80% de la taille
- **Cache agressif** : 1 an pour les assets statiques
- **Headers de sécurité** : CSP, XSS Protection, etc.
- **Optimisations réseau** : Keep-alive, timeouts optimisés

## 📊 Gains de Performance Attendus

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Taille des images | 1-9MB | 50-200KB | 90-95% |
| Taille des vidéos | 5-24MB | 1-5MB | 70-80% |
| First Contentful Paint | ~3s | ~1s | 66% |
| Largest Contentful Paint | ~5s | ~2s | 60% |
| Bundle size | ~2MB | ~800KB | 60% |

## 🛠️ Scripts d'Optimisation

### Installation des dépendances
```bash
npm install
```

### Optimisation des images
```bash
npm run optimize-images
```
- Génère des versions optimisées dans `/public/images/optimized/`
- Formats : WebP et JPEG
- Tailles : thumbnail, small, medium, large

### Compression des vidéos
```bash
npm run compress-videos
```
- Nécessite FFmpeg installé
- Génère des versions compressées dans `/public/videos/compressed/`
- Qualités : mobile, tablet, desktop

### Optimisation complète
```bash
npm run optimize-all
```

### Analyse du bundle
```bash
npm run build:analyze
```
- Génère un rapport visuel dans `dist/bundle-report.html`

## 🎯 Utilisation des Composants Optimisés

### Images
```tsx
import { OptimizedImage } from '../components/OptimizedMedia';

<OptimizedImage
  src="/images/example.jpg"
  alt="Description"
  width={320}
  height={240}
  quality={80}
  format="webp"
  lazy={true}
/>
```

### Vidéos
```tsx
import { OptimizedVideo } from '../components/OptimizedMedia';

<OptimizedVideo
  src="/videos/example.mp4"
  className="w-full h-full"
  autoPlay
  loop
  muted
  lazy={true}
  preload="metadata"
/>
```

## 🔧 Configuration Cloudinary (Optionnel)

Pour une optimisation encore plus poussée, configurez Cloudinary :

1. Créez un compte sur [Cloudinary](https://cloudinary.com)
2. Ajoutez votre cloud name dans `.env` :
```env
VITE_CLOUDINARY_CLOUD_NAME=votre_cloud_name
```

3. Utilisez les composants avec publicId :
```tsx
<OptimizedImage
  publicId="bai-consulting/images/example"
  alt="Description"
  width={320}
  height={240}
/>
```

## 📈 Monitoring des Performances

### Lighthouse
- Lancez Lighthouse dans Chrome DevTools
- Ciblez un score de 90+ pour chaque métrique

### Web Vitals
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

### Bundle Analyzer
```bash
npm run build:analyze
```
- Identifiez les dépendances volumineuses
- Optimisez les imports

## 🚨 Bonnes Pratiques

### Images
- ✅ Utilisez toujours `OptimizedImage`
- ✅ Spécifiez `width` et `height`
- ✅ Utilisez `lazy={true}` pour les images hors écran
- ❌ Évitez les images > 1MB
- ❌ N'utilisez pas de formats obsolètes (BMP, TIFF)

### Vidéos
- ✅ Utilisez `OptimizedVideo`
- ✅ Compressez avant upload
- ✅ Utilisez `preload="metadata"` pour les vidéos autoplay
- ❌ Évitez les vidéos > 10MB
- ❌ N'utilisez pas de formats non supportés

### Code
- ✅ Utilisez `useMemo` et `useCallback`
- ✅ Implémentez le lazy loading
- ✅ Optimisez les imports
- ❌ Évitez les re-renders inutiles
- ❌ N'importez pas tout depuis les librairies

## 🔍 Dépannage

### Images qui ne se chargent pas
1. Vérifiez les chemins dans `/public/images/`
2. Lancez `npm run optimize-images`
3. Vérifiez les permissions des fichiers

### Vidéos qui ne se chargent pas
1. Vérifiez que FFmpeg est installé
2. Lancez `npm run compress-videos`
3. Vérifiez les formats supportés

### Performance lente
1. Vérifiez le bundle avec `npm run build:analyze`
2. Optimisez les dépendances volumineuses
3. Vérifiez la configuration Nginx

## 📚 Ressources

- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Web Vitals](https://web.dev/vitals/)
- [Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Video Optimization](https://web.dev/fast/#optimize-your-videos)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) 

# Configuration des variables d'environnement (API)

Pour la production (Hostinger) :
- Créez le fichier `frontend/.env.production` avec :
  
  ```env
  VITE_API_URL=https://backend-rczbsah5t-adams-projects-b35f6371.vercel.app
  ```

Pour le développement local :
- Créez le fichier `frontend/.env` avec :
  
  ```env
  VITE_API_URL=http://localhost:3001
  ```

Après modification, relancez le serveur de développement ou reconstruisez le frontend pour la production. 