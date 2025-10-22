import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestUniverses() {
  try {
    console.log("🌌 Création des univers de test...");

    // Créer quelques univers de test
    const universes = [
      {
        name: "Banque",
        description: "Formations bancaires et financières",
        color: "#3B82F6",
        icon: "folder",
        isActive: true,
      },
      {
        name: "Conformité",
        description: "Formations de conformité et réglementation",
        color: "#10B981",
        icon: "folder",
        isActive: true,
      },
      {
        name: "Technologie",
        description: "Formations technologiques et digitales",
        color: "#8B5CF6",
        icon: "folder",
        isActive: true,
      },
      {
        name: "Management",
        description: "Formations de management et leadership",
        color: "#F59E0B",
        icon: "folder",
        isActive: true,
      },
    ];

    for (const universeData of universes) {
      const universe = await prisma.universe.create({
        data: universeData,
      });
      console.log(`✅ Univers créé: ${universe.name} (${universe.id})`);
    }

    console.log("🎉 Tous les univers de test ont été créés avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la création des univers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUniverses();






















