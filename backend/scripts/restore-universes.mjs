import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Définition des univers avec leurs formations
const universesData = [
  {
    name: "Conformité Bancaire",
    description:
      "Formations liées à la conformité et à la réglementation bancaire",
    color: "#3B82F6", // Bleu
    icon: "Shield",
    formations: [
      "conformitebancaire",
      "anti-blanchiment_de_capitaux",
      "audit_interne_et_controle",
      "contr_le_des_risques",
    ],
  },
  {
    name: "Technologies Financières",
    description:
      "Formations sur les nouvelles technologies dans le secteur financier",
    color: "#10B981", // Vert
    icon: "Cpu",
    formations: [
      "fintechetinnovation",
      "blockchain_et_cryptomonnaies",
      "intelligence_artificielle",
      "data_science_et_analytics",
    ],
  },
  {
    name: "Développement Professionnel",
    description:
      "Formations pour le développement des compétences professionnelles",
    color: "#F59E0B", // Orange
    icon: "Users",
    formations: [
      "gestion_de_portefeuille",
      "gestion_du_stress",
      "formation_g_n_rale_3",
    ],
  },
  {
    name: "Technologies Digitales",
    description: "Formations sur les technologies digitales et l'innovation",
    color: "#8B5CF6", // Violet
    icon: "Monitor",
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
    description: "Formations sur l'assurance digitale et la sécurité",
    color: "#EF4444", // Rouge
    icon: "ShieldCheck",
    formations: ["assurance_digitale"],
  },
  {
    name: "Architecture et Infrastructure",
    description: "Formations sur l'architecture logicielle et l'infrastructure",
    color: "#06B6D4", // Cyan
    icon: "Building",
    formations: ["architecture_logicielle"],
  },
];

async function restoreUniverses() {
  try {
    console.log("🔄 Restauration des univers et formations...");

    // Supprimer les univers existants et leurs relations
    await prisma.universeFormation.deleteMany();
    await prisma.universe.deleteMany();

    console.log("✅ Anciens univers supprimés");

    // Créer les nouveaux univers
    for (const universeData of universesData) {
      console.log(`📁 Création de l'univers: ${universeData.name}`);

      // Créer l'univers
      const universe = await prisma.universe.create({
        data: {
          name: universeData.name,
          description: universeData.description,
          color: universeData.color,
          icon: universeData.icon,
          isActive: true,
        },
      });

      console.log(`✅ Univers créé: ${universe.name} (ID: ${universe.id})`);

      // Associer les formations à cet univers
      for (const formationFolder of universeData.formations) {
        // Chercher la formation correspondante dans la base de données
        const formation = await prisma.formation.findFirst({
          where: {
            title: {
              contains: formationFolder.replace(/_/g, " "),
            },
          },
        });

        if (formation) {
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
          console.log(
            `  ⚠️ Formation non trouvée pour le dossier: ${formationFolder}`
          );
        }
      }
    }

    // Afficher le résumé
    const totalUniverses = await prisma.universe.count();
    const totalRelations = await prisma.universeFormation.count();

    console.log("\n📊 Résumé de la restauration:");
    console.log(`  - Univers créés: ${totalUniverses}`);
    console.log(`  - Relations Universe-Formation: ${totalRelations}`);

    // Lister tous les univers avec leurs formations
    const universes = await prisma.universe.findMany({
      include: {
        formations: {
          include: {
            formation: {
              select: {
                id: true,
                title: true,
                isActive: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("\n📋 Univers restaurés:");
    universes.forEach((universe) => {
      console.log(`\n🏷️ ${universe.name} (${universe.color})`);
      console.log(`   Description: ${universe.description}`);
      console.log(`   Formations (${universe.formations.length}):`);
      universe.formations.forEach((uf) => {
        console.log(
          `     - ${uf.formation.title} (${
            uf.formation.isActive ? "Actif" : "Inactif"
          })`
        );
      });
    });

    console.log("\n✅ Restauration des univers terminée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de la restauration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la restauration
restoreUniverses();
