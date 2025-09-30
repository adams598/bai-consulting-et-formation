import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearCache() {
  try {
    console.log("🧹 Nettoyage du cache...");

    // Vider le cache des formations
    const cacheService = (await import("../src/services/cache.service.js"))
      .default;

    // Vider tous les caches liés aux formations
    const cacheKeys = [
      'formations-simple:{"search":"","isActive":true}',
      'formations-simple:{"search":"","isActive":"true"}',
      "formations-cache-*",
    ];

    for (const pattern of cacheKeys) {
      try {
        await cacheService.delete(pattern);
        console.log(`✅ Cache vidé: ${pattern}`);
      } catch (error) {
        console.log(`⚠️ Impossible de vider: ${pattern} - ${error.message}`);
      }
    }

    console.log("✅ Nettoyage du cache terminé !");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCache();

