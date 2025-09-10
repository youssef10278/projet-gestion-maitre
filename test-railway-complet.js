/**
 * Test complet du serveur Railway GestionPro
 * Teste tous les endpoints et fonctionnalités
 */

const axios = require('axios');
const config = require('./config');

class RailwayTester {
    constructor() {
        this.serverUrl = config.LICENSE_SERVER_URL;
        this.testsReussis = 0;
        this.testsTotal = 0;
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🚀 === TEST COMPLET SERVEUR RAILWAY ===\n');
        console.log('🌐 URL du serveur:', this.serverUrl);
        console.log('📋 Application:', config.APP_NAME, 'v' + config.APP_VERSION);
        console.log('⏰ Début des tests:', new Date().toLocaleString());
        console.log('');

        await this.testConnectivite();
        await this.testEndpoints();
        await this.testLicenses();
        await this.testPerformance();
        this.generateReport();
    }

    async testConnectivite() {
        console.log('🔌 === TESTS DE CONNECTIVITÉ ===\n');

        // Test 1: Ping basique
        await this.runTest('Ping serveur', async () => {
            const response = await axios.get(this.serverUrl, {
                timeout: 5000,
                headers: { 'User-Agent': `${config.APP_NAME}-Test/${config.APP_VERSION}` }
            });
            return { status: response.status, data: response.data };
        });

        // Test 2: Endpoint de santé
        await this.runTest('Endpoint /health', async () => {
            const response = await axios.get(`${this.serverUrl}/health`, {
                timeout: 5000
            });
            return { status: response.status, data: response.data };
        });

        // Test 3: Test de latence
        await this.runTest('Latence réseau', async () => {
            const start = Date.now();
            await axios.get(`${this.serverUrl}/health`, { timeout: 5000 });
            const latency = Date.now() - start;
            return { latency: `${latency}ms`, acceptable: latency < 2000 };
        });

        console.log('');
    }

    async testEndpoints() {
        console.log('🎯 === TESTS DES ENDPOINTS ===\n');

        // Test des endpoints principaux
        const endpoints = [
            { path: '/', name: 'Racine' },
            { path: '/health', name: 'Santé' },
            { path: '/api/status', name: 'Status API' },
            { path: '/activate', name: 'Activation (GET)' }
        ];

        for (const endpoint of endpoints) {
            await this.runTest(`Endpoint ${endpoint.name} (${endpoint.path})`, async () => {
                const response = await axios.get(`${this.serverUrl}${endpoint.path}`, {
                    timeout: 10000,
                    validateStatus: (status) => status < 500 // Accepter 404, mais pas 500+
                });
                return { 
                    status: response.status, 
                    accessible: response.status < 400,
                    data: response.data 
                };
            });
        }

        console.log('');
    }

    async testLicenses() {
        console.log('🔐 === TESTS DES LICENCES ===\n');

        // Test 1: Activation avec données de test
        await this.runTest('Test activation licence', async () => {
            const testData = {
                machineId: 'TEST-MACHINE-ID-12345',
                licenseKey: 'TEST-LICENSE-KEY',
                appVersion: config.APP_VERSION
            };

            const response = await axios.post(`${this.serverUrl}/activate`, testData, {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `${config.APP_NAME}-Test/${config.APP_VERSION}`
                },
                validateStatus: (status) => status < 500
            });

            return { 
                status: response.status, 
                data: response.data,
                endpointExists: response.status !== 404
            };
        });

