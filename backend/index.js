import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";
import { sendContactMail } from "./src/services/contactMail.service.js";
import {
  validateInput,
  sanitizeBody,
  chatSchema,
  contactSchema,
} from "./src/middleware/validation.middleware.js";
import {
  securityLogger,
  blockSuspiciousRequests,
  addSecurityHeaders,
} from "./src/middleware/security.middleware.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares de sécurité
app.use(addSecurityHeaders);
app.use(securityLogger);
app.use(blockSuspiciousRequests);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: {
    error: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite les tentatives de connexion
  message: {
    error: "Trop de tentatives de connexion, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuration CORS sécurisée
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://olivedrab-hornet-656554.hostingersite.com",
      "http://localhost:5173",
      "https://backend-k05cpsnj6-adams-projects-b35f6371.vercel.app",
    ];

    // Autoriser les requêtes sans origine (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(limiter); // Rate limiting global
app.use(express.json({ limit: "10mb" })); // Limiter la taille des requêtes

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Base de connaissances des formations
const formations = [
  {
    domaine: "Banque",
    titre: "Fondamentaux de la Banque Commerciale",
    description:
      "Découvrir les bases du secteur bancaire, les produits, la relation client et la conformité.",
    lien: "/banque",
  },
  {
    domaine: "Banque",
    titre: "Introduction à la Banque Digitale",
    description:
      "Comprendre la transformation digitale dans le secteur bancaire.",
    lien: "/banque",
  },
  {
    domaine: "Assurance",
    titre: "Introduction à l'Assurance et la Prévoyance",
    description:
      "Vue d'ensemble des produits d'assurance, prévoyance, risques et sinistres.",
    lien: "/assurance",
  },
  {
    domaine: "Assurance",
    titre: "Gestion des risques en assurance",
    description:
      "Maîtriser les fondamentaux de la gestion des risques et sinistres.",
    lien: "/assurance",
  },
  {
    domaine: "Immobilier",
    titre: "Bases de la Transaction Immobilière",
    description:
      "Apprendre les processus d'achat, de vente et de gestion locative.",
    lien: "/immobilier",
  },
  {
    domaine: "Immobilier",
    titre: "Expertise en évaluation immobilière",
    description:
      "Acquérir les compétences pour l'évaluation professionnelle de biens immobiliers.",
    lien: "/immobilier",
  },
];

const faq = [
  {
    question: "Quels types de formation proposez-vous ?",
    reponse: `Bonjour et merci pour votre question !\n\nChez BAI Consulting, nous proposons un large choix de formations professionnelles dans les domaines suivants :\n\n• **Banque**\n   - Fondamentaux de la banque commerciale\n   - Banque digitale\n   - Conformité, relation client, etc.\n\n• **Assurance & Prévoyance**\n   - Introduction à l'assurance et la prévoyance\n   - Gestion des risques, produits IARD, etc.\n\n• **Immobilier**\n   - Transaction immobilière\n   - Gestion locative\n   - Expertise immobilière\n\nSouhaitez-vous des informations détaillées sur une formation ou un domaine en particulier ? Je suis là pour vous guider !`,
  },
  {
    question: "Comment puis-je m'inscrire à une formation ?",
    reponse:
      "Pour vous inscrire à une formation, rendez-vous sur la page de la formation souhaitée et cliquez sur 'S'inscrire'. Vous pouvez aussi nous contacter via le formulaire de contact pour un accompagnement personnalisé.",
  },
  {
    question: "Où se déroulent les formations ?",
    reponse:
      "Nos formations sont proposées en ligne et en présentiel selon les modules. Les détails sont précisés sur chaque page de formation.",
  },
  {
    question: "Comment contacter le support technique ?",
    reponse:
      "Vous pouvez contacter notre support technique via le formulaire de contact ou par email à contact@bai-consulting.com.",
  },
];

app.post(
  "/api/chat",
  sanitizeBody,
  validateInput(chatSchema),
  async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "Message requis" });

      let assistantResponse = null;
      const lowerMessage = message.toLowerCase();

      // FAQ directes
      for (const item of faq) {
        if (lowerMessage.includes(item.question.toLowerCase().slice(0, 20))) {
          assistantResponse = item.reponse;
          break;
        }
      }

      // Questions sur les formations par domaine
      if (
        !assistantResponse &&
        lowerMessage.includes("formation") &&
        lowerMessage.includes("banque")
      ) {
        const banque = formations.filter((f) => f.domaine === "Banque");
        assistantResponse =
          `Voici quelques formations en Banque :\n` +
          "</br>" +
          banque.map((f) => `- ${f.titre} : ${f.description}`).join("\n");
      } else if (
        !assistantResponse &&
        lowerMessage.includes("formation") &&
        lowerMessage.includes("assurance")
      ) {
        const assurance = formations.filter((f) => f.domaine === "Assurance");
        assistantResponse =
          `Voici quelques formations en Assurance :\n` +
          assurance.map((f) => `- ${f.titre} : ${f.description}`).join("\n");
      } else if (
        !assistantResponse &&
        lowerMessage.includes("formation") &&
        lowerMessage.includes("immobilier")
      ) {
        const immo = formations.filter((f) => f.domaine === "Immobilier");
        assistantResponse =
          `Voici quelques formations en Immobilier :\n` +
          immo.map((f) => `- ${f.titre} : ${f.description}`).join("\n");
      }

      // Question sur toutes les formations
      if (
        !assistantResponse &&
        lowerMessage.includes("toutes les formations")
      ) {
        assistantResponse =
          `Voici l'ensemble de nos formations :\n` +
          formations
            .map((f) => `- [${f.domaine}] ${f.titre} : ${f.description}`)
            .join("\n");
      }

      // Questions d'orientation
      if (
        !assistantResponse &&
        lowerMessage.includes("quelle formation choisir")
      ) {
        assistantResponse =
          `Pour vous orienter, pouvez-vous préciser votre domaine d'intérêt (banque, assurance, immobilier) ou votre objectif professionnel ? Voici quelques exemples :\n` +
          formations.map((f) => `- [${f.domaine}] ${f.titre}`).join("\n");
      }

      // Logique existante pour "par quelle formation commencer"
      if (
        !assistantResponse &&
        lowerMessage.includes("par quelle formation commencer") &&
        lowerMessage.includes("banque")
      ) {
        assistantResponse =
          "Pour débuter dans le domaine de la banque sans expérience préalable, nous vous recommandons de commencer par notre formation 'Fondamentaux de la Banque Commerciale'. Elle couvre les bases essentielles du secteur.";
      } else if (
        !assistantResponse &&
        lowerMessage.includes("par quelle formation commencer") &&
        lowerMessage.includes("assurance")
      ) {
        assistantResponse =
          "Si vous débutez dans l'assurance, notre formation 'Introduction à l'Assurance et la Prévoyance' est idéale. Elle vous donnera une vue d'ensemble des produits et du marché.";
      } else if (
        !assistantResponse &&
        lowerMessage.includes("par quelle formation commencer") &&
        lowerMessage.includes("immobilier")
      ) {
        assistantResponse =
          "Pour commencer dans l'immobilier, la formation 'Bases de la Transaction Immobilière' est un excellent point de départ. Vous y apprendrez les processus d'achat et de vente.";
      }

      // Si aucune réponse prédéfinie, fallback sur OpenAI avec contexte
      if (!assistantResponse) {
        const context =
          `Voici la liste des formations proposées par BAI Consulting :\n` +
          formations
            .map((f) => `- [${f.domaine}] ${f.titre} : ${f.description}`)
            .join("\n");
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Vous êtes un assistant virtuel de BAI Formation Consulting. Vous aidez les utilisateurs à trouver des informations sur les formations et à répondre à leurs questions. Répondez toujours en français de manière professionnelle et concise. Utilisez le contexte suivant pour répondre :\n" +
                context,
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });
        assistantResponse = completion.choices[0].message.content;
      }

      res.json({ response: assistantResponse });
    } catch (error) {
      console.error("Erreur API Chat:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la génération de la réponse." });
    }
  }
);

app.post(
  "/api/contact",
  sanitizeBody,
  validateInput(contactSchema),
  async (req, res) => {
    // CORS headers dynamiques
    const allowedOrigins = [
      "https://olivedrab-hornet-656554.hostingersite.com",
      "https://backend-rczbsah5t-adams-projects-b35f6371.vercel.app",
      "http://localhost:5173",
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    const { name, email, message, phone } = req.body;
    try {
      await sendContactMail({ name, email, message, phone });
      res.status(200).json({ message: "Message envoyé avec succès" });
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi du message" });
    }
  }
);

app.listen(port, () => {
  console.log(`Serveur backend démarré sur http://localhost:${port}`);
});
