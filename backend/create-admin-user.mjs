#!/usr/bin/env node

/**
 * Script pour créer un utilisateur admin directement dans la base SQLite
 * Usage: node create-admin-user.mjs
 */

import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createAdminUser() {
  const dbPath = join(__dirname, "prisma", "dev.db");

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("❌ Erreur ouverture base de données:", err);
        reject(err);
        return;
      }
      console.log("✅ Connexion à la base de données réussie");
    });

    // Vérifier si l'utilisateur existe déjà
    db.get(
      "SELECT * FROM users WHERE email = ?",
      ["admin@bai-consulting.com"],
      async (err, row) => {
        if (err) {
          console.error("❌ Erreur vérification utilisateur:", err);
          db.close();
          reject(err);
          return;
        }

        if (row) {
          console.log("✅ Utilisateur admin@bai-consulting.com existe déjà");
          console.log("📧 Email:", row.email);
          console.log("👤 Nom:", row.firstName, row.lastName);
          console.log("🔑 Rôle:", row.role);
          db.close();
          resolve();
          return;
        }

        // Créer l'utilisateur admin
        try {
          const hashedPassword = await bcrypt.hash("admin123", 10);
          const userId = "admin-" + Date.now();

          db.run(
            `
          INSERT INTO users (
            id, email, password, firstName, lastName, role, 
            isActive, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            [
              userId,
              "admin@bai-consulting.com",
              hashedPassword,
              "Admin",
              "BAI",
              "SUPER_ADMIN",
              true,
              new Date().toISOString(),
              new Date().toISOString(),
            ],
            function (err) {
              if (err) {
                console.error("❌ Erreur création utilisateur:", err);
                db.close();
                reject(err);
                return;
              }

              console.log("✅ Utilisateur admin créé avec succès !");
              console.log("📧 Email: admin@bai-consulting.com");
              console.log("🔑 Mot de passe: admin123");
              console.log("👤 Nom: Admin BAI");
              console.log("🔑 Rôle: SUPER_ADMIN");
              console.log("");
              console.log("🌐 Vous pouvez maintenant vous connecter avec :");
              console.log("   Email: admin@bai-consulting.com");
              console.log("   Mot de passe: admin123");

              db.close();
              resolve();
            }
          );
        } catch (error) {
          console.error("❌ Erreur hashage mot de passe:", error);
          db.close();
          reject(error);
        }
      }
    );
  });
}

createAdminUser()
  .then(() => {
    console.log("✅ Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });















