# Configuration de déploiement pour Hostinger

## Variables d'environnement à configurer

Avant de déployer, créez un fichier `.env.production` dans le dossier `frontend/` avec :

```
VITE_API_URL=https://votre-backend-url.com
```

## Étapes de déploiement

### 1. Construire le projet
```bash
npm run build
```

### 2. Déployer sur Hostinger

#### Option A : Hébergement Web
1. Connectez-vous à votre panneau de contrôle Hostinger
2. Accédez au gestionnaire de fichiers
3. Naviguez vers `public_html`
4. Uploadez tous les fichiers du dossier `dist/`

#### Option B : VPS Hostinger
1. Connectez-vous à votre VPS via SSH
2. Installez Docker et Docker Compose
3. Uploadez les fichiers du projet
4. Exécutez `docker-compose up -d`

## Configuration du backend

Pour que le formulaire de contact fonctionne, vous devez déployer le backend sur :
- Vercel (recommandé, gratuit)
- Railway
- Render
- Ou un VPS Hostinger

## URLs à mettre à jour

Dans `frontend/.env.production`, remplacez `https://votre-backend-url.com` par l'URL réelle de votre backend déployé. 