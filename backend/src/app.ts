import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import learnerRoutes from './routes/learner.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const prisma = new PrismaClient();

// Configuration Helmet avec headers de sécurité stricts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  xssFilter: true
}));

// Middleware
app.use(cors()); // CORS
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON avec limite

// Routes
app.use('/api/learner', learnerRoutes);

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
    console.log('Connecté à la base de données');
  })
  .catch((error) => {
    console.error('Erreur de connexion à la base de données:', error);
    process.exit(1);
  });

// Gestion de la fermeture propre
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Déconnecté de la base de données');
  process.exit(0);
});

export default app; 