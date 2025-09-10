const axios = require('axios');
const config = require('./config');

async function testServeurRailway() {
    console.log('🔍 === TEST CONNEXION SERVEUR RAILWAY ===\n');

    const serverUrl = config.LICENSE_SERVER_URL;

    console.log('🌐 URL testée:', serverUrl);
    console.log('📋 Configuration actuelle:', config.APP_NAME, 'v' + config.APP_VERSION);
    console.log('⏳ Test de connexion...\n');

    let testsReussis = 0;
    let testsTotal = 0;
    
    try {
        // Test 1: Endpoint de santé
        console.log('1️⃣ Test endpoint /health...');
        testsTotal++;
        try {
            const healthResponse = await axios.get(`${serverUrl}/health`, {
                timeout: config.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': `${config.APP_NAME}-Test/${config.APP_VERSION}`
                }
            });
            console.log('✅ /health - Status:', healthResponse.status);
            console.log('📄 Réponse:', JSON.stringify(healthResponse.data, null, 2));
            testsReussis++;
        } catch (error) {
            console.log('❌ /health - Erreur:', error.message);
            if (error.response) {
                console.log('📄 Status:', error.response.status);
                console.log('📄 Data:', JSON.stringify(error.response.data, null, 2));
            }
        }
        
        console.log('\n2️⃣ Test endpoint racine /...');
        testsTotal++;
        try {
            const rootResponse = await axios.get(serverUrl, {
                timeout: config.REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': `${config.APP_NAME}-Test/${config.APP_VERSION}`
                }
            });
            console.log('✅ / - Status:', rootResponse.status);
            console.log('📄 Réponse:', JSON.stringify(rootResponse.data, null, 2));
            testsReussis++;
        } catch (error) {
            console.log('❌ / - Erreur:', error.message);
            if (error.response) {
                console.log('📄 Status:', error.response.status);
                console.log('📄 Data:', JSON.stringify(error.response.data, null, 2));
            }
        }
        
        console.log('\n3️⃣ Test endpoint /activate...');
        try {
            const activateResponse = await axios.post(`${serverUrl}/activate`, {
                licenseKey: 'TEST-KEY-123',
                machineId: 'test-machine',
                hardwareFingerprint: 'test-fingerprint'
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'GestionPro-Test/1.0'
                }
            });
            console.log('✅ /activate - Status:', activateResponse.status);
            console.log('📄 Réponse:', activateResponse.data);
        } catch (error) {
            console.log('❌ /activate - Erreur:', error.message);
            if (error.response) {
                console.log('📄 Status:', error.response.status);
                console.log('📄 Data:', error.response.data);
            }
        }
        
    } catch (error) {
        console.log('❌ Erreur générale:', error.message);
    }

    // Rapport final
    console.log('\n📊 === RAPPORT FINAL ===');
    console.log(`✅ Tests réussis: ${testsReussis}/${testsTotal}`);

    if (testsReussis === testsTotal) {
        console.log('🎉 SERVEUR RAILWAY PARFAITEMENT FONCTIONNEL !');
        console.log('✅ Tous les endpoints répondent correctement');
        console.log('✅ Votre application peut utiliser ce serveur');
    } else if (testsReussis > 0) {
        console.log('⚠️ SERVEUR PARTIELLEMENT FONCTIONNEL');
        console.log(`✅ ${testsReussis} test(s) réussi(s)`);
        console.log(`❌ ${testsTotal - testsReussis} test(s) échoué(s)`);
    } else {
        console.log('❌ SERVEUR NON FONCTIONNEL');
        console.log('🚨 Aucun endpoint ne répond correctement');
    }

    console.log('\n🔧 SOLUTIONS POSSIBLES:');
    console.log('1. Vérifiez que votre serveur Railway est déployé et actif');
    console.log('2. Vérifiez l\'URL dans config.js');
    console.log('3. Vérifiez que les endpoints /health et /activate existent');
    console.log('4. Vérifiez votre connexion internet');
    console.log('5. Vérifiez les logs de votre serveur Railway');

    console.log('\n💡 POUR CORRIGER:');
    console.log('- Remplacez l\'URL dans config.js par la vraie URL de votre serveur');
    console.log('- Assurez-vous que votre serveur Railway répond aux endpoints requis');
    console.log('\n🌐 URL actuelle configurée:', serverUrl);
}

testServeurRailway().catch(console.error);
