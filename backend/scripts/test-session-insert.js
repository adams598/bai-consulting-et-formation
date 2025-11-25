import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL;

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function testInsert() {
  try {
    await client.connect();
    console.log("✅ Connecté à PostgreSQL\n");

    // Test avec une session
    const testSession = {
      id: "test-session-123",
      userId: "admin-1760951060306", // Un ID qui existe
      token: "test-token-123",
      expiresAt: new Date(1760953492281), // Timestamp Unix
      createdAt: new Date(1760952448082),
      lastActivity: new Date(1760952892281),
      refreshToken: null,
      ipAddress: null,
      userAgent: null,
    };

    console.log("🧪 Test d'insertion dans la table user_sessions...");
    console.log(
      "📊 Données:",
      {
        ...testSession,
        expiresAt: testSession.expiresAt.toISOString(),
        createdAt: testSession.createdAt.toISOString(),
        lastActivity: testSession.lastActivity.toISOString(),
      },
      "\n"
    );

    try {
      const result = await client.query(
        `INSERT INTO "user_sessions" (id, "userId", token, "expiresAt", "createdAt", "lastActivity", "refreshToken", "ipAddress", "userAgent")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          testSession.id,
          testSession.userId,
          testSession.token,
          testSession.expiresAt,
          testSession.createdAt,
          testSession.lastActivity,
          testSession.refreshToken,
          testSession.ipAddress,
          testSession.userAgent,
        ]
      );
      console.log("   ✅ Succès !");

      // Nettoyer
      await client.query('DELETE FROM "user_sessions" WHERE id = $1', [
        testSession.id,
      ]);
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      console.log(`   📋 Code: ${error.code}`);
    }

    await client.end();
  } catch (error) {
    console.error("❌ Erreur:", error);
    await client.end();
  }
}

testInsert();
