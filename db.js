const sqlite3 = require('sqlite3').verbose();

// Create database
const db = new sqlite3.Database('./inventory.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    supplier_id INTEGER,
    quantity INTEGER DEFAULT 0,
    location_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories (id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
    FOREIGN KEY (location_id) REFERENCES locations (id)
  )`);
});

module.exports = db;