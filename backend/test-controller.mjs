import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testController() {
  try {
    console.log('🧪 Test direct de la fonction getAllFormationsSimple...\n');
    
    // Simulation des paramètres de requête
    const req = {
      query: {
        search: "",
        isActive: true
      }
    };
    
    // Simulation de la réponse
    const res = {
      json: (data) => {
        console.log('✅ Réponse générée:');
        console.log('Success:', data.success);
        console.log('Nombre de formations:', data.data?.length || 0);
        if (data.data && data.data.length > 0) {
          console.log('Première formation:', data.data[0].title);
          console.log('Champs disponibles:', Object.keys(data.data[0]));
        }
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Erreur ${code}:`, data);
        }
      })
    };
    
    // Import et test de la fonction
    const { formationsController } = await import('./src/controllers/admin.controllers.js');
    await formationsController.getAllFormationsSimple(req, res);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testController();

