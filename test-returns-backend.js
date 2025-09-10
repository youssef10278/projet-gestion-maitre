/**
 * Script de test pour les fonctions backend du système de retours
 */

const db = require('./database.js');

console.log('🧪 Test des fonctions backend du système de retours\n');

// Test 1: Vérifier que les nouvelles fonctions sont disponibles
console.log('1. Vérification de la disponibilité des fonctions...');
const returnsDB = db.returnsDB;

const expectedFunctions = [
    'searchSales',
    'getSaleDetails', 
    'process',
    'getHistory',
    'getDetails',
    'getStats',
    'validate'
];

let allFunctionsAvailable = true;
expectedFunctions.forEach(funcName => {
    if (typeof returnsDB[funcName] === 'function') {
        console.log(`✅ ${funcName} disponible`);
    } else {
        console.log(`❌ ${funcName} manquante`);
        allFunctionsAvailable = false;
    }
});

if (allFunctionsAvailable) {
    console.log('✅ Toutes les fonctions sont disponibles\n');
} else {
    console.log('❌ Certaines fonctions sont manquantes\n');
    process.exit(1);
}

// Test 2: Test de génération de numéros de tickets
console.log('2. Test de génération de numéros de tickets...');
try {
    const saleTicket = db.ticketDB.generateUniqueTicketNumber('sale');
    const returnTicket = db.ticketDB.generateUniqueTicketNumber('return');
    
    console.log(`✅ Ticket de vente généré: ${saleTicket}`);
    console.log(`✅ Ticket de retour généré: ${returnTicket}`);
    
    // Vérifier le format
    const saleFormat = /^V-\d{8}-\d{4}$/.test(saleTicket);
    const returnFormat = /^R-\d{8}-\d{4}$/.test(returnTicket);
    
    if (saleFormat && returnFormat) {
        console.log('✅ Formats des tickets corrects\n');
    } else {
        console.log('❌ Formats des tickets incorrects\n');
    }
} catch (error) {
    console.log('❌ Erreur lors de la génération des tickets:', error.message, '\n');
}

// Test 3: Test de recherche de ventes (peut être vide)
console.log('3. Test de recherche de ventes...');
try {
    const sales = returnsDB.searchSales({});
    console.log(`✅ Recherche de ventes réussie: ${sales.length} ventes trouvées`);
    
    if (sales.length > 0) {
        console.log(`   Première vente: ${sales[0].ticket_number || 'Pas de numéro'} - ${sales[0].client_name || 'Client de passage'}`);
    }
    console.log('');
} catch (error) {
    console.log('❌ Erreur lors de la recherche de ventes:', error.message, '\n');
}

// Test 4: Test de validation des données de retour
console.log('4. Test de validation des données de retour...');
try {
    // Test avec données invalides
    const invalidData = {
        originalSaleId: null,
        itemsToReturn: []
    };
    
    const validation1 = returnsDB.validate(invalidData);
    if (!validation1.isValid && validation1.errors.length > 0) {
        console.log('✅ Validation des données invalides fonctionne');
        console.log(`   Erreurs détectées: ${validation1.errors.length}`);
    } else {
        console.log('❌ Validation des données invalides échoue');
    }
    
    // Test avec données valides
    const validData = {
        originalSaleId: 1,
        userId: 1,
        itemsToReturn: [{
            product_id: 1,
            quantity_returned: 1,
            unit_price: 10.0,
            unit: 'piece'
        }],
        refundCash: 10.0,
        refundCredit: 0
    };
    
    const validation2 = returnsDB.validate(validData);
    if (validation2.isValid) {
        console.log('✅ Validation des données valides fonctionne');
    } else {
        console.log('❌ Validation des données valides échoue');
        console.log('   Erreurs:', validation2.errors);
    }
    console.log('');
} catch (error) {
    console.log('❌ Erreur lors de la validation:', error.message, '\n');
}

// Test 5: Test des statistiques de retours
console.log('5. Test des statistiques de retours...');
try {
    const stats = returnsDB.getStats();
    console.log('✅ Statistiques de retours récupérées:');
    console.log(`   Total retours: ${stats.total_returns}`);
    console.log(`   Total remboursé: ${stats.total_refunded} MAD`);
    console.log(`   Retours aujourd'hui: ${stats.today_returns}`);
    console.log('');
} catch (error) {
    console.log('❌ Erreur lors de la récupération des statistiques:', error.message, '\n');
}

// Test 6: Test de l'historique des retours
console.log('6. Test de l\'historique des retours...');
try {
    const history = returnsDB.getHistory({});
    console.log(`✅ Historique des retours récupéré: ${history.length} retours trouvés`);
    
    if (history.length > 0) {
        console.log(`   Premier retour: ${history[0].return_number} - ${history[0].total_refund_amount} MAD`);
    }
    console.log('');
} catch (error) {
    console.log('❌ Erreur lors de la récupération de l\'historique:', error.message, '\n');
}

console.log('🎉 Tests terminés !');
console.log('📝 Note: Certains tests peuvent montrer 0 résultats si la base de données est vide, c\'est normal.');
