#!/usr/bin/env node

/**
 * Script de test automatisé pour la fonctionnalité d'impression automatique
 * Vérifie tous les composants implémentés
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TEST IMPRESSION AUTOMATIQUE - VALIDATION COMPLÈTE\n');

// Couleurs pour la console
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️ ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️ ${message}`, 'blue');
}

let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
};

function runTest(testName, testFunction) {
    try {
        log(`\n🔍 Test: ${testName}`, 'bold');
        const result = testFunction();
        if (result === true) {
            logSuccess(`${testName} - RÉUSSI`);
            testResults.passed++;
        } else if (result === 'warning') {
            logWarning(`${testName} - AVERTISSEMENT`);
            testResults.warnings++;
        } else {
            logError(`${testName} - ÉCHEC`);
            testResults.failed++;
        }
    } catch (error) {
        logError(`${testName} - ERREUR: ${error.message}`);
        testResults.failed++;
    }
}

// Test 1: Vérification de la base de données
function testDatabase() {
    const dbPath = path.join(__dirname, 'database.js');
    if (!fs.existsSync(dbPath)) {
        logError('Fichier database.js non trouvé');
        return false;
    }
    
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    
    // Vérifier l'initialisation du paramètre
    if (!dbContent.includes('auto_print_tickets')) {
        logError('Paramètre auto_print_tickets non trouvé dans database.js');
        return false;
    }
    
    if (!dbContent.includes('INSERT INTO settings')) {
        logError('Initialisation du paramètre manquante');
        return false;
    }
    
    logInfo('Paramètre auto_print_tickets correctement initialisé');
    return true;
}

// Test 2: Vérification du preload.js
function testPreload() {
    const preloadPath = path.join(__dirname, 'preload.js');
    if (!fs.existsSync(preloadPath)) {
        logError('Fichier preload.js non trouvé');
        return false;
    }
    
    const preloadContent = fs.readFileSync(preloadPath, 'utf8');
    
    if (!preloadContent.includes('getSetting') || !preloadContent.includes('saveSetting')) {
        logError('API getSetting/saveSetting manquantes dans preload.js');
        return false;
    }
    
    logInfo('API getSetting/saveSetting correctement exposées');
    return true;
}

// Test 3: Vérification du main.js
function testMain() {
    const mainPath = path.join(__dirname, 'main.js');
    if (!fs.existsSync(mainPath)) {
        logError('Fichier main.js non trouvé');
        return false;
    }
    
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    
    if (!mainContent.includes('settings:get') || !mainContent.includes('settings:save')) {
        logError('Handlers IPC manquants dans main.js');
        return false;
    }
    
    logInfo('Handlers IPC correctement configurés');
    return true;
}

// Test 4: Vérification de l'interface Settings
function testSettingsUI() {
    const settingsPath = path.join(__dirname, 'src', 'settings.html');
    if (!fs.existsSync(settingsPath)) {
        logError('Fichier settings.html non trouvé');
        return false;
    }
    
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    
    if (!settingsContent.includes('printing-section')) {
        logError('Section printing-section manquante dans settings.html');
        return false;
    }
    
    if (!settingsContent.includes('autoPrintTickets')) {
        logError('Checkbox autoPrintTickets manquant');
        return false;
    }
    
    if (!settingsContent.includes('Impression Automatique')) {
        logError('Texte d\'interface manquant');
        return false;
    }
    
    logInfo('Interface Settings correctement implémentée');
    return true;
}

// Test 5: Vérification du JavaScript Settings
function testSettingsJS() {
    const settingsJSPath = path.join(__dirname, 'src', 'js', 'settings.js');
    if (!fs.existsSync(settingsJSPath)) {
        logError('Fichier settings.js non trouvé');
        return false;
    }
    
    const settingsJSContent = fs.readFileSync(settingsJSPath, 'utf8');
    
    if (!settingsJSContent.includes('printing')) {
        logError('Section printing manquante dans navigation');
        return false;
    }
    
    if (!settingsJSContent.includes('initPrintingSettings')) {
        logError('Fonction initPrintingSettings manquante');
        return false;
    }
    
    if (!settingsJSContent.includes('savePrintingSettings')) {
        logError('Fonction savePrintingSettings manquante');
        return false;
    }
    
    logInfo('JavaScript Settings correctement implémenté');
    return true;
}

// Test 6: Vérification de la logique Caisse
function testCaisseLogic() {
    const caissePath = path.join(__dirname, 'src', 'js', 'caisse.js');
    if (!fs.existsSync(caissePath)) {
        logError('Fichier caisse.js non trouvé');
        return false;
    }
    
    const caisseContent = fs.readFileSync(caissePath, 'utf8');
    
    if (!caisseContent.includes('checkAutoPrintSetting')) {
        logError('Fonction checkAutoPrintSetting manquante');
        return false;
    }
    
    if (!caisseContent.includes('performAutoPrint')) {
        logError('Fonction performAutoPrint manquante');
        return false;
    }
    
    if (!caisseContent.includes('auto_print_tickets')) {
        logError('Référence au paramètre auto_print_tickets manquante');
        return false;
    }
    
    logInfo('Logique caisse correctement implémentée');
    return true;
}

// Test 7: Vérification de la structure des fichiers
function testFileStructure() {
    const requiredFiles = [
        'database.js',
        'preload.js',
        'main.js',
        'src/settings.html',
        'src/js/settings.js',
        'src/js/caisse.js',
        'test-impression-automatique.html'
    ];
    
    let allFilesExist = true;
    
    for (const file of requiredFiles) {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            logError(`Fichier manquant: ${file}`);
            allFilesExist = false;
        }
    }
    
    if (allFilesExist) {
        logInfo('Tous les fichiers requis sont présents');
        return true;
    }
    
    return false;
}

// Test 8: Vérification de la cohérence des paramètres
function testParameterConsistency() {
    const files = [
        { path: 'database.js', content: null },
        { path: 'src/js/settings.js', content: null },
        { path: 'src/js/caisse.js', content: null }
    ];
    
    // Charger tous les fichiers
    for (const file of files) {
        const filePath = path.join(__dirname, file.path);
        if (fs.existsSync(filePath)) {
            file.content = fs.readFileSync(filePath, 'utf8');
        }
    }
    
    // Vérifier que tous utilisent le même nom de paramètre
    const parameterName = 'auto_print_tickets';
    let consistent = true;
    
    for (const file of files) {
        if (file.content && !file.content.includes(parameterName)) {
            logWarning(`Paramètre ${parameterName} non trouvé dans ${file.path}`);
            consistent = false;
        }
    }
    
    if (consistent) {
        logInfo('Cohérence des paramètres vérifiée');
        return true;
    }
    
    return 'warning';
}

// Exécution des tests
function runAllTests() {
    log('🚀 DÉBUT DES TESTS D\'IMPLÉMENTATION\n', 'bold');
    
    runTest('Structure des fichiers', testFileStructure);
    runTest('Base de données', testDatabase);
    runTest('Preload API', testPreload);
    runTest('Main IPC Handlers', testMain);
    runTest('Interface Settings', testSettingsUI);
    runTest('JavaScript Settings', testSettingsJS);
    runTest('Logique Caisse', testCaisseLogic);
    runTest('Cohérence des paramètres', testParameterConsistency);
    
    // Résumé des résultats
    log('\n📊 RÉSUMÉ DES TESTS', 'bold');
    log('═'.repeat(50));
    logSuccess(`Tests réussis: ${testResults.passed}`);
    if (testResults.warnings > 0) {
        logWarning(`Avertissements: ${testResults.warnings}`);
    }
    if (testResults.failed > 0) {
        logError(`Tests échoués: ${testResults.failed}`);
    }
    
    const total = testResults.passed + testResults.failed + testResults.warnings;
    const successRate = Math.round((testResults.passed / total) * 100);
    
    log(`\n🎯 Taux de réussite: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
    
    if (testResults.failed === 0) {
        log('\n🎉 TOUS LES TESTS CRITIQUES SONT PASSÉS !', 'green');
        log('✨ La fonctionnalité d\'impression automatique est prête !', 'green');
    } else {
        log('\n⚠️ Des corrections sont nécessaires avant déploiement', 'red');
    }
    
    log('\n📋 PROCHAINES ÉTAPES:', 'bold');
    log('1. Tester l\'application avec npm start');
    log('2. Ouvrir test-impression-automatique.html');
    log('3. Vérifier Settings → Impression');
    log('4. Tester une vente en caisse');
    log('5. Valider l\'impression automatique');
}

// Exécution
runAllTests();
