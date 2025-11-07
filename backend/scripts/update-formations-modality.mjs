import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateFormationsModality() {
  try {
    console.log("🔄 Mise à jour des formations avec pedagogicalModality...\n");

    // Récupérer toutes les formations
    const formations = await prisma.formation.findMany({
      select: {
        id: true,
        title: true,
        pedagogicalModality: true,
        code: true,
        organization: true,
      },
    });

    console.log(`📊 Nombre total de formations: ${formations.length}\n`);

    let updatedCount = 0;

    // Mettre à jour chaque formation sans pedagogicalModality
    for (const formation of formations) {
      if (!formation.pedagogicalModality) {
        await prisma.formation.update({
          where: { id: formation.id },
          data: {
            pedagogicalModality: "E-learning",
            organization: formation.organization || "BAI Consulting",
          },
        });

        console.log(`✅ Mise à jour: "${formation.title}"`);
        console.log(`   - pedagogicalModality: E-learning`);
        console.log(
          `   - organization: ${formation.organization || "BAI Consulting"}\n`
        );

        updatedCount++;
      } else {
        console.log(`⏭️  Ignoré (déjà rempli): "${formation.title}"`);
        console.log(
          `   - pedagogicalModality: ${formation.pedagogicalModality}`
        );
        console.log(
          `   - organization: ${formation.organization || "Non défini"}\n`
        );
      }
    }

    console.log(`\n✅ Mise à jour terminée!`);
    console.log(
      `📊 ${updatedCount} formations mises à jour sur ${formations.length}`
    );
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateFormationsModality();
