const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testBankManagement() {
  console.log("🧪 Test de la gestion des banques...\n");

  try {
    // Test 1: Créer une banque
    console.log("1️⃣ Test de création d'une banque...");
    const newBank = await prisma.bank.create({
      data: {
        name: "Banque Test",
        code: "TEST001",
        isActive: true,
      },
    });
    console.log("✅ Banque créée:", newBank);

    // Test 2: Récupérer toutes les banques
    console.log("\n2️⃣ Test de récupération des banques...");
    const banks = await prisma.bank.findMany({
      where: { isArchived: false },
      orderBy: { name: "asc" },
    });
    console.log("✅ Banques récupérées:", banks.length);

    // Test 3: Modifier une banque
    console.log("\n3️⃣ Test de modification d'une banque...");
    const updatedBank = await prisma.bank.update({
      where: { id: newBank.id },
      data: {
        name: "Banque Test Modifiée",
        code: "TEST002",
      },
    });
    console.log("✅ Banque modifiée:", updatedBank);

    // Test 4: Changer le statut
    console.log("\n4️⃣ Test de changement de statut...");
    const toggledBank = await prisma.bank.update({
      where: { id: newBank.id },
      data: {
        isActive: false,
      },
    });
    console.log("✅ Statut changé:", toggledBank.isActive);

    // Test 5: Supprimer la banque
    console.log("\n5️⃣ Test de suppression d'une banque...");
    await prisma.bank.delete({
      where: { id: newBank.id },
    });
    console.log("✅ Banque supprimée");

    console.log("\n🎉 Tous les tests sont passés avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors des tests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testBankManagement();

