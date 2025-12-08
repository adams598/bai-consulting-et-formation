# Flux de construction du `fileUrl` - De A à Z

## Vue d'ensemble
Ce document explique comment le `fileUrl` est construit, depuis l'upload du fichier dans le frontend jusqu'à sa sauvegarde en base de données.

---

## ÉTAPE 1 : Frontend - Upload du fichier

### Fichier : `frontend/src/features/admin/components/LessonModal.tsx`

**Fonction : `uploadFile`** (ligne 254)

```typescript
const fileUrl = await uploadService.uploadLessonFile(file, formationTitle, formData.title);
```

**Ce qui se passe :**
- L'utilisateur sélectionne un fichier dans le formulaire
- Le fichier est passé à `uploadService.uploadLessonFile()` avec :
  - `file` : Le fichier à uploader
  - `formationTitle` : Le titre de la formation
  - `formData.title` : Le titre de la leçon

---

## ÉTAPE 2 : Frontend - Service d'upload

### Fichier : `frontend/src/services/imageUploadService.ts`

**Fonction : `uploadLessonFile`** (ligne 202)

**Ce qui se passe :**

1. **Création du FormData** (ligne 204-205)
   ```typescript
   const formData = new FormData();
   formData.append('file', file);
   ```

2. **Envoi de la requête POST** (ligne 215)
   ```typescript
   const response = await api.post(
     `/api/admin/upload/lesson-file/${encodeURIComponent(formationTitle)}/lessons/${encodeURIComponent(lessonTitle)}`,
     formData
   );
   ```
   - L'URL contient `formationTitle` et `lessonTitle` dans le chemin
   - Le fichier est envoyé dans le body

3. **Récupération du `fileUrl`** (ligne 236)
   ```typescript
   const fileUrl = response.data.data.fileUrl;
   ```

4. **Traitement de l'URL** (ligne 246-255)
   - Si l'URL commence par `http://` ou `https://` → URL Cloudinary, utilisée directement
   - Sinon → Chemin relatif local, on ajoute l'URL du backend

5. **Retour de l'URL** (ligne 257)
   ```typescript
   return fullFileUrl; // URL Cloudinary complète ou URL locale complète
   ```

---

## ÉTAPE 3 : Backend - Réception du fichier

### Fichier : `backend/src/controllers/upload.controller.js`

**Fonction : `uploadLessonFile`** (ligne 812)

**Ce qui se passe :**

1. **Récupération des paramètres** (ligne 826)
   ```javascript
   const { formationTitle, lessonTitle } = req.params;
   const { filename, path: filePath, mimetype, size } = req.file;
   ```

2. **Sanitization des titres** (ligne 845-850)
   ```javascript
   const sanitizedFormationTitle = formationTitle
     .replace(/[^a-zA-Z0-9_-]/g, "_")
     .toLowerCase();
   const sanitizedLessonTitle = lessonTitle
     .replace(/[^a-zA-Z0-9_-]/g, "_")
     .toLowerCase();
   ```

3. **Création des dossiers locaux** (ligne 851-857)
   ```javascript
   const lessonPath = `uploads/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}`;
   if (!fs.existsSync(lessonPath)) {
     fs.mkdirSync(lessonPath, { recursive: true });
   }
   ```

4. **Renommage du fichier** (ligne 860-876)
   - Le fichier est renommé en `video.mp4`
   - Il est déplacé vers le dossier de la leçon
   - L'ancien fichier est supprimé s'il existe

5. **Détection du type de contenu** (ligne 880-883)
   ```javascript
   const detectedMimeType = getMimeType(filename);
   const contentType = getContentTypeFromMime(detectedMimeType, filename);
   const isVideo = detectedMimeType === "video" || mimetype.startsWith("video/");
   ```

6. **Initialisation du `fileUrl` par défaut** (ligne 886)
   ```javascript
   let fileUrl = `/uploads/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/video.mp4`;
   ```
   - C'est l'URL locale par défaut (si Cloudinary échoue)

---

## ÉTAPE 4 : Backend - Upload vers Cloudinary

### Fichier : `backend/src/controllers/upload.controller.js`

**Fonction : `uploadLessonFile`** (ligne 898-932)

**Ce qui se passe si c'est une vidéo ET Cloudinary est activé :**

1. **Sanitization avec Cloudinary** (ligne 901-904)
   ```javascript
   const sanitizedFormationTitle = cloudinaryService.sanitizePublicId(formationTitle);
   const sanitizedLessonTitle = cloudinaryService.sanitizePublicId(lessonTitle);
   ```
   - Utilise la fonction `sanitizePublicId` qui :
     - Normalise les caractères (NFD)
     - Retire les accents
     - Remplace les caractères spéciaux par `_`
     - Nettoie les underscores multiples

2. **Construction du Public ID** (ligne 909)
   ```javascript
   const publicId = `formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/video`;
   ```
   - Exemple : `formations/azerty/lessons/lecontest/video`

