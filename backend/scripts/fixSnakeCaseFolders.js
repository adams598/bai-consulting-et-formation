import fs from "fs";
import path from "path";

// Fonction pour convertir un nom en snake_case en gardant les underscores
function toSnakeCase(text) {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[ñ]/g, "n")
    .replace(/[^a-z0-9\s_]/g, "") // Supprimer les caractères spéciaux mais garder les underscores
    .replace(/\s+/g, "_") // Remplacer les espaces par des underscores
    .replace(/_+/g, "_") // Remplacer les underscores multiples par un seul
    .replace(/^_|_$/g, ""); // Supprimer les underscores en début et fin
}

// Fonction pour renommer un dossier
function renameFolder(oldPath, newName) {
  try {
    const newPath = path.join(path.dirname(oldPath), newName);

    // Vérifier si le nouveau dossier existe déjà
    if (fs.existsSync(newPath)) {
      console.log(`  ⚠️  Le dossier existe déjà: ${newName}`);
      return false;
    }

    // Renommer le dossier
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`  📁 Renommé: ${path.basename(oldPath)} → ${newName}`);
      return true;
    } else {
      console.log(`  ❌ Dossier non trouvé: ${oldPath}`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Erreur renommage ${oldPath}:`, error.message);
    return false;
  }
}

async function fixSnakeCaseFolders() {
  try {
    console.log(
      "🌱 Correction des dossiers en format snake_case avec underscores..."
    );

    const formationsDir = path.join("uploads", "formations");

    // Vérifier que le dossier existe
    if (!fs.existsSync(formationsDir)) {
      console.error("❌ Le dossier uploads/formations n'existe pas");
      return;
    }

    // Lister tous les dossiers existants
    const items = fs.readdirSync(formationsDir, { withFileTypes: true });
    const folders = items
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    console.log(`📁 ${folders.length} dossiers trouvés`);

    let renamedCount = 0;
    let skippedCount = 0;

    // Renommer chaque dossier
    for (const folderName of folders) {
      console.log(`\n🎯 Dossier: ${folderName}`);

      // Convertir le nom en snake_case
      const snakeCaseName = toSnakeCase(folderName);

      // Vérifier si le nom a changé
      if (snakeCaseName === folderName) {
        console.log(`  ⏭️  Déjà correct: ${snakeCaseName}`);
        skippedCount++;
        continue;
      }

      const oldPath = path.join(formationsDir, folderName);
      const wasRenamed = renameFolder(oldPath, snakeCaseName);

      if (wasRenamed) {
        renamedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log("\n📊 Statistiques finales:");
    console.log(`  📁 Dossiers renommés: ${renamedCount}`);
    console.log(`  ⏭️  Dossiers ignorés: ${skippedCount}`);
    console.log(`  📚 Total dossiers: ${folders.length}`);

    console.log("\n🎉 Correction terminée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de la correction:", error);
  }
}

// Exécuter le script
fixSnakeCaseFolders();












