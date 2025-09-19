import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateFormationsWithDefaultData() {
  try {
    console.log("🔄 Mise à jour des formations avec des données par défaut...");

    // Données par défaut pour les formations
    const defaultData = {
      pedagogicalModality: "E-learning",
      organization: "SHERPA Developpement",
      prerequisites: "Aucune connaissance préalable n'est nécessaire.",
      objectives: JSON.stringify([
        "Qualifier une opportunité d'achat d'un bien locatif",
        "Guider les clients dans leur décision en fonction de leur profil financier et de leurs objectifs",
        "Optimiser la mise en relation avec les différentes filières immobilières de votre banque et du Groupe BPCE",
      ]),
      detailedProgram: JSON.stringify([
        "Introduction",
        "Comprendre l'immobilier locatif",
        "Rôle du conseiller",
        "Bon à savoir",
      ]),
      targetAudience: JSON.stringify([
        "Chargé de clientèle",
        "particuliers",
        "Conseiller clientèle",
        "Téléconseiller",
      ]),
    };

    // Récupérer toutes les formations qui n'ont pas ces champs remplis
    const formations = await prisma.formation.findMany({
      where: {
        OR: [
          { pedagogicalModality: null },
          { organization: null },
          { prerequisites: null },
          { objectives: null },
          { detailedProgram: null },
          { targetAudience: null },
        ],
      },
    });

    console.log(`📊 ${formations.length} formations à mettre à jour`);

    // Mettre à jour chaque formation
    for (const formation of formations) {
      const updateData = {};

      // Ajouter seulement les champs qui sont null
      if (!formation.pedagogicalModality)
        updateData.pedagogicalModality = defaultData.pedagogicalModality;
      if (!formation.organization)
        updateData.organization = defaultData.organization;
      if (!formation.prerequisites)
        updateData.prerequisites = defaultData.prerequisites;
      if (!formation.objectives) updateData.objectives = defaultData.objectives;
      if (!formation.detailedProgram)
        updateData.detailedProgram = defaultData.detailedProgram;
      if (!formation.targetAudience)
        updateData.targetAudience = defaultData.targetAudience;

      // Générer un code si pas déjà présent
      if (!formation.code) {
        updateData.code = `FR${formation.id.substring(0, 6).toUpperCase()}`;
      }

      await prisma.formation.update({
        where: { id: formation.id },
        data: updateData,
      });

      console.log(`✅ Formation "${formation.title}" mise à jour`);
    }

    console.log("🎉 Mise à jour terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
updateFormationsWithDefaultData();




