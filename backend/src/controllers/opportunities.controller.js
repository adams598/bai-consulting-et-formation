import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const opportunitiesController = {
  // Récupérer tous les fichiers PDF de présentation des formations
  async getPresentationFiles(req, res) {
    try {
      console.log("🔍 Récupération des fichiers PDF de présentation...");

      const formationsPath = path.join(process.cwd(), "uploads", "formations");

      if (!fs.existsSync(formationsPath)) {
        return res.json({
          success: true,
          data: [],
          message: "Aucun dossier de formations trouvé",
        });
      }

      const formations = fs.readdirSync(formationsPath);
      const presentationFiles = [];

      for (const formationFolder of formations) {
        const formationPath = path.join(formationsPath, formationFolder);

        if (!fs.statSync(formationPath).isDirectory()) {
          continue;
        }

        // Chercher le dossier lessons
        const lessonsPath = path.join(formationPath, "lessons");
        if (!fs.existsSync(lessonsPath)) {
          continue;
        }

        // Chercher le dossier presentation_de_la_formation
        const presentationPath = path.join(
          lessonsPath,
          "presentation_de_la_formation"
        );
        if (!fs.existsSync(presentationPath)) {
          continue;
        }

        // Chercher les fichiers PDF qui commencent par "file-"
        const files = fs.readdirSync(presentationPath);
        const pdfFiles = files.filter(
          (file) =>
            file.startsWith("file-") && file.toLowerCase().endsWith(".pdf")
        );

        for (const pdfFile of pdfFiles) {
          const filePath = path.join(presentationPath, pdfFile);
          const stats = fs.statSync(filePath);

          // Récupérer les informations de la formation depuis la base de données
          const formation = await prisma.formation.findFirst({
            where: {
              title: {
                contains: formationFolder.replace(/_/g, " "),
              },
            },
          });

          // Chercher une image de couverture
          const coverImagePath = path.join(formationPath, "couverture-");
          const coverFiles = fs
            .readdirSync(formationPath)
            .filter(
              (file) =>
                file.startsWith("couverture-") &&
                (file.endsWith(".png") ||
                  file.endsWith(".jpg") ||
                  file.endsWith(".jpeg"))
            );

          const coverImage =
            coverFiles.length > 0
              ? `/uploads/formations/${formationFolder}/${coverFiles[0]}`
              : null;

          presentationFiles.push({
            id: `${formationFolder}-${pdfFile}`,
            formationId: formation?.id || formationFolder,
            formationTitle:
              formation?.title || formationFolder.replace(/_/g, " "),
            fileName: pdfFile,
            filePath: `/uploads/formations/${formationFolder}/lessons/presentation_de_la_formation/${pdfFile}`,
            fileSize: stats.size,
            uploadDate: stats.mtime.toISOString(),
            uploadedBy: "Système", // On pourrait récupérer le vrai utilisateur depuis les logs
            coverImage: coverImage,
          });
        }
      }

      console.log(
        `✅ ${presentationFiles.length} fichiers PDF de présentation trouvés`
      );

      res.json({
        success: true,
        data: presentationFiles,
        message: `${presentationFiles.length} fichiers PDF de présentation récupérés`,
      });
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des fichiers PDF:",
        error
      );
      res.status(500).json({
        success: false,
        message:
          "Erreur interne du serveur lors de la récupération des fichiers PDF",
      });
    }
  },
};
