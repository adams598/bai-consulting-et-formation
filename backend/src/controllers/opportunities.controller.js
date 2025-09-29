import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

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

export const opportunitiesController = {
  // Récupérer tous les fichiers d'opportunités commerciales
  async getPresentationFiles(req, res) {
    try {
      console.log("📄 Récupération des fichiers d'opportunités commerciales");

      // Lire le dossier uploads/OC
      const ocPath = path.join(process.cwd(), "uploads", "OC");

      if (!fs.existsSync(ocPath)) {
        console.log("📁 Dossier uploads/OC n'existe pas encore, création...");
        fs.mkdirSync(ocPath, { recursive: true });
        return res.json({
          success: true,
          data: [],
          message: "Aucun fichier trouvé",
        });
      }

      const files = fs.readdirSync(ocPath);
      // Filtrer les fichiers qui commencent par "file-" (format des fichiers uploadés)
      const uploadedFiles = files.filter((file) => file.startsWith("file-"));

      console.log(`📄 ${uploadedFiles.length} fichier(s) trouvé(s)`);

      const filesData = uploadedFiles.map((file) => {
        const filePath = path.join(ocPath, file);
        const stats = fs.statSync(filePath);

        // Déterminer le type de contenu
        const detectedMimeType = getMimeType(file);
        const contentType = getContentTypeFromMime(detectedMimeType, file);

        // Extraire le nom original et l'ID du nouveau format : file-{titredufichier}-{id du fichier}.pdf
        const match = file.match(/^file-(.+)-(\d+)\.(.+)$/);
        let originalName, fileId, title;

        if (match) {
          // Nouveau format : file-{titredufichier}-{id du fichier}.pdf
          title = match[1].replace(/_/g, " ");
          fileId = match[2];
          originalName = `${title}.${match[3]}`;
        } else {
          // Ancien format (fallback) : file-{timestamp}-{nom}.pdf
          originalName = file.replace(/^file-\d+-/, "");
          title = file
            .replace(/^file-\d+-/, "")
            .replace(/\.[^/.]+$/, "")
            .replace(/_/g, " ");
          fileId = "unknown";
        }

        return {
          id: title.replace(/\s+/g, "_").toLowerCase(), // Utiliser le titre comme ID
          fileName: file,
          originalName: originalName,
          fileId: fileId,
          filePath: `/api/opportunities/files/${file}`,
          fileSize: stats.size,
          uploadDate: stats.birthtime.toISOString(),
          uploadedBy: "Admin", // TODO: Récupérer depuis la base de données
          formationTitle: title,
          coverImage: null,
          mimetype: detectedMimeType,
          contentType: contentType,
        };
      });

      // Trier par date de création (plus récent en premier)
      filesData.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

      res.json({
        success: true,
        data: filesData,
        message: `${filesData.length} fichier(s) récupéré(s)`,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des fichiers:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des fichiers",
        error: error.message,
      });
    }
  },

  // Upload d'un nouveau fichier d'opportunité commerciale
  async uploadPresentationFile(req, res) {
    try {
      console.log("🔍 Contrôleur uploadPresentationFile - DEBUT");
      console.log("🔍 Contrôleur uploadPresentationFile - req.file:", req.file);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Aucun fichier n'a été fourni",
        });
      }

      const { filename, path: filePath, mimetype, size } = req.file;

      // Validation de la taille (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (size > maxSize) {
        return res.status(400).json({
          success: false,
          message: "Le fichier est trop volumineux. Taille maximum : 50MB",
        });
      }

      // Créer le dossier uploads/OC s'il n'existe pas
      const ocPath = path.join("uploads", "OC");
      if (!fs.existsSync(ocPath)) {
        fs.mkdirSync(ocPath, { recursive: true });
        console.log(`📁 Dossier OC créé: ${ocPath}`);
      }

      // Le fichier est déjà dans le bon dossier grâce au middleware
      const finalFilePath = path.join(ocPath, filename);
      console.log(`📁 Fichier uploadé directement dans: ${finalFilePath}`);

      // Vérifier si le fichier existe déjà dans le dossier de destination
      if (!fs.existsSync(finalFilePath)) {
        // Le fichier n'est pas encore dans le bon dossier, le déplacer
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.copyFileSync(req.file.path, finalFilePath);
          fs.unlinkSync(req.file.path); // Supprimer le fichier temporaire
          console.log(`📁 Fichier déplacé vers: ${finalFilePath}`);
        } else {
          throw new Error("Fichier temporaire introuvable");
        }
      }

      // Générer l'URL publique du fichier
      const fileUrl = `/uploads/OC/${filename}`;

      // Déterminer le type de contenu basé sur le MIME type et l'extension
      const detectedMimeType = getMimeType(filename);
      const contentType = getContentTypeFromMime(detectedMimeType, filename);

      console.log("🔍 Type de contenu détecté:", {
        filename,
        detectedMimeType,
        contentType,
        originalMimeType: mimetype,
      });

      console.log("📎 Fichier d'opportunité uploadé avec succès:", {
        filename,
        filePath: finalFilePath,
        mimetype,
        size,
        fileUrl,
        ocPath,
      });

      res.json({
        success: true,
        data: {
          fileUrl,
          fileId: filename,
          filename,
          size,
          mimetype: detectedMimeType,
          contentType: contentType,
          ocPath,
        },
        message: "Fichier d'opportunité uploadé avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur uploadPresentationFile:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur lors de l'upload",
      });
    }
  },

  // Supprimer un fichier PDF
  async deletePresentationFile(req, res) {
    try {
      const { fileName } = req.params;

      console.log("🗑️ Suppression du fichier PDF:", fileName);

      const filePath = path.join(process.cwd(), "uploads", "OC", fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "Fichier non trouvé",
        });
      }

      // Supprimer le fichier
      fs.unlinkSync(filePath);
      console.log("✅ Fichier PDF supprimé:", filePath);

      // TODO: Supprimer de la base de données si nécessaire
      // await prisma.opportunityFile.delete({
      //   where: { fileName: fileName }
      // });

      res.json({
        success: true,
        message: "Fichier PDF supprimé avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du fichier PDF:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression du fichier PDF",
        error: error.message,
      });
    }
  },

  // Servir un fichier d'opportunité
  async servePresentationFile(req, res) {
    try {
      const { fileName } = req.params;

      const filePath = path.join(process.cwd(), "uploads", "OC", fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "Fichier non trouvé",
        });
      }

      // L'authentification est gérée par le middleware authMiddleware

      // Ajouter les en-têtes CORS pour permettre l'accès cross-origin
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.header("Access-Control-Allow-Headers", "*");
      res.header("Cross-Origin-Resource-Policy", "cross-origin");
      res.header("Cross-Origin-Embedder-Policy", "unsafe-none");
      res.header("Cross-Origin-Opener-Policy", "unsafe-none");

      // Déterminer le type MIME du fichier
      const detectedMimeType = getMimeType(fileName);

      // Définir le type de contenu
      res.setHeader("Content-Type", detectedMimeType);
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

      // Servir le fichier
      res.sendFile(filePath);
    } catch (error) {
      console.error("❌ Erreur lors du service du fichier:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors du service du fichier",
        error: error.message,
      });
    }
  },
};
