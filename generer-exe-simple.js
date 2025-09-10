const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Génération simplifiée de l\'installateur GestionPro v2.1.0');
console.log('=' .repeat(60));

// Fonction pour exécuter des commandes avec gestion d'erreurs
function executeCommand(command, description) {
    console.log(`\n📋 ${description}...`);
    try {
        const result = execSync(command, { 
            stdio: 'inherit', 
            cwd: __dirname,
            encoding: 'utf8'
        });
        console.log(`✅ ${description} - Terminé avec succès`);
        return result;
    } catch (error) {
        console.error(`❌ Erreur lors de ${description}:`);
        console.error(error.message);
        throw error;
    }
}

// Fonction pour nettoyer le cache electron-builder
function nettoyerCache() {
    console.log('\n🧹 Nettoyage du cache electron-builder...');
    
    try {
        // Nettoyer le cache npm
        executeCommand('npm cache clean --force', 'Nettoyage du cache npm');
        
        // Supprimer le cache electron-builder
        const cacheDir = path.join(require('os').homedir(), 'AppData', 'Local', 'electron-builder', 'Cache');
        if (fs.existsSync(cacheDir)) {
            fs.rmSync(cacheDir, { recursive: true, force: true });
            console.log('🗑️  Cache electron-builder supprimé');
        }
        
        // Supprimer les dossiers de build
        const buildDirs = ['dist', 'dist-installer', 'build'];
        for (const dir of buildDirs) {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
                console.log(`🗑️  Dossier ${dir} supprimé`);
            }
        }
        
    } catch (error) {
        console.warn('⚠️  Erreur lors du nettoyage:', error.message);
    }
}

// Fonction principale
async function genererInstallateur() {
    try {
        console.log('🎯 Début de la génération simplifiée...\n');
        
        // Étape 1: Nettoyage complet
        nettoyerCache();
        
        // Étape 2: Réinstallation des dépendances
        console.log('\n📦 Réinstallation des dépendances...');
        executeCommand('npm install', 'Installation des dépendances');
        
        // Étape 3: Construction du CSS
        console.log('\n🎨 Construction du CSS...');
        try {
            executeCommand('npm run build-css', 'Construction du CSS');
        } catch (error) {
            console.warn('⚠️  Erreur CSS - on continue...');
        }
        
        // Étape 4: Génération avec electron-builder en mode simple
        console.log('\n🏗️  Génération de l\'installateur (mode simple)...');
        console.log('⏳ Cela peut prendre 5-10 minutes...');
        
        // Utiliser electron-builder directement avec des options simplifiées
        executeCommand('npx electron-builder --win --x64 --config.win.sign=false --config.win.verifyUpdateCodeSignature=false', 'Génération de l\'installateur');
        
        // Étape 5: Vérification du résultat
        verifierResultat();
        
        console.log('\n🎉 SUCCÈS! L\'installateur a été généré avec succès!');
        console.log('=' .repeat(60));
        afficherInformationsInstallateur();
        
    } catch (error) {
        console.error('\n💥 ERREUR lors de la génération:');
        console.error(error.message);
        
        console.log('\n🔧 Essayons une méthode encore plus simple...');
        try {
            // Méthode de secours : génération portable
            console.log('\n📦 Génération d\'une version portable...');
            executeCommand('npx electron-builder --win --x64 --config.win.target=dir', 'Génération version portable');
            
            console.log('\n✅ Version portable générée dans dist-installer/win-unpacked/');
            console.log('💡 Vous pouvez compresser ce dossier en ZIP pour distribution');
            
        } catch (fallbackError) {
            console.error('\n💥 Échec complet de la génération');
            console.log('\n🔧 Solutions à essayer:');
            console.log('1. Exécutez PowerShell en tant qu\'administrateur');
            console.log('2. Activez le mode développeur Windows');
            console.log('3. Utilisez WSL (Windows Subsystem for Linux)');
            console.log('4. Essayez sur une autre machine Windows');
        }
    }
}

// Fonction pour vérifier le résultat
function verifierResultat() {
    console.log('\n🔍 Vérification du résultat...');
    
    const distDir = './dist-installer';
    if (!fs.existsSync(distDir)) {
        throw new Error('Le dossier dist-installer n\'a pas été créé');
    }
    
    const files = fs.readdirSync(distDir);
    const installerFile = files.find(file => file.endsWith('.exe'));
    
    if (!installerFile) {
        // Vérifier s'il y a une version portable
        const unpackedDir = path.join(distDir, 'win-unpacked');
        if (fs.existsSync(unpackedDir)) {
            console.log('✅ Version portable générée dans win-unpacked/');
            return;
        }
        throw new Error('Aucun fichier .exe trouvé dans dist-installer');
    }
    
    const installerPath = path.join(distDir, installerFile);
    const stats = fs.statSync(installerPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Installateur généré: ${installerFile}`);
    console.log(`📏 Taille: ${sizeInMB} MB`);
}

// Fonction pour afficher les informations finales
function afficherInformationsInstallateur() {
    const distDir = './dist-installer';
    const files = fs.readdirSync(distDir);
    const installerFile = files.find(file => file.endsWith('.exe'));
    
    if (installerFile) {
        const installerPath = path.resolve(distDir, installerFile);
        
        console.log('\n📦 INSTALLATEUR PRÊT:');
        console.log(`📁 Emplacement: ${installerPath}`);
        console.log(`📋 Nom du fichier: ${installerFile}`);
        
        console.log('\n🚀 INSTRUCTIONS D\'UTILISATION:');
        console.log('1. Copiez le fichier .exe sur l\'ordinateur cible');
        console.log('2. Exécutez le fichier (pas besoin d\'être administrateur)');
        console.log('3. Suivez les instructions d\'installation');
        console.log('4. L\'application sera disponible dans le menu Démarrer');
        
        // Ouvrir le dossier
        try {
            execSync(`start "" "${path.dirname(installerPath)}"`, { stdio: 'ignore' });
            console.log('\n📂 Dossier ouvert automatiquement');
        } catch (error) {
            console.log(`\n📂 Ouvrez manuellement: ${path.dirname(installerPath)}`);
        }
    } else {
        // Vérifier version portable
        const unpackedDir = path.join(distDir, 'win-unpacked');
        if (fs.existsSync(unpackedDir)) {
            console.log('\n📦 VERSION PORTABLE GÉNÉRÉE:');
            console.log(`📁 Emplacement: ${path.resolve(unpackedDir)}`);
            console.log('\n🚀 INSTRUCTIONS:');
            console.log('1. Compressez le dossier win-unpacked en ZIP');
            console.log('2. Distribuez le fichier ZIP');
            console.log('3. L\'utilisateur décompresse et lance GestionPro.exe');
        }
    }
}

// Lancement du script
if (require.main === module) {
    genererInstallateur();
}

module.exports = { genererInstallateur };
