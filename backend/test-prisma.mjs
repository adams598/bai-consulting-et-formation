import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testPrisma() {
  try {
    console.log("🔍 Test de Prisma...");

    // Test de connexion
    await prisma.$connect();
    console.log("✅ Connexion Prisma réussie");

    // Test des modèles CalendarIntegration
    console.log("🔍 Test du modèle CalendarIntegration...");
    const integrations = await prisma.calendarIntegration.findMany({
      take: 1,
    });
    console.log("✅ Modèle CalendarIntegration accessible");
    console.log(`📊 ${integrations.length} intégrations trouvées`);

    // Test des modèles CalendarEvent
    console.log("🔍 Test du modèle CalendarEvent...");
    const events = await prisma.calendarEvent.findMany({
      take: 1,
    });
    console.log("✅ Modèle CalendarEvent accessible");
    console.log(`📊 ${events.length} événements trouvés`);

    // Test d'un utilisateur
    console.log("🔍 Test du modèle User...");
    const users = await prisma.user.findMany({
      take: 1,
      select: { id: true, email: true },
    });
    console.log("✅ Modèle User accessible");
    console.log(`📊 ${users.length} utilisateurs trouvés`);

    console.log("\n🎉 Tous les tests Prisma réussis !");
  } catch (error) {
    console.error("❌ Erreur Prisma:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
