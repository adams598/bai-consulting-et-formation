// Handler pour Vercel Serverless Functions à la racine
// Import synchrone simple - Vercel gère le reste
import app from '../backend/index.js';

// Export direct de l'app Express
// Vercel va appeler app(req, res) automatiquement
export default app;

