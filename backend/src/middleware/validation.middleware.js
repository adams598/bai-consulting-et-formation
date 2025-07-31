import Joi from "joi";

// Schémas de validation
export const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim(),
  email: Joi.string().email().required().trim(),
  message: Joi.string().min(10).max(2000).required().trim(),
  phone: Joi.string()
    .pattern(/^[\+]?[0-9\s\-\(\)]{10,}$/)
    .optional()
    .allow(""),
});

export const chatSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required().trim(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().trim(),
  password: Joi.string().min(6).required(),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required().trim(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      "string.pattern.base":
        "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial",
    }),
  firstName: Joi.string().min(2).max(50).required().trim(),
  lastName: Joi.string().min(2).max(50).required().trim(),
  company: Joi.string().max(100).optional().trim(),
  position: Joi.string().max(100).optional().trim(),
});

// Middleware de validation générique
export const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        error: "Données invalides",
        details: errorMessages,
      });
    }

    // Remplacer req.body par les données validées
    req.body = value;
    next();
  };
};

// Fonction de sanitisation pour prévenir XSS
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .replace(/[<>]/g, "") // Supprimer les balises HTML
    .replace(/javascript:/gi, "") // Supprimer les protocoles dangereux
    .replace(/on\w+=/gi, "") // Supprimer les événements JavaScript
    .trim();
};

// Middleware de sanitisation
export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }
  next();
};
