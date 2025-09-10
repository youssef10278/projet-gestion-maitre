/**
 * Script optimisé pour générer l'installateur .exe
 * Conçu pour fonctionner avec un chemin court et propre
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    🎯 GÉNÉRATION INSTALLATEUR OPTIMISÉE                     ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

function checkEnvironment() {
    console.log('🔍 VÉRIFICATION DE L\'ENVIRONNEMENT...');
    console.log('');
    
    const currentPath = process.cwd();
    console.log(`📍 Chemin actuel: ${currentPath}`);
    console.log(`📐 Longueur: ${currentPath.length} caractères`);
    
    // Vérifications
    let issues = [];
    
    if (currentPath.length > 50) {
        issues.push('Chemin trop long');
    }
    
    if (currentPath.includes(' ')) {
        issues.push('Chemin contient des espaces');
    }
    
    if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(currentPath)) {
        issues.push('Chemin contient des accents');
    }
    
    if (issues.length > 0) {
        console.log('🔴 PROBLÈMES DÉTECTÉS:');
        issues.forEach(issue => console.log(`   • ${issue}`));
        console.log('');
        console.log('💡 SOLUTION: Utilisez le script "deplacer-projet.bat" d\'abord');
        return false;
    } else {
        console.log('✅ Environnement optimal détecté');
        return true;
    }
}

function cleanBuildDirectories() {
    console.log('');
    console.log('🧹 NETTOYAGE DES DOSSIERS DE BUILD...');
    console.log('');
    
    const dirsToClean = [
        'installateur-gestionpro',
        'gestionpro-installer-final', 
        'dist',
        'node_modules/.cache'
    ];
    
    dirsToClean.forEach(dir => {
        if (fs.existsSync(dir)) {
            try {
                console.log(`🗑️  Suppression de ${dir}...`);
                fs.rmSync(dir, { recursive: true, force: true });
                console.log(`   ✅ ${dir} supprimé`);
            } catch (error) {
                console.log(`   ⚠️  Erreur: ${error.message}`);
            }
        } else {
            console.log(`✅ ${dir} - Déjà propre`);
        }
    });
}

function optimizeConfiguration() {
    console.log('');
    console.log('⚙️ OPTIMISATION DE LA CONFIGURATION...');
    console.log('');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Configuration optimisée pour éviter les conflits
        packageJson.build.directories.output = 'installer-final';
        packageJson.build.compression = 'store'; // Pas de compression pour éviter les conflits
        packageJson.build.removePackageScripts = true;
        
        // Configuration NSIS simplifiée
        packageJson.build.nsis = {
            oneClick: false,
            allowToChangeInstallationDirectory: true,
            createDesktopShortcut: true,
            createStartMenuShortcut: true,
            shortcutName: 'GestionPro'
        };
        
        // Exclusions pour éviter les conflits
        packageJson.build.files = [
            'main.js',
            'preload.js', 
            'database.js',
            'src/**/*',
            'database/**/*',
            'node_modules/**/*',
            '!node_modules/.cache/**/*',
            '!node_modules/electron-builder/**/*',
            '!**/node_modules/.cache/**/*'
        ];
        
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Configuration optimisée');
        
    } catch (error) {
        console.log(`❌ Erreur d'optimisation: ${error.message}`);
        return false;
    }
    
    return true;
}

function buildInstaller() {
    console.log('');
    console.log('🏗️  GÉNÉRATION DE L\'INSTALLATEUR...');
    console.log('');
    
    try {
        // Nettoyer le cache npm d'abord
        console.log('🧹 Nettoyage du cache npm...');
        execSync('npm cache clean --force', { stdio: 'inherit' });
        
        // Reconstruire les modules natifs
        console.log('🔧 Reconstruction des modules natifs...');
        execSync('npm rebuild', { stdio: 'inherit' });
        
        // Compiler CSS
        console.log('🎨 Compilation CSS...');
        execSync('npx tailwindcss -i ./src/css/input.css -o ./src/css/output.css --minify', { stdio: 'inherit' });
        
        // Générer l'installateur
        console.log('📦 Génération de l\'installateur...');
        execSync('npm run dist', { 
            stdio: 'inherit',
            timeout: 600000, // 10 minutes
            env: {
                ...process.env,
                NODE_ENV: 'production'
            }
        });
        
        return true;
    } catch (error) {
        console.log(`❌ Erreur lors de la génération: ${error.message}`);
        return false;
    }
}

