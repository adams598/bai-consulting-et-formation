import multer from "multer";
import path from "path";
import fs from "fs";

// Fonction utilitaire pour sanitizer les titres
// Version améliorée qui préserve mieux la lisibilité en utilisant des tirets
function sanitizeTitle(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Retirer les accents
    .replace(/[^a-zA-Z0-9\s\-]/g, "") // Supprimer seulement les caractères vraiment problématiques
    .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
    .replace(/-+/g, "-") // Remplacer les tirets multiples par un seul
    .replace(/^-|-$/g, ""); // Retirer les tirets en début/fin
}

// Fonction pour déterminer le type de fichier
const getFileType = (filename) => {
  const extension = path.extname(filename).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(extension)) {
    return "image";
  }

  if ([".mp4", ".avi", ".mov", ".wmv", ".webm"].includes(extension)) {
    return "video";
  }

  if (
    [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"].includes(
      extension,
    )
  ) {
    return "document";
  }

  if ([".mp3", ".wav", ".ogg", ".aac"].includes(extension)) {
    return "audio";
  }

  return "other";
};

// Configuration du stockage avec dossiers dynamiques
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("🔍 Multer destination - DEBUT");
    console.log("🔍 Multer destination - req.uploadType:", req.uploadType);
    console.log("🔍 Multer destination - req.params:", req.params);
    console.log("🔍 Multer destination - req.body:", req.body);
    console.log("🔍 Multer destination - file:", file.originalname);

    // Récupérer l'utilisateur depuis le token JWT
    const user = req.user;
    console.log("🔍 Multer destination - user:", user);

    if (!user) {
      return cb(new Error("Utilisateur non authentifié"), null);
    }

    console.log("🔍 Multer destination - APRÈS VÉRIFICATION USER");
    console.log("🔍 Multer destination - req.uploadType:", req.uploadType);
    console.log(
      "🔍 Multer destination - req.uploadType === 'lesson-file':",
      req.uploadType === "lesson-file",
    );
    console.log(
      "🔍 Multer destination - req.uploadType === 'lesson-cover':",
      req.uploadType === "lesson-cover",
    );
    console.log(
      "🔍 Multer destination - req.body keys:",
      Object.keys(req.body),
    );
    console.log(
      "🔍 Multer destination - req.body.formationTitle:",
      req.body.formationTitle,
    );
    console.log(
      "🔍 Multer destination - req.body.lessonTitle:",
      req.body.lessonTitle,
    );
    console.log(
      "🔍 Multer destination - Type de req.uploadType:",
      typeof req.uploadType,
    );
    console.log(
      "🔍 Multer destination - Longueur de req.uploadType:",
      req.uploadType ? req.uploadType.length : "undefined",
    );
    console.log(
      "🔍 Multer destination - req.uploadType === 'lesson-file' (string):",
      req.uploadType === "lesson-file",
    );
    console.log(
      "🔍 Multer destination - req.uploadType === 'lesson-file' (charCode):",
      req.uploadType === "lesson-file",
    );
    console.log(
      "🔍 Multer destination - req.uploadType charCodeAt(0):",
      req.uploadType ? req.uploadType.charCodeAt(0) : "undefined",
    );
    console.log(
      "🔍 Multer destination - 'lesson-file' charCodeAt(0):",
      "lesson-file".charCodeAt(0),
    );
    console.log("🔍 Multer destination - AVANT LA CONDITION IF");
    console.log(
      "🔍 Multer destination - req.uploadType === 'profile':",
      req.uploadType === "profile",
    );
    console.log(
      "🔍 Multer destination - req.uploadType === 'lesson-cover' || req.uploadType === 'lesson-file':",
      req.uploadType === "lesson-cover" || req.uploadType === "lesson-file",
    );

    // Déclarer uploadPath au bon endroit
    let uploadPath;

    if (req.uploadType === "profile") {
      // Images de profil : uploads/profiles/{user}/
      uploadPath = path.join("uploads", "profiles", userFolderName);
    } else if (
      req.uploadType === "lesson-cover" ||
      req.uploadType === "lesson-file"
    ) {
      // Images de couverture ET fichiers joints des leçons : uploads/formations/{formation}/lessons/{lesson}/
      console.log("🔍 Middleware lesson - DEBUT - Type:", req.uploadType);

      if (req.uploadType === "lesson-cover") {
        // Pour lesson-cover, utiliser req.body
        console.log("🔍 Middleware lesson-cover - req.body:", req.body);
        console.log(
          "🔍 Middleware lesson-cover - formationTitle reçu:",
          req.body.formationTitle,
        );
        console.log(
          "🔍 Middleware lesson-cover - lessonTitle reçu:",
          req.body.lessonTitle,
        );

        if (!req.body.formationTitle || !req.body.lessonTitle) {
          console.error(
            "❌ ERREUR: formationTitle ou lessonTitle manquant dans req.body",
          );
          return cb(
            new Error(
              "Le titre de la formation et de la leçon sont requis pour l'upload",
            ),
            null,
          );
        }

        const formationTitle = req.body.formationTitle;
        const lessonTitle = req.body.lessonTitle;
        const sanitizedFormationTitle = sanitizeTitle(formationTitle);
        const sanitizedLessonTitle = sanitizeTitle(lessonTitle);

        console.log("🔍 Middleware lesson-cover - Titres sanitizés:");
        console.log("  - formationTitle:", sanitizedFormationTitle);
        console.log("  - lessonTitle:", sanitizedLessonTitle);

        uploadPath = path.join(
          "uploads",
          "formations",
          sanitizedFormationTitle,
          "lessons",
          sanitizedLessonTitle,
        );

        console.log(
          "🔍 Middleware lesson-cover - uploadPath final:",
          uploadPath,
        );
        console.log("🔍 Middleware lesson-cover - FIN");
      } else if (req.uploadType === "lesson-file") {
        // Pour lesson-file, utiliser req.params (car req.body n'est pas encore disponible)
        console.log("🔍 Middleware lesson-file - req.params:", req.params);
        console.log(
          "🔍 Middleware lesson-file - formationTitle reçu:",
          req.params.formationTitle,
        );
        console.log(
          "🔍 Middleware lesson-file - lessonTitle reçu:",
          req.params.lessonTitle,
        );

        if (!req.params.formationTitle || !req.params.lessonTitle) {
          console.error(
            "❌ ERREUR: formationTitle ou lessonTitle manquant dans req.params",
          );
          console.error("❌ formationTitle:", req.params.formationTitle);
          console.error("❌ lessonTitle:", req.params.lessonTitle);
          return cb(
            new Error(
              "Le titre de la formation et de la leçon sont requis pour l'upload",
            ),
            null,
          );
        }

        const formationTitle = req.params.formationTitle;
        const lessonTitle = req.params.lessonTitle;
        console.log(
          "🔍 Middleware lesson-file - formationTitle:",
          formationTitle,
        );
        console.log("🔍 Middleware lesson-file - lessonTitle:", lessonTitle);

        const sanitizedFormationTitle = sanitizeTitle(formationTitle);
        const sanitizedLessonTitle = sanitizeTitle(lessonTitle);

        console.log("🔍 Middleware lesson-file - Titres sanitizés:");
        console.log("  - formationTitle:", sanitizedFormationTitle);
        console.log("  - lessonTitle:", sanitizedLessonTitle);

        uploadPath = path.join(
          "uploads",
          "formations",
          sanitizedFormationTitle,
          "lessons",
          sanitizedLessonTitle,
        );

        console.log(
          "🔍 Middleware lesson-file - uploadPath final:",
          uploadPath,
        );
        console.log("🔍 Middleware lesson-file - FIN");
      }
    } else if (req.uploadType === "formation") {
      console.log("🔍 Middleware formation - req.params:", req.params);
      console.log(
        "🔍 Middleware formation - formationTitle reçu (from params):",
        req.params.formationTitle,
      );

      if (!req.params.formationTitle) {
        console.error("❌ ERREUR: formationTitle manquant dans req.params");
        return cb(
          new Error(
            "Le titre de la formation est requis dans l'URL pour l'upload",
          ),
          null,
        );
      }

      const formationTitle = req.params.formationTitle;
      const sanitizedFormationTitle = sanitizeTitle(formationTitle);

      console.log(
        "🔍 Middleware formation - Titre sanitizé:",
        sanitizedFormationTitle,
      );

      uploadPath = path.join("uploads", "formations", sanitizedFormationTitle);
      console.log("🔍 Middleware formation - uploadPath final:", uploadPath);
    } else if (req.uploadType === "formation-video") {
      // Vidéos de formation : uploads/formations/{formation}/
      console.log("🔍 Middleware formation-video - req.body:", req.body);
      console.log(
        "🔍 Middleware formation-video - formationTitle reçu:",
        req.body.formationTitle,
      );

      if (!req.body.formationTitle) {
        console.error("❌ ERREUR: formationTitle manquant dans req.body");
        return cb(
          new Error(
            "Le titre de la formation est requis pour l'upload de vidéo",
          ),
          null,
        );
      }

      const formationTitle = req.body.formationTitle;
      const sanitizedFormationTitle = sanitizeTitle(formationTitle);

      console.log(
        "🔍 Middleware formation-video - Titre sanitizé:",
        sanitizedFormationTitle,
      );

      uploadPath = path.join("uploads", "formations", sanitizedFormationTitle);
      console.log(
        "🔍 Middleware formation-video - uploadPath final:",
        uploadPath,
      );
    } else if (req.uploadType === "opportunities") {
      // Fichiers d'opportunités : uploads/OC/
      uploadPath = path.join("uploads", "OC");
      console.log(
        "🔍 Middleware opportunities - uploadPath final:",
        uploadPath,
      );
    } else {
      // Fichiers génériques : uploads/files/{user}/
      uploadPath = path.join("uploads", "files", userFolderName);
    }

    // Créer le dossier s'il n'existe pas (pour tous les types)
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`📁 Dossier créé: ${uploadPath}`);
    }

    console.log("🔍 Multer destination - FIN - uploadPath:", uploadPath);
    console.log("🔍 Multer destination - Appel de cb(null, uploadPath)");
    cb(null, uploadPath);
    console.log("🔍 Multer destination - Après cb()");
  },

  filename: (req, file, cb) => {
    // Récupérer l'utilisateur depuis le token JWT
    const user = req.user;

    // Déterminer le type de fichier
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    let filename;

    if (isImage) {
      // Pour les images, utiliser le format selon le type d'upload
      const userFolderName = `${user.firstName}_${user.lastName}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      );
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);

      if (req.uploadType === "profile") {
        // Images de profil : profil-{user}-{timestamp}.{ext}
        filename = `profil-${userFolderName}-${timestamp}${extension}`;
      } else if (req.uploadType === "lesson-cover") {
        // Images de couverture des leçons : couverture-{timestamp}.{ext}
        filename = `couverture-${timestamp}${extension}`;
      } else if (req.uploadType === "lesson-file") {
        // Fichiers joints des leçons : file-{type}-{titre-leçon}-{timestamp}.{ext}
        const fileType = getFileType(file.originalname);
        const lessonTitle =
          req.params.lessonTitle || req.body.lessonTitle || "unknown";
        const sanitizedLessonTitle = sanitizeTitle(lessonTitle);
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        filename = `file-${fileType}-${sanitizedLessonTitle}-${timestamp}${extension}`;
      } else if (req.uploadType === "formation") {
        // Images des formations : couverture-{timestamp}.{ext}
        filename = `couverture-${timestamp}${extension}`;
      } else {
        // Images génériques : image-{user}-{timestamp}.{ext}
        filename = `image-${userFolderName}-${timestamp}${extension}`;
      }
    } else if (isVideo) {
      // Pour les vidéos, utiliser le format selon le type d'upload
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);

      if (req.uploadType === "formation-video") {
        // Vidéos de formation : video-{titre-formation}.mp4
        const formationTitle = req.body.formationTitle || "formation";
        const sanitizedFormationTitle = sanitizeTitle(formationTitle);
        filename = `video-${sanitizedFormationTitle}.mp4`;
      } else {
        // Vidéos génériques : video-{nom de l'user}-{timestamp}.{ext}
        const userFolderName = `${user.firstName}_${user.lastName}`.replace(
          /[^a-zA-Z0-9_-]/g,
          "_",
        );
        filename = `video-${userFolderName}-${timestamp}${extension}`;
      }
    } else if (req.uploadType === "lesson-file") {
      // Fichiers joints des leçons (non-images) : file-{type}-{titre-leçon}-{timestamp}.{ext}
      const fileType = getFileType(file.originalname);
      const lessonTitle =
        req.params.lessonTitle || req.body.lessonTitle || "unknown";
      const sanitizedLessonTitle = lessonTitle
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      filename = `file-${fileType}-${sanitizedLessonTitle}-${timestamp}${extension}`;

      console.log("🔍 Naming lesson-file (non-image):");
      console.log("  - req.uploadType:", req.uploadType);
      console.log("  - req.params.lessonTitle:", req.params.lessonTitle);
      console.log("  - req.body.lessonTitle:", req.body.lessonTitle);
      console.log("  - lessonTitle final:", lessonTitle);
      console.log("  - sanitizedLessonTitle:", sanitizedLessonTitle);
      console.log("  - fileType:", fileType);
      console.log("  - filename final:", filename);
    } else if (req.uploadType === "opportunities") {
      // Fichiers d'opportunités : file-{titredufichier}-{id du fichier}.pdf
      const originalName = file.originalname;
      const baseName = path.basename(originalName, path.extname(originalName));
      const sanitizedTitle = sanitizeTitle(baseName);
      const fileId = Date.now(); // Utiliser timestamp comme ID unique
      const extension = path.extname(file.originalname);

      filename = `file-${sanitizedTitle}-${fileId}${extension}`;

      console.log("🔍 Naming opportunities file:");
      console.log("  - req.uploadType:", req.uploadType);
      console.log("  - originalName:", originalName);
      console.log("  - baseName:", baseName);
      console.log("  - sanitizedTitle:", sanitizedTitle);
      console.log("  - fileId:", fileId);
      console.log("  - filename final:", filename);
    } else {
      // Pour les autres fichiers, utiliser le format file-{nom de l'user}
      const userFolderName = `${user.firstName}_${user.lastName}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      );
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      filename = `file-${userFolderName}-${timestamp}${extension}`;
    }

    console.log(`📝 Nom de fichier généré: ${filename}`);
    cb(null, filename);
  },
});

