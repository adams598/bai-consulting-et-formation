import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import learnerRoutes from './routes/learner.routes';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const prisma = new PrismaClient();

// Middleware de base
app.use(cors({
  origin: true, // Permettre toutes les origines pour les images
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
})); // CORS
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON avec limite
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse FormData avec limite

// Servir les fichiers statiques (images uploadées) AVANT Helmet
const uploadsPath = path.resolve(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Configuration Helmet APRÈS les fichiers statiques (temporairement désactivé pour tester)
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "'unsafe-inline'"],
//       styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
//       fontSrc: ["'self'", "https://res.cloudinary.com"],
//       imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "http://localhost:3000", "http://localhost:3001", "blob:", "*"],
//       mediaSrc: ["'self'", "https://res.cloudinary.com"],
//       connectSrc: ["'self'"],
//       frameSrc: ["'none'"],
//       objectSrc: ["'none'"],
//       upgradeInsecureRequests: []
//     }
//   },
//   hsts: {
//     maxAge: 31536000,
//     includeSubDomains: true,
//     preload: true
//   },
//   noSniff: true,
//   referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
//   frameguard: { action: 'deny' },
//   xssFilter: true
// }));

// Route API pour servir les images (solution qui fonctionne)
app.get('/api/images/:type/:userFolder/:filename(*)', (req, res) => {
  const { type, userFolder, filename } = req.params;
  const imagePath = path.join(__dirname, '..', 'uploads', type, userFolder, filename);
  
  // console.log('🔍 Route /api/images appelée:');
  // console.log('  - type:', type);
  // console.log('  - userFolder:', userFolder);
  // console.log('  - filename:', filename);
  // console.log('  - imagePath:', imagePath);
  // console.log('  - exists:', require('fs').existsSync(imagePath));
  
  // Ajouter les en-têtes CORS explicites
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cache-Control', 'public, max-age=31536000');
  
  if (require('fs').existsSync(imagePath)) {
    // Déterminer le type MIME basé sur l'extension
    const ext = require('path').extname(filename).toLowerCase();
    let mimeType = 'image/jpeg'; // par défaut
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    res.setHeader('Content-Type', mimeType);
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: 'Image non trouvée', path: imagePath });
  }
});

// Route API spécifique pour les formations et leurs leçons
app.get('/api/formations/:formationTitle/lessons/:lessonTitle/:filename', (req, res) => {
  const { formationTitle, lessonTitle, filename } = req.params;
  const imagePath = path.join(__dirname, '..', 'uploads', 'formations', formationTitle, 'lessons', lessonTitle, filename);
  
  // console.log('🔍 Route /api/formations/lessons appelée:');
  // console.log('  - formationTitle:', formationTitle);
  // console.log('  - lessonTitle:', lessonTitle);
  // console.log('  - filename:', filename);
  // console.log('  - imagePath:', imagePath);
  // console.log('  - exists:', require('fs').existsSync(imagePath));
  
  // Ajouter les en-têtes CORS explicites
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cache-Control', 'public, max-age=31536000');
  
  if (require('fs').existsSync(imagePath)) {
    // Déterminer le type MIME basé sur l'extension
    const ext = require('path').extname(filename).toLowerCase();
    let mimeType = 'image/jpeg'; // par défaut
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    res.setHeader('Content-Type', mimeType);
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: 'Image non trouvée', path: imagePath });
  }
});

// Route API spécifique pour les images de couverture de formation
app.options('/api/formations/:formationTitle/:filename', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

app.get('/api/formations/:formationTitle/:filename', (req, res) => {
  const { formationTitle, filename } = req.params;
  const imagePath = path.join(__dirname, '..', 'uploads', 'formations', formationTitle, filename);
  
  // console.log('🔍 Route /api/formations couverture appelée:');
  // console.log('  - formationTitle:', formationTitle);
  // console.log('  - filename:', filename);
  // console.log('  - imagePath:', imagePath);
  // console.log('  - exists:', require('fs').existsSync(imagePath));
  
  // Ajouter les en-têtes CORS explicites et permissifs
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cache-Control', 'public, max-age=31536000');
  
  // Gérer la requête OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (require('fs').existsSync(imagePath)) {
    // Déterminer le type MIME basé sur l'extension
    const ext = require('path').extname(filename).toLowerCase();
    let mimeType = 'image/jpeg'; // par défaut
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    res.setHeader('Content-Type', mimeType);
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: 'Image non trouvée', path: imagePath });
  }
});

// Route API pour télécharger le catalogue PDF
app.get('/api/downloads/catalogue-pdf', (req, res) => {
  // En production (Render, Vercel, etc.) → rediriger directement vers Hostinger
  // Render SET la variable RENDER=true
  if (process.env.RENDER === 'true' || process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const pdfUrl = process.env.PDF_CATALOGUE_URL || 'https://olivedrab-hornet-656554.hostingersite.com/backend/uploads/BAI-Catalogue-Formations.pdf';
    return res.redirect(301, pdfUrl);
  }

  // En développement local, essayer de servir le fichier local
  const pdfPath = path.join(__dirname, '..', 'uploads', 'BAI.catalogue formations.pdf');
  
  // Si le fichier existe localement, le servir
  if (fs.existsSync(pdfPath)) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', 'attachment; filename="BAI-Catalogue-Formations.pdf"');
    res.header('Cache-Control', 'public, max-age=86400');
    return res.sendFile(pdfPath);
  }

  // Fichier local n'existe pas → rediriger vers Hostinger
  const pdfUrl = process.env.PDF_CATALOGUE_URL || 'https://olivedrab-hornet-656554.hostingersite.com/backend/uploads/BAI-Catalogue-Formations.pdf';
  res.redirect(301, pdfUrl);
});

// Routes
app.use('/api/learner', learnerRoutes);
app.use('/api/admin', adminRoutes);

// Gestion des erreurs
app.use(errorHandler);

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Route non trouvée'
  });
});

// Gestion de la connexion à la base de données
prisma.$connect()
  .then(() => {
    // console.log('Connecté à la base de données');
  })
  .catch((error) => {
    console.error('Erreur de connexion à la base de données:', error);
    process.exit(1);
  });

// Gestion de la fermeture propre
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  // console.log('Déconnecté de la base de données');
  process.exit(0);
});

export default app; 