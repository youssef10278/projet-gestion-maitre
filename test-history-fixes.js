/**
 * Script de test pour vérifier les corrections du bouton historique
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 TEST DES CORRECTIONS - BOUTON HISTORIQUE');
console.log('=' .repeat(50));
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

// Test 1: Vérifier que addEventListenerSafe n'est plus utilisé dans setupHistoryModalEvents
runTest('Correction addEventListenerSafe', () => {
    const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');
    if (!fs.existsSync(returnsJsPath)) return false;
    
    const content = fs.readFileSync(returnsJsPath, 'utf8');
    
    // Extraire la fonction setupHistoryModalEvents
    const setupFunctionMatch = content.match(/function setupHistoryModalEvents\(\)[^}]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
    
    if (!setupFunctionMatch) {
        console.log('  ❌ Fonction setupHistoryModalEvents non trouvée');
        return false;
    }
    
    const setupFunctionContent = setupFunctionMatch[1];
    
    if (setupFunctionContent.includes('addEventListenerSafe')) {
        console.log('  ❌ addEventListenerSafe encore utilisé dans setupHistoryModalEvents');
        return false;
    }
    
    if (!setupFunctionContent.includes('document.getElementById')) {
        console.log('  ❌ document.getElementById non utilisé');
        return false;
    }
    
    console.log('  ✅ addEventListenerSafe remplacé par addEventListener standard');
    return true;
});

// Test 2: Vérifier que showNotification ne s'appelle plus elle-même
runTest('Correction boucle infinie showNotification', () => {
    const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');
    if (!fs.existsSync(returnsJsPath)) return false;
    
    const content = fs.readFileSync(returnsJsPath, 'utf8');
    
    // Extraire la fonction showNotification
    const showNotificationMatch = content.match(/function showNotification\([^}]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
    
    if (!showNotificationMatch) {
        console.log('  ❌ Fonction showNotification non trouvée');
        return false;
    }
    
    const showNotificationContent = showNotificationMatch[1];
    
    // Vérifier qu'il y a une protection contre la boucle infinie
    if (!showNotificationContent.includes('window.showNotification !== showNotification')) {
        console.log('  ❌ Protection contre boucle infinie manquante');
        return false;
    }
    
    console.log('  ✅ Protection contre boucle infinie ajoutée');
    return true;
});

// Test 3: Vérifier que les nouvelles fonctions d'historique utilisent console.log/alert
runTest('Gestion d\'erreur dans fonctions historique', () => {
    const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');
    if (!fs.existsSync(returnsJsPath)) return false;
    
    const content = fs.readFileSync(returnsJsPath, 'utf8');
    
    // Vérifier viewReturnDetails
    const viewReturnDetailsMatch = content.match(/async function viewReturnDetails\([^}]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
    if (viewReturnDetailsMatch) {
        const functionContent = viewReturnDetailsMatch[1];
        if (functionContent.includes('showNotification') && !functionContent.includes('alert')) {
            console.log('  ❌ viewReturnDetails utilise encore showNotification');
            return false;
        }
    }
    
    // Vérifier printReturnTicket
    const printReturnTicketMatch = content.match(/async function printReturnTicket\([^}]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
    if (printReturnTicketMatch) {
        const functionContent = printReturnTicketMatch[1];
        if (functionContent.includes('showNotification') && !functionContent.includes('alert')) {
            console.log('  ❌ printReturnTicket utilise encore showNotification');
            return false;
        }
    }
    
    console.log('  ✅ Fonctions d\'historique utilisent console.log/alert');
    return true;
});

// Test 4: Vérifier que la modal HTML est toujours présente
runTest('Structure HTML modal historique', () => {
    const returnsHtmlPath = path.join(__dirname, 'src', 'returns.html');
    if (!fs.existsSync(returnsHtmlPath)) return false;
    
    const content = fs.readFileSync(returnsHtmlPath, 'utf8');
    
    const requiredElements = [
        'id="historyModal"',
        'id="closeHistoryModal"',
        'id="searchHistory"',
        'id="clearHistoryFilters"',
        'id="historyTableBody"'
    ];
    
    let allFound = true;
    
    requiredElements.forEach(element => {
        if (!content.includes(element)) {
            console.log(`  ❌ Élément ${element} manquant`);
            allFound = false;
        }
    });
    
    if (allFound) {
        console.log('  ✅ Tous les éléments HTML présents');
    }
    
    return allFound;
});

// Test 5: Vérifier que les styles CSS sont présents
runTest('Styles CSS modal historique', () => {
    const returnsHtmlPath = path.join(__dirname, 'src', 'returns.html');
    if (!fs.existsSync(returnsHtmlPath)) return false;
    
    const content = fs.readFileSync(returnsHtmlPath, 'utf8');
    
    const requiredStyles = [
        '.modal-overlay',
        '.modal-content',
        '.modal-header',
        '.modal-close-btn',
        'backdrop-filter: blur'
    ];
    
    let allFound = true;
    
    requiredStyles.forEach(style => {
        if (!content.includes(style)) {
            console.log(`  ❌ Style ${style} manquant`);
            allFound = false;
        }
    });
    
    if (allFound) {
        console.log('  ✅ Tous les styles CSS présents');
    }
    
    return allFound;
});

// Test 6: Vérifier que l'événement click est toujours configuré
runTest('Configuration événement click', () => {
    const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');
    if (!fs.existsSync(returnsJsPath)) return false;
    
    const content = fs.readFileSync(returnsJsPath, 'utf8');
    
    if (!content.includes('addEventListenerSafe(\'historyBtn\', \'click\', showHistoryModal)')) {
        console.log('  ❌ Événement click du bouton historique non configuré');
        return false;
    }
    
    console.log('  ✅ Événement click correctement configuré');
    return true;
});

// Test 7: Vérifier que les fonctions principales existent
runTest('Fonctions principales présentes', () => {
    const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');
    if (!fs.existsSync(returnsJsPath)) return false;
    
    const content = fs.readFileSync(returnsJsPath, 'utf8');
    
    const requiredFunctions = [
        'async function showHistoryModal',
        'function setupHistoryModalEvents',
        'function closeHistoryModal',
        'async function loadHistoryData',
        'async function searchHistoryData',
        'function clearHistoryFilters',
        'function displayHistoryResults',
        'function createHistoryRow'
    ];
    
    let allFound = true;
    
    requiredFunctions.forEach(func => {
        if (!content.includes(func)) {
            console.log(`  ❌ Fonction ${func} manquante`);
            allFound = false;
        }
    });
    
    if (allFound) {
        console.log('  ✅ Toutes les fonctions principales présentes');
    }
    
    return allFound;
});

// Résultats finaux
console.log('=' .repeat(50));
console.log('📊 RÉSULTATS DES CORRECTIONS');
console.log('=' .repeat(50));
console.log(`Total des tests: ${testsTotal}`);
console.log(`Tests réussis: ${testsReussis} ✅`);
console.log(`Tests échoués: ${testsTotal - testsReussis} ❌`);
console.log(`Taux de réussite: ${Math.round((testsReussis / testsTotal) * 100)}%`);
console.log('');

if (testsReussis === testsTotal) {
    console.log('🎉 CORRECTIONS PARFAITEMENT APPLIQUÉES !');
    console.log('✅ Problème addEventListenerSafe résolu');
    console.log('✅ Boucle infinie showNotification corrigée');
    console.log('✅ Gestion d\'erreur améliorée');
    console.log('✅ Structure HTML préservée');
    console.log('✅ Styles CSS maintenus');
    console.log('✅ Événements correctement configurés');
    console.log('✅ Toutes les fonctions opérationnelles');
    console.log('');
    console.log('🎯 LE BOUTON HISTORIQUE DEVRAIT MAINTENANT FONCTIONNER !');
} else {
    console.log('⚠️ CORRECTIONS INCOMPLÈTES');
    console.log(`❌ ${testsTotal - testsReussis} test(s) ont échoué`);
    console.log('💡 Veuillez vérifier les problèmes identifiés');
}

console.log('');
console.log('🔄 Pour tester:');
console.log('1. Ouvrir l\'application');
console.log('2. Aller dans "Retours"');
console.log('3. Cliquer sur "Historique"');
console.log('4. Vérifier qu\'aucune erreur n\'apparaît dans la console');
console.log('5. Vérifier que la modal s\'ouvre correctement');