// Filtre des types de fichiers sécurisé
const fileFilter = (req, file, cb) => {
  // Validation stricte des types MIME
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

  const allowedVideoTypes = ["video/mp4", "video/webm"];

  const allowedDocumentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  // Vérifier la taille du fichier (5MB max pour application bancaire)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size && file.size > maxSize) {
    console.warn(`🚨 FICHIER TROP VOLUMINEUX:
      IP: ${req.ip || req.connection.remoteAddress}
      Nom: ${file.originalname}
      Taille: ${file.size} bytes (max: ${maxSize} bytes)
      Timestamp: ${new Date().toISOString()}
    `);
    return cb(
      new Error(
        `Fichier trop volumineux. Taille maximale: ${maxSize / 1024 / 1024}MB`,
      ),
      false,
    );
  }

  // Vérifier le nom du fichier (éviter les caractères dangereux)
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(file.originalname)) {
    console.warn(`🚨 NOM DE FICHIER DANGEREUX:
      IP: ${req.ip || req.connection.remoteAddress}
      Nom: ${file.originalname}
      Timestamp: ${new Date().toISOString()}
    `);
    return cb(
      new Error("Nom de fichier contenant des caractères non autorisés"),
      false,
    );
  }

  // Vérifier les patterns suspects dans le nom
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.pif$/i,
    /\.com$/i,
    /\.js$/i,
    /\.vbs$/i,
    /\.jar$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i,
    /\.sh$/i,
    /\.ps1$/i,
    /\.py$/i,
    /\.rb$/i,
    /\.pl$/i,
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(file.originalname))) {
    console.warn(`🚨 FICHIER SUSPECT DÉTECTÉ:
      IP: ${req.ip || req.connection.remoteAddress}
      Nom: ${file.originalname}
      Type MIME: ${file.mimetype}
      Timestamp: ${new Date().toISOString()}
    `);
    return cb(
      new Error("Type de fichier potentiellement dangereux détecté"),
      false,
    );
  }

  // Vérifier le type MIME
  if (
    file.mimetype.startsWith("image/") &&
    allowedImageTypes.includes(file.mimetype)
  ) {
    console.log(
      `✅ Upload image autorisé: ${file.originalname} (${file.mimetype})`,
    );
    return cb(null, true);
  }

  if (
    file.mimetype.startsWith("video/") &&
    allowedVideoTypes.includes(file.mimetype)
  ) {
    console.log(
      `✅ Upload vidéo autorisé: ${file.originalname} (${file.mimetype})`,
    );
    return cb(null, true);
  }

  if (allowedDocumentTypes.includes(file.mimetype)) {
    console.log(
      `✅ Upload document autorisé: ${file.originalname} (${file.mimetype})`,
    );
    return cb(null, true);
  }

  // Log de sécurité pour les tentatives d'upload de fichiers non autorisés
  console.warn(`🚨 TENTATIVE D'UPLOAD DE FICHIER NON AUTORISÉ:
    IP: ${req.ip || req.connection.remoteAddress}
    Type MIME: ${file.mimetype}
    Nom: ${file.originalname}
    Taille: ${file.size} bytes
    User-Agent: ${req.get("User-Agent")}
    Timestamp: ${new Date().toISOString()}
  `);

  cb(
    new Error(
      "Type de fichier non autorisé. Types acceptés: JPG, PNG, WebP, MP4, WebM, PDF, DOC, DOCX, PPT, PPTX",
    ),
    false,
  );
};

