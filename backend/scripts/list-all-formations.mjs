import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listAllFormations() {
  try {
    console.log("📋 Liste complète de toutes les formations...");

    const formations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        universeId: true,
        isOpportunity: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📊 Total des formations: ${formations.length}`);

    formations.forEach((formation, index) => {
      console.log(`${index + 1}. ${formation.title}`);
      console.log(`   - ID: ${formation.id}`);
      console.log(`   - Univers: ${formation.universeId || "null"}`);
      console.log(`   - Opportunité: ${formation.isOpportunity}`);
      console.log(`   - Actif: ${formation.isActive}`);
      console.log(`   - Créé: ${formation.createdAt.toISOString()}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllFormations();

