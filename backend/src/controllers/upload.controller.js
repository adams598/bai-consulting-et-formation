import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

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

      // Générer une URL publique pour la vidéo
      const userFolderName = `${user.firstName}_${user.lastName}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      const videoUrl = `/uploads/videos/${userFolderName}/${filename}`;

      console.log("🎥 Vidéo uploadée avec succès:", {
        filename,
        filePath,
        mimetype,
        size,
        videoUrl,
        user: `${user.firstName} ${user.lastName}`,
        userFolder: userFolderName,
      });

      res.json({
        success: true,
        data: {
          videoUrl,
          videoId: filename,
          filename,
          size,
          mimetype,
          userFolder: userFolderName,
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

      // Le fichier est déjà dans le bon dossier grâce au middleware
      const finalFilePath = path.join(lessonPath, filename);
      console.log(`📁 Fichier uploadé directement dans: ${finalFilePath}`);

      // Générer une URL publique pour le fichier
      const fileUrl = `/uploads/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/${filename}`;

      console.log("📎 Fichier joint de leçon uploadé avec succès:", {
        filename,
        filePath: finalFilePath,
        mimetype,
        size,
        fileUrl,
        formationTitle,
        lessonTitle,
        lessonPath,
      });

      res.json({
        success: true,
        data: {
          fileUrl,
          fileId: filename,
          filename,
          size,
          mimetype,
          lessonPath,
        },
        message: "Fichier joint uploadé avec succès",
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
};
