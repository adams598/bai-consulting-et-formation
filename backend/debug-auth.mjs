import fetch from "node-fetch";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function debugAuth() {
  console.log("🔍 Diagnostic du problème d'authentification\n");

  try {
    // 1. Vérifier si le serveur répond
    console.log("1. Test de connexion au serveur...");
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test", password: "test" }),
      });
      console.log(`✅ Serveur accessible (status: ${healthResponse.status})`);
    } catch (error) {
      console.log("❌ Serveur non accessible:", error.message);
      console.log(
        "💡 Assurez-vous que le serveur backend est démarré avec: npm start"
      );
      return;
    }

    // 2. Vérifier les utilisateurs dans la base de données
    console.log(
      "\n2. Vérification des utilisateurs dans la base de données..."
    );
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        lastLoginAt: true,
      },
    });

    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):`);
    users.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.email} (${user.firstName} ${user.lastName})`
      );
      console.log(`      - Rôle: ${user.role}`);
      console.log(`      - Actif: ${user.isActive}`);
      console.log(`      - Dernière connexion: ${user.lastLogin || "Jamais"}`);
      console.log(
        `      - Dernière connexion (nouveau): ${user.lastLoginAt || "Jamais"}`
      );
    });

    // 3. Tester les mots de passe
    console.log("\n3. Test des mots de passe...");
    const testEmails = [
      "admin@bai-consulting.com",
      "admin@example.com",
      "test@bai-consulting.com",
    ];

    for (const email of testEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, password: true, isActive: true },
      });

      if (user) {
        console.log(`\n   Utilisateur trouvé: ${email}`);
        console.log(`   - Actif: ${user.isActive}`);

        // Tester différents mots de passe
        const passwords = ["admin123", "admin", "password", "123456"];
        for (const password of passwords) {
          try {
            const isValid = await bcrypt.compare(password, user.password);
            console.log(
              `   - Mot de passe "${password}": ${
                isValid ? "✅ VALIDE" : "❌ invalide"
              }`
            );
            if (isValid) {
              console.log(
                `   🎉 MOT DE PASSE TROUVÉ: "${password}" pour ${email}`
              );
            }
          } catch (error) {
            console.log(
              `   - Erreur test mot de passe "${password}": ${error.message}`
            );
          }
        }
      } else {
        console.log(`   ❌ Utilisateur non trouvé: ${email}`);
      }
    }

    // 4. Tester l'API de connexion avec les identifiants valides
    console.log("\n4. Test de l'API de connexion...");
    for (const user of users) {
      if (user.isActive) {
        console.log(`\n   Test connexion pour: ${user.email}`);

        // Tester avec différents mots de passe
        const passwords = ["admin123", "admin", "password", "123456"];
        for (const password of passwords) {
          try {
            const response = await fetch(`${BASE_URL}/api/admin/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                password: password,
              }),
            });

            const data = await response.json();
            console.log(
              `   - Mot de passe "${password}": ${response.status} - ${data.message}`
            );

            if (response.ok) {
              console.log(
                `   🎉 CONNEXION RÉUSSIE avec "${password}" pour ${user.email}`
              );
              console.log(
                `   Token reçu: ${data.data?.accessToken ? "Oui" : "Non"}`
              );
            }
          } catch (error) {
            console.log(`   - Erreur test "${password}": ${error.message}`);
          }
        }
      }
    }

    // 5. Vérifier la configuration JWT
    console.log("\n5. Vérification de la configuration JWT...");
    console.log(
      `   - JWT_SECRET défini: ${process.env.JWT_SECRET ? "Oui" : "Non"}`
    );
    console.log(
      `   - JWT_REFRESH_SECRET défini: ${
        process.env.JWT_REFRESH_SECRET ? "Oui" : "Non"
      }`
    );
  } catch (error) {
    console.error("❌ Erreur lors du diagnostic:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic
debugAuth();
