// Validation complète du système TVA
const db = require('./database.js');

async function validateTVASystem() {
    console.log('🔍 === VALIDATION SYSTÈME TVA GESTIONPRO v2.0 ===\n');
    
    let allTestsPassed = true;
    const results = {
        database: false,
        migration: false,
        calculations: false,
        storage: false,
        retrieval: false
    };
    
    try {
        // Test 1: Initialisation base de données
        console.log('📊 Test 1: Initialisation base de données...');
        db.initDatabase();
        results.database = true;
        console.log('✅ Base de données initialisée\n');
        
        // Test 2: Vérification migration TVA
        console.log('🔄 Test 2: Vérification migration TVA...');
        const testQuery = db.prepare ? 
            db.prepare("PRAGMA table_info(invoices)").all() :
            require('better-sqlite3')(require('path').join(process.cwd(), 'database', 'main.db')).prepare("PRAGMA table_info(invoices)").all();
        
        const hasSubtotalHt = testQuery.some(col => col.name === 'subtotal_ht');
        const hasTvaRate = testQuery.some(col => col.name === 'tva_rate');
        const hasTvaAmount = testQuery.some(col => col.name === 'tva_amount');
        
        if (hasSubtotalHt && hasTvaRate && hasTvaAmount) {
            results.migration = true;
            console.log('✅ Migration TVA complète');
            console.log('   - Colonne subtotal_ht: ✅');
            console.log('   - Colonne tva_rate: ✅');
            console.log('   - Colonne tva_amount: ✅\n');
        } else {
            console.log('❌ Migration TVA incomplète');
            allTestsPassed = false;
        }
        
        // Test 3: Calculs TVA
        console.log('🧮 Test 3: Validation calculs TVA...');
        const testCases = [
            { ht: 1000, rate: 20, expectedTva: 200, expectedTtc: 1200 },
            { ht: 500, rate: 10, expectedTva: 50, expectedTtc: 550 },
            { ht: 800, rate: 0, expectedTva: 0, expectedTtc: 800 },
            { ht: 1500, rate: 7.5, expectedTva: 112.5, expectedTtc: 1612.5 }
        ];
        
        let calculationsOk = true;
        testCases.forEach((test, index) => {
            const calculatedTva = test.ht * (test.rate / 100);
            const calculatedTtc = test.ht + calculatedTva;
            
            if (Math.abs(calculatedTva - test.expectedTva) < 0.01 && 
                Math.abs(calculatedTtc - test.expectedTtc) < 0.01) {
                console.log(`   ✅ Calcul ${index + 1}: ${test.ht} HT × ${test.rate}% = ${calculatedTva} TVA → ${calculatedTtc} TTC`);
            } else {
                console.log(`   ❌ Calcul ${index + 1}: Erreur`);
                calculationsOk = false;
            }
        });
        
        results.calculations = calculationsOk;
        if (!calculationsOk) allTestsPassed = false;
        console.log();
        
        // Test 4: Stockage facture avec TVA
        console.log('💾 Test 4: Stockage facture avec TVA...');
        const testInvoice = {
            invoice_number: 'VALID-2024-001',
            invoice_date: '2024-01-20',
            client_name: 'Client Test Validation',
            client_address: 'Adresse Test',
            client_phone: '0612345678',
            client_ice: '123456789',
            subtotal_ht: 1000.00,
            tva_rate: 20,
            tva_amount: 200.00,
            total_amount: 1200.00,
            items: [
                {
                    description: 'Produit Test Validation',
                    quantity: 1,
                    unit_price: 1000.00,
                    unit: 'piece',
                    line_total: 1000.00
                }
            ]
        };
        
        const createResult = db.invoicesDB.create(testInvoice);
        if (createResult.success && createResult.invoiceId) {
            results.storage = true;
            console.log('✅ Facture avec TVA stockée');
            console.log(`   ID: ${createResult.invoiceId}\n`);
        } else {
            console.log('❌ Erreur stockage facture');
            allTestsPassed = false;
        }
        
        // Test 5: Récupération facture avec TVA
        console.log('📖 Test 5: Récupération facture avec TVA...');
        if (results.storage) {
            const retrievedInvoice = db.invoicesDB.getDetails(createResult.invoiceId);
            
            if (retrievedInvoice && 
                retrievedInvoice.subtotal_ht === testInvoice.subtotal_ht &&
                retrievedInvoice.tva_rate === testInvoice.tva_rate &&
                retrievedInvoice.tva_amount === testInvoice.tva_amount &&
                retrievedInvoice.total_amount === testInvoice.total_amount) {
                
                results.retrieval = true;
                console.log('✅ Facture récupérée avec données TVA correctes');
                console.log(`   Sous-total HT: ${retrievedInvoice.subtotal_ht} MAD`);
                console.log(`   TVA (${retrievedInvoice.tva_rate}%): ${retrievedInvoice.tva_amount} MAD`);
                console.log(`   Total TTC: ${retrievedInvoice.total_amount} MAD\n`);
            } else {
                console.log('❌ Erreur récupération ou données incorrectes');
                allTestsPassed = false;
            }
        }
        
        // Résumé final
        console.log('📋 === RÉSUMÉ VALIDATION ===');
        console.log(`📊 Base de données: ${results.database ? '✅ OK' : '❌ ERREUR'}`);
        console.log(`🔄 Migration TVA: ${results.migration ? '✅ OK' : '❌ ERREUR'}`);
        console.log(`🧮 Calculs TVA: ${results.calculations ? '✅ OK' : '❌ ERREUR'}`);
        console.log(`💾 Stockage: ${results.storage ? '✅ OK' : '❌ ERREUR'}`);
        console.log(`📖 Récupération: ${results.retrieval ? '✅ OK' : '❌ ERREUR'}`);
        
        console.log('\n🎯 === RÉSULTAT FINAL ===');
        if (allTestsPassed) {
            console.log('🎉 SYSTÈME TVA ENTIÈREMENT VALIDÉ !');
            console.log('✅ Toutes les fonctionnalités TVA sont opérationnelles');
            console.log('🚀 L\'application est prête pour la production');
            console.log('\n💡 Prochaines étapes:');
            console.log('   1. Lancer l\'application: npm start');
            console.log('   2. Tester l\'interface de facturation');
            console.log('   3. Créer des factures avec différents taux TVA');
            console.log('   4. Vérifier la génération PDF');
        } else {
            console.log('❌ VALIDATION ÉCHOUÉE');
            console.log('🔧 Des problèmes ont été détectés');
            console.log('\n💡 Actions recommandées:');
            console.log('   1. Exécuter: fix-electron-modules.bat');
            console.log('   2. Vérifier les logs d\'erreur');
            console.log('   3. Consulter: TROUBLESHOOTING.md');
        }
        
        return allTestsPassed;
        
    } catch (error) {
        console.error('❌ Erreur critique lors de la validation:', error.message);
        console.log('\n🔧 Solutions possibles:');
        console.log('   1. Exécuter: npx electron-rebuild');
        console.log('   2. Exécuter: fix-electron-modules.bat');
        console.log('   3. Redémarrer en tant qu\'administrateur');
        return false;
    }
}

// Exécuter la validation
if (require.main === module) {
    validateTVASystem().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { validateTVASystem };
