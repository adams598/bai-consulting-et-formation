# Guide de déploiement du Backend

## Option 1: Vercel (Recommandé - Gratuit)

### Étapes:
1. **Créez un compte sur [Vercel](https://vercel.com)**
2. **Installez Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

3. **Créez un fichier `vercel.json` dans le dossier `backend/`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.js"
       }
     ]
   }
   ```

4. **Déployez:**
   ```bash
   cd backend
   vercel
   ```

5. **Configurez les variables d'environnement dans Vercel:**
   - `OPENAI_API_KEY`: Votre clé API OpenAI

## Option 2: Railway

### Étapes:
1. **Créez un compte sur [Railway](https://railway.app)**
2. **Connectez votre repository GitHub**
3. **Sélectionnez le dossier `backend/`**
4. **Configurez les variables d'environnement:**
   - `OPENAI_API_KEY`: Votre clé API OpenAI

## Option 3: Render

### Étapes:
1. **Créez un compte sur [Render](https://render.com)**
2. **Créez un nouveau Web Service**
3. **Connectez votre repository GitHub**
4. **Configurez:**
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Environment Variables:** `OPENAI_API_KEY`

## Option 4: VPS Hostinger

### Étapes:
1. **Connectez-vous à votre VPS via SSH**
2. **Installez Node.js et npm:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clonez votre repository:**
   ```bash
   git clone votre-repo-url
   cd votre-projet/backend
   ```

4. **Installez les dépendances:**
   ```bash
   npm install
   ```

5. **Configurez les variables d'environnement:**
   ```bash
   export OPENAI_API_KEY="votre-clé-api"
   ```

6. **Démarrez l'application:**
   ```bash
   node index.js
   ```

7. **Pour un déploiement permanent, utilisez PM2:**
   ```bash
   npm install -g pm2
   pm2 start index.js --name "bai-backend"
   pm2 startup
   pm2 save
   ```

## Configuration CORS

Assurez-vous que votre backend autorise les requêtes depuis votre domaine Hostinger. Dans `backend/index.js`, vérifiez que CORS est configuré:

```javascript
app.use(cors({
  origin: ['https://votre-domaine.com', 'http://localhost:5173'],
  credentials: true
}));
```

## Test du déploiement

Après le déploiement, testez votre API:
```bash
curl -X POST https://votre-backend-url.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"Test"}'
```

## Mise à jour du frontend

Une fois le backend déployé, mettez à jour `frontend/.env.production`:
```
VITE_API_URL=https://votre-backend-url.com
```

Puis reconstruisez le frontend:
```bash
cd frontend
npm run build
``` 