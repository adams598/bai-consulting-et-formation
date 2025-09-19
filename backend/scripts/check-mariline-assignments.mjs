import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkMarilineAssignments() {
  try {
    console.log("🔍 Vérification des assignations de mariline@bai.com...");

    // 1. Vérifier l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: "mariline@bai.com" },
    });

    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return;
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);

    // 2. Vérifier les assignations
    const assignments = await prisma.formationAssignment.findMany({
      where: { userId: user.id },
      include: {
        formation: {
          include: {
            content: true,
          },
        },
        user: true,
        assignedByUser: true,
      },
    });

    console.log(`📚 ${assignments.length} assignations trouvées:`);

    assignments.forEach((assignment, index) => {
      console.log(`  ${index + 1}. ${assignment.formation.title}`);
      console.log(`     - Status: ${assignment.status}`);
      console.log(`     - Formation ID: ${assignment.formationId}`);
      console.log(`     - Assigné le: ${assignment.assignedAt}`);
      console.log(`     - Échéance: ${assignment.dueDate}`);
      console.log(
        `     - Leçons: ${
          assignment.formation.content?.filter(
            (c) => c.contentType === "LESSON"
          ).length || 0
        }`
      );
      console.log("");
    });

    // 3. Vérifier les progressions
    const progressions = await prisma.userProgress.findMany({
      where: { userId: user.id },
    });

    console.log(`📈 ${progressions.length} progressions trouvées`);

    // 4. Test de la logique du contrôleur
    console.log("\n🧪 Test de la logique du contrôleur...");

    // Simuler la logique du contrôleur
    const formationsWithProgress = await Promise.all(
      assignments.map(async (assignment) => {
        const userProgress = await prisma.userProgress.findMany({
          where: {
            userId: user.id,
            formationId: assignment.formationId,
          },
        });

        const totalLessons =
          assignment.formation.content?.filter(
            (c) => c.contentType === "LESSON"
          ).length || 0;
        const completedLessons = userProgress.filter(
          (p) => p.isCompleted
        ).length;
        const progressPercentage =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          ...assignment,
          progress: progressPercentage,
          lessonCount: totalLessons,
          completedLessons,
        };
      })
    );

    console.log("📊 Formations avec progression calculée:");
    formationsWithProgress.forEach((assignment, index) => {
      console.log(`  ${index + 1}. ${assignment.formation.title}`);
      console.log(`     - Progression: ${assignment.progress}%`);
      console.log(
        `     - Leçons complétées: ${assignment.completedLessons}/${assignment.lessonCount}`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMarilineAssignments();
