import { conversionService } from "../services/conversion.service.js";
import path from "path";
import fs from "fs";

export const conversionController = {
  // Convertir un fichier Office en PDF
  async convertToPdf(req, res) {
    try {
      const { formationTitle, lessonTitle, filename } = req.params;

      if (!formationTitle || !lessonTitle || !filename) {
        return res.status(400).json({
          success: false,
          message: "Tous les paramètres sont requis",
        });
      }

      // Construire les chemins
      const sanitizedFormationTitle = formationTitle
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();
      const sanitizedLessonTitle = lessonTitle
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();

      const inputPath = path.join(
        "uploads",
        "formations",
        sanitizedFormationTitle,
        "lessons",
        sanitizedLessonTitle,
        filename
      );
      const outputDir = path.join(
        "uploads",
        "formations",
        sanitizedFormationTitle,
        "lessons",
        sanitizedLessonTitle,
        "converted"
      );
      const outputPath = path.join(
        outputDir,
        path.basename(filename, path.extname(filename)) + ".pdf"
      );

      // Vérifier que le fichier source existe
      if (!fs.existsSync(inputPath)) {
        return res.status(404).json({
          success: false,
          message: "Fichier source introuvable",
        });
      }

      // Vérifier si le fichier peut être converti
      if (!conversionService.canConvert(filename)) {
        return res.status(400).json({
          success: false,
          message: "Type de fichier non supporté pour la conversion",
        });
      }

      // Vérifier si le PDF existe déjà
      if (fs.existsSync(outputPath)) {
        console.log("✅ PDF déjà existant, utilisation du cache");
        const pdfUrl = `/uploads/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/converted/${path.basename(
          outputPath
        )}`;

        return res.json({
          success: true,
          data: {
            pdfUrl,
            cached: true,
            message: "PDF récupéré depuis le cache",
          },
        });
      }

      // Convertir le fichier
      console.log("🔄 Début de la conversion:", inputPath);
      const pdfPath = await conversionService.convertToPdf(
        inputPath,
        outputPath
      );

      // Générer l'URL du PDF
      const pdfUrl = `/uploads/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/converted/${path.basename(
        pdfPath
      )}`;

      console.log("✅ Conversion réussie:", pdfUrl);

      res.json({
        success: true,
        data: {
          pdfUrl,
          cached: false,
          message: "Fichier converti avec succès",
        },
      });
    } catch (error) {
      console.error("❌ Erreur conversion:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Erreur lors de la conversion",
      });
    }
  },

  // Extraire le contenu HTML d'un fichier Word
  async extractHtml(req, res) {
    try {
      const { formationTitle, lessonTitle, filename } = req.params;

      if (!formationTitle || !lessonTitle || !filename) {
        return res.status(400).json({
          success: false,
          message: "Tous les paramètres sont requis",
        });
      }

      // Construire le chemin du fichier
      const sanitizedFormationTitle = formationTitle
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();
      const sanitizedLessonTitle = lessonTitle
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();

      const filePath = path.join(
        "uploads",
        "formations",
        sanitizedFormationTitle,
        "lessons",
        sanitizedLessonTitle,
        filename
      );

      // Vérifier que le fichier existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "Fichier introuvable",
        });
      }

      // Vérifier si c'est un fichier Word
      if (
        !filename.toLowerCase().endsWith(".docx") &&
        !filename.toLowerCase().endsWith(".doc")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Seuls les fichiers Word sont supportés pour l'extraction HTML",
        });
      }

      // Extraire le contenu HTML
      const result = await conversionService.extractHtmlFromWord(filePath);

      res.json({
        success: true,
        data: {
          html: result.html,
          messages: result.messages,
          message: "Contenu HTML extrait avec succès",
        },
      });
    } catch (error) {
      console.error("❌ Erreur extraction HTML:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Erreur lors de l'extraction du contenu",
      });
    }
  },

  // Obtenir le statut de conversion
  async getConversionStatus(req, res) {
    try {
      const { formationTitle, lessonTitle, filename } = req.params;

      if (!formationTitle || !lessonTitle || !filename) {
        return res.status(400).json({
          success: false,
          message: "Tous les paramètres sont requis",
        });
      }

      // Construire les chemins
      const sanitizedFormationTitle = formationTitle
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();
      const sanitizedLessonTitle = lessonTitle
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();

      const inputPath = path.join(
        "uploads",
        "formations",
        sanitizedFormationTitle,
        "lessons",
        sanitizedLessonTitle,
        filename
      );
      const outputDir = path.join(
        "uploads",
        "formations",
        sanitizedFormationTitle,
        "lessons",
        sanitizedLessonTitle,
        "converted"
      );
      const outputPath = path.join(
        outputDir,
        path.basename(filename, path.extname(filename)) + ".pdf"
      );

      // Vérifier les statuts
      const sourceExists = fs.existsSync(inputPath);
      const pdfExists = fs.existsSync(outputPath);
      const canConvert = conversionService.canConvert(filename);
      const libreOfficeAvailable = await conversionService.checkLibreOffice();

      res.json({
        success: true,
        data: {
          sourceExists,
          pdfExists,
          canConvert,
          libreOfficeAvailable,
          sourcePath: inputPath,
          pdfPath: outputPath,
          message: "Statut de conversion récupéré",
        },
      });
    } catch (error) {
      console.error("❌ Erreur statut conversion:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Erreur lors de la récupération du statut",
      });
    }
  },
};

