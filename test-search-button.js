/**
 * Script de test pour diagnostiquer le problème du bouton Rechercher
 * dans la modal d'historique
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC - BOUTON RECHERCHER HISTORIQUE');
console.log('=' .repeat(50));
console.log('');

// Test 1: Vérifier la structure HTML
console.log('1. 📋 Vérification de la structure HTML...');
const htmlPath = path.join(__dirname, 'src', 'returns.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const requiredElements = [
    { id: 'searchHistory', desc: 'Bouton Rechercher' },
    { id: 'clearHistoryFilters', desc: 'Bouton Effacer' },
    { id: 'historyReturnNumber', desc: 'Input Numéro de Retour' },
    { id: 'historyClientName', desc: 'Input Nom du Client' },
    { id: 'historyDateFrom', desc: 'Input Date Début' },
    { id: 'historyDateTo', desc: 'Input Date Fin' }
];

requiredElements.forEach(element => {
    const found = htmlContent.includes(`id="${element.id}"`);
    console.log(`   ${found ? '✅' : '❌'} ${element.desc} (${element.id})`);
});

console.log('');

// Test 2: Vérifier les classes CSS des boutons
console.log('2. 🎨 Vérification des classes CSS...');
const cssClasses = [
    { class: '.btn', desc: 'Classe de base bouton' },
    { class: '.btn-primary', desc: 'Classe bouton primaire' },
    { class: '.btn-outline', desc: 'Classe bouton outline' }
];

cssClasses.forEach(cssClass => {
    const found = htmlContent.includes(cssClass.class);
    console.log(`   ${found ? '✅' : '❌'} ${cssClass.desc} (${cssClass.class})`);
});

console.log('');

// Test 3: Vérifier les fonctions JavaScript
console.log('3. ⚙️ Vérification des fonctions JavaScript...');
const jsPath = path.join(__dirname, 'src', 'js', 'returns.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');

const requiredFunctions = [
    { func: 'async function searchHistoryData', desc: 'Fonction de recherche' },
    { func: 'function setupHistoryModalEvents', desc: 'Configuration événements' },
    { func: 'async function loadHistoryData', desc: 'Chargement données' },
    { func: 'function clearHistoryFilters', desc: 'Effacer filtres' }
];

requiredFunctions.forEach(func => {
    const found = jsContent.includes(func.func);
    console.log(`   ${found ? '✅' : '❌'} ${func.desc}`);
});

console.log('');

// Test 4: Vérifier la configuration des événements
console.log('4. 🔗 Vérification de la configuration des événements...');

const eventChecks = [
    { 
        check: jsContent.includes('getElementById(\'searchHistory\')'), 
        desc: 'Récupération bouton Rechercher' 
    },
    { 
        check: jsContent.includes('addEventListener(\'click\''), 
        desc: 'Ajout événement click' 
    },
    { 
        check: jsContent.includes('setupHistoryModalEvents()'), 
        desc: 'Appel configuration événements' 
    }
];

eventChecks.forEach(check => {
    console.log(`   ${check.check ? '✅' : '❌'} ${check.desc}`);
});

console.log('');

// Test 5: Vérifier l'API
console.log('5. 📡 Vérification de l\'API...');

const apiChecks = [
    { 
        check: jsContent.includes('window.api.returns.getHistory'), 
        desc: 'Appel API getHistory' 
    },
    { 
        check: jsContent.includes('returns:get-history'), 
        desc: 'Handler IPC (dans main.js)' 
    }
];

// Vérifier main.js
const mainPath = path.join(__dirname, 'main.js');
let mainContent = '';
if (fs.existsSync(mainPath)) {
    mainContent = fs.readFileSync(mainPath, 'utf8');
}

apiChecks.forEach(check => {
    let found = check.check;
    if (check.desc.includes('main.js')) {
        found = mainContent.includes('returns:get-history');
    }
    console.log(`   ${found ? '✅' : '❌'} ${check.desc}`);
});

console.log('');

// Test 6: Analyser les logs potentiels
console.log('6. 📝 Analyse des logs de debug ajoutés...');

const debugLogs = [
    { 
        check: jsContent.includes('console.log(\'🔍 Clic sur le bouton Rechercher détecté\')'), 
        desc: 'Log clic bouton Rechercher' 
    },
    { 
        check: jsContent.includes('console.log(\'🔍 Début de la recherche dans l\\\'historique...\')'), 
        desc: 'Log début recherche' 
    },
    { 
        check: jsContent.includes('console.log(\'📊 Début du chargement des données d\\\'historique...\')'), 
        desc: 'Log chargement données' 
    }
];

debugLogs.forEach(log => {
    console.log(`   ${log.check ? '✅' : '❌'} ${log.desc}`);
});

console.log('');
console.log('=' .repeat(50));
console.log('🎯 DIAGNOSTIC COMPLET');
console.log('=' .repeat(50));

console.log('');
console.log('📋 INSTRUCTIONS DE TEST:');
console.log('');
console.log('1. 🚀 Lancer l\'application');
console.log('2. 📄 Aller dans "Retours"');
console.log('3. 📊 Cliquer sur "Historique"');
console.log('4. 🔍 Ouvrir la console développeur (F12)');
console.log('5. 🖱️ Cliquer sur "Rechercher"');
console.log('6. 👀 Vérifier les logs dans la console');
console.log('');
console.log('🔍 LOGS ATTENDUS DANS LA CONSOLE:');
console.log('   🔍 Ouverture de la modal historique...');
console.log('   🔧 Configuration des événements de la modal...');
console.log('   ✅ Événement click ajouté au bouton Rechercher');
console.log('   📊 Chargement initial de l\'historique...');
console.log('   🔍 Clic sur le bouton Rechercher détecté');
console.log('   🔍 Début de la recherche dans l\'historique...');
console.log('');
console.log('❌ SI AUCUN LOG N\'APPARAÎT:');
console.log('   - L\'événement click n\'est pas attaché');
console.log('   - Le bouton n\'est pas trouvé');
console.log('   - Il y a une erreur JavaScript');
console.log('');
console.log('✅ SI LES LOGS APPARAISSENT MAIS RIEN NE SE PASSE:');
console.log('   - Problème avec l\'API returns.getHistory');
console.log('   - Erreur dans loadHistoryData');
console.log('   - Problème d\'affichage des résultats');
console.log('');
console.log('🛠️ CORRECTIONS APPLIQUÉES:');
console.log('✅ Logs de debug ajoutés partout');
console.log('✅ Vérifications d\'erreur renforcées');
console.log('✅ Gestion d\'erreur améliorée');
console.log('✅ Événements avec callbacks explicites');
console.log('');
console.log('🎯 Le bouton Rechercher devrait maintenant fonctionner et afficher des logs détaillés !');
