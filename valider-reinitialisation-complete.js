// valider-reinitialisation-complete.js
// Script pour valider que toutes les tables sont incluses dans la réinitialisation

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔍 VALIDATION: Vérification de la complétude de la réinitialisation');
console.log('=' .repeat(70));

// Chemin vers la base de données
const dbPath = path.join(__dirname, 'database', 'main.db');

if (!fs.existsSync(dbPath)) {
    console.log('❌ Base de données introuvable:', dbPath);
    process.exit(1);
}

const db = new Database(dbPath);

// Récupérer TOUTES les tables existantes dans la base
const allTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%'
    ORDER BY name
`).all().map(row => row.name);

console.log('📋 Tables trouvées dans la base de données:');
console.log('-'.repeat(50));
allTables.forEach((table, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${table}`);
});
console.log(`\n📊 TOTAL: ${allTables.length} tables`);

// Tables définies dans main.js pour la réinitialisation
const tablesInResetScript = [
    'sale_items',
    'sales', 
    'invoice_items',
    'invoices',
    'quote_items',
    'quotes',
    'return_items',
    'returns',
    'credit_payments',
    'products',
    'stock_lots',
    'stock_movements',
    'stock_adjustments', 
    'product_valuation_settings',
    'clients',
    'suppliers',
    'supplier_order_items',
    'supplier_orders',
    'supplier_delivery_items',
    'supplier_deliveries',
    'expenses',
    'invoice_templates',
    'user_template_preferences',
    'user_preferences',
    'users',
    'settings'
];

console.log('\n📋 Tables incluses dans le script de réinitialisation:');
console.log('-'.repeat(50));
tablesInResetScript.forEach((table, index) => {
    const exists = allTables.includes(table);
    const status = exists ? '✅' : '❌';
    console.log(`${(index + 1).toString().padStart(2)}. ${status} ${table}`);
});
console.log(`\n📊 TOTAL: ${tablesInResetScript.length} tables dans le script`);

// Analyse des différences
console.log('\n🔍 ANALYSE DES DIFFÉRENCES:');
console.log('='.repeat(50));

// Tables existantes mais pas dans le script
const missingFromScript = allTables.filter(table => !tablesInResetScript.includes(table));
if (missingFromScript.length > 0) {
    console.log('❌ Tables MANQUANTES dans le script de réinitialisation:');
    missingFromScript.forEach(table => {
        console.log(`   - ${table}`);
    });
} else {
    console.log('✅ Toutes les tables existantes sont incluses dans le script');
}

// Tables dans le script mais qui n'existent pas
const missingFromDB = tablesInResetScript.filter(table => !allTables.includes(table));
if (missingFromDB.length > 0) {
    console.log('\n⚠️  Tables dans le script mais INEXISTANTES dans la base:');
    missingFromDB.forEach(table => {
        console.log(`   - ${table}`);
    });
    console.log('   (Ces tables seront ignorées lors de la réinitialisation)');
}

// Vérification des données dans chaque table
console.log('\n📊 CONTENU ACTUEL DES TABLES:');
console.log('-'.repeat(50));

let totalRecords = 0;
const nonEmptyTables = [];

allTables.forEach(table => {
    try {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        const count = result.count;
        totalRecords += count;
        
        if (count > 0) {
            nonEmptyTables.push({ table, count });
            console.log(`📋 ${table.padEnd(30)} : ${count.toString().padStart(6)} enregistrements`);
        }
    } catch (error) {
        console.log(`⚠️  ${table.padEnd(30)} : ERREUR - ${error.message}`);
    }
});

if (nonEmptyTables.length === 0) {
    console.log('✅ Toutes les tables sont vides');
} else {
    console.log(`\n📊 ${nonEmptyTables.length} tables contiennent des données`);
    console.log(`📊 Total: ${totalRecords} enregistrements`);
}

// Résumé final
console.log('\n' + '='.repeat(70));
console.log('🎯 RÉSUMÉ DE LA VALIDATION:');
console.log('='.repeat(70));

if (missingFromScript.length === 0) {
    console.log('✅ VALIDATION RÉUSSIE !');
    console.log('   Toutes les tables existantes sont incluses dans la réinitialisation');
    console.log('   La réinitialisation sera complète et totale');
} else {
    console.log('❌ VALIDATION ÉCHOUÉE !');
    console.log(`   ${missingFromScript.length} table(s) manquante(s) dans le script`);
    console.log('   La réinitialisation sera incomplète');
    
    console.log('\n🔧 ACTION REQUISE:');
    console.log('   Ajoutez ces tables au script main.js dans system:factory-reset');
    missingFromScript.forEach(table => {
        console.log(`   - DELETE FROM ${table};`);
    });
}

if (missingFromDB.length > 0) {
    console.log(`\n⚠️  ${missingFromDB.length} table(s) du script n'existent pas dans la base`);
    console.log('   (Ceci est normal si ces tables ne sont pas encore créées)');
}

console.log('\n💡 RECOMMANDATIONS:');
console.log('1. Exécutez ce script avant chaque modification de la réinitialisation');
console.log('2. Mettez à jour main.js si de nouvelles tables sont détectées');
console.log('3. Testez la réinitialisation avec test-reinitialisation-totale.js');

db.close();
console.log('\n🔚 Validation terminée');
