import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Formations par univers
const formationsByUniverse = {
  "Conformité Bancaire": [
    {
      title: "Conformité Bancaire",
      description: "Formation sur la conformité et la réglementation bancaire",
      duration: 120,
    },
    {
      title: "Anti-Blanchiment de Capitaux",
      description:
        "Lutte contre le blanchiment et le financement du terrorisme",
      duration: 90,
    },
    {
      title: "Audit Interne et Contrôle",
      description: "Méthodes d'audit et contrôle interne",
      duration: 150,
    },
    {
      title: "Contrôle des Risques",
      description: "Systèmes de contrôle et de surveillance",
      duration: 100,
    },
  ],
  "Technologies Financières": [
    {
      title: "Fintech et Innovation",
      description: "Technologies financières et innovation bancaire",
      duration: 120,
    },
    {
      title: "Blockchain et Cryptomonnaies",
      description: "Technologies blockchain et applications",
      duration: 180,
    },
    {
      title: "Intelligence Artificielle",
      description: "Applications de l'IA en entreprise",
      duration: 150,
    },
    {
      title: "Data Science et Analytics",
      description: "Analyse de données et intelligence décisionnelle",
      duration: 200,
    },
  ],
  "Développement Professionnel": [
    {
      title: "Gestion de Portefeuille",
      description: "Stratégies d'investissement et gestion d'actifs",
      duration: 120,
    },
    {
      title: "Gestion du Stress",
      description: "Techniques de gestion du stress et du temps",
      duration: 90,
    },
    {
      title: "Formation Générale 3",
      description: "Formation générale de développement professionnel",
      duration: 100,
    },
  ],
  "Technologies Digitales": [
    {
      title: "Développement Web Moderne",
      description: "Technologies web actuelles et bonnes pratiques",
      duration: 180,
    },
    {
      title: "Cloud Computing",
      description: "Migration et gestion des infrastructures cloud",
      duration: 150,
    },
    {
      title: "DevOps et Agilité",
      description: "Méthodes agiles et déploiement continu",
      duration: 120,
    },
    {
      title: "Cybersécurité Avancée",
      description: "Protection avancée des systèmes d'information",
      duration: 200,
    },
    {
      title: "IoT et Objets Connectés",
      description: "Internet des objets et applications",
      duration: 100,
    },
    {
      title: "Transformation Digitale",
      description: "Stratégies de transformation numérique",
      duration: 150,
    },
  ],
  "Assurance et Sécurité": [
    {
      title: "Assurance Digitale",
      description: "Transformation digitale du secteur assurance",
      duration: 120,
    },
  ],
  "Architecture et Infrastructure": [
    {
      title: "Architecture Logicielle",
      description: "Conception et architecture des systèmes",
      duration: 180,
    },
  ],
};

async function createFormationsForUniverses() {
  try {
    console.log("🌱 Création des formations pour chaque univers...");

    // Récupérer l'utilisateur admin
    const adminUser = await prisma.user.findFirst({
      where: { email: "admin@bai-consulting.com" },
    });

    if (!adminUser) {
      console.error("❌ Utilisateur admin non trouvé");
      return;
    }

    console.log(`👤 Utilisateur admin trouvé: ${adminUser.email}`);

    // Récupérer tous les univers
    const universes = await prisma.universe.findMany({
      where: { isActive: true },
    });

    console.log(`📚 ${universes.length} univers trouvés`);

    let totalFormations = 0;

    // Créer les formations pour chaque univers
    for (const universe of universes) {
      console.log(`\n🎯 Création des formations pour: ${universe.name}`);

      const formations = formationsByUniverse[universe.name] || [];

      if (formations.length === 0) {
        console.log(`⚠️  Aucune formation définie pour: ${universe.name}`);
        continue;
      }

      for (let i = 0; i < formations.length; i++) {
        const formationData = formations[i];

        try {
          const formation = await prisma.formation.create({
            data: {
              title: formationData.title,
              description: formationData.description,
              duration: formationData.duration,
              isActive: true,
              hasQuiz: Math.random() > 0.3, // 70% ont un quiz
              quizRequired: Math.random() > 0.5, // 50% quiz obligatoire
              coverImage: null,
              createdBy: adminUser.id,
              universeId: universe.id,
            },
          });

          // Créer la relation Universe-Formation
          await prisma.universeFormation.create({
            data: {
              universeId: universe.id,
              formationId: formation.id,
              order: i,
            },
          });

          console.log(
            `  ✅ ${i + 1}/${formations.length} - ${formation.title}`
          );
          totalFormations++;
        } catch (error) {
          console.error(
            `  ❌ Erreur création formation ${formationData.title}:`,
            error.message
          );
        }
      }
    }

    // Statistiques finales
    const totalFormationsInDb = await prisma.formation.count();
    const formationsWithUniverse = await prisma.formation.count({
      where: { universeId: { not: null } },
    });
    const totalRelations = await prisma.universeFormation.count();

    console.log("\n📊 Statistiques finales:");
    console.log(`  📚 Total formations créées: ${totalFormations}`);
    console.log(`  📚 Total formations en BDD: ${totalFormationsInDb}`);
    console.log(`  🌍 Avec univers: ${formationsWithUniverse}`);
    console.log(`  🔗 Relations Universe-Formation: ${totalRelations}`);

    console.log("\n🎉 Création des formations terminée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de la création des formations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la création
createFormationsForUniverses();
