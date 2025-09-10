/**
 * Test de validation de l'accès à la page dépenses depuis le menu
 */

const fs = require('fs');
const path = require('path');

console.log('🔗 VALIDATION ACCÈS PAGE DÉPENSES DEPUIS LE MENU');
console.log('=' .repeat(55));
console.log('');

const layoutPath = path.join(__dirname, 'src', 'js', 'layout.js');

if (!fs.existsSync(layoutPath)) {
    console.log('❌ Fichier layout.js non trouvé');
    process.exit(1);
}

const layoutContent = fs.readFileSync(layoutPath, 'utf8');

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

// Test 1: Vérifier que l'entrée expenses existe dans les liens
runTest('Entrée expenses définie dans les liens', () => {
    const hasExpensesEntry = layoutContent.includes('expenses: `');
    const hasExpensesHref = layoutContent.includes('href="expenses.html"');
    const hasExpensesIcon = layoutContent.includes('indigo-500');
    const hasExpensesTranslation = layoutContent.includes('main_menu_expenses');
    
    if (hasExpensesEntry && hasExpensesHref && hasExpensesIcon && hasExpensesTranslation) {
        console.log('  ✅ Entrée expenses complète avec lien, icône et traduction');
        return true;
    } else {
        console.log(`  ❌ Entrée incomplète: entry=${hasExpensesEntry}, href=${hasExpensesHref}, icon=${hasExpensesIcon}, translation=${hasExpensesTranslation}`);
        return false;
    }
});

// Test 2: Vérifier que expenses est inclus dans la construction du menu pour propriétaires
runTest('Expenses inclus dans le menu propriétaire', () => {
    const hasExpensesInMenu = layoutContent.includes('links.expenses +');
    const isInProprietaireSection = layoutContent.includes("user.role === 'Propriétaire'") && 
                                   layoutContent.includes('links.expenses');
    
    if (hasExpensesInMenu && isInProprietaireSection) {
        console.log('  ✅ Expenses correctement inclus dans le menu propriétaire');
        return true;
    } else {
        console.log(`  ❌ Inclusion incorrecte: inMenu=${hasExpensesInMenu}, inProprietaire=${isInProprietaireSection}`);
        return false;
    }
});

// Test 3: Vérifier l'ordre des éléments dans le menu
runTest('Ordre correct des éléments de menu', () => {
    // Vérifier que expenses vient après returns et avant products
    const menuConstruction = layoutContent.match(/navHTML \+= links\..*?;/g);
    
    if (!menuConstruction) {
        console.log('  ❌ Construction du menu non trouvée');
        return false;
    }
    
    const menuOrder = menuConstruction.join(' ');
    const hasCorrectOrder = menuOrder.includes('links.returns') && 
                           menuOrder.includes('links.expenses') && 
                           menuOrder.includes('links.products') &&
                           menuOrder.indexOf('links.returns') < menuOrder.indexOf('links.expenses') &&
                           menuOrder.indexOf('links.expenses') < menuOrder.indexOf('links.products');
    
    if (hasCorrectOrder) {
        console.log('  ✅ Ordre correct: returns → expenses → products');
        return true;
    } else {
        console.log('  ❌ Ordre incorrect dans la construction du menu');
        return false;
    }
});

// Test 4: Vérifier que le fichier expenses.html existe
runTest('Fichier expenses.html accessible', () => {
    const expensesHtmlPath = path.join(__dirname, 'src', 'expenses.html');
    
    if (fs.existsSync(expensesHtmlPath)) {
        console.log('  ✅ Fichier expenses.html existe et est accessible');
        return true;
    } else {
        console.log('  ❌ Fichier expenses.html non trouvé');
        return false;
    }
});

// Test 5: Vérifier la cohérence des traductions
runTest('Traductions cohérentes pour le menu', () => {
    const frPath = path.join(__dirname, 'src', 'locales', 'fr.json');
    const arPath = path.join(__dirname, 'src', 'locales', 'ar.json');
    
    let frHasTranslation = false;
    let arHasTranslation = false;
    
    if (fs.existsSync(frPath)) {
        const frContent = fs.readFileSync(frPath, 'utf8');
        frHasTranslation = frContent.includes('"main_menu_expenses"');
    }
    
    if (fs.existsSync(arPath)) {
        const arContent = fs.readFileSync(arPath, 'utf8');
        arHasTranslation = arContent.includes('"main_menu_expenses"');
    }
    
    if (frHasTranslation && arHasTranslation) {
        console.log('  ✅ Traductions présentes en français et arabe');
        return true;
    } else {
        console.log(`  ❌ Traductions manquantes: fr=${frHasTranslation}, ar=${arHasTranslation}`);
        return false;
    }
});

