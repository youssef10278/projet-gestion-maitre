// Test de performance final - Version corrigée
const dbModule = require('./database.js');

console.log('🚀 === TEST DE PERFORMANCE GESTIONPRO (FINAL) ===');
console.log('📊 Test de performance avec données réelles\n');

// Fonction pour mesurer le temps d'exécution
function measureTime(label, fn) {
    const start = Date.now();
    try {
        const result = fn();
        const end = Date.now();
        const duration = end - start;
        console.log(`⏱️  ${label}: ${duration}ms`);
        return { result, duration, success: true };
    } catch (error) {
        const end = Date.now();
        const duration = end - start;
        console.log(`❌ ${label}: ERREUR (${duration}ms) - ${error.message}`);
        return { result: null, duration, success: false, error: error.message };
    }
}

// Test de lecture des données existantes
function testDataRetrieval() {
    console.log('🔍 === TEST LECTURE DONNÉES EXISTANTES ===\n');
    
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
    
    // Test historique des ventes
    results.salesHistory = measureTime('Historique des ventes', () => {
        return dbModule.salesDB.getHistory();
    });
    
    if (results.allProducts.success && results.allClients.success) {
        console.log(`📊 Données actuelles:`);
        console.log(`   - Produits: ${results.allProducts.result.length}`);
        console.log(`   - Clients: ${results.allClients.result.length}`);
        console.log(`   - Catégories: ${results.categories.success ? results.categories.result.length : 'Erreur'}`);
        console.log(`   - Produits en rupture: ${results.lowStock.success ? results.lowStock.result.length : 'Erreur'}`);
        console.log(`   - Clients débiteurs: ${results.debtors.success ? results.debtors.result.length : 'Erreur'}`);
        console.log(`   - Ventes historiques: ${results.salesHistory.success ? results.salesHistory.result.length : 'Erreur'}\n`);
    }
    
    return results;
}

