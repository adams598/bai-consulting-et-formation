import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testAssignFormation() {
  try {
    console.log("🧪 Test de l'assignation de formation...\n");

    // 1. Vérifier les formations existantes
    const formations = await prisma.formation.findMany({
      where: { isActive: true },
    });
    console.log(`📚 Formations disponibles: ${formations.length}`);
    formations.forEach((f) => {
      console.log(`  - ${f.title} (ID: ${f.id})`);
    });

    if (formations.length === 0) {
      console.log("❌ Aucune formation disponible");
      return;
    }

    // 2. Vérifier les banques existantes
    const banks = await prisma.bank.findMany({
      where: { isActive: true },
    });
    console.log(`\n🏦 Banques disponibles: ${banks.length}`);
    banks.forEach((b) => {
      console.log(`  - ${b.name} (ID: ${b.id})`);
    });

    if (banks.length === 0) {
      console.log("❌ Aucune banque disponible");
      return;
    }

    // 3. Vérifier les utilisateurs admin
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [{ role: "SUPER_ADMIN" }, { role: "BANK_ADMIN" }],
      },
    });
    console.log(`\n👥 Utilisateurs admin: ${adminUsers.length}`);
    adminUsers.forEach((u) => {
      console.log(`  - ${u.firstName} ${u.lastName} (${u.role}) - ID: ${u.id}`);
    });

    if (adminUsers.length === 0) {
      console.log("❌ Aucun utilisateur admin disponible");
      return;
    }

    // 4. Tester l'assignation directement avec Prisma
    const formationId = formations[0].id;
    const bankId = banks[0].id;
    const adminUserId = adminUsers[0].id;

    console.log(`\n🔗 Test d'assignation:`);
    console.log(`  Formation: ${formations[0].title}`);
    console.log(`  Banque: ${banks[0].name}`);
    console.log(
      `  Admin: ${adminUsers[0].firstName} ${adminUsers[0].lastName}`
    );

    // Vérifier si l'assignation existe déjà
    const existingAssignment = await prisma.bankFormation.findFirst({
      where: {
        bankId,
        formationId,
      },
    });

    if (existingAssignment) {
      console.log("⚠️ Cette assignation existe déjà");
      return;
    }

    // Créer l'assignation
    const bankFormation = await prisma.bankFormation.create({
      data: {
        bankId,
        formationId,
        assignedBy: adminUserId,
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        formation: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    console.log("✅ Assignation créée avec succès !");
    console.log("📊 Données:", JSON.stringify(bankFormation, null, 2));

    // Vérifier l'assignation
    const verifyAssignment = await prisma.bankFormation.findFirst({
      where: {
        bankId,
        formationId,
      },
    });

    console.log(
      `\n🔍 Vérification: Assignation trouvée: ${!!verifyAssignment}`
    );
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAssignFormation();

