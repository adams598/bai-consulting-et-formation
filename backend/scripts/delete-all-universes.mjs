import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllUniverses() {
  try {
    console.log("🗑️ Suppression de tous les univers...");

    // D'abord, retirer toutes les formations de leurs univers
    await prisma.formation.updateMany({
      data: { universeId: null },
    });
    console.log("✅ Toutes les formations ont été retirées de leurs univers");

    // Ensuite, supprimer tous les univers
    const deletedUniverses = await prisma.universe.deleteMany({});
    console.log(`✅ ${deletedUniverses.count} univers supprimés`);

    console.log("🎉 Tous les univers ont été supprimés avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la suppression des univers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllUniverses();



















