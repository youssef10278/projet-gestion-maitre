// Script pour créer une base de données vierge avec Electron
const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const fs = require('fs');

console.log('🧹 Création d\'une base de données VIERGE avec Electron...');

// Attendre que l'app soit prête
app.whenReady().then(() => {
    try {
        const cleanDbPath = path.join(__dirname, 'database', 'main-clean.db');
        const cleanDbDir = path.dirname(cleanDbPath);
        
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(cleanDbDir)) {
            fs.mkdirSync(cleanDbDir, { recursive: true });
        }
        
        // Supprimer l'ancienne DB vierge si elle existe
        if (fs.existsSync(cleanDbPath)) {
            fs.unlinkSync(cleanDbPath);
            console.log('🗑️ Ancienne DB vierge supprimée');
        }
        
        console.log('🔧 Création de la nouvelle base vierge...');
        const db = new Database(cleanDbPath);
        
        // Copier exactement la même structure que database.js
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
                password_hash TEXT NOT NULL,
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
        
        // Créer SEULEMENT l'utilisateur admin
        console.log('👤 Création de l\'utilisateur admin...');
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'Propriétaire');
        
        // Paramètres par défaut minimaux
        console.log('⚙️ Ajout des paramètres par défaut...');
        const settingsStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        settingsStmt.run('company_name', 'Mon Entreprise');
        settingsStmt.run('currency', 'MAD');
        settingsStmt.run('language', 'fr');
        settingsStmt.run('theme', 'light');
        settingsStmt.run('tax_rate', '20');
        
        db.close();
        
        console.log('✅ Base de données VIERGE créée avec succès !');
        console.log(`📍 Emplacement: ${cleanDbPath}`);
        console.log('👤 SEUL utilisateur: admin / admin123');
        console.log('📊 Toutes les tables sont VIDES (produits, clients, ventes, etc.)');
        
        app.quit();
        
    } catch (error) {
        console.error('❌ Erreur lors de la création:', error.message);
        app.quit();
    }
});

// Éviter que l'app reste ouverte
app.on('window-all-closed', () => {
    app.quit();
});