function verifyResult() {
    console.log('');
    console.log('🔍 VÉRIFICATION DU RÉSULTAT...');
    console.log('');
    
    const possiblePaths = [
        'installer-final/GestionPro Setup 2.0.0.exe',
        'installateur-gestionpro/GestionPro Setup 2.0.0.exe',
        'dist/GestionPro Setup 2.0.0.exe'
    ];
    
    for (const installerPath of possiblePaths) {
        if (fs.existsSync(installerPath)) {
            const stats = fs.statSync(installerPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            console.log('🎉 INSTALLATEUR .EXE CRÉÉ AVEC SUCCÈS !');
            console.log('');
            console.log('📦 INFORMATIONS:');
            console.log(`   📁 Emplacement: ${path.resolve(installerPath)}`);
            console.log(`   📄 Nom: ${path.basename(installerPath)}`);
            console.log(`   📏 Taille: ${sizeMB} MB`);
            console.log(`   🕒 Créé: ${stats.mtime.toLocaleString()}`);
            console.log('');
            
            console.log('✅ CARACTÉRISTIQUES:');
            console.log('   • Type: NSIS Installer (.exe)');
            console.log('   • Plateforme: Windows x64');
            console.log('   • Installation: Assistant graphique');
            console.log('   • Désinstallation: Automatique');
            console.log('   • Raccourcis: Bureau + Menu Démarrer');
            console.log('');
            
            console.log('🔑 CONNEXION INITIALE:');
            console.log('   👤 Utilisateur: proprietaire');
            console.log('   🔐 Mot de passe: admin');
            console.log('');
            
            console.log('🎯 PRÊT POUR LA DISTRIBUTION !');
            
            return true;
        }
    }
    
    console.log('❌ Aucun installateur trouvé');
    
    // Diagnostic
    ['installer-final', 'installateur-gestionpro', 'dist'].forEach(dir => {
        if (fs.existsSync(dir)) {
            console.log(`📁 Contenu de ${dir}:`);
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                const size = stats.isFile() ? ` (${(stats.size / 1024).toFixed(1)} KB)` : '';
                console.log(`   • ${file}${size}`);
            });
        }
    });
    
    return false;
}

function main() {
    console.log('🚀 Génération optimisée de l\'installateur GestionPro v2.0.0');
    console.log('');
    
    // Étape 1: Vérifier l'environnement
    if (!checkEnvironment()) {
        process.exit(1);
    }
    
    // Étape 2: Nettoyer
    cleanBuildDirectories();
    
    // Étape 3: Optimiser la configuration
    if (!optimizeConfiguration()) {
        process.exit(1);
    }
    
    // Étape 4: Générer
    if (!buildInstaller()) {
        console.log('');
        console.log('❌ ÉCHEC DE LA GÉNÉRATION');
        console.log('');
        console.log('🔧 SOLUTIONS:');
        console.log('   1. Vérifiez que le chemin est court et sans espaces');
        console.log('   2. Fermez VSCode et autres éditeurs');
        console.log('   3. Exécutez en tant qu\'administrateur');
        console.log('   4. Utilisez la version portable en attendant');
        process.exit(1);
    }
    
    // Étape 5: Vérifier
    if (verifyResult()) {
        console.log('');
        console.log('🎉 MISSION ACCOMPLIE !');
        console.log('L\'installateur .exe a été créé avec succès.');
    } else {
        console.log('');
        console.log('❌ PROBLÈME DE VÉRIFICATION');
        process.exit(1);
    }
}

main();