// Filtre spécial pour les fichiers de leçons (autorise tous les types)
const lessonFileFilter = (req, file, cb) => {
  console.log("�� lessonFileFilter - DEBUT");
  console.log("🔍 lessonFileFilter - Type de fichier:", file.mimetype);
  console.log("🔍 lessonFileFilter - Nom du fichier:", file.originalname);
  console.log("🔍 lessonFileFilter - Taille du fichier:", file.size);
  console.log("🔍 lessonFileFilter - Appel de cb(null, true)");

  // Pour lesson-file, on autorise tous les types de fichiers
  cb(null, true);

  console.log("🔍 lessonFileFilter - Après cb()");
};

// Filtre pour les fichiers d'opportunités
const opportunitiesFileFilter = (req, file, cb) => {
  console.log("🔍 opportunitiesFileFilter - DEBUT");
  console.log("🔍 opportunitiesFileFilter - Type de fichier:", file.mimetype);
  console.log(
    "🔍 opportunitiesFileFilter - Nom du fichier:",
    file.originalname,
  );
  console.log("🔍 opportunitiesFileFilter - Taille du fichier:", file.size);

  // Définir le type d'upload pour les opportunités
  req.uploadType = "opportunities";

  console.log(
    "🔍 opportunitiesFileFilter - req.uploadType défini:",
    req.uploadType,
  );
  console.log("🔍 opportunitiesFileFilter - Appel de cb(null, true)");

  // Pour les fichiers d'opportunités, on autorise tous les types de fichiers
  cb(null, true);

  console.log("🔍 opportunitiesFileFilter - Après cb()");
};

