import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";
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
import {
  monitoringMiddleware,
  securityMonitoringMiddleware,
  loginMonitoringMiddleware,
} from "./src/middleware/monitoring.middleware.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares de sécurité
app.use(addSecurityHeaders);
app.use(securityLogger);
app.use(blockSuspiciousRequests);

// Middlewares de monitoring
app.use(monitoringMiddleware);
app.use(securityMonitoringMiddleware);
app.use(loginMonitoringMiddleware);

// Rate limiting sécurisé pour application bancaire
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 500, // Limite stricte en production
  message: {
    error: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting pour les health checks
    return req.path === "/api/admin/auth/health";
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limite stricte pour les tentatives de connexion
  message: {
    error: "Trop de tentatives de connexion, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les connexions réussies
});

// Configuration CORS sécurisée
const defaultOrigins =
  process.env.NODE_ENV === "production"
    ? [
        "https://olivedrab-hornet-656554.hostingersite.com",
        "https://bai-consulting-et-formation-1.onrender.com",
      ]
    : [
        "http://localhost:3001",
        "http://localhost:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3000",
      ];

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : defaultOrigins;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin non autorisée: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(limiter); // Rate limiting global
app.use(express.json({ limit: "10mb" })); // Limiter la taille des requêtes

// Import des routes
import adminRoutes from "./src/routes/admin.routes.js";
import learnerRoutes from "./src/routes/learner.routes.js";
import calendarIntegrationRoutes from "./src/routes/calendarIntegration.js";
import { calendarController } from "./src/controllers/calendar.controller.js";
import { authMiddleware } from "./src/middleware/auth.middleware.js";

// Route API pour servir les images
app.get("/api/images/:type/:userFolder/:filename", (req, res) => {
  const { type, userFolder, filename } = req.params;
  const imagePath = path.join(
    process.cwd(),
    "uploads",
    type,
    userFolder,
    filename
  );

  console.log("🔍 Route /api/images appelée:");
  console.log("  - type:", type);
  console.log("  - userFolder:", userFolder);
  console.log("  - filename:", filename);
  console.log("  - imagePath:", imagePath);
  console.log("  - exists:", fs.existsSync(imagePath));

  // Ajouter les en-têtes CORS pour les images
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  res.header("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.header("Cross-Origin-Opener-Policy", "unsafe-none");

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: "Image non trouvée", path: imagePath });
  }
});

// Route API spécifique pour les images de couverture de formation
app.options("/api/formations/:formationTitle/:filename", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  res.header("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.header("Cross-Origin-Opener-Policy", "unsafe-none");
  res.status(200).end();
});

app.get("/api/formations/:formationTitle/:filename", (req, res) => {
  const { formationTitle, filename } = req.params;
  const imagePath = path.join(
    process.cwd(),
    "uploads",
    "formations",
    formationTitle,
    filename
  );

  console.log("🔍 Route /api/formations couverture appelée:");
  console.log("  - formationTitle:", formationTitle);
  console.log("  - filename:", filename);
  console.log("  - imagePath:", imagePath);
  console.log("  - exists:", fs.existsSync(imagePath));

  // Ajouter les en-têtes CORS explicites et permissifs
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  res.header("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.header("Cross-Origin-Opener-Policy", "unsafe-none");
  res.header("Cache-Control", "public, max-age=31536000");

  if (fs.existsSync(imagePath)) {
    // Déterminer le type MIME basé sur l'extension
    const ext = path.extname(filename).toLowerCase();
    let mimeType = "image/jpeg"; // par défaut

    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".gif") mimeType = "image/gif";
    else if (ext === ".webp") mimeType = "image/webp";

    res.setHeader("Content-Type", mimeType);
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: "Image non trouvée", path: imagePath });
  }
});

// Route publique pour servir les fichiers d'opportunités commerciales
app.options("/api/opportunities/files/:filename", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  res.header("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.header("Cross-Origin-Opener-Policy", "unsafe-none");
  res.status(200).end();
});

