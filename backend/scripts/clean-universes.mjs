import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanUniverses() {
  try {
    console.log("🧹 Nettoyage des univers et relations...");

    // Supprimer toutes les relations UniverseFormation
    await prisma.universeFormation.deleteMany();
    console.log("✅ Relations UniverseFormation supprimées");

    // Réinitialiser universeId sur toutes les formations
    await prisma.formation.updateMany({
      data: { universeId: null },
    });
    console.log("✅ Références universeId réinitialisées sur les formations");

    // Recréer les relations correctement
    await recreateUniverseRelations();

    console.log("\n✅ Nettoyage terminé avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function recreateUniverseRelations() {
  const universesData = [
    {
      name: "Conformité Bancaire",
      formations: [
        "conformitebancaire",
        "anti-blanchiment_de_capitaux",
        "audit_interne_et_controle",
        "contr_le_des_risques",
      ],
    },
    {
      name: "Technologies Financières",
      formations: [
        "fintechetinnovation",
        "blockchain_et_cryptomonnaies",
        "intelligence_artificielle",
        "data_science_et_analytics",
      ],
    },
    {
      name: "Développement Professionnel",
      formations: [
        "gestion_de_portefeuille",
        "gestion_du_stress",
        "formation_g_n_rale_3",
      ],
    },
    {
      name: "Technologies Digitales",
      formations: [
        "d_veloppement_web_moderne",
        "cloud_computing",
        "devops_et_agilit_",
        "cybers_curit__avanc_e",
        "iot_et_objets_connect_s",
        "transformation_digitale",
      ],
    },
    {
      name: "Assurance et Sécurité",
      formations: ["assurance_digitale"],
    },
    {
      name: "Architecture et Infrastructure",
      formations: ["architecture_logicielle"],
    },
  ];

  for (const universeData of universesData) {
    // Trouver l'univers par nom
    const universe = await prisma.universe.findFirst({
      where: { name: universeData.name },
    });

    if (!universe) {
      console.log(`⚠️ Univers "${universeData.name}" non trouvé`);
      continue;
    }

    console.log(`\n📁 Traitement de l'univers: ${universe.name}`);

    for (const formationFolder of universeData.formations) {
      // Chercher la formation correspondante
      const formation = await prisma.formation.findFirst({
        where: {
          title: {
            contains: formationFolder.replace(/_/g, " "),
          },
        },
      });

      if (formation) {
        // Vérifier si la relation existe déjà
        const existingRelation = await prisma.universeFormation.findFirst({
          where: {
            universeId: universe.id,
            formationId: formation.id,
          },
        });

        if (!existingRelation) {
          // Créer la relation Universe-Formation
          await prisma.universeFormation.create({
            data: {
              universeId: universe.id,
              formationId: formation.id,
              order: universeData.formations.indexOf(formationFolder),
            },
          });

          // Mettre à jour la formation pour l'associer à l'univers
          await prisma.formation.update({
            where: { id: formation.id },
            data: { universeId: universe.id },
          });

          console.log(
            `  ✅ Formation "${formation.title}" associée à l'univers "${universe.name}"`
          );
        } else {
          console.log(`  ⚠️ Relation déjà existante pour "${formation.title}"`);
        }
      } else {
        console.log(
          `  ⚠️ Formation non trouvée pour le dossier: ${formationFolder}`
        );
      }
    }
  }
}

// Exécuter le nettoyage
cleanUniverses();
