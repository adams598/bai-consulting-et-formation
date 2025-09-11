import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Fonction pour créer le dossier d'une formation
function createFormationFolder(formationId, formationTitle) {
  try {
    // Nettoyer le titre pour créer un nom de dossier valide
    const cleanTitle = formationTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Supprimer les caractères spéciaux
      .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
      .substring(0, 50); // Limiter la longueur

    const folderName = `${formationId}-${cleanTitle}`;
    const folderPath = path.join("uploads", "formations", folderName);

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`    📁 Dossier créé: ${folderPath}`);
    } else {
      console.log(`    📁 Dossier existe déjà: ${folderPath}`);
    }

    return folderPath;
  } catch (error) {
    console.error(
      `    ❌ Erreur création dossier pour ${formationTitle}:`,
      error.message
    );
    return null;
  }
}

// Données de formations par univers (adaptées aux univers existants)
const formationsByUniverse = {
  Banque: [
    {
      title: "Gestion des Risques Bancaires",
      description:
        "Identification et gestion des risques dans le secteur bancaire",
    },
    {
      title: "Réglementation Bâle III",
      description: "Nouveaux accords de Bâle et leurs implications",
    },
    {
      title: "Anti-Blanchiment de Capitaux",
      description:
        "Lutte contre le blanchiment et le financement du terrorisme",
    },
    {
      title: "Crédit et Analyse Financière",
      description: "Évaluation de la solvabilité des emprunteurs",
    },
    {
      title: "Produits Bancaires Innovants",
      description: "Nouveaux produits et services bancaires",
    },
    {
      title: "Digital Banking",
      description: "Transformation digitale des services bancaires",
    },
    {
      title: "Gestion de Portefeuille",
      description: "Stratégies d'investissement et gestion d'actifs",
    },
    {
      title: "Compliance Bancaire",
      description: "Conformité réglementaire dans le secteur bancaire",
    },
    {
      title: "Cybersécurité Bancaire",
      description: "Protection des données et systèmes bancaires",
    },
    {
      title: "Fintech et Innovation",
      description: "Technologies financières et innovation bancaire",
    },
  ],
  Conformité: [
    {
      title: "RGPD et Protection des Données",
      description: "Règlement général sur la protection des données",
    },
    {
      title: "Audit Interne et Contrôle",
      description: "Méthodes d'audit et contrôle interne",
    },
    {
      title: "Gouvernance d'Entreprise",
      description: "Bonnes pratiques de gouvernance",
    },
    {
      title: "Éthique et Déontologie",
      description: "Code d'éthique et déontologie professionnelle",
    },
    {
      title: "Risques Opérationnels",
      description: "Identification et gestion des risques opérationnels",
    },
    {
      title: "Reporting Financier",
      description: "Normes comptables et reporting",
    },
    {
      title: "Contrôle des Risques",
      description: "Systèmes de contrôle et de surveillance",
    },
    {
      title: "Formation des Équipes",
      description: "Sensibilisation et formation à la conformité",
    },
    {
      title: "Veille Réglementaire",
      description: "Suivi des évolutions réglementaires",
    },
    {
      title: "Gestion des Incidents",
      description: "Procédures de gestion des incidents de conformité",
    },
  ],
  Technologie: [
    {
      title: "Développement Web Moderne",
      description: "Technologies web actuelles et bonnes pratiques",
    },
    {
      title: "Intelligence Artificielle",
      description: "Applications de l'IA en entreprise",
    },
    {
      title: "Cloud Computing",
      description: "Migration et gestion des infrastructures cloud",
    },
    {
      title: "Cybersécurité Avancée",
      description: "Protection avancée des systèmes d'information",
    },
    {
      title: "Data Science et Analytics",
      description: "Analyse de données et intelligence décisionnelle",
    },
    {
      title: "DevOps et Agilité",
      description: "Méthodes agiles et déploiement continu",
    },
    {
      title: "Blockchain et Cryptomonnaies",
      description: "Technologies blockchain et applications",
    },
    {
      title: "IoT et Objets Connectés",
      description: "Internet des objets et applications",
    },
    {
      title: "Transformation Digitale",
      description: "Stratégies de transformation numérique",
    },
    {
      title: "Architecture Logicielle",
      description: "Conception et architecture des systèmes",
    },
  ],
  Management: [
    {
      title: "Leadership et Management",
      description: "Compétences de leadership et gestion d'équipe",
    },
    {
      title: "Gestion de Projet Agile",
      description: "Méthodologies agiles de gestion de projet",
    },
    {
      title: "Communication Interpersonnelle",
      description: "Techniques de communication efficace",
    },
    {
      title: "Gestion du Changement",
      description: "Accompagnement des transformations organisationnelles",
    },
    {
      title: "Stratégie d'Entreprise",
      description: "Définition et mise en œuvre de stratégies",
    },
    {
      title: "Performance et Évaluation",
      description: "Gestion de la performance des équipes",
    },
    {
      title: "Négociation et Médiation",
      description: "Techniques de négociation et résolution de conflits",
    },
    {
      title: "Innovation et Créativité",
      description: "Favoriser l'innovation en entreprise",
    },
    {
      title: "Gestion du Stress",
      description: "Techniques de gestion du stress et du temps",
    },
    {
      title: "Développement des Talents",
      description: "Identification et développement des talents",
    },
  ],
  Assurance: [
    {
      title: "Gestion des Risques",
      description: "Identification et évaluation des risques assurantiels",
    },
    {
      title: "Produits d'Assurance",
      description: "Connaissance des différents produits d'assurance",
    },
    {
      title: "Réglementation Assurantielle",
      description: "Cadre réglementaire du secteur assurance",
    },
    {
      title: "Souscription et Tarification",
      description: "Techniques de souscription et de tarification",
    },
    {
      title: "Gestion des Sinistres",
      description: "Processus de gestion et de règlement des sinistres",
    },
    {
      title: "Assurance Digitale",
      description: "Transformation digitale du secteur assurance",
    },
    {
      title: "Cybersécurité et Assurance",
      description: "Risques cyber et solutions d'assurance",
    },
    {
      title: "Relation Client",
      description: "Gestion de la relation client en assurance",
    },
    {
      title: "Compliance Assurantielle",
      description: "Conformité réglementaire dans l'assurance",
    },
    {
      title: "Innovation en Assurance",
      description: "Nouveaux modèles et technologies en assurance",
    },
  ],
};

