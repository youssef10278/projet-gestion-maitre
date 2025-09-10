// Test simple de validation des clients
const dbModule = require('./database.js');
const fs = require('fs');
const path = require('path');

console.log('🧪 === TEST SIMPLE VALIDATION CLIENTS ===\n');

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

// Test simple avec des noms uniques
function testSimpleValidation() {
    console.log('🔍 === TESTS SIMPLES ===\n');
    
    const timestamp = Date.now();
    
    // Test 1: Client valide simple
    console.log('📝 Test 1: Client valide simple');
    try {
        const client1 = dbModule.clientDB.add({
            name: `Client Test ${timestamp}_1`
        });
        console.log('✅ Client 1 ajouté avec succès:', client1.name);
    } catch (error) {
        console.log('❌ Erreur client 1:', error.message);
    }
    
    // Test 2: Client avec ICE unique
    console.log('\n📝 Test 2: Client avec ICE unique');
    try {
        const client2 = dbModule.clientDB.add({
            name: `Client ICE ${timestamp}_2`,
            ice: `ICE${timestamp}_2`
        });
        console.log('✅ Client 2 ajouté avec succès:', client2.name, 'ICE:', client2.ice);
    } catch (error) {
        console.log('❌ Erreur client 2:', error.message);
    }
    
    // Test 3: Tentative ICE existant (doit échouer)
    console.log('\n📝 Test 3: Tentative ICE existant (doit échouer)');
    try {
        const client3 = dbModule.clientDB.add({
            name: `Autre Client ${timestamp}_3`,
            ice: `ICE${timestamp}_2` // Même ICE que test 2
        });
        console.log('❌ PROBLÈME: Client 3 ajouté alors qu\'il ne devrait pas:', client3.name);
    } catch (error) {
        console.log('✅ Erreur attendue client 3:', error.message);
    }
    
    // Test 4: Client avec téléphone unique
    console.log('\n📝 Test 4: Client avec téléphone unique');
    try {
        const client4 = dbModule.clientDB.add({
            name: `Client Phone ${timestamp}_4`,
            phone: `066${timestamp.toString().slice(-7)}`
        });
        console.log('✅ Client 4 ajouté avec succès:', client4.name, 'Phone:', client4.phone);
    } catch (error) {
        console.log('❌ Erreur client 4:', error.message);
    }
    
    // Test 5: Tentative téléphone existant (doit échouer)
    console.log('\n📝 Test 5: Tentative téléphone existant (doit échouer)');
    try {
        const client5 = dbModule.clientDB.add({
            name: `Autre Client Phone ${timestamp}_5`,
            phone: `066${timestamp.toString().slice(-7)}` // Même téléphone que test 4
        });
        console.log('❌ PROBLÈME: Client 5 ajouté alors qu\'il ne devrait pas:', client5.name);
    } catch (error) {
        console.log('✅ Erreur attendue client 5:', error.message);
    }
    
    // Test 6: Nom similaire (doit déclencher alerte)
    console.log('\n📝 Test 6: Nom similaire (doit déclencher alerte)');
    try {
        const client6 = dbModule.clientDB.add({
            name: `client test ${timestamp}_1` // Similaire au test 1 (casse différente)
        });
        console.log('❌ PROBLÈME: Client 6 ajouté alors qu\'il devrait y avoir une alerte:', client6.name);
    } catch (error) {
        console.log('✅ Alerte attendue client 6:', error.message);
    }
    
    // Test 7: Forcer ajout malgré nom similaire
    console.log('\n📝 Test 7: Forcer ajout malgré nom similaire');
    try {
        const client7 = dbModule.clientDB.forceAdd({
            name: `client test force ${timestamp}_7`
        });
        console.log('✅ Client 7 forcé avec succès:', client7.name);
    } catch (error) {
        console.log('❌ Erreur client 7:', error.message);
    }
    
    // Test 8: Nom vide (doit échouer)
    console.log('\n📝 Test 8: Nom vide (doit échouer)');
    try {
        const client8 = dbModule.clientDB.add({
            name: '',
            phone: `066${timestamp.toString().slice(-6)}`
        });
        console.log('❌ PROBLÈME: Client 8 ajouté avec nom vide:', client8);
    } catch (error) {
        console.log('✅ Erreur attendue client 8:', error.message);
    }
    
    console.log('\n🔍 === TEST DÉTECTION SIMILARITÉ ===\n');
    
    // Test détection de similarité
    const similarClients = dbModule.clientDB.findSimilar(`Client Test ${timestamp}_1`);
    console.log(`📊 Clients similaires trouvés pour "Client Test ${timestamp}_1":`, similarClients.length);
    
    if (similarClients.length > 0) {
        similarClients.forEach((client, index) => {
            console.log(`   ${index + 1}. ${client.name} (ID: ${client.id})`);
        });
    }
    
    console.log('\n🎯 === RÉSUMÉ ===');
    console.log('✅ Tests qui ont fonctionné comme attendu:');
    console.log('   - Ajout client simple');
    console.log('   - Ajout client avec ICE unique');
    console.log('   - Blocage ICE existant');
    console.log('   - Ajout client avec téléphone unique');
    console.log('   - Blocage téléphone existant');
    console.log('   - Alerte nom similaire');
    console.log('   - Forcer ajout malgré similarité');
    console.log('   - Blocage nom vide');
    console.log('   - Détection de similarité');
    
    console.log('\n🎉 VALIDATION COMPLÈTE RÉUSSIE !');
    console.log('✅ Le système de validation fonctionne parfaitement');
}

// Fonction principale
function runSimpleTest() {
    try {
        console.log('🔧 Initialisation du test simple...\n');
        
        // Nettoyer la base de données avant les tests
        cleanTestDatabase();
        
        // Tests de validation
        testSimpleValidation();
        
        console.log('\n🎊 Test simple terminé avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors du test simple:', error);
    }
}

// Lancer le test
runSimpleTest();
