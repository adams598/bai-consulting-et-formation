import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createLearnerUsers() {
  try {
    console.log("👥 Création d'utilisateurs apprenants de test...\n");

    // Créer ou récupérer une banque de test
    let bank = await prisma.bank.findFirst({
      where: { code: "TEST001" },
    });

    if (!bank) {
      console.log("🏦 Création d'une banque de test...");
      bank = await prisma.bank.create({
        data: {
          name: "Banque de Test",
          code: "TEST001",
          isActive: true,
        },
      });
      console.log("✅ Banque créée:", bank.name);
    } else {
      console.log("✅ Banque existante:", bank.name);
    }

    // Créer des apprenants de test
    const learners = [
      {
        email: "marie.martin@test.com",
        password: "learner123",
        firstName: "Marie",
        lastName: "Martin",
        department: "Conseillère Clientèle",
        phone: "06 12 34 56 78",
      },
      {
        email: "pierre.durand@test.com",
        password: "learner123",
        firstName: "Pierre",
        lastName: "Durand",
        department: "Chargé de Clientèle",
        phone: "06 98 76 54 32",
      },
      {
        email: "sophie.bernard@test.com",
        password: "learner123",
        firstName: "Sophie",
        lastName: "Bernard",
        department: "Responsable Commercial",
        phone: "06 55 44 33 22",
      },
      {
        email: "thomas.petit@test.com",
        password: "learner123",
        firstName: "Thomas",
        lastName: "Petit",
        department: "Conseiller Bancaire",
        phone: "06 77 88 99 00",
      },
    ];

    console.log("👤 Création des apprenants...");

    for (const learnerData of learners) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: learnerData.email },
      });

      if (existingUser) {
        console.log(`   ⚠️ ${learnerData.email} existe déjà`);
        continue;
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(learnerData.password, 10);

      // Créer l'apprenant
      const learner = await prisma.user.create({
        data: {
          email: learnerData.email,
          password: hashedPassword,
          firstName: learnerData.firstName,
          lastName: learnerData.lastName,
          role: "LEARNER",
          department: learnerData.department,
          phone: learnerData.phone,
          bankId: bank.id,
          isActive: true,
        },
      });

      console.log(`   ✅ ${learner.firstName} ${learner.lastName} créé(e)`);
    }

    console.log("\n🎓 IDENTIFIANTS DE CONNEXION APPRENANTS:");
    console.log("==========================================");
    learners.forEach((learner, index) => {
      console.log(`\n${index + 1}. ${learner.firstName} ${learner.lastName}`);
      console.log(`   Email: ${learner.email}`);
      console.log(`   Mot de passe: ${learner.password}`);
      console.log(`   Poste: ${learner.department}`);
    });

    console.log("\n🌐 POUR SE CONNECTER:");
    console.log("1. Aller sur: http://localhost:3001/apprenant/connexion");
    console.log("2. Utiliser un des emails ci-dessus");
    console.log("3. Mot de passe: learner123");

    console.log("\n✅ Utilisateurs apprenants créés avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la création des apprenants:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createLearnerUsers();