// Configuration de Multer avec middleware pour définir le type d'upload
const createUploadMiddleware = (uploadType) => {
  return (req, res, next) => {
    req.uploadType = uploadType;
    next();
  };
};

// Middleware spécialisé pour les images de couverture de leçons
export const createLessonCoverUploadMiddleware = () => {
  return (req, res, next) => {
    req.uploadType = "lesson-cover";
    next();
  };
};

// Middleware spécialisé pour les fichiers joints de leçons
export const createLessonFileUploadMiddleware = () => {
  return (req, res, next) => {
    console.log("🔍 createLessonFileUploadMiddleware - DEBUT");
    console.log("🔍 createLessonFileUploadMiddleware - req.body:", req.body);
    console.log(
      "🔍 createLessonFileUploadMiddleware - req.params:",
      req.params,
    );
    console.log(
      "🔍 createLessonFileUploadMiddleware - req.uploadType sera défini à 'lesson-file'",
    );
    req.uploadType = "lesson-file";
    console.log(
      "🔍 createLessonFileUploadMiddleware - req.uploadType défini:",
      req.uploadType,
    );
    console.log("🔍 createLessonFileUploadMiddleware - Appel de next()");
    next();
    console.log("🔍 createLessonFileUploadMiddleware - Après next()");
  };
};