app.get("/api/opportunities/files/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), "uploads", "OC", filename);

  console.log("🔍 Route /api/opportunities/files appelée:");
  console.log("  - filename:", filename);
  console.log("  - filePath:", filePath);
  console.log("  - exists:", fs.existsSync(filePath));

  // Ajouter les en-têtes CORS explicites et permissifs
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  res.header("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.header("Cross-Origin-Opener-Policy", "unsafe-none");
  res.header("Cache-Control", "public, max-age=31536000");

  if (fs.existsSync(filePath)) {
    // Déterminer le type MIME basé sur l'extension
    const ext = path.extname(filename).toLowerCase();
    let mimeType = "application/octet-stream"; // par défaut

    if (ext === ".pdf") mimeType = "application/pdf";
    else if (ext === ".doc") mimeType = "application/msword";
    else if (ext === ".docx")
      mimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === ".ppt") mimeType = "application/vnd.ms-powerpoint";
    else if (ext === ".pptx")
      mimeType =
        "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    else if (ext === ".xls") mimeType = "application/vnd.ms-excel";
    else if (ext === ".xlsx")
      mimeType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === ".txt") mimeType = "text/plain";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "Fichier non trouvé", path: filePath });
  }
});

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/learner", learnerRoutes);
app.use("/api/calendar", calendarIntegrationRoutes);

// Routes pour les opérations CRUD du calendrier
app.get(
  "/api/calendar/events",
  authMiddleware,
  calendarController.getUserEvents
);
app.post(
  "/api/calendar/events",
  authMiddleware,
  calendarController.createEvent
);
app.put(
  "/api/calendar/events/:id",
  authMiddleware,
  calendarController.updateEvent
);
app.delete(
  "/api/calendar/events/:id",
  authMiddleware,
  calendarController.deleteEvent
);
app.get(
  "/api/calendar/events/range",
  authMiddleware,
  calendarController.getEventsByDateRange
);
app.get(
  "/api/calendar/upcoming",
  authMiddleware,
  calendarController.getUpcomingDeadlines
);

// Import des nouvelles routes unifiées pour les apprenants
import learnerUnifiedRoutes from "./src/routes/learner-unified.routes.js";
app.use("/api/learner-unified", learnerUnifiedRoutes);

// Import des routes de suivi de progression des utilisateurs
import userProgressRoutes from "./src/routes/user-progress.routes.js";
app.use("/api/user-progress", userProgressRoutes);

// Import des routes de suivi des consultations de contenu
import contentVisitsRoutes from "./src/routes/content-visits.routes.js";
app.use("/api/content-visits", contentVisitsRoutes);

// Import du middleware de suivi des consultations de contenu
import { contentVisitMiddleware } from "./src/middleware/content-visit.middleware.js";

// Middleware de suivi des consultations (après auth mais avant les routes)
app.use(
  contentVisitMiddleware({
    trackDuration: true,
    trackUserAgent: true,
    trackIpAddress: true,
    trackReferrer: true,
  })
);

// Initialisation conditionnelle d'OpenAI
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

// Routes d'administration (suppression de la duplication)

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
        if (openai) {
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
        } else {
          assistantResponse =
            "Je ne peux pas traiter votre demande pour le moment. Veuillez réessayer plus tard ou nous contacter directement.";
        }
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

// Configuration SSL/TLS
const sslOptions = {
  key: process.env.SSL_KEY_PATH
    ? fs.readFileSync(process.env.SSL_KEY_PATH)
    : null,
  cert: process.env.SSL_CERT_PATH
    ? fs.readFileSync(process.env.SSL_CERT_PATH)
    : null,
};

// Démarrage du serveur avec SSL si les certificats sont disponibles
if (sslOptions.key && sslOptions.cert) {
  const httpsServer = https.createServer(sslOptions, app);
  httpsServer.listen(port, () => {
    console.log(`🔒 Serveur HTTPS démarré sur https://localhost:${port}`);
    console.log(`📜 Certificat SSL: ${process.env.SSL_CERT_PATH}`);
    console.log(`🔑 Clé SSL: ${process.env.SSL_KEY_PATH}`);
  });
} else {
  // Serveur HTTP pour le développement
  app.listen(port, () => {
    console.log(`🌐 Serveur HTTP démarré sur http://localhost:${port}`);
    if (process.env.NODE_ENV === "production") {
      console.log("⚠️  ATTENTION: SSL non configuré en production !");
      console.log("📝 Configurez SSL_CERT_PATH et SSL_KEY_PATH dans .env");
    }
  });
}