3. **Upload vers Cloudinary** (ligne 916-932)
   ```javascript
   cloudinaryResult = await cloudinaryService.uploadVideo(
     finalFilePath,  // Chemin local du fichier
     publicId,       // Public ID Cloudinary
     { tags: [...], context: {...} }
   );
   ```

---

## ÉTAPE 5 : Backend - Service Cloudinary

### Fichier : `backend/src/services/cloudinary.service.js`

**Fonction : `uploadVideo`** (ligne 55)

**Ce qui se passe :**

1. **Vérification que le service est activé** (ligne 56-61)
   - Vérifie les variables d'environnement Cloudinary

2. **Vérification que le fichier existe** (ligne 63-66)

3. **Configuration des options d'upload** (ligne 70-100)
   ```javascript
   const uploadOptions = {
     resource_type: "video",
     public_id: publicId,
     overwrite: true,
     invalidate: true,
     format: "mp4",  // Force le format MP4
     transformation: {
       fetch_format: "mp4"
     }
   };
   ```

4. **Upload vers Cloudinary** (ligne 107)
   ```javascript
   const result = await cloudinary.uploader.upload(localPath, uploadOptions);
   ```

5. **Retour du résultat** (ligne 114-123)
   ```javascript
   return {
     secure_url: result.secure_url,  // URL HTTPS de Cloudinary
     public_id: result.public_id,    // Public ID
     width: result.width,
     height: result.height,
     duration: result.duration,
     bytes: result.bytes,
     format: result.format,
     resource_type: result.resource_type,
   };
   ```

---

## ÉTAPE 6 : Backend - Construction de l'URL Cloudinary

### Fichier : `backend/src/controllers/upload.controller.js`

**Fonction : `uploadLessonFile`** (ligne 934-939)

**Ce qui se passe si l'upload Cloudinary réussit :**

1. **Récupération du nom du cloud** (ligne 938)
   ```javascript
   const cloudName = cloudinaryService.getCloudName();
   ```

2. **Construction de l'URL Cloudinary** (ligne 939)
   ```javascript
   fileUrl = `https://res.cloudinary.com/${cloudName}/video/upload/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/video.mp4`;
   ```
   - Exemple : `https://res.cloudinary.com/dquu0nxcr/video/upload/formations/azerty/lessons/lecontest/video.mp4`

3. **Logs de confirmation** (ligne 940-974)
   - Affiche l'URL construite
   - Affiche les métadonnées (durée, résolution, taille)

4. **Suppression du fichier local** (ligne 977-984)
   - Le fichier local est supprimé après l'upload réussi sur Cloudinary

---

## ÉTAPE 7 : Backend - Sauvegarde en base de données

### Fichier : `backend/src/controllers/upload.controller.js`

**Fonction : `uploadLessonFile`** (ligne 1007-1118)

**Ce qui se passe :**

1. **Recherche de la leçon** (ligne 1016-1054)
   - Recherche par titre exact
   - Si pas trouvée, recherche avec titre sanitizé (insensible à la casse)

2. **Mise à jour de la leçon** (ligne 1065-1071)
   ```javascript
   await prisma.formationContent.update({
     where: { id: lesson.id },
     data: {
       type: contentType,
       fileUrl: fileUrl,  // URL Cloudinary ou URL locale
     },
   });
   ```

3. **Vérification** (ligne 1078-1080)
   - Vérifie que l'URL Cloudinary a bien été sauvegardée

---

## ÉTAPE 8 : Backend - Réponse au frontend

### Fichier : `backend/src/controllers/upload.controller.js`

**Fonction : `uploadLessonFile`** (ligne 1127-1150)

**Ce qui se passe :**

1. **Préparation de la réponse** (ligne 1127-1143)
   ```javascript
   const responseData = {
     success: true,
     data: {
       fileUrl: fileUrl,  // URL Cloudinary ou URL locale
       fileId: cloudinaryResult?.public_id || finalFilename,
       filename: finalFilename,
       size: size || 0,
       mimetype: detectedMimeType || mimetype,
       contentType: contentType || detectedMimeType || "video",
       cloudinary: cloudinaryResult ? { ... } : null,
     },
     message: cloudinaryResult
       ? "Fichier joint uploadé avec succès sur Cloudinary"
       : "Fichier joint uploadé avec succès",
   };
   ```

2. **Envoi de la réponse** (ligne 1145)
   ```javascript
   res.json(responseData);
   ```

---

## ÉTAPE 9 : Frontend - Récupération et stockage

### Fichier : `frontend/src/features/admin/components/LessonModal.tsx`

**Fonction : `uploadFile`** (ligne 254-270)

**Ce qui se passe :**

1. **Récupération de l'URL** (ligne 260)
   ```typescript
   const fileUrl = await uploadService.uploadLessonFile(...);
   ```

