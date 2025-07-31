# Backend BAI Consulting – Organisation et utilisation

## Structure

- Toute la logique backend est centralisée dans le dossier `backend/`.
- Les services réutilisables (ex : envoi d'email) sont dans `backend/src/services/`.
- Les routes Express (local) et les API routes Vercel (prod) utilisent la même logique métier.

## Lancer le backend en local (Express)

1. Placez vos variables d'environnement dans un fichier `.env` à la racine de `backend/` :
   ```env
   SMTP_USER=... (obligatoire)
   SMTP_PASS=... (obligatoire)
   CONTACT_RECEIVER=djibrilntamack@yahoo.fr
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   OPENAI_API_KEY=... (si besoin)
   ```
2. Installez les dépendances :
   ```bash
   cd backend
   npm install
   ```
3. Lancez le serveur Express :
   ```bash
   node index.js
   ```
4. L'API `/api/contact` est accessible sur `http://localhost:3001/api/contact`.

## Déploiement production (Vercel)

- Les API routes sont dans `backend/api/`.
- Les variables d'environnement sont à configurer dans le dashboard Vercel (mêmes noms que ci-dessus).
- L'URL d'API à utiliser côté frontend est : `https://backend-rczbsah5t-adams-projects-b35f6371.vercel.app`.

## Points importants

- **Une seule source de vérité** pour la logique métier (envoi d'email, etc.).
- **Plus de confusion** entre plusieurs serveurs : tout est dans `backend/`.
- **CORS** et parsing du body sont harmonisés.

---

Pour toute question, consultez ce README ou demandez de l'aide à l'équipe technique. 