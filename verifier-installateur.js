/**
 * Vérificateur d'installateur GestionPro
 * Valide que l'installateur généré est correct et fonctionnel
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 === VÉRIFICATION INSTALLATEUR GESTIONPRO ===\n');

class InstallerVerifier {
    constructor() {
        this.projectRoot = process.cwd();
        this.distDir = path.join(this.projectRoot, 'dist-installer');
        this.packageJson = require('./package.json');
        this.errors = [];
        this.warnings = [];
    }

    async verify() {
        console.log('📋 Informations du projet:');
        console.log(`   Nom: ${this.packageJson.name}`);
        console.log(`   Version: ${this.packageJson.version}`);
        console.log(`   Description: ${this.packageJson.description}`);
        console.log('');

        this.checkDistDirectory();
        this.checkInstallerFile();
        this.checkUnpackedVersion();
        this.checkFileIntegrity();
        this.generateReport();
    }

    checkDistDirectory() {
        console.log('📁 Vérification du dossier de distribution...');
        
        if (!fs.existsSync(this.distDir)) {
            this.errors.push('Dossier dist-installer non trouvé');
            return;
        }

        const files = fs.readdirSync(this.distDir);
        console.log(`   ✅ Dossier trouvé avec ${files.length} fichiers`);
        
        // Lister les fichiers principaux
        files.forEach(file => {
            if (file.endsWith('.exe')) {
                console.log(`   📦 Installateur: ${file}`);
            } else if (file.endsWith('.blockmap')) {
                console.log(`   🗺️ BlockMap: ${file}`);
            } else if (file === 'win-unpacked') {
                console.log(`   📂 Version décompressée: ${file}/`);
            }
        });
        console.log('');
    }

    checkInstallerFile() {
        console.log('🔍 Vérification du fichier installateur...');
        
        const installerPattern = /GestionPro-Installer-v.*\.exe$/;
        const files = fs.readdirSync(this.distDir);
        const installerFiles = files.filter(file => installerPattern.test(file));
        
        if (installerFiles.length === 0) {
            this.errors.push('Aucun fichier installateur .exe trouvé');
            return;
        }

        if (installerFiles.length > 1) {
            this.warnings.push(`Plusieurs installateurs trouvés: ${installerFiles.join(', ')}`);
        }

        const installerFile = installerFiles[0];
        const installerPath = path.join(this.distDir, installerFile);
        const stats = fs.statSync(installerPath);
        
        console.log(`   ✅ Fichier: ${installerFile}`);
        console.log(`   💾 Taille: ${this.formatFileSize(stats.size)}`);
        console.log(`   📅 Créé: ${stats.birthtime.toLocaleString()}`);
        
        // Vérifier la taille (doit être > 100MB pour une app Electron complète)
        if (stats.size < 100 * 1024 * 1024) {
            this.warnings.push(`Taille installateur suspicieusement petite: ${this.formatFileSize(stats.size)}`);
        }
        
        // Vérifier que le fichier n'est pas corrompu (basique)
        try {
            const buffer = fs.readFileSync(installerPath, { start: 0, end: 1024 });
            if (buffer.length < 1024) {
                this.errors.push('Fichier installateur semble corrompu (trop petit)');
            }
        } catch (error) {
            this.errors.push(`Impossible de lire l'installateur: ${error.message}`);
        }
        
        console.log('');
    }

    checkUnpackedVersion() {
        console.log('📂 Vérification de la version décompressée...');
        
        const unpackedDir = path.join(this.distDir, 'win-unpacked');
        if (!fs.existsSync(unpackedDir)) {
            this.warnings.push('Dossier win-unpacked non trouvé');
            return;
        }

        // Vérifier les fichiers essentiels
        const essentialFiles = [
            'GestionPro.exe',
            'resources/app.asar',
            'chrome_100_percent.pak',
            'icudtl.dat'
        ];

        let foundFiles = 0;
        essentialFiles.forEach(file => {
            const filePath = path.join(unpackedDir, file);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ ${file}`);
                foundFiles++;
            } else {
                console.log(`   ❌ ${file} manquant`);
                this.errors.push(`Fichier essentiel manquant: ${file}`);
            }
        });

        // Vérifier le dossier resources
        const resourcesDir = path.join(unpackedDir, 'resources');
        if (fs.existsSync(resourcesDir)) {
            const resourceFiles = fs.readdirSync(resourcesDir);
            console.log(`   📁 Resources: ${resourceFiles.length} fichiers`);
            
            if (resourceFiles.includes('app.asar')) {
                const asarPath = path.join(resourcesDir, 'app.asar');
                const asarStats = fs.statSync(asarPath);
                console.log(`   📦 app.asar: ${this.formatFileSize(asarStats.size)}`);
            }
        }

        console.log(`   ✅ ${foundFiles}/${essentialFiles.length} fichiers essentiels trouvés`);
        console.log('');
    }

    checkFileIntegrity() {
        console.log('🔐 Vérification de l\'intégrité...');
        
        // Vérifier que les fichiers de configuration sont cohérents
        const configFiles = [
            'builder-effective-config.yaml',
            'builder-debug.yml'
        ];

        configFiles.forEach(file => {
            const filePath = path.join(this.distDir, file);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ ${file}`);
            } else {
                this.warnings.push(`Fichier de configuration manquant: ${file}`);
            }
        });

        // Vérifier la cohérence de version
        const installerFiles = fs.readdirSync(this.distDir).filter(f => f.endsWith('.exe'));
        if (installerFiles.length > 0) {
            const installerName = installerFiles[0];
            const versionMatch = installerName.match(/v(\d+\.\d+\.\d+)/);
            if (versionMatch) {
                const installerVersion = versionMatch[1];
                if (installerVersion === this.packageJson.version) {
                    console.log(`   ✅ Version cohérente: ${installerVersion}`);
                } else {
                    this.errors.push(`Version incohérente: package.json=${this.packageJson.version}, installateur=${installerVersion}`);
                }
            }
        }

        console.log('');
    }

    generateReport() {
        console.log('📊 === RAPPORT DE VÉRIFICATION ===\n');
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('🎉 INSTALLATEUR PARFAITEMENT VALIDE !');
            console.log('');
            console.log('✅ Tous les contrôles sont passés avec succès');
            console.log('✅ L\'installateur est prêt pour la distribution');
            console.log('✅ Aucun problème détecté');
        } else {
            if (this.errors.length > 0) {
                console.log('❌ ERREURS CRITIQUES:');
                this.errors.forEach(error => {
                    console.log(`   • ${error}`);
                });
                console.log('');
            }

            if (this.warnings.length > 0) {
                console.log('⚠️ AVERTISSEMENTS:');
                this.warnings.forEach(warning => {
                    console.log(`   • ${warning}`);
                });
                console.log('');
            }

            if (this.errors.length > 0) {
                console.log('🚨 INSTALLATEUR NON RECOMMANDÉ POUR DISTRIBUTION');
                console.log('   Corrigez les erreurs avant de distribuer');
            } else {
                console.log('✅ INSTALLATEUR UTILISABLE');
                console.log('   Les avertissements ne bloquent pas l\'utilisation');
            }
        }

        console.log('');
        console.log('📋 INFORMATIONS INSTALLATEUR:');
        
        const installerFiles = fs.readdirSync(this.distDir).filter(f => f.endsWith('.exe'));
        if (installerFiles.length > 0) {
            const installerPath = path.join(this.distDir, installerFiles[0]);
            const stats = fs.statSync(installerPath);
            
            console.log(`   📦 Nom: ${installerFiles[0]}`);
            console.log(`   💾 Taille: ${this.formatFileSize(stats.size)}`);
            console.log(`   📁 Chemin: ${installerPath}`);
            console.log(`   🎯 Plateforme: Windows x64`);
            console.log(`   📅 Généré: ${stats.birthtime.toLocaleString()}`);
        }

        console.log('');
        console.log('🚀 PROCHAINES ÉTAPES:');
        console.log('   1. Tester l\'installation sur une machine propre');
        console.log('   2. Vérifier le lancement de l\'application');
        console.log('   3. Tester les fonctionnalités principales');
        console.log('   4. Distribuer aux utilisateurs finaux');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Exécution du vérificateur
if (require.main === module) {
    const verifier = new InstallerVerifier();
    verifier.verify().catch(error => {
        console.error('❌ Erreur lors de la vérification:', error.message);
        process.exit(1);
    });
}

module.exports = InstallerVerifier;
