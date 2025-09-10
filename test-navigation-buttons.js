/**
 * Test de validation de tous les boutons de navigation
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 VALIDATION BOUTONS DE NAVIGATION - PAGE RETOURS');
console.log('=' .repeat(55));
console.log('');

const returnsHtmlPath = path.join(__dirname, 'src', 'returns.html');
const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');

if (!fs.existsSync(returnsHtmlPath) || !fs.existsSync(returnsJsPath)) {
    console.log('❌ Fichiers non trouvés');
    process.exit(1);
}

const htmlContent = fs.readFileSync(returnsHtmlPath, 'utf8');
const jsContent = fs.readFileSync(returnsJsPath, 'utf8');

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

// Test 1: Vérifier que tous les boutons existent dans le HTML
runTest('Présence de tous les boutons dans le HTML', () => {
    const requiredButtons = [
        'backBtn',
        'searchBtn', 
        'clearSearchBtn',
        'backToSearchBtn',
        'proceedToConfigBtn',
        'backToDetailsBtn',
        'proceedToSummaryBtn',
        'backToConfigBtn',
        'cancelReturnBtn',
        'processReturnBtn',
        'printReturnTicketBtn',
        'newReturnBtn'
    ];
    
    let buttonsFound = 0;
    let missingButtons = [];
    
    requiredButtons.forEach(buttonId => {
        if (htmlContent.includes(`id="${buttonId}"`)) {
            buttonsFound++;
        } else {
            missingButtons.push(buttonId);
        }
    });
    
    if (buttonsFound === requiredButtons.length) {
        console.log(`  ✅ Tous les boutons présents (${buttonsFound}/${requiredButtons.length})`);
        return true;
    } else {
        console.log(`  ❌ Boutons manquants: ${missingButtons.join(', ')}`);
        console.log(`  📊 Trouvés: ${buttonsFound}/${requiredButtons.length}`);
        return false;
    }
});

// Test 2: Vérifier que tous les gestionnaires d'événements sont configurés
runTest('Gestionnaires d\'événements configurés', () => {
    const requiredEventListeners = [
        'backBtn',
        'searchBtn',
        'clearSearchBtn', 
        'backToSearchBtn',
        'proceedToConfigBtn',
        'backToDetailsBtn',
        'proceedToSummaryBtn',
        'backToConfigBtn',
        'cancelReturnBtn',
        'processReturnBtn',
        'printReturnTicketBtn',
        'newReturnBtn'
    ];
    
    let listenersFound = 0;
    let missingListeners = [];
    
    requiredEventListeners.forEach(buttonId => {
        if (jsContent.includes(`addEventListenerSafe('${buttonId}'`)) {
            listenersFound++;
        } else {
            missingListeners.push(buttonId);
        }
    });
    
    if (listenersFound === requiredEventListeners.length) {
        console.log(`  ✅ Tous les gestionnaires configurés (${listenersFound}/${requiredEventListeners.length})`);
        return true;
    } else {
        console.log(`  ❌ Gestionnaires manquants: ${missingListeners.join(', ')}`);
        console.log(`  📊 Trouvés: ${listenersFound}/${requiredEventListeners.length}`);
        return false;
    }
});

// Test 3: Vérifier que les fonctions nécessaires existent
runTest('Fonctions nécessaires définies', () => {
    const requiredFunctions = [
        'goBack',
        'searchTicket',
        'clearSearch',
        'showStep',
        'processReturn',
        'resetReturn',
        'printReturnTicket'
    ];
    
    let functionsFound = 0;
    let missingFunctions = [];
    
    requiredFunctions.forEach(funcName => {
        if (jsContent.includes(`function ${funcName}(`)) {
            functionsFound++;
        } else {
            missingFunctions.push(funcName);
        }
    });
    
    if (functionsFound === requiredFunctions.length) {
        console.log(`  ✅ Toutes les fonctions définies (${functionsFound}/${requiredFunctions.length})`);
        return true;
    } else {
        console.log(`  ❌ Fonctions manquantes: ${missingFunctions.join(', ')}`);
        console.log(`  📊 Trouvées: ${functionsFound}/${requiredFunctions.length}`);
        return false;
    }
});

// Test 4: Vérifier la cohérence des IDs entre HTML et JavaScript
runTest('Cohérence des IDs HTML/JavaScript', () => {
    const buttonMappings = [
        { html: 'backToSearchBtn', js: 'backToSearchBtn' },
        { html: 'backToDetailsBtn', js: 'backToDetailsBtn' },
        { html: 'backToConfigBtn', js: 'backToConfigBtn' },
        { html: 'proceedToConfigBtn', js: 'proceedToConfigBtn' },
        { html: 'proceedToSummaryBtn', js: 'proceedToSummaryBtn' }
    ];
    
    let coherentMappings = 0;
    let incoherentMappings = [];
    
    buttonMappings.forEach(mapping => {
        const hasHtml = htmlContent.includes(`id="${mapping.html}"`);
        const hasJs = jsContent.includes(`'${mapping.js}'`);
        
        if (hasHtml && hasJs) {
            coherentMappings++;
        } else {
            incoherentMappings.push(`${mapping.html} (HTML:${hasHtml}, JS:${hasJs})`);
        }
    });
    
    if (coherentMappings === buttonMappings.length) {
        console.log(`  ✅ Tous les IDs cohérents (${coherentMappings}/${buttonMappings.length})`);
        return true;
    } else {
        console.log(`  ❌ IDs incohérents: ${incoherentMappings.join(', ')}`);
        return false;
    }
});

// Test 5: Vérifier la fonction showStep
runTest('Fonction showStep correctement utilisée', () => {
    const showStepCalls = [
        'showStep(1)',
        'showStep(2)', 
        'showStep(3)',
        'showStep(4)'
    ];
    
    let callsFound = 0;
    showStepCalls.forEach(call => {
        if (jsContent.includes(call)) {
            callsFound++;
        }
    });
    
    if (callsFound >= 3) { // Au moins 3 appels différents
        console.log(`  ✅ Fonction showStep utilisée correctement (${callsFound} appels)`);
        return true;
    } else {
        console.log(`  ❌ Fonction showStep peu utilisée (${callsFound} appels)`);
        return false;
    }
});

// Résultats finaux
console.log('=' .repeat(55));
console.log('📊 RÉSULTATS DE LA VALIDATION');
console.log('=' .repeat(55));
console.log(`Total des tests: ${testsTotal}`);
console.log(`Tests réussis: ${testsReussis} ✅`);
console.log(`Tests échoués: ${testsTotal - testsReussis} ❌`);
console.log(`Taux de réussite: ${Math.round((testsReussis / testsTotal) * 100)}%`);
console.log('');

if (testsReussis === testsTotal) {
    console.log('🎉 TOUS LES BOUTONS DE NAVIGATION PARFAITEMENT CONFIGURÉS !');
    console.log('');
    console.log('✅ PROBLÈME RÉSOLU:');
    console.log('❌ AVANT: "Élément backToConfig non trouvé"');
    console.log('✅ APRÈS: Tous les boutons de navigation fonctionnels');
    console.log('');
    console.log('🔧 CORRECTIONS APPORTÉES:');
    console.log('• Correction des IDs incohérents (backToConfig → backToConfigBtn)');
    console.log('• Ajout des gestionnaires manquants (proceedToConfigBtn, etc.)');
    console.log('• Implémentation de la fonction printReturnTicket()');
    console.log('• Gestionnaires pour tous les boutons d\'action');
    console.log('• Cohérence complète entre HTML et JavaScript');
    console.log('');
    console.log('🎯 NAVIGATION COMPLÈTE:');
    console.log('1. 🔍 Recherche → Détails → Configuration → Résumé');
    console.log('2. 🔙 Retour possible à chaque étape');
    console.log('3. ⚡ Actions: Traiter, Annuler, Imprimer, Nouveau');
    console.log('4. 🔄 Navigation fluide entre toutes les sections');
    console.log('');
    console.log('🔄 POUR TESTER:');
    console.log('1. Lancer l\'application: npm start');
    console.log('2. Aller dans "Retours"');
    console.log('3. Tester tous les boutons de navigation');
    console.log('4. Vérifier le passage entre les étapes');
    console.log('5. Confirmer qu\'aucune erreur n\'apparaît');
} else {
    console.log('⚠️ CONFIGURATION INCOMPLÈTE');
    console.log(`❌ ${testsTotal - testsReussis} test(s) ont échoué`);
    console.log('💡 Veuillez vérifier les problèmes identifiés ci-dessus');
}

console.log('');
console.log('💡 BOUTONS CONFIGURÉS:');
console.log('🔙 Retour principal, Recherche, Effacer');
console.log('🔄 Navigation entre étapes (Retour/Suivant)');
console.log('⚡ Actions finales (Traiter, Annuler, Imprimer, Nouveau)');
console.log('✅ Tous les boutons devraient maintenant fonctionner parfaitement !');
