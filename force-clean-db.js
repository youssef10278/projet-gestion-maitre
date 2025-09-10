const fs = require('fs');
const path = require('path');

console.log('🧹 FORÇAGE: Suppression et recréation de la base vierge...');

// Chemins
const cleanDbPath = path.join(__dirname, 'database', 'main-clean.db');
const cleanDbDir = path.dirname(cleanDbPath);

// Supprimer l'ancienne DB vierge
if (fs.existsSync(cleanDbPath)) {
    fs.unlinkSync(cleanDbPath);
    console.log('🗑️ Ancienne DB vierge supprimée');
}

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(cleanDbDir)) {
    fs.mkdirSync(cleanDbDir, { recursive: true });
}

// Créer un fichier SQLite vide avec juste la structure
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database(cleanDbPath);

// Structure complète mais VIDE
db.exec(`
    PRAGMA foreign_keys = ON;

    -- Table des produits (VIDE)
    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT UNIQUE,
        name TEXT NOT NULL,
        purchase_price REAL NOT NULL DEFAULT 0,
        price_retail REAL NOT NULL,
        price_wholesale REAL NOT NULL,
        price_carton REAL NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        alert_threshold INTEGER NOT NULL DEFAULT 0,
        pieces_per_carton INTEGER NOT NULL DEFAULT 0,
        category TEXT,
        supplier TEXT,
        description TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des clients (VIDE)
    CREATE TABLE clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        city TEXT,
        credit_limit REAL DEFAULT 0,
        current_credit REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des fournisseurs (VIDE)
    CREATE TABLE suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        city TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des ventes (VIDE)
    CREATE TABLE sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        total_amount REAL NOT NULL,
        paid_amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT DEFAULT 'cash',
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    -- Table des articles vendus (VIDE)
    CREATE TABLE sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Table des utilisateurs (SEULEMENT ADMIN)
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Caissier',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des paramètres
    CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    -- Table des dépenses (VIDE)
    CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT,
        date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// SEULEMENT l'utilisateur admin par défaut
const adminPassword = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', adminPassword, 'Propriétaire');

// Paramètres par défaut minimaux
const settings = [
    ['company_name', 'Mon Entreprise'],
    ['currency', 'MAD'],
    ['language', 'fr'],
    ['theme', 'light'],
    ['tax_rate', '20']
];

const settingsStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
settings.forEach(([key, value]) => settingsStmt.run(key, value));

db.close();

console.log('✅ Base de données VIERGE créée avec succès !');
console.log(`📍 Emplacement: ${cleanDbPath}`);
console.log('👤 SEUL utilisateur: admin / admin123');
console.log('📊 Tables: TOUTES VIDES (sauf admin et paramètres de base)');
