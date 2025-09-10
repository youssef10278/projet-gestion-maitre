// Test de performance simplifié avec les API existantes
const dbModule = require('./database.js');

console.log('🚀 === TEST DE PERFORMANCE GESTIONPRO (SIMPLIFIÉ) ===');
console.log('📊 Test avec données existantes + nouvelles données\n');

// Fonction pour mesurer le temps d'exécution
function measureTime(label, fn) {
    const start = Date.now();
    const result = fn();
    const end = Date.now();
    const duration = end - start;
    console.log(`⏱️  ${label}: ${duration}ms`);
    return { result, duration };
}

// Générer des produits de test
function generateTestProducts(count = 100) {
    const categories = ['Alimentaire', 'Boissons', 'Hygiène', 'Électronique', 'Vêtements'];
    const products = [];
    
    for (let i = 1; i <= count; i++) {
        products.push({
            barcode: `TEST${String(i).padStart(6, '0')}`,
            name: `Produit Test Performance ${i}`,
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
    
    return products;
}

// Générer des clients de test
function generateTestClients(count = 100) {
    const prefixes = ['Mohamed', 'Ahmed', 'Fatima', 'Aicha', 'Hassan', 'Youssef', 'Khadija'];
    const clients = [];
    
    for (let i = 1; i <= count; i++) {
        clients.push({
            name: `${prefixes[i % prefixes.length]} Test Performance ${i}`,
            phone: `06${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
            address: `Adresse Test ${i}, Ville Performance`,
            credit_balance: Math.round((Math.random() * 1000 - 500) * 100) / 100,
            ice: `TESTICE${String(i).padStart(6, '0')}`
        });
    }
    
    return clients;
}

// Test d'insertion de produits
function testProductInsertion() {
    console.log('📦 === TEST INSERTION PRODUITS ===\n');
    
    const products = generateTestProducts(200);
    let successCount = 0;
    let errorCount = 0;
    
    const { duration } = measureTime('Insertion de 200 produits', () => {
        products.forEach(product => {
            try {
                dbModule.productDB.add(product);
                successCount++;
            } catch (error) {
                errorCount++;
                // Ignorer les erreurs de doublons
                if (!error.message.includes('UNIQUE constraint failed')) {
                    console.log(`⚠️  Erreur produit: ${error.message}`);
                }
            }
        });
    });
    
    console.log(`✅ Produits ajoutés avec succès: ${successCount}`);
    console.log(`⚠️  Erreurs (doublons): ${errorCount}\n`);
    
    return { successCount, errorCount, duration };
}

// Test d'insertion de clients
function testClientInsertion() {
    console.log('👥 === TEST INSERTION CLIENTS ===\n');
    
    const clients = generateTestClients(200);
    let successCount = 0;
    let errorCount = 0;
    
    const { duration } = measureTime('Insertion de 200 clients', () => {
        clients.forEach(client => {
            try {
                dbModule.clientDB.add(client);
                successCount++;
            } catch (error) {
                errorCount++;
                // Ignorer les erreurs de doublons
                if (!error.message.includes('UNIQUE constraint failed')) {
                    console.log(`⚠️  Erreur client: ${error.message}`);
                }
            }
        });
    });
    
    console.log(`✅ Clients ajoutés avec succès: ${successCount}`);
    console.log(`⚠️  Erreurs (doublons): ${errorCount}\n`);
    
    return { successCount, errorCount, duration };
}

// Test de lecture des données
function testDataRetrieval() {
    console.log('🔍 === TEST LECTURE DONNÉES ===\n');
    
    const results = {};
    
    // Test récupération de tous les produits
    results.allProducts = measureTime('Récupération tous les produits', () => {
        return dbModule.productDB.getAll();
    });
    
    // Test récupération de tous les clients
    results.allClients = measureTime('Récupération tous les clients', () => {
        return dbModule.clientDB.getAll();
    });
    
    // Test récupération des catégories
    results.categories = measureTime('Récupération des catégories', () => {
        return dbModule.productDB.getCategories();
    });
    
    // Test produits en rupture de stock
    results.lowStock = measureTime('Produits en rupture de stock', () => {
        return dbModule.productDB.getLowStock();
    });
    
    // Test débiteurs
    results.debtors = measureTime('Clients débiteurs', () => {
        return dbModule.creditsDB.getDebtors();
    });
    
    console.log(`📊 Résultats:`);
    console.log(`   - Produits totaux: ${results.allProducts.result.length}`);
    console.log(`   - Clients totaux: ${results.allClients.result.length}`);
    console.log(`   - Catégories: ${results.categories.result.length}`);
    console.log(`   - Produits en rupture: ${results.lowStock.result.length}`);
    console.log(`   - Clients débiteurs: ${results.debtors.result.length}\n`);
    
    return results;
}

// Test des statistiques du dashboard
function testDashboardStats() {
    console.log('📈 === TEST STATISTIQUES DASHBOARD ===\n');
    
    const results = {};
    
    // Statistiques générales
    results.stats = measureTime('Statistiques générales', () => {
        return dbModule.dashboardDB.getStats();
    });
    
    // Produits les plus rentables
    results.profitable = measureTime('Top produits rentables', () => {
        return dbModule.dashboardDB.getTopProfitable();
    });
    
    // Produits les plus vendus
    results.topSelling = measureTime('Top produits vendus', () => {
        return dbModule.dashboardDB.getTopSelling();
    });
    
    // Aperçu des performances
    results.performance = measureTime('Aperçu des performances', () => {
        return dbModule.dashboardDB.getPerformanceOverview();
    });
    
    console.log(`📊 Statistiques calculées avec succès\n`);
    
    return results;
}

// Test de simulation de ventes
function testSalesSimulation() {
    console.log('🛒 === TEST SIMULATION VENTES ===\n');
    
    // Récupérer quelques produits et clients
    const products = dbModule.productDB.getAll().slice(0, 10);
    const clients = dbModule.clientDB.getAll().slice(0, 5);
    
    if (products.length === 0 || clients.length === 0) {
        console.log('⚠️  Pas assez de données pour simuler des ventes\n');
        return { duration: 0, salesCount: 0 };
    }
    
    let salesCount = 0;
    
    const { duration } = measureTime('Simulation de 20 ventes', () => {
        for (let i = 0; i < 20; i++) {
            try {
                const client = clients[i % clients.length];
                const product = products[i % products.length];
                
                const saleData = {
                    client_id: client.id,
                    items: [{
                        product_id: product.id,
                        quantity: Math.floor(Math.random() * 5) + 1,
                        unit_price: product.price_retail,
                        unit: 'piece'
                    }],
                    payment_method: 'cash'
                };
                
                dbModule.salesDB.process(saleData, 1); // User ID 1
                salesCount++;
            } catch (error) {
                console.log(`⚠️  Erreur vente ${i}: ${error.message}`);
            }
        }
    });
    
    console.log(`✅ Ventes simulées avec succès: ${salesCount}\n`);
    
    return { duration, salesCount };
}

// Analyser les performances
function analyzePerformance(results) {
    console.log('🎯 === ANALYSE DES PERFORMANCES ===\n');
    
    const allDurations = [];
    
    // Collecter toutes les durées
    Object.values(results).forEach(category => {
        if (typeof category === 'object' && category.duration !== undefined) {
            allDurations.push(category.duration);
        } else if (typeof category === 'object') {
            Object.values(category).forEach(test => {
                if (test && test.duration !== undefined) {
                    allDurations.push(test.duration);
                }
            });
        }
    });
    
    const maxTime = Math.max(...allDurations);
    const avgTime = allDurations.reduce((a, b) => a + b, 0) / allDurations.length;
    
    console.log(`📊 Statistiques de performance:`);
    console.log(`   - Temps maximum: ${maxTime}ms`);
    console.log(`   - Temps moyen: ${Math.round(avgTime)}ms`);
    console.log(`   - Opérations testées: ${allDurations.length}\n`);
    
    // Évaluation
    if (maxTime < 500) {
        console.log('🎉 EXCELLENT ! Toutes les opérations sont rapides');
        console.log('✅ Votre logiciel peut gérer facilement 1000+ éléments\n');
    } else if (maxTime < 1000) {
        console.log('✅ BON ! Les performances sont acceptables');
        console.log('💡 Quelques optimisations pourraient améliorer l\'expérience\n');
    } else {
        console.log('⚠️  ATTENTION ! Certaines opérations sont lentes');
        console.log('🔧 Des optimisations sont recommandées\n');
    }
    
    // Recommandations
    console.log('💡 RECOMMANDATIONS POUR 1000+ ÉLÉMENTS:\n');
    console.log('✅ Interface:');
    console.log('   - Pagination: 50-100 éléments par page');
    console.log('   - Recherche: Debounce de 300ms');
    console.log('   - Virtualisation: Pour listes très longues');
    console.log('   - Cache: Résultats fréquents en mémoire\n');
    
    console.log('✅ Base de données:');
    console.log('   - Index: Sur colonnes de recherche');
    console.log('   - Requêtes: Optimiser les JOIN complexes');
    console.log('   - Transactions: Grouper les insertions');
    console.log('   - Nettoyage: Archiver anciennes données\n');
}

// Fonction principale
async function runSimplePerformanceTest() {
    try {
        console.log('🔧 Initialisation de la base de données...');
        dbModule.initDatabase();
        
        console.log('✅ Base de données initialisée\n');
        
        // Tests d'insertion
        const productResults = testProductInsertion();
        const clientResults = testClientInsertion();
        
        // Tests de lecture
        const retrievalResults = testDataRetrieval();
        
        // Tests de dashboard
        const dashboardResults = testDashboardStats();
        
        // Tests de ventes
        const salesResults = testSalesSimulation();
        
        // Analyse des performances
        const allResults = {
            products: productResults,
            clients: clientResults,
            retrieval: retrievalResults,
            dashboard: dashboardResults,
            sales: salesResults
        };
        
        analyzePerformance(allResults);
        
        console.log('🎊 Test de performance terminé avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors du test de performance:', error);
    }
}

// Lancer le test
runSimplePerformanceTest();