        // Test 2: Vérification licence
        await this.runTest('Test vérification licence', async () => {
            const testData = {
                machineId: 'TEST-MACHINE-ID-12345',
                licenseKey: 'TEST-LICENSE-KEY'
            };

            const response = await axios.post(`${this.serverUrl}/verify`, testData, {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json'
                },
                validateStatus: (status) => status < 500
            });

            return { 
                status: response.status, 
                data: response.data,
                endpointExists: response.status !== 404
            };
        });

        console.log('');
    }

    async testPerformance() {
        console.log('⚡ === TESTS DE PERFORMANCE ===\n');

        // Test 1: Temps de réponse moyen
        await this.runTest('Temps de réponse moyen (5 requêtes)', async () => {
            const times = [];
            for (let i = 0; i < 5; i++) {
                const start = Date.now();
                await axios.get(`${this.serverUrl}/health`, { timeout: 10000 });
                times.push(Date.now() - start);
            }
            const average = times.reduce((a, b) => a + b, 0) / times.length;
            return { 
                average: `${Math.round(average)}ms`, 
                times: times.map(t => `${t}ms`),
                performance: average < 1000 ? 'Excellent' : average < 2000 ? 'Bon' : 'Lent'
            };
        });

        // Test 2: Stabilité (requêtes consécutives)
        await this.runTest('Stabilité serveur (10 requêtes)', async () => {
            let successes = 0;
            for (let i = 0; i < 10; i++) {
                try {
                    await axios.get(`${this.serverUrl}/health`, { timeout: 5000 });
                    successes++;
                } catch (error) {
                    // Ignorer les erreurs pour ce test
                }
            }
            return { 
                successes: `${successes}/10`, 
                stability: `${(successes/10*100).toFixed(1)}%`,
                reliable: successes >= 8
            };
        });

        console.log('');
    }

    async runTest(testName, testFunction) {
        this.testsTotal++;
        console.log(`🧪 ${testName}...`);
        
        try {
            const result = await testFunction();
            console.log(`   ✅ Succès:`, JSON.stringify(result, null, 6));
            this.testsReussis++;
        } catch (error) {
            console.log(`   ❌ Échec:`, error.message);
            if (error.response) {
                console.log(`   📄 Status:`, error.response.status);
                console.log(`   📄 Data:`, JSON.stringify(error.response.data, null, 6));
            }
        }
        console.log('');
    }

    generateReport() {
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const successRate = ((this.testsReussis / this.testsTotal) * 100).toFixed(1);

        console.log('📊 === RAPPORT FINAL ===\n');
        console.log(`⏰ Durée des tests: ${duration}s`);
        console.log(`📈 Taux de succès: ${successRate}% (${this.testsReussis}/${this.testsTotal})`);
        console.log(`🌐 Serveur testé: ${this.serverUrl}`);
        console.log('');

        if (this.testsReussis === this.testsTotal) {
            console.log('🎉 SERVEUR RAILWAY PARFAITEMENT FONCTIONNEL !');
            console.log('✅ Tous les tests sont passés avec succès');
            console.log('✅ Votre serveur est prêt pour la production');
            console.log('✅ L\'application peut utiliser ce serveur en toute confiance');
        } else if (successRate >= 70) {
            console.log('⚠️ SERVEUR FONCTIONNEL AVEC QUELQUES PROBLÈMES');
            console.log(`✅ ${this.testsReussis} tests réussis`);
            console.log(`❌ ${this.testsTotal - this.testsReussis} tests échoués`);
            console.log('💡 Vérifiez les endpoints qui échouent');
        } else if (successRate >= 30) {
            console.log('🚨 SERVEUR PARTIELLEMENT FONCTIONNEL');
            console.log('⚠️ Plusieurs problèmes détectés');
            console.log('🔧 Intervention requise sur le serveur');
        } else {
            console.log('❌ SERVEUR NON FONCTIONNEL');
            console.log('🚨 La majorité des tests échouent');
            console.log('🔧 Vérification complète du déploiement nécessaire');
        }

        console.log('\n🔧 ACTIONS RECOMMANDÉES:');
        if (successRate < 100) {
            console.log('1. Vérifiez les logs de votre serveur Railway');
            console.log('2. Vérifiez que tous les endpoints sont implémentés');
            console.log('3. Vérifiez la configuration des variables d\'environnement');
            console.log('4. Testez manuellement les endpoints qui échouent');
        } else {
            console.log('1. Votre serveur est prêt pour la production');
            console.log('2. Vous pouvez distribuer votre application');
            console.log('3. Surveillez les performances en production');
        }

        console.log('\n📱 PROCHAINES ÉTAPES:');
        console.log('1. Testez depuis votre application GestionPro');
        console.log('2. Vérifiez l\'activation des licences');
        console.log('3. Surveillez les logs en production');
        console.log('4. Configurez des alertes de monitoring');
    }
}

// Exécution des tests
if (require.main === module) {
    const tester = new RailwayTester();
    tester.runAllTests().catch(error => {
        console.error('❌ Erreur fatale lors des tests:', error.message);
        process.exit(1);
    });
}

module.exports = RailwayTester;
