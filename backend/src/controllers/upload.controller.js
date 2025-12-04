import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { cloudinaryService } from "../services/cloudinary.service.js";

const prisma = new PrismaClient();

// Fonction utilitaire pour sanitizer les titres
// Version améliorée qui préserve mieux la lisibilité en utilisant des tirets et underscores
function sanitizeTitle(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Retirer les accents
    .replace(/[^a-zA-Z0-9\s\-_]/g, "") // Préserver les underscores en plus des tirets
    .replace(/\s+/g, "_") // Remplacer les espaces par des underscores pour cohérence
    .replace(/[_-]+/g, (match) => match[0]) // Remplacer les underscores/tirets multiples par un seul
    .replace(/^[_-]|[_-]$/g, ""); // Retirer les underscores/tirets en début/fin
}

// Fonction helper pour déterminer le type de contenu basé sur le MIME type
function getContentTypeFromMime(mimeType, filename) {
  const ext = path.extname(filename).toLowerCase();

  // Images
  if (mimeType.startsWith("image/")) {
    return "INTERACTIVE";
  }

  // Vidéos
  if (mimeType.startsWith("video/")) {
    return "VIDEO";
  }

  // Audio
  if (mimeType.startsWith("audio/")) {
    return "AUDIO";
  }

  // PDF
  if (mimeType === "application/pdf" || ext === ".pdf") {
    return "DOCUMENT";
  }

  // Documents Word
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".doc" ||
    ext === ".docx"
  ) {
    return "DOCUMENT";
  }

  // Présentations PowerPoint
  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    ext === ".ppt" ||
    ext === ".pptx"
  ) {
    return "PRESENTATION";
  }

  // Tableurs Excel
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    ext === ".xls" ||
    ext === ".xlsx"
  ) {
    return "DOCUMENT";
  }

  // Texte
  if (mimeType === "text/plain" || ext === ".txt") {
    return "DOCUMENT";
  }

  // Par défaut
  return "DOCUMENT";
}

// Fonction helper pour déterminer le type MIME d'un fichier
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    // Images
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",

    // Vidéos
    ".mp4": "video/mp4",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".wmv": "video/x-ms-wmv",
    ".flv": "video/x-flv",
    ".webm": "video/webm",

    // Documents
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    // Présentations
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Texte
    ".txt": "text/plain",
    ".rtf": "application/rtf",

    // Archives
    ".zip": "application/zip",
    ".rar": "application/x-rar-compressed",
    ".7z": "application/x-7z-compressed",

    // Audio
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

// Fonction helper pour vérifier les fichiers existants dans une leçon
async function checkExistingLessonFiles(formationTitle, lessonTitle) {
  try {
    const sanitizedFormationTitle = sanitizeTitle(formationTitle);
    const sanitizedLessonTitle = sanitizeTitle(lessonTitle);

    const lessonPath = path.join(
      "uploads",
      "formations",
      sanitizedFormationTitle,
      "lessons",
      sanitizedLessonTitle
    );

    if (!fs.existsSync(lessonPath)) {
      return { exists: false, files: [] };
    }

    // Vérifier si video.mp4 existe
    const videoPath = path.join(lessonPath, "video.mp4");
    const exists = fs.existsSync(videoPath);

    return {
      exists: exists,
      files: exists
        ? [
            {
              name: "video.mp4",
              path: videoPath,
              size: fs.statSync(videoPath).size,
              type: getMimeType("video.mp4"),
            },
          ]
        : [],
    };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la vérification des fichiers existants:",
      error
    );
    return { exists: false, files: [] };
  }
}

// Fonction pour supprimer un fichier existant
async function deleteExistingLessonFile(formationTitle, lessonTitle) {
  try {
    const sanitizedFormationTitle = sanitizeTitle(formationTitle);
    const sanitizedLessonTitle = sanitizeTitle(lessonTitle);

    const lessonPath = path.join(
      "uploads",
      "formations",
      sanitizedFormationTitle,
      "lessons",
      sanitizedLessonTitle
    );

    if (!fs.existsSync(lessonPath)) {
      return { success: false, message: "Dossier de leçon introuvable" };
    }

    // Supprimer video.mp4 s'il existe
    const videoPath = path.join(lessonPath, "video.mp4");

    if (!fs.existsSync(videoPath)) {
      return { success: false, message: "Aucun fichier à supprimer" };
    }

    fs.unlinkSync(videoPath);
    console.log(`🗑️ Fichier supprimé: ${videoPath}`);

    return {
      success: true,
      message: "Fichier video.mp4 supprimé",
    };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la suppression des fichiers existants:",
      error
    );
    return { success: false, message: "Erreur lors de la suppression" };
  }
}

