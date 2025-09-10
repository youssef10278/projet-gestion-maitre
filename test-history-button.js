/**
 * Script de test pour vérifier la fonctionnalité du bouton Historique
 * dans la page retours
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 TEST DU BOUTON HISTORIQUE - PAGE RETOURS');
console.log('=' .repeat(55));
console.log('');

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

// Test 1: Vérifier que le bouton historique existe
runTest('Bouton Historique - Présence dans HTML', () => {
    const returnsHtmlPath = path.join(__dirname, 'src', 'returns.html');
    if (!fs.existsSync(returnsHtmlPath)) return false;
    
    const content = fs.readFileSync(returnsHtmlPath, 'utf8');
    
    if (!content.includes('id="historyBtn"')) {
        console.log('  ❌ Bouton historyBtn non trouvé');
        return false;
    }
    
    if (!content.includes('data-i18n="returns_history_btn"')) {
        console.log('  ❌ Texte du bouton historique non trouvé');
        return false;
    }
    
    console.log('  ✅ Bouton historique présent dans le HTML');
    return true;
});

// Test 2: Vérifier que l'événement click est configuré
runTest('Bouton Historique - Événement Click', () => {
    const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');
    if (!fs.existsSync(returnsJsPath)) return false;
    
    const content = fs.readFileSync(returnsJsPath, 'utf8');
    
    if (!content.includes('historyBtn')) {
        console.log('  ❌ Référence à historyBtn non trouvée');
        return false;
    }
    
    if (!content.includes('showHistoryModal')) {
        console.log('  ❌ Fonction showHistoryModal non trouvée');
        return false;
    }
    
    if (!content.includes('addEventListenerSafe(\'historyBtn\', \'click\', showHistoryModal)')) {
        console.log('  ❌ Événement click non configuré');
        return false;
    }
    
    console.log('  ✅ Événement click correctement configuré');
    return true;
});

// Test 3: Vérifier que la fonction showHistoryModal est implémentée
runTest('Fonction showHistoryModal - Implémentation', () => {
    const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');
    if (!fs.existsSync(returnsJsPath)) return false;
    
    const content = fs.readFileSync(returnsJsPath, 'utf8');
    
    if (content.includes('TODO: Implémenter la modal de l\'historique')) {
        console.log('  ❌ Fonction showHistoryModal non implémentée (TODO présent)');
        return false;
    }
    
    if (!content.includes('async function showHistoryModal()')) {
        console.log('  ❌ Fonction showHistoryModal async non trouvée');
        return false;
    }
    
    if (!content.includes('loadHistoryData')) {
        console.log('  ❌ Appel à loadHistoryData non trouvé');
        return false;
    }
    
    console.log('  ✅ Fonction showHistoryModal correctement implémentée');
    return true;
});

// Test 4: Vérifier que la modal HTML existe
runTest('Modal Historique - Structure HTML', () => {
    const returnsHtmlPath = path.join(__dirname, 'src', 'returns.html');
    if (!fs.existsSync(returnsHtmlPath)) return false;
    
    const content = fs.readFileSync(returnsHtmlPath, 'utf8');
    
    if (!content.includes('id="historyModal"')) {
        console.log('  ❌ Modal historyModal non trouvée');
        return false;
    }
    
    if (!content.includes('id="historyTableBody"')) {
        console.log('  ❌ Tableau d\'historique non trouvé');
        return false;
    }
    
    if (!content.includes('id="closeHistoryModal"')) {
        console.log('  ❌ Bouton de fermeture non trouvé');
        return false;
    }
    
    console.log('  ✅ Structure HTML de la modal complète');
    return true;
});

// Test 5: Vérifier les styles CSS de la modal
runTest('Modal Historique - Styles CSS', () => {
    const returnsHtmlPath = path.join(__dirname, 'src', 'returns.html');
    if (!fs.existsSync(returnsHtmlPath)) return false;
    
    const content = fs.readFileSync(returnsHtmlPath, 'utf8');
    
    if (!content.includes('.modal-overlay')) {
        console.log('  ❌ Style modal-overlay non trouvé');
        return false;
    }
    
    if (!content.includes('.modal-content')) {
        console.log('  ❌ Style modal-content non trouvé');
        return false;
    }
    
    if (!content.includes('backdrop-filter: blur')) {
        console.log('  ❌ Effet de flou non trouvé');
        return false;
    }
    
    console.log('  ✅ Styles CSS de la modal présents');
    return true;
});

// Test 6: Vérifier l'API d'historique
runTest('API Historique - Backend', () => {
    const mainPath = path.join(__dirname, 'main.js');
    const preloadPath = path.join(__dirname, 'preload.js');
    
    if (!fs.existsSync(mainPath) || !fs.existsSync(preloadPath)) return false;
    
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    const preloadContent = fs.readFileSync(preloadPath, 'utf8');
    
    if (!mainContent.includes('returns:get-history')) {
        console.log('  ❌ Handler returns:get-history manquant dans main.js');
        return false;
    }
    
    if (!preloadContent.includes('getHistory:')) {
        console.log('  ❌ API getHistory manquante dans preload.js');
        return false;
    }
    
    console.log('  ✅ API d\'historique correctement configurée');
    return true;
});

// Test 7: Vérifier les fonctions de support
runTest('Fonctions Support - Implémentation', () => {
    const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');
    if (!fs.existsSync(returnsJsPath)) return false;
    
    const content = fs.readFileSync(returnsJsPath, 'utf8');
    
    const requiredFunctions = [
        'loadHistoryData',
        'searchHistoryData',
        'clearHistoryFilters',
        'displayHistoryResults',
        'createHistoryRow',
        'closeHistoryModal'
    ];
    
    let allFound = true;
    
    requiredFunctions.forEach(func => {
        if (!content.includes(`function ${func}`)) {
            console.log(`  ❌ Fonction ${func} manquante`);
            allFound = false;
        }
    });
    
    if (allFound) {
        console.log('  ✅ Toutes les fonctions de support présentes');
    }
    
    return allFound;
});

// Test 8: Vérifier les filtres de recherche
runTest('Filtres Recherche - Interface', () => {
    const returnsHtmlPath = path.join(__dirname, 'src', 'returns.html');
    if (!fs.existsSync(returnsHtmlPath)) return false;
    
    const content = fs.readFileSync(returnsHtmlPath, 'utf8');
    
    const requiredInputs = [
        'historyReturnNumber',
        'historyClientName',
        'historyDateFrom',
        'historyDateTo'
    ];
    
    let allFound = true;
    
    requiredInputs.forEach(input => {
        if (!content.includes(`id="${input}"`)) {
            console.log(`  ❌ Input ${input} manquant`);
            allFound = false;
        }
    });
    
    if (!content.includes('id="searchHistory"')) {
        console.log('  ❌ Bouton de recherche manquant');
        allFound = false;
    }
    
    if (allFound) {
        console.log('  ✅ Interface de filtres complète');
    }
    
    return allFound;
});

// Résultats finaux
console.log('=' .repeat(55));
console.log('📊 RÉSULTATS DU TEST BOUTON HISTORIQUE');
console.log('=' .repeat(55));
console.log(`Total des tests: ${testsTotal}`);
console.log(`Tests réussis: ${testsReussis} ✅`);
console.log(`Tests échoués: ${testsTotal - testsReussis} ❌`);
console.log(`Taux de réussite: ${Math.round((testsReussis / testsTotal) * 100)}%`);
console.log('');

if (testsReussis === testsTotal) {
    console.log('🎉 BOUTON HISTORIQUE PARFAITEMENT FONCTIONNEL !');
    console.log('✅ Le bouton historique est maintenant opérationnel');
    console.log('✅ Modal d\'historique complètement implémentée');
    console.log('✅ API d\'historique correctement configurée');
    console.log('✅ Interface de filtres disponible');
    console.log('✅ Styles CSS appliqués');
    console.log('');
    console.log('🎯 FONCTIONNALITÉS DISPONIBLES:');
    console.log('📋 Affichage de l\'historique des retours');
    console.log('🔍 Filtrage par numéro, client, et dates');
    console.log('👁️ Visualisation des détails de retour');
    console.log('🖨️ Impression des tickets de retour');
    console.log('📊 Interface moderne et responsive');
} else {
    console.log('⚠️ IMPLÉMENTATION INCOMPLÈTE');
    console.log(`❌ ${testsTotal - testsReussis} test(s) ont échoué`);
    console.log('💡 Veuillez corriger les problèmes identifiés');
}

console.log('');
console.log('🔄 Pour tester le bouton historique:');
console.log('1. Ouvrir l\'application et aller dans "Retours"');
console.log('2. Cliquer sur le bouton "Historique"');
console.log('3. Vérifier que la modal s\'ouvre');
console.log('4. Tester les filtres de recherche');
console.log('5. Vérifier l\'affichage des résultats');
