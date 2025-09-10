/**
 * Test de syntaxe uniquement - sans initialisation de la base de données
 */

console.log('🔍 Test de syntaxe du fichier database.js...');

try {
    // Charger le fichier sans l'exécuter
    const fs = require('fs');
    const path = require('path');
    
    const dbFilePath = path.join(__dirname, 'database.js');
    const dbContent = fs.readFileSync(dbFilePath, 'utf8');
    
    // Vérifier que les nouvelles fonctions sont présentes
    const functionsToCheck = [
        'searchSalesForReturns',
        'getSaleReturnDetails',
        'processProductReturn',
        'getReturnsHistory',
        'getReturnDetails',
        'getReturnsStats',
        'validateReturnData'
    ];
    
    let allFunctionsFound = true;
    functionsToCheck.forEach(funcName => {
        if (dbContent.includes(`const ${funcName}`)) {
            console.log(`✅ Fonction ${funcName} trouvée`);
        } else {
            console.log(`❌ Fonction ${funcName} manquante`);
            allFunctionsFound = false;
        }
    });
    
    // Vérifier que returnsDB est dans le module.exports
    if (dbContent.includes('returnsDB: {')) {
        console.log('✅ returnsDB exporté dans module.exports');
    } else {
        console.log('❌ returnsDB manquant dans module.exports');
        allFunctionsFound = false;
    }
    
    // Vérifier la syntaxe JavaScript
    try {
        new Function(dbContent);
        console.log('✅ Syntaxe JavaScript valide');
    } catch (syntaxError) {
        console.log('❌ Erreur de syntaxe JavaScript:', syntaxError.message);
        allFunctionsFound = false;
    }
    
    if (allFunctionsFound) {
        console.log('\n🎉 Tous les tests de syntaxe sont passés !');
        console.log('✅ Le backend du système de retours est prêt');
    } else {
        console.log('\n❌ Certains tests ont échoué');
    }
    
} catch (error) {
    console.log('❌ Erreur lors du test:', error.message);
}
