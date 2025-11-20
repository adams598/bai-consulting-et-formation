import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createBeautifulUniverses() {
  try {
    console.log("🎨 Création d'univers avec de belles couleurs...");

    // Supprimer tous les univers existants
    await prisma.formation.updateMany({
      data: { universeId: null },
    });
    await prisma.universe.deleteMany({});
    console.log("✅ Anciens univers supprimés");

    // Créer de nouveaux univers avec de belles couleurs modernes
    const universes = [
      {
        name: "Finance",
        description: "Formations financières et bancaires",
        color: "#3B82F6", // Bleu moderne
        icon: "folder",
        isActive: true,
      },
      {
        name: "Conformité",
        description: "Réglementation et conformité",
        color: "#10B981", // Vert émeraude
        icon: "folder",
        isActive: true,
      },
      {
        name: "Digital",
        description: "Transformation digitale",
        color: "#8B5CF6", // Violet moderne
        icon: "folder",
        isActive: true,
      },
      {
        name: "Management",
        description: "Leadership et management",
        color: "#F59E0B", // Orange vif
        icon: "folder",
        isActive: true,
      },
      {
        name: "Sécurité",
        description: "Cybersécurité et protection",
        color: "#EF4444", // Rouge moderne
        icon: "folder",
        isActive: true,
      },
      {
        name: "Innovation",
        description: "Innovation et R&D",
        color: "#06B6D4", // Cyan moderne
        icon: "folder",
        isActive: true,
      },
    ];

    for (const universeData of universes) {
      const universe = await prisma.universe.create({
        data: universeData,
      });
      console.log(`✅ Univers créé: ${universe.name} (${universe.color})`);
    }

    console.log("🎉 Tous les univers ont été créés avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la création des univers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createBeautifulUniverses();



































