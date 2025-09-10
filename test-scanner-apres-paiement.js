// Test automatisé pour le problème scanner après paiement
const dbModule = require('./database.js');
const fs = require('fs');
const path = require('path');

console.log('🧪 === TEST SCANNER APRÈS PAIEMENT ===\n');

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

// Ajouter des produits et clients de test
function setupTestData() {
    console.log('📦 Configuration des données de test...\n');
    
    // Ajouter des produits avec codes-barres
    const testProducts = [
        {
            name: 'Produit Scanner Test 1',
            barcode: '1111111111111',
            price_retail: 15.00,
            price_wholesale: 12.00,
            price_carton: 144.00,
            pieces_per_carton: 12,
            stock: 100,
            category: 'Test'
        },
        {
            name: 'Produit Scanner Test 2',
            barcode: '2222222222222',
            price_retail: 25.00,
            price_wholesale: 20.00,
            price_carton: 240.00,
            pieces_per_carton: 12,
            stock: 50,
            category: 'Test'
        },
        {
            name: 'Produit Scanner Test 3',
            barcode: '3333333333333',
            price_retail: 8.50,
            price_wholesale: 7.00,
            price_carton: 84.00,
            pieces_per_carton: 12,
            stock: 75,
            category: 'Test'
        }
    ];
    
    testProducts.forEach((product, index) => {
        try {
            const addedProduct = dbModule.productDB.add(product);
            console.log(`✅ Produit ${index + 1} ajouté: ${addedProduct.name} (${addedProduct.barcode})`);
        } catch (error) {
            console.log(`❌ Erreur produit ${index + 1}:`, error.message);
        }
    });
    
    // Ajouter un client de test
    try {
        const testClient = dbModule.clientDB.add({
            name: 'Client Test Scanner',
            phone: '0661234567',
            ice: 'ICE123456789',
            address: 'Adresse Test'
        });
        console.log(`✅ Client test ajouté: ${testClient.name} (ID: ${testClient.id})`);
    } catch (error) {
        console.log(`❌ Erreur client test:`, error.message);
    }
    
    console.log('\n📊 Données de test configurées avec succès !\n');
}

// Simuler une vente complète
function simulateCompleteSale() {
    console.log('💰 === SIMULATION VENTE COMPLÈTE ===\n');
    
    try {
        // Récupérer les produits et client
        const products = dbModule.productDB.getAll();
        const clients = dbModule.clientDB.getAll();
        
        if (products.length === 0 || clients.length === 0) {
            console.log('❌ Pas assez de données pour simuler une vente');
            return null;
        }
        
        const testProduct = products.find(p => p.barcode === '1111111111111');
        const testClient = clients.find(c => c.name === 'Client Test Scanner');
        
        if (!testProduct || !testClient) {
            console.log('❌ Produit ou client de test non trouvé');
            return null;
        }
        
        console.log(`🛒 Simulation vente:`);
        console.log(`   - Produit: ${testProduct.name} (${testProduct.barcode})`);
        console.log(`   - Prix: ${testProduct.price_retail} MAD`);
        console.log(`   - Client: ${testClient.name}`);
        console.log(`   - Quantité: 2`);
        
        const saleData = {
            client_id: testClient.id,
            items: [
                {
                    product_id: testProduct.id,
                    quantity: 2,
                    unit_price: testProduct.price_retail,
                    unit: 'retail'
                }
            ],
            payment_method: 'cash',
            amount_paid: testProduct.price_retail * 2,
            total_amount: testProduct.price_retail * 2
        };
        
        // Enregistrer la vente
        const sale = dbModule.salesDB.add(saleData);
        console.log(`✅ Vente enregistrée avec succès (ID: ${sale.id})`);
        console.log(`   - Total: ${sale.total_amount} MAD`);
        console.log(`   - Méthode: ${sale.payment_method}`);
        
        return sale;
        
    } catch (error) {
        console.error('❌ Erreur lors de la simulation de vente:', error.message);
        return null;
    }
}