// Test 6: Vérifier la structure du lien expenses
runTest('Structure du lien expenses correcte', () => {
    // Extraire la section expenses
    const expensesMatch = layoutContent.match(/expenses: `[\s\S]*?`,/);
    
    if (!expensesMatch) {
        console.log('  ❌ Section expenses non trouvée');
        return false;
    }
    
    const expensesSection = expensesMatch[0];
    
    const hasCorrectClass = expensesSection.includes('nav-link group flex items-center');
    const hasHoverEffect = expensesSection.includes('hover:bg-gradient-to-r');
    const hasIcon = expensesSection.includes('svg');
    const hasSpan = expensesSection.includes('<span>');
    
    if (hasCorrectClass && hasHoverEffect && hasIcon && hasSpan) {
        console.log('  ✅ Structure du lien expenses complète et correcte');
        return true;
    } else {
        console.log(`  ❌ Structure incomplète: class=${hasCorrectClass}, hover=${hasHoverEffect}, icon=${hasIcon}, span=${hasSpan}`);
        return false;
    }
});

// Test 7: Vérifier que expenses n'est accessible qu'aux propriétaires
runTest('Accès expenses limité aux propriétaires', () => {
    // Vérifier que expenses est dans la section propriétaire uniquement
    const proprietaireSection = layoutContent.match(/if \(user && user\.role === 'Propriétaire'\) \{[\s\S]*?\}/g);
    
    if (!proprietaireSection) {
        console.log('  ❌ Section propriétaire non trouvée');
        return false;
    }
    
    const proprietaireSectionText = proprietaireSection.join(' ');
    const expensesInProprietaire = proprietaireSectionText.includes('links.expenses');
    const expensesNotInVendeur = !layoutContent.includes('navHTML += links.seller_history + links.expenses');
    
    if (expensesInProprietaire && expensesNotInVendeur) {
        console.log('  ✅ Accès expenses correctement limité aux propriétaires');
        return true;
    } else {
        console.log(`  ❌ Accès mal configuré: inProprietaire=${expensesInProprietaire}, notInVendeur=${expensesNotInVendeur}`);
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
    console.log('🎉 ACCÈS PAGE DÉPENSES PARFAITEMENT CONFIGURÉ !');
    console.log('');
    console.log('✅ PROBLÈME RÉSOLU:');
    console.log('❌ AVANT: Page dépenses inaccessible depuis le menu');
    console.log('✅ APRÈS: Lien dépenses fonctionnel dans le menu propriétaire');
    console.log('');
    console.log('🔧 CORRECTIONS APPORTÉES:');
    console.log('• Ajout de links.expenses dans la construction du menu');
    console.log('• Positionnement correct après returns et avant products');
    console.log('• Accès limité aux propriétaires uniquement');
    console.log('• Structure de lien complète avec icône et traductions');
    console.log('• Cohérence avec le design existant');
    console.log('');
    console.log('🎯 NAVIGATION COMPLÈTE:');
    console.log('1. 🏠 Dashboard (Propriétaire)');
    console.log('2. 💰 Caisse (Tous)');
    console.log('3. 🔄 Retours (Tous)');
    console.log('4. 💸 Dépenses (Propriétaire) ← NOUVEAU');
    console.log('5. 📦 Produits (Propriétaire)');
    console.log('6. ⚙️ Autres fonctions (Propriétaire)');
    console.log('');
    console.log('🔄 POUR TESTER:');
    console.log('1. Lancer l\'application: npm start');
    console.log('2. Se connecter en tant que Propriétaire');
    console.log('3. Vérifier la présence du lien "Dépenses" dans le menu');
    console.log('4. Cliquer sur "Dépenses" pour accéder à la page');
    console.log('5. Confirmer que la page se charge correctement');
    console.log('');
    console.log('✅ Le lien vers la page dépenses est maintenant accessible !');
} else {
    console.log('⚠️ CONFIGURATION INCOMPLÈTE');
    console.log(`❌ ${testsTotal - testsReussis} test(s) ont échoué`);
    console.log('💡 Veuillez vérifier les problèmes identifiés ci-dessus');
}

console.log('');
console.log('💡 INFORMATIONS IMPORTANTES:');
console.log('• La page dépenses est accessible uniquement aux propriétaires');
console.log('• Le lien apparaît entre "Retours" et "Produits" dans le menu');
console.log('• L\'icône utilise la couleur indigo pour se distinguer');
console.log('• Les traductions sont disponibles en français et arabe');
console.log('• La structure respecte le design system existant');
