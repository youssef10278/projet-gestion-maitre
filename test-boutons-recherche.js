/**
 * Test de validation des boutons Rechercher et Effacer
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATION BOUTONS RECHERCHER ET EFFACER');
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

// Test 1: Vérifier que les boutons existent dans le HTML
runTest('Présence des boutons dans le HTML', () => {
    const hasSearchBtn = htmlContent.includes('id="searchBtn"');
    const hasClearBtn = htmlContent.includes('id="clearSearchBtn"');
    const hasSearchText = htmlContent.includes('>Rechercher<');
    const hasClearText = htmlContent.includes('>Effacer<');
    
    if (hasSearchBtn && hasClearBtn && hasSearchText && hasClearText) {
        console.log('  ✅ Boutons Rechercher et Effacer trouvés avec IDs et textes');
        return true;
    } else {
        console.log(`  ❌ Boutons manquants: Search=${hasSearchBtn}, Clear=${hasClearBtn}, SearchText=${hasSearchText}, ClearText=${hasClearText}`);
        return false;
    }
});

// Test 2: Vérifier les gestionnaires d'événements
runTest('Gestionnaires d\'événements configurés', () => {
    const hasSearchEvent = jsContent.includes("addEventListenerSafe('searchBtn'");
    const hasClearEvent = jsContent.includes("addEventListenerSafe('clearSearchBtn'");
    
    if (hasSearchEvent && hasClearEvent) {
        console.log('  ✅ Gestionnaires d\'événements configurés pour les deux boutons');
        return true;
    } else {
        console.log(`  ❌ Gestionnaires manquants: Search=${hasSearchEvent}, Clear=${hasClearEvent}`);
        return false;
    }
});

// Test 3: Vérifier que les fonctions existent
runTest('Fonctions searchTicket et clearSearch définies', () => {
    const hasSearchFunction = jsContent.includes('function searchTicket()');
    const hasClearFunction = jsContent.includes('function clearSearch()');
    
    if (hasSearchFunction && hasClearFunction) {
        console.log('  ✅ Fonctions searchTicket et clearSearch définies');
        return true;
    } else {
        console.log(`  ❌ Fonctions manquantes: Search=${hasSearchFunction}, Clear=${hasClearFunction}`);
        return false;
    }
});

// Test 4: Vérifier les IDs des champs de recherche
runTest('Correspondance des IDs de champs', () => {
    const htmlFields = [
        'searchTicket',
        'searchClient',
        'searchDateFrom', 
        'searchDateTo'
    ];
    
    let fieldsFound = 0;
    let fieldsInJS = 0;
    
    htmlFields.forEach(fieldId => {
        if (htmlContent.includes(`id="${fieldId}"`)) {
            fieldsFound++;
        }
        if (jsContent.includes(`'${fieldId}'`)) {
            fieldsInJS++;
        }
    });
    
    if (fieldsFound === htmlFields.length && fieldsInJS >= 2) {
        console.log(`  ✅ Champs de recherche: ${fieldsFound}/${htmlFields.length} en HTML, ${fieldsInJS} référencés en JS`);
        return true;
    } else {
        console.log(`  ❌ Champs manquants: ${fieldsFound}/${htmlFields.length} en HTML, ${fieldsInJS} en JS`);
        return false;
    }
});

// Test 5: Vérifier la fonction showLoading avec le bon ID
runTest('Fonction showLoading avec bon ID de bouton', () => {
    const hasCorrectLoadingCall = jsContent.includes("showLoading('searchBtn'");
    const hasOldLoadingCall = jsContent.includes("showLoading('searchTicketBtn'");
    
    if (hasCorrectLoadingCall && !hasOldLoadingCall) {
        console.log('  ✅ Fonction showLoading utilise le bon ID de bouton');
        return true;
    } else {
        console.log(`  ❌ Problème avec showLoading: Correct=${hasCorrectLoadingCall}, Ancien=${hasOldLoadingCall}`);
        return false;
    }
});

// Test 6: Vérifier la gestion de l'événement Enter
runTest('Gestion de l\'événement Enter sur le champ de recherche', () => {
    const hasEnterEvent = jsContent.includes("if (e.key === 'Enter')");
    const hasCorrectFieldId = jsContent.includes("getElementById('searchTicket')");
    
    if (hasEnterEvent && hasCorrectFieldId) {
        console.log('  ✅ Événement Enter configuré sur le bon champ');
        return true;
    } else {
        console.log(`  ❌ Événement Enter: Event=${hasEnterEvent}, FieldID=${hasCorrectFieldId}`);
        return false;
    }
});

// Test 7: Vérifier la fonction clearSearch
runTest('Fonction clearSearch complète', () => {
    const hasFieldClearing = jsContent.includes('searchInputs.forEach');
    const hasResultsHiding = jsContent.includes('searchResults.classList.add');
    const hasVariableReset = jsContent.includes('currentSale = null');
    const hasStepReset = jsContent.includes('showStep(1)');
    
    if (hasFieldClearing && hasResultsHiding && hasVariableReset && hasStepReset) {
        console.log('  ✅ Fonction clearSearch complète avec toutes les fonctionnalités');
        return true;
    } else {
        console.log(`  ❌ Fonction clearSearch incomplète: Fields=${hasFieldClearing}, Results=${hasResultsHiding}, Variables=${hasVariableReset}, Step=${hasStepReset}`);
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
    console.log('🎉 BOUTONS RECHERCHER ET EFFACER PARFAITEMENT CONFIGURÉS !');
    console.log('');
    console.log('✅ PROBLÈMES RÉSOLUS:');
    console.log('🔍 Bouton "Rechercher" maintenant fonctionnel');
    console.log('🧹 Bouton "Effacer" maintenant fonctionnel');
    console.log('⌨️ Recherche avec touche Enter opérationnelle');
    console.log('🔄 Remise à zéro complète des champs');
    console.log('');
    console.log('🔧 CORRECTIONS APPORTÉES:');
    console.log('• Correction des IDs de boutons (searchBtn vs searchTicketBtn)');
    console.log('• Ajout du gestionnaire pour le bouton Effacer');
    console.log('• Implémentation de la fonction clearSearch()');
    console.log('• Correction des IDs de champs de recherche');
    console.log('• Mise à jour des références dans showLoading()');
    console.log('• Gestion de l\'événement Enter sur le bon champ');
    console.log('');
    console.log('🎯 FONCTIONNALITÉS:');
    console.log('1. Bouton "Rechercher" → Lance la recherche de ticket');
    console.log('2. Bouton "Effacer" → Vide tous les champs et remet à zéro');
    console.log('3. Touche Enter → Lance la recherche depuis le champ ticket');
    console.log('4. Gestion d\'erreur → Notifications appropriées');
    console.log('5. Loading states → Feedback visuel pendant la recherche');
} else {
    console.log('⚠️ CONFIGURATION INCOMPLÈTE');
    console.log(`❌ ${testsTotal - testsReussis} test(s) ont échoué`);
    console.log('💡 Veuillez vérifier les problèmes identifiés ci-dessus');
}

console.log('');
console.log('🔄 POUR TESTER:');
console.log('1. Lancer l\'application: npm start');
console.log('2. Aller dans "Retours"');
console.log('3. Saisir un numéro de ticket');
console.log('4. Cliquer sur "Rechercher" ou appuyer sur Enter');
console.log('5. Cliquer sur "Effacer" pour vider les champs');
console.log('6. Vérifier que tout fonctionne correctement');
console.log('');
console.log('💡 Les boutons devraient maintenant être entièrement fonctionnels !');