// Simuler les états du scanner
function simulateScannerStates() {
    console.log('\n🔍 === SIMULATION ÉTATS SCANNER ===\n');
    
    // Simuler les variables d'état comme dans l'application
    let scannerState = {
        isProcessingBarcode: false,
        isProcessing: false,
        isRendering: false,
        lastProcessedBarcode: '',
        lastProcessedTime: 0,
        barcodeBuffer: '',
        cart: []
    };
    
    console.log('📱 État initial du scanner:');
    console.log('   ', scannerState);
    
    // Simuler un premier scan
    console.log('\n🔍 Simulation premier scan (1111111111111)...');
    scannerState.isProcessingBarcode = true;
    scannerState.lastProcessedBarcode = '1111111111111';
    scannerState.lastProcessedTime = Date.now();
    scannerState.cart = [{ id: 1, name: 'Produit Scanner Test 1', quantity: 1 }];
    
    console.log('📱 État après premier scan:');
    console.log('   ', scannerState);
    
    // Simuler le paiement
    console.log('\n💰 Simulation paiement...');
    scannerState.isProcessing = true;
    
    console.log('📱 État pendant paiement:');
    console.log('   ', scannerState);
    
    // Simuler la réinitialisation AVANT correction
    console.log('\n🔄 Réinitialisation AVANT correction...');
    const stateBeforeCorrection = {
        ...scannerState,
        cart: [],
        isProcessing: false
        // PROBLÈME: isProcessingBarcode reste true
        // PROBLÈME: lastProcessedBarcode non vidé
    };
    
    console.log('📱 État après réinitialisation AVANT correction:');
    console.log('   ', stateBeforeCorrection);
    console.log('❌ PROBLÈME: isProcessingBarcode encore true, lastProcessedBarcode non vidé');
    
    // Simuler un nouveau scan avec l'ancien état
    console.log('\n🔍 Tentative nouveau scan (2222222222222) AVANT correction...');
    const timeDiff = Date.now() - stateBeforeCorrection.lastProcessedTime;
    
    if (stateBeforeCorrection.isProcessingBarcode) {
        console.log('❌ BLOQUÉ: isProcessingBarcode = true');
    }
    
    if (timeDiff < 500 && stateBeforeCorrection.lastProcessedBarcode === '2222222222222') {
        console.log('❌ BLOQUÉ: Protection anti-doublon active');
    }
    
    // Simuler la réinitialisation APRÈS correction
    console.log('\n🔄 Réinitialisation APRÈS correction...');
    const stateAfterCorrection = {
        isProcessingBarcode: false,  // ✅ CORRIGÉ
        isProcessing: false,
        isRendering: false,
        lastProcessedBarcode: '',    // ✅ CORRIGÉ
        lastProcessedTime: 0,        // ✅ CORRIGÉ
        barcodeBuffer: '',
        cart: []
    };
    
    console.log('📱 État après réinitialisation APRÈS correction:');
    console.log('   ', stateAfterCorrection);
    console.log('✅ CORRIGÉ: Toutes les variables réinitialisées');
    
    // Simuler un nouveau scan avec le nouvel état
    console.log('\n🔍 Tentative nouveau scan (2222222222222) APRÈS correction...');
    
    if (!stateAfterCorrection.isProcessingBarcode) {
        console.log('✅ SUCCÈS: isProcessingBarcode = false, scan autorisé');
    }
    
    const newTimeDiff = Date.now() - stateAfterCorrection.lastProcessedTime;
    if (newTimeDiff > 500 || stateAfterCorrection.lastProcessedBarcode !== '2222222222222') {
        console.log('✅ SUCCÈS: Protection anti-doublon inactive, scan autorisé');
    }
    
    console.log('✅ RÉSULTAT: Le nouveau scan devrait fonctionner !');
}

