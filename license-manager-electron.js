const axios = require('axios');
const crypto = require('crypto');
const os = require('os');
const { machineIdSync } = require('node-machine-id');
const config = require('./config');

class LicenseManagerElectron {
    constructor() {
        this.serverUrl = config.LICENSE_SERVER_URL;
        this.timeout = 10000; // 10 secondes
    }

    // Obtenir les informations de la machine
    getMachineInfo() {
        try {
            const machineId = machineIdSync({ original: true });
            
            // Générer une empreinte matérielle unique
            const hardwareInfo = {
                cpuModel: os.cpus()[0]?.model || 'unknown',
                cpuCount: os.cpus().length,
                totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)), // GB
                platform: os.platform(),
                arch: os.arch(),
                hostname: os.hostname(),
                macAddresses: this.getMacAddresses()
            };

            console.log('🖥️ Hardware Info pour fingerprint:', JSON.stringify(hardwareInfo, null, 2));

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

    // Obtenir les adresses MAC
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
            console.error('❌ Erreur lors de la récupération des MAC:', error);
            return [];
        }
    }

    // Faire une requête HTTP au serveur
    async makeRequest(method, endpoint, data = null) {
        try {
            const config = {
                method,
                url: `${this.serverUrl}${endpoint}`,
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'GestionPro-License-Client/1.0'
                }
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return response;
        } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                throw new Error('Serveur de licences indisponible. Vérifiez votre connexion internet.');
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('Timeout de connexion au serveur de licences.');
            } else if (error.response) {
                throw new Error(error.response.data?.message || 'Erreur serveur');
            } else {
                throw new Error('Erreur de connexion: ' + error.message);
            }
        }
    }

    // Vérifier la santé du serveur
    async checkServerHealth() {
        try {
            const response = await this.makeRequest('GET', '/health');
            return response.status === 200;
        } catch (error) {
            console.log('⚠️ Serveur indisponible:', error.message);
            return false;
        }
    }

    // Activer une licence
    async activateLicense(licenseKey) {
        try {
            console.log('🔄 Activation licence:', licenseKey);
            
            const machineInfo = this.getMachineInfo();
            console.log('🖥️ Machine ID:', machineInfo.machineId);
            console.log('🔒 Hardware Fingerprint:', machineInfo.hardwareFingerprint.substring(0, 8) + '...');

            // Vérifier d'abord la santé du serveur
            const serverOk = await this.checkServerHealth();
            if (!serverOk) {
                throw new Error('Serveur de licences indisponible');
            }
            console.log('✅ Serveur disponible');

            const response = await this.makeRequest('POST', '/activate', {
                licenseKey,
                machineId: machineInfo.machineId,
                hardwareFingerprint: machineInfo.hardwareFingerprint,
                hardwareInfo: machineInfo.hardwareInfo
            });

            if (response.data.success) {
                console.log('✅ Licence activée avec succès');
                return {
                    success: true,
                    message: response.data.message || 'Licence activée avec succès'
                };
            } else {
                console.log('❌ Activation échouée:', response.data.message);
                return {
                    success: false,
                    message: response.data.message || 'Activation échouée'
                };
            }
        } catch (error) {
            console.error('❌ Erreur activation:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Valider une licence (utilisé uniquement lors de l'activation - pas de validation périodique)
    async validateLicense(licenseKey) {
        try {
            console.log('🔍 Validation licence:', licenseKey);
            
            const machineInfo = this.getMachineInfo();

            const response = await this.makeRequest('POST', '/validate', {
                licenseKey,
                machineId: machineInfo.machineId,
                hardwareFingerprint: machineInfo.hardwareFingerprint
            });

            if (response.data.valid) {
                console.log('✅ Licence valide');
                return {
                    valid: true,
                    message: response.data.message || 'Licence valide'
                };
            } else {
                console.log('❌ Licence invalide:', response.data.message);
                return {
                    valid: false,
                    message: response.data.message || 'Licence invalide'
                };
            }
        } catch (error) {
            console.error('❌ Erreur validation:', error.message);
            return {
                valid: false,
                message: error.message
            };
        }
    }
}

module.exports = LicenseManagerElectron;
