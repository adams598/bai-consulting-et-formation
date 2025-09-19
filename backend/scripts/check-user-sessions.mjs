import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserSessions() {
  try {
    console.log("🔍 Vérification des sessions utilisateurs...");

    // 1. Vérifier toutes les sessions actives
    const activeSessions = await prisma.userSession.findMany({
      where: {
        expiresAt: { gt: new Date() }, // Sessions non expirées
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`📊 ${activeSessions.length} sessions actives trouvées:`);

    activeSessions.forEach((session, index) => {
      console.log(
        `  ${index + 1}. ${session.user.email} (${session.user.role})`
      );
      console.log(`     - Token: ${session.token.substring(0, 20)}...`);
      console.log(`     - Expire: ${session.expiresAt}`);
      console.log(`     - IP: ${session.ipAddress}`);
      console.log("");
    });

    // 2. Vérifier les sessions expirées récentes
    const expiredSessions = await prisma.userSession.findMany({
      where: {
        expiresAt: { lt: new Date() }, // Sessions expirées
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Créées dans les 24h
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`⏰ ${expiredSessions.length} sessions expirées récentes:`);

    expiredSessions.forEach((session, index) => {
      console.log(
        `  ${index + 1}. ${session.user.email} (${session.user.role})`
      );
      console.log(`     - Expirée: ${session.expiresAt}`);
      console.log("");
    });

    // 3. Nettoyer les sessions expirées
    const cleanupResult = await prisma.userSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    console.log(`🧹 ${cleanupResult.count} sessions expirées supprimées`);
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSessions();
