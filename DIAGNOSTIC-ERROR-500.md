# 🔍 Diagnostic Erreur 500 Vercel

## Problème

La fonction serverless plante avec `FUNCTION_INVOCATION_FAILED`. Cela peut venir de plusieurs causes.

## Causes possibles

### 1. Prisma non généré
- Vérifiez que `prisma generate` est exécuté dans le Build Command
- Vérifiez les logs Vercel pour voir si Prisma génère correctement

### 2. Variables d'environnement manquantes
- `DATABASE_URL` doit être configurée dans Vercel
- `JWT_SECRET` et `JWT_REFRESH_SECRET` doivent être définis
- Vérifiez dans Vercel → Settings → Environment Variables

### 3. Import qui échoue
- Un middleware ou service qui plante au chargement
- Vérifiez les logs Vercel pour voir l'erreur exacte

### 4. Connexion à la base de données
- Neon DB doit autoriser les connexions depuis Vercel
- Vérifiez que `DATABASE_URL` est correcte

## Solution appliquée

J'ai créé un handler avec gestion d'erreurs dans `api/index.js` qui :
- Capture les erreurs au chargement
- Affiche des messages d'erreur détaillés
- Crée une app de secours si le chargement échoue

## Vérifications à faire

1. **Dans Vercel Dashboard** :
   - Allez dans votre projet → "Logs"
   - Cherchez l'erreur exacte dans les logs d'exécution
   - Copiez l'erreur complète

2. **Variables d'environnement** :
   - Vérifiez que toutes les variables sont définies
   - Vérifiez qu'elles sont pour "Production" et "Preview"

3. **Build Command** :
   - Doit inclure : `cd backend && npm install && npm run vercel-build`
   - Qui exécute : `prisma generate && prisma db push --skip-generate`

## Prochaines étapes

1. Commitez et poussez le nouveau handler
2. Vérifiez les logs Vercel après le déploiement
3. Partagez l'erreur exacte des logs pour diagnostic précis

