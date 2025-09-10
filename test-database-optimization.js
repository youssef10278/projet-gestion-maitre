// Test d'optimisation de la base de données pour 1000+ éléments
const db = require('./database.js');

console.log('🔧 === TEST OPTIMISATION BASE DE DONNÉES ===\n');

// Fonction pour mesurer le temps d'exécution
function measureTime(label, fn) {
    const start = Date.now();
    const result = fn();
    const end = Date.now();
    const duration = end - start;
    console.log(`⏱️  ${label}: ${duration}ms`);
    return { result, duration };
}

// Créer des index pour optimiser les performances
function createOptimizationIndexes() {
    console.log('📊 Création des index d\'optimisation...\n');
    
    try {
        // Index pour les recherches fréquentes
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
            'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
            'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
            'CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products(stock, alert_threshold)',
            'CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name)',
            'CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone)',
            'CREATE INDEX IF NOT EXISTS idx_clients_credit ON clients(credit_balance)',
            'CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date)',
            'CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id)',
            'CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id)'
        ];
        
        indexes.forEach(indexSQL => {
            db.exec(indexSQL);
        });
        
        console.log('✅ Index créés avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création des index:', error.message);
    }
}

// Test des requêtes optimisées vs non-optimisées
function testQueryOptimization() {
    console.log('\n🔍 Test des requêtes optimisées...\n');
    
    // Vérifier qu'on a des données
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
    
    console.log(`📊 Données disponibles: ${productCount} produits, ${clientCount} clients\n`);
    
    if (productCount < 100 || clientCount < 100) {
        console.log('⚠️  Pas assez de données pour les tests. Génération de données...\n');
        generateTestData();
    }
    
    const tests = [];
    
    // Test 1: Recherche par nom (avec LIKE)
    tests.push(measureTime('Recherche produit par nom (LIKE)', () => {
        return db.prepare('SELECT * FROM products WHERE name LIKE ? LIMIT 50').all('%Test%');
    }));
    
    // Test 2: Recherche exacte par code-barres (avec INDEX)
    tests.push(measureTime('Recherche par code-barres (INDEX)', () => {
        return db.prepare('SELECT * FROM products WHERE barcode = ?').get('BAR000001');
    }));
    
    // Test 3: Filtrage par catégorie (avec INDEX)
    tests.push(measureTime('Filtrage par catégorie (INDEX)', () => {
        return db.prepare('SELECT * FROM products WHERE category = ?').all('Alimentaire');
    }));
    
    // Test 4: Produits en rupture de stock (INDEX composé)
    tests.push(measureTime('Produits en rupture (INDEX composé)', () => {
        return db.prepare('SELECT * FROM products WHERE stock <= alert_threshold').all();
    }));
    
    // Test 5: Recherche client par nom
    tests.push(measureTime('Recherche client par nom', () => {
        return db.prepare('SELECT * FROM clients WHERE name LIKE ? LIMIT 50').all('%Client%');
    }));
    
    // Test 6: Clients avec crédit positif
    tests.push(measureTime('Clients avec crédit positif', () => {
        return db.prepare('SELECT * FROM clients WHERE credit_balance > 0').all();
    }));
    
    // Test 7: Jointure ventes avec clients
    tests.push(measureTime('Jointure ventes-clients', () => {
        return db.prepare(`
            SELECT s.*, c.name as client_name 
            FROM sales s 
            LEFT JOIN clients c ON s.client_id = c.id 
            ORDER BY s.sale_date DESC 
            LIMIT 100
        `).all();
    }));
    
    // Test 8: Statistiques par catégorie
    tests.push(measureTime('Statistiques par catégorie', () => {
        return db.prepare(`
            SELECT category, COUNT(*) as count, AVG(price_retail) as avg_price 
            FROM products 
            GROUP BY category
        `).all();
    }));
    
    return tests;
}

