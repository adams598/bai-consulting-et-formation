import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: "admin@bai-consulting.com" },
    });

    if (existingUser) {
      console.log("L'utilisateur administrateur existe déjà");
      return;
    }

    // Créer une banque de test
    const bank = await prisma.bank.create({
      data: {
        name: "Banque de Test",
        code: "TEST001",
        isActive: true,
      },
    });

    console.log("Banque créée:", bank);

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Créer l'utilisateur administrateur
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@bai-consulting.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "BAI",
        role: "SUPER_ADMIN",
        bankId: bank.id,
        isActive: true,
      },
    });

    console.log("Utilisateur administrateur créé:", {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      bankId: adminUser.bankId,
    });

    console.log("\nIdentifiants de connexion:");
    console.log("Email: admin@bai-consulting.com");
    console.log("Mot de passe: admin123");
  } catch (error) {
    console.error("Erreur lors de la création:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
