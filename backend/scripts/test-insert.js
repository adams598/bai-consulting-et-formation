import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL;

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function testInsert() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');

    // Test avec une simple insertion
    const testUser = {
      id: 'test-123',
      email: 'test@example.com',
      password: 'test',
      firstName: 'Test',
      lastName: 'User',
      role: 'COLLABORATOR',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('🧪 Test d\'insertion dans la table users...');
    console.log('📊 Données:', JSON.stringify(testUser, null, 2), '\n');

    // Test 1: Avec paramètres positionnels
    console.log('Test 1: INSERT avec paramètres positionnels');
    try {
      const result1 = await client.query(
        `INSERT INTO "users" (id, email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          testUser.id,
          testUser.email,
          testUser.password,
          testUser.firstName,
          testUser.lastName,
          testUser.role,
          testUser.isActive,
          testUser.createdAt,
          testUser.updatedAt,
        ]
      );
      console.log('   ✅ Succès avec paramètres positionnels\n');
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      console.log(`   📋 Détails:`, error);
    }

    // Nettoyer
    await client.query('DELETE FROM "users" WHERE id = $1', [testUser.id]);

    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
  }
}

testInsert();

