import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSpecificLesson() {
  try {
    const lessonId = "cmgyy5yqq000zy1x6eag061xd";

    console.log(`🔍 Vérification de la leçon ${lessonId}...\n`);

    // Récupérer la leçon directement depuis Prisma
    const lesson = await prisma.formationContent.findUnique({
      where: {
        id: lessonId,
      },
    });

    if (!lesson) {
      console.log("❌ Leçon non trouvée");
      return;
    }

    console.log("📊 Données Prisma:");
    console.log("   Titre:", lesson.title);
    console.log("   Duration (valeur brute):", lesson.duration);
    console.log("   Type de duration:", typeof lesson.duration);

    // Requête SQL brute pour vérifier la valeur réelle en BDD
    const rawResult = await prisma.$queryRaw`
      SELECT id, title, duration, type, "contentType"
      FROM formation_content 
      WHERE id = ${lessonId}
    `;

    console.log("\n📊 Données SQL brutes:");
    console.log(rawResult);

    if (rawResult && rawResult.length > 0) {
      console.log("\n✨ Comparaison:");
      console.log("   Valeur Prisma:", lesson.duration);
      console.log("   Valeur SQL brute:", rawResult[0].duration);
      console.log("   Identiques?", lesson.duration === rawResult[0].duration);
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificLesson();
