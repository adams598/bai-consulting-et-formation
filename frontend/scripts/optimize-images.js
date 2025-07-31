import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, "../public/images");
const OUTPUT_DIR = path.join(__dirname, "../public/images/optimized");

// Configuration des tailles d'images
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 320, height: 240 },
  medium: { width: 640, height: 480 },
  large: { width: 1280, height: 960 },
};

// Configuration des formats
const FORMATS = ["webp", "jpg"];

async function ensureDirectoryExists(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function optimizeImage(inputPath, outputPath, options) {
  try {
    const { width, height, quality, format } = options;

    let pipeline = sharp(inputPath).resize(width, height, {
      fit: "cover",
      position: "center",
    });

    if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    } else if (format === "jpg") {
      pipeline = pipeline.jpeg({ quality });
    }

    await pipeline.toFile(outputPath);
    console.log(
      `✅ Optimisé: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`
    );
  } catch (error) {
    console.error(
      `❌ Erreur lors de l'optimisation de ${inputPath}:`,
      error.message
    );
  }
}

async function getImageFiles(dir) {
  const files = await fs.readdir(dir);
  return files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
  });
}

async function optimizeImages() {
  console.log("🚀 Début de l'optimisation des images...");

  try {
    await ensureDirectoryExists(OUTPUT_DIR);

    const imageFiles = await getImageFiles(IMAGES_DIR);

    if (imageFiles.length === 0) {
      console.log("📁 Aucune image trouvée dans le répertoire images/");
      return;
    }

    console.log(`📸 ${imageFiles.length} images trouvées`);

    for (const imageFile of imageFiles) {
      const inputPath = path.join(IMAGES_DIR, imageFile);
      const baseName = path.parse(imageFile).name;

      // Optimiser pour chaque taille et format
      for (const [sizeName, size] of Object.entries(IMAGE_SIZES)) {
        for (const format of FORMATS) {
          const outputFileName = `${baseName}-${sizeName}.${format}`;
          const outputPath = path.join(OUTPUT_DIR, outputFileName);

          await optimizeImage(inputPath, outputPath, {
            ...size,
            quality: 80,
            format,
          });
        }
      }
    }

    console.log("🎉 Optimisation des images terminée !");
    console.log(`📁 Images optimisées sauvegardées dans: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'optimisation:", error);
  }
}

// Exécuter le script
optimizeImages();
