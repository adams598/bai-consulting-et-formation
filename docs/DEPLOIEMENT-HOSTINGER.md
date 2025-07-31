# 🚀 Guide de déploiement BAI Consulting sur Hostinger

## 📋 Résumé rapide

Votre site BAI Consulting est prêt pour le déploiement ! Voici les étapes principales :

### 🎯 Option recommandée : Frontend sur Hostinger + Backend sur Vercel

## 📁 Fichiers prêts pour le déploiement

✅ **Frontend construit** : `frontend/dist/`  
✅ **Script de déploiement** : `deploy-hostinger.bat`  
✅ **Configuration backend** : `backend/vercel.json`  
✅ **Guides détaillés** : Voir les fichiers `.md`

## 🚀 Étapes de déploiement

### 1. Déployer le Backend (Vercel - Gratuit)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer le backend
cd backend
vercel

# Configurer les variables d'environnement dans Vercel :
# OPENAI_API_KEY = votre-clé-api-openai
```

### 2. Déployer le Frontend (Hostinger)

#### Méthode automatique :
```bash
# Exécuter le script de déploiement
deploy-hostinger.bat
```

#### Méthode manuelle :
1. **Construire le projet :**
   ```bash
   cd frontend
   npm run build
   ```

2. **Uploadez les fichiers :**
   - Connectez-vous à votre panneau Hostinger
   - Accédez au gestionnaire de fichiers
   - Naviguez vers `public_html`
   - Uploadez TOUS les fichiers du dossier `frontend/dist/`

### 3. Configuration finale

1. **Notez l'URL de votre backend Vercel** (ex: `https://bai-backend.vercel.app`)

2. **Créez le fichier `frontend/.env.production` :**
   ```
   VITE_API_URL=https://votre-backend-url.vercel.app
   ```

3. **Reconstruisez le frontend :**
   ```bash
   cd frontend
   npm run build
   ```

4. **Uploadez les nouveaux fichiers sur Hostinger**

## 🔧 Configuration Hostinger

### Hébergement Web (Recommandé pour le frontend)
- **Type** : Hébergement web standard
- **Dossier** : `public_html`
- **Fichiers** : Tout le contenu de `frontend/dist/`

### VPS Hostinger (Pour l'application complète)
- **OS** : Ubuntu 20.04+
- **Docker** : Installé automatiquement
- **Commande** : `docker-compose up -d`

## 🌐 Domaines et SSL

1. **Configurez votre domaine** dans le panneau Hostinger
2. **Activez SSL gratuit** (automatique sur Hostinger)
3. **Testez votre site** : `https://votre-domaine.com`

## 📧 Test du formulaire de contact

Après le déploiement, testez le formulaire de contact pour vérifier que :
- ✅ Le frontend s'affiche correctement
- ✅ Le formulaire envoie les données au backend
- ✅ Les emails sont reçus

## 🆘 Dépannage

### Problème : Le site ne s'affiche pas
- Vérifiez que tous les fichiers sont dans `public_html`
- Vérifiez les permissions des fichiers (644 pour les fichiers, 755 pour les dossiers)

### Problème : Le formulaire ne fonctionne pas
- Vérifiez l'URL du backend dans `.env.production`
- Vérifiez que CORS est configuré dans le backend
- Testez l'API directement : `curl -X POST https://votre-backend/api/contact`

### Problème : Erreur 404
- Vérifiez que `index.html` est à la racine
- Configurez la redirection SPA dans Hostinger si nécessaire

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans le panneau Hostinger
2. Testez localement : `npm run dev`
3. Consultez les guides détaillés dans les fichiers `.md`

---

**🎉 Votre site BAI Consulting sera bientôt en ligne !** 