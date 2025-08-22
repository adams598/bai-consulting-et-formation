import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Initialisation de la base de données...");

  try {
    // Nettoyer toutes les données existantes dans le bon ordre
    console.log("🧹 Nettoyage de la base de données...");

    // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
    try {
      await prisma.quizAnswer.deleteMany();
      console.log("   ✅ QuizAnswer supprimées");
    } catch (e) {
      console.log("   ⚠️ QuizAnswer: modèle non trouvé");
    }

    try {
      await prisma.quizQuestion.deleteMany();
      console.log("   ✅ QuizQuestion supprimées");
    } catch (e) {
      console.log("   ⚠️ QuizQuestion: modèle non trouvé");
    }

    try {
      await prisma.quiz.deleteMany();
      console.log("   ✅ Quiz supprimés");
    } catch (e) {
      console.log("   ⚠️ Quiz: modèle non trouvé");
    }

    try {
      await prisma.userProgress.deleteMany();
      console.log("   ✅ UserProgress supprimées");
    } catch (e) {
      console.log("   ⚠️ UserProgress: modèle non trouvé");
    }

    try {
      await prisma.formationAssignment.deleteMany();
      console.log("   ✅ FormationAssignment supprimées");
    } catch (e) {
      console.log("   ⚠️ FormationAssignment: modèle non trouvé");
    }

    try {
      await prisma.formationContent.deleteMany();
      console.log("   ✅ FormationContent supprimées");
    } catch (e) {
      console.log("   ⚠️ FormationContent: modèle non trouvé");
    }

    try {
      await prisma.notification.deleteMany();
      console.log("   ✅ Notification supprimées");
    } catch (e) {
      console.log("   ⚠️ Notification: modèle non trouvé");
    }

    try {
      await prisma.userSession.deleteMany();
      console.log("   ✅ UserSession supprimées");
    } catch (e) {
      console.log("   ⚠️ UserSession: modèle non trouvé");
    }

    try {
      await prisma.formation.deleteMany();
      console.log("   ✅ Formation supprimées");
    } catch (e) {
      console.log("   ⚠️ Formation: modèle non trouvé");
    }

    try {
      await prisma.user.deleteMany();
      console.log("   ✅ User supprimés");
    } catch (e) {
      console.log("   ⚠️ User: modèle non trouvé");
    }

    try {
      await prisma.bank.deleteMany();
      console.log("   ✅ Bank supprimées");
    } catch (e) {
      console.log("   ⚠️ Bank: modèle non trouvé");
    }

    console.log("✅ Base de données nettoyée");

    // Créer UNIQUEMENT l'utilisateur super admin
    console.log("👤 Création de l'utilisateur super admin...");
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const superAdmin = await prisma.user.create({
      data: {
        email: "admin@bai-consulting.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "BAI",
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log("✅ Super admin créé avec succès !");
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Mot de passe: admin123`);
    console.log(`   Rôle: ${superAdmin.role}`);
    console.log("");
    console.log("🎯 Instructions:");
    console.log("   1. Connectez-vous avec ces identifiants");
    console.log("   2. Créez vos premières banques");
    console.log("   3. Créez les administrateurs de banque");
    console.log("   4. Créez les formations");
    console.log("   5. Créez les collaborateurs");
    console.log("");
    console.log("🚀 La plateforme est prête à être utilisée !");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors de l'initialisation:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
