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

      // Lister le contenu de la racine pour voir ce qui existe
      try {
        const rootListing = await client.list();
        console.log(
          `📋 Contenu de la racine FTP:`,
          rootListing.map((item) => item.name).join(", ")
        );
      } catch (listError) {
        console.warn(`⚠️ Impossible de lister la racine:`, listError.message);
      }

      // TOUJOURS aller à la racine absolue d'abord pour éviter les chemins dupliqués
      try {
        await client.cd("/");
        const rootPwd = await client.pwd();
        console.log(`📂 Racine FTP: ${rootPwd}`);
      } catch (rootError) {
        console.warn(`⚠️ Impossible d'aller à la racine: ${rootError.message}`);
      }

      // Maintenant naviguer vers public_html depuis la racine
      try {
        await client.cd(this.baseDir);
        const basePwd = await client.pwd();
        console.log(`✅ Changé vers le répertoire de base: ${basePwd}`);

        // Vérifier qu'on n'a pas de duplication dans le chemin
        if (basePwd.includes(`/${this.baseDir}/${this.baseDir}`)) {
          console.error(`❌ Chemin dupliqué détecté: ${basePwd}`);
          throw new Error(
            `Chemin dupliqué détecté. Le répertoire de base semble incorrect.`
          );
        }
      } catch (cdError) {
        console.error(
          `❌ Impossible de se placer dans ${this.baseDir}:`,
          cdError.message
        );
        console.error(
          `💡 Vérifiez que le répertoire ${this.baseDir} existe sur le serveur FTP`
        );
        throw new Error(
          `Impossible d'accéder au répertoire de base ${this.baseDir}: ${cdError.message}`
        );
      }

      // Lister le contenu de public_html pour voir ce qui existe
      try {
        const baseListing = await client.list();
        console.log(
          `📋 Contenu de ${this.baseDir}:`,
          baseListing
            .map(
              (item) => `${item.name}${item.isDirectory ? " (dossier)" : ""}`
            )
            .join(", ")
        );
      } catch (listError) {
        console.warn(
          `⚠️ Impossible de lister ${this.baseDir}:`,
          listError.message
        );
      }

      // Créer le chemin segment par segment pour être sûr
      const pathSegments = normalizedRelativePath.split("/");
      const folderName = pathSegments[pathSegments.length - 1]; // Le dernier segment est le nom du dossier de formation

      console.log(
        `📁 Création du chemin segment par segment: ${normalizedRelativePath}`
      );
      console.log(`   Segments: ${pathSegments.join(" -> ")}`);
      console.log(`   Dossier de formation à créer: "${folderName}"`);

      // Naviguer dans les dossiers parents (uploads, formations) s'ils existent
      for (let i = 0; i < pathSegments.length - 1; i++) {
        const segment = pathSegments[i];
        if (!segment) continue; // Ignorer les segments vides

        try {
          // Lister le contenu actuel pour voir si le dossier existe
          const currentListing = await client.list();
          const segmentExists = currentListing.some(
            (item) => item.name === segment && item.isDirectory
          );

          if (segmentExists) {
            console.log(`   ✅ Le dossier "${segment}" existe déjà`);
            await client.cd(segment);
            const currentPwd = await client.pwd();
            console.log(`      On est maintenant dans: ${currentPwd}`);
          } else {
            // Le dossier n'existe pas, le créer
            console.log(`   🔨 Création du dossier: ${segment}`);
            await client.ensureDir(segment);
            await client.cd(segment);
            const newPwd = await client.pwd();
            console.log(
              `      ✅ Dossier "${segment}" créé, on est dans: ${newPwd}`
            );
          }
        } catch (segmentError) {
          console.error(
            `   ❌ Erreur lors du traitement du segment "${segment}":`,
            segmentError.message
          );
          throw new Error(
            `Impossible de traiter le segment "${segment}" du chemin: ${segmentError.message}`
          );
        }
      }

      // Maintenant créer le dossier de formation (dernier segment)
      try {
        const finalListing = await client.list();
        const folderExists = finalListing.some(
          (item) => item.name === folderName && item.isDirectory
        );

        if (folderExists) {
          console.log(
            `   ✅ Le dossier de formation "${folderName}" existe déjà`
          );
          await client.cd(folderName);
          const finalPwd = await client.pwd();
          console.log(`      On est maintenant dans: ${finalPwd}`);
        } else {
          console.log(`   🔨 Création du dossier de formation: ${folderName}`);

          // Vérifier où on est avant de créer
          const beforeCreatePwd = await client.pwd();
          console.log(`      📂 Répertoire avant création: ${beforeCreatePwd}`);

          // ensureDir crée le dossier - vérifier où on est après
          await client.ensureDir(folderName);

          // Vérifier où on est après ensureDir (il peut avoir changé de répertoire)
          const afterEnsureDirPwd = await client.pwd();
          console.log(
            `      📂 Répertoire après ensureDir: ${afterEnsureDirPwd}`
          );

          // Attendre un peu pour que le serveur FTP enregistre le changement
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Si on est déjà dans le dossier créé, c'est bon (ensureDir a peut-être changé de répertoire)
          const isInFolder =
            afterEnsureDirPwd.endsWith(`/${folderName}`) ||
            afterEnsureDirPwd.endsWith(`\\${folderName}`) ||
            afterEnsureDirPwd === folderName ||
            path.posix.basename(afterEnsureDirPwd) === folderName;

          if (isInFolder) {
            console.log(
              `      ✅ On est déjà dans le dossier "${folderName}" après ensureDir`
            );
            console.log(`      📂 Répertoire final: ${afterEnsureDirPwd}`);
          } else {
            // On est encore dans le parent, vérifier que le dossier existe dans le listing
            const checkListing = await client.list();
            console.log(
              `      📋 Contenu du répertoire parent:`,
              checkListing.map((item) => item.name).join(", ")
            );

            const exists = checkListing.some(
              (item) => item.name === folderName && item.isDirectory
            );

            if (!exists) {
              // Le dossier n'apparaît pas dans le listing, mais peut-être qu'il existe quand même
              console.warn(
                `      ⚠️ Dossier "${folderName}" non trouvé dans le listing, tentative d'accès direct...`
              );
              try {
                await client.cd(folderName);
                const testPwd = await client.pwd();
                console.log(
                  `      ✅ Le dossier existe et est accessible: ${testPwd}`
                );
              } catch (cdError) {
                throw new Error(
                  `Le dossier "${folderName}" n'a pas été créé ou n'est pas accessible: ${cdError.message}`
                );
              }
            } else {
              console.log(
                `      ✅ Dossier "${folderName}" vérifié dans le listing`
              );
              // Maintenant se placer dans le dossier créé
              await client.cd(folderName);
              const afterCdPwd = await client.pwd();
              console.log(
                `      ✅ Dossier "${folderName}" créé et accessible`
              );
              console.log(`      📂 On est maintenant dans: ${afterCdPwd}`);
            }
          }

          // Vérifier le répertoire final
          const finalPwd = await client.pwd();
          console.log(`      📂 Répertoire final: ${finalPwd}`);

          // Vérifier qu'on n'a pas de duplication
          if (finalPwd.includes(`/${this.baseDir}/${this.baseDir}`)) {
            console.error(`      ❌ Chemin dupliqué détecté: ${finalPwd}`);
            throw new Error(`Chemin dupliqué détecté dans le répertoire final`);
          }

          // VÉRIFICATION FINALE : Remonter d'un niveau et lister pour confirmer que le dossier existe
          console.log(
            `      🔍 Vérification finale : remontée au répertoire parent...`
          );
          await client.cd("..");
          const parentPwd = await client.pwd();
          console.log(`      📂 Répertoire parent: ${parentPwd}`);

          const finalListing = await client.list();
          console.log(
            `      📋 Contenu du répertoire parent:`,
            finalListing
              .map(
                (item) => `${item.name}${item.isDirectory ? " (dossier)" : ""}`
              )
              .join(", ")
          );

          const folderExistsInParent = finalListing.some(
            (item) => item.name === folderName && item.isDirectory
          );

          if (!folderExistsInParent) {
            console.error(
              `      ❌ Le dossier "${folderName}" n'existe PAS dans le répertoire parent !`
            );
            console.error(
              `      📂 Chemin attendu: ${parentPwd}/${folderName}`
            );
            throw new Error(
              `Le dossier "${folderName}" n'a pas été créé correctement dans ${parentPwd}`
            );
          }

          console.log(
            `      ✅ VÉRIFICATION FINALE RÉUSSIE : Le dossier "${folderName}" existe bien dans ${parentPwd}`
          );

          // Afficher le chemin complet où le dossier a été créé
          const fullPath = `${parentPwd}/${folderName}`;
          console.log(`      📍 CHEMIN COMPLET DU DOSSIER CRÉÉ: ${fullPath}`);
          console.log(
            `      📍 Chemin relatif depuis ${this.baseDir}: ${normalizedRelativePath}`
          );

          // Vérifier que le chemin est correct (pas de duplication)
          const expectedPath = `/${this.baseDir}/${normalizedRelativePath}`;
          if (fullPath !== expectedPath && !fullPath.endsWith(expectedPath)) {
            console.warn(
              `      ⚠️ ATTENTION: Le chemin créé (${fullPath}) ne correspond pas exactement au chemin attendu (${expectedPath})`
            );
          }

          // Revenir dans le dossier pour la suite
          await client.cd(folderName);
        }
      } catch (folderError) {
        console.error(
          `   ❌ Erreur lors de la création du dossier de formation "${folderName}":`,
          folderError.message
        );
        throw new Error(
          `Impossible de créer le dossier de formation "${folderName}": ${folderError.message}`
        );
      }

      // Vérification finale : on devrait être dans le dossier de formation maintenant
      const finalPwd = await client.pwd();
      console.log(`📂 Répertoire final: ${finalPwd}`);

      // Vérifier que le chemin final correspond à ce qu'on attend
      const expectedPath = `${this.baseDir}/${normalizedRelativePath}`;
      const expectedPathNormalized = expectedPath.replace(/\/+/g, "/");

      console.log(`🔍 Vérification finale:`);
      console.log(`   Chemin attendu: ${expectedPathNormalized}`);
      console.log(`   Chemin actuel: ${finalPwd}`);

      // Lister le contenu pour confirmer qu'on est dans le bon dossier
      try {
        const finalListing = await client.list();
        console.log(
          `📋 Contenu du dossier de formation:`,
          finalListing.length > 0
            ? finalListing.map((item) => item.name).join(", ")
            : "(vide - c'est normal pour un nouveau dossier)"
        );
      } catch (listError) {
        console.warn(`⚠️ Impossible de lister le contenu:`, listError.message);
      }

      // Le dossier a été créé avec succès si on est arrivé jusqu'ici
      console.log("✅ Dossier de formation créé et vérifié sur Hostinger:", {
        relativePath: normalizedRelativePath,
        remotePath,
        fullPath: expectedPathNormalized,
        verified: true,
        location: finalPwd,
      });

      return true;
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