2. **Stockage dans le state** (ligne 266-270)
   ```typescript
   setFormData(prev => ({
     ...prev,
     contentFile: file,
     contentFileUrl: fileUrl  // URL Cloudinary sauvegardée ici
   }));
   ```

---

## ÉTAPE 10 : Frontend - Sauvegarde de la leçon

### Fichier : `frontend/src/features/admin/components/LessonModal.tsx`

**Fonction : `handleSubmit`** (ligne 125-151)

**Ce qui se passe :**

1. **Préparation des données** (ligne 136-148)
   ```typescript
   const lessonData = {
     ...formData,
     fileUrl: formData.contentFileUrl || formData.contentUrl || undefined,
     // ...
   };
   ```

2. **Envoi au parent** (ligne 150)
   ```typescript
   onSave(lessonData);
   ```

---

## ÉTAPE 11 : Frontend - Création de la leçon

### Fichier : `frontend/src/features/admin/components/FormationDetailView.tsx`

**Fonction : `handleSaveLesson`** (ligne 342-422)

**Ce qui se passe :**

1. **Appel de l'API** (ligne 387-395)
   ```typescript
   const response = await formationContentApi.addLesson(localFormation.id, {
     title: lessonData.title,
     description: lessonData.description,
     type: lessonData.type,
     duration: lessonData.duration || 30,
     order: lessons.length + 1,
     coverImage: lessonData.coverImage,
     fileUrl: lessonData.fileUrl || undefined  // URL Cloudinary passée ici
   });
   ```

---

## ÉTAPE 12 : Backend - Création de la leçon

### Fichier : `backend/src/controllers/admin.controllers.js`

**Fonction : `addLesson`** (ligne 2592-2672)

**Ce qui se passe :**

1. **Création de la leçon** (ligne 2645-2659)
   ```javascript
   const lesson = await prisma.formationContent.create({
     data: {
       formationId,
       title,
       description: description || "",
       type,
       contentType: "LESSON",
       sectionId: sectionId || null,
       order: order || 0,
       duration: duration ? parseInt(duration) : null,
       coverImage: coverImage || null,
       fileUrl: fileUrl || null,  // URL Cloudinary sauvegardée ici
       metadata: metadata || null,
     },
   });
   ```

2. **Retour de la leçon créée** (ligne 2664)
   ```javascript
   res.status(201).json({ success: true, data: lesson });
   ```

---

## RÉSUMÉ DU FLUX

```
1. Frontend (LessonModal) 
   → uploadFile() 
   → uploadService.uploadLessonFile()

2. Frontend (imageUploadService)
   → POST /api/admin/upload/lesson-file/{formation}/{lesson}
   → Retourne fileUrl (URL Cloudinary)

3. Backend (upload.controller)
   → Réception du fichier
   → Sanitization des titres
   → Création des dossiers locaux
   → Renommage en video.mp4

4. Backend (upload.controller)
   → Vérification si vidéo + Cloudinary activé
   → cloudinaryService.uploadVideo()

5. Backend (cloudinary.service)
   → Upload vers Cloudinary
   → Retourne cloudinaryResult avec secure_url

6. Backend (upload.controller)
   → Construction de l'URL Cloudinary :
     https://res.cloudinary.com/{cloud_name}/video/upload/formations/{formation}/lessons/{lesson}/video.mp4
   → fileUrl = URL Cloudinary

7. Backend (upload.controller)
   → Recherche de la leçon en base
   → Mise à jour : fileUrl = URL Cloudinary

8. Backend (upload.controller)
   → Réponse JSON avec fileUrl

9. Frontend (LessonModal)
   → Stockage dans formData.contentFileUrl

10. Frontend (LessonModal)
    → handleSubmit() passe fileUrl dans lessonData

11. Frontend (FormationDetailView)
    → addLesson() avec fileUrl

12. Backend (admin.controllers)
    → Création de la leçon avec fileUrl en base de données
```

---

## FORMAT FINAL DE L'URL CLOUDINARY

```
https://res.cloudinary.com/{CLOUD_NAME}/video/upload/formations/{FORMATION_TITLE}/lessons/{LESSON_TITLE}/video.mp4
```

**Exemple :**
```
https://res.cloudinary.com/dquu0nxcr/video/upload/formations/azerty/lessons/lecontest/video.mp4
```

---

## POINTS IMPORTANTS

1. **Sanitization** : Les titres sont sanitizés deux fois :
   - Une fois pour les dossiers locaux (remplacement simple)
   - Une fois pour Cloudinary (normalisation NFD + nettoyage)

2. **Renommage** : Tous les fichiers sont renommés en `video.mp4`

3. **Structure Cloudinary** : La structure de dossiers est créée automatiquement par Cloudinary basée sur le `public_id`

4. **Fallback** : Si Cloudinary échoue, l'URL locale est utilisée

5. **Double sauvegarde** :
   - Lors de l'upload (si la leçon existe déjà)
   - Lors de la création de la leçon (si elle n'existe pas encore)


