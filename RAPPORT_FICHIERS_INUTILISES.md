# 📋 Rapport des Fichiers et Fonctions Inutilisés

## 🔴 FICHIERS À SUPPRIMER (Critiques)

### Frontend

#### 1. **Fichiers d'entrée dupliqués**
- ❌ `frontend/src/index.tsx` - **INUTILISÉ** (le projet utilise `main.tsx`)
  - Le fichier `index.html` référence `/src/main.tsx` (ligne 33)
  - `index.tsx` n'est jamais chargé
  - **Action**: Supprimer ce fichier

#### 2. **Composants commentés/inutilisés**
- ❌ `frontend/src/features/admin/components/AdminOpportunitiesPage.tsx`
  - **FICHIER VIDE** (0 lignes de code)
  - Import commenté dans `App.tsx` (ligne 19)
  - Import commenté dans `AdminLayout.tsx` (ligne 30)
  - Jamais utilisé dans les routes
  - **Action**: Supprimer immédiatement

#### 3. **Fichiers de test**
- ❌ `frontend/src/components/__tests__/SearchSuggestions.test.tsx`
  - Fichier de test isolé, pas de suite de tests configurée
  - **Action**: Supprimer ou déplacer dans un dossier de tests approprié

#### 4. **Fichiers de documentation/example**
- ❌ `frontend/src/components/SearchSuggestions.example.md`
- ❌ `frontend/src/components/SearchSuggestions.md`
  - Fichiers de documentation non utilisés dans le build
  - **Action**: Supprimer ou déplacer dans `/docs`

### Backend

#### 5. **Fichiers de test en racine backend** (71 fichiers de test)
Tous ces fichiers dans `backend/` sont des scripts de test/debug non utilisés en production :

**Scripts de test/débogage:**
- `test-all-apis.js`
- `test-api.mjs`
- `test-assign-formation.mjs`
- `test-auth-api.mjs`
- `test-auth.mjs`
- `test-bank-formations.mjs`
- `test-calendar-integration.mjs`
- `test-content-visits-api.mjs`
- `test-controller.mjs`
- `test-dashboard-apis.js`
- `test-db-connection-fixed.js`
- `test-db-connection.js`
- `test-db-direct.js`
- `test-debug.js`
- `test-dynamic-formation-data.mjs`
- `test-filename-format.js`
- `test-formation-debug.js`
- `test-formation-performance.js`
- `test-formation-simple.js`
- `test-formations.mjs`
- `test-interface.mjs`
- `test-learner-api.js`
- `test-learner-simple.js`
- `test-libreoffice.js`
- `test-login.js`
- `test-minimal-prisma.mjs`
- `test-neon-pooler.js`
- `test-opportunities-api.js`
- `test-prisma-simple.mjs`
- `test-prisma.mjs`
- `test-quick.mjs`
- `test-routes.js`
- `test-server.mjs`
- `test-simple-debug.js`
- `test-user-progress-api.mjs`
- `test-web-apis.mjs`

**Scripts utilitaires non utilisés:**
- `create-admin-user.mjs`
- `create-formations-per-universe.mjs`
- `create-new-token.mjs`
- `create-test-session.mjs`
- `create-test-user.mjs`
- `create-test-users.mjs`
- `create-valid-session.mjs`
- `list-users.mjs`
- `quick-test.mjs`
- `simple-test.js`

**Fichiers de données de test:**
- `test-avatar.jpg`
- `test-avatar.png`
- `test-callback.json`
- `test-user.json`
- `login.json`

**Action**: Déplacer tous ces fichiers dans un dossier `backend/tests/` ou `backend/scripts/test/` pour les garder pour le développement mais les exclure du build de production.

#### 6. **Scripts backend dans `/scripts`** (50+ fichiers)
Beaucoup de scripts dans `backend/scripts/` sont des scripts de migration/seed ponctuels qui ne sont plus utilisés :

