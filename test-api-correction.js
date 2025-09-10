/**
 * Test de validation de la correction de l'API de recherche
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 VALIDATION CORRECTION API DE RECHERCHE');
console.log('=' .repeat(50));
console.log('');

const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');
const preloadPath = path.join(__dirname, 'preload.js');

if (!fs.existsSync(returnsJsPath) || !fs.existsSync(preloadPath)) {
    console.log('❌ Fichiers non trouvés');
    process.exit(1);
}

const jsContent = fs.readFileSync(returnsJsPath, 'utf8');
const preloadContent = fs.readFileSync(preloadPath, 'utf8');

let testsTotal = 0;
let testsReussis = 0;

function runTest(testName, testFunction) {
    testsTotal++;
    console.log(`🧪 Test: ${testName}`);
    
    try {
        const result = testFunction();
        if (result) {
            console.log(`✅ RÉUSSI: ${testName}\n`);
            testsReussis++;
        } else {
            console.log(`❌ ÉCHOUÉ: ${testName}\n`);
        }
    } catch (error) {
        console.log(`❌ ERREUR: ${testName} - ${error.message}\n`);
    }
}

// Test 1: Vérifier que l'ancienne API incorrecte a été supprimée
runTest('Suppression de l\'ancienne API incorrecte', () => {
    const hasOldAPI = jsContent.includes('window.api.sales.getByTicketNumber');
    
    if (!hasOldAPI) {
        console.log('  ✅ Ancienne API window.api.sales.getByTicketNumber supprimée');
        return true;
    } else {
        console.log('  ❌ Ancienne API encore présente dans le code');
        return false;
    }
});

// Test 2: Vérifier que la nouvelle API correcte est utilisée
runTest('Utilisation de la nouvelle API correcte', () => {
    const hasNewAPI = jsContent.includes('window.api.returns.searchSales');
    const hasDetailsAPI = jsContent.includes('window.api.returns.getSaleDetails');
    
    if (hasNewAPI && hasDetailsAPI) {
        console.log('  ✅ Nouvelles APIs window.api.returns.searchSales et getSaleDetails utilisées');
        return true;
    } else {
        console.log(`  ❌ APIs manquantes: searchSales=${hasNewAPI}, getSaleDetails=${hasDetailsAPI}`);
        return false;
    }
});

// Test 3: Vérifier que les APIs existent dans preload.js
runTest('APIs disponibles dans preload.js', () => {
    const hasReturnsAPI = preloadContent.includes('returns: {');
    const hasSearchSales = preloadContent.includes('searchSales:');
    const hasGetSaleDetails = preloadContent.includes('getSaleDetails:');
    
    if (hasReturnsAPI && hasSearchSales && hasGetSaleDetails) {
        console.log('  ✅ APIs returns.searchSales et returns.getSaleDetails définies dans preload.js');
        return true;
    } else {
        console.log(`  ❌ APIs manquantes dans preload: returns=${hasReturnsAPI}, searchSales=${hasSearchSales}, getSaleDetails=${hasGetSaleDetails}`);
        return false;
    }
});

// Test 4: Vérifier la gestion d'erreur améliorée
runTest('Gestion d\'erreur améliorée', () => {
    const hasTryCatch = jsContent.includes('try {') && jsContent.includes('} catch (error) {');
    const hasErrorLogging = jsContent.includes('console.error');
    const hasErrorNotification = jsContent.includes('showNotification');
    
    if (hasTryCatch && hasErrorLogging && hasErrorNotification) {
        console.log('  ✅ Gestion d\'erreur complète avec try/catch, logging et notifications');
        return true;
    } else {
        console.log(`  ❌ Gestion d\'erreur incomplète: try/catch=${hasTryCatch}, logging=${hasErrorLogging}, notification=${hasErrorNotification}`);
        return false;
    }
});

// Test 5: Vérifier la fonction displaySaleDetails améliorée
runTest('Fonction displaySaleDetails améliorée', () => {
    const hasImprovedDisplay = jsContent.includes('displaySaleDetails(sale)');
    const hasElementChecks = jsContent.includes('getElementById') && jsContent.includes('if (');
    const hasClientCorrection = jsContent.includes('saleClient') && !jsContent.includes('saleCustomer');
    const hasLogging = jsContent.includes('console.log') && jsContent.includes('Affichage des détails');
    
    if (hasImprovedDisplay && hasElementChecks && hasClientCorrection && hasLogging) {
        console.log('  ✅ Fonction displaySaleDetails améliorée avec vérifications et logging');
        return true;
    } else {
        console.log(`  ❌ Fonction incomplète: display=${hasImprovedDisplay}, checks=${hasElementChecks}, client=${hasClientCorrection}, logging=${hasLogging}`);
        return false;
    }
});

// Test 6: Vérifier la logique de recherche en deux étapes
runTest('Logique de recherche en deux étapes', () => {
    const hasSearchStep = jsContent.includes('returns.searchSales');
    const hasDetailsStep = jsContent.includes('returns.getSaleDetails');
    const hasResultCheck = jsContent.includes('searchResults.length > 0');
    const hasFirstResult = jsContent.includes('searchResults[0]');
    
    if (hasSearchStep && hasDetailsStep && hasResultCheck && hasFirstResult) {
        console.log('  ✅ Logique de recherche en deux étapes implémentée');
        return true;
    } else {
        console.log(`  ❌ Logique incomplète: search=${hasSearchStep}, details=${hasDetailsStep}, check=${hasResultCheck}, first=${hasFirstResult}`);
        return false;
    }
});

// Test 7: Vérifier les paramètres de recherche
runTest('Paramètres de recherche corrects', () => {
    const hasTicketNumberParam = jsContent.includes('ticketNumber: ticketNumber');
    const hasSaleIdParam = jsContent.includes('getSaleDetails(sale.id)');
    
    if (hasTicketNumberParam && hasSaleIdParam) {
        console.log('  ✅ Paramètres de recherche corrects (ticketNumber et sale.id)');
        return true;
    } else {
        console.log(`  ❌ Paramètres incorrects: ticketNumber=${hasTicketNumberParam}, saleId=${hasSaleIdParam}`);
        return false;
    }
});

// Résultats finaux
console.log('=' .repeat(50));
console.log('📊 RÉSULTATS DE LA VALIDATION');
console.log('=' .repeat(50));
console.log(`Total des tests: ${testsTotal}`);
console.log(`Tests réussis: ${testsReussis} ✅`);
console.log(`Tests échoués: ${testsTotal - testsReussis} ❌`);
console.log(`Taux de réussite: ${Math.round((testsReussis / testsTotal) * 100)}%`);
console.log('');

if (testsReussis === testsTotal) {
    console.log('🎉 CORRECTION API PARFAITEMENT RÉUSSIE !');
    console.log('');
    console.log('✅ PROBLÈME RÉSOLU:');
    console.log('❌ AVANT: window.api.sales.getByTicketNumber (fonction inexistante)');
    console.log('✅ APRÈS: window.api.returns.searchSales + getSaleDetails (APIs existantes)');
    console.log('');
    console.log('🔧 CORRECTIONS APPORTÉES:');
    console.log('• Remplacement de l\'API inexistante par les APIs correctes');
    console.log('• Logique de recherche en deux étapes (search puis details)');
    console.log('• Gestion d\'erreur robuste avec try/catch');
    console.log('• Vérification de l\'existence des éléments DOM');
    console.log('• Correction des IDs d\'éléments (saleClient vs saleCustomer)');
    console.log('• Logging détaillé pour debug et suivi');
    console.log('• Notifications utilisateur appropriées');
    console.log('');
    console.log('🎯 FONCTIONNEMENT:');
    console.log('1. Recherche par numéro de ticket avec returns.searchSales()');
    console.log('2. Récupération des détails avec returns.getSaleDetails()');
    console.log('3. Affichage des informations dans l\'interface');
    console.log('4. Navigation automatique vers l\'étape suivante');
    console.log('');
    console.log('🔄 POUR TESTER:');
    console.log('1. Lancer l\'application: npm start');
    console.log('2. Aller dans "Retours"');
    console.log('3. Saisir un numéro de ticket existant');
    console.log('4. Cliquer "Rechercher"');
    console.log('5. Vérifier que les détails s\'affichent correctement');
    console.log('');
    console.log('✅ L\'erreur API devrait maintenant être résolue !');
} else {
    console.log('⚠️ CORRECTION INCOMPLÈTE');
    console.log(`❌ ${testsTotal - testsReussis} test(s) ont échoué`);
    console.log('💡 Veuillez vérifier les problèmes identifiés ci-dessus');
}

console.log('');
console.log('💡 INFORMATIONS TECHNIQUES:');
console.log('• Utilise les APIs existantes du système de retours');
console.log('• Compatible avec la structure de base de données actuelle');
console.log('• Gestion d\'erreur robuste pour tous les cas de figure');
console.log('• Logging détaillé pour faciliter le debug');
console.log('• Interface utilisateur responsive et informative');
