import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testPrismaSimple() {
  try {
    console.log("🔍 Test simple de Prisma...");

    // Test de connexion
    await prisma.$connect();
    console.log("✅ Connexion Prisma réussie");

    // Vérifier les propriétés disponibles
    console.log("🔍 Propriétés disponibles sur prisma:");
    console.log(Object.keys(prisma));

    // Test d'un modèle qui devrait exister
    console.log("🔍 Test du modèle User...");
    const users = await prisma.user.findMany({
      take: 1,
    });
    console.log("✅ Modèle User accessible");
    console.log(`📊 ${users.length} utilisateurs trouvés`);
  } catch (error) {
    console.error("❌ Erreur Prisma:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaSimple();
