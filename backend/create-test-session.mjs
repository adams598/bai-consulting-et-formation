import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

async function createTestSession() {
  try {
    console.log("🔧 Création d'une session de test...\n");

    const userId = "cmg0q85sn000013s1um1c82sb"; // ID utilisateur admin
    const JWT_SECRET = "dev-secret-key-123";

    // Générer un token JWT
    const token = jwt.sign(
      { userId: userId, role: "SUPER_ADMIN" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`Token généré: ${token.substring(0, 50)}...`);

    // Supprimer les anciennes sessions de test
    await prisma.userSession.deleteMany({
      where: {
        userId: userId,
        token: { startsWith: "test-" },
      },
    });

    // Créer une nouvelle session
    const session = await prisma.userSession.create({
      data: {
        userId: userId,
        token: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        lastActivity: new Date(),
        userAgent: "Test Script",
        ipAddress: "127.0.0.1",
      },
    });

    console.log("✅ Session créée avec succès !");
    console.log(`Session ID: ${session.id}`);
    console.log(`Expire le: ${session.expiresAt.toLocaleString("fr-FR")}`);
    console.log("");
    console.log("🔑 Token à utiliser pour les tests :");
    console.log(token);
    console.log("");
    console.log("📋 Headers à utiliser :");
    console.log(`Authorization: Bearer ${token}`);

    return token;
  } catch (error) {
    console.error("❌ Erreur lors de la création de la session:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

createTestSession();
