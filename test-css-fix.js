/**
 * Script de test pour vérifier la correction du CSS orphelin
 * dans la page retours
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 TEST DE CORRECTION CSS - PAGE RETOURS');
console.log('=' .repeat(50));
console.log('');

const returnsHtmlPath = path.join(__dirname, 'src', 'returns.html');

if (!fs.existsSync(returnsHtmlPath)) {
    console.log('❌ Fichier returns.html non trouvé');
    process.exit(1);
}

const content = fs.readFileSync(returnsHtmlPath, 'utf8');

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

// Test 1: Vérifier qu'il n'y a qu'une seule balise </style>
runTest('Balise </style> unique', () => {
    const styleCloseTags = content.match(/<\/style>/g);
    if (!styleCloseTags) {
        console.log('  ❌ Aucune balise </style> trouvée');
        return false;
    }
    
    if (styleCloseTags.length > 1) {
        console.log(`  ❌ ${styleCloseTags.length} balises </style> trouvées (devrait être 1)`);
        return false;
    }
    
    console.log('  ✅ Une seule balise </style> trouvée');
    return true;
});

// Test 2: Vérifier que le CSS problématique n'est plus orphelin
runTest('CSS Classes utilitaires dans <style>', () => {
    // Chercher le texte problématique qui s'affichait
    const problematicText = 'Classes utilitaires supplémentaires pour le nouveau design';
    
    // Vérifier qu'il est dans une balise style
    const styleStartIndex = content.indexOf('<style>');
    const styleEndIndex = content.indexOf('</style>');
    
    if (styleStartIndex === -1 || styleEndIndex === -1) {
        console.log('  ❌ Balises <style> non trouvées');
        return false;
    }
    
    const styleContent = content.substring(styleStartIndex, styleEndIndex);
    
    if (!styleContent.includes(problematicText)) {
        console.log('  ❌ CSS "Classes utilitaires" non trouvé dans <style>');
        return false;
    }
    
    console.log('  ✅ CSS "Classes utilitaires" correctement dans <style>');
    return true;
});

// Test 3: Vérifier que quantity-input est dans le CSS
runTest('Classe .quantity-input dans <style>', () => {
    const styleStartIndex = content.indexOf('<style>');
    const styleEndIndex = content.indexOf('</style>');
    const styleContent = content.substring(styleStartIndex, styleEndIndex);
    
    if (!styleContent.includes('.quantity-input')) {
        console.log('  ❌ Classe .quantity-input non trouvée dans <style>');
        return false;
    }
    
    console.log('  ✅ Classe .quantity-input correctement dans <style>');
    return true;
});

// Test 4: Vérifier qu'il n'y a pas de CSS orphelin après </style>
runTest('Pas de CSS orphelin après </style>', () => {
    const styleEndIndex = content.indexOf('</style>');
    const headEndIndex = content.indexOf('</head>');
    
    if (styleEndIndex === -1 || headEndIndex === -1) {
        console.log('  ❌ Balises </style> ou </head> non trouvées');
        return false;
    }
    
    const afterStyleContent = content.substring(styleEndIndex + 8, headEndIndex);
    
    // Vérifier qu'il n'y a pas de CSS (sélecteurs avec {})
    const cssPattern = /\.[a-zA-Z-]+\s*\{[^}]*\}/;
    
    if (cssPattern.test(afterStyleContent)) {
        console.log('  ❌ CSS orphelin détecté après </style>');
        return false;
    }
    
    console.log('  ✅ Aucun CSS orphelin après </style>');
    return true;
});

// Test 5: Vérifier la structure HTML correcte
runTest('Structure HTML valide', () => {
    // Vérifier que <style> est dans <head>
    const headStartIndex = content.indexOf('<head>');
    const headEndIndex = content.indexOf('</head>');
    const styleStartIndex = content.indexOf('<style>');
    const styleEndIndex = content.indexOf('</style>');
    
    if (headStartIndex === -1 || headEndIndex === -1) {
        console.log('  ❌ Balises <head> non trouvées');
        return false;
    }
    
    if (styleStartIndex === -1 || styleEndIndex === -1) {
        console.log('  ❌ Balises <style> non trouvées');
        return false;
    }
    
    if (styleStartIndex < headStartIndex || styleEndIndex > headEndIndex) {
        console.log('  ❌ Balises <style> en dehors de <head>');
        return false;
    }
    
    console.log('  ✅ Structure HTML valide');
    return true;
});

// Résultats finaux
console.log('=' .repeat(50));
console.log('📊 RÉSULTATS DU TEST CSS');
console.log('=' .repeat(50));
console.log(`Total des tests: ${testsTotal}`);
console.log(`Tests réussis: ${testsReussis} ✅`);
console.log(`Tests échoués: ${testsTotal - testsReussis} ❌`);
console.log(`Taux de réussite: ${Math.round((testsReussis / testsTotal) * 100)}%`);
console.log('');

if (testsReussis === testsTotal) {
    console.log('🎉 CORRECTION CSS PARFAITE !');
    console.log('✅ Le CSS orphelin a été corrigé');
    console.log('✅ Plus de texte CSS affiché en haut de la page');
    console.log('✅ Tous les styles sont correctement encapsulés');
    console.log('✅ La page retours s\'affichera maintenant correctement');
    console.log('');
    console.log('🎯 PROBLÈME RÉSOLU:');
    console.log('❌ AVANT: CSS affiché comme texte en haut de la page');
    console.log('✅ APRÈS: CSS correctement interprété et appliqué');
} else {
    console.log('⚠️ CORRECTION INCOMPLÈTE');
    console.log(`❌ ${testsTotal - testsReussis} test(s) ont échoué`);
    console.log('💡 Veuillez vérifier les problèmes identifiés');
}

console.log('');
console.log('🔄 Pour vérifier la correction:');
console.log('1. Ouvrir la page retours dans l\'application');
console.log('2. Vérifier qu\'aucun texte CSS n\'apparaît en haut');
console.log('3. Vérifier que les styles sont correctement appliqués');
console.log('4. Tester la fonctionnalité de recherche');
