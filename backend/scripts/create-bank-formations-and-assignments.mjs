import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createBankFormationsAndAssignments() {
  try {
    console.log("🏦 Création des BankFormations et assignations...");

    // Récupérer la banque de test
    const bank = await prisma.bank.findFirst({
      where: { name: "Banque de Test" },
    });

    if (!bank) {
      console.error("❌ Banque de test non trouvée");
      return;
    }

    console.log(`🏦 Banque trouvée: ${bank.name}`);

    // Récupérer toutes les formations
    const formations = await prisma.formation.findMany({
      where: { isActive: true },
    });

    console.log(`📚 ${formations.length} formations trouvées`);

    // Récupérer tous les apprenants
    const learners = await prisma.user.findMany({
      where: {
        role: "LEARNER",
        isActive: true,
      },
    });

    console.log(`👥 ${learners.length} apprenants trouvés`);

    let totalBankFormations = 0;
    let totalAssignments = 0;

    // Créer des BankFormations pour chaque formation
    for (const formation of formations) {
      try {
        const bankFormation = await prisma.bankFormation.create({
          data: {
            bankId: bank.id,
            formationId: formation.id,
            isActive: true,
            assignedAt: new Date(),
          },
        });

        totalBankFormations++;
        console.log(`  ✅ BankFormation créée pour: ${formation.title}`);

        // Assigner cette formation à 2-3 apprenants aléatoires
        const numberOfLearners = Math.floor(Math.random() * 2) + 2; // 2-3 apprenants
        const shuffledLearners = learners.sort(() => 0.5 - Math.random());
        const selectedLearners = shuffledLearners.slice(0, numberOfLearners);

        for (const learner of selectedLearners) {
          try {
            await prisma.userFormationAssignment.create({
              data: {
                userId: learner.id,
                bankFormationId: bankFormation.id,
                assignedAt: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans 30 jours
                status: "ASSIGNED",
                progress: 0,
              },
            });

            totalAssignments++;
            console.log(
              `    👤 Assigné à: ${learner.firstName} ${learner.lastName}`
            );

            // Créer un UserProgress
            await prisma.userProgress.create({
              data: {
                userId: learner.id,
                formationId: formation.id,
                lessonId: formation.id,
                progress: 0,
                timeSpent: 0,
                isCompleted: false,
              },
            });
          } catch (error) {
            console.error(
              `    ❌ Erreur assignation ${learner.firstName}:`,
              error.message
            );
          }
        }
      } catch (error) {
        console.error(
          `  ❌ Erreur BankFormation ${formation.title}:`,
          error.message
        );
      }
    }

    // Statistiques finales
    const totalBankFormationsInDb = await prisma.bankFormation.count();
    const totalAssignmentsInDb = await prisma.userFormationAssignment.count();
    const totalProgressInDb = await prisma.userProgress.count();

    console.log("\n📊 Statistiques finales:");
    console.log(`  🏦 BankFormations créées: ${totalBankFormations}`);
    console.log(`  🏦 BankFormations en BDD: ${totalBankFormationsInDb}`);
    console.log(`  📚 Assignations créées: ${totalAssignments}`);
    console.log(`  📚 Assignations en BDD: ${totalAssignmentsInDb}`);
    console.log(`  📈 Progressions en BDD: ${totalProgressInDb}`);

    console.log("\n🎉 Création des assignations terminée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de la création des assignations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la création
createBankFormationsAndAssignments();
