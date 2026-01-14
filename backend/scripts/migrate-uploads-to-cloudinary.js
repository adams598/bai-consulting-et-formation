import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const { cloudinaryService } = await import(
  "../src/services/cloudinary.service.js"
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsRoot = path.resolve(__dirname, "..", "uploads");
const videoExtensions = new Set([
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".webm",
]);

async function ensureCloudinaryEnabled() {
  if (!cloudinaryService.isEnabled()) {
    throw new Error(
      "Cloudinary non activé. Vérifiez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
  }
}

function isVideoFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return videoExtensions.has(ext);
}

function sanitizeSegment(segment) {
  return cloudinaryService.sanitizePublicId(segment || "unknown");
}

function buildPublicId(relativePath, isVideo) {
  const parts = relativePath.split(path.sep).map(sanitizeSegment);

  // Attendu: uploads/formations/{formation}/lessons/{lesson}/<file>
  const formationsIdx = parts.indexOf("formations");
  if (
    formationsIdx >= 0 &&
    parts[formationsIdx + 1] &&
    parts[formationsIdx + 2] === "lessons" &&
    parts[formationsIdx + 3]
  ) {
    const formation = parts[formationsIdx + 1];
    const lesson = parts[formationsIdx + 3];
    if (isVideo) {
      return `formations/${formation}/lessons/${lesson}/video`;
    }
  }

  // Par défaut : reprendre le chemin relatif (sans extension) en remplaçant les séparateurs
  const withoutExt = relativePath.replace(path.extname(relativePath), "");
  return withoutExt.split(path.sep).map(sanitizeSegment).join("/");
}

async function uploadFile(absolutePath, relativePath) {
  const isVideo = isVideoFile(absolutePath);
  const publicId = buildPublicId(relativePath, isVideo);

  try {
    if (isVideo) {
      console.log(`📹 Upload vidéo -> ${publicId}`);
      const res = await cloudinaryService.uploadVideo(absolutePath, publicId, {
        overwrite: true,
        invalidate: true,
        resource_type: "video",
      });
      if (!res || !res.secure_url) {
        throw new Error("secure_url manquant dans la réponse Cloudinary");
      }
      console.log(
        `✅ Vidéo uploadée: ${res.secure_url} (public_id: ${res.public_id})`
      );
      return res;
    }

    console.log(`📄 Upload fichier -> ${publicId}`);
    const res = await cloudinary.uploader.upload(absolutePath, {
      public_id: publicId,
      resource_type: "auto",
      overwrite: true,
      invalidate: true,
    });
    if (!res || !res.secure_url) {
      throw new Error("secure_url manquant dans la réponse Cloudinary");
    }
    console.log(
      `✅ Fichier uploadé: ${res.secure_url} (public_id: ${res.public_id})`
    );
    return res;
  } catch (err) {
    console.error(
      `❌ Échec upload ${relativePath} -> ${publicId}: ${err.message}`
    );
    return null;
  }
}

async function walkAndUpload(dir, base, stats) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(base, fullPath);
    if (entry.isDirectory()) {
      await walkAndUpload(fullPath, base, stats);
      continue;
    }
    const res = await uploadFile(fullPath, relPath);
    if (res) {
      stats.success += 1;
    } else {
      stats.failed.push(relPath);
    }
  }
}

async function main() {
  try {
    await ensureCloudinaryEnabled();

    // Vérifier l'existence du dossier uploads
    const stat = await fs.stat(uploadsRoot);
    if (!stat.isDirectory()) {
      throw new Error(`uploads n'est pas un dossier: ${uploadsRoot}`);
    }

    console.log("🚀 Début de l'upload du dossier uploads vers Cloudinary");
    console.log(`   Racine: ${uploadsRoot}`);
    const stats = { success: 0, failed: [] };
    await walkAndUpload(uploadsRoot, uploadsRoot, stats);
    console.log("🎉 Upload terminé");
    console.log(`   ✅ Succès: ${stats.success}`);
    if (stats.failed.length) {
      console.log(`   ❌ Échecs: ${stats.failed.length}`);
      stats.failed.forEach((f) => console.log(`     - ${f}`));
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("❌ Échec de la migration vers Cloudinary:", err.message);
    process.exit(1);
  }
}

main();