// Générer et insérer des données de test
function generateAndInsertTestData() {
    console.log('📝 === GÉNÉRATION DONNÉES DE TEST ===\n');
    
    const results = {};
    
    // Générer 100 produits de test
    const products = [];
    for (let i = 1; i <= 100; i++) {
        products.push({
            barcode: `PERF${String(i).padStart(6, '0')}`,
            name: `Produit Performance ${i}`,
            purchase_price: Math.round((Math.random() * 50 + 10) * 100) / 100,
            price_retail: Math.round((Math.random() * 100 + 20) * 100) / 100,
            price_wholesale: Math.round((Math.random() * 80 + 15) * 100) / 100,
            price_carton: Math.round((Math.random() * 200 + 50) * 100) / 100,
            stock: Math.floor(Math.random() * 100),
            alert_threshold: Math.floor(Math.random() * 10) + 5,
            pieces_per_carton: Math.floor(Math.random() * 20) + 6,
            category: ['Alimentaire', 'Boissons', 'Hygiène', 'Électronique'][i % 4]
        });
    }
    
    // Insérer les produits
    let productSuccessCount = 0;
    results.productInsertion = measureTime('Insertion 100 produits', () => {
        products.forEach(product => {
            try {
                dbModule.productDB.add(product);
                productSuccessCount++;
            } catch (error) {
                // Ignorer les doublons
                if (!error.message.includes('UNIQUE constraint failed')) {
                    throw error;
                }
            }
        });
        return productSuccessCount;
    });
    
    // Générer 100 clients de test
    const clients = [];
    for (let i = 1; i <= 100; i++) {
        clients.push({
            name: `Client Performance ${i}`,
            phone: `06${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
            address: `Adresse Performance ${i}`,
            credit_balance: Math.round((Math.random() * 1000 - 500) * 100) / 100,
            ice: `PERFICE${String(i).padStart(6, '0')}`
        });
    }
    
    // Insérer les clients
    let clientSuccessCount = 0;
    results.clientInsertion = measureTime('Insertion 100 clients', () => {
        clients.forEach(client => {
            try {
                dbModule.clientDB.add(client);
                clientSuccessCount++;
            } catch (error) {
                // Ignorer les doublons
                if (!error.message.includes('UNIQUE constraint failed')) {
                    throw error;
                }
            }
        });
        return clientSuccessCount;
    });
    
    console.log(`✅ Données générées:`);
    console.log(`   - Produits ajoutés: ${productSuccessCount}/100`);
    console.log(`   - Clients ajoutés: ${clientSuccessCount}/100\n`);
    
    return results;
}

// Test de recherche et filtrage
function testSearchAndFiltering() {
    console.log('🔍 === TEST RECHERCHE ET FILTRAGE ===\n');
    
    const results = {};
    
    // Récupérer tous les produits pour les tests de filtrage
    const allProducts = dbModule.productDB.getAll();
    const allClients = dbModule.clientDB.getAll();
    
    if (allProducts.length === 0 || allClients.length === 0) {
        console.log('⚠️  Pas assez de données pour les tests de recherche\n');
        return results;
    }
    
    // Test de filtrage par catégorie (simulation côté client)
    results.categoryFilter = measureTime('Filtrage par catégorie (côté client)', () => {
        return allProducts.filter(p => p.category === 'Alimentaire');
    });
    
    // Test de recherche par nom (simulation côté client)
    results.nameSearch = measureTime('Recherche par nom (côté client)', () => {
        return allProducts.filter(p => p.name.toLowerCase().includes('performance'));
    });
    
    // Test de filtrage des clients avec crédit
    results.creditFilter = measureTime('Filtrage clients avec crédit', () => {
        return allClients.filter(c => c.credit_balance > 0);
    });
    
    // Test de tri par prix
    results.priceSort = measureTime('Tri par prix (côté client)', () => {
        return [...allProducts].sort((a, b) => b.price_retail - a.price_retail);
    });
    
    console.log(`📊 Résultats de recherche:`);
    console.log(`   - Produits alimentaires: ${results.categoryFilter.success ? results.categoryFilter.result.length : 'Erreur'}`);
    console.log(`   - Recherche "performance": ${results.nameSearch.success ? results.nameSearch.result.length : 'Erreur'}`);
    console.log(`   - Clients avec crédit: ${results.creditFilter.success ? results.creditFilter.result.length : 'Erreur'}\n`);
    
    return results;
}

// Test de simulation d'utilisation réelle
function testRealUsageSimulation() {
    console.log('🎮 === SIMULATION UTILISATION RÉELLE ===\n');
    
    const results = {};
    
    // Simulation: Chargement de la page produits
    results.loadProductsPage = measureTime('Chargement page produits', () => {
        const products = dbModule.productDB.getAll();
        const categories = dbModule.productDB.getCategories();
        const lowStock = dbModule.productDB.getLowStock();
        return { products, categories, lowStock };
    });
    
    // Simulation: Chargement de la page clients
    results.loadClientsPage = measureTime('Chargement page clients', () => {
        const clients = dbModule.clientDB.getAll();
        const debtors = dbModule.creditsDB.getDebtors();
        return { clients, debtors };
    });
    
    // Simulation: Chargement de la page historique
    results.loadHistoryPage = measureTime('Chargement page historique', () => {
        const history = dbModule.salesDB.getHistory();
        return { history };
    });
    
    console.log(`📊 Simulation d'utilisation terminée\n`);
    
    return results;
}

// Analyser les performances globales
function analyzeGlobalPerformance(allResults) {
    console.log('🎯 === ANALYSE GLOBALE DES PERFORMANCES ===\n');
    
    const allDurations = [];
    const slowOperations = [];
    const fastOperations = [];
    
    // Collecter toutes les durées
    Object.values(allResults).forEach(category => {
        if (typeof category === 'object') {
            Object.entries(category).forEach(([key, test]) => {
                if (test && typeof test.duration === 'number') {
                    allDurations.push(test.duration);
                    
                    if (test.duration > 500) {
                        slowOperations.push({ name: key, duration: test.duration });
                    } else if (test.duration <= 100) {
                        fastOperations.push({ name: key, duration: test.duration });
                    }
                }
            });
        }
    });
    
    if (allDurations.length === 0) {
        console.log('❌ Aucune donnée de performance à analyser\n');
        return;
    }
    
    const maxTime = Math.max(...allDurations);
    const minTime = Math.min(...allDurations);
    const avgTime = allDurations.reduce((a, b) => a + b, 0) / allDurations.length;
    
    console.log(`📊 Statistiques globales:`);
    console.log(`   - Opérations testées: ${allDurations.length}`);
    console.log(`   - Temps minimum: ${minTime}ms`);
    console.log(`   - Temps maximum: ${maxTime}ms`);
    console.log(`   - Temps moyen: ${Math.round(avgTime)}ms\n`);
    
    console.log(`⚡ Opérations rapides (≤100ms): ${fastOperations.length}`);
    console.log(`⚠️  Opérations lentes (>500ms): ${slowOperations.length}\n`);
    
    // Évaluation finale
    if (maxTime <= 200) {
        console.log('🎉 EXCELLENT ! Performances optimales');
        console.log('✅ Votre logiciel peut facilement gérer 1000+ éléments');
        console.log('🚀 Aucune optimisation nécessaire\n');
    } else if (maxTime <= 500) {
        console.log('✅ TRÈS BON ! Performances acceptables');
        console.log('💡 Votre logiciel peut gérer 1000+ éléments');
        console.log('🔧 Quelques optimisations mineures recommandées\n');
    } else if (maxTime <= 1000) {
        console.log('⚠️  BON ! Performances correctes');
        console.log('🔧 Optimisations recommandées pour 1000+ éléments');
        console.log('💡 Implémentez la pagination et la recherche optimisée\n');
    } else {
        console.log('❌ ATTENTION ! Performances à améliorer');
        console.log('🚨 Optimisations nécessaires avant 1000+ éléments');
        console.log('🔧 Implémentez pagination, index et cache\n');
    }
    
    // Recommandations spécifiques
    console.log('💡 RECOMMANDATIONS POUR 1000+ ÉLÉMENTS:\n');
    
    console.log('🎨 Interface utilisateur:');
    console.log('   ✅ Pagination: 50-100 éléments par page');
    console.log('   ✅ Recherche: Debounce 300ms + minimum 2 caractères');
    console.log('   ✅ Virtualisation: Pour listes très longues');
    console.log('   ✅ Loading states: Indicateurs de chargement\n');
    
    console.log('🗄️  Base de données:');
    console.log('   ✅ Index: Sur colonnes name, barcode, category');
    console.log('   ✅ Requêtes: LIMIT pour grandes listes');
    console.log('   ✅ Cache: Résultats fréquents en mémoire');
    console.log('   ✅ Nettoyage: Archiver anciennes données\n');
    
    if (slowOperations.length > 0) {
        console.log('🔧 Opérations à optimiser en priorité:');
        slowOperations.forEach(op => {
            console.log(`   - ${op.name}: ${op.duration}ms`);
        });
        console.log();
    }
}

// Fonction principale
async function runFinalPerformanceTest() {
    try {
        console.log('🔧 Initialisation de la base de données...');
        dbModule.initDatabase();
        console.log('✅ Base de données initialisée\n');
        
        // Tests de lecture des données existantes
        const retrievalResults = testDataRetrieval();
        
        // Génération et insertion de données de test
        const insertionResults = generateAndInsertTestData();
        
        // Tests de recherche et filtrage
        const searchResults = testSearchAndFiltering();
        
        // Simulation d'utilisation réelle
        const usageResults = testRealUsageSimulation();
        
        // Analyse globale
        const allResults = {
            retrieval: retrievalResults,
            insertion: insertionResults,
            search: searchResults,
            usage: usageResults
        };
        
        analyzeGlobalPerformance(allResults);
        
        console.log('🎊 Test de performance terminé avec succès !');
        console.log('📋 Consultez les recommandations ci-dessus pour optimiser votre logiciel');
        
    } catch (error) {
        console.error('❌ Erreur lors du test de performance:', error);
    }
}

// Lancer le test
runFinalPerformanceTest();
