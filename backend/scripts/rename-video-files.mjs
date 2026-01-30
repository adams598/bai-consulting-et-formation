import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le dossier des formations
const formationsDir = path.join(__dirname, "..", "uploads", "formations");

/**
 * Renomme les fichiers vidéo selon le pattern video-Adams_Dexter-{id}.mp4 en video.mp4
 */
async function renameVideoFiles() {
  try {
    // Vérifier si le dossier existe
    if (!fs.existsSync(formationsDir)) {
      console.log(`❌ Le dossier ${formationsDir} n'existe pas.`);
      return;
    }

    console.log(`🔍 Parcours du dossier: ${formationsDir}\n`);

    // Lire tous les dossiers de formations
    const formationFolders = fs.readdirSync(formationsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (formationFolders.length === 0) {
      console.log("ℹ️  Aucun dossier de formation trouvé.");
      return;
    }

    console.log(`📁 ${formationFolders.length} formation(s) trouvée(s)\n`);

    let totalRenamed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Parcourir chaque dossier de formation
    for (const formationFolder of formationFolders) {
      const formationPath = path.join(formationsDir, formationFolder);
      const lessonsPath = path.join(formationPath, "lessons");

      console.log(`\n📂 Formation: ${formationFolder}`);

      // Vérifier si le dossier lessons existe
      if (!fs.existsSync(lessonsPath)) {
        console.log(`   ⚠️  Dossier lessons non trouvé, passage au suivant...`);
        continue;
      }

      // Lire tous les dossiers de leçons
      const lessonFolders = fs.readdirSync(lessonsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      if (lessonFolders.length === 0) {
        console.log(`   ℹ️  Aucune leçon trouvée`);
        continue;
      }

      console.log(`   📚 ${lessonFolders.length} leçon(s) trouvée(s)`);

      // Parcourir chaque dossier de leçon
      for (const lessonFolder of lessonFolders) {
        const lessonPath = path.join(lessonsPath, lessonFolder);
        
        // Chercher les fichiers qui matchent le pattern video-Adams_Dexter-*.mp4
        const files = fs.readdirSync(lessonPath);
        const videoFiles = files.filter(file => 
          file.startsWith("video-Adams_Dexter-") && file.endsWith(".mp4")
        );

        if (videoFiles.length === 0) {
          continue; // Pas de fichier à renommer dans cette leçon
        }

        console.log(`   🎥 Leçon: ${lessonFolder}`);

        for (const videoFile of videoFiles) {
          const oldPath = path.join(lessonPath, videoFile);
          const newPath = path.join(lessonPath, "video.mp4");

          try {
            // Vérifier si video.mp4 existe déjà
            if (fs.existsSync(newPath)) {
              console.log(`      ⚠️  video.mp4 existe déjà, suppression de l'ancien fichier: ${videoFile}`);
              fs.unlinkSync(oldPath);
              totalSkipped++;
            } else {
              // Renommer le fichier
              fs.renameSync(oldPath, newPath);
              console.log(`      ✅ Renommé: ${videoFile} → video.mp4`);
              totalRenamed++;
            }
          } catch (error) {
            console.error(`      ❌ Erreur lors du renommage de ${videoFile}:`, error.message);
            totalErrors++;
          }
        }
      }
    }

    // Résumé
    console.log(`\n\n📊 Résumé:`);
    console.log(`   ✅ Fichiers renommés: ${totalRenamed}`);
    console.log(`   ⚠️  Fichiers ignorés (video.mp4 existe déjà): ${totalSkipped}`);
    console.log(`   ❌ Erreurs: ${totalErrors}`);
    console.log(`\n✨ Terminé !`);

  } catch (error) {
    console.error("❌ Erreur lors du renommage des fichiers:", error);
    process.exit(1);
  }
}

// Exécuter le script
renameVideoFiles();
