#!/usr/bin/env node

/**
 * Script pour créer un utilisateur de test pour BAI Consulting
 * Usage: node create-test-user.mjs
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db",
    },
  },
});

async function createTestUser() {
  try {
    console.log("🔧 Création d'un utilisateur de test...");

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: "admin@bai-consulting.com" },
    });

    if (existingUser) {
      console.log("✅ Utilisateur admin@bai-consulting.com existe déjà");
      console.log("📧 Email:", existingUser.email);
      console.log("👤 Nom:", existingUser.firstName, existingUser.lastName);
      console.log("🔑 Rôle:", existingUser.role);
      return;
    }

    // Créer l'utilisateur de test
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const user = await prisma.user.create({
      data: {
        email: "admin@bai-consulting.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "BAI",
        role: "SUPER_ADMIN",
        isActive: true,
        department: "Administration",
        phone: "+33 1 23 45 67 89",
      },
    });

    console.log("✅ Utilisateur de test créé avec succès !");
    console.log("📧 Email:", user.email);
    console.log("🔑 Mot de passe: admin123");
    console.log("👤 Nom:", user.firstName, user.lastName);
    console.log("🔑 Rôle:", user.role);
    console.log("");
    console.log("🌐 Vous pouvez maintenant vous connecter avec :");
    console.log("   Email: admin@bai-consulting.com");
    console.log("   Mot de passe: admin123");
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'utilisateur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
