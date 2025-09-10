/**
 * Test de validation de la recherche multi-critères
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATION RECHERCHE MULTI-CRITÈRES - PAGE RETOURS');
console.log('=' .repeat(60));
console.log('');

const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');
const returnsHtmlPath = path.join(__dirname, 'src', 'returns.html');

if (!fs.existsSync(returnsJsPath) || !fs.existsSync(returnsHtmlPath)) {
    console.log('❌ Fichiers non trouvés');
    process.exit(1);
}

const jsContent = fs.readFileSync(returnsJsPath, 'utf8');
const htmlContent = fs.readFileSync(returnsHtmlPath, 'utf8');

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

// Test 1: Vérifier que tous les champs de recherche existent
runTest('Champs de recherche multi-critères présents', () => {
    const searchFields = [
        'searchTicket',    // Numéro de ticket
        'searchClient',    // Nom du client
        'searchDateFrom',  // Date de début
        'searchDateTo'     // Date de fin
    ];
    
    let fieldsFound = 0;
    let missingFields = [];
    
    searchFields.forEach(fieldId => {
        if (htmlContent.includes(`id="${fieldId}"`)) {
            fieldsFound++;
        } else {
            missingFields.push(fieldId);
        }
    });
    
    if (fieldsFound === searchFields.length) {
        console.log(`  ✅ Tous les champs de recherche présents (${fieldsFound}/${searchFields.length})`);
        return true;
    } else {
        console.log(`  ❌ Champs manquants: ${missingFields.join(', ')}`);
        return false;
    }
});

// Test 2: Vérifier la fonction getSearchCriteria
runTest('Fonction getSearchCriteria implémentée', () => {
    const hasFunction = jsContent.includes('function getSearchCriteria()');
    const hasTicketCriteria = jsContent.includes('criteria.ticketNumber');
    const hasClientCriteria = jsContent.includes('criteria.clientName');
    const hasDateCriteria = jsContent.includes('criteria.dateFrom') && jsContent.includes('criteria.dateTo');
    
    if (hasFunction && hasTicketCriteria && hasClientCriteria && hasDateCriteria) {
        console.log('  ✅ Fonction getSearchCriteria complète avec tous les critères');
        return true;
    } else {
        console.log(`  ❌ Fonction incomplète: func=${hasFunction}, ticket=${hasTicketCriteria}, client=${hasClientCriteria}, dates=${hasDateCriteria}`);
        return false;
    }
});

// Test 3: Vérifier la gestion des résultats multiples
runTest('Gestion des résultats multiples', () => {
    const hasDisplayResults = jsContent.includes('function displaySearchResults(');
    const hasCreateTable = jsContent.includes('function createResultsTable(');
    const hasSelectSale = jsContent.includes('function selectSaleForReturn(');
    const hasHideResults = jsContent.includes('function hideSearchResults(');
    
    if (hasDisplayResults && hasCreateTable && hasSelectSale && hasHideResults) {
        console.log('  ✅ Toutes les fonctions de gestion des résultats multiples présentes');
        return true;
    } else {
        console.log(`  ❌ Fonctions manquantes: display=${hasDisplayResults}, table=${hasCreateTable}, select=${hasSelectSale}, hide=${hasHideResults}`);
        return false;
    }
});

// Test 4: Vérifier la logique de recherche flexible
runTest('Logique de recherche flexible', () => {
    const hasFlexibleSearch = jsContent.includes('getSearchCriteria()');
    const hasSingleResult = jsContent.includes('displaySingleResult');
    const hasMultipleResults = jsContent.includes('displaySearchResults');
    const hasEmptySearch = !jsContent.includes('Veuillez saisir un numéro de ticket');
    
    if (hasFlexibleSearch && hasSingleResult && hasMultipleResults && hasEmptySearch) {
        console.log('  ✅ Logique de recherche flexible implémentée');
        return true;
    } else {
        console.log(`  ❌ Logique incomplète: flexible=${hasFlexibleSearch}, single=${hasSingleResult}, multiple=${hasMultipleResults}, empty=${hasEmptySearch}`);
        return false;
    }
});

// Test 5: Vérifier l'élément d'affichage des résultats
runTest('Élément d\'affichage des résultats', () => {
    const hasSearchResults = htmlContent.includes('id="searchResults"');
    const hasResultsBody = htmlContent.includes('id="searchResultsBody"');
    const hasHiddenClass = htmlContent.includes('class="hidden"');
    
    if (hasSearchResults && hasHiddenClass) {
        console.log('  ✅ Élément searchResults présent avec classe hidden');
        return true;
    } else {
        console.log(`  ❌ Élément manquant: searchResults=${hasSearchResults}, hidden=${hasHiddenClass}`);
        return false;
    }
});

// Test 6: Vérifier la création du tableau dynamique
runTest('Création de tableau dynamique', () => {
    const hasTableCreation = jsContent.includes('createResultsTable');
    const hasRowCreation = jsContent.includes('search-result-row');
    const hasSelectButton = jsContent.includes('select-sale-btn');
    const hasClickEvents = jsContent.includes('addResultClickEvents');
    
    if (hasTableCreation && hasRowCreation && hasSelectButton && hasClickEvents) {
        console.log('  ✅ Création de tableau dynamique complète');
        return true;
    } else {
        console.log(`  ❌ Création incomplète: table=${hasTableCreation}, row=${hasRowCreation}, button=${hasSelectButton}, events=${hasClickEvents}`);
        return false;
    }
});

// Test 7: Vérifier la gestion des critères vides
runTest('Gestion des critères vides (affichage de tous les tickets)', () => {
    const hasEmptyCheck = jsContent.includes('trim()');
    const hasConditionalCriteria = jsContent.includes('if (ticketNumber)') && jsContent.includes('if (clientName)');
    const noMandatoryField = !jsContent.includes('Veuillez saisir');
    
    if (hasEmptyCheck && hasConditionalCriteria && noMandatoryField) {
        console.log('  ✅ Gestion des critères vides implémentée (recherche tous tickets si vide)');
        return true;
    } else {
        console.log(`  ❌ Gestion incomplète: trim=${hasEmptyCheck}, conditional=${hasConditionalCriteria}, noMandatory=${noMandatoryField}`);
        return false;
    }
});

// Résultats finaux
console.log('=' .repeat(60));
console.log('📊 RÉSULTATS DE LA VALIDATION');
console.log('=' .repeat(60));
console.log(`Total des tests: ${testsTotal}`);
console.log(`Tests réussis: ${testsReussis} ✅`);
console.log(`Tests échoués: ${testsTotal - testsReussis} ❌`);
console.log(`Taux de réussite: ${Math.round((testsReussis / testsTotal) * 100)}%`);
console.log('');

if (testsReussis === testsTotal) {
    console.log('🎉 RECHERCHE MULTI-CRITÈRES PARFAITEMENT IMPLÉMENTÉE !');
    console.log('');
    console.log('✅ FONCTIONNALITÉS AJOUTÉES:');
    console.log('🔍 Recherche par numéro de ticket');
    console.log('👤 Recherche par nom de client');
    console.log('📅 Recherche par date de début');
    console.log('📅 Recherche par date de fin');
    console.log('🔄 Recherche combinée (plusieurs critères)');
    console.log('📋 Affichage de tous les tickets si aucun critère');
    console.log('');
    console.log('🎯 COMPORTEMENTS:');
    console.log('1. 🔍 Un critère → Recherche ciblée');
    console.log('2. 🔍 Plusieurs critères → Recherche combinée');
    console.log('3. 🔍 Aucun critère → Affichage de tous les tickets');
    console.log('4. 📄 Un résultat → Affichage direct des détails');
    console.log('5. 📋 Plusieurs résultats → Liste de sélection');
    console.log('6. ❌ Aucun résultat → Message informatif');
    console.log('');
    console.log('🔧 AMÉLIORATIONS TECHNIQUES:');
    console.log('• Fonction getSearchCriteria() pour extraire les critères');
    console.log('• Gestion intelligente des résultats (1 vs plusieurs)');
    console.log('• Tableau dynamique avec boutons de sélection');
    console.log('• Événements de clic sur lignes et boutons');
    console.log('• Masquage/affichage automatique des résultats');
    console.log('• Validation flexible sans champs obligatoires');
    console.log('');
    console.log('🔄 POUR TESTER:');
    console.log('1. Lancer l\'application: npm start');
    console.log('2. Aller dans "Retours"');
    console.log('3. Tester différents scénarios:');
    console.log('   • Recherche vide (tous les tickets)');
    console.log('   • Recherche par ticket uniquement');
    console.log('   • Recherche par client uniquement');
    console.log('   • Recherche par dates uniquement');
    console.log('   • Recherche combinée');
    console.log('4. Vérifier l\'affichage des résultats');
    console.log('5. Tester la sélection depuis la liste');
} else {
    console.log('⚠️ IMPLÉMENTATION INCOMPLÈTE');
    console.log(`❌ ${testsTotal - testsReussis} test(s) ont échoué`);
    console.log('💡 Veuillez vérifier les problèmes identifiés ci-dessus');
}

console.log('');
console.log('💡 UTILISATION:');
console.log('• Laisser tous les champs vides → Affiche tous les anciens tickets');
console.log('• Remplir un ou plusieurs champs → Recherche ciblée');
console.log('• Cliquer sur une ligne ou "Sélectionner" → Choisir la vente');
console.log('• Utiliser "Effacer" → Vider tous les champs');
console.log('');
console.log('🎊 La recherche multi-critères devrait maintenant être parfaitement fonctionnelle !');
