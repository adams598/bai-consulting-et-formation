import multer from "multer";
import path from "path";
import fs from "fs";

// Fonction utilitaire pour sanitizer les titres
function sanitizeTitle(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Retirer les accents
    .replace(/[^a-zA-Z0-9_-]/g, "_") // Remplacer les caractères spéciaux par _
    .replace(/_+/g, "_") // Remplacer les underscores multiples par un seul
    .replace(/^_|_$/g, ""); // Retirer les underscores en début/fin
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
      extension
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
      req.uploadType === "lesson-file"
    );
    console.log(
      "🔍 Multer destination - req.uploadType === 'lesson-cover':",
      req.uploadType === "lesson-cover"
    );
    console.log(
      "🔍 Multer destination - req.body keys:",
      Object.keys(req.body)
    );
    console.log(
      "🔍 Multer destination - req.body.formationTitle:",
      req.body.formationTitle
    );
    console.log(
      "🔍 Multer destination - req.body.lessonTitle:",
      req.body.lessonTitle
    );
    console.log(
      "🔍 Multer destination - Type de req.uploadType:",
      typeof req.uploadType
    );
    console.log(
      "🔍 Multer destination - Longueur de req.uploadType:",
      req.uploadType ? req.uploadType.length : "undefined"
    );
    console.log(
      "🔍 Multer destination - req.uploadType === 'lesson-file' (string):",
      req.uploadType === "lesson-file"
    );
    console.log(
      "🔍 Multer destination - req.uploadType === 'lesson-file' (charCode):",
      req.uploadType === "lesson-file"
    );
    console.log(
      "🔍 Multer destination - req.uploadType charCodeAt(0):",
      req.uploadType ? req.uploadType.charCodeAt(0) : "undefined"
    );
    console.log(
      "🔍 Multer destination - 'lesson-file' charCodeAt(0):",
      "lesson-file".charCodeAt(0)
    );
    console.log("🔍 Multer destination - AVANT LA CONDITION IF");
    console.log(
      "🔍 Multer destination - req.uploadType === 'profile':",
      req.uploadType === "profile"
    );
    console.log(
      "🔍 Multer destination - req.uploadType === 'lesson-cover' || req.uploadType === 'lesson-file':",
      req.uploadType === "lesson-cover" || req.uploadType === "lesson-file"
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
          req.body.formationTitle
        );
        console.log(
          "🔍 Middleware lesson-cover - lessonTitle reçu:",
          req.body.lessonTitle
        );

        if (!req.body.formationTitle || !req.body.lessonTitle) {
          console.error(
            "❌ ERREUR: formationTitle ou lessonTitle manquant dans req.body"
          );
          return cb(
            new Error(
              "Le titre de la formation et de la leçon sont requis pour l'upload"
            ),
            null
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
          sanitizedLessonTitle
        );

        console.log(
          "🔍 Middleware lesson-cover - uploadPath final:",
          uploadPath
        );
        console.log("🔍 Middleware lesson-cover - FIN");
      } else if (req.uploadType === "lesson-file") {
        // Pour lesson-file, utiliser req.params (car req.body n'est pas encore disponible)
        console.log("🔍 Middleware lesson-file - req.params:", req.params);
        console.log(
          "🔍 Middleware lesson-file - formationTitle reçu:",
          req.params.formationTitle
        );
        console.log(
          "🔍 Middleware lesson-file - lessonTitle reçu:",
          req.params.lessonTitle
        );

        if (!req.params.formationTitle || !req.params.lessonTitle) {
          console.error(
            "❌ ERREUR: formationTitle ou lessonTitle manquant dans req.params"
          );
          console.error("❌ formationTitle:", req.params.formationTitle);
          console.error("❌ lessonTitle:", req.params.lessonTitle);
          return cb(
            new Error(
              "Le titre de la formation et de la leçon sont requis pour l'upload"
            ),
            null
          );
        }

        const formationTitle = req.params.formationTitle;
        const lessonTitle = req.params.lessonTitle;
        console.log(
          "🔍 Middleware lesson-file - formationTitle:",
          formationTitle
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
          sanitizedLessonTitle
        );

        console.log(
          "🔍 Middleware lesson-file - uploadPath final:",
          uploadPath
        );
        console.log("🔍 Middleware lesson-file - FIN");
      }
    } else if (req.uploadType === "formation") {
      console.log("🔍 Middleware formation - req.params:", req.params);
      console.log(
        "🔍 Middleware formation - formationTitle reçu (from params):",
        req.params.formationTitle
      );

      if (!req.params.formationTitle) {
        console.error("❌ ERREUR: formationTitle manquant dans req.params");
        return cb(
          new Error(
            "Le titre de la formation est requis dans l'URL pour l'upload"
          ),
          null
        );
      }

      const formationTitle = req.params.formationTitle;
      const sanitizedFormationTitle = sanitizeTitle(formationTitle);

      console.log(
        "🔍 Middleware formation - Titre sanitizé:",
        sanitizedFormationTitle
      );

      uploadPath = path.join("uploads", "formations", sanitizedFormationTitle);
      console.log("🔍 Middleware formation - uploadPath final:", uploadPath);
    } else {
      // Images génériques : uploads/images/{user}/
      uploadPath = path.join("uploads", contentType, userFolderName);
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
        "_"
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
      // Pour les vidéos, utiliser le format vidéo-{nom de l'user}
      const userFolderName = `${user.firstName}_${user.lastName}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      filename = `video-${userFolderName}-${timestamp}${extension}`;
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
    } else {
      // Pour les autres fichiers, utiliser le format file-{nom de l'user}
      const userFolderName = `${user.firstName}_${user.lastName}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      filename = `file-${userFolderName}-${timestamp}${extension}`;
    }

    console.log(`📝 Nom de fichier généré: ${filename}`);
    cb(null, filename);
  },
});

// Filtre des types de fichiers
const fileFilter = (req, file, cb) => {
  // Images autorisées
  if (file.mimetype.startsWith("image/")) {
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedImageTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
  }

  // Vidéos autorisées
  if (file.mimetype.startsWith("video/")) {
    const allowedVideoTypes = [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/webm",
    ];
    if (allowedVideoTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
  }

  cb(
    new Error(
      "Type de fichier non autorisé. Utilisez JPG, PNG, GIF, WebP, MP4, AVI, MOV, WMV ou WebM"
    ),
    false
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
      req.params
    );
    console.log(
      "🔍 createLessonFileUploadMiddleware - req.uploadType sera défini à 'lesson-file'"
    );
    req.uploadType = "lesson-file";
    console.log(
      "🔍 createLessonFileUploadMiddleware - req.uploadType défini:",
      req.uploadType
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

export const uploadSingleFile = multer({
  storage: storage,
  fileFilter: lessonFileFilter, // Utiliser le filtre spécial pour lesson-file
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB pour les autres fichiers
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
