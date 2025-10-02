import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Fonction pour créer le dossier d'une formation avec le nom exact
function createSimpleFormationFolder(formationTitle) {
  try {
    // Nettoyer le titre pour créer un nom de dossier valide
    const cleanTitle = formationTitle
      .replace(/[<>:"/\\|?*]/g, "") // Supprimer les caractères interdits pour les noms de dossiers
      .replace(/\s+/g, " ") // Normaliser les espaces
      .trim();

    const folderPath = path.join("uploads", "formations", cleanTitle);

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`  📁 Dossier créé: ${cleanTitle}`);
      return true;
    } else {
      console.log(`  📁 Dossier existe déjà: ${cleanTitle}`);
      return false;
    }
  } catch (error) {
    console.error(
      `  ❌ Erreur création dossier pour ${formationTitle}:`,
      error.message
    );
    return false;
  }
}

async function createSimpleFormationFolders() {
  try {
    console.log(
      "🌱 Création des dossiers avec les noms exacts des formations..."
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
    let existingCount = 0;

    // Créer les dossiers pour chaque formation
    for (const formation of formations) {
      const universeName = formation.universe?.name || "FSU";
      console.log(`\n🎯 Formation: ${formation.title} (${universeName})`);

      const wasCreated = createSimpleFormationFolder(formation.title);
      if (wasCreated) {
        createdCount++;
      } else {
        existingCount++;
      }
    }

    console.log("\n📊 Statistiques finales:");
    console.log(`  📁 Dossiers créés: ${createdCount}`);
    console.log(`  📁 Dossiers existants: ${existingCount}`);
    console.log(`  📚 Total formations: ${formations.length}`);

    console.log("\n🎉 Création des dossiers terminée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de la création des dossiers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createSimpleFormationFolders();
