**Scripts de migration/seed ponctuels (probablement inutilisés):**
- `add-cover-image-migration.js`
- `add-formation-fields.mjs`
- `add-questions-to-existing-quiz.mjs`
- `add-simple-formation.mjs`
- `add-test-formations.mjs`
- `adjust-formation-data.mjs`
- `assign-formations-simple.mjs`
- `assign-formations-to-banks.mjs`
- `assign-formations-to-learners.mjs`
- `assign-formations-to-mariline.mjs`
- `check-activities-data.mjs`
- `check-and-restore-universes.mjs`
- `check-formations.mjs`
- `check-mariline-assignments.mjs`
- `check-sessions.js`
- `check-specific-lesson.mjs`
- `check-user-sessions.mjs`
- `clean-universes.mjs`
- `clear-cache.mjs`
- `create-2024-activities.mjs`
- `create-admin-sessions.mjs`
- `create-bank-formations-and-assignments.mjs`
- `create-beautiful-universes.mjs`
- `create-complete-test-data.mjs`
- `create-formations-for-universes.mjs`
- `create-learner-users.mjs`
- `create-mes-formations-universe.mjs`
- `create-quiz-for-test-formation.mjs`
- `create-recent-activities.mjs`
- `create-recent-test-activities.mjs`
- `create-test-activities.mjs`
- `create-test-data.mjs`
- `create-test-formation.mjs`
- `create-test-formations.mjs`
- `create-test-universes.mjs`
- `createFormationFolders.js`
- `createSimpleFormationFolders.js`
- `debug-activities.mjs`
- `delete-all-universes.mjs`
- `fix-formation-assignment.mjs`
- `fix-lesson-durations.mjs`
- `fixSnakeCaseFolders.js`
- `list-all-formations.mjs`
- `migrate-to-postgres.js`
- `migrate-uploads-to-cloudinary.js`
- `recreateFormationFolders.js`
- `renameFoldersToSnakeCase.js`
- `renameFormationFolders.js`
- `restore-universes.mjs`
- `seedFormations.js`
- `seedUniverses.js`
- `test-activities-api.mjs`
- `test-api-mariline.mjs`
- `test-db-connection.js`
- `test-frontend-data.mjs`
- `test-function-directly.mjs`
- `test-insert.js`
- `test-raw-connection.js`
- `test-session-insert.js`
- `test-ssl-connection.js`
- `test-url-format.js`
- `update-formation-hasquiz.mjs`
- `update-formations-modality.mjs`
- `update-formations-with-default-data.mjs`
- `update-lessons-cloudinary-urls.js`
- `verify-formation-data.mjs`
- `verify-quiz-formation.mjs`
- `verify-universes.mjs`

**Action**: Archiver ces scripts dans un dossier `backend/scripts/archive/` ou les supprimer s'ils ne sont plus nécessaires.

## ⚠️ FONCTIONS/IMPORTS INUTILISÉS (À Vérifier)

### Frontend

#### 1. **Imports commentés/inutilisés**
- `frontend/src/index.tsx` ligne 5: `// import reportWebVitals from './reportWebVitals';`
  - Le fichier `reportWebVitals` n'existe pas
  - **Action**: Supprimer la ligne commentée
- `frontend/src/index.tsx` ligne 6: `import "@fontsource/lato";`
  - Police importée dans un fichier qui n'est jamais chargé
  - **Action**: Déplacer cet import dans `main.tsx` si nécessaire, sinon supprimer

#### 2. **Routes dupliquées dans App.tsx**
- Ligne 228: `<Route path="/admin/login" element={<AdminLoginPage />} />`
- Ligne 236: `<Route path="/login" element={<AdminLoginPage />} />`
- Ligne 239: `<Route path="/admin/login" element={<AdminLoginPage />} />` (dupliqué)
- Ligne 240-244: Route `/admin/login` avec guard (dupliqué)
  - **Action**: Nettoyer les routes dupliquées

