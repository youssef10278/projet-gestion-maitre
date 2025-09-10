/**
 * Diagnostic approfondi du problème Railway
 * Identifie exactement pourquoi ça ne marche pas
 */

const axios = require('axios');
const config = require('./config');

class RailwayDiagnostic {
    constructor() {
        this.serverUrl = config.LICENSE_SERVER_URL;
        this.problems = [];
        this.warnings = [];
        this.infos = [];
    }

    async runDiagnostic() {
        console.log('🔍 === DIAGNOSTIC PROBLÈME RAILWAY ===\n');
        console.log('🎯 Objectif: Identifier pourquoi ça ne marche pas');
        console.log('🌐 URL configurée:', this.serverUrl);
        console.log('');

        await this.checkConfiguration();
        await this.checkNetworkConnectivity();
        await this.checkServerResponse();
        await this.checkApplicationIntegration();
        await this.checkCommonIssues();
        
        this.generateDiagnosticReport();
    }

    async checkConfiguration() {
        console.log('⚙️ === VÉRIFICATION CONFIGURATION ===\n');

        // Vérifier config.js
        console.log('📋 Configuration actuelle:');
        console.log(`   APP_NAME: ${config.APP_NAME}`);
        console.log(`   APP_VERSION: ${config.APP_VERSION}`);
        console.log(`   LICENSE_SERVER_URL: ${config.LICENSE_SERVER_URL}`);
        console.log(`   REQUEST_TIMEOUT: ${config.REQUEST_TIMEOUT}`);
        console.log('');

        // Vérifier l'URL
        if (!this.serverUrl) {
            this.problems.push('LICENSE_SERVER_URL non définie dans config.js');
        } else if (this.serverUrl.includes('localhost')) {
            this.problems.push('LICENSE_SERVER_URL pointe encore vers localhost au lieu de Railway');
        } else if (!this.serverUrl.startsWith('https://')) {
            this.warnings.push('LICENSE_SERVER_URL ne commence pas par https://');
        } else {
            this.infos.push('URL Railway correctement configurée');
        }

        // Vérifier le timeout
        if (config.REQUEST_TIMEOUT < 10000) {
            this.warnings.push('REQUEST_TIMEOUT peut être trop court pour Railway');
        }

        console.log('');
    }

