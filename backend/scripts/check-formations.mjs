import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFormations() {
  try {
    console.log('🔍 Vérification des formations existantes...\n');

    // Vérifier les utilisateurs admin
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { role: 'BANK_ADMIN' }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true
      }
    });

    console.log('👥 Utilisateurs admin trouvés:');
    adminUsers.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`);
    });

    if (adminUsers.length === 0) {
      console.log('\n❌ Aucun utilisateur admin trouvé !');
      return;
    }

    // Vérifier les formations existantes
    const formations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        isActive: true,
        hasQuiz: true,
        createdBy: true
      }
    });

    console.log(`\n📚 Formations existantes: ${formations.length}`);
    formations.forEach(formation => {
      console.log(`  - ${formation.title} (${formation.duration} min, Quiz: ${formation.hasQuiz ? 'Oui' : 'Non'})`);
    });

    // Vérifier les banques
    const banks = await prisma.bank.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true
      }
    });

    console.log(`\n🏦 Banques existantes: ${banks.length}`);
    banks.forEach(bank => {
      console.log(`  - ${bank.name} (${bank.code}) - ${bank.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFormations();
