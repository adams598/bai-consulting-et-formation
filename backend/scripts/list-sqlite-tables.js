import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlitePath = path.join(__dirname, '../prisma/dev.db');

function openSqlite() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqlitePath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function getAll(db, query) {
  return new Promise((resolve, reject) => {
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function listTables() {
  const db = await openSqlite();
  
  try {
    // Lister toutes les tables
    const tables = await getAll(
      db,
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%' ORDER BY name"
    );
    
    console.log(`📊 ${tables.length} tables trouvées dans SQLite:\n`);
    
    for (const table of tables) {
      const count = await getAll(db, `SELECT COUNT(*) as count FROM ${table.name}`);
      const rows = await getAll(db, `SELECT * FROM ${table.name} LIMIT 2`);
      
      console.log(`📦 ${table.name}`);
      console.log(`   Lignes: ${count[0].count}`);
      if (rows.length > 0) {
        console.log(`   Colonnes: ${Object.keys(rows[0]).join(', ')}`);
        console.log(`   Exemple: ${JSON.stringify(rows[0]).substring(0, 100)}...`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    db.close();
  }
}

listTables();

