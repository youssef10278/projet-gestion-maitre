#!/usr/bin/env node

/**
 * Script de test pour vérifier la correction de l'erreur settings.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 TEST CORRECTION ERREUR SETTINGS.JS\n');

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

function logInfo(message) {
    log(`ℹ️ ${message}`, 'blue');
}

// Test de la correction
function testErrorCorrection() {
    const settingsJSPath = path.join(__dirname, 'src', 'js', 'settings.js');
    
    if (!fs.existsSync(settingsJSPath)) {
        logError('Fichier settings.js non trouvé');
        return false;
    }
    
    const content = fs.readFileSync(settingsJSPath, 'utf8');
    
    // Vérifier les corrections appliquées
    const corrections = [
        {
            name: 'Vérification ownerSecurityCard',
            pattern: /if\s*\(\s*ownerSecurityCard\s*\)/,
            description: 'Vérification de l\'existence de ownerSecurityCard avant manipulation'
        },
        {
            name: 'Vérification sellersManagementCard',
            pattern: /if\s*\(\s*sellersManagementCard\s*\)/,
            description: 'Vérification de l\'existence de sellersManagementCard avant manipulation'
        },
        {
            name: 'Gestion d\'erreur initPrintingSettings',
            pattern: /try\s*\{\s*await\s+initPrintingSettings/,
            description: 'Gestion d\'erreur pour initPrintingSettings'
        },
        {
            name: 'Vérification ownerUsername',
            pattern: /const\s+ownerUsernameInput\s*=\s*document\.getElementById\('ownerUsername'\)/,
            description: 'Vérification de l\'existence de l\'input ownerUsername'
        }
    ];
    
    let allCorrectionsApplied = true;
    
    log('🔍 Vérification des corrections appliquées:\n');
    
    for (const correction of corrections) {
        if (correction.pattern.test(content)) {
            logSuccess(`${correction.name} - Correction appliquée`);
            logInfo(`   ${correction.description}`);
        } else {
            logError(`${correction.name} - Correction manquante`);
            allCorrectionsApplied = false;
        }
        console.log('');
    }
    
    return allCorrectionsApplied;
}

// Test de la structure HTML
function testHTMLStructure() {
    const settingsHTMLPath = path.join(__dirname, 'src', 'settings.html');
    
    if (!fs.existsSync(settingsHTMLPath)) {
        logError('Fichier settings.html non trouvé');
        return false;
    }
    
    const content = fs.readFileSync(settingsHTMLPath, 'utf8');
    
    // Vérifier les éléments requis
    const requiredElements = [
        {
            id: 'printing-section',
            description: 'Section des paramètres d\'impression'
        },
        {
            id: 'autoPrintTickets',
            description: 'Checkbox d\'impression automatique'
        },
        {
            id: 'printingStatus',
            description: 'Affichage du statut d\'impression'
        },
        {
            id: 'savePrintingSettings',
            description: 'Bouton de sauvegarde des paramètres'
        }
    ];
    
    log('🔍 Vérification de la structure HTML:\n');
    
    let allElementsPresent = true;
    
    for (const element of requiredElements) {
        const pattern = new RegExp(`id=["']${element.id}["']`);
        if (pattern.test(content)) {
            logSuccess(`Élément ${element.id} - Présent`);
            logInfo(`   ${element.description}`);
        } else {
            logError(`Élément ${element.id} - Manquant`);
            allElementsPresent = false;
        }
        console.log('');
    }
    
    return allElementsPresent;
}

// Test de cohérence
function testConsistency() {
    log('🔍 Test de cohérence globale:\n');
    
    const files = [
        { path: 'database.js', name: 'Base de données' },
        { path: 'preload.js', name: 'API Preload' },
        { path: 'main.js', name: 'IPC Handlers' },
        { path: 'src/settings.html', name: 'Interface HTML' },
        { path: 'src/js/settings.js', name: 'Logique JavaScript' },
        { path: 'src/js/caisse.js', name: 'Logique Caisse' }
    ];
    
    let allFilesOK = true;
    
    for (const file of files) {
        const filePath = path.join(__dirname, file.path);
        if (fs.existsSync(filePath)) {
            logSuccess(`${file.name} - Fichier présent`);
        } else {
            logError(`${file.name} - Fichier manquant`);
            allFilesOK = false;
        }
    }
    
    return allFilesOK;
}

// Exécution des tests
function runTests() {
    log('🚀 DÉBUT DES TESTS DE CORRECTION\n', 'bold');
    
    const results = {
        errorCorrection: testErrorCorrection(),
        htmlStructure: testHTMLStructure(),
        consistency: testConsistency()
    };
    
    log('\n📊 RÉSUMÉ DES TESTS', 'bold');
    log('═'.repeat(50));
    
    if (results.errorCorrection) {
        logSuccess('Corrections d\'erreur appliquées');
    } else {
        logError('Corrections d\'erreur incomplètes');
    }
    
    if (results.htmlStructure) {
        logSuccess('Structure HTML correcte');
    } else {
        logError('Structure HTML incomplète');
    }
    
    if (results.consistency) {
        logSuccess('Cohérence des fichiers validée');
    } else {
        logError('Problèmes de cohérence détectés');
    }
    
    const allTestsPassed = Object.values(results).every(result => result === true);
    
    if (allTestsPassed) {
        log('\n🎉 TOUTES LES CORRECTIONS SONT APPLIQUÉES !', 'green');
        log('✨ L\'erreur settings.js devrait être corrigée', 'green');
        log('\n📋 PROCHAINES ÉTAPES:', 'bold');
        log('1. Relancer l\'application avec npm start');
        log('2. Ouvrir Settings → Impression');
        log('3. Vérifier qu\'aucune erreur console n\'apparaît');
        log('4. Tester l\'activation/désactivation du paramètre');
    } else {
        log('\n⚠️ Des corrections supplémentaires sont nécessaires', 'red');
        log('Vérifiez les erreurs ci-dessus et corrigez-les');
    }
}

// Exécution
runTests();
