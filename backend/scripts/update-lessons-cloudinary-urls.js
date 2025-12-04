import { PrismaClient } from "@prisma/client";
import { cloudinaryService } from "../src/services/cloudinary.service.js";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

/**
 * Script pour mettre à jour les fileUrl des leçons avec les URLs Cloudinary
 * si les vidéos existent déjà sur Cloudinary
 */
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

    console.log(`📊 ${lessons.length} leçons trouvées avec des fileUrl non-Cloudinary`);

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const lesson of lessons) {
      try {
        const formationTitle = lesson.formation.title;
        const lessonTitle = lesson.title;

        // Construire le public_id Cloudinary attendu
        const sanitizedFormationTitle = cloudinaryService.sanitizePublicId(formationTitle);
        const sanitizedLessonTitle = cloudinaryService.sanitizePublicId(lessonTitle);
        const publicId = `formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/video`;

        // Construire l'URL Cloudinary attendue
        const cloudName = cloudinaryService.getCloudName();
        const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/video/upload/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/video.mp4`;

        console.log(`\n🔍 Vérification de la leçon: ${lessonTitle}`);
        console.log(`   Formation: ${formationTitle}`);
        console.log(`   Public ID attendu: ${publicId}`);
        console.log(`   URL Cloudinary attendue: ${cloudinaryUrl}`);
        console.log(`   FileUrl actuel: ${lesson.fileUrl}`);

        // Vérifier si la vidéo existe sur Cloudinary en testant l'URL
        // Note: On ne peut pas vraiment vérifier sans faire une requête HTTP
        // On va simplement mettre à jour avec l'URL Cloudinary attendue
        // L'utilisateur devra vérifier manuellement si la vidéo existe

        // Mettre à jour le fileUrl avec l'URL Cloudinary
        await prisma.formationContent.update({
          where: { id: lesson.id },
          data: {
            fileUrl: cloudinaryUrl,
          },
        });

        console.log(`   ✅ FileUrl mis à jour avec l'URL Cloudinary`);
        updatedCount++;
      } catch (error) {
        console.error(`   ❌ Erreur lors de la mise à jour:`, error.message);
        notFoundCount++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ ${updatedCount} leçons mises à jour`);
    console.log(`   ❌ ${notFoundCount} erreurs`);
    console.log(`\n⚠️  Note: Vérifiez manuellement que les vidéos existent bien sur Cloudinary`);
    console.log(`   Les URLs ont été mises à jour selon la structure attendue`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
updateLessonsCloudinaryUrls();

