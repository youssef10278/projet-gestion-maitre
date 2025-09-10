// Test de validation des clients
const dbModule = require('./database.js');
const fs = require('fs');
const path = require('path');

console.log('🧪 === TEST VALIDATION CLIENTS ===\n');

// Nettoyer la base de données de test
function cleanTestDatabase() {
    console.log('🧹 Nettoyage de la base de données de test...');

    try {
        // Supprimer le fichier de base de données s'il existe
        const dbPath = path.join(__dirname, 'gestion.db');
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('   ✅ Ancienne base supprimée');
        }

        // Réinitialiser la base de données
        dbModule.initDatabase();
        console.log('   ✅ Nouvelle base initialisée');
        console.log('   ✅ Base de données prête pour les tests\n');

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
        throw error;
    }
}

// Fonction pour mesurer le temps d'exécution
function measureTime(label, fn) {
    const start = Date.now();
    try {
        const result = fn();
        const end = Date.now();
        const duration = end - start;
        console.log(`⏱️  ${label}: ${duration}ms - ✅ Succès`);
        return { result, duration, success: true };
    } catch (error) {
        const end = Date.now();
        const duration = end - start;
        console.log(`⏱️  ${label}: ${duration}ms - ❌ ${error.message}`);
        return { result: null, duration, success: false, error: error.message };
    }
}

// Test des validations
function testClientValidation() {
    console.log('🔍 === TESTS DE VALIDATION ===\n');
    
    // Test 1: Client valide (nom seulement)
    console.log('📝 Test 1: Client valide avec nom seulement');
    const test1 = measureTime('Ajout client nom seul', () => {
        return dbModule.clientDB.add({
            name: 'Test Client Valide'
        });
    });
    
    // Test 2: Client avec ICE unique
    console.log('\n📝 Test 2: Client avec ICE unique');
    const test2 = measureTime('Ajout client avec ICE', () => {
        return dbModule.clientDB.add({
            name: 'Test Client ICE',
            ice: 'ICE123456789'
        });
    });
    
    // Test 3: Tentative d'ajout avec même ICE (doit échouer)
    console.log('\n📝 Test 3: Tentative ICE existant (doit échouer)');
    const test3 = measureTime('Ajout client ICE existant', () => {
        return dbModule.clientDB.add({
            name: 'Autre Client',
            ice: 'ICE123456789' // Même ICE que test 2
        });
    });
    
    // Test 4: Client avec téléphone unique
    console.log('\n📝 Test 4: Client avec téléphone unique');
    const test4 = measureTime('Ajout client avec téléphone', () => {
        return dbModule.clientDB.add({
            name: 'Test Client Phone',
            phone: '0661234567'
        });
    });
    
    // Test 5: Tentative d'ajout avec même téléphone (doit échouer)
    console.log('\n📝 Test 5: Tentative téléphone existant (doit échouer)');
    const test5 = measureTime('Ajout client téléphone existant', () => {
        return dbModule.clientDB.add({
            name: 'Autre Client Phone',
            phone: '0661234567' // Même téléphone que test 4
        });
    });
    
    // Test 6: Client avec nom similaire (doit déclencher alerte)
    console.log('\n📝 Test 6: Client nom similaire (doit déclencher alerte)');
    const test6 = measureTime('Ajout client nom similaire', () => {
        return dbModule.clientDB.add({
            name: 'test client valide' // Similaire au test 1
        });
    });
    
    // Test 7: Forcer l'ajout malgré nom similaire
    console.log('\n📝 Test 7: Forcer ajout malgré nom similaire');
    const test7 = measureTime('Forcer ajout client', () => {
        return dbModule.clientDB.forceAdd({
            name: 'test client valide force'
        });
    });
    
    // Test 8: Client avec tous les champs
    console.log('\n📝 Test 8: Client complet');
    const test8 = measureTime('Ajout client complet', () => {
        return dbModule.clientDB.add({
            name: 'Client Complet',
            phone: '0612345678',
            ice: 'ICE987654321',
            address: 'Adresse complète'
        });
    });
    
    // Test 9: Validation avec champs vides
    console.log('\n📝 Test 9: Client avec champs vides (doit être nettoyé)');
    const test9 = measureTime('Ajout client champs vides', () => {
        return dbModule.clientDB.add({
            name: 'Client Champs Vides',
            phone: '',
            ice: '   ',
            address: null
        });
    });
    
    // Test 10: Nom vide (doit échouer)
    console.log('\n📝 Test 10: Nom vide (doit échouer)');
    const test10 = measureTime('Ajout client nom vide', () => {
        return dbModule.clientDB.add({
            name: '',
            phone: '0623456789'
        });
    });
    
    return {
        test1, test2, test3, test4, test5, 
        test6, test7, test8, test9, test10
    };
}

