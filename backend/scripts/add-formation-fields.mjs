import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addFormationFields() {
  try {
    console.log("🔄 Ajout des nouveaux champs aux formations...");

    // Note: Dans SQLite, on ne peut pas ajouter des colonnes avec ALTER TABLE facilement
    // Nous allons plutôt créer un script de migration manuelle

    console.log("📋 Instructions pour ajouter les champs:");
    console.log(
      "1. Ajouter ces champs au modèle Formation dans schema.prisma:"
    );
    console.log("   universeId   String?");
    console.log("   isOpportunity Boolean @default(false)");
    console.log("");
    console.log("2. Puis exécuter: npx prisma db push");
    console.log("");
    console.log(
      "3. Ensuite, exécuter ce script pour ajuster les données existantes"
    );

    // Vérifier les formations existantes
    const formations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        universeId: true,
        isOpportunity: true,
      },
    });

    console.log(`📊 Formations trouvées: ${formations.length}`);
    formations.forEach((formation) => {
      console.log(
        `  - ${formation.title} (universeId: ${
          formation.universeId || "null"
        }, isOpportunity: ${formation.isOpportunity || false})`
      );
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addFormationFields();

