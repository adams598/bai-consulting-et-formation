import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const prisma = new PrismaClient();

async function testApiMariline() {
  try {
    console.log("🧪 Test de l'API formations pour mariline@bai.com...");

    // 1. Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: "mariline@bai.com" },
    });

    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return;
    }

    console.log(`✅ Utilisateur: ${user.email} (ID: ${user.id})`);

    // 2. Créer un token JWT valide
    const token = jwt.sign(
      { userId: user.id }, // Attention: le middleware attend userId dans le token
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    console.log("🔑 Token JWT créé");

    // 3. Créer une session valide
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 heure

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: token,
        expiresAt: expiresAt,
        ipAddress: "127.0.0.1",
        userAgent: "Test Script",
      },
    });

    console.log("🔐 Session créée");

    // 4. Tester l'API
    const response = await fetch(
      "http://localhost:3000/api/learner/formations",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`📡 Réponse API: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Données reçues:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log("❌ Erreur API:");
      console.log(error);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiMariline();
