import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function testLibreOffice() {
  try {
    console.log("🔍 Test de détection LibreOffice...");

    // Test 1: Vérifier la version
    console.log("\n📋 Test 1: Vérification de la version");
    const { stdout: versionOutput } = await execAsync("soffice --version");
    console.log("✅ Version LibreOffice:", versionOutput.trim());

    // Test 2: Vérifier l'aide
    console.log("\n📋 Test 2: Vérification de l'aide");
    const { stdout: helpOutput } = await execAsync("soffice --help");
    console.log("✅ Aide LibreOffice disponible (premières lignes):");
    console.log(helpOutput.split("\n").slice(0, 5).join("\n"));

    // Test 3: Vérifier les filtres de conversion
    console.log("\n📋 Test 3: Vérification des filtres de conversion");
    const { stdout: filterOutput } = await execAsync('soffice --infilter="?"');
    console.log("✅ Filtres disponibles (premières lignes):");
    console.log(filterOutput.split("\n").slice(0, 10).join("\n"));

    console.log("\n🎉 Tous les tests LibreOffice ont réussi !");
  } catch (error) {
    console.error("❌ Erreur lors du test LibreOffice:", error.message);

    if (error.message.includes("ENOENT")) {
      console.log("\n💡 LibreOffice n'est pas installé ou pas dans le PATH");
      console.log(
        "📥 Téléchargez LibreOffice depuis: https://www.libreoffice.org/"
      );
    } else if (error.message.includes("permission")) {
      console.log(
        "\n💡 Problème de permissions, essayez de lancer en tant qu'administrateur"
      );
    }
  }
}

// Lancer le test
testLibreOffice();
