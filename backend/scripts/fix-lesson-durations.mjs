import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixLessonDurations() {
  try {
    console.log("🔍 Vérification des durées des leçons...");

    // Récupérer toutes les leçons
    const lessons = await prisma.formationContent.findMany({
      where: {
        contentType: "LESSON",
        duration: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        duration: true,
        formationId: true,
      },
    });

    console.log(`📊 ${lessons.length} leçons trouvées avec durée`);

    // Afficher les leçons avec leurs durées actuelles
    for (const lesson of lessons) {
      console.log(`\n📝 Leçon: ${lesson.title}`);
      console.log(`   ID: ${lesson.id}`);
      console.log(`   Durée actuelle en BDD: ${lesson.duration}`);
      console.log(
        `   Interprétée comme: ${Math.floor(lesson.duration / 60)}m ${
          lesson.duration % 60
        }s`
      );
    }

    console.log("\n✅ Vérification terminée");
    console.log(
      "\nSi les durées sont stockées en minutes au lieu de secondes:"
    );
    console.log("- Elles devraient être multipliées par 60");
    console.log("\nSi les durées sont stockées en secondes (correct):");
    console.log("- Aucune modification nécessaire");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLessonDurations();



