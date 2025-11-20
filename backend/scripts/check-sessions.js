import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function checkSessions() {
  const db = await openSqlite();
  
  try {
    const rows = await getAll(db, 'SELECT id, expiresAt, createdAt, lastActivity FROM user_sessions LIMIT 3');
    
    rows.forEach((row, i) => {
      console.log(`Ligne ${i+1}:`);
      Object.keys(row).forEach(k => {
        const val = row[k];
        console.log(`  ${k}:`, typeof val, '=', val);
        if (typeof val === 'number' && val > 1000000000000) {
          console.log(`    → Date:`, new Date(val).toISOString());
        }
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    db.close();
  }
}

checkSessions();