#### 3. **Fichiers potentiellement inutilisés**
- ❌ `frontend/src/pages/Login.tsx` - **INUTILISÉ** (App.tsx utilise `app/admin/login/page.tsx`)
- ❌ `frontend/src/pages/Dashboard.tsx` - **INUTILISÉ** (App.tsx utilise lazy import de `pages/Dashboard` mais référence `app/admin/dashboard/page.tsx`)
- ✅ `frontend/src/pages/CalendarSettingsPage.tsx` - **UTILISÉ** (importé dans UnifiedLayout.tsx ligne 53)
- ❌ `frontend/src/pages/CalendarCallbackPage.tsx` - À vérifier (existe aussi dans `features/learner/pages/`)

#### 4. **Dossiers vides ou non utilisés**
- ❌ `frontend/src/app/bai/` - **DOSSIER VIDE** - Supprimer
- ❌ `frontend/src/types/` - **DOSSIER VIDE** - Supprimer
- `frontend/src/assets/fonts/` - Vérifier si contient des fichiers utilisés

### Backend

#### 5. **Fichiers de configuration de test**
- `backend/env.test` - Fichier de test, ne pas déployer en production
- `backend/nginx.test.conf` (si existe) - Configuration de test

#### 6. **Fichiers de logs**
- `backend/logs/monitoring.log` - Ne pas déployer les logs en production

## 📊 RÉSUMÉ

### Fichiers à supprimer immédiatement:
- ✅ `frontend/src/index.tsx` (dupliqué avec main.tsx, jamais chargé)
- ✅ `frontend/src/features/admin/components/AdminOpportunitiesPage.tsx` (fichier vide, commenté, jamais utilisé)
- ✅ `frontend/src/pages/Login.tsx` (non utilisé, remplacé par app/admin/login/page.tsx)
- ✅ `frontend/src/pages/Dashboard.tsx` (non utilisé, remplacé par app/admin/dashboard/page.tsx)
- ✅ `frontend/src/app/bai/` (dossier vide)
- ✅ `frontend/src/types/` (dossier vide)
- ✅ Tous les fichiers `test-*.js`, `test-*.mjs` dans `backend/` (71 fichiers)
- ✅ Fichiers de données de test: `test-avatar.jpg`, `test-avatar.png`, `test-callback.json`, `test-user.json`, `login.json`

### Fichiers à archiver/déplacer:
- 📦 Scripts de test dans `backend/scripts/` → `backend/scripts/archive/`
- 📦 Fichiers de documentation → `/docs`

### À vérifier manuellement:
- 🔍 Routes dupliquées dans `App.tsx`
- 🔍 Utilisation de `pages/Login.tsx` vs `app/admin/login/page.tsx`
- 🔍 Dossiers vides: `app/bai/`, `types/`, `assets/fonts/`

## 🎯 Impact sur la taille du bundle

**Estimation de réduction:**
- Fichiers de test backend: ~2-5 MB
- Fichiers dupliqués frontend: ~50-100 KB
- Scripts inutilisés: ~1-2 MB

**Total estimé: ~3-7 MB de fichiers inutiles**

## ✅ Actions recommandées

### Priorité CRITIQUE (Impact immédiat sur le bundle)
1. **Immédiat**: Supprimer `frontend/src/index.tsx` (fichier dupliqué, jamais chargé)
2. **Immédiat**: Supprimer `AdminOpportunitiesPage.tsx` (fichier vide)
3. **Immédiat**: Supprimer `frontend/src/pages/Login.tsx` et `pages/Dashboard.tsx` (non utilisés)
4. **Immédiat**: Supprimer les dossiers vides: `app/bai/`, `types/`
5. **Immédiat**: Déplacer tous les fichiers `test-*` dans un dossier `backend/tests/`

### Priorité HAUTE (Nettoyage du code)
6. **Court terme**: Nettoyer les routes dupliquées dans `App.tsx` (3 routes `/admin/login`)
7. **Court terme**: Supprimer l'import `@fontsource/lato` de `index.tsx` (déplacer dans `main.tsx` si nécessaire)
8. **Court terme**: Archiver les scripts de migration ponctuels dans `backend/scripts/archive/`

### Priorité MOYENNE (Optimisation)
9. **Moyen terme**: Configurer `.gitignore` pour exclure les fichiers de test du déploiement
10. **Moyen terme**: Vérifier et nettoyer les imports inutilisés avec un linter
