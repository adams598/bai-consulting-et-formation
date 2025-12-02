import ftp from "basic-ftp";
import path from "path";

class HostingerUploadService {
  constructor() {
    // Nettoyer le host : retirer ftp:// ou ftps:// si présent
    const rawHost = process.env.HOSTINGER_FTP_HOST || "";
    this.host = rawHost.replace(/^ftps?:\/\//i, "").trim();
    this.user = process.env.HOSTINGER_FTP_USER;
    this.password = process.env.HOSTINGER_FTP_PASSWORD;
    this.secure = process.env.HOSTINGER_FTP_SECURE === "true";
    this.port = process.env.HOSTINGER_FTP_PORT
      ? parseInt(process.env.HOSTINGER_FTP_PORT, 10)
      : 21; // Port FTP par défaut
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
    } else {
      // Afficher la configuration (sans le mot de passe)
      console.log("✅ HostingerUploadService activé");
      console.log(`   Host: ${this.host}`);
      console.log(`   Port: ${this.port}`);
      console.log(`   User: ${this.user}`);
      console.log(`   Secure: ${this.secure}`);
      console.log(`   Base Dir: ${this.baseDir}`);
      if (rawHost !== this.host) {
        console.log(`   ℹ️  Host nettoyé de "${rawHost}" vers "${this.host}"`);
      }
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
      console.warn(
        "⚠️ HostingerUploadService.ensureDirectory appelé mais le service est désactivé"
      );
      console.warn(
        "   Variables requises: HOSTINGER_FTP_HOST, HOSTINGER_FTP_USER, HOSTINGER_FTP_PASSWORD"
      );
      return false;
    }

    // Timeout de 30 secondes pour la connexion FTP
    const client = new ftp.Client(30000);
    // Activer le mode verbose pour le débogage (même en production pour diagnostiquer les problèmes)
    client.ftp.verbose = true;

    const normalizedRelativePath = relativePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, ""); // Retirer le slash final

    const remotePath = path.posix.join(this.baseDir, normalizedRelativePath);

    console.log("🔌 Connexion FTP à Hostinger...");
    console.log(`   Host: ${this.host}`);
    console.log(`   Port: ${this.port}`);
    console.log(`   User: ${this.user}`);
    console.log(`   Secure: ${this.secure}`);
    console.log(`   Base Dir: ${this.baseDir}`);
    console.log(`   Remote Path: ${remotePath}`);
    console.log(`   Relative Path: ${normalizedRelativePath}`);