// Configuration de Multer
export const uploadSingleImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB pour les images
  },
}).single("image");

export const uploadSingleVideo = multer({
  storage: storage,
  fileFilter: lessonFileFilter, // Utiliser le filtre spécial pour lesson-file
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB pour les vidéos
  },
}).single("video");

export const uploadFormationVideo = multer({
  storage: storage,
  fileFilter: lessonFileFilter, // Utiliser le filtre spécial pour lesson-file
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB pour les vidéos
  },
}).single("video");

const formationCreateVideoStorage = multer.memoryStorage();

const formationCreateVideoFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === "video/mp4" && extension === ".mp4") {
    return cb(null, true);
  }
  return cb(new Error("Seuls les fichiers MP4 sont acceptes"), false);
};

export const uploadFormationCreateVideo = multer({
  storage: formationCreateVideoStorage,
  fileFilter: formationCreateVideoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max en memoire
  },
}).single("video");

export const uploadSingleFile = multer({
  storage: storage,
  fileFilter: lessonFileFilter, // Utiliser le filtre spécial pour lesson-file
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB pour les autres fichiers
  },
}).single("file");

export const uploadOpportunitiesFile = multer({
  storage: storage,
  fileFilter: opportunitiesFileFilter, // Utiliser le filtre spécial pour opportunities
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB pour les fichiers d'opportunités
  },
}).single("file");

// Middlewares spécialisés par type d'upload
export const uploadProfileImage = [
  createUploadMiddleware("profile"),
  uploadSingleImage,
];

export const uploadFormationImage = [
  createUploadMiddleware("formation"),
  uploadSingleImage,
];

export const uploadLessonFile = [
  createLessonFileUploadMiddleware(),
  uploadSingleFile,
];

export const uploadLessonCoverImage = [
  createLessonCoverUploadMiddleware(),
  uploadSingleImage,
];

// Middleware de gestion des erreurs Multer
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Le fichier est trop volumineux",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Trop de fichiers uploadés",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erreur d'upload: ${error.message}`,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next();
};
