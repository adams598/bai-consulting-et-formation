const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addCoverImageField() {
  try {
    console.log("🚀 Début de la migration pour ajouter le champ coverImage...");

    // Ajouter le champ coverImage à la table formation_content
    await prisma.$executeRaw`
      ALTER TABLE formation_content 
      ADD COLUMN coverImage TEXT;
    `;

    console.log(
      "✅ Champ coverImage ajouté avec succès à la table formation_content"
    );

    // Vérifier que le champ a été ajouté
    const tableInfo = await prisma.$queryRaw`
      PRAGMA table_info(formation_content);
    `;

    console.log("📋 Structure de la table formation_content:");
    tableInfo.forEach((column) => {
      console.log(
        `  - ${column.name}: ${column.type} ${
          column.notnull ? "NOT NULL" : "NULL"
        }`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
addCoverImageField()
  .then(() => {
    console.log("🎉 Migration terminée avec succès !");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Échec de la migration:", error);
    process.exit(1);
  });
