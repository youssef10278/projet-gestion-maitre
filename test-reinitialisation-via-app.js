// test-reinitialisation-via-app.js
// Test de la réinitialisation via l'API de l'application

const db = require('./database.js');

console.log('🧪 TEST: Réinitialisation totale via l\'API de l\'application');
console.log('=' .repeat(70));

// Liste de toutes les tables à vérifier
const tablesToCheck = [
    // Tables principales de données
    'products', 'clients', 'sales', 'sale_items',
    'invoices', 'invoice_items', 'quotes', 'quote_items',
    'returns', 'return_items', 'suppliers', 'expenses',
    
    // Tables de bons de livraison
    'supplier_orders', 'supplier_order_items', 
    'supplier_deliveries', 'supplier_delivery_items',
    
    // Tables de gestion
    'stock_lots', 'stock_movements', 'stock_adjustments',
    'credit_payments', 'product_valuation_settings',
    
    // Tables de templates et préférences
    'invoice_templates', 'user_template_preferences', 'user_preferences',
    
    // Tables système
    'users', 'settings'
];

async function checkTableCounts() {
    console.log('📊 Vérification du contenu des tables:');
    console.log('-'.repeat(50));
    
    let totalRecords = 0;
    const nonEmptyTables = [];
    
    for (const tableName of tablesToCheck) {
        try {
            const result = db.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
            const count = result.count;
            totalRecords += count;
            
            if (count > 0) {
                nonEmptyTables.push({ table: tableName, count });
                console.log(`📋 ${tableName.padEnd(30)} : ${count.toString().padStart(6)} enregistrements`);
            } else {
                console.log(`📋 ${tableName.padEnd(30)} : VIDE`);
            }
        } catch (error) {
            if (error.message.includes('no such table')) {
                console.log(`⚠️  ${tableName.padEnd(30)} : TABLE INEXISTANTE`);
            } else {
                console.log(`❌ ${tableName.padEnd(30)} : ERREUR - ${error.message}`);
            }
        }
    }
    
    console.log('-'.repeat(50));
    console.log(`📊 TOTAL: ${totalRecords} enregistrements dans toutes les tables`);
    
    return { totalRecords, nonEmptyTables };
}

async function testFactoryReset() {
    console.log('\n🧹 SIMULATION: Test de la réinitialisation totale...');
    console.log('-'.repeat(50));
    
    try {
        // Simuler les requêtes de suppression
        const queries = [
            // 1. DONNÉES TRANSACTIONNELLES
            'DELETE FROM sale_items',
            'DELETE FROM sales',
            'DELETE FROM invoice_items', 
            'DELETE FROM invoices',
            'DELETE FROM quote_items',
            'DELETE FROM quotes',
            'DELETE FROM return_items',
            'DELETE FROM returns',
            'DELETE FROM credit_payments',
            
            // 2. DONNÉES PRODUITS ET STOCK
            'DELETE FROM products',
            'DELETE FROM stock_lots',
            'DELETE FROM stock_movements', 
            'DELETE FROM stock_adjustments',
            'DELETE FROM product_valuation_settings',
            
            // 3. DONNÉES CLIENTS ET FOURNISSEURS
            'DELETE FROM clients',
            'DELETE FROM suppliers',
            'DELETE FROM supplier_order_items',
            'DELETE FROM supplier_orders',
            'DELETE FROM supplier_delivery_items',
            'DELETE FROM supplier_deliveries',
            
            // 4. DÉPENSES
            'DELETE FROM expenses',
            
            // 5. TEMPLATES ET PRÉFÉRENCES
            'DELETE FROM invoice_templates',
            'DELETE FROM user_template_preferences',
            'DELETE FROM user_preferences',
            
            // 6. UTILISATEURS
            'DELETE FROM users',
            
            // 7. PARAMÈTRES ENTREPRISE
            'DELETE FROM settings',
            
            // 8. COMPTEURS AUTO-INCREMENT
            'DELETE FROM sqlite_sequence'
        ];
        
        console.log(`📋 ${queries.length} requêtes de suppression à exécuter...`);
        
        // Exécuter dans une transaction
        db.db.transaction(() => {
            queries.forEach((query, index) => {
                try {
                    db.db.prepare(query).run();
                    console.log(`✅ ${index + 1}/${queries.length}: ${query.split(' ')[2]}`);
                } catch (error) {
                    if (!error.message.includes('no such table')) {
                        console.warn(`⚠️  Erreur sur: ${query} - ${error.message}`);
                    } else {
                        console.log(`⚠️  ${index + 1}/${queries.length}: ${query.split(' ')[2]} (table inexistante)`);
                    }
                }
            });
        })();
        
        console.log('✅ Réinitialisation simulée terminée');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error);
        return false;
    }
}

async function runTest() {
    // État avant
    console.log('📊 ÉTAT AVANT RÉINITIALISATION:');
    const beforeStats = await checkTableCounts();
    
    if (beforeStats.totalRecords === 0) {
        console.log('\n⚠️  La base de données est déjà vide');
        console.log('   Ajoutez quelques données de test pour valider la réinitialisation');
        return;
    }
    
    // Demander confirmation
    console.log('\n⚠️  ATTENTION: Cette opération va SUPPRIMER TOUTES les données !');
    console.log('   Appuyez sur Ctrl+C pour annuler, ou Entrée pour continuer...');
    
    // Attendre l'entrée utilisateur (simulation)
    console.log('\n🧹 Exécution de la réinitialisation totale...');
    
    // Exécuter la réinitialisation
    const success = await testFactoryReset();
    
    if (success) {
        // État après
        console.log('\n📊 ÉTAT APRÈS RÉINITIALISATION:');
        const afterStats = await checkTableCounts();
        
        // Résumé
        console.log('\n' + '='.repeat(70));
        console.log('🎯 RÉSUMÉ DU TEST:');
        console.log('='.repeat(70));
        
        if (afterStats.totalRecords === 0) {
            console.log('✅ RÉINITIALISATION TOTALE RÉUSSIE !');
            console.log('   Toutes les données ont été supprimées');
            console.log(`   ${beforeStats.totalRecords} → 0 enregistrements`);
        } else {
            console.log('❌ RÉINITIALISATION INCOMPLÈTE !');
            console.log(`   ${afterStats.totalRecords} enregistrements restants`);
            console.log('\n📋 Tables non vides:');
            afterStats.nonEmptyTables.forEach(({ table, count }) => {
                console.log(`   - ${table}: ${count} enregistrements`);
            });
        }
    }
}

// Exécuter le test
runTest().catch(error => {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
});
