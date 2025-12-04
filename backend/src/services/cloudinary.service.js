import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

class CloudinaryService {
  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    this.apiKey = process.env.CLOUDINARY_API_KEY;
    this.apiSecret = process.env.CLOUDINARY_API_SECRET;
    this.enabled = Boolean(this.cloudName && this.apiKey && this.apiSecret);

    if (this.enabled) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        secure: true,
      });
      console.log("✅ CloudinaryService activé");
      console.log(`   Cloud Name: ${this.cloudName}`);
    } else {
      console.warn(
        "⚠️ CloudinaryService désactivé : variables manquantes (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
      );
    }
  }

  isEnabled() {
    return this.enabled;
  }

  getCloudName() {
    return this.cloudName;
  }

  /**
   * Sanitize un titre pour créer un public_id valide
   */
  sanitizePublicId(title) {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Retirer les accents
      .replace(/[^a-zA-Z0-9_-]/g, "_") // Remplacer les caractères spéciaux
      .replace(/_+/g, "_") // Remplacer les underscores multiples
      .replace(/^_|_$/g, ""); // Retirer les underscores en début/fin
  }

  /**
   * Upload une vidéo vers Cloudinary
   * @param {string} localPath - Chemin local du fichier vidéo
   * @param {string} publicId - Public ID pour Cloudinary (ex: "formations/nom_formation/video")
   * @param {object} options - Options supplémentaires (formationTitle, lessonTitle, etc.)
   * @returns {Promise<object|null>} - Objet avec secure_url et public_id, ou null en cas d'erreur
   */
  async uploadVideo(localPath, publicId, options = {}) {
    if (!this.enabled) {
      console.warn(
        "⚠️ CloudinaryService.uploadVideo appelé mais le service est désactivé"
      );
      return null;
    }

    if (!fs.existsSync(localPath)) {
      console.error(`❌ Fichier non trouvé: ${localPath}`);
      return null;
    }

    try {
      console.log(`📤 Upload vidéo vers Cloudinary: ${publicId}`);
      console.log(`   Fichier local: ${localPath}`);

      const uploadOptions = {
        resource_type: "video",
        public_id: publicId, // Structure: formations/{formation}/lessons/{lesson}/video
        overwrite: true,
        invalidate: true,
        // Cloudinary créera automatiquement la structure de dossiers basée sur le public_id
        // Le fichier sera accessible via l'URL avec l'extension .mp4
        format: "mp4", // Forcer le format MP4
        // Optimisations vidéo
        eager: [
          {
            format: "mp4",
            video_codec: "h264",
            audio_codec: "aac",
          },
        ],
        // Transformation pour streaming
        transformation: [
          {
            quality: "auto",
            fetch_format: "mp4", // Forcer MP4 dans l'URL générée
          },
        ],
      };

      // Ajouter des tags si fournis
      if (options.tags && Array.isArray(options.tags)) {
        uploadOptions.tags = options.tags;
      }

      // Ajouter un contexte si fourni
      if (options.context) {
        uploadOptions.context = options.context;
      }

      const result = await cloudinary.uploader.upload(localPath, uploadOptions);

      console.log(`✅ Vidéo uploadée avec succès sur Cloudinary`);
      console.log(`   Public ID: ${result.public_id}`);
      console.log(`   URL: ${result.secure_url}`);
      console.log(`   Taille: ${(result.bytes / 1024 / 1024).toFixed(2)} MB`);

      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        duration: result.duration,
        bytes: result.bytes,
        format: result.format,
        resource_type: result.resource_type,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'upload vidéo sur Cloudinary:",
        error.message
      );
      if (error.http_code) {
        console.error(`   Code HTTP: ${error.http_code}`);
      }
      return null;
    }
  }

  /**
   * Upload une image vers Cloudinary
   * @param {string} localPath - Chemin local du fichier image
   * @param {string} publicId - Public ID pour Cloudinary
   * @param {object} options - Options supplémentaires
   * @returns {Promise<object|null>} - Objet avec secure_url et public_id, ou null en cas d'erreur
   */
  async uploadImage(localPath, publicId, options = {}) {
    if (!this.enabled) {
      console.warn(
        "⚠️ CloudinaryService.uploadImage appelé mais le service est désactivé"
      );
      return null;
    }

    if (!fs.existsSync(localPath)) {
      console.error(`❌ Fichier non trouvé: ${localPath}`);
      return null;
    }

    try {
      console.log(`📤 Upload image vers Cloudinary: ${publicId}`);

      const uploadOptions = {
        resource_type: "image",
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        // Optimisations image
        transformation: [
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      };

      if (options.tags) {
        uploadOptions.tags = options.tags;
      }

      if (options.context) {
        uploadOptions.context = options.context;
      }

      const result = await cloudinary.uploader.upload(localPath, uploadOptions);

      console.log(`✅ Image uploadée avec succès sur Cloudinary`);
      console.log(`   Public ID: ${result.public_id}`);
      console.log(`   URL: ${result.secure_url}`);

      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
        resource_type: result.resource_type,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'upload image sur Cloudinary:",
        error.message
      );
      return null;
    }
  }

  /**
   * Supprimer une ressource de Cloudinary
   * @param {string} publicId - Public ID de la ressource à supprimer
   * @param {string} resourceType - Type de ressource ('image', 'video', 'raw')
   * @returns {Promise<boolean>} - true si supprimé avec succès
   */
  async deleteResource(publicId, resourceType = "auto") {
    if (!this.enabled) {
      return false;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (result.result === "ok") {
        console.log(`✅ Ressource supprimée de Cloudinary: ${publicId}`);
        return true;
      } else {
        console.warn(`⚠️ Ressource non trouvée sur Cloudinary: ${publicId}`);
        return false;
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de la suppression de Cloudinary:`,
        error.message
      );
      return false;
    }
  }

  /**
   * Générer une URL optimisée pour une vidéo
   * @param {string} publicId - Public ID de la vidéo
   * @param {object} options - Options de transformation
   * @returns {string} - URL optimisée
   */
  getVideoUrl(publicId, options = {}) {
    if (!this.enabled) {
      return null;
    }

    const defaultOptions = {
      resource_type: "video",
      quality: "auto",
      fetch_format: "auto",
    };

    const transformation = { ...defaultOptions, ...options };
    return cloudinary.url(publicId, transformation);
  }

  /**
   * Générer une URL optimisée pour une image
   * @param {string} publicId - Public ID de l'image
   * @param {object} options - Options de transformation
   * @returns {string} - URL optimisée
   */
  getImageUrl(publicId, options = {}) {
    if (!this.enabled) {
      return null;
    }

    const defaultOptions = {
      resource_type: "image",
      quality: "auto",
      fetch_format: "auto",
    };

    const transformation = { ...defaultOptions, ...options };
    return cloudinary.url(publicId, transformation);
  }
}

export const cloudinaryService = new CloudinaryService();
