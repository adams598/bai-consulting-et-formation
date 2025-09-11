import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Données des univers
const universesData = [
  {
    name: 'Développement Web',
    description: 'Formations pour le développement d\'applications web modernes',
    color: '#3B82F6', // Bleu
    icon: 'globe'
  },
  {
    name: 'Data Science',
    description: 'Formations en science des données et analyse',
    color: '#10B981', // Vert
    icon: 'bar-chart'
  },
  {
    name: 'Cybersécurité',
    description: 'Formations en sécurité informatique et protection des données',
    color: '#EF4444', // Rouge
    icon: 'shield'
  },
  {
    name: 'DevOps',
    description: 'Formations en développement et opérations',
    color: '#F59E0B', // Orange
    icon: 'settings'
  },
  {
    name: 'Intelligence Artificielle',
    description: 'Formations en IA et machine learning',
    color: '#8B5CF6', // Violet
    icon: 'brain'
  }
];

async function seedUniverses() {
  try {
    console.log('🌱 Début du seeding des univers...');

    // Vérifier si des univers existent déjà
    const existingUniverses = await prisma.universe.findMany();
    
    if (existingUniverses.length > 0) {
      console.log(`📚 ${existingUniverses.length} univers existants trouvés`);
      console.log('Univers existants:');
      existingUniverses.forEach(universe => {
        console.log(`  - ${universe.name} (${universe.color})`);
      });
      return;
    }

    // Créer les univers
    for (const universeData of universesData) {
      try {
        const universe = await prisma.universe.create({
          data: universeData
        });
        console.log(`✅ Univers créé: ${universe.name} (${universe.color})`);
      } catch (error) {
        console.error(`❌ Erreur création univers ${universeData.name}:`, error.message);
      }
    }

    console.log('\n🎉 Seeding des univers terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du seeding des univers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeding
seedUniverses();
