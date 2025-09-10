const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const fs = require('fs');

console.log('🧹 Création d\'une base de données vierge pour les clients...');

// Chemin vers la base de données vierge
const cleanDbPath = path.join(__dirname, 'database', 'main-clean.db');
const cleanDbDir = path.dirname(cleanDbPath);

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(cleanDbDir)) {
    fs.mkdirSync(cleanDbDir, { recursive: true });
}

// Supprimer l'ancienne DB vierge si elle existe
if (fs.existsSync(cleanDbPath)) {
    fs.unlinkSync(cleanDbPath);
}

// Créer une nouvelle base de données vierge
const db = new Database(cleanDbPath);

// Initialiser les tables vides
db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
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

    CREATE TABLE IF NOT EXISTS clients (
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

    CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        city TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        total_amount REAL NOT NULL,
        paid_amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT DEFAULT 'cash',
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Caissier',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT,
        date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Créer un utilisateur administrateur par défaut
const defaultPassword = 'admin123';
const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

db.prepare(`
    INSERT INTO users (username, password, role) 
    VALUES (?, ?, ?)
`).run('admin', hashedPassword, 'Propriétaire');

// Ajouter quelques paramètres par défaut
const settingsStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
settingsStmt.run('company_name', 'Mon Entreprise');
settingsStmt.run('company_address', '');
settingsStmt.run('company_phone', '');
settingsStmt.run('tax_rate', '20');
settingsStmt.run('currency', 'MAD');
settingsStmt.run('language', 'fr');
settingsStmt.run('theme', 'light');

db.close();

console.log('✅ Base de données vierge créée avec succès !');
console.log(`📍 Emplacement: ${cleanDbPath}`);
console.log('👤 Utilisateur par défaut: admin / admin123');
console.log('🏢 Nom d\'entreprise par défaut: Mon Entreprise');
