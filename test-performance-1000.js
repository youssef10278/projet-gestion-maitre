// Test de performance avec 1000 produits et 1000 clients
const dbModule = require('./database.js');
const fs = require('fs');
const path = require('path');

console.log('🚀 === TEST DE PERFORMANCE GESTIONPRO ===');
console.log('📊 Test avec 1000 produits et 1000 clients\n');

// Accéder à l'instance de base de données
const db = dbModule.db;

// Fonction pour mesurer le temps d'exécution
function measureTime(label, fn) {
    const start = Date.now();
    const result = fn();
    const end = Date.now();
    const duration = end - start;
    console.log(`⏱️  ${label}: ${duration}ms`);
    return { result, duration };
}

// Fonction pour générer des données de test
function generateTestData() {
    console.log('📝 Génération des données de test...\n');
    
    const categories = ['Alimentaire', 'Boissons', 'Hygiène', 'Électronique', 'Vêtements', 'Maison', 'Sport', 'Beauté'];
    const clientPrefixes = ['Mohamed', 'Ahmed', 'Fatima', 'Aicha', 'Hassan', 'Youssef', 'Khadija', 'Omar'];
    const productPrefixes = ['Produit', 'Article', 'Item', 'Marchandise'];
    
    // Générer 1000 produits
    const products = [];
    for (let i = 1; i <= 1000; i++) {
        products.push({
            barcode: `BAR${String(i).padStart(6, '0')}`,
            name: `${productPrefixes[i % productPrefixes.length]} Test ${i}`,
            purchase_price: Math.round((Math.random() * 50 + 10) * 100) / 100,
            price_retail: Math.round((Math.random() * 100 + 20) * 100) / 100,
            price_wholesale: Math.round((Math.random() * 80 + 15) * 100) / 100,
            price_carton: Math.round((Math.random() * 200 + 50) * 100) / 100,
            stock: Math.floor(Math.random() * 100),
            alert_threshold: Math.floor(Math.random() * 10) + 5,
            pieces_per_carton: Math.floor(Math.random() * 20) + 6,
            category: categories[i % categories.length]
        });
    }
    
    // Générer 1000 clients
    const clients = [];
    for (let i = 1; i <= 1000; i++) {
        clients.push({
            name: `${clientPrefixes[i % clientPrefixes.length]} Client ${i}`,
            phone: `06${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
            address: `Adresse ${i}, Ville Test`,
            credit_balance: Math.round((Math.random() * 1000 - 500) * 100) / 100,
            ice: `ICE${String(i).padStart(6, '0')}`
        });
    }
    
    return { products, clients };
}

// Fonction pour insérer les données en lot
function insertBulkData(products, clients) {
    console.log('💾 Insertion des données en base...\n');
    
    // Préparer les requêtes
    const insertProduct = db.prepare(`
        INSERT INTO products (barcode, name, purchase_price, price_retail, price_wholesale, price_carton, stock, alert_threshold, pieces_per_carton, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertClient = db.prepare(`
        INSERT INTO clients (name, phone, address, credit_balance, ice)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    // Insertion des produits
    const { duration: productsDuration } = measureTime('Insertion 1000 produits', () => {
        const transaction = db.transaction(() => {
            for (const product of products) {
                insertProduct.run(
                    product.barcode, product.name, product.purchase_price,
                    product.price_retail, product.price_wholesale, product.price_carton,
                    product.stock, product.alert_threshold, product.pieces_per_carton, product.category
                );
            }
        });
        transaction();
    });
    
    // Insertion des clients
    const { duration: clientsDuration } = measureTime('Insertion 1000 clients', () => {
        const transaction = db.transaction(() => {
            for (const client of clients) {
                insertClient.run(client.name, client.phone, client.address, client.credit_balance, client.ice);
            }
        });
        transaction();
    });
    
    return { productsDuration, clientsDuration };
}

// Tests de performance des requêtes
function testQueryPerformance() {
    console.log('\n🔍 Tests de performance des requêtes...\n');
    
    const results = {};
    
    // Test 1: Récupération de tous les produits
    results.allProducts = measureTime('Récupération tous les produits', () => {
        return db.prepare('SELECT * FROM products').all();
    });
    
    // Test 2: Récupération de tous les clients
    results.allClients = measureTime('Récupération tous les clients', () => {
        return db.prepare('SELECT * FROM clients').all();
    });
    
    // Test 3: Recherche produit par nom (LIKE)
    results.searchProduct = measureTime('Recherche produit par nom', () => {
        return db.prepare('SELECT * FROM products WHERE name LIKE ?').all('%Test 500%');
    });
    
    // Test 4: Recherche client par nom (LIKE)
    results.searchClient = measureTime('Recherche client par nom', () => {
        return db.prepare('SELECT * FROM clients WHERE name LIKE ?').all('%Client 500%');
    });
    
    // Test 5: Recherche par code-barres (INDEX)
    results.searchBarcode = measureTime('Recherche par code-barres', () => {
        return db.prepare('SELECT * FROM products WHERE barcode = ?').get('BAR000500');
    });
    
    // Test 6: Produits par catégorie
    results.productsByCategory = measureTime('Produits par catégorie', () => {
        return db.prepare('SELECT * FROM products WHERE category = ?').all('Alimentaire');
    });
    
    // Test 7: Clients avec crédit positif
    results.clientsWithCredit = measureTime('Clients avec crédit positif', () => {
        return db.prepare('SELECT * FROM clients WHERE credit_balance > 0').all();
    });
    
    // Test 8: Produits en rupture de stock
    results.lowStockProducts = measureTime('Produits en rupture de stock', () => {
        return db.prepare('SELECT * FROM products WHERE stock <= alert_threshold').all();
    });
    
    return results;
}

// Test de simulation de vente
function testSaleSimulation() {
    console.log('\n🛒 Test de simulation de vente...\n');
    
    // Récupérer quelques produits et clients pour la simulation
    const products = db.prepare('SELECT * FROM products LIMIT 10').all();
    const clients = db.prepare('SELECT * FROM clients LIMIT 5').all();
    const users = db.prepare('SELECT * FROM users LIMIT 1').all();
    
    if (users.length === 0) {
        console.log('⚠️  Aucun utilisateur trouvé, création d\'un utilisateur test...');
        db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('test', 'hash', 'Propriétaire');
        const newUser = db.prepare('SELECT * FROM users WHERE username = ?').get('test');
        users.push(newUser);
    }
    
    const results = measureTime('Simulation de 100 ventes', () => {
        const insertSale = db.prepare(`
            INSERT INTO sales (client_id, user_id, total_amount, amount_paid_cash, amount_paid_credit)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const insertSaleItem = db.prepare(`
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, line_total, purchase_price)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const transaction = db.transaction(() => {
            for (let i = 0; i < 100; i++) {
                const client = clients[i % clients.length];
                const user = users[0];
                const totalAmount = Math.round((Math.random() * 500 + 50) * 100) / 100;
                
                // Insérer la vente
                const saleResult = insertSale.run(client.id, user.id, totalAmount, totalAmount, 0);
                const saleId = saleResult.lastInsertRowid;
                
                // Ajouter 1-5 articles à la vente
                const itemCount = Math.floor(Math.random() * 5) + 1;
                for (let j = 0; j < itemCount; j++) {
                    const product = products[j % products.length];
                    const quantity = Math.floor(Math.random() * 5) + 1;
                    const lineTotal = Math.round(product.price_retail * quantity * 100) / 100;
                    
                    insertSaleItem.run(saleId, product.id, quantity, product.price_retail, lineTotal, product.purchase_price);
                }
            }
        });
        
        transaction();
    });
    
    return results;
}

// Fonction principale de test
async function runPerformanceTest() {
    try {
        // Initialiser la base de données
        console.log('🔧 Initialisation de la base de données...');
        dbModule.initDatabase();
        
        // Vérifier si les données existent déjà
        const existingProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
        const existingClients = db.prepare('SELECT COUNT(*) as count FROM clients').get();
        
        console.log(`📊 Données existantes: ${existingProducts.count} produits, ${existingClients.count} clients\n`);
        
        let shouldInsertData = true;
        
        if (existingProducts.count >= 1000 && existingClients.count >= 1000) {
            console.log('✅ Données de test déjà présentes (1000+ produits et clients)');
            console.log('🔄 Utilisation des données existantes pour les tests\n');
            shouldInsertData = false;
        }
        
        if (shouldInsertData) {
            // Générer et insérer les données de test
            const { products, clients } = generateTestData();
            const { productsDuration, clientsDuration } = insertBulkData(products, clients);
            
            console.log(`✅ Données insérées avec succès !`);
            console.log(`   - Produits: ${productsDuration}ms`);
            console.log(`   - Clients: ${clientsDuration}ms\n`);
        }
        
        // Tests de performance des requêtes
        const queryResults = testQueryPerformance();
        
        // Test de simulation de vente
        const saleResults = testSaleSimulation();
        
        // Résumé des performances
        console.log('\n📈 === RÉSUMÉ DES PERFORMANCES ===\n');
        
        console.log('🔍 Requêtes de lecture:');
        console.log(`   - Tous les produits (1000): ${queryResults.allProducts.duration}ms`);
        console.log(`   - Tous les clients (1000): ${queryResults.allClients.duration}ms`);
        console.log(`   - Recherche produit: ${queryResults.searchProduct.duration}ms`);
        console.log(`   - Recherche client: ${queryResults.searchClient.duration}ms`);
        console.log(`   - Recherche code-barres: ${queryResults.searchBarcode.duration}ms`);
        console.log(`   - Produits par catégorie: ${queryResults.productsByCategory.duration}ms`);
        
        console.log('\n💾 Opérations d\'écriture:');
        console.log(`   - 100 ventes simulées: ${saleResults.duration}ms`);
        
        // Évaluation des performances
        console.log('\n🎯 === ÉVALUATION ===\n');
        
        const maxAcceptableTime = 1000; // 1 seconde
        const issues = [];
        
        if (queryResults.allProducts.duration > maxAcceptableTime) {
            issues.push(`⚠️  Chargement des produits lent: ${queryResults.allProducts.duration}ms`);
        }
        
        if (queryResults.allClients.duration > maxAcceptableTime) {
            issues.push(`⚠️  Chargement des clients lent: ${queryResults.allClients.duration}ms`);
        }
        
        if (saleResults.duration > maxAcceptableTime) {
            issues.push(`⚠️  Traitement des ventes lent: ${saleResults.duration}ms`);
        }
        
        if (issues.length === 0) {
            console.log('✅ EXCELLENT ! Toutes les opérations sont rapides (<1s)');
            console.log('🚀 Votre logiciel peut gérer 1000+ produits et clients sans problème');
        } else {
            console.log('⚠️  Points d\'attention détectés:');
            issues.forEach(issue => console.log(`   ${issue}`));
            console.log('\n💡 Recommandations:');
            console.log('   - Ajoutez des index sur les colonnes fréquemment recherchées');
            console.log('   - Implémentez la pagination pour les grandes listes');
            console.log('   - Utilisez la recherche avec debounce dans l\'interface');
        }
        
        console.log('\n🎊 Test de performance terminé avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors du test de performance:', error);
    }
}

// Lancer le test
runPerformanceTest();
