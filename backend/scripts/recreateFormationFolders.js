import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Fonction pour créer le dossier d'une formation avec le nom exact
function createFormationFolder(formationId, formationTitle) {
  try {
    // Nettoyer le titre pour créer un nom de dossier valide
    const cleanTitle = formationTitle
      .replace(/[<>:"/\\|?*]/g, "") // Supprimer les caractères interdits pour les noms de dossiers
      .replace(/\s+/g, " ") // Normaliser les espaces
      .trim();

    const folderName = `${formationId}-${cleanTitle}`;
    const folderPath = path.join("uploads", "formations", folderName);

    // Supprimer le dossier s'il existe déjà
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`  🗑️  Ancien dossier supprimé: ${folderPath}`);
    }

    // Créer le nouveau dossier
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`  📁 Dossier créé: ${folderPath}`);
    return true;
  } catch (error) {
    console.error(
      `  ❌ Erreur création dossier pour ${formationTitle}:`,
      error.message
    );
    return false;
  }
}

async function recreateFormationFolders() {
  try {
    console.log(
      "🌱 Recréation des dossiers avec les noms exacts des formations..."
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

    let createdCount = 0;

    // Recréer les dossiers pour chaque formation
    for (const formation of formations) {
      const universeName = formation.universe?.name || "FSU";
      console.log(`\n🎯 Formation: ${formation.title} (${universeName})`);

      const wasCreated = createFormationFolder(formation.id, formation.title);
      if (wasCreated) {
        createdCount++;
      }
    }

    console.log("\n📊 Statistiques finales:");
    console.log(`  📁 Dossiers recréés: ${createdCount}`);
    console.log(`  📚 Total formations: ${formations.length}`);

    console.log("\n🎉 Recréation des dossiers terminée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de la recréation des dossiers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
recreateFormationFolders();



