export const uploadController = {
  // Upload d'image de couverture
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Aucune image n'a été fournie",
        });
      }

      const { filename, path: filePath, mimetype, size } = req.file;
      const user = req.user;

      // Validation du type de fichier
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP",
        });
      }

      // Validation de la taille (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (size > maxSize) {
        return res.status(400).json({
          success: false,
          message: "L'image est trop volumineuse. Taille maximum : 5MB",
        });
      }

      // Générer une URL publique pour l'image
      const userFolderName = `${user.firstName}_${user.lastName}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      const imageUrl = `/uploads/lessons/${userFolderName}/${filename}`;

      console.log("📸 Image uploadée avec succès:", {
        filename,
        filePath,
        mimetype,
        size,
        imageUrl,
        user: `${user.firstName} ${user.lastName}`,
        userFolder: userFolderName,
      });

      res.json({
        success: true,
        data: {
          imageUrl,
          imageId: filename,
          filename,
          size,
          mimetype,
          userFolder: userFolderName,
        },
        message: "Image uploadée avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur uploadImage:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur lors de l'upload",
      });
    }
  },

  // Upload de vidéo
  async uploadVideo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Aucune vidéo n'a été fournie",
        });
      }

      const { filename, path: filePath, mimetype, size } = req.file;
      const user = req.user;
      const { formationTitle } = req.body;

      // Validation du type de fichier
      const allowedTypes = [
        "video/mp4",
        "video/avi",
        "video/mov",
        "video/wmv",
        "video/webm",
      ];
      if (!allowedTypes.includes(mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Type de fichier non autorisé. Utilisez MP4, AVI, MOV, WMV ou WebM",
        });
      }

      // Validation de la taille (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (size > maxSize) {
        return res.status(400).json({
          success: false,
          message: "La vidéo est trop volumineuse. Taille maximum : 100MB",
        });
      }

      // Upload vers Cloudinary si activé, sinon stockage local
      let videoUrl;
      let cloudinaryResult = null;

      if (cloudinaryService.isEnabled()) {
        console.log("☁️ Upload de la vidéo vers Cloudinary...");

        // Construire le public_id pour Cloudinary
        let publicId;
        if (formationTitle) {
          const sanitizedTitle =
            cloudinaryService.sanitizePublicId(formationTitle);
          publicId = `formations/${sanitizedTitle}/video`;
        } else {
          const userFolderName = `${user.firstName}_${user.lastName}`.replace(
            /[^a-zA-Z0-9_-]/g,
            "_"
          );
          publicId = `videos/${userFolderName}/${path.parse(filename).name}`;
        }

        // Upload vers Cloudinary
        cloudinaryResult = await cloudinaryService.uploadVideo(
          filePath,
          publicId,
          {
            tags: formationTitle
              ? [`formation-${formationTitle}`, "video"]
              : ["video"],
            context: {
              formation: formationTitle || "",
              uploaded_by: `${user.firstName} ${user.lastName}`,
              uploaded_at: new Date().toISOString(),
            },
          }
        );

        if (cloudinaryResult && cloudinaryResult.secure_url) {
          videoUrl = cloudinaryResult.secure_url;
          console.log("✅ Vidéo uploadée avec succès sur Cloudinary");
          console.log("📹 URL Cloudinary complète de la vidéo:");
          if (formationTitle) {
            console.log(`   Formation: ${formationTitle}`);
          } else {
            console.log(`   Utilisateur: ${user.firstName} ${user.lastName}`);
          }
          console.log(`   Public ID: ${cloudinaryResult.public_id}`);
          console.log(`   URL complète: ${cloudinaryResult.secure_url}`);
          console.log(
            `   Durée: ${
              cloudinaryResult.duration
                ? `${Math.floor(cloudinaryResult.duration)}s`
                : "N/A"
            }`
          );
          console.log(
            `   Résolution: ${cloudinaryResult.width}x${cloudinaryResult.height}`
          );
          console.log(
            `   Taille: ${
              cloudinaryResult.bytes
                ? `${(cloudinaryResult.bytes / 1024 / 1024).toFixed(2)} MB`
                : "N/A"
            }`
          );

          // Supprimer le fichier local après upload réussi
          try {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Fichier local supprimé: ${filePath}`);
          } catch (deleteError) {
            console.warn(
              `⚠️ Impossible de supprimer le fichier local: ${deleteError.message}`
            );
          }
        } else {
          console.warn(
            "⚠️ Upload Cloudinary échoué, utilisation du stockage local"
          );
          // Fallback vers stockage local
          if (formationTitle) {
            const sanitizedTitle = sanitizeTitle(formationTitle);
            videoUrl = `/uploads/formations/${sanitizedTitle}/video-${sanitizedTitle}.mp4`;
          } else {
            const userFolderName = `${user.firstName}_${user.lastName}`.replace(
              /[^a-zA-Z0-9_-]/g,
              "_"
            );
            videoUrl = `/uploads/videos/${userFolderName}/${filename}`;
          }
        }
      } else {
        // Stockage local si Cloudinary n'est pas activé
        console.log("📁 Stockage local de la vidéo (Cloudinary non activé)");
        if (formationTitle) {
          const sanitizedTitle = sanitizeTitle(formationTitle);
          videoUrl = `/uploads/formations/${sanitizedTitle}/video-${sanitizedTitle}.mp4`;
        } else {
          const userFolderName = `${user.firstName}_${user.lastName}`.replace(
            /[^a-zA-Z0-9_-]/g,
            "_"
          );
          videoUrl = `/uploads/videos/${userFolderName}/${filename}`;
        }
      }

      console.log("🎥 Vidéo uploadée avec succès:", {
        filename,
        filePath: cloudinaryResult ? "Cloudinary" : filePath,
        mimetype,
        size,
        videoUrl,
        formationTitle,
        user: `${user.firstName} ${user.lastName}`,
        cloudinary: cloudinaryResult ? true : false,
      });

      res.json({
        success: true,
        data: {
          videoUrl,
          videoId: cloudinaryResult?.public_id || filename,
          filename,
          size,
          mimetype,
          cloudinary: cloudinaryResult
            ? {
                public_id: cloudinaryResult.public_id,
                duration: cloudinaryResult.duration,
                width: cloudinaryResult.width,
                height: cloudinaryResult.height,
              }
            : null,
        },
        message: "Vidéo uploadée avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur uploadVideo:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur lors de l'upload",
      });
    }
  },

  // Upload de fichier générique
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Aucun fichier n'a été fourni",
        });
      }

      const { filename, path: filePath, mimetype, size } = req.file;
      const user = req.user;

      // Validation de la taille (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (size > maxSize) {
        return res.status(400).json({
          success: false,
          message: "Le fichier est trop volumineux. Taille maximum : 50MB",
        });
      }

      // Déterminer le type de contenu
      let contentType = "files";
      if (mimetype.startsWith("image/")) {
        contentType = "images";
      } else if (mimetype.startsWith("video/")) {
        contentType = "videos";
      }

      // Générer une URL publique pour le fichier
      const userFolderName = `${user.firstName}_${user.lastName}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      const fileUrl = `/uploads/${contentType}/${userFolderName}/${filename}`;

      console.log("📁 Fichier uploadé avec succès:", {
        filename,
        filePath,
        mimetype,
        size,
        fileUrl,
        user: `${user.firstName} ${user.lastName}`,
        userFolder: userFolderName,
        contentType,
      });

      res.json({
        success: true,
        data: {
          fileUrl,
          fileId: filename,
          filename,
          size,
          mimetype,
          userFolder: userFolderName,
          contentType,
        },
        message: "Fichier uploadé avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur uploadFile:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur lors de l'upload",
      });
    }
  },

  // Récupérer le fichier d'une leçon (avec ou sans nom de fichier)
  async getLessonFile(req, res) {
    try {
      const { formationTitle, lessonTitle, filename } = req.params;

      if (!formationTitle || !lessonTitle) {
        return res.status(400).json({
          success: false,
          message: "Le titre de la formation et de la leçon sont requis",
        });
      }

      // Sanitizer les titres pour la sécurité
      const sanitizedFormationTitle = sanitizeTitle(formationTitle);
      const sanitizedLessonTitle = sanitizeTitle(lessonTitle);

      // Construire le chemin du dossier de la leçon
      const lessonDir = path.join(
        process.cwd(),
        "uploads",
        "formations",
        sanitizedFormationTitle,
        "lessons",
        sanitizedLessonTitle
      );

      console.log("🔍 getLessonFile - formationTitle reçu:", formationTitle);
      console.log("🔍 getLessonFile - lessonTitle reçu:", lessonTitle);
      console.log(
        "🔍 getLessonFile - sanitizedFormationTitle:",
        sanitizedFormationTitle
      );
      console.log(
        "🔍 getLessonFile - sanitizedLessonTitle:",
        sanitizedLessonTitle
      );
      console.log("🔍 getLessonFile - Dossier de la leçon:", lessonDir);

      // Vérifier si le dossier existe
      if (!fs.existsSync(lessonDir)) {
        console.log("❌ Dossier de leçon non trouvé:", lessonDir);

        // Essayer de lister les dossiers disponibles pour debugging
        const formationsDir = path.join(process.cwd(), "uploads", "formations");
        if (fs.existsSync(formationsDir)) {
          const availableFormations = fs.readdirSync(formationsDir);
          console.log(
            "📁 Dossiers de formations disponibles:",
            availableFormations
          );
        }

        return res.status(404).json({
          success: false,
          message: "Dossier de leçon non trouvé",
        });
      }

      // Toujours utiliser video.mp4 comme nom de fichier
      const targetFilename = filename || "video.mp4";
      const filePath = path.join(lessonDir, targetFilename);

      // console.log("🔍 getLessonFile - Chemin du fichier:", filePath);

      // Vérifier si le fichier existe
      if (!fs.existsSync(filePath)) {
        console.log("❌ Fichier non trouvé:", filePath);
        return res.status(404).json({
          success: false,
          message: "Fichier non trouvé",
        });
      }

      // Obtenir les informations du fichier
      const stats = fs.statSync(filePath);
      const mimeType = getMimeType(targetFilename);

      // Définir les headers appropriés avec protection contre le téléchargement
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Content-Disposition", "inline"); // Afficher dans le navigateur plutôt que télécharger
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      // Ajouter des headers de sécurité pour empêcher le téléchargement
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

      // Headers supplémentaires pour empêcher les captures et téléchargements
      res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

      // Empêcher le téléchargement direct
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; media-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
      );

      // Envoyer le fichier
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      console.log("✅ Fichier de leçon envoyé avec succès:", {
        formationTitle: sanitizedFormationTitle,
        lessonTitle: sanitizedLessonTitle,
        filename: targetFilename,
        size: stats.size,
        mimeType,
      });
    } catch (error) {
      console.error("❌ Erreur getLessonFile:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur lors de la récupération du fichier",
      });
    }
  },

  // Upload d'image de couverture de formation
  async uploadFormationCoverImage(req, res) {
    try {
      console.log("🔍 Contrôleur - req.body complet:", req.body);
      console.log("🔍 Contrôleur - req.params complet:", req.params);
      console.log("🔍 Contrôleur - req.file:", req.file);

      const { formationTitle } = req.params;

      if (!formationTitle) {
        return res.status(400).json({
          success: false,
          message: "Le titre de la formation est requis dans l'URL",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Aucun fichier n'a été uploadé",
        });
      }

      // Générer l'URL de l'image
      const imageUrl = `uploads/formations/${formationTitle}/${req.file.filename}`;

      console.log("🔍 Contrôleur - URL générée:", imageUrl);

      res.json({
        success: true,
        message: "Image de couverture uploadée avec succès",
        data: imageUrl,
      });
    } catch (error) {
      console.error("❌ Erreur uploadFormationCoverImage:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'upload de l'image de couverture",
        error: error.message,
      });
    }
  },

  // Upload d'image de couverture de leçon
  async uploadLessonCoverImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Aucune image n'a été fournie",
        });
      }

      const { filename, path: filePath, mimetype, size } = req.file;
      const { formationTitle, lessonTitle } = req.body;

      if (!formationTitle || !lessonTitle) {
        return res.status(400).json({
          success: false,
          message: "Le titre de la formation et de la leçon sont requis",
        });
      }

      // Validation du type de fichier
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP",
        });
      }

      // Validation de la taille (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (size > maxSize) {
        return res.status(400).json({
          success: false,
          message: "L'image est trop volumineuse. Taille maximum : 5MB",
        });
      }

      // Créer les dossiers de la leçon
      const sanitizedFormationTitle = sanitizeTitle(formationTitle);
      const sanitizedLessonTitle = sanitizeTitle(lessonTitle);
      const lessonPath = `uploads/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}`;

      // Vérifier si les dossiers existent, sinon les créer
      if (!fs.existsSync(lessonPath)) {
        fs.mkdirSync(lessonPath, { recursive: true });
        console.log(`📁 Dossier leçon créé: ${lessonPath}`);
      }

      // Générer une URL publique pour l'image
      const imageUrl = `/uploads/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/${filename}`;

      console.log("📸 Image de couverture de leçon uploadée avec succès:", {
        filename,
        filePath,
        mimetype,
        size,
        imageUrl,
        formationTitle,
        lessonTitle,
        lessonPath,
      });

      res.json({
        success: true,
        data: {
          imageUrl,
          imageId: filename,
          filename,
          size,
          mimetype,
          lessonPath,
        },
        message: "Image de couverture de leçon uploadée avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur uploadLessonCoverImage:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur lors de l'upload",
      });
    }
  },

  // Upload de fichier joint pour une leçon
  async uploadLessonFile(req, res) {
    try {
      console.log("🔍 Contrôleur uploadLessonFile - DEBUT");
      console.log("🔍 Contrôleur uploadLessonFile - req.params:", req.params);
      console.log("🔍 Contrôleur uploadLessonFile - req.file:", req.file);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Aucun fichier n'a été fourni",
        });
      }

      const { filename, path: filePath, mimetype, size } = req.file;
      const { formationTitle, lessonTitle } = req.params;

      if (!formationTitle || !lessonTitle) {
        return res.status(400).json({
          success: false,
          message: "Le titre de la formation et de la leçon sont requis",
        });
      }

      // Validation de la taille (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (size > maxSize) {
        return res.status(400).json({
          success: false,
          message: "Le fichier est trop volumineux. Taille maximum : 50MB",
        });
      }

      // Créer les dossiers de la leçon
      const sanitizedFormationTitle = formationTitle
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();
      const sanitizedLessonTitle = lessonTitle
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();
      const lessonPath = `uploads/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}`;

      // Vérifier si les dossiers existent, sinon les créer
      if (!fs.existsSync(lessonPath)) {
        fs.mkdirSync(lessonPath, { recursive: true });
        console.log(`📁 Dossier leçon créé: ${lessonPath}`);
      }

      // Renommer le fichier en video.mp4 pour uniformiser
      const finalFilename = "video.mp4";
      const finalFilePath = path.join(lessonPath, finalFilename);

      // Supprimer l'ancien fichier video.mp4 s'il existe
      if (fs.existsSync(finalFilePath)) {
        fs.unlinkSync(finalFilePath);
        console.log(`🗑️ Ancien fichier video.mp4 supprimé`);
      }

      // Déplacer et renommer le fichier uploadé en video.mp4
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.copyFileSync(req.file.path, finalFilePath);
        fs.unlinkSync(req.file.path); // Supprimer le fichier temporaire
        console.log(`📁 Fichier renommé et déplacé vers: ${finalFilePath}`);
      } else {
        throw new Error("Fichier temporaire introuvable");
      }

      // Déterminer le type de contenu basé sur le MIME type et l'extension
      // Utiliser le nom original pour détecter le type, mais le fichier final est video.mp4
      const detectedMimeType = getMimeType(filename);
      const contentType = getContentTypeFromMime(detectedMimeType, filename);
      const isVideo =
        detectedMimeType === "video" || mimetype.startsWith("video/");

      // Upload vers Cloudinary si activé (pour les vidéos), sinon stockage local
      let fileUrl = `/uploads/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/${finalFilename}`;
      let cloudinaryResult = null;

      // Vérifier si Cloudinary est activé
      const isCloudinaryEnabled = cloudinaryService.isEnabled();
      console.log("🔍 Vérification Cloudinary:", {
        isVideo,
        isCloudinaryEnabled,
        willUploadToCloudinary: isVideo && isCloudinaryEnabled,
      });

      // Si c'est une vidéo, utiliser Cloudinary
      if (isVideo && isCloudinaryEnabled) {
        console.log("☁️ Upload de la vidéo de leçon vers Cloudinary...");

        const sanitizedFormationTitle =
          cloudinaryService.sanitizePublicId(formationTitle);
        const sanitizedLessonTitle =
          cloudinaryService.sanitizePublicId(lessonTitle);

        // Public ID avec la structure de dossiers : formations/{formation}/lessons/{lesson}/video
        // Cloudinary créera automatiquement cette structure de dossiers
        // Le fichier sera accessible via : https://res.cloudinary.com/{cloud_name}/video/upload/formations/{formation}/lessons/{lesson}/video.mp4
        const publicId = `formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/video`;

        console.log(`📁 Structure de dossiers Cloudinary: ${publicId}`);
        console.log(`   Formation: ${sanitizedFormationTitle}`);
        console.log(`   Leçon: ${sanitizedLessonTitle}`);
        console.log(`   Fichier: video.mp4`);

        cloudinaryResult = await cloudinaryService.uploadVideo(
          finalFilePath,
          publicId,
          {
            tags: [
              `formation-${formationTitle}`,
              `lesson-${lessonTitle}`,
              "video",
              "lesson-video",
            ],
            context: {
              formation: formationTitle,
              lesson: lessonTitle,
              uploaded_at: new Date().toISOString(),
            },
          }
        );

        if (cloudinaryResult && cloudinaryResult.secure_url) {
          // Construire l'URL au format exact demandé
          // Format: https://res.cloudinary.com/{cloud_name}/video/upload/formations/{formation}/lessons/{lesson}/video.mp4
          // Cloudinary a créé automatiquement la structure de dossiers basée sur le public_id
          const cloudName = cloudinaryService.getCloudName();
          fileUrl = `https://res.cloudinary.com/${cloudName}/video/upload/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/video.mp4`;
          console.log(`🔗 URL Cloudinary construite: ${fileUrl}`);
          console.log(
            `📁 Structure de dossiers créée automatiquement dans Cloudinary:`
          );
          console.log(`   formations/${sanitizedFormationTitle}/`);
          console.log(
            `   formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/`
          );
          console.log(`   Fichier: video.mp4`);
          console.log("✅ Vidéo de leçon uploadée avec succès sur Cloudinary");
          console.log("📹 URL Cloudinary complète de la vidéo:");
          console.log(`   Formation: ${formationTitle}`);
          console.log(`   Leçon: ${lessonTitle}`);
          console.log(`   Public ID: ${cloudinaryResult.public_id}`);
          console.log(`   URL complète: ${cloudinaryResult.secure_url}`);
          console.log(
            `   ✅ fileUrl mis à jour avec l'URL Cloudinary: ${fileUrl}`
          );
          console.log(
            `   Durée: ${
              cloudinaryResult.duration
                ? `${Math.floor(cloudinaryResult.duration)}s`
                : "N/A"
            }`
          );
          console.log(
            `   Résolution: ${cloudinaryResult.width}x${cloudinaryResult.height}`
          );
          console.log(
            `   Taille: ${
              cloudinaryResult.bytes
                ? `${(cloudinaryResult.bytes / 1024 / 1024).toFixed(2)} MB`
                : "N/A"
            }`
          );

          // Supprimer le fichier local après upload réussi
          try {
            fs.unlinkSync(finalFilePath);
            console.log(`🗑️ Fichier local supprimé: ${finalFilePath}`);
          } catch (deleteError) {
            console.warn(
              `⚠️ Impossible de supprimer le fichier local: ${deleteError.message}`
            );
          }
        } else {
          console.warn(
            "⚠️ Upload Cloudinary échoué, utilisation du stockage local"
          );
          console.warn("⚠️ cloudinaryResult:", cloudinaryResult);
        }
      } else if (isVideo && !isCloudinaryEnabled) {
        console.warn("⚠️ Vidéo détectée mais Cloudinary n'est pas activé");
        console.warn("⚠️ Variables Cloudinary manquantes ou incorrectes");
        console.warn("⚠️ La vidéo sera stockée localement");
      }

      console.log("🔍 Type de contenu détecté:", {
        originalFilename: filename,
        finalFilename: finalFilename,
        detectedMimeType,
        contentType,
        originalMimeType: mimetype,
        isVideo,
        cloudinary: cloudinaryResult ? true : false,
      });

      // Mettre à jour le type de la leçon en base de données
      try {
        const lesson = await prisma.formationContent.findFirst({
          where: {
            title: lessonTitle,
            contentType: "LESSON",
            formation: {
              title: formationTitle,
            },
          },
        });

        if (lesson) {
          await prisma.formationContent.update({
            where: { id: lesson.id },
            data: {
              type: contentType,
              fileUrl: fileUrl, // URL Cloudinary si upload réussi, sinon chemin local
            },
          });
          console.log(`✅ Type de leçon mis à jour en base: ${contentType}`);
          console.log(`✅ fileUrl sauvegardé en base de données: ${fileUrl}`);
        } else {
          console.log("⚠️ Leçon non trouvée en base pour mise à jour du type");
        }
      } catch (dbError) {
        console.error(
          "❌ Erreur lors de la mise à jour du type de leçon:",
          dbError
        );
        // Ne pas faire échouer l'upload pour une erreur de base de données
      }

      console.log("📎 Fichier joint de leçon uploadé avec succès:", {
        originalFilename: filename,
        finalFilename: finalFilename,
        filePath: cloudinaryResult ? "Cloudinary" : finalFilePath,
        mimetype,
        size,
        fileUrl, // URL Cloudinary si upload réussi, sinon chemin local
        formationTitle,
        lessonTitle,
        lessonPath,
        cloudinaryUploaded: cloudinaryResult ? true : false,
      });

      // IMPORTANT: S'assurer que fileUrl contient l'URL Cloudinary si l'upload a réussi
      const responseFileUrl = cloudinaryResult?.secure_url || fileUrl;

      res.json({
        success: true,
        data: {
          fileUrl: responseFileUrl, // URL Cloudinary prioritaire
          fileId: cloudinaryResult?.public_id || finalFilename,
          filename: finalFilename,
          size,
          mimetype: detectedMimeType,
          contentType: contentType,
          lessonPath,
          cloudinary: cloudinaryResult
            ? {
                public_id: cloudinaryResult.public_id,
                duration: cloudinaryResult.duration,
                width: cloudinaryResult.width,
                height: cloudinaryResult.height,
                secure_url: cloudinaryResult.secure_url,
              }
            : null,
        },
        message: cloudinaryResult
          ? "Fichier joint uploadé avec succès sur Cloudinary"
          : "Fichier joint uploadé avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur uploadLessonFile:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur lors de l'upload",
      });
    }
  },

  // Vérifier si un fichier existe
  async checkFile(req, res) {
    try {
      const { contentType, userFolder, filename } = req.params;
      const filePath = `uploads/${contentType}/${userFolder}/${filename}`;

      // Vérifier si le fichier existe
      const fs = require("fs");
      const path = require("path");
      const fullPath = path.join(process.cwd(), filePath);

      if (fs.existsSync(fullPath)) {
        res.json({
          success: true,
          data: { exists: true, path: filePath, fullPath },
        });
      } else {
        res.json({
          success: true,
          data: { exists: false, path: filePath, fullPath },
        });
      }
    } catch (error) {
      console.error("❌ Erreur checkFile:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification du fichier",
      });
    }
  },

  // Lister les fichiers d'un utilisateur
  async listUserFiles(req, res) {
    try {
      const user = req.user;
      const { contentType = "images" } = req.query;

      const userFolderName = `${user.firstName}_${user.lastName}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      const userFolderPath = path.join("uploads", contentType, userFolderName);

      // Vérifier si le dossier existe
      const fs = require("fs");
      const fullPath = path.join(process.cwd(), userFolderPath);

      if (!fs.existsSync(fullPath)) {
        return res.json({
          success: true,
          data: { files: [], folder: userFolderPath },
        });
      }

      // Lister les fichiers
      const files = fs.readdirSync(fullPath);
      const fileList = files.map((filename) => ({
        filename,
        url: `/uploads/${contentType}/${userFolderName}/${filename}`,
        path: path.join(userFolderPath, filename),
      }));

      res.json({
        success: true,
        data: {
          files: fileList,
          folder: userFolderPath,
          user: `${user.firstName} ${user.lastName}`,
          contentType,
        },
      });
    } catch (error) {
      console.error("❌ Erreur listUserFiles:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la liste des fichiers",
      });
    }
  },

  // Vérifier les fichiers existants d'une leçon
  async checkLessonFiles(req, res) {
    try {
      const { formationTitle, lessonTitle } = req.params;

      if (!formationTitle || !lessonTitle) {
        return res.status(400).json({
          success: false,
          message: "Le titre de la formation et de la leçon sont requis",
        });
      }

      const result = await checkExistingLessonFiles(
        formationTitle,
        lessonTitle
      );

      res.json({
        success: true,
        data: result,
        message: result.exists ? "Fichiers trouvés" : "Aucun fichier trouvé",
      });
    } catch (error) {
      console.error("❌ Erreur checkLessonFiles:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification des fichiers",
      });
    }
  },

  // Supprimer les fichiers existants d'une leçon
  async deleteLessonFiles(req, res) {
    try {
      const { formationTitle, lessonTitle } = req.params;

      if (!formationTitle || !lessonTitle) {
        return res.status(400).json({
          success: false,
          message: "Le titre de la formation et de la leçon sont requis",
        });
      }

      const result = await deleteExistingLessonFile(
        formationTitle,
        lessonTitle
      );

      if (result.success) {
        res.json({
          success: true,
          data: result,
          message: result.message,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error("❌ Erreur deleteLessonFiles:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression des fichiers",
      });
    }
  },

  // Mettre à jour les types de fichiers existants
  async updateExistingFileTypes(req, res) {
    try {
      console.log("🔄 Mise à jour des types de fichiers existants...");

      // Récupérer toutes les leçons avec des fichiers
      const lessons = await prisma.formationContent.findMany({
        where: {
          contentType: "LESSON",
          fileUrl: {
            not: null,
          },
        },
        include: {
          formation: true,
        },
      });

      console.log(`📚 ${lessons.length} leçons avec fichiers trouvées`);

      let updatedCount = 0;
      let errorCount = 0;

      for (const lesson of lessons) {
        try {
          // Extraire le nom de fichier de l'URL
          const fileName = lesson.fileUrl.split("/").pop();
          if (!fileName) continue;

          // Déterminer le type de contenu
          const detectedMimeType = getMimeType(fileName);
          const contentType = getContentTypeFromMime(
            detectedMimeType,
            fileName
          );

          // Mettre à jour si le type a changé
          if (lesson.type !== contentType) {
            await prisma.formationContent.update({
              where: { id: lesson.id },
              data: { type: contentType },
            });

            console.log(
              `✅ Leçon "${lesson.title}" mise à jour: ${lesson.type} → ${contentType}`
            );
            updatedCount++;
          }
        } catch (error) {
          console.error(
            `❌ Erreur lors de la mise à jour de la leçon "${lesson.title}":`,
            error
          );
          errorCount++;
        }
      }

      res.json({
        success: true,
        data: {
          totalLessons: lessons.length,
          updatedCount,
          errorCount,
          message: `Mise à jour terminée: ${updatedCount} leçons mises à jour, ${errorCount} erreurs`,
        },
      });
    } catch (error) {
      console.error("❌ Erreur updateExistingFileTypes:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour des types de fichiers",
      });
    }
  },
};