    async checkNetworkConnectivity() {
        console.log('🌐 === VÉRIFICATION CONNECTIVITÉ RÉSEAU ===\n');

        // Test 1: Ping basique avec curl-like
        console.log('🔌 Test connectivité de base...');
        try {
            const response = await axios.get(this.serverUrl, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'GestionPro-Diagnostic/1.0'
                }
            });
            console.log(`   ✅ Connexion établie - Status: ${response.status}`);
            this.infos.push('Connectivité réseau OK');
        } catch (error) {
            console.log(`   ❌ Échec connexion: ${error.message}`);
            if (error.code === 'ENOTFOUND') {
                this.problems.push('DNS: Impossible de résoudre le nom de domaine Railway');
            } else if (error.code === 'ECONNREFUSED') {
                this.problems.push('Connexion refusée: Le serveur Railway ne répond pas');
            } else if (error.code === 'ETIMEDOUT') {
                this.problems.push('Timeout: Le serveur Railway met trop de temps à répondre');
            } else {
                this.problems.push(`Erreur réseau: ${error.message}`);
            }
        }

        // Test 2: Vérification DNS
        console.log('🔍 Test résolution DNS...');
        try {
            const url = new URL(this.serverUrl);
            console.log(`   🌐 Domaine: ${url.hostname}`);
            console.log(`   🔒 Protocole: ${url.protocol}`);
            console.log(`   🚪 Port: ${url.port || (url.protocol === 'https:' ? '443' : '80')}`);
            this.infos.push('URL bien formée');
        } catch (error) {
            this.problems.push(`URL malformée: ${error.message}`);
        }

        console.log('');
    }

    async checkServerResponse() {
        console.log('🖥️ === VÉRIFICATION RÉPONSE SERVEUR ===\n');

        // Test endpoints critiques
        const endpoints = [
            { path: '', name: 'Racine' },
            { path: '/health', name: 'Santé' },
            { path: '/activate', name: 'Activation' }
        ];

        for (const endpoint of endpoints) {
            console.log(`🎯 Test ${endpoint.name} (${endpoint.path || '/'})...`);
            
            try {
                const response = await axios.get(`${this.serverUrl}${endpoint.path}`, {
                    timeout: 15000,
                    validateStatus: () => true // Accepter tous les status codes
                });

                console.log(`   📊 Status: ${response.status}`);
                console.log(`   📄 Content-Type: ${response.headers['content-type'] || 'Non défini'}`);
                
                if (response.status === 200) {
                    console.log(`   ✅ ${endpoint.name} fonctionne`);
                    this.infos.push(`Endpoint ${endpoint.name} opérationnel`);
                } else if (response.status === 404) {
                    console.log(`   ⚠️ ${endpoint.name} non trouvé (404)`);
                    this.warnings.push(`Endpoint ${endpoint.name} non implémenté`);
                } else if (response.status >= 500) {
                    console.log(`   ❌ ${endpoint.name} erreur serveur (${response.status})`);
                    this.problems.push(`Endpoint ${endpoint.name} en erreur serveur`);
                } else {
                    console.log(`   ⚠️ ${endpoint.name} status inattendu (${response.status})`);
                    this.warnings.push(`Endpoint ${endpoint.name} status ${response.status}`);
                }

                // Afficher un échantillon de la réponse
                if (response.data) {
                    const preview = JSON.stringify(response.data).substring(0, 200);
                    console.log(`   📝 Aperçu: ${preview}${preview.length >= 200 ? '...' : ''}`);
                }

            } catch (error) {
                console.log(`   ❌ Erreur: ${error.message}`);
                this.problems.push(`Endpoint ${endpoint.name}: ${error.message}`);
            }
            
            console.log('');
        }
    }

    async checkApplicationIntegration() {
        console.log('🔗 === VÉRIFICATION INTÉGRATION APPLICATION ===\n');

        // Simuler une vraie requête d'activation
        console.log('🔐 Test activation licence réaliste...');
        try {
            const testData = {
                machineId: 'DIAGNOSTIC-TEST-' + Date.now(),
                licenseKey: 'TEST-LICENSE-KEY-12345',
                appVersion: config.APP_VERSION,
                timestamp: new Date().toISOString()
            };

            console.log('   📤 Données envoyées:', JSON.stringify(testData, null, 4));

            const response = await axios.post(`${this.serverUrl}/activate`, testData, {
                timeout: 20000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `${config.APP_NAME}/${config.APP_VERSION}`,
                    'Accept': 'application/json'
                },
                validateStatus: () => true
            });

            console.log(`   📥 Status reçu: ${response.status}`);
            console.log(`   📄 Réponse:`, JSON.stringify(response.data, null, 4));

            if (response.status === 200) {
                this.infos.push('Activation fonctionne correctement');
            } else if (response.status === 400) {
                this.warnings.push('Activation rejette les données de test (normal)');
            } else if (response.status === 404) {
                this.problems.push('Endpoint /activate non trouvé sur Railway');
            } else {
                this.warnings.push(`Activation retourne status ${response.status}`);
            }

        } catch (error) {
            console.log(`   ❌ Erreur activation: ${error.message}`);
            this.problems.push(`Test activation échoué: ${error.message}`);
        }

        console.log('');
    }

    async checkCommonIssues() {
        console.log('🔧 === VÉRIFICATION PROBLÈMES COURANTS ===\n');

        // Vérifier les headers CORS
        console.log('🌐 Test headers CORS...');
        try {
            const response = await axios.options(this.serverUrl, {
                timeout: 10000,
                headers: {
                    'Origin': 'http://localhost',
                    'Access-Control-Request-Method': 'POST'
                }
            });
            console.log('   ✅ CORS configuré');
            this.infos.push('CORS semble configuré');
        } catch (error) {
            console.log('   ⚠️ CORS peut poser problème');
            this.warnings.push('CORS potentiellement mal configuré');
        }

        // Vérifier la persistance
        console.log('🔄 Test persistance serveur...');
        const timestamps = [];
        for (let i = 0; i < 3; i++) {
            try {
                const response = await axios.get(`${this.serverUrl}/health`, { timeout: 5000 });
                if (response.data && response.data.timestamp) {
                    timestamps.push(response.data.timestamp);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                this.warnings.push('Serveur instable lors des tests répétés');
            }
        }

        if (timestamps.length >= 2) {
            const uptime1 = new Date(timestamps[0]);
            const uptime2 = new Date(timestamps[timestamps.length - 1]);
            if (uptime1.getTime() === uptime2.getTime()) {
                this.warnings.push('Serveur semble redémarrer entre les requêtes');
            } else {
                this.infos.push('Serveur stable et persistant');
            }
        }

        console.log('');
    }

    generateDiagnosticReport() {
        console.log('📊 === RAPPORT DE DIAGNOSTIC ===\n');

        console.log(`🔍 Problèmes critiques: ${this.problems.length}`);
        console.log(`⚠️ Avertissements: ${this.warnings.length}`);
        console.log(`ℹ️ Informations: ${this.infos.length}`);
        console.log('');

        if (this.problems.length > 0) {
            console.log('❌ PROBLÈMES CRITIQUES À RÉSOUDRE:');
            this.problems.forEach((problem, index) => {
                console.log(`   ${index + 1}. ${problem}`);
            });
            console.log('');
        }

        if (this.warnings.length > 0) {
            console.log('⚠️ AVERTISSEMENTS:');
            this.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
            console.log('');
        }

        if (this.infos.length > 0) {
            console.log('✅ POINTS POSITIFS:');
            this.infos.forEach((info, index) => {
                console.log(`   ${index + 1}. ${info}`);
            });
            console.log('');
        }

        // Recommandations
        console.log('🔧 RECOMMANDATIONS:');
        
        if (this.problems.length === 0) {
            console.log('🎉 Aucun problème critique détecté !');
            console.log('💡 Le problème peut être dans l\'application elle-même');
            console.log('');
            console.log('🔍 VÉRIFICATIONS SUPPLÉMENTAIRES:');
            console.log('1. Vérifiez les logs de votre application GestionPro');
            console.log('2. Vérifiez que l\'application utilise bien la bonne URL');
            console.log('3. Testez l\'activation depuis l\'interface utilisateur');
            console.log('4. Vérifiez les permissions et pare-feu locaux');
        } else {
            console.log('🚨 Problèmes détectés - Actions requises:');
            console.log('');
            
            if (this.problems.some(p => p.includes('DNS') || p.includes('ENOTFOUND'))) {
                console.log('🌐 PROBLÈME DNS/RÉSEAU:');
                console.log('   - Vérifiez votre connexion internet');
                console.log('   - Vérifiez que l\'URL Railway est correcte');
                console.log('   - Testez l\'URL dans un navigateur web');
            }
            
            if (this.problems.some(p => p.includes('404') || p.includes('non trouvé'))) {
                console.log('🎯 PROBLÈME ENDPOINTS:');
                console.log('   - Vérifiez que votre serveur Railway a tous les endpoints');
                console.log('   - Redéployez votre code sur Railway');
                console.log('   - Vérifiez les logs Railway pour les erreurs');
            }
            
            if (this.problems.some(p => p.includes('timeout') || p.includes('ETIMEDOUT'))) {
                console.log('⏱️ PROBLÈME TIMEOUT:');
                console.log('   - Augmentez REQUEST_TIMEOUT dans config.js');
                console.log('   - Vérifiez les performances de Railway');
                console.log('   - Testez depuis un autre réseau');
            }
        }

        console.log('');
        console.log('📞 SUPPORT SUPPLÉMENTAIRE:');
        console.log('1. Vérifiez les logs Railway Dashboard');
        console.log('2. Testez l\'URL directement dans un navigateur');
        console.log('3. Vérifiez les variables d\'environnement Railway');
        console.log('4. Redéployez si nécessaire');
    }
}

// Exécution du diagnostic
if (require.main === module) {
    const diagnostic = new RailwayDiagnostic();
    diagnostic.runDiagnostic().catch(error => {
        console.error('❌ Erreur lors du diagnostic:', error.message);
        process.exit(1);
    });
}

module.exports = RailwayDiagnostic;
