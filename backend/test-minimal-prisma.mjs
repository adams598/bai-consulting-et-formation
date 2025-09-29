import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testMinimalPrisma() {
  try {
    console.log("🔍 Test du schéma minimal Prisma...");

    // Test de connexion
    await prisma.$connect();
    console.log("✅ Connexion Prisma réussie");

    // Vérifier les propriétés disponibles
    console.log("🔍 Propriétés disponibles sur prisma:");
    console.log(Object.keys(prisma));

    // Test du modèle CalendarIntegration
    console.log("🔍 Test du modèle CalendarIntegration...");
    const integrations = await prisma.calendarIntegration.findMany({
      take: 1,
    });
    console.log("✅ Modèle CalendarIntegration accessible");
    console.log(`📊 ${integrations.length} intégrations trouvées`);

    // Test du modèle CalendarEvent
    console.log("🔍 Test du modèle CalendarEvent...");
    const events = await prisma.calendarEvent.findMany({
      take: 1,
    });
    console.log("✅ Modèle CalendarEvent accessible");
    console.log(`📊 ${events.length} événements trouvés`);

    console.log("\n🎉 Tous les tests Prisma réussis !");
  } catch (error) {
    console.error("❌ Erreur Prisma:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testMinimalPrisma();
