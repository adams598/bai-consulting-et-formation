# 🚀 Configuration Vercel pour le Backend

## ✅ Corrections appliquées

1. **Script `vercel-build` corrigé** : Utilise maintenant `prisma db push` au lieu de `prisma migrate deploy`
2. **Fichier `migration_lock.toml` supprimé** : Élimine le conflit SQLite/PostgreSQL
3. **Fichier `vercel.json` créé** à la racine : Configure Vercel pour pointer vers le backend

## 📋 Configuration dans Vercel Dashboard

### 1. Variables d'environnement

Dans votre projet Vercel, allez dans **Settings → Environment Variables** et ajoutez :

```env
NODE_ENV=production
DATABASE_URL=votre-url-neon-db-complete
JWT_SECRET=38444f65d9c12cc5c6d47fcbc9f52f159c9d9324b8e0273580922345bbefeded7a97cf709fba9845474a2c05dbb7827830601c9eace80e0d8c42a5d66c6085f5
JWT_REFRESH_SECRET=a285da89d512fd729c381f5e529456a6234f523b1496f6245de61aa2afadc0185db8f4c27085a041337ea753a0f09e7d23152e365642b855812d97416eb26f048be64e46a5369572a1019129bd8d60d5b1e11c60262a539fdfbb7ffd1a740eaa348a653897492613590616ad04729238f39f915b16fa7ab8ed1ce287436789a6
CORS_ALLOWED_ORIGINS=https://olivedrab-hornet-656554.hostingersite.com
FRONTEND_URL=https://olivedrab-hornet-656554.hostingersite.com
```

### 2. Build & Development Settings

Dans **Settings → General → Build & Development Settings** :

- **Root Directory** : Laissez vide (racine du projet)
- **Build Command** : `cd backend && npm install && npm run vercel-build`
- **Output Directory** : ⚠️ **LAISSEZ VIDE** (pas de dossier public pour un backend)
- **Install Command** : `cd backend && npm install`
- **Framework Preset** : "Other" (pas Next.js, pas React, etc.)

### 3. Configuration automatique

Le fichier `vercel.json` à la racine configure automatiquement :
- Le build avec `@vercel/node` pour les serverless functions
- Les routes pour rediriger toutes les requêtes vers `backend/index.js`
- Pas besoin de dossier `public` ou `outputDirectory` (c'est un backend, pas un frontend)

**Important** : Si Vercel vous demande un "Output Directory", ignorez-le ou laissez-le vide. Le fichier `vercel.json` gère tout.

## 🔧 Structure du projet

Vercel va :
1. Cloner le repo
2. Exécuter `cd backend && npm install` (Install Command)
3. Exécuter `cd backend && npm run vercel-build` (Build Command)
   - Qui fait : `prisma generate && prisma db push --skip-generate`
4. Utiliser `backend/index.js` comme serverless function (exporté automatiquement)

**Note** : Le fichier `backend/index.js` exporte maintenant l'app Express pour Vercel, et ne démarre le serveur que si ce n'est pas sur Vercel (variable `VERCEL`).

## ⚠️ Important

### Problème résolu : "No Output Directory named 'public' found"

Cette erreur survient quand Vercel cherche un dossier de sortie frontend. Solution appliquée :
- **Dossier `public/` créé** : Un dossier `public` vide a été créé à la racine pour satisfaire Vercel
- Le fichier `vercel.json` utilise `builds` et `routes` pour les serverless functions
- Vercel utilise les serverless functions avec `@vercel/node` pour le backend Express
- Le dossier `public` reste vide (pas de fichiers statiques nécessaires pour un backend)

### Problème résolu : Migration SQLite → PostgreSQL

Le fichier `migration_lock.toml` indiquait SQLite alors que vous utilisez PostgreSQL. Il a été supprimé. Prisma va maintenant :
- Générer le client Prisma pour PostgreSQL
- Pousser le schéma vers Neon DB avec `prisma db push`

### Si vous avez encore des erreurs

1. **Erreur "Cannot find module '@prisma/client'"** :
   - Vérifiez que `npm run db:generate` est dans le Build Command
   - Ou que `prisma generate` est dans `vercel-build`

2. **Erreur de connexion à la base de données** :
   - Vérifiez que `DATABASE_URL` est correcte dans Vercel
   - Vérifiez que Neon DB autorise les connexions depuis Vercel

3. **Erreur "migration_lock.toml"** :
   - Le fichier a été supprimé, mais si l'erreur persiste, supprimez aussi le dossier `backend/prisma/migrations` (les migrations SQLite ne sont plus nécessaires)

## 🧪 Test après déploiement

Une fois déployé, testez :

1. **Route de base** :
   ```
   https://votre-projet.vercel.app/
   ```
   Doit retourner : `{"message":"Backend BAI Consulting is running",...}`

2. **Health check** :
   ```
   https://votre-projet.vercel.app/api/health
   ```
   Doit retourner le statut de la base de données

3. **Test de login** :
   ```
   POST https://votre-projet.vercel.app/api/admin/auth/login
   ```

## 📝 Mise à jour du frontend

Une fois que le backend fonctionne sur Vercel, mettez à jour `frontend/.env.production` :

```env
VITE_API_URL=https://votre-projet.vercel.app
```

Puis reconstruisez et redéployez le frontend sur Hostinger.

