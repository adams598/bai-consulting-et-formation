import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log("🔍 Recherche des utilisateurs dans la base de données...\n");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      take: 10,
    });

    console.log(`📊 ${users.length} utilisateurs trouvés :\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nom: ${user.firstName} ${user.lastName}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Actif: ${user.isActive ? "Oui" : "Non"}`);
      console.log(`   Créé: ${user.createdAt.toLocaleDateString("fr-FR")}`);
      console.log("");
    });

    if (users.length > 0) {
      console.log("✅ Utilisez l'un de ces IDs pour les tests");
      console.log(`💡 ID recommandé: ${users[0].id}`);
    } else {
      console.log("❌ Aucun utilisateur trouvé");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
