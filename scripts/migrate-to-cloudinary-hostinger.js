#!/usr/bin/env node

/**
 * Script de migration des fichiers vers Cloudinary pour Hostinger
 * Usage: node scripts/migrate-to-cloudinary-hostinger.js
 */

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log("🌐 Migration des fichiers vers Cloudinary pour Hostinger");
console.log("=====================================================");

// Fonction de migration d'un fichier
async function migrateFile(filePath, publicId) {
  try {
    console.log(`📤 Upload de ${filePath} vers ${publicId}`);

    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      resource_type: "auto",
      overwrite: false,
      invalidate: true,
    });

    console.log(`✅ Upload réussi: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Erreur upload ${filePath}:`, error);
    return null;
  }
}

// Fonction de sanitisation des titres
function sanitizeTitle(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

// Fonction de migration des formations
async function migrateFormations() {
  const uploadsDir = path.join(
    process.cwd(),
    "backend",
    "uploads",
    "formations"
  );

  if (!fs.existsSync(uploadsDir)) {
    console.log("❌ Dossier uploads/formations non trouvé");
    return;
  }

  const formations = fs.readdirSync(uploadsDir);

  for (const formationDir of formations) {
    console.log(`\n🔄 Migration de la formation: ${formationDir}`);

    const formationPath = path.join(uploadsDir, formationDir);
    const formationStats = fs.statSync(formationPath);

    if (!formationStats.isDirectory()) continue;

    // Migration de l'image de couverture
    const coverFiles = fs
      .readdirSync(formationPath)
      .filter((file) => file.startsWith("couverture-"));

    for (const coverFile of coverFiles) {
      const coverPath = path.join(formationPath, coverFile);
      const publicId = `formations/${sanitizeTitle(formationDir)}/cover/${
        path.parse(coverFile).name
      }`;

      const cloudinaryUrl = await migrateFile(coverPath, publicId);

      if (cloudinaryUrl) {
        // Mise à jour en base de données
        await prisma.formation.updateMany({
          where: {
            title: {
              contains: formationDir.replace(/_/g, " "),
            },
          },
          data: {
            coverImage: cloudinaryUrl,
          },
        });
      }
    }

    // Migration des leçons
    const lessonsDir = path.join(formationPath, "lessons");
    if (fs.existsSync(lessonsDir)) {
      const lessons = fs.readdirSync(lessonsDir);

      for (const lessonDir of lessons) {
        console.log(`  📚 Migration de la leçon: ${lessonDir}`);

        const lessonPath = path.join(lessonsDir, lessonDir);
        const lessonStats = fs.statSync(lessonPath);

        if (!lessonStats.isDirectory()) continue;

        const files = fs.readdirSync(lessonPath);

        for (const file of files) {
          const filePath = path.join(lessonPath, file);
          const fileStats = fs.statSync(filePath);

          if (fileStats.isFile()) {
            const publicId = `formations/${sanitizeTitle(
              formationDir
            )}/lessons/${sanitizeTitle(lessonDir)}/${path.parse(file).name}`;
            const cloudinaryUrl = await migrateFile(filePath, publicId);

            if (cloudinaryUrl) {
              // Mise à jour en base de données
              await prisma.formationContent.updateMany({
                where: {
                  title: {
                    contains: lessonDir.replace(/_/g, " "),
                  },
                },
                data: {
                  fileUrl: cloudinaryUrl,
                },
              });
            }
          }
        }
      }
    }
  }
}

// Fonction de migration des profils utilisateurs
async function migrateProfiles() {
  const profilesDir = path.join(
    process.cwd(),
    "backend",
    "uploads",
    "profiles"
  );

  if (!fs.existsSync(profilesDir)) {
    console.log("❌ Dossier uploads/profiles non trouvé");
    return;
  }

  const profiles = fs.readdirSync(profilesDir);

  for (const profileFile of profiles) {
    const profilePath = path.join(profilesDir, profileFile);
    const profileStats = fs.statSync(profilePath);

    if (profileStats.isFile()) {
      const publicId = `profiles/${path.parse(profileFile).name}`;
      const cloudinaryUrl = await migrateFile(profilePath, publicId);

      if (cloudinaryUrl) {
        // Mise à jour en base de données
        await prisma.user.updateMany({
          where: {
            avatar: {
              contains: profileFile,
            },
          },
          data: {
            avatar: cloudinaryUrl,
          },
        });
      }
    }
  }
}

// Fonction de migration des vidéos
async function migrateVideos() {
  const videosDir = path.join(process.cwd(), "backend", "uploads", "videos");

  if (!fs.existsSync(videosDir)) {
    console.log("❌ Dossier uploads/videos non trouvé");
    return;
  }

  const videos = fs.readdirSync(videosDir);

  for (const videoFile of videos) {
    const videoPath = path.join(videosDir, videoFile);
    const videoStats = fs.statSync(videoPath);

    if (videoStats.isFile()) {
      const publicId = `videos/${path.parse(videoFile).name}`;
      const cloudinaryUrl = await migrateFile(videoPath, publicId);

      if (cloudinaryUrl) {
        // Mise à jour en base de données
        await prisma.formationContent.updateMany({
          where: {
            fileUrl: {
              contains: videoFile,
            },
          },
          data: {
            fileUrl: cloudinaryUrl,
          },
        });
      }
    }
  }
}

// Exécution de la migration
async function runMigration() {
  try {
    console.log("🚀 Début de la migration vers Cloudinary...");

    // Migration des formations
    await migrateFormations();

    // Migration des profils
    await migrateProfiles();

    // Migration des vidéos
    await migrateVideos();

    console.log("\n🎉 Migration vers Cloudinary terminée avec succès !");
    console.log("==================================================");
    console.log("📊 Résumé de la migration:");
    console.log("- Formations migrées");
    console.log("- Profils utilisateurs migrés");
    console.log("- Vidéos migrées");
    console.log("");
    console.log("🔧 Prochaines étapes:");
    console.log("1. Vérifier les URLs dans la base de données");
    console.log("2. Tester l'accès aux fichiers via Cloudinary");
    console.log("3. Configurer les transformations automatiques");
    console.log("4. Mettre à jour le middleware d'upload");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
runMigration()
  .then(() => {
    console.log("✅ Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });








