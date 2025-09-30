import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testFrontendData() {
  try {
    console.log("🔍 Test des données pour le frontend...");

    // 1. Récupérer toutes les formations avec leurs détails
    const formations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        universeId: true,
        isOpportunity: true,
        isActive: true,
        duration: true,
        description: true,
        objectives: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Formations à afficher dans le frontend (${formations.length}):`);
    
    formations.forEach((formation, index) => {
      console.log(`\n${index + 1}. ${formation.title}`);
      console.log(`   - ID: ${formation.id}`);
      console.log(`   - Univers ID: ${formation.universeId || 'null'}`);
      console.log(`   - Opportunité: ${formation.isOpportunity}`);
      console.log(`   - Actif: ${formation.isActive}`);
      console.log(`   - Durée: ${formation.duration} min`);
      console.log(`   - Description: ${formation.description ? 'OK' : 'MANQUANTE'}`);
      console.log(`   - Objectifs: ${formation.objectives ? 'OK' : 'MANQUANTS'}`);
    });

    // 2. Simuler la logique de groupement du frontend
    console.log("\n🎯 Simulation de la logique de groupement du frontend:");
    
    // Section opportunités commerciales
    const opportunityFormations = formations.filter(f => f.isOpportunity);
    console.log(`\n📁 Traitement des opportunités commerciales (${opportunityFormations.length} formations):`);
    opportunityFormations.forEach(f => {
      console.log(`   🎥 ${f.title}`);
    });
    
    // Formations d'univers
    const universeFormations = formations.filter(f => !f.isOpportunity);
    console.log(`\n📁 Formations d'univers (${universeFormations.length} formations):`);
    
    const formationsByUniverse = {};
    universeFormations.forEach(formation => {
      const universeId = formation.universeId || 'mes-formations';
      if (!formationsByUniverse[universeId]) {
        formationsByUniverse[universeId] = [];
      }
      formationsByUniverse[universeId].push(formation);
    });
    
    Object.entries(formationsByUniverse).forEach(([universeId, universeFormations]) => {
      const universeName = universeId === 'mes-formations' ? 'Mes Formations' : 
                          universeId === 'immobilier' ? 'Immobilier' : 
                          `Univers ${universeId}`;
      console.log(`   📁 ${universeName} (${universeFormations.length} formations):`);
      universeFormations.forEach(f => {
        console.log(`     📚 ${f.title}`);
      });
    });

    // 3. Vérifier que les données sont cohérentes
    console.log("\n🔍 Vérifications:");
    
    // Vérifier qu'il n'y a pas de formations orphelines
    const orphanFormations = formations.filter(f => !f.isOpportunity && !f.universeId);
    if (orphanFormations.length > 0) {
      console.log(`   ⚠️ ${orphanFormations.length} formations orphelines détectées`);
      orphanFormations.forEach(f => console.log(`     - ${f.title}`));
    } else {
      console.log("   ✅ Aucune formation orpheline");
    }
    
    // Vérifier que toutes les formations ont des descriptions/objectifs appropriés
    const formationsSansDescription = formations.filter(f => !f.isOpportunity && (!f.description || !f.objectives));
    if (formationsSansDescription.length > 0) {
      console.log(`   ⚠️ ${formationsSansDescription.length} formations d'univers sans description/objectifs`);
      formationsSansDescription.forEach(f => console.log(`     - ${f.title}`));
    } else {
      console.log("   ✅ Toutes les formations d'univers ont description et objectifs");
    }

    console.log("\n✅ Test terminé ! Les données sont prêtes pour le frontend.");

  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendData();