// Générer des données de test si nécessaire
function generateTestData() {
    console.log('📝 Génération de données de test...\n');
    
    const categories = ['Alimentaire', 'Boissons', 'Hygiène', 'Électronique', 'Vêtements'];
    const clientPrefixes = ['Mohamed', 'Ahmed', 'Fatima', 'Aicha', 'Hassan'];
    
    // Préparer les requêtes
    const insertProduct = db.prepare(`
        INSERT OR IGNORE INTO products (barcode, name, purchase_price, price_retail, price_wholesale, price_carton, stock, alert_threshold, pieces_per_carton, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertClient = db.prepare(`
        INSERT OR IGNORE INTO clients (name, phone, address, credit_balance, ice)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    // Insertion en transaction pour optimiser
    const insertProducts = db.transaction(() => {
        for (let i = 1; i <= 500; i++) {
            insertProduct.run(
                `BAR${String(i).padStart(6, '0')}`,
                `Produit Test ${i}`,
                Math.round((Math.random() * 50 + 10) * 100) / 100,
                Math.round((Math.random() * 100 + 20) * 100) / 100,
                Math.round((Math.random() * 80 + 15) * 100) / 100,
                Math.round((Math.random() * 200 + 50) * 100) / 100,
                Math.floor(Math.random() * 100),
                Math.floor(Math.random() * 10) + 5,
                Math.floor(Math.random() * 20) + 6,
                categories[i % categories.length]
            );
        }
    });
    
    const insertClients = db.transaction(() => {
        for (let i = 1; i <= 500; i++) {
            insertClient.run(
                `${clientPrefixes[i % clientPrefixes.length]} Client ${i}`,
                `06${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
                `Adresse ${i}, Ville Test`,
                Math.round((Math.random() * 1000 - 500) * 100) / 100,
                `ICE${String(i).padStart(6, '0')}`
            );
        }
    });
    
    measureTime('Insertion 500 produits', insertProducts);
    measureTime('Insertion 500 clients', insertClients);
}

// Analyser les performances et donner des recommandations
function analyzePerformance(testResults) {
    console.log('\n📈 === ANALYSE DES PERFORMANCES ===\n');
    
    const slowQueries = testResults.filter(test => test.duration > 100);
    const fastQueries = testResults.filter(test => test.duration <= 50);
    
    console.log(`✅ Requêtes rapides (≤50ms): ${fastQueries.length}`);
    console.log(`⚠️  Requêtes moyennes (51-100ms): ${testResults.length - slowQueries.length - fastQueries.length}`);
    console.log(`❌ Requêtes lentes (>100ms): ${slowQueries.length}\n`);
    
    if (slowQueries.length === 0) {
        console.log('🎉 EXCELLENT ! Toutes les requêtes sont optimisées');
        console.log('✅ Votre base de données peut gérer 1000+ éléments sans problème\n');
    } else {
        console.log('💡 RECOMMANDATIONS D\'OPTIMISATION:\n');
        
        slowQueries.forEach((test, index) => {
            console.log(`${index + 1}. Optimiser la requête qui prend ${test.duration}ms`);
        });
        
        console.log('\n🔧 SOLUTIONS POSSIBLES:');
        console.log('   - Ajouter des index sur les colonnes fréquemment recherchées');
        console.log('   - Utiliser la pagination (LIMIT/OFFSET)');
        console.log('   - Optimiser les requêtes avec JOIN');
        console.log('   - Implémenter la recherche avec debounce côté interface');
    }
    
    // Recommandations spécifiques
    console.log('\n🎯 RECOMMANDATIONS POUR L\'INTERFACE:\n');
    console.log('✅ Pagination: Afficher 50-100 éléments par page');
    console.log('✅ Recherche: Debounce de 300ms minimum');
    console.log('✅ Virtualisation: Pour les listes de 500+ éléments');
    console.log('✅ Cache: Mettre en cache les résultats fréquents');
}

// Test de stress avec beaucoup d'opérations
function stressTest() {
    console.log('\n💪 === TEST DE STRESS ===\n');
    
    // Test d'insertion massive
    measureTime('100 insertions simultanées', () => {
        const insertProduct = db.prepare(`
            INSERT INTO products (barcode, name, purchase_price, price_retail, price_wholesale, price_carton, stock, alert_threshold, pieces_per_carton, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const transaction = db.transaction(() => {
            for (let i = 0; i < 100; i++) {
                insertProduct.run(
                    `STRESS${Date.now()}${i}`,
                    `Produit Stress ${i}`,
                    10, 20, 15, 50, 100, 5, 6, 'Test'
                );
            }
        });
        
        transaction();
    });
    
    // Test de lecture massive
    measureTime('100 requêtes de lecture', () => {
        const selectProduct = db.prepare('SELECT * FROM products WHERE id = ?');
        
        for (let i = 1; i <= 100; i++) {
            selectProduct.get(i);
        }
    });
    
    // Nettoyer les données de stress
    db.prepare('DELETE FROM products WHERE barcode LIKE ?').run('STRESS%');
}

// Fonction principale
function runDatabaseOptimizationTest() {
    try {
        // Initialiser la base de données
        db.initDatabase();
        
        // Créer les index d'optimisation
        createOptimizationIndexes();
        
        // Tester les requêtes
        const testResults = testQueryOptimization();
        
        // Test de stress
        stressTest();
        
        // Analyser les performances
        analyzePerformance(testResults);
        
        console.log('\n🎊 Test d\'optimisation terminé avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors du test d\'optimisation:', error);
    }
}

// Lancer le test
runDatabaseOptimizationTest();
