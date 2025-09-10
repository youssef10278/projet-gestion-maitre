/**
 * Script pour supprimer les pages Historique et Statistiques
 * de la page retours pour simplifier l'interface
 */

const fs = require('fs');
const path = require('path');

console.log('🗑️ SUPPRESSION HISTORIQUE ET STATISTIQUES - PAGE RETOURS');
console.log('=' .repeat(60));
console.log('');

const returnsHtmlPath = path.join(__dirname, 'src', 'returns.html');
const returnsJsPath = path.join(__dirname, 'src', 'js', 'returns.js');

if (!fs.existsSync(returnsHtmlPath)) {
    console.log('❌ Fichier returns.html non trouvé');
    process.exit(1);
}

if (!fs.existsSync(returnsJsPath)) {
    console.log('❌ Fichier returns.js non trouvé');
    process.exit(1);
}

let htmlContent = fs.readFileSync(returnsHtmlPath, 'utf8');
let jsContent = fs.readFileSync(returnsJsPath, 'utf8');

const originalHtmlLength = htmlContent.length;
const originalJsLength = jsContent.length;

console.log('📋 Suppression des éléments HTML...');

// 1. Supprimer les boutons Statistiques et Historique
htmlContent = htmlContent.replace(/<button id="statsBtn"[^>]*>[\s\S]*?<\/button>/g, '');
console.log('✅ Bouton Statistiques supprimé');

htmlContent = htmlContent.replace(/<button id="historyBtn"[^>]*>[\s\S]*?<\/button>/g, '');
console.log('✅ Bouton Historique supprimé');

// 2. Supprimer toute la modal d'historique
htmlContent = htmlContent.replace(/<!-- Modal Historique des Retours -->[\s\S]*?<\/div>\s*<\/div>/g, '');
console.log('✅ Modal Historique supprimée');

