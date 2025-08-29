import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testInterface() {
  try {
    console.log("🧪 Test de l'interface...\n");

    // 1. Test des statistiques globales
    console.log("📊 Test des statistiques globales...");

    const totalUsers = await prisma.user.count();
    const totalFormations = await prisma.formation.count();
    const totalBanks = await prisma.bank.count({
      where: { isArchived: false },
    });
    const activeUsers = await prisma.user.count({
      where: { isActive: true },
    });

    console.log("✅ Statistiques calculées:");
    console.log(`   🏦 Banques: ${totalBanks}`);
    console.log(`   👥 Utilisateurs: ${totalUsers}`);
    console.log(`   📚 Formations: ${totalFormations}`);
    console.log(`   🔄 Utilisateurs actifs: ${activeUsers}`);

    // 2. Test des statistiques par banque
    console.log("\n🏦 Test des statistiques par banque...");

    const banks = await prisma.bank.findMany({
      where: { isArchived: false },
      include: {
        users: {
          select: { id: true },
        },
        bankFormations: {
          select: { id: true },
        },
      },
    });

    console.log("✅ Statistiques des banques calculées:");
    banks.forEach((bank) => {
      console.log(`   ${bank.name}:`);
      console.log(`     👥 Collaborateurs: ${bank.users.length}`);
      console.log(`     📚 Formations: ${bank.bankFormations.length}`);
    });

    // 3. Test des statistiques des formations
    console.log("\n📚 Test des statistiques des formations...");

    const formations = await prisma.formation.findMany();
    console.log("✅ Statistiques des formations calculées:");

    for (const formation of formations) {
      const bankCount = await prisma.bankFormation.count({
        where: { formationId: formation.id },
      });

      const userCount = await prisma.userFormationAssignment.count({
        where: {
          bankFormation: {
            formationId: formation.id,
          },
        },
      });

      console.log(`   ${formation.title}:`);
      console.log(`     🏦 Banques avec accès: ${bankCount}`);
      console.log(`     👥 Utilisateurs assignés: ${userCount}`);
    }

    console.log("\n✅ Test de l'interface terminé avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testInterface();

