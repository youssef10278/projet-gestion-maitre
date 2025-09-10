// Test de debug pour le scanner de code-barres
const dbModule = require('./database.js');
const fs = require('fs');
const path = require('path');

console.log('🔍 === TEST DEBUG SCANNER CODE-BARRES ===\n');

// Nettoyer la base de données de test
function cleanTestDatabase() {
    console.log('🧹 Nettoyage de la base de données de test...');
    
    try {
        const dbPath = path.join(__dirname, 'gestion.db');
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('   ✅ Ancienne base supprimée');
        }
        
        dbModule.initDatabase();
        console.log('   ✅ Nouvelle base initialisée\n');
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
        throw error;
    }
}

// Ajouter des produits de test avec codes-barres
function addTestProducts() {
    console.log('📦 Ajout de produits de test avec codes-barres...\n');
    
    const testProducts = [
        {
            name: 'Produit Test 1',
            barcode: '1234567890123',
            price_retail: 10.50,
            price_wholesale: 8.00,
            price_carton: 95.00,
            pieces_per_carton: 12,
            stock: 50,
            category: 'Test'
        },
        {
            name: 'Produit Test 2',
            barcode: '9876543210987',
            price_retail: 25.00,
            price_wholesale: 20.00,
            price_carton: 240.00,
            pieces_per_carton: 12,
            stock: 30,
            category: 'Test'
        },
        {
            name: 'Produit Test 3',
            barcode: 'ABC123DEF456',
            price_retail: 5.75,
            price_wholesale: 4.50,
            price_carton: 54.00,
            pieces_per_carton: 12,
            stock: 100,
            category: 'Test'
        },
        {
            name: 'Produit Sans Stock',
            barcode: '0000000000000',
            price_retail: 15.00,
            price_wholesale: 12.00,
            price_carton: 144.00,
            pieces_per_carton: 12,
            stock: 0, // Rupture de stock
            category: 'Test'
        }
    ];
    
    testProducts.forEach((product, index) => {
        try {
            const addedProduct = dbModule.productDB.add(product);
            console.log(`✅ Produit ${index + 1} ajouté:`, {
                id: addedProduct.id,
                name: addedProduct.name,
                barcode: addedProduct.barcode,
                stock: addedProduct.stock
            });
        } catch (error) {
            console.log(`❌ Erreur produit ${index + 1}:`, error.message);
        }
    });
    
    console.log('\n📊 Produits de test ajoutés avec succès !\n');
}

// Simuler les fonctions de nettoyage et validation de code-barres
function cleanAndValidateBarcode(barcode) {
    if (!barcode) return '';

    let cleaned = String(barcode)
        .trim()
        .replace(/[\r\n\t]/g, '')
        .toUpperCase();

    const prefixesToRemove = [
        'CODE:', 'BARCODE:', 'BC:', 'ID:', 'PROD:', 'ITEM:', 'SKU:', 'REF:'
    ];

    prefixesToRemove.forEach(prefix => {
        if (cleaned.startsWith(prefix)) {
            cleaned = cleaned.substring(prefix.length);
        }
    });

    const suffixesToRemove = ['END', 'STOP', 'FIN'];
    suffixesToRemove.forEach(suffix => {
        if (cleaned.endsWith(suffix)) {
            cleaned = cleaned.substring(0, cleaned.length - suffix.length);
        }
    });

    cleaned = cleaned.replace(/[^a-zA-Z0-9\-_]/g, '');

    if (cleaned.length < 4 || cleaned.length > 20) {
        console.warn('⚠️ Code-barres longueur invalide:', cleaned.length, 'Code:', cleaned);
        return '';
    }

    return cleaned;
}

// Simuler la recherche de produit par code-barres
function findProductByBarcode(barcode, allProducts) {
    if (!barcode || barcode.trim() === '') return null;

    const cleanBarcode = cleanAndValidateBarcode(barcode);
    if (!cleanBarcode) return null;

    return allProducts.find(product => {
        if (!product.barcode) return false;
        const productBarcode = cleanAndValidateBarcode(product.barcode);
        return productBarcode === cleanBarcode;
    });
}

// Test des scénarios de scan
function testScanScenarios() {
    console.log('🔍 === TESTS SCÉNARIOS DE SCAN ===\n');
    
    // Récupérer tous les produits
    const allProducts = dbModule.productDB.getAll();
    console.log(`📦 ${allProducts.length} produits chargés pour les tests\n`);
    
    const testCodes = [
        '1234567890123',     // Produit existant avec stock
        '9876543210987',     // Produit existant avec stock
        'ABC123DEF456',      // Produit existant avec stock
        '0000000000000',     // Produit existant sans stock
        '9999999999999',     // Produit inexistant
        'CODE:1234567890123', // Avec préfixe
        '1234567890123END',   // Avec suffixe
        '123',               // Trop court
        '12345678901234567890123', // Trop long
        '',                  // Vide
        '   1234567890123   ', // Avec espaces
        'abc123def456',      // Casse différente
    ];
    
    testCodes.forEach((code, index) => {
        console.log(`📱 Test ${index + 1}: "${code}"`);
        
        // Étape 1: Nettoyage
        const cleaned = cleanAndValidateBarcode(code);
        console.log(`   🧹 Nettoyé: "${cleaned}"`);
        
        if (!cleaned) {
            console.log('   ❌ Code-barres invalide\n');
            return;
        }
        
        // Étape 2: Recherche
        const product = findProductByBarcode(code, allProducts);
        
        if (product) {
            if (product.stock > 0) {
                console.log(`   ✅ Produit trouvé: ${product.name} (Stock: ${product.stock})`);
                console.log(`   🛒 → Peut être ajouté au panier`);
            } else {
                console.log(`   ⚠️ Produit trouvé: ${product.name} (Rupture de stock)`);
                console.log(`   🚫 → Ne peut pas être ajouté au panier`);
            }
        } else {
            console.log(`   ❌ Produit non trouvé`);
            console.log(`   💬 → Message: "Aucun produit ne s'affiche avec ce code-barre : ${cleaned}"`);
        }
        
        console.log('');
    });
}

