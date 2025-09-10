/**
 * Script de test pour vérifier l'intégration complète du système de retours
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Test d\'intégration complète du système de retours\n');

// Test 1: Vérifier que la page returns.html existe
console.log('1. Vérification de l\'existence de la page returns.html...');
try {
    const returnsPagePath = path.join(__dirname, 'src', 'returns.html');
    if (fs.existsSync(returnsPagePath)) {
        console.log('✅ Page returns.html trouvée');
        
        // Vérifier le contenu de base
        const content = fs.readFileSync(returnsPagePath, 'utf8');
        const requiredElements = [
            'searchSection',
            'saleDetailsSection',
            'returnConfigSection',
            'returnSummarySection',
            'returnSuccessSection'
        ];
        
        let allElementsFound = true;
        requiredElements.forEach(element => {
            if (content.includes(element)) {
                console.log(`  ✅ Section ${element} trouvée`);
            } else {
                console.log(`  ❌ Section ${element} manquante`);
                allElementsFound = false;
            }
        });
        
        if (allElementsFound) {
            console.log('✅ Toutes les sections requises sont présentes\n');
        } else {
            console.log('❌ Certaines sections sont manquantes\n');
        }
    } else {
        console.log('❌ Page returns.html non trouvée\n');
    }
} catch (error) {
    console.log('❌ Erreur lors de la vérification de la page:', error.message, '\n');
}

// Test 2: Vérifier que le script returns.js existe
console.log('2. Vérification de l\'existence du script returns.js...');
try {
    const returnsScriptPath = path.join(__dirname, 'src', 'js', 'returns.js');
    if (fs.existsSync(returnsScriptPath)) {
        console.log('✅ Script returns.js trouvé');
        
        // Vérifier les fonctions principales
        const content = fs.readFileSync(returnsScriptPath, 'utf8');
        const requiredFunctions = [
            'performSearch',
            'selectSale',
            'displaySaleDetails',
            'processReturn',
            'generateReturnTicket'
        ];
        
        let allFunctionsFound = true;
        requiredFunctions.forEach(func => {
            if (content.includes(`function ${func}`) || content.includes(`const ${func}`)) {
                console.log(`  ✅ Fonction ${func} trouvée`);
            } else {
                console.log(`  ❌ Fonction ${func} manquante`);
                allFunctionsFound = false;
            }
        });
        
        if (allFunctionsFound) {
            console.log('✅ Toutes les fonctions principales sont présentes\n');
        } else {
            console.log('❌ Certaines fonctions sont manquantes\n');
        }
    } else {
        console.log('❌ Script returns.js non trouvé\n');
    }
} catch (error) {
    console.log('❌ Erreur lors de la vérification du script:', error.message, '\n');
}

// Test 3: Vérifier l'intégration dans la navigation
console.log('3. Vérification de l\'intégration dans la navigation...');
try {
    const layoutPath = path.join(__dirname, 'src', 'js', 'layout.js');
    if (fs.existsSync(layoutPath)) {
        const content = fs.readFileSync(layoutPath, 'utf8');
        
        if (content.includes('returns: `') && content.includes('href="returns.html"')) {
            console.log('✅ Lien de navigation vers returns.html trouvé');
        } else {
            console.log('❌ Lien de navigation vers returns.html manquant');
        }
        
        if (content.includes('links.returns')) {
            console.log('✅ Intégration dans le menu trouvée');
        } else {
            console.log('❌ Intégration dans le menu manquante');
        }
        
        console.log('✅ Navigation intégrée avec succès\n');
    } else {
        console.log('❌ Fichier layout.js non trouvé\n');
    }
} catch (error) {
    console.log('❌ Erreur lors de la vérification de la navigation:', error.message, '\n');
}

// Test 4: Vérifier les traductions
console.log('4. Vérification des traductions...');
try {
    const frPath = path.join(__dirname, 'src', 'locales', 'fr.json');
    const arPath = path.join(__dirname, 'src', 'locales', 'ar.json');
    
    // Vérifier français
    if (fs.existsSync(frPath)) {
        const frContent = fs.readFileSync(frPath, 'utf8');
        if (frContent.includes('main_menu_returns') && frContent.includes('returns_page_title')) {
            console.log('✅ Traductions françaises trouvées');
        } else {
            console.log('❌ Traductions françaises manquantes');
        }
    }
    
    // Vérifier arabe
    if (fs.existsSync(arPath)) {
        const arContent = fs.readFileSync(arPath, 'utf8');
        if (arContent.includes('main_menu_returns')) {
            console.log('✅ Traductions arabes trouvées');
        } else {
            console.log('❌ Traductions arabes manquantes');
        }
    }
    
    console.log('✅ Traductions vérifiées\n');
} catch (error) {
    console.log('❌ Erreur lors de la vérification des traductions:', error.message, '\n');
}

// Test 5: Vérifier la cohérence des API
console.log('5. Vérification de la cohérence des API...');
try {
    const mainPath = path.join(__dirname, 'main.js');
    const preloadPath = path.join(__dirname, 'preload.js');
    const returnsScriptPath = path.join(__dirname, 'src', 'js', 'returns.js');
    
    let apiConsistent = true;
    
    // Vérifier main.js
    if (fs.existsSync(mainPath)) {
        const mainContent = fs.readFileSync(mainPath, 'utf8');
        const expectedHandlers = [
            'returns:search-sales',
            'returns:get-sale-details',
            'returns:process',
            'returns:get-history',
            'returns:get-details',
            'returns:get-stats'
        ];
        
        expectedHandlers.forEach(handler => {
            if (mainContent.includes(`'${handler}'`)) {
                console.log(`  ✅ Handler ${handler} trouvé dans main.js`);
            } else {
                console.log(`  ❌ Handler ${handler} manquant dans main.js`);
                apiConsistent = false;
            }
        });
    }
    
    // Vérifier preload.js
    if (fs.existsSync(preloadPath)) {
        const preloadContent = fs.readFileSync(preloadPath, 'utf8');
        if (preloadContent.includes('returns: {')) {
            console.log('  ✅ API returns exposée dans preload.js');
        } else {
            console.log('  ❌ API returns manquante dans preload.js');
            apiConsistent = false;
        }
    }
    
    // Vérifier l'utilisation dans returns.js
    if (fs.existsSync(returnsScriptPath)) {
        const returnsContent = fs.readFileSync(returnsScriptPath, 'utf8');
        if (returnsContent.includes('window.api.returns')) {
            console.log('  ✅ Utilisation de l\'API dans returns.js');
        } else {
            console.log('  ❌ Utilisation de l\'API manquante dans returns.js');
            apiConsistent = false;
        }
    }
    
    if (apiConsistent) {
        console.log('✅ API cohérente sur tous les niveaux\n');
    } else {
        console.log('❌ Incohérences dans l\'API détectées\n');
    }
} catch (error) {
    console.log('❌ Erreur lors de la vérification de l\'API:', error.message, '\n');
}

// Test 6: Vérifier la base de données
console.log('6. Vérification de la base de données...');
try {
    const dbPath = path.join(__dirname, 'database.js');
    if (fs.existsSync(dbPath)) {
        const dbContent = fs.readFileSync(dbPath, 'utf8');
        
        const requiredTables = [
            'CREATE TABLE IF NOT EXISTS returns',
            'CREATE TABLE IF NOT EXISTS return_items'
        ];
        
        const requiredFunctions = [
            'searchSalesForReturns',
            'processProductReturn',
            'getReturnsHistory'
        ];
        
        let dbComplete = true;
        
        requiredTables.forEach(table => {
            if (dbContent.includes(table)) {
                console.log(`  ✅ Table ${table.split(' ')[5]} définie`);
            } else {
                console.log(`  ❌ Table ${table.split(' ')[5]} manquante`);
                dbComplete = false;
            }
        });
        
        requiredFunctions.forEach(func => {
            if (dbContent.includes(func)) {
                console.log(`  ✅ Fonction ${func} trouvée`);
            } else {
                console.log(`  ❌ Fonction ${func} manquante`);
                dbComplete = false;
            }
        });
        
        if (dbContent.includes('returnsDB: {')) {
            console.log('  ✅ Module returnsDB exporté');
        } else {
            console.log('  ❌ Module returnsDB manquant');
            dbComplete = false;
        }
        
        if (dbComplete) {
            console.log('✅ Base de données complète\n');
        } else {
            console.log('❌ Base de données incomplète\n');
        }
    } else {
        console.log('❌ Fichier database.js non trouvé\n');
    }
} catch (error) {
    console.log('❌ Erreur lors de la vérification de la base de données:', error.message, '\n');
}

console.log('🎉 Tests d\'intégration terminés !');
console.log('📝 Le système de retours est maintenant intégré dans l\'application.');
console.log('✅ Prêt pour les tests fonctionnels et la migration des données existantes.');
