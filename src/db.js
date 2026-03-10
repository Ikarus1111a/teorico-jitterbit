const path = require('path');
const Database = require('better-sqlite3');

// arquivo database.sqlite na pasta raiz do projeto
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// fk
db.exec('PRAGMA foreign_keys = ON;');

// criar tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS "Order" (
    orderId TEXT PRIMARY KEY,
    value REAL NOT NULL,
    creationDate TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (orderId) REFERENCES "Order"(orderId) ON DELETE CASCADE
  );
`);

module.exports = { db };