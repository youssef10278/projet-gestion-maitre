/**
 * Script de migration pour ajouter le support des retours
 * Ce script ajoute les nouvelles tables et colonnes nécessaires pour le système de retours
 */

const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'database', 'main.db');

if (!fs.existsSync(dbPath)) {
    console.error('❌ Base de données non trouvée:', dbPath);
    process.exit(1);
}

console.log('🔄 Début de la migration de la base de données...');

const db = new Database(dbPath);

try {
    // Vérifier les colonnes existantes dans la table sales
    const columns = db.prepare("PRAGMA table_info(sales)").all();
    const columnNames = columns.map(col => col.name);
    
    console.log('📋 Colonnes actuelles dans la table sales:', columnNames);
    
    // Migration 1: Ajouter ticket_number
    if (!columnNames.includes('ticket_number')) {
        console.log('➕ Ajout de la colonne ticket_number...');
        db.exec('ALTER TABLE sales ADD COLUMN ticket_number TEXT UNIQUE');
        console.log('✅ Colonne ticket_number ajoutée');
    } else {
        console.log('✅ Colonne ticket_number déjà présente');
    }
    
    // Migration 2: Ajouter has_returns
    if (!columnNames.includes('has_returns')) {
        console.log('➕ Ajout de la colonne has_returns...');
        db.exec('ALTER TABLE sales ADD COLUMN has_returns INTEGER NOT NULL DEFAULT 0');
        console.log('✅ Colonne has_returns ajoutée');
    } else {
        console.log('✅ Colonne has_returns déjà présente');
    }
    
    // Migration 3: Ajouter payment_method si elle n'existe pas
    if (!columnNames.includes('payment_method')) {
        console.log('➕ Ajout de la colonne payment_method...');
        db.exec('ALTER TABLE sales ADD COLUMN payment_method TEXT NOT NULL DEFAULT "cash"');
        console.log('✅ Colonne payment_method ajoutée');
    } else {
        console.log('✅ Colonne payment_method déjà présente');
    }
    
    // Migration 4: Créer la table returns
    console.log('➕ Création de la table returns...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS returns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_number TEXT NOT NULL UNIQUE,
            original_sale_id INTEGER NOT NULL,
            client_id INTEGER,
            user_id INTEGER NOT NULL,
            return_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            total_refund_amount REAL NOT NULL,
            refund_cash REAL NOT NULL DEFAULT 0,
            refund_credit REAL NOT NULL DEFAULT 0,
            reason TEXT,
            notes TEXT,
            status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('COMPLETED', 'PENDING_VALIDATION')),
            FOREIGN KEY (original_sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
    console.log('✅ Table returns créée');
    
    // Migration 5: Créer la table return_items
    console.log('➕ Création de la table return_items...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS return_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_id INTEGER NOT NULL,
            original_sale_item_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity_returned INTEGER NOT NULL,
            unit TEXT NOT NULL DEFAULT 'piece',
            unit_price REAL NOT NULL,
            refund_amount REAL NOT NULL,
            condition_status TEXT NOT NULL DEFAULT 'GOOD' CHECK(condition_status IN ('GOOD', 'DEFECTIVE')),
            back_to_stock INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
            FOREIGN KEY (original_sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);
    console.log('✅ Table return_items créée');
    
    // Vérifier que les tables ont été créées
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);
    
    console.log('📋 Tables dans la base de données:', tableNames);
    
    if (tableNames.includes('returns') && tableNames.includes('return_items')) {
        console.log('🎉 Migration terminée avec succès !');
        console.log('✅ Le système de retours est maintenant prêt à être utilisé');
    } else {
        console.log('❌ Erreur: Certaines tables n\'ont pas été créées');
    }
    
} catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
} finally {
    db.close();
}
