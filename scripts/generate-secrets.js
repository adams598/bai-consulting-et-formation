#!/usr/bin/env node

/**
 * Script pour générer des secrets sécurisés pour BAI Consulting
 * Usage: node scripts/generate-secrets.js
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

// Générer des secrets sécurisés
const secrets = {
  JWT_SECRET: crypto.randomBytes(64).toString("hex"),
  JWT_REFRESH_SECRET: crypto.randomBytes(128).toString("hex"),
  REDIS_PASSWORD: crypto.randomBytes(32).toString("hex"),
  POSTGRES_PASSWORD: crypto.randomBytes(32).toString("hex"),
  ENCRYPTION_KEY: crypto.randomBytes(32).toString("hex"),
  SESSION_SECRET: crypto.randomBytes(64).toString("hex"),
};

// Afficher les secrets générés
console.log("🔐 Secrets sécurisés générés pour BAI Consulting\n");
console.log("Copiez ces valeurs dans votre fichier .env :\n");

Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log("\n⚠️  IMPORTANT:");
console.log("- Gardez ces secrets confidentiels");
console.log("- Ne les commitez jamais dans Git");
console.log("- Utilisez des valeurs différentes en production");
console.log("- Changez-les régulièrement");

// Optionnel: créer un fichier .env.example avec des placeholders
const envExamplePath = path.join(process.cwd(), ".env.example");
const envExampleContent = `# Configuration BAI Consulting
# ⚠️ IMPORTANT: Remplacez ces valeurs par vos secrets réels

# Environnement
NODE_ENV=development

# Base de données
DATABASE_URL=postgresql://bai_user:CHANGEZ_MOI@localhost:5432/bai_consulting
POSTGRES_PASSWORD=CHANGEZ_MOI

# JWT Secrets
JWT_SECRET=CHANGEZ_MOI
JWT_REFRESH_SECRET=CHANGEZ_MOI

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=CHANGEZ_MOI
REDIS_DB=0

# OpenAI
OPENAI_API_KEY=CHANGEZ_MOI

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=CHANGEZ_MOI
SMTP_PASS=CHANGEZ_MOI

# Sécurité
ENCRYPTION_KEY=CHANGEZ_MOI
SESSION_SECRET=CHANGEZ_MOI

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Logging
LOG_LEVEL=info
`;

if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, envExampleContent);
  console.log("\n✅ Fichier .env.example créé");
}

console.log("\n🚀 Prochaines étapes:");
console.log("1. Copiez les secrets ci-dessus dans votre fichier .env");
console.log("2. Modifiez les autres valeurs selon votre configuration");
console.log("3. Lancez: ./scripts/start-secure.sh dev");




























