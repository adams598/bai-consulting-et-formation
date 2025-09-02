# Guide de Déploiement Vercel

## Variables d'Environnement Requises

### Frontend (Vercel)
```env
VITE_API_URL=https://votre-backend-url.com
VITE_AUTH_ENABLED=true
VITE_APP_NAME=BAI Consulting
VITE_APP_VERSION=1.0.0
```

### Backend (Vercel ou autre)
```env
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

## Étapes de Déploiement

### 1. Frontend (Vercel)
1. Connectez votre repository GitHub à Vercel
2. Configurez les variables d'environnement dans Vercel
3. Déployez automatiquement

### 2. Backend
- Option 1: Vercel (Serverless Functions)
- Option 2: Railway, Render, ou autre service
- Option 3: VPS traditionnel

## Configuration Post-Déploiement

1. Mettre à jour `VITE_API_URL` avec l'URL de votre backend
2. Vérifier que les routes CORS sont configurées
3. Tester l'authentification et les API

## Notes Importantes

- Le frontend utilise des URLs dynamiques basées sur `VITE_API_URL`
- La progression est sauvegardée localement en cas d'erreur réseau
- Compatible avec les environnements de développement et production
