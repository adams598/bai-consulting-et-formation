import Joi from "joi";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class ValidationService {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      // Schémas d'authentification
      login: Joi.object({
        email: Joi.string().email().required().trim().max(255),
        password: Joi.string().min(8).max(128).required(),
      }),

      register: Joi.object({
        email: Joi.string().email().required().trim().max(255),
        password: Joi.string()
          .min(8)
          .max(128)
          .pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
          )
          .required()
          .messages({
            "string.pattern.base":
              "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial",
          }),
        firstName: Joi.string().min(2).max(50).required().trim(),
        lastName: Joi.string().min(2).max(50).required().trim(),
        phone: Joi.string()
          .pattern(/^[\+]?[0-9\s\-\(\)]{10,}$/)
          .optional()
          .allow(""),
        bankId: Joi.string().optional(),
        department: Joi.string().max(100).optional().allow(""),
      }),

      // Schémas de formations
      formation: Joi.object({
        title: Joi.string().min(3).max(200).required().trim(),
        description: Joi.string().min(10).max(2000).required().trim(),
        duration: Joi.number().integer().min(1).max(10080).optional(), // Max 1 semaine
        isActive: Joi.boolean().optional(),
        hasQuiz: Joi.boolean().optional(),
        quizRequired: Joi.boolean().optional(),
        code: Joi.string().max(20).optional().allow(""),
        pedagogicalModality: Joi.string().max(100).optional().allow(""),
        organization: Joi.string().max(200).optional().allow(""),
        prerequisites: Joi.string().max(1000).optional().allow(""),
        objectives: Joi.string().max(2000).optional().allow(""),
        detailedProgram: Joi.string().max(5000).optional().allow(""),
        targetAudience: Joi.string().max(1000).optional().allow(""),
        universeId: Joi.string().optional().allow(""),
        bankId: Joi.string().optional().allow(""),
      }),

      // Schémas de contenu de formation
      formationContent: Joi.object({
        title: Joi.string().min(3).max(200).required().trim(),
        description: Joi.string().max(1000).optional().allow(""),
        type: Joi.string()
          .valid("PRESENTATION", "VIDEO", "DOCUMENT", "INTERACTIVE", "QUIZ")
          .required(),
        contentType: Joi.string().valid("SECTION", "LESSON").required(),
        sectionId: Joi.string().optional().allow(""),
        order: Joi.number().integer().min(0).max(1000).required(),
        duration: Joi.number().integer().min(0).max(1440).optional(), // Max 24h
        fileUrl: Joi.string().uri().optional().allow(""),
        fileSize: Joi.number().integer().min(0).max(1073741824).optional(), // Max 1GB
        coverImage: Joi.string().uri().optional().allow(""),
        metadata: Joi.string().optional().allow(""),
      }),

      // Schémas de banques
      bank: Joi.object({
        name: Joi.string().min(2).max(100).required().trim(),
        code: Joi.string()
          .min(2)
          .max(20)
          .required()
          .trim()
          .pattern(/^[A-Z0-9_-]+$/),
        isActive: Joi.boolean().optional(),
        isArchived: Joi.boolean().optional(),
      }),

      // Schémas d'utilisateurs
      user: Joi.object({
        email: Joi.string().email().required().trim().max(255),
        firstName: Joi.string().min(2).max(50).required().trim(),
        lastName: Joi.string().min(2).max(50).required().trim(),
        role: Joi.string()
          .valid("SUPER_ADMIN", "BANK_ADMIN", "COLLABORATOR")
          .required(),
        bankId: Joi.string().optional().allow(""),
        department: Joi.string().max(100).optional().allow(""),
        phone: Joi.string()
          .pattern(/^[\+]?[0-9\s\-\(\)]{10,}$/)
          .optional()
          .allow(""),
        isActive: Joi.boolean().optional(),
      }),

      // Schémas de quiz
      quiz: Joi.object({
        title: Joi.string().min(3).max(200).required().trim(),
        description: Joi.string().max(1000).optional().allow(""),
        passingScore: Joi.number().integer().min(0).max(100).required(),
        timeLimit: Joi.number().integer().min(1).max(180).optional(), // Max 3h
        isActive: Joi.boolean().optional(),
        questions: Joi.array()
          .items(
            Joi.object({
              question: Joi.string().min(5).max(500).required().trim(),
              type: Joi.string()
                .valid("multiple_choice", "true_false", "text", "fill_in_blank")
                .required(),
              order: Joi.number().integer().min(0).max(100).required(),
              points: Joi.number().integer().min(1).max(10).optional(),
              answers: Joi.array()
                .items(
                  Joi.object({
                    answer: Joi.string().min(1).max(200).required().trim(),
                    isCorrect: Joi.boolean().required(),
                    order: Joi.number().integer().min(0).max(10).required(),
                  })
                )
                .min(2)
                .max(6)
                .required(),
            })
          )
          .min(1)
          .max(50)
          .required(),
      }),

      // Schémas de contact
      contact: Joi.object({
        name: Joi.string().min(2).max(100).required().trim(),
        email: Joi.string().email().required().trim().max(255),
        message: Joi.string().min(10).max(2000).required().trim(),
        phone: Joi.string()
          .pattern(/^[\+]?[0-9\s\-\(\)]{10,}$/)
          .optional()
          .allow(""),
      }),

      // Schémas de chat
      chat: Joi.object({
        message: Joi.string().min(1).max(1000).required().trim(),
      }),
    };
  }

  // Validation générique
  validate(schemaName, data) {
    const schema = this.schemas[schemaName];
    if (!schema) {
      throw new Error(`Schéma de validation '${schemaName}' non trouvé`);
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      throw new Error(`Validation échouée: ${JSON.stringify(errorMessages)}`);
    }

    return value;
  }

  // Validation avec vérification en base de données
  async validateWithDB(schemaName, data, context = {}) {
    // Validation de base
    const validatedData = this.validate(schemaName, data);

    // Vérifications supplémentaires en base
    await this.performDatabaseValidations(schemaName, validatedData, context);

    return validatedData;
  }

  // Vérifications en base de données
  async performDatabaseValidations(schemaName, data, context) {
    switch (schemaName) {
      case "register":
      case "user":
        await this.validateUserUniqueness(data.email, context.existingUserId);
        if (data.bankId) {
          await this.validateBankExists(data.bankId);
        }
        break;

      case "formation":
        await this.validateFormationUniqueness(
          data.title,
          context.existingFormationId
        );
        if (data.universeId) {
          await this.validateUniverseExists(data.universeId);
        }
        if (data.bankId) {
          await this.validateBankExists(data.bankId);
        }
        break;

      case "bank":
        await this.validateBankCodeUniqueness(
          data.code,
          context.existingBankId
        );
        break;

      case "formationContent":
        await this.validateFormationExists(context.formationId);
        if (data.sectionId) {
          await this.validateSectionExists(data.sectionId);
        }
        break;

      case "quiz":
        await this.validateFormationExists(context.formationId);
        break;

      default:
        // Pas de vérifications supplémentaires
        break;
    }
  }

  // Méthodes de validation spécifiques
  async validateUserUniqueness(email, excludeUserId = null) {
    const whereClause = { email };
    if (excludeUserId) {
      whereClause.id = { not: excludeUserId };
    }

    const existingUser = await prisma.user.findFirst({ where: whereClause });
    if (existingUser) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }
  }

  async validateBankExists(bankId) {
    const bank = await prisma.bank.findUnique({ where: { id: bankId } });
    if (!bank) {
      throw new Error("Banque non trouvée");
    }
    if (!bank.isActive) {
      throw new Error("Banque inactive");
    }
  }

  async validateBankCodeUniqueness(code, excludeBankId = null) {
    const whereClause = { code };
    if (excludeBankId) {
      whereClause.id = { not: excludeBankId };
    }

    const existingBank = await prisma.bank.findFirst({ where: whereClause });
    if (existingBank) {
      throw new Error("Un code de banque identique existe déjà");
    }
  }

  async validateFormationUniqueness(title, excludeFormationId = null) {
    const whereClause = { title };
    if (excludeFormationId) {
      whereClause.id = { not: excludeFormationId };
    }

    const existingFormation = await prisma.formation.findFirst({
      where: whereClause,
    });
    if (existingFormation) {
      throw new Error("Une formation avec ce titre existe déjà");
    }
  }

  async validateFormationExists(formationId) {
    const formation = await prisma.formation.findUnique({
      where: { id: formationId },
    });
    if (!formation) {
      throw new Error("Formation non trouvée");
    }
  }

  async validateUniverseExists(universeId) {
    const universe = await prisma.universe.findUnique({
      where: { id: universeId },
    });
    if (!universe) {
      throw new Error("Univers non trouvé");
    }
    if (!universe.isActive) {
      throw new Error("Univers inactive");
    }
  }

  async validateSectionExists(sectionId) {
    const section = await prisma.formationContent.findUnique({
      where: { id: sectionId },
      where: { contentType: "SECTION" },
    });
    if (!section) {
      throw new Error("Section non trouvée");
    }
  }

  // Validation de sécurité pour les fichiers
  validateFileUpload(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB par défaut
      allowedTypes = ["image/jpeg", "image/png", "image/webp"],
      allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"],
    } = options;

    // Vérifier la taille
    if (file.size > maxSize) {
      throw new Error(
        `Fichier trop volumineux. Taille maximale: ${maxSize / 1024 / 1024}MB`
      );
    }

    // Vérifier le type MIME
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(
        `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(
          ", "
        )}`
      );
    }

    // Vérifier l'extension
    const extension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf("."));
    if (!allowedExtensions.includes(extension)) {
      throw new Error(
        `Extension de fichier non autorisée. Extensions acceptées: ${allowedExtensions.join(
          ", "
        )}`
      );
    }

    // Vérifier le nom du fichier (éviter les caractères dangereux)
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(file.originalname)) {
      throw new Error("Nom de fichier contenant des caractères non autorisés");
    }

    return true;
  }

  // Sanitisation des entrées
  sanitizeInput(input) {
    if (typeof input !== "string") return input;

    return input
      .replace(/[<>]/g, "") // Supprimer les balises HTML
      .replace(/javascript:/gi, "") // Supprimer les protocoles dangereux
      .replace(/on\w+=/gi, "") // Supprimer les événements JavaScript
      .replace(/data:/gi, "") // Supprimer les protocoles data
      .replace(/vbscript:/gi, "") // Supprimer les protocoles vbscript
      .trim();
  }

  // Validation des paramètres d'URL
  validateUrlParams(params, schema) {
    const { error, value } = schema.validate(params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      throw new Error(`Paramètres URL invalides: ${errorMessages.join(", ")}`);
    }

    return value;
  }

  // Validation des paramètres de pagination
  validatePagination(query) {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).max(1000).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      search: Joi.string().max(100).optional().allow(""),
      sortBy: Joi.string().max(50).optional().allow(""),
      sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    });

    return this.validateUrlParams(query, schema);
  }
}

// Instance singleton
const validationService = new ValidationService();

export default validationService;
