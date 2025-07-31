import { sendContactMail } from "../src/services/contactMail.service.js";
import {
  validateInput,
  sanitizeBody,
  contactSchema,
} from "../src/middleware/validation.middleware.js";

export default async function handler(req, res) {
  // CORS headers dynamiques
  const allowedOrigins = [
    "https://olivedrab-hornet-656554.hostingersite.com",
    "https://backend-one-lemon.vercel.app",
    "http://localhost:5173",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Parse le body si besoin (pour Vercel)
  if (!req.body || Object.keys(req.body).length === 0) {
    let data = "";
    await new Promise((resolve) => {
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("end", resolve);
    });
    req.body = JSON.parse(data || "{}");
  }

  if (req.method === "POST") {
    try {
      // Appliquer la sanitisation
      sanitizeBody(req, res, () => {
        // Appliquer la validation
        validateInput(contactSchema)(req, res, async () => {
          const { name, email, message, phone } = req.body;

          // Validation supplémentaire côté serveur
          if (!name || !email || !message) {
            return res.status(400).json({
              error: "Tous les champs obligatoires doivent être remplis",
            });
          }

          // Validation de l'email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return res.status(400).json({
              error: "Format d'email invalide",
            });
          }

          await sendContactMail({ name, email, message, phone });
          res.status(200).json({ message: "Message envoyé avec succès" });
        });
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi du message" });
    }
  } else {
    res.status(405).json({ error: "Méthode non autorisée" });
  }
}
