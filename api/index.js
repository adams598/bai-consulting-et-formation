// Handler pour Vercel Serverless Functions à la racine
import app from '../backend/index.js';

// Vercel attend un handler qui reçoit (req, res)
// L'app Express est déjà configurée pour gérer les requêtes
export default app;