// Test de recherche de noms similaires
function testSimilarNameDetection() {
    console.log('\n🔍 === TESTS DÉTECTION NOMS SIMILAIRES ===\n');
    
    // Ajouter quelques clients de test
    const testClients = [
        { name: 'Mohamed Alami', phone: '0661111111', ice: 'ICE111' },
        { name: 'MOHAMED ALAMI', phone: '0661111112', ice: 'ICE112' },
        { name: 'mohamed alami', phone: '0661111113', ice: 'ICE113' },
        { name: 'Mohammed Alami', phone: '0661111114', ice: 'ICE114' },
        { name: 'Ahmed Bennani', phone: '0661111115', ice: 'ICE115' }
    ];
    
    console.log('📝 Ajout de clients de test...');
    testClients.forEach((client, index) => {
        try {
            dbModule.clientDB.forceAdd(client);
            console.log(`✅ Client ${index + 1} ajouté: ${client.name}`);
        } catch (error) {
            console.log(`❌ Erreur client ${index + 1}: ${error.message}`);
        }
    });
    
    console.log('\n🔍 Tests de détection...');
    
    // Test détection exacte
    const similar1 = measureTime('Détection "Mohamed Alami"', () => {
        return dbModule.clientDB.findSimilar('Mohamed Alami');
    });
    
    // Test détection casse différente
    const similar2 = measureTime('Détection "MOHAMED ALAMI"', () => {
        return dbModule.clientDB.findSimilar('MOHAMED ALAMI');
    });
    
    // Test détection avec accents
    const similar3 = measureTime('Détection "Mohamèd Alami"', () => {
        return dbModule.clientDB.findSimilar('Mohamèd Alami');
    });
    
    // Test aucune similarité
    const similar4 = measureTime('Détection "Client Inexistant"', () => {
        return dbModule.clientDB.findSimilar('Client Inexistant');
    });
    
    console.log('\n📊 Résultats détection:');
    if (similar1.success) console.log(`   - "Mohamed Alami": ${similar1.result.length} similaires trouvés`);
    if (similar2.success) console.log(`   - "MOHAMED ALAMI": ${similar2.result.length} similaires trouvés`);
    if (similar3.success) console.log(`   - "Mohamèd Alami": ${similar3.result.length} similaires trouvés`);
    if (similar4.success) console.log(`   - "Client Inexistant": ${similar4.result.length} similaires trouvés`);
    
    return { similar1, similar2, similar3, similar4 };
}

// Analyser les résultats
function analyzeResults(validationResults, similarityResults) {
    console.log('\n📈 === ANALYSE DES RÉSULTATS ===\n');
    
    const allTests = Object.values(validationResults);
    const successCount = allTests.filter(test => test.success).length;
    const errorCount = allTests.filter(test => !test.success).length;
    
    console.log(`📊 Résultats globaux:`);
    console.log(`   - Tests réussis: ${successCount}/${allTests.length}`);
    console.log(`   - Tests échoués: ${errorCount}/${allTests.length}`);
    
    console.log('\n✅ Tests qui DOIVENT réussir:');
    const shouldSucceed = [
        { test: validationResults.test1, name: 'Client nom seul' },
        { test: validationResults.test2, name: 'Client avec ICE unique' },
        { test: validationResults.test4, name: 'Client avec téléphone unique' },
        { test: validationResults.test7, name: 'Forcer ajout nom similaire' },
        { test: validationResults.test8, name: 'Client complet' },
        { test: validationResults.test9, name: 'Client champs vides nettoyés' }
    ];
    
    shouldSucceed.forEach(({ test, name }) => {
        console.log(`   ${test.success ? '✅' : '❌'} ${name}`);
    });
    
    console.log('\n❌ Tests qui DOIVENT échouer:');
    const shouldFail = [
        { test: validationResults.test3, name: 'ICE existant', expectedError: 'ICE_EXISTS' },
        { test: validationResults.test5, name: 'Téléphone existant', expectedError: 'PHONE_EXISTS' },
        { test: validationResults.test6, name: 'Nom similaire', expectedError: 'SIMILAR_NAME_FOUND' },
        { test: validationResults.test10, name: 'Nom vide', expectedError: 'VALIDATION_ERROR' }
    ];
    
    shouldFail.forEach(({ test, name, expectedError }) => {
        const hasExpectedError = test.error && test.error.includes(expectedError);
        console.log(`   ${!test.success && hasExpectedError ? '✅' : '❌'} ${name} (${test.error || 'Pas d\'erreur'})`);
    });
    
    console.log('\n🔍 Détection de similarité:');
    const similarityTests = Object.values(similarityResults);
    const avgDetectionTime = similarityTests.reduce((sum, test) => sum + test.duration, 0) / similarityTests.length;
    console.log(`   - Temps moyen de détection: ${avgDetectionTime.toFixed(1)}ms`);
    
    // Évaluation finale
    const criticalFailures = shouldSucceed.filter(({ test }) => !test.success).length +
                           shouldFail.filter(({ test, expectedError }) => test.success || !test.error?.includes(expectedError)).length;
    
    console.log('\n🎯 ÉVALUATION FINALE:');
    if (criticalFailures === 0) {
        console.log('🎉 EXCELLENT ! Toutes les validations fonctionnent correctement');
        console.log('✅ Le système de validation est prêt pour la production');
    } else {
        console.log(`⚠️  ${criticalFailures} problème(s) détecté(s)`);
        console.log('🔧 Des corrections sont nécessaires avant la mise en production');
    }
}

// Fonction principale
function runClientValidationTest() {
    try {
        console.log('🔧 Initialisation des tests...\n');

        // Nettoyer la base de données avant les tests
        cleanTestDatabase();

        // Tests de validation
        const validationResults = testClientValidation();
        
        // Tests de détection de similarité
        const similarityResults = testSimilarNameDetection();
        
        // Analyse des résultats
        analyzeResults(validationResults, similarityResults);
        
        console.log('\n🎊 Tests de validation terminés !');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests de validation:', error);
    }
}

// Lancer les tests
runClientValidationTest();
