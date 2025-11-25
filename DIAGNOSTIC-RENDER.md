# 🔍 Diagnostic et Solution pour Render

## Problème identifié

Le message "Cannot GET /api/health" indique que Render ne trouve pas la route. Cela peut venir de plusieurs causes.

## ✅ Solutions à appliquer

### 1. Vérifier la configuration Render

Dans votre dashboard Render, pour le service `bai-consulting-et-formation-1`, vérifiez :

**Settings → Build & Deploy :**
- **Root Directory** : Doit être `backend` (pas vide, pas `/`)
- **Build Command** : `npm install && npm run db:generate`
- **Start Command** : `node index.js`

### 2. Variables d'environnement requises

Dans **Settings → Environment**, assurez-vous d'avoir :

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=votre-url-neon-db
JWT_SECRET=votre-jwt-secret
JWT_REFRESH_SECRET=votre-jwt-refresh-secret
CORS_ALLOWED_ORIGINS=https://olivedrab-hornet-656554.hostingersite.com
```

### 3. Vérifier le Root Directory

**IMPORTANT** : Si Render déploie depuis la racine du repo au lieu du dossier `backend/`, il faut configurer :

1. Allez dans **Settings** de votre service
2. Trouvez **Root Directory**
3. Mettez : `backend`
4. Sauvegardez et redéployez

### 4. Alternative : Utiliser render.yaml

J'ai créé un fichier `render.yaml` à la racine. Pour l'utiliser :

1. Dans Render, créez un nouveau service
2. Sélectionnez "Apply render.yaml"
3. Ou modifiez votre service existant pour utiliser ce fichier

### 5. Test de diagnostic

Après redéploiement, testez dans l'ordre :

1. **Health check simple** :
   ```
   https://bai-consulting-et-formation-1.onrender.com/api/health
   ```

2. **Test de connexion** :
   ```bash
   curl https://bai-consulting-et-formation-1.onrender.com/api/health
   ```

3. **Vérifier les logs** :
   - Dans Render → Logs
   - Cherchez les erreurs de connexion à la base de données
   - Vérifiez que le serveur démarre bien

### 6. Si le problème persiste

**Option A : Vérifier que Prisma est généré**

Dans les logs Render, cherchez des erreurs liées à Prisma. Si vous voyez :
```
Error: Cannot find module '@prisma/client'
```

Alors le build command doit inclure `npm run db:generate` :
```
npm install && npm run db:generate
```

**Option B : Vérifier la connexion à Neon DB**

Si vous voyez des erreurs de connexion à la base de données :
- Vérifiez que `DATABASE_URL` est correcte
- Vérifiez que Neon DB autorise les connexions depuis Render
- Testez la connexion depuis un client PostgreSQL

**Option C : Route de base**

Ajoutez une route de test simple dans `backend/index.js` (avant les autres routes) :

```javascript
app.get("/", (req, res) => {
  res.json({ message: "Backend BAI Consulting is running", status: "ok" });
});
```

Puis testez : `https://bai-consulting-et-formation-1.onrender.com/`

## 📋 Checklist de vérification

- [ ] Root Directory = `backend` dans Render
- [ ] Build Command = `npm install && npm run db:generate`
- [ ] Start Command = `node index.js`
- [ ] Toutes les variables d'environnement sont configurées
- [ ] DATABASE_URL pointe vers Neon DB
- [ ] JWT_SECRET et JWT_REFRESH_SECRET sont définis
- [ ] Le service a été redéployé après les modifications
- [ ] Les logs ne montrent pas d'erreurs critiques

## 🚀 Prochaines étapes

1. Vérifiez la configuration Render selon ce guide
2. Redéployez le service
3. Testez `/api/health`
4. Si ça fonctionne, testez la connexion depuis le frontend Hostinger

