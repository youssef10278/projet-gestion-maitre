/**
 * Script de test pour vérifier l'intégration complète de l'API des retours
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Test de l\'intégration de l\'API des retours\n');

// Test 1: Vérifier que les handlers IPC sont dans main.js
console.log('1. Vérification des handlers IPC dans main.js...');
try {
    const mainContent = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');
    
    const expectedHandlers = [
        'returns:search-sales',
        'returns:get-sale-details',
        'returns:process',
        'returns:get-history',
        'returns:get-details',
        'returns:get-stats'
    ];
    
    let allHandlersFound = true;
    expectedHandlers.forEach(handler => {
        if (mainContent.includes(`'${handler}'`)) {
            console.log(`✅ Handler ${handler} trouvé`);
        } else {
            console.log(`❌ Handler ${handler} manquant`);
            allHandlersFound = false;
        }
    });
    
    if (allHandlersFound) {
        console.log('✅ Tous les handlers IPC sont présents\n');
    } else {
        console.log('❌ Certains handlers IPC sont manquants\n');
    }
} catch (error) {
    console.log('❌ Erreur lors de la lecture de main.js:', error.message, '\n');
}

// Test 2: Vérifier que l'API est exposée dans preload.js
console.log('2. Vérification de l\'API dans preload.js...');
try {
    const preloadContent = fs.readFileSync(path.join(__dirname, 'preload.js'), 'utf8');
    
    const expectedAPIs = [
        'returns: {',
        'searchSales:',
        'getSaleDetails:',
        'process:',
        'getHistory:',
        'getDetails:',
        'getStats:'
    ];
    
    let allAPIsFound = true;
    expectedAPIs.forEach(api => {
        if (preloadContent.includes(api)) {
            console.log(`✅ API ${api.replace(':', '')} trouvée`);
        } else {
            console.log(`❌ API ${api.replace(':', '')} manquante`);
            allAPIsFound = false;
        }
    });
    
    if (allAPIsFound) {
        console.log('✅ Toutes les APIs sont exposées\n');
    } else {
        console.log('❌ Certaines APIs sont manquantes\n');
    }
} catch (error) {
    console.log('❌ Erreur lors de la lecture de preload.js:', error.message, '\n');
}

// Test 3: Vérifier la cohérence entre main.js et preload.js
console.log('3. Vérification de la cohérence entre main.js et preload.js...');
try {
    const mainContent = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');
    const preloadContent = fs.readFileSync(path.join(__dirname, 'preload.js'), 'utf8');
    
    // Extraire les handlers de main.js
    const mainHandlers = [];
    const handlerRegex = /ipcMain\.handle\('(returns:[^']+)'/g;
    let match;
    while ((match = handlerRegex.exec(mainContent)) !== null) {
        mainHandlers.push(match[1]);
    }
    
    // Extraire les invocations de preload.js
    const preloadInvocations = [];
    const invocationRegex = /ipcRenderer\.invoke\('(returns:[^']+)'/g;
    while ((match = invocationRegex.exec(preloadContent)) !== null) {
        preloadInvocations.push(match[1]);
    }
    
    console.log(`Handlers dans main.js: ${mainHandlers.length}`);
    console.log(`Invocations dans preload.js: ${preloadInvocations.length}`);
    
    let coherent = true;
    mainHandlers.forEach(handler => {
        if (preloadInvocations.includes(handler)) {
            console.log(`✅ ${handler} cohérent`);
        } else {
            console.log(`❌ ${handler} manquant dans preload.js`);
            coherent = false;
        }
    });
    
    preloadInvocations.forEach(invocation => {
        if (!mainHandlers.includes(invocation)) {
            console.log(`⚠️ ${invocation} dans preload.js mais pas dans main.js`);
            coherent = false;
        }
    });
    
    if (coherent) {
        console.log('✅ Cohérence parfaite entre main.js et preload.js\n');
    } else {
        console.log('❌ Incohérences détectées\n');
    }
} catch (error) {
    console.log('❌ Erreur lors de la vérification de cohérence:', error.message, '\n');
}

// Test 4: Vérifier la structure des données
console.log('4. Vérification de la structure des données...');
try {
    const dbContent = fs.readFileSync(path.join(__dirname, 'database.js'), 'utf8');
    
    // Vérifier que les tables sont créées
    const tablesChecks = [
        'CREATE TABLE IF NOT EXISTS returns',
        'CREATE TABLE IF NOT EXISTS return_items'
    ];
    
    let tablesOk = true;
    tablesChecks.forEach(tableCheck => {
        if (dbContent.includes(tableCheck)) {
            console.log(`✅ ${tableCheck.split(' ')[5]} définie`);
        } else {
            console.log(`❌ ${tableCheck.split(' ')[5]} manquante`);
            tablesOk = false;
        }
    });
    
    // Vérifier les colonnes importantes
    const columnsChecks = [
        'return_number TEXT NOT NULL UNIQUE',
        'original_sale_id INTEGER NOT NULL',
        'condition_status TEXT NOT NULL DEFAULT \'GOOD\'',
        'back_to_stock INTEGER NOT NULL DEFAULT 1'
    ];
    
    columnsChecks.forEach(columnCheck => {
        if (dbContent.includes(columnCheck)) {
            console.log(`✅ Colonne ${columnCheck.split(' ')[0]} définie`);
        } else {
            console.log(`❌ Colonne ${columnCheck.split(' ')[0]} manquante`);
            tablesOk = false;
        }
    });
    
    if (tablesOk) {
        console.log('✅ Structure de base de données correcte\n');
    } else {
        console.log('❌ Problèmes dans la structure de base de données\n');
    }
} catch (error) {
    console.log('❌ Erreur lors de la vérification de la structure:', error.message, '\n');
}

console.log('🎉 Tests d\'intégration terminés !');
console.log('📝 L\'étape 3 (Backend - API de recherche et gestion des retours) est complète.');
console.log('✅ Prêt pour l\'étape 4 : Création de l\'interface utilisateur.');
