// test-reinitialisation-totale.js
// Script de test pour vérifier la réinitialisation totale

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🧪 TEST: Vérification de la réinitialisation totale');
console.log('=' .repeat(60));

// Chemin vers la base de données
const dbPath = path.join(__dirname, 'database', 'main.db');

if (!fs.existsSync(dbPath)) {
    console.log('❌ Base de données introuvable:', dbPath);
    process.exit(1);
}

const db = new Database(dbPath);

// Liste de TOUTES les tables qui doivent être vérifiées
const tablesToCheck = [
    // Tables principales de données
    'products',
    'clients', 
    'sales',
    'sale_items',
    'invoices',
    'invoice_items',
    'quotes',
    'quote_items',
    'returns',
    'return_items',
    'suppliers',
    'expenses',
    
    // Tables de bons de livraison
    'supplier_orders',
    'supplier_order_items', 
    'supplier_deliveries',
    'supplier_delivery_items',
    
    // Tables de gestion
    'stock_lots',
    'stock_movements',
    'stock_adjustments',
    'credit_payments',
    'product_valuation_settings',
    
    // Tables de templates et préférences
    'invoice_templates',
    'user_template_preferences',
    'user_preferences',
    
    // Tables système (qui seront aussi supprimées maintenant)
    'users',
    'settings'
];

console.log('📊 Vérification de l\'état AVANT réinitialisation:');
console.log('-'.repeat(50));

let totalRecords = 0;
const tableStats = {};

tablesToCheck.forEach(tableName => {
    try {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
        const count = result.count;
        tableStats[tableName] = count;
        totalRecords += count;
        
        if (count > 0) {
            console.log(`📋 ${tableName.padEnd(25)} : ${count} enregistrements`);
        } else {
            console.log(`📋 ${tableName.padEnd(25)} : VIDE`);
        }
    } catch (error) {
        console.log(`⚠️  ${tableName.padEnd(25)} : TABLE INEXISTANTE`);
        tableStats[tableName] = 'N/A';
    }
});

console.log('-'.repeat(50));
console.log(`📊 TOTAL: ${totalRecords} enregistrements dans toutes les tables`);

// Vérifier les compteurs auto-increment
console.log('\n🔢 Vérification des compteurs auto-increment:');
try {
    const sequences = db.prepare('SELECT * FROM sqlite_sequence').all();
    console.log(`📋 Compteurs actifs: ${sequences.length}`);
    sequences.forEach(seq => {
        console.log(`   - ${seq.name}: ${seq.seq}`);
    });
} catch (error) {
    console.log('⚠️  Aucun compteur auto-increment trouvé');
}

console.log('\n' + '='.repeat(60));
console.log('🎯 RÉSUMÉ DU TEST:');
console.log('='.repeat(60));

if (totalRecords === 0) {
    console.log('✅ RÉINITIALISATION TOTALE CONFIRMÉE !');
    console.log('   Toutes les tables sont vides');
    console.log('   La base de données a été correctement réinitialisée');
} else {
    console.log('❌ RÉINITIALISATION INCOMPLÈTE !');
    console.log(`   ${totalRecords} enregistrements restants`);
    console.log('   Certaines données n\'ont pas été supprimées');
    
    // Afficher les tables non vides
    console.log('\n📋 Tables non vides:');
    Object.entries(tableStats).forEach(([table, count]) => {
        if (typeof count === 'number' && count > 0) {
            console.log(`   - ${table}: ${count} enregistrements`);
        }
    });
}

console.log('\n💡 INSTRUCTIONS:');
console.log('1. Si la réinitialisation est incomplète, vérifiez main.js');
console.log('2. Assurez-vous que toutes les tables sont incluses dans les requêtes DELETE');
console.log('3. Testez à nouveau après correction');

db.close();
console.log('\n🔚 Test terminé');
