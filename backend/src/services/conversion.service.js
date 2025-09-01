import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

class ConversionService {
  constructor() {
    this.supportedFormats = {
      word: [".doc", ".docx"],
      excel: [".xls", ".xlsx"],
      powerpoint: [".ppt", ".pptx"],
    };
  }

  // Vérifier si LibreOffice est installé
  async checkLibreOffice() {
    try {
      const { stdout } = await execAsync("soffice --version");
      console.log("✅ LibreOffice détecté:", stdout.trim());
      return true;
    } catch (error) {
      console.log("❌ LibreOffice non détecté:", error.message);
      return false;
    }
  }

  // Convertir un fichier Office en PDF
  async convertToPdf(inputPath, outputPath) {
    try {
      const libreOfficeAvailable = await this.checkLibreOffice();

      if (libreOfficeAvailable) {
        return await this.convertWithLibreOffice(inputPath, outputPath);
      } else {
        // Fallback : utiliser une méthode alternative
        return await this.convertWithAlternative(inputPath, outputPath);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la conversion:", error);
      throw new Error("Impossible de convertir le fichier");
    }
  }

  // Conversion avec LibreOffice
  async convertWithLibreOffice(inputPath, outputPath) {
    try {
      const outputDir = path.dirname(outputPath);

      // Créer le dossier de sortie s'il n'existe pas
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Commande LibreOffice pour convertir en PDF
      const command = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

      console.log("🔄 Conversion avec LibreOffice:", command);
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.log("⚠️ LibreOffice stderr:", stderr);
      }

      console.log("✅ Conversion LibreOffice réussie:", stdout);

      // Vérifier que le fichier PDF a été créé
      const pdfPath = outputPath.replace(/\.[^/.]+$/, ".pdf");
      if (fs.existsSync(pdfPath)) {
        return pdfPath;
      } else {
        throw new Error("Fichier PDF non généré");
      }
    } catch (error) {
      console.error("❌ Erreur conversion LibreOffice:", error);
      throw error;
    }
  }

  // Méthode alternative de conversion
  async convertWithAlternative(inputPath, outputPath) {
    try {
      // Pour l'instant, on retourne une erreur
      // TODO: Implémenter une conversion alternative (mammoth.js, etc.)
      throw new Error(
        "LibreOffice non disponible et aucune alternative implémentée"
      );
    } catch (error) {
      console.error("❌ Erreur conversion alternative:", error);
      throw error;
    }
  }

  // Extraire le contenu HTML d'un fichier Word
  async extractHtmlFromWord(inputPath) {
    try {
      // Utiliser mammoth.js pour extraire le contenu
      // Note: Cette fonction nécessite d'installer mammoth
      const mammoth = await import("mammoth");

      const result = await mammoth.convertToHtml({ path: inputPath });

      return {
        html: result.value,
        messages: result.messages,
      };
    } catch (error) {
      console.error("❌ Erreur extraction HTML:", error);
      throw new Error("Impossible d'extraire le contenu HTML");
    }
  }

  // Obtenir le type de fichier
  getFileType(filename) {
    const extension = path.extname(filename).toLowerCase();

    for (const [type, extensions] of Object.entries(this.supportedFormats)) {
      if (extensions.includes(extension)) {
        return type;
      }
    }

    return "unknown";
  }

  // Vérifier si un fichier peut être converti
  canConvert(filename) {
    const fileType = this.getFileType(filename);
    return fileType !== "unknown";
  }
}

export const conversionService = new ConversionService();
