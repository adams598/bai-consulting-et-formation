import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Formations par univers
const formationsByUniverse = {
  'Finance': [
    { title: 'Gestion des Risques Financiers', duration: 120, description: 'Apprenez à identifier et gérer les risques financiers' },
    { title: 'Analyse Financière Avancée', duration: 90, description: 'Techniques d\'analyse financière approfondie' },
    { title: 'Conformité Réglementaire', duration: 150, description: 'Réglementations bancaires et conformité' },
    { title: 'Gestion de Portefeuille', duration: 180, description: 'Stratégies de gestion de portefeuille' },
    { title: 'Finance Digitale', duration: 100, description: 'Transformation digitale en finance' },
    { title: 'Audit Interne', duration: 140, description: 'Méthodes et techniques d\'audit interne' },
    { title: 'Anti-Blanchiment', duration: 80, description: 'Lutte contre le blanchiment d\'argent' },
    { title: 'Crédit et Risque', duration: 110, description: 'Évaluation du crédit et gestion des risques' },
    { title: 'Trésorerie Bancaire', duration: 95, description: 'Gestion de la trésorerie bancaire' },
    { title: 'Produits Financiers', duration: 130, description: 'Connaissance des produits financiers' }
  ],
  'Digital': [
    { title: 'Transformation Digitale', duration: 120, description: 'Stratégies de transformation digitale' },
    { title: 'Cybersécurité Bancaire', duration: 160, description: 'Sécurité informatique dans le secteur bancaire' },
    { title: 'Blockchain et Cryptomonnaies', duration: 140, description: 'Technologies blockchain et cryptomonnaies' },
    { title: 'Intelligence Artificielle', duration: 180, description: 'IA appliquée au secteur bancaire' },
    { title: 'Data Analytics', duration: 150, description: 'Analyse de données bancaires' },
    { title: 'API et Intégration', duration: 100, description: 'Développement d\'APIs bancaires' },
    { title: 'Cloud Computing', duration: 110, description: 'Solutions cloud pour les banques' },
    { title: 'Mobile Banking', duration: 90, description: 'Développement d\'applications mobiles bancaires' },
    { title: 'UX/UI Banking', duration: 85, description: 'Design d\'expérience utilisateur bancaire' },
    { title: 'DevOps Bancaire', duration: 130, description: 'DevOps dans l\'environnement bancaire' }
  ],
  'Management': [
    { title: 'Leadership Bancaire', duration: 120, description: 'Compétences de leadership dans le secteur bancaire' },
    { title: 'Gestion d\'Équipe', duration: 100, description: 'Techniques de gestion d\'équipe' },
    { title: 'Communication Interne', duration: 80, description: 'Améliorer la communication interne' },
    { title: 'Gestion du Stress', duration: 70, description: 'Techniques de gestion du stress professionnel' },
    { title: 'Négociation Commerciale', duration: 110, description: 'Techniques de négociation commerciale' },
    { title: 'Service Client Excellence', duration: 90, description: 'Excellence dans le service client' },
    { title: 'Innovation Managériale', duration: 100, description: 'Encourager l\'innovation en équipe' },
    { title: 'Performance Individuelle', duration: 85, description: 'Optimiser la performance individuelle' },
    { title: 'Gestion du Changement', duration: 120, description: 'Manager le changement organisationnel' },
    { title: 'Coaching d\'Équipe', duration: 95, description: 'Techniques de coaching d\'équipe' }
  ],
  'Sécurité': [
    { title: 'Sécurité Opérationnelle', duration: 140, description: 'Sécurité des opérations bancaires' },
    { title: 'Fraude et Prévention', duration: 120, description: 'Détection et prévention de la fraude' },
    { title: 'Sécurité Informatique', duration: 160, description: 'Protection des systèmes informatiques' },
    { title: 'Conformité Sécuritaire', duration: 100, description: 'Conformité en matière de sécurité' },
    { title: 'Gestion des Incidents', duration: 90, description: 'Gestion des incidents de sécurité' },
    { title: 'Audit Sécurité', duration: 110, description: 'Audit des systèmes de sécurité' },
    { title: 'Formation Sécurité', duration: 80, description: 'Formation du personnel à la sécurité' },
    { title: 'Risques Opérationnels', duration: 130, description: 'Identification des risques opérationnels' },
    { title: 'Continuité d\'Activité', duration: 100, description: 'Plan de continuité d\'activité' },
    { title: 'Sécurité Physique', duration: 75, description: 'Sécurité physique des agences' }
  ],
  'Innovation': [
    { title: 'Innovation Fintech', duration: 150, description: 'Innovation dans les technologies financières' },
    { title: 'Design Thinking', duration: 100, description: 'Méthodologie Design Thinking' },
    { title: 'Agilité Bancaire', duration: 120, description: 'Méthodes agiles dans le secteur bancaire' },
    { title: 'Innovation Produit', duration: 110, description: 'Développement de nouveaux produits' },
    { title: 'Partnership Innovation', duration: 90, description: 'Partenariats d\'innovation' },
    { title: 'Veille Technologique', duration: 80, description: 'Veille technologique bancaire' },
    { title: 'Prototypage Rapide', duration: 85, description: 'Techniques de prototypage rapide' },
    { title: 'Innovation Culture', duration: 95, description: 'Créer une culture d\'innovation' },
    { title: 'Startup Collaboration', duration: 100, description: 'Collaboration avec les startups' },
    { title: 'Innovation Durable', duration: 120, description: 'Innovation et développement durable' }
  ]
};

async function createFormationsPerUniverse() {
  try {
    console.log('🏗️ Création de 10 formations par univers...\n');

    // Récupérer l'utilisateur admin
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!admin) {
      console.log('❌ Aucun utilisateur admin trouvé.');
      return;
    }

    // Récupérer tous les univers
    const universes = await prisma.universe.findMany();
    console.log(`📚 Univers trouvés: ${universes.length}`);

    let totalFormations = 0;

    for (const universe of universes) {
      console.log(`\n🎯 Création des formations pour: ${universe.name}`);
      
      const formations = formationsByUniverse[universe.name] || [];
      
      if (formations.length === 0) {
        console.log(`⚠️ Aucune formation définie pour l'univers: ${universe.name}`);
        continue;
      }

      for (const formationData of formations) {
        try {
          const formation = await prisma.formation.create({
            data: {
              title: formationData.title,
              description: formationData.description,
              duration: formationData.duration,
              universe: {
                connect: { id: universe.id }
              },
              creator: {
                connect: { id: admin.id }
              },
              isActive: true,
              hasQuiz: Math.random() > 0.3, // 70% des formations ont un quiz
              coverImage: null
            }
          });

          console.log(`  ✅ ${formation.title} (${formation.duration} min)`);
          totalFormations++;
        } catch (error) {
          console.log(`  ❌ Erreur création ${formationData.title}: ${error.message}`);
        }
      }
    }

    console.log(`\n🎉 Création terminée !`);
    console.log(`📊 Total formations créées: ${totalFormations}`);
    console.log(`📚 Répartition par univers:`);

    // Afficher le récapitulatif
    for (const universe of universes) {
      const count = await prisma.formation.count({
        where: { universeId: universe.id }
      });
      console.log(`  - ${universe.name}: ${count} formations`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des formations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFormationsPerUniverse();
