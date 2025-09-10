-- Script SQL pour créer une base de données vierge
PRAGMA foreign_keys = ON;

-- Table des produits (VIDE)
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

-- Table des clients (VIDE)
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

-- Table des fournisseurs (VIDE)
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des ventes (VIDE)
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

-- Table des articles vendus (VIDE)
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

-- Table des utilisateurs (SEULEMENT ADMIN)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Caissier',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des paramètres
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Table des dépenses (VIDE)
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Utilisateur admin par défaut (mot de passe: admin123)
-- Hash bcrypt pour 'admin123' avec salt rounds 10
INSERT INTO users (username, password, role) VALUES ('admin', '$2b$10$rOzJqQZQXQXQXQXQXQXQXu', 'Propriétaire');

-- Paramètres par défaut
INSERT INTO settings (key, value) VALUES ('company_name', 'Mon Entreprise');
INSERT INTO settings (key, value) VALUES ('currency', 'MAD');
INSERT INTO settings (key, value) VALUES ('language', 'fr');
INSERT INTO settings (key, value) VALUES ('theme', 'light');
INSERT INTO settings (key, value) VALUES ('tax_rate', '20');
