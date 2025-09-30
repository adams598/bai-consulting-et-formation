import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createMesFormationsUniverse() {
  try {
    console.log("🔧 Création de l'univers 'Mes Formations'...");

    // Vérifier si l'univers existe déjà
    const existingUniverse = await prisma.universe.findUnique({
      where: { id: "mes-formations" },
    });

    if (existingUniverse) {
      console.log(
        "✅ L'univers 'Mes Formations' existe déjà:",
        existingUniverse.id
      );
      return existingUniverse;
    }

    // Créer l'univers "Mes Formations"
    const mesFormationsUniverse = await prisma.universe.create({
      data: {
        id: "mes-formations",
        name: "Mes Formations",
        description: "Formations par défaut pour tous les collaborateurs",
        color: "#3B82F6", // Bleu
        isActive: true,
      },
    });

    console.log("✅ Univers 'Mes Formations' créé:", mesFormationsUniverse.id);

    return mesFormationsUniverse;
  } catch (error) {
    console.error("❌ Erreur:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

createMesFormationsUniverse();

