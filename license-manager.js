const https = require('https');
const os = require('os');
const crypto = require('crypto');

class LicenseManager {
    constructor() {
        this.apiBase = 'https://gestionpro-license-server-production-e0b2.up.railway.app';
        this.licenseKey = null;
        this.machineId = this.generateMachineId();
        this.hardwareFingerprint = this.generateHardwareFingerprint();
    }

    // Générer un ID unique pour cette machine
    generateMachineId() {
        const hostname = os.hostname();
        const platform = os.platform();
        const arch = os.arch();
        return crypto.createHash('md5')
            .update(`${hostname}-${platform}-${arch}`)
            .digest('hex')
            .substring(0, 16)
            .toUpperCase();
    }

    // Générer une empreinte matérielle
    generateHardwareFingerprint() {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        
        const hwInfo = {
            cpuModel: cpus[0]?.model || 'unknown',
            cpuCount: cpus.length,
            totalMemory: totalMem,
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname()
        };
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(hwInfo))
            .digest('hex')
            .substring(0, 32);
    }

    // Faire une requête à l'API
    async makeRequest(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.apiBase + path);
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'GestionPro/1.0'
                },
                timeout: 10000 // 10 secondes timeout
            };

            if (data) {
                const jsonData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(jsonData);
            }

            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve({ status: res.statusCode, data: parsed });
                    } catch (e) {
                        reject(new Error('Réponse invalide du serveur'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Timeout - Serveur de licences indisponible'));
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    // Activer une licence
    async activateLicense(licenseKey) {
        console.log(`🔑 Tentative d'activation de la licence: ${licenseKey}`);
        console.log(`💻 Machine ID: ${this.machineId}`);
        console.log(`🔒 Hardware Fingerprint: ${this.hardwareFingerprint.substring(0, 8)}...`);

        try {
            const response = await this.makeRequest('POST', '/activate', {
                licenseKey: licenseKey,
                machineId: this.machineId,
                hardwareFingerprint: this.hardwareFingerprint,
                timestamp: new Date().toISOString()
            });

            if (response.status === 200 && response.data.success) {
                this.licenseKey = licenseKey;
                console.log('✅ Licence activée avec succès');
                return {
                    success: true,
                    message: 'Licence activée avec succès',
                    data: response.data
                };
            } else {
                console.log(`❌ Échec d'activation: ${response.data.message}`);
                return {
                    success: false,
                    message: response.data.message || 'Erreur d\'activation',
                    data: response.data
                };
            }
        } catch (error) {
            console.error('❌ Erreur de connexion:', error.message);
            return {
                success: false,
                message: 'Erreur de connexion au serveur de licences',
                error: error.message
            };
        }
    }

    // Valider une licence
    async validateLicense(licenseKey = null) {
        const keyToValidate = licenseKey || this.licenseKey;
        
        if (!keyToValidate) {
            return {
                valid: false,
                message: 'Aucune licence à valider'
            };
        }

        try {
            const response = await this.makeRequest('POST', '/validate', {
                licenseKey: keyToValidate,
                machineId: this.machineId,
                hardwareFingerprint: this.hardwareFingerprint
            });

            if (response.status === 200) {
                const isValid = response.data.valid;
                console.log(isValid ? '✅ Licence valide' : '❌ Licence invalide');
                return {
                    valid: isValid,
                    message: response.data.message,
                    data: response.data
                };
            } else {
                return {
                    valid: false,
                    message: response.data.message || 'Erreur de validation'
                };
            }
        } catch (error) {
            console.error('❌ Erreur de validation:', error.message);
            return {
                valid: false,
                message: 'Erreur de connexion au serveur de licences',
                error: error.message
            };
        }
    }

    // Vérifier la santé du serveur
    async checkServerHealth() {
        try {
            const response = await this.makeRequest('GET', '/health');
            const isHealthy = response.status === 200 && response.data.status === 'OK';
            console.log(isHealthy ? '✅ Serveur de licences disponible' : '❌ Serveur de licences indisponible');
            return isHealthy;
        } catch (error) {
            console.error('❌ Serveur de licences indisponible:', error.message);
            return false;
        }
    }

    // Obtenir les informations de la machine
    getMachineInfo() {
        return {
            machineId: this.machineId,
            hardwareFingerprint: this.hardwareFingerprint,
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB'
        };
    }

    // Validation périodique (à appeler régulièrement dans votre app)
    async periodicValidation() {
        if (!this.licenseKey) {
            return { valid: false, message: 'Aucune licence active' };
        }

        const validation = await this.validateLicense();
        
        if (!validation.valid) {
            console.warn('⚠️ Validation périodique échouée - Application sera fermée');
        }
        
        return validation;
    }
}

module.exports = LicenseManager;
