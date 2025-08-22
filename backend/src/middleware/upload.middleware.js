import multer from "multer";
import path from "path";
import fs from "fs";

// Configuration du stockage avec dossiers dynamiques
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Récupérer l'utilisateur depuis le token JWT
    const user = req.user;

    if (!user) {
      return cb(new Error("Utilisateur non authentifié"), null);
    }

    // Déterminer le type de contenu (image ou vidéo)
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    let contentType = "images"; // Par défaut
    if (isVideo) {
      contentType = "videos";
    } else if (!isImage) {
      return cb(new Error("Type de fichier non supporté"), null);
    }

    // Créer le chemin du dossier utilisateur
    const userFolderName = `${user.firstName}_${user.lastName}`.replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );

    // Nouvelle arborescence organisée par type de contenu
    let uploadPath;
    if (req.uploadType === "profile") {
      // Images de profil : uploads/profiles/{user}/
      uploadPath = path.join("uploads", "profiles", userFolderName);
    } else if (req.uploadType === "lesson") {
      // Images de couverture des leçons : uploads/lessons/{user}/
      uploadPath = path.join("uploads", "lessons", userFolderName);
    } else if (req.uploadType === "formation") {
      // Images des formations : uploads/formations/{user}/
      uploadPath = path.join("uploads", "formations", userFolderName);
    } else {
      // Images génériques : uploads/images/{user}/
      uploadPath = path.join("uploads", contentType, userFolderName);
    }

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`📁 Dossier créé: ${uploadPath}`);
    }

    cb(null, uploadPath);
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
      } else if (req.uploadType === "lesson") {
        // Images de couverture des leçons : couverture-{titre_lecon}-{timestamp}.{ext}
        const lessonTitle = req.lessonTitle || "sans-titre";
        const sanitizedTitle = lessonTitle
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .toLowerCase();
        filename = `couverture-${sanitizedTitle}-${timestamp}${extension}`;
      } else if (req.uploadType === "formation") {
        // Images des formations : formation-{user}-{timestamp}.{ext}
        filename = `formation-${userFolderName}-${timestamp}${extension}`;
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

// Configuration de Multer avec middleware pour définir le type d'upload
const createUploadMiddleware = (uploadType) => {
  return (req, res, next) => {
    req.uploadType = uploadType;
    next();
  };
};

// Middleware spécialisé pour les images de leçons avec titre
const createLessonUploadMiddleware = () => {
  return (req, res, next) => {
    req.uploadType = "lesson";

    // Récupérer le titre de la leçon depuis le body ou les query params
    const lessonTitle =
      req.body.lessonTitle ||
      req.query.lessonTitle ||
      req.headers["x-lesson-title"];
    req.lessonTitle = lessonTitle;

    console.log(`📚 Upload d'image pour la leçon: "${lessonTitle}"`);
    next();
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
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB pour les vidéos
  },
}).single("video");

export const uploadSingleFile = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB pour les autres fichiers
  },
}).single("file");

// Middlewares spécialisés par type d'upload
export const uploadProfileImage = [
  createUploadMiddleware("profile"),
  uploadSingleImage,
];
export const uploadLessonImage = [
  createLessonUploadMiddleware(),
  uploadSingleImage,
];
export const uploadFormationImage = [
  createUploadMiddleware("formation"),
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
