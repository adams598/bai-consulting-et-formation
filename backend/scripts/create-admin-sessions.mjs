import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

async function createAdminSessions() {
  try {
    console.log("🔑 Création de sessions valides pour les admins...");

    // 1. Récupérer tous les admins actifs
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "BANK_ADMIN"] },
        isActive: true,
      },
    });

    console.log(`👨‍💼 ${admins.length} admins trouvés`);

    for (const admin of admins) {
      // 2. Supprimer les anciennes sessions de cet admin
      await prisma.userSession.deleteMany({
        where: { userId: admin.id },
      });

      // 3. Créer un nouveau token
      const token = jwt.sign(
        { userId: admin.id, role: admin.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" } // Token valide 24h
      );

      const refreshToken = jwt.sign(
        { userId: admin.id },
        process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
        { expiresIn: "7d" }
      );

      // 4. Créer une nouvelle session
      const sessionExpiresAt = new Date();
      sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24); // Session valide 24h

      await prisma.userSession.create({
        data: {
          userId: admin.id,
          token: token,
          refreshToken: refreshToken,
          expiresAt: sessionExpiresAt,
          userAgent: "Admin Test Session",
          ipAddress: "127.0.0.1",
        },
      });

      console.log(`✅ Session créée pour ${admin.email} (${admin.role})`);
      console.log(`   Token: ${token.substring(0, 30)}...`);
      console.log(`   Expire: ${sessionExpiresAt}`);
      console.log("");
    }

    // 5. Créer aussi une session pour mariline
    const mariline = await prisma.user.findUnique({
      where: { email: "mariline@bai.com" },
    });

    if (mariline) {
      // Supprimer les anciennes sessions
      await prisma.userSession.deleteMany({
        where: { userId: mariline.id },
      });

      const token = jwt.sign(
        { userId: mariline.id, role: mariline.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      const sessionExpiresAt = new Date();
      sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24);

      await prisma.userSession.create({
        data: {
          userId: mariline.id,
          token: token,
          refreshToken: "refresh-token-mariline",
          expiresAt: sessionExpiresAt,
          userAgent: "Mariline Test Session",
          ipAddress: "127.0.0.1",
        },
      });

      console.log(`✅ Session créée pour ${mariline.email} (${mariline.role})`);
      console.log(`   Token: ${token.substring(0, 30)}...`);
    }

    console.log("\n🎉 Sessions créées avec succès !");
    console.log(
      "🔄 Les utilisateurs doivent se reconnecter pour utiliser les nouvelles sessions."
    );
  } catch (error) {
    console.error("❌ Erreur lors de la création des sessions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminSessions();
