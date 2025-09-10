const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 Génération EXE GestionPro - Version Ultra-Simplifiée');
console.log('=' .repeat(60));

// Configuration
const tempDir = path.join(os.tmpdir(), 'gestionpro-build');

function executeCommand(command, description, options = {}) {
    console.log(`\n📋 ${description}...`);
    try {
        const result = execSync(command, { 
            stdio: options.silent ? 'pipe' : 'inherit', 
            cwd: __dirname,
            encoding: 'utf8',
            ...options
        });
        console.log(`✅ ${description} - OK`);
        return result;
    } catch (error) {
        if (!options.allowFail) {
            console.error(`❌ Erreur: ${description}`);
            throw error;
        }
        console.warn(`⚠️  ${description} - Ignoré`);
        return null;
    }
}

function nettoyageComplet() {
    console.log('\n🧹 Nettoyage complet...');
    
    // Tuer tous les processus electron
    try {
        executeCommand('taskkill /f /im electron.exe', 'Arrêt processus Electron', { allowFail: true, silent: true });
        executeCommand('taskkill /f /im GestionPro.exe', 'Arrêt processus GestionPro', { allowFail: true, silent: true });
    } catch (e) {}
    
    // Supprimer les dossiers de build
    const dirsToClean = ['dist', 'dist-installer', 'build'];
    dirsToClean.forEach(dir => {
        if (fs.existsSync(dir)) {
            try {
                fs.rmSync(dir, { recursive: true, force: true });
                console.log(`🗑️  ${dir} supprimé`);
            } catch (e) {
                console.warn(`⚠️  Impossible de supprimer ${dir}`);
            }
        }
    });
    
    // Nettoyer le cache
    try {
        executeCommand('npm cache clean --force', 'Nettoyage cache npm', { allowFail: true });
    } catch (e) {}
    
    // Supprimer le cache electron-builder
    const electronBuilderCache = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'Cache');
    if (fs.existsSync(electronBuilderCache)) {
        try {
            fs.rmSync(electronBuilderCache, { recursive: true, force: true });
            console.log('🗑️  Cache Electron Builder supprimé');
        } catch (e) {
            console.warn('⚠️  Cache Electron Builder non supprimé');
        }
    }
}

function verifierPrerequisites() {
    console.log('\n🔍 Vérification des prérequis...');
    
    // Vérifier Node.js
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Node.js: ${nodeVersion}`);
    } catch (e) {
        throw new Error('Node.js non trouvé');
    }
    
    // Vérifier npm
    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        console.log(`✅ npm: ${npmVersion}`);
    } catch (e) {
        throw new Error('npm non trouvé');
    }
    
    // Vérifier les fichiers essentiels
    const requiredFiles = ['main.js', 'package.json', 'src/index.html'];
    requiredFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            throw new Error(`Fichier manquant: ${file}`);
        }
    });
    
    console.log('✅ Tous les prérequis OK');
}

function preparerEnvironnement() {
    console.log('\n📦 Préparation de l\'environnement...');
    
    // Réinstaller les dépendances
    executeCommand('npm install', 'Installation des dépendances');
    
    // Construire le CSS
    try {
        executeCommand('npm run build-css', 'Construction CSS', { allowFail: true });
    } catch (e) {
        console.warn('⚠️  CSS non construit - on continue');
    }
    
    // Créer le dossier build avec une icône par défaut
    if (!fs.existsSync('build')) {
        fs.mkdirSync('build', { recursive: true });
    }
}

function genererExecutable() {
    console.log('\n🏗️  Génération de l\'exécutable...');
    console.log('⏳ Cela peut prendre 5-10 minutes...');
    
    // Méthode 1: Essayer avec electron-builder standard
    try {
        executeCommand('npx electron-builder --win --x64', 'Génération avec Electron Builder');
        return true;
    } catch (error1) {
        console.warn('⚠️  Méthode 1 échouée, essai méthode 2...');
        
        // Méthode 2: Forcer la configuration
        try {
            executeCommand('npx electron-builder --win --x64 --config.win.sign=false --config.nsis.differentialPackage=false', 'Génération forcée');
            return true;
        } catch (error2) {
            console.warn('⚠️  Méthode 2 échouée, essai méthode 3...');
            
            // Méthode 3: Génération en mode dir puis nsis
            try {
                executeCommand('npx electron-builder --win --x64 --dir', 'Génération répertoire');
                executeCommand('npx electron-builder --win --x64 --prepackaged dist/win-unpacked', 'Création installateur');
                return true;
            } catch (error3) {
                console.error('❌ Toutes les méthodes ont échoué');
                return false;
            }
        }
    }
}

function verifierResultat() {
    console.log('\n🔍 Vérification du résultat...');
    
    const possibleDirs = ['dist', 'dist-installer'];
    let installerFound = false;
    
    for (const dir of possibleDirs) {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const exeFile = files.find(file => file.endsWith('.exe'));
            
            if (exeFile) {
                const fullPath = path.join(dir, exeFile);
                const stats = fs.statSync(fullPath);
                const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                
                console.log(`✅ Installateur trouvé: ${exeFile}`);
                console.log(`📏 Taille: ${sizeInMB} MB`);
                console.log(`📁 Emplacement: ${path.resolve(fullPath)}`);
                
                // Ouvrir le dossier
                try {
                    execSync(`start "" "${path.resolve(dir)}"`, { stdio: 'ignore' });
                    console.log('📂 Dossier ouvert automatiquement');
                } catch (e) {
                    console.log(`📂 Ouvrez manuellement: ${path.resolve(dir)}`);
                }
                
                installerFound = true;
                break;
            }
        }
    }
    
    if (!installerFound) {
        throw new Error('Aucun installateur .exe trouvé');
    }
    
    return true;
}

// Fonction principale
async function main() {
    try {
        console.log('🎯 Début de la génération...\n');
        
        // Étapes de génération
        nettoyageComplet();
        verifierPrerequisites();
        preparerEnvironnement();
        
        const success = genererExecutable();
        if (!success) {
            throw new Error('Échec de la génération');
        }
        
        verifierResultat();
        
        console.log('\n🎉 SUCCÈS! Installateur .exe généré!');
        console.log('=' .repeat(60));
        console.log('\n🚀 INSTRUCTIONS:');
        console.log('1. Testez l\'installateur sur cette machine');
        console.log('2. Copiez le .exe sur une clé USB');
        console.log('3. Installez sur l\'ordinateur cible');
        console.log('4. Lancez GestionPro depuis le menu Démarrer');
        
    } catch (error) {
        console.error('\n💥 ERREUR:', error.message);
        console.log('\n🔧 Solutions à essayer:');
        console.log('1. Exécutez en tant qu\'administrateur');
        console.log('2. Désactivez temporairement l\'antivirus');
        console.log('3. Libérez de l\'espace disque (minimum 2GB)');
        console.log('4. Redémarrez l\'ordinateur et réessayez');
        process.exit(1);
    }
}

// Lancement
if (require.main === module) {
    main();
}
