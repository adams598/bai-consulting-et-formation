import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Fonction pour renommer le dossier d'une formation
function renameFormationFolder(formationId, formationTitle, oldFolderPath) {
  try {
    // Nettoyer le titre pour créer un nom de dossier valide
    const cleanTitle = formationTitle
      .replace(/[<>:"/\\|?*]/g, "") // Supprimer les caractères interdits pour les noms de dossiers
      .replace(/\s+/g, " ") // Normaliser les espaces
      .trim();

    const newFolderName = `${formationId}-${cleanTitle}`;
    const newFolderPath = path.join("uploads", "formations", newFolderName);

    // Vérifier si le nouveau dossier existe déjà
    if (fs.existsSync(newFolderPath)) {
      console.log(`  ⚠️  Le dossier existe déjà: ${newFolderPath}`);
      return false;
    }

    // Renommer le dossier
    if (fs.existsSync(oldFolderPath)) {
      fs.renameSync(oldFolderPath, newFolderPath);
      console.log(
        `  📁 Renommé: ${path.basename(oldFolderPath)} → ${newFolderName}`
      );
      return true;
    } else {
      console.log(`  ❌ Ancien dossier non trouvé: ${oldFolderPath}`);
      return false;
    }
  } catch (error) {
    console.error(
      `  ❌ Erreur renommage dossier pour ${formationTitle}:`,
      error.message
    );
    return false;
  }
}

async function renameFormationFolders() {
  try {
    console.log(
      "🌱 Renommage des dossiers avec les noms exacts des formations..."
    );

    // Récupérer toutes les formations existantes
    const formations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        universe: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`📚 ${formations.length} formations trouvées`);

    // Lister tous les dossiers existants
    const formationsDir = path.join("uploads", "formations");
    const existingFolders = fs
      .readdirSync(formationsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    console.log(`📁 ${existingFolders.length} dossiers existants trouvés`);

    let renamedCount = 0;
    let notFoundCount = 0;

    // Renommer les dossiers pour chaque formation
    for (const formation of formations) {
      const universeName = formation.universe?.name || "FSU";
      console.log(`\n🎯 Formation: ${formation.title} (${universeName})`);

      // Chercher le dossier existant qui commence par l'ID de la formation
      const oldFolder = existingFolders.find((folder) =>
        folder.startsWith(formation.id)
      );

      if (oldFolder) {
        const oldFolderPath = path.join(formationsDir, oldFolder);
        const wasRenamed = renameFormationFolder(
          formation.id,
          formation.title,
          oldFolderPath
        );
        if (wasRenamed) {
          renamedCount++;
        }
      } else {
        console.log(
          `  ❌ Aucun dossier trouvé pour la formation ${formation.id}`
        );
        notFoundCount++;
      }
    }

    console.log("\n📊 Statistiques finales:");
    console.log(`  📁 Dossiers renommés: ${renamedCount}`);
    console.log(`  ❌ Dossiers non trouvés: ${notFoundCount}`);
    console.log(`  📚 Total formations: ${formations.length}`);

    console.log("\n🎉 Renommage des dossiers terminé avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors du renommage des dossiers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
renameFormationFolders();



































