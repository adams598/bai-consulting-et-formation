import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

console.log("=== Configuration SMTP ===");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS (complet):", process.env.SMTP_PASS);
console.log("SMTP_FROM:", process.env.SMTP_FROM);

console.log("\n=== Test de connexion SMTP (port 465 avec SSL) ===");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: true,
  debug: true,
});

try {
  console.log("Tentative de vérification...");
  const verified = await transporter.verify();
  console.log("✅ Connexion SMTP réussie !");
  console.log("Verified:", verified);
} catch (error) {
  console.log("❌ Erreur SMTP:", error.message);
  console.log("Code:", error.code);
  console.log("Commande:", error.command);
  console.log("Response:", error.response);
}