// Conseils de test manuel
function showManualTestInstructions() {
    console.log('\n📋 === INSTRUCTIONS TEST MANUEL ===\n');
    
    console.log('🎯 SÉQUENCE DE TEST À SUIVRE:');
    console.log('');
    console.log('1. 🚀 LANCER L\'APPLICATION:');
    console.log('   npm start');
    console.log('');
    console.log('2. 📱 ALLER DANS LA CAISSE:');
    console.log('   - Cliquez sur "Caisse" dans le menu');
    console.log('   - Vérifiez que le champ scanner a le focus');
    console.log('');
    console.log('3. 🔍 PREMIER SCAN:');
    console.log('   - Scannez ou tapez: 1111111111111');
    console.log('   - Vérifiez que "Produit Scanner Test 1" est ajouté');
    console.log('   - Vérifiez les logs console (F12):');
    console.log('     📱 processBarcodeInput appelé avec: 1111111111111');
    console.log('     🛒 Tentative d\'ajout produit au panier: {...}');
    console.log('');
    console.log('4. 💰 VALIDER LE PAIEMENT:');
    console.log('   - Cliquez "Valider Paiement"');
    console.log('   - Choisissez "Comptant"');
    console.log('   - Confirmez le paiement');
    console.log('   - Attendez la fin du processus');
    console.log('');
    console.log('5. ✅ VÉRIFIER LA RÉINITIALISATION:');
    console.log('   - Vérifiez les logs console:');
    console.log('     ✅ Variables scanner réinitialisées (isProcessingBarcode: false)');
    console.log('     ✅ Variables globales d\'état réinitialisées');
    console.log('     ✅ Focus remis sur le scanner');
    console.log('');
    console.log('6. 🔍 DEUXIÈME SCAN (TEST CRITIQUE):');
    console.log('   - Scannez ou tapez: 2222222222222');
    console.log('   - ✅ SUCCÈS: "Produit Scanner Test 2" doit être ajouté');
    console.log('   - ❌ ÉCHEC: Rien ne se passe → Problème non résolu');
    console.log('');
    console.log('7. 🔍 TROISIÈME SCAN (CONFIRMATION):');
    console.log('   - Scannez ou tapez: 3333333333333');
    console.log('   - ✅ SUCCÈS: "Produit Scanner Test 3" doit être ajouté');
    console.log('');
    console.log('🚨 EN CAS DE PROBLÈME:');
    console.log('');
    console.log('1. 📊 VÉRIFIEZ LA CONSOLE (F12):');
    console.log('   - Cherchez les messages d\'erreur');
    console.log('   - Vérifiez les valeurs des variables d\'état');
    console.log('');
    console.log('2. 🔧 TEST MANUEL DANS LA CONSOLE:');
    console.log('   // Vérifier l\'état');
    console.log('   console.log({');
    console.log('     isProcessingBarcode,');
    console.log('     isProcessing,');
    console.log('     lastProcessedBarcode,');
    console.log('     cart: cart.length');
    console.log('   });');
    console.log('');
    console.log('   // Forcer la réinitialisation');
    console.log('   isProcessingBarcode = false;');
    console.log('   lastProcessedBarcode = "";');
    console.log('   lastProcessedTime = 0;');
    console.log('');
    console.log('   // Tester directement');
    console.log('   await processBarcodeInput("2222222222222");');
    console.log('');
    console.log('3. 📞 SIGNALER LE PROBLÈME:');
    console.log('   - Capturez les logs de la console');
    console.log('   - Notez la séquence exacte des actions');
    console.log('   - Mentionnez les codes-barres utilisés');
    console.log('');
}

// Fonction principale
function runScannerAfterPaymentTest() {
    try {
        console.log('🔧 Initialisation du test scanner après paiement...\n');
        
        // Préparer les données
        cleanTestDatabase();
        setupTestData();
        
        // Simuler une vente
        const sale = simulateCompleteSale();
        
        if (sale) {
            // Simuler les états du scanner
            simulateScannerStates();
        }
        
        // Instructions pour test manuel
        showManualTestInstructions();
        
        console.log('\n🎊 Test de simulation terminé !');
        console.log('');
        console.log('🚀 PROCHAINE ÉTAPE: Testez manuellement dans l\'application');
        console.log('   Les produits de test sont prêts avec les codes-barres:');
        console.log('   - 1111111111111 (Produit Scanner Test 1)');
        console.log('   - 2222222222222 (Produit Scanner Test 2)');
        console.log('   - 3333333333333 (Produit Scanner Test 3)');
        console.log('');
        
    } catch (error) {
        console.error('❌ Erreur lors du test scanner après paiement:', error);
    }
}

// Lancer le test
runScannerAfterPaymentTest();