    try {
      await client.access({
        host: this.host,
        port: this.port,
        user: this.user,
        password: this.password,
        secure: this.secure,
      });

      console.log("✅ Connexion FTP réussie");

      // Vérifier le répertoire de travail actuel
      const initialPwd = await client.pwd();
      console.log(`📂 Répertoire de travail initial: ${initialPwd}`);

      // Essayer deux approches pour créer le dossier
      let dirCreated = false;

      // Approche 1 : Chemin absolu depuis la racine
      console.log(`📁 Approche 1 - Chemin absolu: ${remotePath}`);
      try {
        await client.ensureDir(remotePath);
        console.log(`✅ ensureDir réussi avec chemin absolu: ${remotePath}`);
        dirCreated = true;
      } catch (absError) {
        console.warn(`⚠️ Approche 1 échouée: ${absError.message}`);

        // Approche 2 : Se placer dans baseDir puis créer le chemin relatif
        console.log(`📁 Approche 2 - Chemin relatif depuis ${this.baseDir}`);
        try {
          // Se placer dans le répertoire de base
          await client.cd(this.baseDir);
          const basePwd = await client.pwd();
          console.log(`✅ Changé vers: ${basePwd}`);

          // Créer le chemin relatif depuis baseDir
          await client.ensureDir(normalizedRelativePath);
          console.log(
            `✅ ensureDir réussi avec chemin relatif: ${normalizedRelativePath}`
          );
          dirCreated = true;
        } catch (relError) {
          console.error(`❌ Approche 2 échouée: ${relError.message}`);
          throw relError; // Propager l'erreur
        }
      }

      if (!dirCreated) {
        throw new Error("Aucune approche n'a réussi à créer le dossier");
      }

      // Vérifier où on se trouve maintenant
      const afterPwd = await client.pwd();
      console.log(`📂 Répertoire après ensureDir: ${afterPwd}`);

      // Vérifier que le dossier existe vraiment
      // Le dossier devrait être dans: public_html/uploads/formations/dfg_formation
      const expectedParentPath = path.posix.join(
        this.baseDir,
        path.posix.dirname(normalizedRelativePath)
      );
      const folderName = path.posix.basename(normalizedRelativePath);

      try {
        // Retourner à la racine puis naviguer vers le répertoire parent attendu
        await client.cd("/");
        console.log(`🔍 Vérification: navigation vers ${expectedParentPath}`);

        try {
          await client.cd(expectedParentPath);
          const listing = await client.list();
          console.log(
            `📋 Contenu de ${expectedParentPath}:`,
            listing
              .map(
                (item) => `${item.name}${item.isDirectory ? " (dossier)" : ""}`
              )
              .join(", ")
          );

          const folderExists = listing.some(
            (item) => item.name === folderName && item.isDirectory
          );

          if (folderExists) {
            console.log("✅ Dossier créé et vérifié sur Hostinger:", {
              relativePath: normalizedRelativePath,
              remotePath,
              fullPath: `${this.baseDir}/${normalizedRelativePath}`,
              verified: true,
              location: `${expectedParentPath}/${folderName}`,
            });
            return true;
          } else {
            console.error("❌ Le dossier n'a pas été trouvé après création");
            console.error("   Dossier attendu:", folderName);
            console.error("   Répertoire parent:", expectedParentPath);
            console.error(
              "   Contenu trouvé:",
              listing.map((item) => item.name).join(", ")
            );

            // Essayer aussi de vérifier directement avec le chemin complet
            console.log(`🔍 Tentative de vérification directe: ${remotePath}`);
            try {
              await client.cd(remotePath);
              console.log("✅ Le dossier existe bien (accessible directement)");
              return true;
            } catch (directError) {
              console.error(
                "❌ Le dossier n'est pas accessible directement:",
                directError.message
              );
              return false;
            }
          }
        } catch (cdError) {
          console.error(
            `❌ Impossible de naviguer vers ${expectedParentPath}:`,
            cdError.message
          );
          // Essayer de vérifier directement avec le chemin complet
          try {
            await client.cd("/");
            await client.cd(remotePath);
            console.log("✅ Le dossier existe bien (accessible directement)");
            return true;
          } catch (directError) {
            console.error(
              "❌ Le dossier n'est pas accessible directement:",
              directError.message
            );
            return false;
          }
        }
      } catch (verifyError) {
        console.error(
          "❌ Erreur lors de la vérification du dossier:",
          verifyError.message
        );
        // On retourne true quand même car ensureDir n'a pas levé d'erreur
        console.log(
          "⚠️ Dossier probablement créé mais vérification impossible:",
          {
            relativePath: normalizedRelativePath,
            remotePath,
            fullPath: `${this.baseDir}/${normalizedRelativePath}`,
          }
        );
        return true;
      }
    } catch (error) {
      console.error("❌ Échec de la création du dossier sur Hostinger");
      console.error("   Chemin:", remotePath);
      console.error("   Erreur:", error.message);
      if (error.code) {
        console.error("   Code d'erreur:", error.code);
      }
      if (error.name) {
        console.error("   Type d'erreur:", error.name);
      }
      // Toujours afficher la stack en production pour diagnostiquer les problèmes FTP
      if (error.stack) {
        console.error("   Stack:", error.stack);
      }
      // Messages d'aide selon le type d'erreur
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("timeout")
      ) {
        console.error("   💡 Vérifiez que:");
        console.error("      - Le serveur FTP est accessible");
        console.error("      - Le port FTP est correct (par défaut: 21)");
        console.error("      - Le firewall autorise la connexion");
      } else if (
        error.message.includes("530") ||
        error.message.includes("Login")
      ) {
        console.error("   💡 Vérifiez que:");
        console.error("      - Le nom d'utilisateur FTP est correct");
        console.error("      - Le mot de passe FTP est correct");
        console.error("      - Le compte FTP est actif");
      } else if (
        error.message.includes("550") ||
        error.message.includes("Permission")
      ) {
        console.error("   💡 Vérifiez que:");
        console.error("      - Le compte FTP a les permissions d'écriture");
        console.error("      - Le chemin de base (baseDir) est correct");
      }
      return false;
    } finally {
      try {
        client.close();
        console.log("🔌 Connexion FTP fermée");
      } catch (closeError) {
        // Ignorer les erreurs de fermeture
      }
    }
  }

  async upload(localPath, relativePath) {
    if (!this.enabled) {
      return null;
    }

    // Timeout de 30 secondes pour la connexion FTP
    const client = new ftp.Client(30000);
    // Activer le mode verbose pour le débogage (même en production pour diagnostiquer les problèmes)
    client.ftp.verbose = true;

    const normalizedRelativePath = relativePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    const remotePath = path.posix.join(this.baseDir, normalizedRelativePath);

    try {
      await client.access({
        host: this.host,
        port: this.port,
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
