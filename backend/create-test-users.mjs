import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('👥 Création des utilisateurs de test...\n');

    // Récupérer la banque de test
    const bank = await prisma.bank.findFirst({
      where: { code: 'TEST001' }
    });

    if (!bank) {
      console.log('❌ Aucune banque trouvée. Créez d\'abord une banque.');
      return;
    }

    // Créer des utilisateurs collaborateurs
    const users = [
      {
        email: 'collaborateur1@test.com',
        password: 'password123',
        firstName: 'Marie',
        lastName: 'Dubois',
        role: 'COLLABORATOR',
        bankId: bank.id
      },
      {
        email: 'collaborateur2@test.com',
        password: 'password123',
        firstName: 'Pierre',
        lastName: 'Martin',
        role: 'COLLABORATOR',
        bankId: bank.id
      },
      {
        email: 'collaborateur3@test.com',
        password: 'password123',
        firstName: 'Sophie',
        lastName: 'Bernard',
        role: 'COLLABORATOR',
        bankId: bank.id
      },
      {
        email: 'admin.bank@test.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'Bank',
        role: 'BANK_ADMIN',
        bankId: bank.id
      }
    ];

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          bankId: userData.bankId,
          isActive: true
        }
      });

      console.log(`✅ Utilisateur créé: ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    }

    console.log('\n🎉 Création des utilisateurs terminée !');
    console.log('\n📋 Identifiants de connexion:');
    console.log('Admin: admin@bai-consulting.com / admin123');
    console.log('Collaborateur 1: collaborateur1@test.com / password123');
    console.log('Collaborateur 2: collaborateur2@test.com / password123');
    console.log('Collaborateur 3: collaborateur3@test.com / password123');
    console.log('Admin Bank: admin.bank@test.com / password123');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
