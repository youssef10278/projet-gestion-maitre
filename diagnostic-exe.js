const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 DIAGNOSTIC GÉNÉRATION EXE');
console.log('=' .repeat(50));

function runCommand(command, description) {
    try {
        console.log(`\n📋 ${description}...`);
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ ${description} - OK`);
        return result.trim();
    } catch (error) {
        console.log(`❌ ${description} - ERREUR`);
        console.log(`   ${error.message}`);
        return null;
    }
}

function checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${description}: ${filePath} (${stats.size} bytes)`);
        return true;
    } else {
        console.log(`❌ ${description}: ${filePath} - MANQUANT`);
        return false;
    }
}

function diagnostic() {
    console.log('\n🔍 VÉRIFICATION DE L\'ENVIRONNEMENT');
    console.log('-' .repeat(40));
    
    // Vérifier Node.js
    const nodeVersion = runCommand('node --version', 'Version Node.js');
    
    // Vérifier npm
    const npmVersion = runCommand('npm --version', 'Version npm');
    
    // Vérifier electron
    const electronVersion = runCommand('npx electron --version', 'Version Electron');
    
    // Vérifier electron-builder
    const builderVersion = runCommand('npx electron-builder --version', 'Version Electron Builder');
    
    console.log('\n📁 VÉRIFICATION DES FICHIERS REQUIS');
    console.log('-' .repeat(40));
    
    // Fichiers principaux
    checkFile('./package.json', 'Configuration package.json');
    checkFile('./main.js', 'Fichier principal main.js');
    checkFile('./src/index.html', 'Interface principale');
    checkFile('./database/main.db', 'Base de données');
    
    // Dossiers
    checkFile('./node_modules', 'Dossier node_modules');
    checkFile('./src', 'Dossier source');
    
    console.log('\n📦 VÉRIFICATION DE LA CONFIGURATION BUILD');
    console.log('-' .repeat(40));
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        
        if (packageJson.build) {
            console.log('✅ Configuration build présente');
            console.log(`   App ID: ${packageJson.build.appId || 'Non défini'}`);
            console.log(`   Product Name: ${packageJson.build.productName || 'Non défini'}`);
            console.log(`   Output Dir: ${packageJson.build.directories?.output || 'dist'}`);
        } else {
            console.log('❌ Configuration build manquante');
        }
        
        if (packageJson.main) {
            console.log(`✅ Point d'entrée: ${packageJson.main}`);
        } else {
            console.log('❌ Point d\'entrée manquant');
        }
        
    } catch (error) {
        console.log('❌ Erreur lecture package.json:', error.message);
    }
    
    console.log('\n🔍 RECHERCHE D\'INSTALLATEURS EXISTANTS');
    console.log('-' .repeat(40));
    
    const searchDirs = ['dist', 'dist-installer', 'build', 'out'];
    let foundExe = false;
    
    for (const dir of searchDirs) {
        if (fs.existsSync(dir)) {
            console.log(`📁 Dossier ${dir} trouvé`);
            try {
                const files = fs.readdirSync(dir);
                const exeFiles = files.filter(f => f.endsWith('.exe'));
                if (exeFiles.length > 0) {
                    console.log(`🎯 Fichiers .exe trouvés dans ${dir}:`);
                    exeFiles.forEach(exe => {
                        const fullPath = path.join(dir, exe);
                        const stats = fs.statSync(fullPath);
                        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                        console.log(`   📄 ${exe} (${sizeMB} MB)`);
                        foundExe = true;
                    });
                }
            } catch (error) {
                console.log(`   ❌ Erreur lecture dossier: ${error.message}`);
            }
        }
    }
    
    if (!foundExe) {
        console.log('❌ Aucun fichier .exe trouvé');
    }
    
    console.log('\n💡 RECOMMANDATIONS');
    console.log('-' .repeat(40));
    
    if (!nodeVersion) {
        console.log('🔧 Installez Node.js depuis https://nodejs.org/');
    }
    
    if (!electronVersion) {
        console.log('🔧 Installez Electron: npm install electron --save-dev');
    }
    
    if (!builderVersion) {
        console.log('🔧 Installez Electron Builder: npm install electron-builder --save-dev');
    }
    
    if (!foundExe) {
        console.log('🔧 Pour générer l\'installateur:');
        console.log('   1. Double-cliquez sur GENERER-EXE-MAINTENANT.bat');
        console.log('   2. Ou exécutez: npm run dist');
        console.log('   3. Ou exécutez: npx electron-builder --win');
    }
    
    console.log('\n🎯 COMMANDES UTILES');
    console.log('-' .repeat(40));
    console.log('npm install                    - Installer les dépendances');
    console.log('npm run build-css             - Construire le CSS');
    console.log('npm run rebuild               - Reconstruire les modules');
    console.log('npm run dist                  - Générer l\'installateur');
    console.log('npx electron-builder --win    - Génération directe');
}

if (require.main === module) {
    diagnostic();
}

module.exports = { diagnostic };
