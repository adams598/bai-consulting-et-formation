import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = "dev-secret-key-123";
const ADMIN_USER_ID = "cmfz6h1ss0000wxin8jlkyn9f";

async function createValidSession() {
  try {
    console.log("🔑 Création d'une session valide...");

    // Créer un token JWT
    const token = jwt.sign(
      {
        userId: ADMIN_USER_ID,
        role: "SUPER_ADMIN",
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`✅ Token JWT créé: ${token.substring(0, 50)}...`);

    // Créer une session dans la base de données
    const session = await prisma.userSession.create({
      data: {
        userId: ADMIN_USER_ID,
        token: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    console.log(`✅ Session créée avec l'ID: ${session.id}`);
    console.log(`⏰ Expire le: ${session.expiresAt.toLocaleString("fr-FR")}`);

    console.log(`\n🧪 Test de l'API calendrier:`);
    console.log(
      `curl -X GET "http://localhost:3000/api/calendar-integration/google/auth-url" -H "Authorization: Bearer ${token}"`
    );
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createValidSession();
