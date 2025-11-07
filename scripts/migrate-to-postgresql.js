#!/usr/bin/env node

/**
 * Script de migration de SQLite vers PostgreSQL
 * Usage: node scripts/migrate-to-postgresql.js
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Configuration PostgreSQL
const POSTGRESQL_URL =
  process.env.DATABASE_URL ||
  "postgresql://bai_user:bai_password@localhost:5432/bai_consulting";

console.log("🚀 Migration de SQLite vers PostgreSQL");
console.log("=====================================");

async function migrateToPostgreSQL() {
  let sqliteClient = null;
  let postgresClient = null;

  try {
    // 1. Connexion à SQLite (données existantes)
    console.log("📊 Connexion à SQLite...");
    sqliteClient = new PrismaClient({
      datasources: {
        db: {
          url: "file:./prisma/dev.db",
        },
      },
    });

    // 2. Connexion à PostgreSQL (destination)
    console.log("🐘 Connexion à PostgreSQL...");
    postgresClient = new PrismaClient({
      datasources: {
        db: {
          url: POSTGRESQL_URL,
        },
      },
    });

    // 3. Test des connexions
    await sqliteClient.$connect();
    await postgresClient.$connect();
    console.log("✅ Connexions établies");

    // 4. Migration des données
    console.log("📦 Début de la migration des données...");

    // Migration des utilisateurs
    console.log("👥 Migration des utilisateurs...");
    const users = await sqliteClient.user.findMany();
    for (const user of users) {
      await postgresClient.user.create({
        data: {
          ...user,
          role: user.role.toUpperCase(), // Conversion vers enum
        },
      });
    }
    console.log(`✅ ${users.length} utilisateurs migrés`);

    // Migration des banques
    console.log("🏦 Migration des banques...");
    const banks = await sqliteClient.bank.findMany();
    for (const bank of banks) {
      await postgresClient.bank.create({
        data: bank,
      });
    }
    console.log(`✅ ${banks.length} banques migrées`);

    // Migration des univers
    console.log("🌌 Migration des univers...");
    const universes = await sqliteClient.universe.findMany();
    for (const universe of universes) {
      await postgresClient.universe.create({
        data: universe,
      });
    }
    console.log(`✅ ${universes.length} univers migrés`);

    // Migration des formations
    console.log("📚 Migration des formations...");
    const formations = await sqliteClient.formation.findMany();
    for (const formation of formations) {
      await postgresClient.formation.create({
        data: formation,
      });
    }
    console.log(`✅ ${formations.length} formations migrées`);

    // Migration du contenu des formations
    console.log("📄 Migration du contenu des formations...");
    const contents = await sqliteClient.formationContent.findMany();
    for (const content of contents) {
      await postgresClient.formationContent.create({
        data: {
          ...content,
          type: content.type.toUpperCase(), // Conversion vers enum
        },
      });
    }
    console.log(`✅ ${contents.length} contenus migrés`);

    // Migration des quiz
    console.log("❓ Migration des quiz...");
    const quizzes = await sqliteClient.quiz.findMany();
    for (const quiz of quizzes) {
      await postgresClient.quiz.create({
        data: quiz,
      });
    }
    console.log(`✅ ${quizzes.length} quiz migrés`);

    // Migration des questions de quiz
    console.log("❓ Migration des questions de quiz...");
    const questions = await sqliteClient.quizQuestion.findMany();
    for (const question of questions) {
      await postgresClient.quizQuestion.create({
        data: {
          ...question,
          type: question.type.toLowerCase(), // Conversion vers enum
        },
      });
    }
    console.log(`✅ ${questions.length} questions migrées`);

    // Migration des réponses
    console.log("💬 Migration des réponses...");
    const answers = await sqliteClient.quizAnswer.findMany();
    for (const answer of answers) {
      await postgresClient.quizAnswer.create({
        data: answer,
      });
    }
    console.log(`✅ ${answers.length} réponses migrées`);

    // Migration des progrès utilisateur
    console.log("📈 Migration des progrès utilisateur...");
    const progresses = await sqliteClient.userProgress.findMany();
    for (const progress of progresses) {
      await postgresClient.userProgress.create({
        data: progress,
      });
    }
    console.log(`✅ ${progresses.length} progrès migrés`);

    // Migration des notifications
    console.log("🔔 Migration des notifications...");
    const notifications = await sqliteClient.notification.findMany();
    for (const notification of notifications) {
      await postgresClient.notification.create({
        data: {
          ...notification,
          type: notification.type.toUpperCase(), // Conversion vers enum
        },
      });
    }
    console.log(`✅ ${notifications.length} notifications migrées`);

    console.log("🎉 Migration terminée avec succès !");
    console.log("=====================================");
    console.log("📊 Résumé de la migration:");
    console.log(`- Utilisateurs: ${users.length}`);
    console.log(`- Banques: ${banks.length}`);
    console.log(`- Univers: ${universes.length}`);
    console.log(`- Formations: ${formations.length}`);
    console.log(`- Contenus: ${contents.length}`);
    console.log(`- Quiz: ${quizzes.length}`);
    console.log(`- Questions: ${questions.length}`);
    console.log(`- Réponses: ${answers.length}`);
    console.log(`- Progrès: ${progresses.length}`);
    console.log(`- Notifications: ${notifications.length}`);
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    // Fermeture des connexions
    if (sqliteClient) {
      await sqliteClient.$disconnect();
    }
    if (postgresClient) {
      await postgresClient.$disconnect();
    }
  }
}

// Exécution
migrateToPostgreSQL()
  .then(() => {
    console.log("✅ Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });





















