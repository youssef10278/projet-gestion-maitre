/**
 * Test Railway avec le format exact attendu par le serveur
 * Utilise les mêmes données que LicenseManagerElectron
 */

const axios = require('axios');
const crypto = require('crypto');
const os = require('os');
const config = require('./config');

class RailwayCorrectFormatTest {
    constructor() {
        this.serverUrl = config.LICENSE_SERVER_URL;
    }

    async runCorrectFormatTest() {
        console.log('🎯 === TEST RAILWAY AVEC FORMAT CORRECT ===\n');
        console.log('🌐 Serveur:', this.serverUrl);
        console.log('📋 Utilisation du format exact de LicenseManagerElectron');
        console.log('');

        await this.testWithCorrectFormat();
    }

    // Reproduire exactement getMachineInfo() de LicenseManagerElectron
    getMachineInfo() {
        try {
            // Simuler machineIdSync car on n'a pas le vrai module
            const machineId = this.generateMachineId();
            
            // Générer une empreinte matérielle unique (comme dans le code original)
            const hardwareInfo = {
                cpuModel: os.cpus()[0]?.model || 'unknown',
                cpuCount: os.cpus().length,
                totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)), // GB
                platform: os.platform(),
                arch: os.arch(),
                hostname: os.hostname(),
                macAddresses: this.getMacAddresses()
            };

            console.log('🖥️ Hardware Info généré:', JSON.stringify(hardwareInfo, null, 2));

            // Créer une empreinte unique basée sur le matériel
            const hardwareString = JSON.stringify(hardwareInfo);
            const hardwareFingerprint = crypto.createHash('md5').update(hardwareString).digest('hex');
            
            console.log('🔒 Fingerprint généré:', hardwareFingerprint);

            return {
                machineId,
                hardwareFingerprint,
                hardwareInfo
            };
        } catch (error) {
            console.error('❌ Erreur lors de la génération des infos machine:', error);
            throw new Error('Impossible de générer l\'empreinte matérielle');
        }
    }

    // Reproduire getMacAddresses()
    getMacAddresses() {
        try {
            const networkInterfaces = os.networkInterfaces();
            const macAddresses = [];
            
            for (const interfaceName in networkInterfaces) {
                const interfaces = networkInterfaces[interfaceName];
                for (const iface of interfaces) {
                    if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
                        macAddresses.push(iface.mac);
                    }
                }
            }
            
            return [...new Set(macAddresses)]; // Supprimer les doublons
        } catch (error) {
            console.error('❌ Erreur récupération MAC:', error);
            return [];
        }
    }

    // Générer un machine ID simulé
    generateMachineId() {
        const machineInfo = `${os.hostname()}-${os.platform()}-${os.arch()}-${os.cpus()[0]?.model}`;
        return crypto.createHash('sha256').update(machineInfo).digest('hex').substring(0, 32);
    }

    async testWithCorrectFormat() {
        console.log('🔐 === TEST ACTIVATION AVEC FORMAT CORRECT ===\n');

        try {
            // Générer les infos machine exactement comme LicenseManagerElectron
            const machineInfo = this.getMachineInfo();
            
            // Préparer les données exactement comme dans activateLicense()
            const activationData = {
                licenseKey: 'GESTIONPRO-TEST-2025-DEMO',
                machineId: machineInfo.machineId,
                hardwareFingerprint: machineInfo.hardwareFingerprint,
                hardwareInfo: machineInfo.hardwareInfo
            };

            console.log('📤 Données d\'activation (format correct):');
            console.log('   🔑 License Key:', activationData.licenseKey);
            console.log('   🖥️ Machine ID:', activationData.machineId.substring(0, 16) + '...');
            console.log('   🔒 Hardware Fingerprint:', activationData.hardwareFingerprint.substring(0, 16) + '...');
            console.log('   📊 Hardware Info:', Object.keys(activationData.hardwareInfo).join(', '));
            console.log('');

            // Faire la requête exactement comme LicenseManagerElectron
            console.log('📡 Envoi de la requête d\'activation...');
            const response = await axios.post(`${this.serverUrl}/activate`, activationData, {
                timeout: config.REQUEST_TIMEOUT,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `${config.APP_NAME}/${config.APP_VERSION}`
                }
            });

            console.log('✅ ACTIVATION RÉUSSIE !');
            console.log(`📊 Status: ${response.status}`);
            console.log('📄 Réponse complète:');
            console.log(JSON.stringify(response.data, null, 2));

            if (response.data.success) {
                console.log('🎉 LICENCE ACTIVÉE AVEC SUCCÈS !');
                
                // Test de validation avec le même format
                await this.testValidationWithCorrectFormat(machineInfo, activationData.licenseKey);
                
            } else {
                console.log('⚠️ Activation refusée par le serveur');
                console.log(`📝 Message: ${response.data.message}`);
            }

        } catch (error) {
            console.log('❌ ÉCHEC ACTIVATION');
            console.log(`Erreur: ${error.message}`);
            
            if (error.response) {
                console.log(`📊 Status: ${error.response.status}`);
                console.log('📄 Réponse serveur:');
                console.log(JSON.stringify(error.response.data, null, 2));
                
                if (error.response.status === 400) {
                    console.log('');
                    console.log('🔍 ANALYSE ERREUR 400:');
                    console.log('Le serveur rejette encore les données.');
                    console.log('Vérifiez que votre serveur Railway attend exactement ces champs:');
                    console.log('- licenseKey (string)');
                    console.log('- machineId (string)');
                    console.log('- hardwareFingerprint (string)');
                    console.log('- hardwareInfo (object)');
                }
            }
        }
    }

    async testValidationWithCorrectFormat(machineInfo, licenseKey) {
        console.log('\n🔍 === TEST VALIDATION AVEC FORMAT CORRECT ===\n');

        try {
            const validationData = {
                licenseKey: licenseKey,
                machineId: machineInfo.machineId,
                hardwareFingerprint: machineInfo.hardwareFingerprint
            };

            console.log('📤 Données de validation:');
            console.log('   🔑 License Key:', validationData.licenseKey);
            console.log('   🖥️ Machine ID:', validationData.machineId.substring(0, 16) + '...');
            console.log('   🔒 Hardware Fingerprint:', validationData.hardwareFingerprint.substring(0, 16) + '...');
            console.log('');

            const response = await axios.post(`${this.serverUrl}/validate`, validationData, {
                timeout: config.REQUEST_TIMEOUT,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `${config.APP_NAME}/${config.APP_VERSION}`
                }
            });

            console.log('✅ VALIDATION RÉUSSIE !');
            console.log(`📊 Status: ${response.status}`);
            console.log('📄 Réponse:');
            console.log(JSON.stringify(response.data, null, 2));

        } catch (error) {
            console.log('❌ ÉCHEC VALIDATION');
            console.log(`Erreur: ${error.message}`);
            
            if (error.response) {
                console.log(`📊 Status: ${error.response.status}`);
                console.log('📄 Réponse:');
                console.log(JSON.stringify(error.response.data, null, 2));
            }
        }
    }
}

// Exécution du test
if (require.main === module) {
    const tester = new RailwayCorrectFormatTest();
    tester.runCorrectFormatTest().catch(error => {
        console.error('❌ Erreur lors du test:', error.message);
        process.exit(1);
    });
}

module.exports = RailwayCorrectFormatTest;
