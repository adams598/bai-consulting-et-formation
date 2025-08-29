import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignFormationsToBanks() {
  try {
    console.log('🔄 Assignation de formations aux banques...\n');

    // 1. Récupérer toutes les banques
    const banks = await prisma.bank.findMany({
      where: { isArchived: false },
    });
    console.log(`🏦 Banques trouvées: ${banks.length}`);

    // 2. Récupérer toutes les formations
    const formations = await prisma.formation.findMany({
      where: { isActive: true },
    });
    console.log(`📚 Formations trouvées: ${formations.length}`);

    // 3. Récupérer un utilisateur admin pour les assignations
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['SUPER_ADMIN', 'BANK_ADMIN'] },
      },
    });

    if (!adminUser) {
      console.log('❌ Aucun utilisateur admin trouvé');
      return;
    }

    console.log(`👤 Utilisateur admin: ${adminUser.firstName} ${adminUser.lastName}`);

    // 4. Assigner des formations aux banques
    const assignments = [
      { bankIndex: 0, formationIndices: [0, 1, 2] }, // BNP Paribas
      { bankIndex: 1, formationIndices: [1, 3, 4] }, // BPCE
      { bankIndex: 2, formationIndices: [2, 5, 6] }, // Banque de Test
    ];

    for (const assignment of assignments) {
      const bank = banks[assignment.bankIndex];
      if (!bank) continue;

      console.log(`\n🏦 Assignation à ${bank.name}:`);

      for (const formationIndex of assignment.formationIndices) {
        const formation = formations[formationIndex];
        if (!formation) continue;

        // Vérifier si l'assignation existe déjà
        const existingAssignment = await prisma.bankFormation.findFirst({
          where: {
            bankId: bank.id,
            formationId: formation.id,
          },
        });

        if (existingAssignment) {
          console.log(`   ✅ ${formation.title} - Déjà assignée`);
          continue;
        }

        // Créer l'assignation
        const bankFormation = await prisma.bankFormation.create({
          data: {
            bankId: bank.id,
            formationId: formation.id,
            assignedBy: adminUser.id,
            isMandatory: Math.random() > 0.5, // Aléatoire
          },
        });

        console.log(`   ➕ ${formation.title} - Assignée (ID: ${bankFormation.id})`);
      }
    }

    console.log('\n✅ Assignations terminées!');

    // 5. Afficher un résumé
    console.log('\n📊 Résumé des assignations:');
    for (const bank of banks) {
      const formationCount = await prisma.bankFormation.count({
        where: { bankId: bank.id },
      });
      console.log(`   ${bank.name}: ${formationCount} formation(s)`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignFormationsToBanks();

