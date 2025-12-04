import { PrismaClient } from "@prisma/client";
import { cloudinaryService } from "../src/services/cloudinary.service.js";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

/**
 * Script pour mettre à jour les fileUrl des leçons avec les URLs Cloudinary
 * Vérifie si les vidéos existent sur Cloudinary avant de mettre à jour
 */
async function checkResourceExists(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: "video",
    });
    return result ? true : false;
  } catch (error) {
    if (error.http_code === 404) {
      return false;
    }
    throw error;
  }
}

async function updateLessonsCloudinaryUrls() {
  try {
    console.log("🔍 Recherche des leçons avec des fileUrl non-Cloudinary...");

    // Récupérer toutes les leçons qui ont un fileUrl mais qui n'est pas Cloudinary
    const lessons = await prisma.formationContent.findMany({
      where: {
        contentType: "LESSON",
        fileUrl: {
          not: null,
        },
        // Exclure les URLs Cloudinary
        NOT: {
          fileUrl: {
            startsWith: "https://res.cloudinary.com",
          },
        },
      },
      include: {
        formation: true,
      },
    });

    console.log(
      `📊 ${lessons.length} leçons trouvées avec des fileUrl non-Cloudinary\n`
    );

    let updatedCount = 0;
    let notFoundCount = 0;
    let skippedCount = 0;

    for (const lesson of lessons) {
      try {
        const formationTitle = lesson.formation.title;
        const lessonTitle = lesson.title;

        // Construire le public_id Cloudinary attendu
        const sanitizedFormationTitle =
          cloudinaryService.sanitizePublicId(formationTitle);
        const sanitizedLessonTitle =
          cloudinaryService.sanitizePublicId(lessonTitle);
        const publicId = `formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/video`;

        // Construire l'URL Cloudinary attendue
        const cloudName = cloudinaryService.getCloudName();
        const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/video/upload/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/video.mp4`;

        console.log(`🔍 Vérification de la leçon: "${lessonTitle}"`);
        console.log(`   Formation: "${formationTitle}"`);
        console.log(`   Public ID: ${publicId}`);
        console.log(`   FileUrl actuel: ${lesson.fileUrl}`);

        // Vérifier si la vidéo existe sur Cloudinary
        const exists = await checkResourceExists(publicId);

        if (exists) {
          console.log(`   ✅ Vidéo trouvée sur Cloudinary`);
          console.log(`   🔗 URL Cloudinary: ${cloudinaryUrl}`);

          // Mettre à jour le fileUrl avec l'URL Cloudinary
          await prisma.formationContent.update({
            where: { id: lesson.id },
            data: {
              fileUrl: cloudinaryUrl,
            },
          });

          console.log(`   ✅ FileUrl mis à jour en base de données\n`);
          updatedCount++;
        } else {
          console.log(`   ⚠️  Vidéo non trouvée sur Cloudinary`);
          console.log(
            `   💡 Vous devez ré-uploader la vidéo pour cette leçon\n`
          );
          skippedCount++;
        }
      } catch (error) {
        console.error(`   ❌ Erreur lors de la vérification:`, error.message);
        notFoundCount++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ ${updatedCount} leçons mises à jour avec succès`);
    console.log(
      `   ⚠️  ${skippedCount} leçons ignorées (vidéo non trouvée sur Cloudinary)`
    );
    console.log(`   ❌ ${notFoundCount} erreurs`);
    console.log(
      `\n💡 Pour les leçons ignorées, ré-uploadez la vidéo depuis l'interface admin`
    );
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
updateLessonsCloudinaryUrls();