async function seedFormations() {
  try {
    console.log("🌱 Début du seeding des formations...");

    // Récupérer un utilisateur existant pour createdBy
    const existingUser = await prisma.user.findFirst({
      where: { isActive: true },
    });

    if (!existingUser) {
      console.error(
        "❌ Aucun utilisateur actif trouvé. Créez d'abord un utilisateur."
      );
      return;
    }

    console.log(`👤 Utilisateur trouvé: ${existingUser.email}`);

    // Récupérer tous les univers existants
    const universes = await prisma.universe.findMany({
      where: { isActive: true },
    });

    console.log(`📚 ${universes.length} univers trouvés`);

    // Créer les formations pour chaque univers
    for (const universe of universes) {
      console.log(
        `\n🎯 Création des formations pour l'univers: ${universe.name}`
      );

      const formations = formationsByUniverse[universe.name] || [];

      if (formations.length === 0) {
        console.log(
          `⚠️  Aucune formation définie pour l'univers: ${universe.name}`
        );
        continue;
      }

      for (let i = 0; i < formations.length; i++) {
        const formationData = formations[i];

        try {
          const formation = await prisma.formation.create({
            data: {
              title: formationData.title,
              description: formationData.description,
              duration: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
              isActive: true,
              hasQuiz: Math.random() > 0.3, // 70% ont un quiz
              quizRequired: Math.random() > 0.5, // 50% quiz obligatoire
              coverImage: null,
              createdBy: existingUser.id, // Utilisateur existant
              universeId: universe.id,
            },
          });

          // Créer le dossier pour cette formation
          createFormationFolder(formation.id, formation.title);

          console.log(`  ✅ ${i + 1}/10 - ${formation.title}`);
        } catch (error) {
          console.error(
            `  ❌ Erreur création formation ${formationData.title}:`,
            error.message
          );
        }
      }
    }

    // Créer quelques formations sans univers (FSU)
    console.log("\n📁 Création de formations sans univers (FSU)...");
    const fsuFormations = [
      {
        title: "Formation Générale 1",
        description: "Formation sans univers assigné",
      },
      {
        title: "Formation Générale 2",
        description: "Formation sans univers assigné",
      },
      {
        title: "Formation Générale 3",
        description: "Formation sans univers assigné",
      },
      {
        title: "Formation Générale 4",
        description: "Formation sans univers assigné",
      },
      {
        title: "Formation Générale 5",
        description: "Formation sans univers assigné",
      },
    ];

    for (const formationData of fsuFormations) {
      try {
        const formation = await prisma.formation.create({
          data: {
            title: formationData.title,
            description: formationData.description,
            duration: Math.floor(Math.random() * 120) + 30,
            isActive: true,
            hasQuiz: Math.random() > 0.3,
            quizRequired: Math.random() > 0.5,
            coverImage: null,
            createdBy: existingUser.id,
            universeId: null, // Sans univers
          },
        });

        // Créer le dossier pour cette formation FSU
        createFormationFolder(formation.id, formation.title);

        console.log(`  ✅ FSU - ${formationData.title}`);
      } catch (error) {
        console.error(
          `  ❌ Erreur création FSU ${formationData.title}:`,
          error.message
        );
      }
    }

    // Statistiques finales
    const totalFormations = await prisma.formation.count();
    const formationsWithUniverse = await prisma.formation.count({
      where: { universeId: { not: null } },
    });
    const formationsWithoutUniverse = await prisma.formation.count({
      where: { universeId: null },
    });

    console.log("\n📊 Statistiques finales:");
    console.log(`  📚 Total formations: ${totalFormations}`);
    console.log(`  🌍 Avec univers: ${formationsWithUniverse}`);
    console.log(`  📁 Sans univers (FSU): ${formationsWithoutUniverse}`);

    console.log("\n🎉 Seeding terminé avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeding
seedFormations();
