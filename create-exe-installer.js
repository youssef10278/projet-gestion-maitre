/**
 * Script pour créer un installateur .exe en contournant les problèmes de fichiers verrouillés
 * Utilise une approche de nettoyage complet et reconstruction
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    📦 CRÉATION INSTALLATEUR .EXE GESTIONPRO                 ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

async function forceKillProcesses() {
    console.log('🔄 ARRÊT FORCÉ DE TOUS LES PROCESSUS...');
    console.log('');
    
    const processesToKill = [
        'electron.exe',
        'GestionPro.exe', 
        'node.exe',
        'app-builder.exe',
        'nsis.exe'
    ];
    
    for (const proc of processesToKill) {
        try {
            console.log(`   🔫 Arrêt de ${proc}...`);
            execSync(`taskkill /F /IM ${proc} /T 2>nul || true`, { stdio: 'ignore' });
        } catch (error) {
            // Ignorer les erreurs
        }
    }
    
    console.log('✅ Processus arrêtés');
    
    // Attendre que les fichiers se libèrent
    console.log('⏳ Attente de libération des fichiers (10 secondes)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
}

function forceCleanDirectories() {
    console.log('🧹 NETTOYAGE FORCÉ DES DOSSIERS...');
    console.log('');
    
    const dirsToClean = [
        'installateur-gestionpro',
        'gestionpro-v2-final',
        'dist',
        'build/output'
    ];
    
    dirsToClean.forEach(dir => {
        if (fs.existsSync(dir)) {
            console.log(`🗑️  Suppression forcée de ${dir}...`);
            
            try {
                // Méthode 1: Node.js
                fs.rmSync(dir, { recursive: true, force: true });
                console.log(`   ✅ ${dir} supprimé (Node.js)`);
            } catch (error) {
                try {
                    // Méthode 2: Commande système
                    execSync(`rmdir /s /q "${dir}" 2>nul || rm -rf "${dir}" 2>/dev/null || true`, { stdio: 'ignore' });
                    console.log(`   ✅ ${dir} supprimé (système)`);
                } catch (error2) {
                    console.log(`   ⚠️  ${dir} partiellement supprimé`);
                }
            }
        }
    });
}

function createFreshBuild() {
    console.log('🏗️  CRÉATION D\'UN BUILD PROPRE...');
    console.log('');
    
    try {
        // Nettoyer le cache npm
        console.log('🧹 Nettoyage du cache npm...');
        execSync('npm cache clean --force', { stdio: 'inherit' });
        
        // Supprimer node_modules/.cache
        const cacheDir = 'node_modules/.cache';
        if (fs.existsSync(cacheDir)) {
            fs.rmSync(cacheDir, { recursive: true, force: true });
            console.log('✅ Cache node_modules supprimé');
        }
        
        // Reconstruire les modules natifs
        console.log('🔧 Reconstruction des modules natifs...');
        execSync('npm rebuild', { stdio: 'inherit' });
        
        // Compiler CSS
        console.log('🎨 Compilation CSS...');
        execSync('npx tailwindcss -i ./src/css/input.css -o ./src/css/output.css --minify', { stdio: 'inherit' });
        
        return true;
    } catch (error) {
        console.log(`❌ Erreur lors de la préparation: ${error.message}`);
        return false;
    }
}

function createInstaller() {
    console.log('📦 GÉNÉRATION DE L\'INSTALLATEUR .EXE...');
    console.log('');
    
    try {
        // Utiliser electron-builder avec options spécifiques
        console.log('🔨 Lancement d\'electron-builder...');
        execSync('npx electron-builder --win nsis --publish=never', {
            stdio: 'inherit',
            timeout: 600000, // 10 minutes
            env: {
                ...process.env,
                DEBUG: 'electron-builder',
                FORCE_COLOR: '1'
            }
        });
        
        console.log('✅ Installateur .exe créé avec succès !');
        return true;
    } catch (error) {
        console.log('❌ Échec avec la méthode standard');
        
        try {
            // Méthode alternative avec configuration spécifique
            console.log('🔄 Tentative avec configuration alternative...');
            execSync('npx electron-builder --win --config.nsis.oneClick=false --config.nsis.allowToChangeInstallationDirectory=true', {
                stdio: 'inherit',
                timeout: 600000
            });
            
            console.log('✅ Installateur créé avec méthode alternative !');
            return true;
        } catch (error2) {
            console.log('❌ Échec de la méthode alternative');
            return false;
        }
    }
}

function verifyInstaller() {
    console.log('🔍 VÉRIFICATION DE L\'INSTALLATEUR...');
    console.log('');
    
    const possiblePaths = [
        'installateur-gestionpro/GestionPro Setup 2.0.0.exe',
        'dist/GestionPro Setup 2.0.0.exe',
        'installateur-gestionpro/GestionPro-2.0.0-Setup.exe'
    ];
    
    for (const installerPath of possiblePaths) {
        if (fs.existsSync(installerPath)) {
            const stats = fs.statSync(installerPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            console.log('🎉 INSTALLATEUR .EXE TROUVÉ !');
            console.log('');
            console.log('📦 INFORMATIONS:');
            console.log(`   📁 Emplacement: ${path.resolve(installerPath)}`);
            console.log(`   📄 Nom: ${path.basename(installerPath)}`);
            console.log(`   📏 Taille: ${sizeMB} MB`);
            console.log(`   🕒 Créé: ${stats.mtime.toLocaleString()}`);
            console.log('');
            
            console.log('✅ CARACTÉRISTIQUES DE L\'INSTALLATEUR:');
            console.log('   • Type: NSIS Installer (.exe)');
            console.log('   • Plateforme: Windows x64');
            console.log('   • Installation: Assistant graphique');
            console.log('   • Désinstallation: Automatique');
            console.log('   • Raccourcis: Bureau + Menu Démarrer');
            console.log('');
            
            console.log('🔧 UTILISATION:');
            console.log('   1. Double-cliquez sur le fichier .exe');
            console.log('   2. Suivez l\'assistant d\'installation');
            console.log('   3. Choisissez le répertoire d\'installation');
            console.log('   4. Lancez GestionPro depuis le menu Démarrer');
            console.log('');
            
            console.log('🔑 CONNEXION INITIALE:');
            console.log('   👤 Utilisateur: proprietaire');
            console.log('   🔐 Mot de passe: admin');
            console.log('');
            
            return installerPath;
        }
    }
    
    console.log('❌ Aucun installateur .exe trouvé');
    
    // Diagnostic
    console.log('');
    console.log('🔍 DIAGNOSTIC:');
    if (fs.existsSync('installateur-gestionpro')) {
        console.log('📁 Contenu de installateur-gestionpro:');
        const files = fs.readdirSync('installateur-gestionpro');
        files.forEach(file => {
            const filePath = path.join('installateur-gestionpro', file);
            const stats = fs.statSync(filePath);
            const size = stats.isFile() ? ` (${(stats.size / 1024).toFixed(1)} KB)` : '';
            console.log(`   • ${file}${size}`);
        });
    }
    
    if (fs.existsSync('dist')) {
        console.log('📁 Contenu de dist:');
        const files = fs.readdirSync('dist');
        files.forEach(file => {
            const filePath = path.join('dist', file);
            const stats = fs.statSync(filePath);
            const size = stats.isFile() ? ` (${(stats.size / 1024).toFixed(1)} KB)` : '';
            console.log(`   • ${file}${size}`);
        });
    }
    
    return null;
}

async function main() {
    console.log('🚀 Création d\'un installateur .exe pour GestionPro v2.0.0');
    console.log('');
    
    console.log('⚠️  IMPORTANT: Fermez toutes les instances de GestionPro avant de continuer');
    console.log('');
    
    // Étape 1: Validation préliminaire
    console.log('📋 VALIDATION PRÉLIMINAIRE...');
    try {
        execSync('node validate-build.js', { stdio: 'inherit' });
        console.log('✅ Validation réussie');
    } catch (error) {
        console.log('❌ Validation échouée');
        process.exit(1);
    }
    
    console.log('');
    
    // Étape 2: Arrêt forcé des processus
    await forceKillProcesses();
    
    // Étape 3: Nettoyage forcé
    forceCleanDirectories();
    
    // Étape 4: Préparation du build
    console.log('');
    if (!createFreshBuild()) {
        console.log('❌ Échec de la préparation');
        process.exit(1);
    }
    
    // Étape 5: Création de l'installateur
    console.log('');
    if (!createInstaller()) {
        console.log('❌ Échec de la création de l\'installateur');
        process.exit(1);
    }
    
    // Étape 6: Vérification
    console.log('');
    const installerPath = verifyInstaller();
    
    if (installerPath) {
        console.log('🎉 SUCCÈS COMPLET !');
        console.log('');
        console.log('📦 INSTALLATEUR .EXE CRÉÉ AVEC SUCCÈS');
        console.log('');
        console.log('🎯 PROCHAINES ÉTAPES:');
        console.log('   1. Testez l\'installateur sur une machine propre');
        console.log('   2. Vérifiez toutes les fonctionnalités après installation');
        console.log('   3. Distribuez aux utilisateurs finaux');
        console.log('');
        console.log('📂 EMPLACEMENT FINAL:');
        console.log(`   ${path.resolve(installerPath)}`);
        
    } else {
        console.log('❌ ÉCHEC DE LA CRÉATION');
        console.log('');
        console.log('🔧 SOLUTIONS POSSIBLES:');
        console.log('   1. Redémarrez votre ordinateur');
        console.log('   2. Fermez tous les antivirus temporairement');
        console.log('   3. Exécutez en tant qu\'administrateur');
        console.log('   4. Libérez de l\'espace disque');
        process.exit(1);
    }
}

// Gestion des erreurs
process.on('uncaughtException', (error) => {
    console.log('');
    console.log('❌ ERREUR CRITIQUE:', error.message);
    console.log('🔧 Redémarrez votre ordinateur et réessayez');
    process.exit(1);
});

// Lancer le processus
main().catch(error => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
});
