import ftp from "basic-ftp";
import path from "path";

class HostingerUploadService {
  constructor() {
    this.host = process.env.HOSTINGER_FTP_HOST;
    this.user = process.env.HOSTINGER_FTP_USER;
    this.password = process.env.HOSTINGER_FTP_PASSWORD;
    this.secure = process.env.HOSTINGER_FTP_SECURE === "true";
    this.baseDir = process.env.HOSTINGER_FTP_BASE_DIR || "public_html";
    // URL de base pour les fichiers uploadés (par défaut: domaine Hostinger)
    this.baseUrl = (
      process.env.HOSTINGER_UPLOAD_BASE_URL ||
      "https://olivedrab-hornet-656554.hostingersite.com"
    ).replace(/\/+$/, "");
    this.enabled = Boolean(this.host && this.user && this.password);

    if (!this.enabled) {
      console.warn(
        "⚠️ HostingerUploadService désactivé : variables FTP manquantes (HOSTINGER_FTP_HOST, HOSTINGER_FTP_USER, HOSTINGER_FTP_PASSWORD)."
      );
    }
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * Crée un dossier sur Hostinger (récursivement si nécessaire)
   * @param {string} relativePath - Chemin relatif du dossier (ex: "uploads/formations/titre_formation")
   * @returns {Promise<boolean>} - true si le dossier a été créé avec succès
   */
  async ensureDirectory(relativePath) {
    if (!this.enabled) {
      return false;
    }

    const client = new ftp.Client(10000);
    client.ftp.verbose = process.env.NODE_ENV !== "production";

    const normalizedRelativePath = relativePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, ""); // Retirer le slash final

    const remotePath = path.posix.join(this.baseDir, normalizedRelativePath);

    try {
      await client.access({
        host: this.host,
        user: this.user,
        password: this.password,
        secure: this.secure,
      });

      await client.ensureDir(remotePath);

      console.log("✅ Dossier créé sur Hostinger:", {
        relativePath: normalizedRelativePath,
        remotePath,
      });

      return true;
    } catch (error) {
      console.error(
        "❌ Échec de la création du dossier sur Hostinger:",
        error.message
      );
      return false;
    } finally {
      client.close();
    }
  }

  async upload(localPath, relativePath) {
    if (!this.enabled) {
      return null;
    }

    const client = new ftp.Client(10000);
    client.ftp.verbose = process.env.NODE_ENV !== "production";

    const normalizedRelativePath = relativePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    const remotePath = path.posix.join(this.baseDir, normalizedRelativePath);

    try {
      await client.access({
        host: this.host,
        user: this.user,
        password: this.password,
        secure: this.secure,
      });

      // S'assurer que le dossier parent existe
      const remoteDir = path.posix.dirname(remotePath);
      await client.ensureDir(remoteDir);

      // Uploader le fichier
      await client.uploadFrom(localPath, remotePath);

      const publicUrl = this.baseUrl
        ? `${this.baseUrl}/${normalizedRelativePath}`
        : null;

      console.log("✅ Fichier uploadé sur Hostinger:", {
        localPath,
        remotePath,
        publicUrl,
      });

      return publicUrl;
    } catch (error) {
      console.error("❌ Échec de l'upload sur Hostinger:", error.message);
      return null;
    } finally {
      client.close();
    }
  }
}

export const hostingerUploadService = new HostingerUploadService();
