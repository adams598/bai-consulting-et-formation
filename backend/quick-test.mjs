import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function quickTest() {
  try {
    console.log("🧪 Test rapide de la base de données...\n");

    // Test 1: Compter les banques
    const bankCount = await prisma.bank.count({
      where: { isArchived: false },
    });
    console.log(`🏦 Banques: ${bankCount}`);

    // Test 2: Compter les utilisateurs
    const userCount = await prisma.user.count();
    console.log(`👥 Utilisateurs: ${userCount}`);

    // Test 3: Compter les formations
    const formationCount = await prisma.formation.count();
    console.log(`📚 Formations: ${formationCount}`);

    // Test 4: Compter les assignations banque-formation
    const bankFormationCount = await prisma.bankFormation.count();
    console.log(`🔗 Assignations banque-formation: ${bankFormationCount}`);

    console.log("\n✅ Test rapide terminé!");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();

