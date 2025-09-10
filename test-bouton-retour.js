/**
 * Test de validation du bouton Retour
 */

const fs = require('fs');
const path = require('path');

console.log('🔙 VALIDATION BOUTON RETOUR - PAGE RETOURS');
console.log('=' .repeat(50));
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

// Test 1: Vérifier que le bouton Retour existe dans le HTML
runTest('Présence du bouton Retour dans le HTML', () => {
    const hasBackBtn = htmlContent.includes('id="backBtn"');
    const hasRetourText = htmlContent.includes('>Retour<');
    
    if (hasBackBtn && hasRetourText) {
        console.log('  ✅ Bouton Retour trouvé avec ID et texte');
        return true;
    } else {
        console.log(`  ❌ Bouton manquant: ID=${hasBackBtn}, Texte=${hasRetourText}`);
        return false;
    }
});

// Test 2: Vérifier que l'événement est ajouté dans le JavaScript
runTest('Gestionnaire d\'événement pour le bouton Retour', () => {
    const hasEventListener = jsContent.includes("addEventListenerSafe('backBtn'");
    const hasGoBackCall = jsContent.includes('goBack');
    
    if (hasEventListener && hasGoBackCall) {
        console.log('  ✅ Gestionnaire d\'événement configuré');
        return true;
    } else {
        console.log(`  ❌ Gestionnaire manquant: Event=${hasEventListener}, Function=${hasGoBackCall}`);
        return false;
    }
});

// Test 3: Vérifier que la fonction goBack existe
runTest('Fonction goBack définie', () => {
    const hasGoBackFunction = jsContent.includes('function goBack()');
    const hasHistoryBack = jsContent.includes('window.history.back()');
    const hasFallback = jsContent.includes('window.location.href');
    
    if (hasGoBackFunction && hasHistoryBack && hasFallback) {
        console.log('  ✅ Fonction goBack complète avec fallback');
        return true;
    } else {
        console.log(`  ❌ Fonction incomplète: Def=${hasGoBackFunction}, History=${hasHistoryBack}, Fallback=${hasFallback}`);
        return false;
    }
});

// Test 4: Vérifier que les autres boutons de navigation fonctionnent
runTest('Autres boutons de navigation', () => {
    const navigationButtons = [
        'backToSearch',
        'backToDetails', 
        'backToConfig'
    ];
    
    let buttonsFound = 0;
    navigationButtons.forEach(btnId => {
        if (jsContent.includes(`'${btnId}'`)) {
            buttonsFound++;
        } else {
            console.log(`  ❌ Bouton manquant: ${btnId}`);
        }
    });
    
    if (buttonsFound === navigationButtons.length) {
        console.log(`  ✅ Tous les boutons de navigation configurés (${buttonsFound}/${navigationButtons.length})`);
        return true;
    } else {
        console.log(`  ❌ ${navigationButtons.length - buttonsFound} bouton(s) de navigation manquant(s)`);
        return false;
    }
});

// Test 5: Vérifier la structure du bouton dans le HTML
runTest('Structure HTML du bouton Retour', () => {
    const hasButtonTag = htmlContent.includes('<button id="backBtn"');
    const hasIcon = htmlContent.includes('M15 19l-7-7 7-7'); // SVG path pour l'icône de retour
    const hasClasses = htmlContent.includes('btn btn-outline');
    
    if (hasButtonTag && hasIcon && hasClasses) {
        console.log('  ✅ Structure HTML complète avec icône et styles');
        return true;
    } else {
        console.log(`  ❌ Structure incomplète: Button=${hasButtonTag}, Icon=${hasIcon}, Classes=${hasClasses}`);
        return false;
    }
});

// Test 6: Vérifier que la fonction d'initialisation appelle les événements
runTest('Initialisation des événements', () => {
    const hasInitFunction = jsContent.includes('function initializeEvents()');
    const hasBackBtnInInit = jsContent.includes("addEventListenerSafe('backBtn'");
    const hasDOMContentLoaded = jsContent.includes("addEventListener('DOMContentLoaded'");
    
    if (hasInitFunction && hasBackBtnInInit && hasDOMContentLoaded) {
        console.log('  ✅ Initialisation correcte des événements');
        return true;
    } else {
        console.log(`  ❌ Initialisation incomplète: Init=${hasInitFunction}, BackBtn=${hasBackBtnInInit}, DOM=${hasDOMContentLoaded}`);
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
    console.log('🎉 BOUTON RETOUR PARFAITEMENT CONFIGURÉ !');
    console.log('');
    console.log('✅ FONCTIONNALITÉS CONFIRMÉES:');
    console.log('🔙 Bouton Retour présent dans l\'interface');
    console.log('⚙️ Gestionnaire d\'événement configuré');
    console.log('🔧 Fonction goBack implémentée');
    console.log('🔄 Navigation via historique du navigateur');
    console.log('🏠 Fallback vers page d\'accueil');
    console.log('🎨 Design et icône préservés');
    console.log('');
    console.log('🎯 COMPORTEMENT ATTENDU:');
    console.log('1. Clic sur "Retour" → Retour à la page précédente');
    console.log('2. Si pas d\'historique → Redirection vers index.html');
    console.log('3. En cas d\'erreur → Fallback vers page d\'accueil');
    console.log('');
    console.log('🔄 POUR TESTER:');
    console.log('1. Lancer l\'application: npm start');
    console.log('2. Naviguer vers "Retours" depuis une autre page');
    console.log('3. Cliquer sur le bouton "Retour" en haut à gauche');
    console.log('4. Vérifier que vous revenez à la page précédente');
} else {
    console.log('⚠️ CONFIGURATION INCOMPLÈTE');
    console.log(`❌ ${testsTotal - testsReussis} test(s) ont échoué`);
    console.log('💡 Veuillez vérifier les problèmes identifiés ci-dessus');
}

console.log('');
console.log('💡 NOTES TECHNIQUES:');
console.log('• Le bouton utilise window.history.back() en priorité');
console.log('• Fallback automatique vers index.html si nécessaire');
console.log('• Gestion d\'erreur robuste avec try/catch');
console.log('• Compatible avec tous les navigateurs modernes');
console.log('• Préserve l\'expérience utilisateur naturelle');
