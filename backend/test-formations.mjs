import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFormations() {
  try {
    console.log('🔍 Vérification des formations en base de données...\n');
    
    // Compter le nombre total de formations
    const totalCount = await prisma.formation.count();
    console.log(`📊 Nombre total de formations: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('❌ Aucune formation trouvée en base de données');
      return;
    }
    
    // Récupérer toutes les formations avec leurs détails
    const formations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        isActive: true,
        hasQuiz: true,
        quizRequired: true,
        coverImage: true,
        code: true,
        pedagogicalModality: true,
        organization: true,
        prerequisites: true,
        objectives: true,
        detailedProgram: true,
        targetAudience: true,
        createdAt: true,
        updatedAt: true,
        content: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            contentType: true,
            sectionId: true,
            order: true,
            duration: true,
            fileUrl: true,
            fileSize: true,
            coverImage: true,
            metadata: true,
          },
          orderBy: { order: "asc" },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            passingScore: true,
            timeLimit: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    console.log(`\n✅ Formations récupérées: ${formations.length}`);
    
    formations.forEach((formation, index) => {
      console.log(`\n📚 Formation ${index + 1}:`);
      console.log(`   ID: ${formation.id}`);
      console.log(`   Titre: ${formation.title}`);
      console.log(`   Description: ${formation.description || 'Aucune'}`);
      console.log(`   Durée: ${formation.duration} min`);
      console.log(`   Active: ${formation.isActive ? 'Oui' : 'Non'}`);
      console.log(`   Quiz requis: ${formation.quizRequired ? 'Oui' : 'Non'}`);
      console.log(`   Code: ${formation.code || 'Non défini'}`);
      console.log(`   Modalité: ${formation.pedagogicalModality || 'Non définie'}`);
      console.log(`   Contenu: ${formation.content.length} éléments`);
      console.log(`   Quiz: ${formation.quiz ? 'Oui' : 'Non'}`);
      console.log(`   Créée le: ${formation.createdAt}`);
    });
    
    // Test de la fonction getAllFormationsSimple
    console.log('\n🧪 Test de la fonction getAllFormationsSimple...');
    
    const whereClause = {
      isActive: true,
    };
    
    const testFormations = await prisma.formation.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        isActive: true,
        hasQuiz: true,
        quizRequired: true,
        coverImage: true,
        code: true,
        pedagogicalModality: true,
        organization: true,
        prerequisites: true,
        objectives: true,
        detailedProgram: true,
        targetAudience: true,
        createdAt: true,
        updatedAt: true,
        content: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            contentType: true,
            sectionId: true,
            order: true,
            duration: true,
            fileUrl: true,
            fileSize: true,
            coverImage: true,
            metadata: true,
          },
          orderBy: { order: "asc" },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            passingScore: true,
            timeLimit: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    console.log(`✅ Formations actives trouvées: ${testFormations.length}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFormations();
