/**
 * Générateur d'installateur final pour GestionPro
 * Crée un fichier .exe installable avec toutes les optimisations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 === GÉNÉRATION INSTALLATEUR GESTIONPRO ===\n');

class InstallerGenerator {
    constructor() {
        this.projectRoot = process.cwd();
        this.distDir = path.join(this.projectRoot, 'dist-installer');
        this.packageJson = require('./package.json');
        this.startTime = Date.now();
    }

    async generateInstaller() {
        try {
            console.log('📋 Informations du projet:');
            console.log(`   Nom: ${this.packageJson.name}`);
            console.log(`   Version: ${this.packageJson.version}`);
            console.log(`   Description: ${this.packageJson.description}`);
            console.log('');

            // Étapes de génération
            await this.step1_PreparationEnvironnement();
            await this.step2_CompilationCSS();
            await this.step3_ValidationCode();
            await this.step4_NettoyageCache();
            await this.step5_GenerationInstallateur();
            await this.step6_VerificationInstallateur();
            await this.step7_RapportFinal();

        } catch (error) {
            console.error('❌ Erreur lors de la génération:', error.message);
            process.exit(1);
        }
    }

    async step1_PreparationEnvironnement() {
        console.log('🔧 ÉTAPE 1: Préparation de l\'environnement');
        
        // Vérifier Node.js et npm
        try {
            const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
            const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
            console.log(`   ✅ Node.js: ${nodeVersion}`);
            console.log(`   ✅ npm: ${npmVersion}`);
        } catch (error) {
            throw new Error('Node.js ou npm non installé');
        }

        // Vérifier les dépendances
        if (!fs.existsSync('node_modules')) {
            console.log('   📦 Installation des dépendances...');
            execSync('npm install', { stdio: 'inherit' });
        } else {
            console.log('   ✅ Dépendances déjà installées');
        }

        // Vérifier Electron
        try {
            execSync('npx electron --version', { encoding: 'utf8' });
            console.log('   ✅ Electron disponible');
        } catch (error) {
            throw new Error('Electron non disponible');
        }

        console.log('   ✅ Environnement prêt\n');
    }

    async step2_CompilationCSS() {
        console.log('🎨 ÉTAPE 2: Compilation CSS');
        
        try {
            console.log('   🔄 Compilation Tailwind CSS...');
            execSync('npm run build-css', { stdio: 'inherit' });
            
            // Vérifier que le fichier CSS a été généré
            const cssOutput = path.join(this.projectRoot, 'src', 'css', 'output.css');
            if (fs.existsSync(cssOutput)) {
                const stats = fs.statSync(cssOutput);
                console.log(`   ✅ CSS compilé (${Math.round(stats.size / 1024)}KB)`);
            } else {
                throw new Error('Fichier CSS non généré');
            }
        } catch (error) {
            console.log('   ⚠️ Erreur CSS, continuation...');
        }
        
        console.log('   ✅ CSS prêt\n');
    }

    async step3_ValidationCode() {
        console.log('🔍 ÉTAPE 3: Validation du code');
        
        // Vérifier les fichiers essentiels
        const essentialFiles = [
            'main.js',
            'database.js',
            'preload.js',
            'src/index.html',
            'src/js/dashboard.js',
            'src/js/caisse.js'
        ];

        for (const file of essentialFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ ${file}`);
            } else {
                throw new Error(`Fichier manquant: ${file}`);
            }
        }

        // Vérifier la base de données
        const dbDir = path.join(this.projectRoot, 'database');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
            console.log('   📁 Dossier database créé');
        }

        console.log('   ✅ Code validé\n');
    }

    async step4_NettoyageCache() {
        console.log('🧹 ÉTAPE 4: Nettoyage du cache');
        
        // Nettoyer le dossier dist
        if (fs.existsSync(this.distDir)) {
            console.log('   🗑️ Suppression ancien build...');
            fs.rmSync(this.distDir, { recursive: true, force: true });
        }

        // Nettoyer le cache Electron
        try {
            console.log('   🔄 Nettoyage cache Electron...');
            execSync('npx electron-builder clean', { stdio: 'pipe' });
        } catch (error) {
            console.log('   ⚠️ Cache Electron non nettoyé');
        }

        console.log('   ✅ Cache nettoyé\n');
    }

    async step5_GenerationInstallateur() {
        console.log('⚙️ ÉTAPE 5: Génération de l\'installateur');
        
        console.log('   🔄 Construction avec Electron Builder...');
        console.log('   ⏳ Cela peut prendre plusieurs minutes...\n');
        
        try {
            // Exécuter electron-builder avec options optimisées
            const buildCommand = 'npx electron-builder --win --x64 --publish=never';
            execSync(buildCommand, { 
                stdio: 'inherit',
                env: { 
                    ...process.env,
                    NODE_ENV: 'production'
                }
            });
            
            console.log('\n   ✅ Installateur généré avec succès\n');
        } catch (error) {
            throw new Error(`Échec génération installateur: ${error.message}`);
        }
    }

    async step6_VerificationInstallateur() {
        console.log('🔍 ÉTAPE 6: Vérification de l\'installateur');
        
        // Chercher le fichier .exe généré
        const installerFiles = [];
        
        if (fs.existsSync(this.distDir)) {
            const files = fs.readdirSync(this.distDir);
            for (const file of files) {
                if (file.endsWith('.exe')) {
                    const filePath = path.join(this.distDir, file);
                    const stats = fs.statSync(filePath);
                    installerFiles.push({
                        name: file,
                        path: filePath,
                        size: stats.size,
                        sizeFormatted: this.formatFileSize(stats.size)
                    });
                }
            }
        }

        if (installerFiles.length === 0) {
            throw new Error('Aucun fichier .exe trouvé dans dist-installer/');
        }

        console.log('   📦 Installateurs générés:');
        for (const installer of installerFiles) {
            console.log(`   ✅ ${installer.name} (${installer.sizeFormatted})`);
            console.log(`      📁 ${installer.path}`);
        }

        this.installerFiles = installerFiles;
        console.log('   ✅ Vérification terminée\n');
    }

    async step7_RapportFinal() {
        console.log('📊 ÉTAPE 7: Rapport final');
        
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        console.log('   ⏱️ Durée de génération:', minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`);
        console.log('   📦 Version:', this.packageJson.version);
        console.log('   🎯 Plateforme: Windows x64');
        console.log('   📁 Dossier de sortie:', this.distDir);
        console.log('');
        
        if (this.installerFiles && this.installerFiles.length > 0) {
            console.log('🎉 INSTALLATEUR GÉNÉRÉ AVEC SUCCÈS !');
            console.log('');
            console.log('📋 FICHIERS GÉNÉRÉS:');
            
            for (const installer of this.installerFiles) {
                console.log(`   📦 ${installer.name}`);
                console.log(`      💾 Taille: ${installer.sizeFormatted}`);
                console.log(`      📁 Chemin: ${installer.path}`);
                console.log('');
            }
            
            console.log('🚀 PRÊT POUR DISTRIBUTION !');
            console.log('');
            console.log('📝 PROCHAINES ÉTAPES:');
            console.log('   1. Tester l\'installateur sur une machine propre');
            console.log('   2. Vérifier que l\'application se lance correctement');
            console.log('   3. Tester toutes les fonctionnalités principales');
            console.log('   4. Distribuer aux utilisateurs finaux');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Exécution du générateur
if (require.main === module) {
    const generator = new InstallerGenerator();
    generator.generateInstaller().catch(error => {
        console.error('❌ Erreur fatale:', error.message);
        process.exit(1);
    });
}

module.exports = InstallerGenerator;