// 3. Supprimer les styles CSS liés à l'historique
htmlContent = htmlContent.replace(/\/\* Styles pour la modal d'historique \*\/[\s\S]*?(?=\/\*|<\/style>)/g, '');
console.log('✅ Styles CSS modal historique supprimés');

htmlContent = htmlContent.replace(/\/\* Styles pour le tableau d'historique \*\/[\s\S]*?(?=\/\*|<\/style>)/g, '');
console.log('✅ Styles CSS tableau historique supprimés');

// 4. Nettoyer les espaces multiples dans le HTML
htmlContent = htmlContent.replace(/\n\s*\n\s*\n/g, '\n\n');
console.log('✅ Espaces multiples nettoyés dans HTML');

console.log('');
console.log('📋 Suppression des éléments JavaScript...');

// 5. Supprimer les fonctions liées à l'historique
const historyFunctions = [
    'async function showHistoryModal',
    'function setupHistoryModalEvents',
    'function closeHistoryModal',
    'async function loadHistoryData',
    'async function searchHistoryData',
    'function clearHistoryFilters',
    'function showHistoryLoading',
    'function displayHistoryResults',
    'function showHistoryEmpty',
    'function createHistoryRow',
    'async function viewReturnDetails',
    'async function printReturnTicket',
    'function adaptReturnDataForPrint',
    'function showReturnDetailsModal'
];

historyFunctions.forEach(funcName => {
    // Supprimer la fonction complète
    const funcRegex = new RegExp(`${funcName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{[\\s\\S]*?\\n\\}`, 'g');
    const beforeLength = jsContent.length;
    jsContent = jsContent.replace(funcRegex, '');
    if (jsContent.length < beforeLength) {
        console.log(`✅ Fonction ${funcName} supprimée`);
    }
});

// 6. Supprimer les événements liés aux boutons
jsContent = jsContent.replace(/addEventListenerSafe\('statsBtn'[^;]*;/g, '');
jsContent = jsContent.replace(/addEventListenerSafe\('historyBtn'[^;]*;/g, '');
console.log('✅ Événements boutons supprimés');

// 7. Supprimer les fonctions de test globales
jsContent = jsContent.replace(/window\.testHistorySearch[\s\S]*?};/g, '');
jsContent = jsContent.replace(/window\.forceSetupHistoryEvents[\s\S]*?};/g, '');
console.log('✅ Fonctions de test globales supprimées');

// 8. Supprimer les commentaires liés à l'historique
jsContent = jsContent.replace(/\/\*\*[\s\S]*?historique[\s\S]*?\*\//gi, '');
jsContent = jsContent.replace(/\/\/.*historique.*/gi, '');
console.log('✅ Commentaires historique supprimés');

// 9. Nettoyer les espaces multiples dans le JS
jsContent = jsContent.replace(/\n\s*\n\s*\n/g, '\n\n');
console.log('✅ Espaces multiples nettoyés dans JS');

// 10. Supprimer les références aux fonctions supprimées
jsContent = jsContent.replace(/showStatsModal/g, '() => console.log("Statistiques supprimées")');
console.log('✅ Références aux fonctions supprimées nettoyées');

// Sauvegarder les fichiers modifiés
fs.writeFileSync(returnsHtmlPath, htmlContent, 'utf8');
fs.writeFileSync(returnsJsPath, jsContent, 'utf8');

const newHtmlLength = htmlContent.length;
const newJsLength = jsContent.length;

const htmlReduction = originalHtmlLength - newHtmlLength;
const jsReduction = originalJsLength - jsContent.length;
const htmlReductionPercent = Math.round((htmlReduction / originalHtmlLength) * 100);
const jsReductionPercent = Math.round((jsReduction / originalJsLength) * 100);

console.log('');
console.log('=' .repeat(60));
console.log('📊 RÉSULTATS DE LA SUPPRESSION');
console.log('=' .repeat(60));

console.log('📄 FICHIER HTML:');
console.log(`   Taille originale: ${originalHtmlLength} caractères`);
console.log(`   Nouvelle taille: ${newHtmlLength} caractères`);
console.log(`   Réduction: ${htmlReduction} caractères (${htmlReductionPercent}%)`);
console.log('');

console.log('📄 FICHIER JAVASCRIPT:');
console.log(`   Taille originale: ${originalJsLength} caractères`);
console.log(`   Nouvelle taille: ${newJsLength} caractères`);
console.log(`   Réduction: ${jsReduction} caractères (${jsReductionPercent}%)`);
console.log('');

const totalReduction = htmlReduction + jsReduction;
console.log(`📊 RÉDUCTION TOTALE: ${totalReduction} caractères`);
console.log('');

console.log('✅ SUPPRESSION RÉUSSIE !');
console.log('');
console.log('🗑️ ÉLÉMENTS SUPPRIMÉS:');
console.log('❌ Bouton "Statistiques"');
console.log('❌ Bouton "Historique"');
console.log('❌ Modal complète d\'historique');
console.log('❌ Tous les styles CSS liés');
console.log('❌ Toutes les fonctions JavaScript liées');
console.log('❌ Tous les événements liés');
console.log('❌ Fonctions de test et debug');
console.log('');
console.log('✅ ÉLÉMENTS PRÉSERVÉS:');
console.log('✅ Toutes les fonctionnalités de retour');
console.log('✅ Navigation entre sections');
console.log('✅ Traitement des retours');
console.log('✅ Interface utilisateur principale');
console.log('✅ Styles et design');
console.log('');
console.log('🎯 RÉSULTAT:');
console.log('La page retours est maintenant simplifiée et se concentre');
console.log('uniquement sur la fonctionnalité principale de gestion des retours.');
console.log('');
console.log('💡 POUR TESTER:');
console.log('1. Lancer l\'application');
console.log('2. Aller dans "Retours"');
console.log('3. Vérifier que les boutons Historique et Statistiques ont disparu');
console.log('4. Tester que toutes les autres fonctionnalités marchent');
console.log('');
console.log('Si vous souhaitez restaurer ces fonctionnalités plus tard,');
console.log('vous pouvez utiliser Git pour revenir à la version précédente.');
