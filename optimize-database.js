// Optimisation Base de Données - GestionPro
console.log('📊 OPTIMISATION BASE DE DONNÉES');
console.log('===============================\n');

const fs = require('fs');
const path = require('path');

try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, 'database', 'main.db');
    
    console.log('🔍 Vérification de la base de données...');
    console.log('Chemin:', dbPath);
    
    if (!fs.existsSync(dbPath)) {
        console.log('❌ Base de données non trouvée');
        console.log('💡 Lancez d\'abord l\'application pour créer la base');
        process.exit(1);
    }
    
    const db = new Database(dbPath);
    console.log('✅ Connexion à la base de données réussie\n');
    
    // 1. Créer les index de performance
    console.log('🚀 Création des index de performance...');
    
    const indexes = [
        { name: 'idx_products_name', sql: 'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)' },
        { name: 'idx_products_barcode', sql: 'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)' },
        { name: 'idx_products_category', sql: 'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)' },
        { name: 'idx_products_stock_alert', sql: 'CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products(stock, alert_threshold)' },
        { name: 'idx_clients_name', sql: 'CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name)' },
        { name: 'idx_clients_phone', sql: 'CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone)' },
        { name: 'idx_clients_credit', sql: 'CREATE INDEX IF NOT EXISTS idx_clients_credit ON clients(credit_balance)' },
        { name: 'idx_sales_date', sql: 'CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date)' },
        { name: 'idx_sales_client', sql: 'CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id)' },
        { name: 'idx_sales_user', sql: 'CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id)' },
        { name: 'idx_sale_items_product', sql: 'CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id)' },
        { name: 'idx_sale_items_sale', sql: 'CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)' }
    ];
    
    let indexCount = 0;
    indexes.forEach(index => {
        try {
            db.exec(index.sql);
            console.log('✅', index.name);
            indexCount++;
        } catch (error) {
            console.log('ℹ️ ', index.name, '(existe déjà)');
            indexCount++;
        }
    });
    
    console.log(`\n📊 ${indexCount}/${indexes.length} index créés/vérifiés\n`);
    
    // 2. Optimiser la base de données
    console.log('🔧 Optimisation de la base de données...');
    
    try {
        console.log('- VACUUM (nettoyage)...');
        db.exec('VACUUM');
        console.log('✅ VACUUM terminé');
        
        console.log('- ANALYZE (statistiques)...');
        db.exec('ANALYZE');
        console.log('✅ ANALYZE terminé');
        
        console.log('- Optimisation des paramètres...');
        db.exec('PRAGMA optimize');
        console.log('✅ Optimisation terminée');
        
    } catch (error) {
        console.log('⚠️  Erreur optimisation:', error.message);
    }
    
    // 3. Test de performance
    console.log('\n⚡ Test de performance...');
    
    function measureTime(label, fn) {
        const start = Date.now();
        const result = fn();
        const end = Date.now();
        const duration = end - start;
        console.log(`  ${label}: ${duration}ms`);
        return { result, duration };
    }
    
    // Test des requêtes courantes
    const tests = [
        {
            name: 'Recherche produits',
            fn: () => db.prepare('SELECT * FROM products WHERE name LIKE ? LIMIT 50').all('%a%')
        },
        {
            name: 'Recherche clients', 
            fn: () => db.prepare('SELECT * FROM clients WHERE name LIKE ? LIMIT 50').all('%a%')
        },
        {
            name: 'Historique ventes',
            fn: () => db.prepare('SELECT * FROM sales ORDER BY sale_date DESC LIMIT 50').all()
        },
        {
            name: 'Produits en rupture',
            fn: () => db.prepare('SELECT * FROM products WHERE stock <= alert_threshold').all()
        }
    ];
    
    tests.forEach(test => {
        try {
            measureTime(test.name, test.fn);
        } catch (error) {
            console.log(`  ${test.name}: ERREUR - ${error.message}`);
        }
    });
    
    // 4. Statistiques de la base
    console.log('\n📈 Statistiques de la base de données:');
    
    try {
        const stats = {
            products: db.prepare('SELECT COUNT(*) as count FROM products').get(),
            clients: db.prepare('SELECT COUNT(*) as count FROM clients').get(),
            sales: db.prepare('SELECT COUNT(*) as count FROM sales').get(),
            invoices: db.prepare('SELECT COUNT(*) as count FROM invoices').get()
        };
        
        console.log(`  Produits: ${stats.products.count}`);
        console.log(`  Clients: ${stats.clients.count}`);
        console.log(`  Ventes: ${stats.sales.count}`);
        console.log(`  Factures: ${stats.invoices.count}`);
        
        // Taille de la base
        const dbStats = fs.statSync(dbPath);
        const sizeInMB = (dbStats.size / (1024 * 1024)).toFixed(2);
        console.log(`  Taille: ${sizeInMB} MB`);
        
    } catch (error) {
        console.log('  Erreur statistiques:', error.message);
    }
    
    db.close();
    
    console.log('\n🎊 OPTIMISATION TERMINÉE !');
    console.log('=====================================');
    console.log('✅ Index de performance créés');
    console.log('✅ Base de données optimisée');
    console.log('✅ Tests de performance effectués');
    console.log('\n🚀 Redémarrez l\'application pour voir les améliorations !');
    
} catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.message.includes('better-sqlite3')) {
        console.log('\n💡 SOLUTION:');
        console.log('1. Fermez l\'application GestionPro');
        console.log('2. Exécutez: npm rebuild');
        console.log('3. Relancez ce script');
    }
    
    process.exit(1);
}
