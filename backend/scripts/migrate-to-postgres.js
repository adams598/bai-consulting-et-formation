import pg from 'pg';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

// Connexion SQLite
const sqlitePath = path.join(__dirname, '../prisma/dev.db');
console.log('📂 Connexion SQLite:', sqlitePath);

// Connexion PostgreSQL (Neon)
const postgresUrl = process.env.DATABASE_URL;
if (!postgresUrl || !postgresUrl.includes('postgresql://')) {
  console.error('❌ DATABASE_URL non définie ou incorrecte dans .env');
  console.error('💡 Assure-toi que DATABASE_URL pointe vers ta base Neon PostgreSQL');
  console.error('💡 Format: postgresql://user:pass@host/db');
  process.exit(1);
}

console.log('📂 Connexion PostgreSQL (Neon)...');
const postgres = new Client({
  connectionString: postgresUrl,
  ssl: { rejectUnauthorized: false },
});

// Ouvrir SQLite de manière asynchrone
function openSqlite() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqlitePath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function getTableNames(db) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'",
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => row.name));
      }
    );
  });
}

function getTableData(db, tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function migrateData() {
  let sqliteDb;
  try {
    console.log('🔄 Début de la migration...\n');

    // Connecter à PostgreSQL
    await postgres.connect();
    console.log('✅ PostgreSQL connecté\n');

    // Ouvrir SQLite
    sqliteDb = await openSqlite();
    console.log('✅ SQLite connecté\n');

    // Liste toutes les tables
    const allTables = await getTableNames(sqliteDb);
    console.log(`📊 ${allTables.length} tables trouvées:`, allTables.join(', '), '\n');
    
    // Ordre de migration pour respecter les dépendances (tables sans clés étrangères d'abord)
    // Les tables qui n'ont pas de dépendances peuvent être migrées en premier
    const orderedTables = [
      'banks',           // Pas de dépendances
      'users',           // Peut avoir bankId mais pas obligatoire
      'universes',       // Pas de dépendances
      'formations',      // Dépend de users (createdBy), banks (bankId), universes (universeId)
      'universe_formations', // Dépend de universes, formations
      'formation_content',   // Dépend de formations
      'formation_assignments', // Dépend de users, formations
      'quizzes',         // Dépend de formations
      'quiz_questions',  // Dépend de quizzes
      'quiz_answers',    // Dépend de quiz_questions
      'quiz_attempts',   // Dépend de users, quizzes
      'notifications',   // Dépend de users
      'user_sessions',   // Dépend de users
      'calendar_events', // Dépend de users, formations, lessons
      // Tables qui peuvent être vides
      'bank_formations',
      'user_formation_assignments',
      'UserProgress',
      'certificates',
      'content_visits',
      'calendar_integrations',
    ];
    
    // Utiliser l'ordre défini, puis ajouter les tables qui n'y sont pas
    const tables = [
      ...orderedTables.filter(t => allTables.includes(t)),
      ...allTables.filter(t => !orderedTables.includes(t))
    ];

    // Créer les tables dans PostgreSQL d'abord
    console.log('📋 Création des tables dans PostgreSQL...');
    console.log('💡 Si les tables existent déjà, Prisma les ignorera\n');

    // Pour chaque table, migrer les données
    for (const tableName of tables) {
      console.log(`📦 Migration de la table: ${tableName}`);

      const rows = await getTableData(sqliteDb, tableName);

      if (rows.length === 0) {
        console.log(`   ⚠️  Table vide, ignorée\n`);
        continue;
      }

      console.log(`   📥 ${rows.length} lignes à migrer`);

      // Utiliser Prisma $executeRawUnsafe pour insérer les données
      try {
        // Pour chaque ligne, construire et exécuter un INSERT
        let inserted = 0;
        let errors = 0;
        
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = Object.values(row).map((val, idx) => {
            // Convertir les valeurs pour PostgreSQL
            if (val === null || val === undefined) return null;
            
            const columnName = columns[idx].toLowerCase();
            
            // Détecter les colonnes de dates (par leur nom)
            const isDateColumn = columnName.includes('at') || 
                                 columnName.includes('date') ||
                                 columnName === 'expiresat' || 
                                 columnName === 'duedate' || 
                                 columnName === 'startdate' || 
                                 columnName === 'enddate' ||
                                 columnName === 'lastlogin' ||
                                 columnName === 'lastloginat';
            
            // Si c'est une colonne de date
            if (isDateColumn) {
              // Si c'est déjà une string ISO, on la garde telle quelle
              if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
                return val;
              }
              // Si c'est un nombre (timestamp Unix en millisecondes), le convertir
              if (typeof val === 'number' && val > 1000000000000 && val < 9999999999999) {
                return new Date(val);
              }
            }
            
            // Les booléens SQLite (0/1) - certains champs peuvent être des booléens
            if (typeof val === 'number' && (
                columnName.startsWith('is') || 
                columnName.startsWith('has') ||
                columnName === 'isactive' || 
                columnName === 'isarchived' || 
                columnName === 'isallday' || 
                columnName === 'isrecurring' || 
                columnName === 'ispassed' || 
                columnName === 'isread' ||
                columnName === 'quizrequired')) {
              return val === 1;
            }
            
            // Tout le reste reste tel quel
            return val;
          });
          
          // Construire les placeholders PostgreSQL ($1, $2, etc.)
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          const columnNames = columns.map((col) => `"${col}"`).join(', ');
          
            try {
            // Utiliser ON CONFLICT seulement si on a un ID (presque toutes les tables Prisma en ont)
            const hasId = columns.includes('id');
            const conflictClause = hasId ? 'ON CONFLICT (id) DO NOTHING' : '';
            
            const query = `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders}) ${conflictClause}`;
            
            await postgres.query(query, values);
            inserted++;
            
            // Afficher la progression tous les 10 enregistrements
            if (inserted % 10 === 0) {
              process.stdout.write(`   ⏳ ${inserted}/${rows.length}...\r`);
            }
          } catch (insertError) {
            errors++;
            // Afficher seulement les 5 premières erreurs pour éviter le spam
            if (errors <= 5) {
              const errorMsg = insertError.message || insertError.toString() || 'Erreur inconnue';
              console.log(`   ⚠️  Erreur ligne ${inserted + errors}: ${errorMsg.split('\n')[0]}`);
            }
          }
        }
        
        if (errors > 0 && errors <= 5) {
          console.log(`   ⚠️  ${errors} erreurs rencontrées`);
        } else if (errors > 5) {
          console.log(`   ⚠️  ${errors} erreurs rencontrées (seulement les 5 premières affichées)`);
        }

        console.log(`   ✅ ${inserted}/${rows.length} lignes migrées${errors > 0 ? ` (${errors} erreurs)` : ''}\n`);
      } catch (error) {
        console.error(`   ❌ Erreur lors de la migration de ${tableName}:`, error.message);
        console.log(`   ⏭️  Passage à la table suivante...\n`);
      }
    }

    console.log('✅ Migration terminée !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
    }
    if (postgres) {
      await postgres.end();
    }
  }
}

// Exécuter la migration
migrateData()
  .then(() => {
    console.log('\n🎉 Tout est terminé !');
    console.log('💡 Tu peux maintenant tester ta connexion en local');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
