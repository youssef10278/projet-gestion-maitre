/**
 * Script de migration pour ajouter les tables des devis (quotes)
 */

const Database = require('better-sqlite3');
const path = require('path');

// Chemin vers la base de données
const dbPath = path.join(__dirname, 'database', 'main.db');

console.log('🚀 Démarrage de la migration pour les devis...');
console.log('📁 Chemin de la base de données:', dbPath);

try {
    // Ouvrir la base de données
    const db = new Database(dbPath);
    
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérifier si les tables existent déjà
    const tablesExist = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('quotes', 'quote_items')
    `).all();
    
    if (tablesExist.length > 0) {
        console.log('⚠️ Tables des devis déjà présentes:', tablesExist.map(t => t.name));
        console.log('🔄 Suppression des tables existantes pour recréation...');
        
        db.exec('DROP TABLE IF EXISTS quote_items');
        db.exec('DROP TABLE IF EXISTS quotes');
        console.log('✅ Tables supprimées');
    }
    
    // Migration 1: Créer la table quotes (devis)
    console.log('➕ Création de la table quotes...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS quotes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT NOT NULL UNIQUE,
            client_id INTEGER,
            client_name TEXT NOT NULL,
            client_phone TEXT,
            client_address TEXT,
            date_created TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            date_validity TEXT NOT NULL,
            validity_days INTEGER NOT NULL DEFAULT 30,
            status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
            subtotal REAL NOT NULL DEFAULT 0,
            discount_type TEXT CHECK(discount_type IN ('percentage', 'amount')),
            discount_value REAL DEFAULT 0,
            discount_amount REAL DEFAULT 0,
            total_amount REAL NOT NULL,
            notes TEXT,
            conditions TEXT,
            created_by TEXT NOT NULL DEFAULT 'system',
            converted_sale_id INTEGER,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
        )
    `);
    console.log('✅ Table quotes créée');
    
    // Migration 2: Créer la table quote_items (articles des devis)
    console.log('➕ Création de la table quote_items...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS quote_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quote_id INTEGER NOT NULL,
            product_id INTEGER,
            product_name TEXT NOT NULL,
            product_reference TEXT,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            line_total REAL NOT NULL,
            discount_type TEXT CHECK(discount_type IN ('percentage', 'amount')),
            discount_value REAL DEFAULT 0,
            discount_amount REAL DEFAULT 0,
            final_price REAL NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
        )
    `);
    console.log('✅ Table quote_items créée');
    
    // Migration 3: Créer des index pour optimiser les performances
    console.log('➕ Création des index...');
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(number);
        CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
        CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
        CREATE INDEX IF NOT EXISTS idx_quotes_date_created ON quotes(date_created);
        CREATE INDEX IF NOT EXISTS idx_quotes_date_validity ON quotes(date_validity);
        CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
        CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items(product_id);
    `);
    console.log('✅ Index créés');
    
    // Migration 4: Insérer un devis de test
    console.log('➕ Insertion de données de test...');
    
    // Créer un devis de test
    const testQuoteNumber = 'DEV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-0001';
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + 30);
    
    const quoteResult = db.prepare(`
        INSERT INTO quotes (
            number, client_name, client_phone, 
            date_validity, validity_days, status, subtotal, 
            total_amount, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        testQuoteNumber,
        'Client Test Devis',
        '0123456789',
        validityDate.toISOString(),
        30,
        'draft',
        100.00,
        100.00,
        'Devis de test créé lors de la migration',
        'system'
    );
    
    // Ajouter un article de test
    db.prepare(`
        INSERT INTO quote_items (
            quote_id, product_name, quantity, unit_price, line_total, final_price
        ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        quoteResult.lastInsertRowid,
        'Produit Test',
        2,
        50.00,
        100.00,
        100.00
    );
    
    console.log('✅ Devis de test créé:', testQuoteNumber);
    
    // Vérification finale
    const quotesCount = db.prepare('SELECT COUNT(*) as count FROM quotes').get().count;
    const quoteItemsCount = db.prepare('SELECT COUNT(*) as count FROM quote_items').get().count;
    
    console.log('📊 Vérification finale:');
    console.log(`  - Devis créés: ${quotesCount}`);
    console.log(`  - Articles de devis: ${quoteItemsCount}`);
    
    // Fermer la base de données
    db.close();
    
    console.log('🎉 Migration des devis terminée avec succès !');
    console.log('');
    console.log('📋 Tables créées:');
    console.log('  ✅ quotes (devis principaux)');
    console.log('  ✅ quote_items (articles des devis)');
    console.log('  ✅ Index d\'optimisation');
    console.log('  ✅ Données de test');
    console.log('');
    console.log('🚀 Vous pouvez maintenant développer l\'interface des devis !');
    
} catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
}
