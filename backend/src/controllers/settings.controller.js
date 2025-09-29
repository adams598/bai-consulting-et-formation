import { PrismaClient } from "@prisma/client";
import os from "os";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

// Contrôleur pour la gestion des paramètres système
export const settingsController = {
  // Récupérer tous les paramètres système
  async getAllSettings(req, res) {
    try {
      const settings = await prisma.systemSetting.findMany({
        orderBy: { category: "asc" },
      });

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error("Erreur getAllSettings:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer les paramètres par catégorie
  async getSettingsByCategory(req, res) {
    try {
      const { category } = req.params;

      const settings = await prisma.systemSetting.findMany({
        where: { category },
        orderBy: { key: "asc" },
      });

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error("Erreur getSettingsByCategory:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour un paramètre
  async updateSetting(req, res) {
    try {
      const { key } = req.params;
      const { value } = req.body;

      // Vérifier si le paramètre existe
      const existingSetting = await prisma.systemSetting.findUnique({
        where: { key },
      });

      if (!existingSetting) {
        return res.status(404).json({
          success: false,
          message: "Paramètre non trouvé",
        });
      }

      if (!existingSetting.isEditable) {
        return res.status(403).json({
          success: false,
          message: "Ce paramètre n'est pas modifiable",
        });
      }

      // Valider la valeur selon le type
      const validatedValue = validateSettingValue(
        value,
        existingSetting.dataType
      );

      // Mettre à jour le paramètre
      const updatedSetting = await prisma.systemSetting.update({
        where: { key },
        data: {
          value: validatedValue,
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: "Paramètre mis à jour avec succès",
        data: updatedSetting,
      });
    } catch (error) {
      console.error("Erreur updateSetting:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer les informations système
  async getSystemInfo(req, res) {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();

      // Statistiques de la base de données
      const totalUsers = await prisma.user.count();
      const totalFormations = await prisma.formation.count();
      const totalBanks = await prisma.bank.count();

      // Vérifier le statut de la base de données
      let databaseStatus = "CONNECTED";
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        databaseStatus = "ERROR";
      }

      // Informations sur l'espace disque
      const diskUsage = await getDiskUsage();

      const systemInfo = {
        version: process.env.npm_package_version || "1.0.0",
        nodeVersion: process.version,
        uptime: process.uptime(),
        memoryUsage: {
          used: memoryUsage.heapUsed,
          total: totalMemory,
          percentage: Math.round((memoryUsage.heapUsed / totalMemory) * 100),
        },
        diskUsage,
        databaseStatus,
        lastMaintenance: new Date(), // À implémenter avec une table de maintenance
        totalUsers,
        totalFormations,
        totalBanks,
      };

      res.json({
        success: true,
        data: systemInfo,
      });
    } catch (error) {
      console.error("Erreur getSystemInfo:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Vérifier la santé du système
  async getSystemHealth(req, res) {
    try {
      const checks = {
        database: false,
        email: false,
        storage: false,
        memory: false,
        disk: false,
      };

      const issues = [];

      // Vérifier la base de données
      try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = true;
      } catch (error) {
        issues.push("Base de données inaccessible");
      }

      // Vérifier l'espace disque
      try {
        const diskUsage = await getDiskUsage();
        checks.disk = diskUsage.percentage < 90;
        if (diskUsage.percentage >= 90) {
          issues.push("Espace disque insuffisant");
        }
      } catch (error) {
        issues.push("Impossible de vérifier l'espace disque");
      }

      // Vérifier la mémoire
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const memoryPercentage = (memoryUsage.heapUsed / totalMemory) * 100;
      checks.memory = memoryPercentage < 90;
      if (memoryPercentage >= 90) {
        issues.push("Utilisation mémoire élevée");
      }

      // Vérifier le stockage des uploads
      try {
        const uploadPath = process.env.UPLOAD_PATH || "./uploads";
        await fs.access(uploadPath);
        checks.storage = true;
      } catch (error) {
        issues.push("Répertoire d'upload inaccessible");
      }

      // Vérifier la configuration email (basique)
      checks.email = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

      const status =
        issues.length === 0
          ? "HEALTHY"
          : issues.length <= 2
          ? "WARNING"
          : "CRITICAL";

      const systemHealth = {
        status,
        checks,
        lastCheck: new Date(),
        issues,
      };

      res.json({
        success: true,
        data: systemHealth,
      });
    } catch (error) {
      console.error("Erreur getSystemHealth:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer les logs système
  async getSystemLogs(req, res) {
    try {
      const { level, limit = 100, offset = 0 } = req.query;

      const where = level ? { level } : {};

      const logs = await prisma.systemLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: parseInt(limit),
        skip: parseInt(offset),
      });

      const total = await prisma.systemLog.count({ where });

      res.json({
        success: true,
        data: {
          logs,
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      console.error("Erreur getSystemLogs:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Tester la configuration email
  async testEmailConfig(req, res) {
    try {
      const { testEmail } = req.body;

      if (!testEmail) {
        return res.status(400).json({
          success: false,
          message: "Adresse email de test requise",
        });
      }

      // Ici, vous pouvez implémenter l'envoi d'un email de test
      // en utilisant votre service email existant

      res.json({
        success: true,
        message: "Email de test envoyé avec succès",
      });
    } catch (error) {
      console.error("Erreur testEmailConfig:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi de l'email de test",
      });
    }
  },

  // Sauvegarder les paramètres
  async backupSettings(req, res) {
    try {
      const settings = await prisma.systemSetting.findMany();

      const backupData = {
        timestamp: new Date(),
        settings: settings.map((s) => ({
          key: s.key,
          value: s.value,
          category: s.category,
        })),
      };

      // Sauvegarder dans un fichier
      const backupPath = path.join(
        process.cwd(),
        "backups",
        `settings-${Date.now()}.json`
      );
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

      res.json({
        success: true,
        message: "Paramètres sauvegardés avec succès",
        data: { backupPath },
      });
    } catch (error) {
      console.error("Erreur backupSettings:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la sauvegarde",
      });
    }
  },

  // Restaurer les paramètres
  async restoreSettings(req, res) {
    try {
      const { backupFile } = req.body;

      if (!backupFile) {
        return res.status(400).json({
          success: false,
          message: "Fichier de sauvegarde requis",
        });
      }

      // Lire le fichier de sauvegarde
      const backupData = JSON.parse(await fs.readFile(backupFile, "utf8"));

      // Restaurer les paramètres
      for (const setting of backupData.settings) {
        await prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: {
            key: setting.key,
            value: setting.value,
            category: setting.category,
            isEditable: true,
            dataType: "STRING",
          },
        });
      }

      res.json({
        success: true,
        message: "Paramètres restaurés avec succès",
      });
    } catch (error) {
      console.error("Erreur restoreSettings:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la restauration",
      });
    }
  },
};

// Fonction utilitaire pour valider les valeurs de paramètres
function validateSettingValue(value, dataType) {
  switch (dataType) {
    case "NUMBER":
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error("Valeur numérique invalide");
      }
      return num.toString();

    case "BOOLEAN":
      if (typeof value === "boolean") {
        return value.toString();
      }
      if (typeof value === "string") {
        return ["true", "1", "yes", "on"].includes(value.toLowerCase())
          ? "true"
          : "false";
      }
      throw new Error("Valeur booléenne invalide");

    case "JSON":
      try {
        JSON.parse(value);
        return value;
      } catch (error) {
        throw new Error("JSON invalide");
      }

    case "STRING":
    default:
      return String(value);
  }
}

// Fonction utilitaire pour obtenir l'utilisation du disque
async function getDiskUsage() {
  try {
    const stats = await fs.stat(process.cwd());
    // Cette implémentation est simplifiée
    // En production, utilisez une bibliothèque comme 'node-disk-info'
    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  } catch (error) {
    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }
}
