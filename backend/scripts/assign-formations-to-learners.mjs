import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function assignFormationsToLearners() {
  try {
    console.log("📚 Attribution de formations aux apprenants...\n");

    // Récupérer tous les apprenants
    const learners = await prisma.user.findMany({
      where: { role: "LEARNER" },
    });

    if (learners.length === 0) {
      console.log("❌ Aucun apprenant trouvé. Créez d'abord des apprenants.");
      return;
    }

    // Récupérer ou créer des formations
    let formations = await prisma.formation.findMany({
      where: { isActive: true },
    });

    // Si pas de formations, en créer quelques-unes
    if (formations.length === 0) {
      console.log("🏗️ Création de formations de test...");

      const adminUser = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
      });

      if (!adminUser) {
        console.log("❌ Aucun admin trouvé pour créer les formations");
        return;
      }

      const formationsData = [
        {
          title: "Conformité Bancaire - Niveau 1",
          description:
            "Formation sur les règles de conformité bancaire et la réglementation",
          duration: 120,
          isActive: true,
          hasQuiz: true,
          quizRequired: true,
          createdBy: adminUser.id,
        },
        {
          title: "Gestion des Risques Financiers",
          description:
            "Formation sur l'identification et la gestion des risques financiers",
          duration: 90,
          isActive: true,
          hasQuiz: true,
          quizRequired: false,
          createdBy: adminUser.id,
        },
        {
          title: "Relation Client et Vente",
          description:
            "Techniques de vente et amélioration de la relation client",
          duration: 150,
          isActive: true,
          hasQuiz: false,
          quizRequired: false,
          createdBy: adminUser.id,
        },
      ];

      for (const formationData of formationsData) {
        const formation = await prisma.formation.create({
          data: formationData,
        });
        formations.push(formation);
        console.log(`   ✅ Formation créée: ${formation.title}`);
      }
    }

    console.log(`📚 ${formations.length} formations disponibles`);
    console.log(`👥 ${learners.length} apprenants trouvés`);

    // Assigner des formations à chaque apprenant
    for (const learner of learners) {
      console.log(
        `\n👤 Attribution pour ${learner.firstName} ${learner.lastName}:`
      );

      // Assigner 2-3 formations aléatoirement
      const numFormations = Math.floor(Math.random() * 2) + 2; // 2 ou 3 formations
      const selectedFormations = formations.slice(0, numFormations);

      for (const formation of selectedFormations) {
        // Vérifier si l'assignation existe déjà
        const existingAssignment = await prisma.formationAssignment.findFirst({
          where: {
            userId: learner.id,
            formationId: formation.id,
          },
        });

        if (existingAssignment) {
          console.log(`   ⚠️ ${formation.title} déjà assignée`);
          continue;
        }

        // Créer l'assignation
        const assignment = await prisma.formationAssignment.create({
          data: {
            userId: learner.id,
            formationId: formation.id,
            assignedBy: formations[0].createdBy, // Utiliser le créateur de la première formation
            status: "ASSIGNED",
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans 30 jours
          },
        });

        // Créer une progression initiale
        await prisma.userProgress.create({
          data: {
            userId: learner.id,
            formationId: formation.id,
            lessonId: formation.id, // Temporaire
            status: "NOT_STARTED",
            progress: 0,
            timeSpent: 0,
          },
        });

        console.log(`   ✅ ${formation.title} assignée`);
      }
    }

    console.log("\n✅ Attributions terminées !");
    console.log("\n🎯 POUR TESTER :");
    console.log("1. Connectez-vous avec un apprenant");
    console.log("2. Allez sur /apprenant/courses");
    console.log("3. Vous devriez voir les formations assignées");
  } catch (error) {
    console.error("❌ Erreur lors de l'attribution:", error);
  } finally {
    await prisma.$disconnect();
  }
}

assignFormationsToLearners();