// Test de performance
function testPerformance() {
    console.log('⚡ === TEST PERFORMANCE SCANNER ===\n');
    
    const allProducts = dbModule.productDB.getAll();
    const testCode = '1234567890123';
    const iterations = 1000;
    
    console.log(`🏃 Test de ${iterations} scans du code "${testCode}"...\n`);
    
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
        const cleaned = cleanAndValidateBarcode(testCode);
        const product = findProductByBarcode(testCode, allProducts);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`📊 Résultats de performance:`);
    console.log(`   - Temps total: ${totalTime}ms`);
    console.log(`   - Temps moyen par scan: ${avgTime.toFixed(3)}ms`);
    console.log(`   - Scans par seconde: ${(1000 / avgTime).toFixed(0)}`);
    
    if (avgTime < 1) {
        console.log(`   ✅ Performance excellente !`);
    } else if (avgTime < 5) {
        console.log(`   ✅ Performance bonne`);
    } else {
        console.log(`   ⚠️ Performance à améliorer`);
    }
    
    console.log('');
}

// Conseils de debug
function showDebugTips() {
    console.log('💡 === CONSEILS DE DEBUG SCANNER ===\n');
    
    console.log('🔧 Pour débugger les problèmes de scanner:');
    console.log('');
    console.log('1. 📱 VÉRIFIER LES LOGS CONSOLE:');
    console.log('   - Ouvrez les outils développeur (F12)');
    console.log('   - Onglet Console');
    console.log('   - Cherchez les messages: "📱 Code-barres reçu:" et "🧹 Code-barres nettoyé:"');
    console.log('');
    console.log('2. 🔄 PROBLÈME DOUBLE MESSAGE:');
    console.log('   - Vérifiez si plusieurs événements se déclenchent');
    console.log('   - Cherchez: "🔄 Code-barres déjà traité récemment, ignoré:"');
    console.log('   - Cherchez: "⏳ Traitement en cours, code-barres ignoré:"');
    console.log('');
    console.log('3. 🎯 TYPES DE SCAN:');
    console.log('   - "🔍 Scan manuel via Enter:" = Saisie manuelle + Enter');
    console.log('   - "🤖 Scan automatique détecté:" = Scanner automatique');
    console.log('');
    console.log('4. ⚠️ MESSAGES D\'ERREUR ATTENDUS:');
    console.log('   - "Code-barres invalide ou trop court" = Code < 4 ou > 20 caractères');
    console.log('   - "Aucun produit ne s\'affiche avec ce code-barre" = Produit non trouvé');
    console.log('   - "Rupture de stock" = Produit trouvé mais stock = 0');
    console.log('');
    console.log('5. ✅ MESSAGES DE SUCCÈS ATTENDUS:');
    console.log('   - "✅ [Nom Produit] ajouté" = Produit ajouté avec succès');
    console.log('   - "✅ [Nom Produit] ajouté (X restants)" = Produit ajouté, stock faible');
    console.log('');
    console.log('🎯 SOLUTION PROBLÈME DOUBLE MESSAGE:');
    console.log('   - Protection anti-doublon ajoutée (500ms)');
    console.log('   - Verrou de traitement (isProcessingBarcode)');
    console.log('   - Suppression événement "input" redondant');
    console.log('   - Amélioration détection scan automatique vs manuel');
    console.log('');
}

// Fonction principale
function runScannerDebugTest() {
    try {
        console.log('🔧 Initialisation du test debug scanner...\n');
        
        // Nettoyer et préparer
        cleanTestDatabase();
        addTestProducts();
        
        // Tests
        testScanScenarios();
        testPerformance();
        showDebugTips();
        
        console.log('🎊 Test debug scanner terminé avec succès !');
        console.log('');
        console.log('🚀 PROCHAINES ÉTAPES:');
        console.log('1. Lancez l\'application: npm start');
        console.log('2. Allez dans la page Caisse');
        console.log('3. Testez les codes-barres suivants:');
        console.log('   - 1234567890123 (doit fonctionner)');
        console.log('   - 9876543210987 (doit fonctionner)');
        console.log('   - 0000000000000 (rupture de stock)');
        console.log('   - 9999999999999 (non trouvé)');
        console.log('4. Vérifiez qu\'il n\'y a plus de double message d\'erreur');
        console.log('');
        
    } catch (error) {
        console.error('❌ Erreur lors du test debug scanner:', error);
    }
}

// Lancer le test
runScannerDebugTest();
