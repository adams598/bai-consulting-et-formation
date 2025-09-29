import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function assignFormationsToLearners() {
  try {
    console.log("📚 Attribution de formations aux apprenants...");

    // Récupérer tous les apprenants (utilisateurs avec rôle LEARNER)
    const learners = await prisma.user.findMany({
      where: {
        role: "LEARNER",
        isActive: true,
      },
    });

    console.log(`👥 ${learners.length} apprenants trouvés`);

    // Récupérer toutes les formations actives
    const formations = await prisma.formation.findMany({
      where: {
        isActive: true,
      },
    });

    console.log(`📚 ${formations.length} formations disponibles`);

    // Assigner 3-5 formations par apprenant
    for (const learner of learners) {
      console.log(
        `\n👤 Attribution pour ${learner.firstName} ${learner.lastName}:`
      );

      // Sélectionner 3-5 formations aléatoires
      const numberOfFormations = Math.floor(Math.random() * 3) + 3; // 3-5 formations
      const shuffledFormations = formations.sort(() => 0.5 - Math.random());
      const selectedFormations = shuffledFormations.slice(
        0,
        numberOfFormations
      );

      for (let i = 0; i < selectedFormations.length; i++) {
        const formation = selectedFormations[i];

        try {
          // Créer l'assignation de formation
          const assignment = await prisma.userFormationAssignment.create({
            data: {
              userId: learner.id,
              formationId: formation.id,
              assignedAt: new Date(),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans 30 jours
              status: "ASSIGNED",
              progress: 0,
            },
          });

          console.log(
            `  ✅ ${i + 1}/${numberOfFormations} - ${formation.title}`
          );

          // Créer un UserProgress pour cette formation
          await prisma.userProgress.create({
            data: {
              userId: learner.id,
              formationId: formation.id,
              lessonId: formation.id, // Utiliser l'ID de formation comme lessonId
              progress: 0,
              timeSpent: 0,
              isCompleted: false,
            },
          });
        } catch (error) {
          console.error(
            `  ❌ Erreur lors de l'attribution de ${formation.title}:`,
            error.message
          );
        }
      }
    }

    // Statistiques finales
    const totalAssignments = await prisma.userFormationAssignment.count();
    const totalProgress = await prisma.userProgress.count();

    console.log("\n📊 Statistiques finales:");
    console.log(`  📚 Total assignations: ${totalAssignments}`);
    console.log(`  📈 Total progressions: ${totalProgress}`);

    console.log("\n🎉 Attribution des formations terminée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de l'attribution des formations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'attribution
assignFormationsToLearners();
