// Script pour générer l'installateur GestionPro v2.1.0
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 === GÉNÉRATION INSTALLATEUR GESTIONPRO v2.1.0 ===\n');

// Fonction pour exécuter des commandes avec gestion d'erreur
function executeCommand(command, description) {
    console.log(`⏳ ${description}...`);
    try {
        const result = execSync(command, { 
            stdio: 'inherit', 
            cwd: __dirname,
            encoding: 'utf8'
        });
        console.log(`✅ ${description} - Terminé\n`);
        return true;
    } catch (error) {
        console.error(`❌ ${description} - Échec:`, error.message);
        return false;
    }
}

// Fonction pour vérifier les prérequis
function verifierPrerequisites() {
    console.log('🔍 Vérification des prérequis...\n');
    
    // Vérifier Node.js
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Node.js: ${nodeVersion}`);
    } catch (error) {
        console.error('❌ Node.js non installé');
        return false;
    }
    
    // Vérifier npm
    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        console.log(`✅ npm: ${npmVersion}`);
    } catch (error) {
        console.error('❌ npm non disponible');
        return false;
    }
    
    // Vérifier package.json
    if (!fs.existsSync('package.json')) {
        console.error('❌ package.json non trouvé');
        return false;
    }
    console.log('✅ package.json trouvé');
    
    // Vérifier main.js
    if (!fs.existsSync('main.js')) {
        console.error('❌ main.js non trouvé');
        return false;
    }
    console.log('✅ main.js trouvé');
    
    // Vérifier node_modules
    if (!fs.existsSync('node_modules')) {
        console.error('❌ node_modules non trouvé - Exécutez npm install');
        return false;
    }
    console.log('✅ node_modules trouvé');
    
    // Vérifier electron-builder
    try {
        require.resolve('electron-builder');
        console.log('✅ electron-builder installé');
    } catch (error) {
        console.error('❌ electron-builder non installé');
        return false;
    }
    
    console.log('\n🎯 Tous les prérequis sont satisfaits !\n');
    return true;
}

// Fonction pour nettoyer les anciens builds
function nettoyerAnciensBuild() {
    console.log('🧹 Nettoyage des anciens builds...\n');
    
    const dirsToClean = ['dist', 'dist-installer', 'build/win-unpacked'];
    
    dirsToClean.forEach(dir => {
        if (fs.existsSync(dir)) {
            try {
                fs.rmSync(dir, { recursive: true, force: true });
                console.log(`✅ Supprimé: ${dir}`);
            } catch (error) {
                console.log(`⚠️ Impossible de supprimer ${dir}: ${error.message}`);
            }
        }
    });
    
    console.log('\n');
}

// Fonction pour préparer les ressources
function preparerRessources() {
    console.log('📦 Préparation des ressources...\n');
    
    // Créer le dossier build s'il n'existe pas
    if (!fs.existsSync('build')) {
        fs.mkdirSync('build');
        console.log('✅ Dossier build créé');
    }
    
    // Vérifier les icônes (optionnel)
    const iconPath = 'build/icon.ico';
    if (!fs.existsSync(iconPath)) {
        console.log('⚠️ Icône non trouvée - L\'installateur utilisera l\'icône par défaut');
    } else {
        console.log('✅ Icône trouvée');
    }
    
    // Vérifier la base de données
    if (fs.existsSync('gestion.db')) {
        console.log('✅ Base de données trouvée');
    } else {
        console.log('⚠️ Base de données non trouvée - Elle sera créée au premier lancement');
    }
    
    console.log('\n');
}

// Fonction pour construire le CSS
function construireCSS() {
    console.log('🎨 Construction du CSS...\n');
    
    if (fs.existsSync('tailwind.config.js')) {
        return executeCommand('npm run build-css', 'Construction CSS avec Tailwind');
    } else {
        console.log('⚠️ Tailwind non configuré - CSS ignoré\n');
        return true;
    }
}

// Fonction pour reconstruire les modules natifs
function reconstruireModules() {
    console.log('🔧 Reconstruction des modules natifs...\n');
    
    // Reconstruire better-sqlite3 pour la production
    return executeCommand('npm rebuild better-sqlite3 --build-from-source', 'Reconstruction better-sqlite3');
}

// Fonction pour générer l'installateur
function genererInstallateur() {
    console.log('🏗️ Génération de l\'installateur...\n');
    
    return executeCommand('npm run dist', 'Génération installateur avec electron-builder');
}

// Fonction pour vérifier le résultat
function verifierResultat() {
    console.log('🔍 Vérification du résultat...\n');
    
    const distDir = 'dist-installer';
    if (!fs.existsSync(distDir)) {
        console.error('❌ Dossier dist-installer non créé');
        return false;
    }
    
    const files = fs.readdirSync(distDir);
    const exeFiles = files.filter(file => file.endsWith('.exe'));
    
    if (exeFiles.length === 0) {
        console.error('❌ Aucun fichier .exe trouvé');
        return false;
    }
    
    console.log('✅ Fichiers générés:');
    files.forEach(file => {
        const filePath = path.join(distDir, file);
        const stats = fs.statSync(filePath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`   📄 ${file} (${sizeInMB} MB)`);
    });
    
    console.log('\n');
    return true;
}

// Fonction pour afficher les informations finales
function afficherInformationsFinales() {
    console.log('🎉 === GÉNÉRATION TERMINÉE AVEC SUCCÈS ===\n');
    
    const distDir = 'dist-installer';
    const files = fs.readdirSync(distDir);
    const installerFile = files.find(file => file.includes('Installer') && file.endsWith('.exe'));
    
    if (installerFile) {
        const installerPath = path.resolve(distDir, installerFile);
        console.log('📦 INSTALLATEUR GÉNÉRÉ:');
        console.log(`   📁 Emplacement: ${installerPath}`);
        console.log(`   📄 Nom: ${installerFile}`);
        
        const stats = fs.statSync(installerPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`   📊 Taille: ${sizeInMB} MB`);
        console.log(`   📅 Créé: ${stats.birthtime.toLocaleString('fr-FR')}`);
    }
    
    console.log('\n🚀 INSTRUCTIONS D\'INSTALLATION:');
    console.log('1. Localisez le fichier .exe dans le dossier dist-installer');
    console.log('2. Double-cliquez sur le fichier pour lancer l\'installation');
    console.log('3. Suivez les instructions de l\'assistant d\'installation');
    console.log('4. L\'application sera installée et accessible depuis le menu Démarrer');
    
    console.log('\n📋 FONCTIONNALITÉS INCLUSES:');
    console.log('✅ Gestion des produits et stock');
    console.log('✅ Gestion des clients avec validation avancée');
    console.log('✅ Scanner code-barres optimisé');
    console.log('✅ Système de caisse complet');
    console.log('✅ Gestion des ventes et paiements');
    console.log('✅ Rapports et statistiques');
    console.log('✅ Sauvegarde automatique des données');
    
    console.log('\n💡 NOTES IMPORTANTES:');
    console.log('- L\'application créera sa base de données au premier lancement');
    console.log('- Les données sont sauvegardées localement sur l\'ordinateur');
    console.log('- L\'application fonctionne hors ligne');
    console.log('- Compatible Windows 10/11 (64-bit)');
    
    console.log('\n🎊 GestionPro v2.1.0 prêt à être distribué !');
}

// Fonction principale
async function main() {
    try {
        console.log('🕐 Début de la génération:', new Date().toLocaleString('fr-FR'));
        console.log('📍 Répertoire:', __dirname);
        console.log('');
        
        // Étape 1: Vérifier les prérequis
        if (!verifierPrerequisites()) {
            process.exit(1);
        }
        
        // Étape 2: Nettoyer les anciens builds
        nettoyerAnciensBuild();
        
        // Étape 3: Préparer les ressources
        preparerRessources();
        
        // Étape 4: Construire le CSS
        if (!construireCSS()) {
            console.log('⚠️ Erreur CSS - Continuation quand même...\n');
        }
        
        // Étape 5: Reconstruire les modules natifs
        if (!reconstruireModules()) {
            console.log('⚠️ Erreur reconstruction modules - Continuation quand même...\n');
        }
        
        // Étape 6: Générer l'installateur
        if (!genererInstallateur()) {
            console.error('❌ Échec de la génération de l\'installateur');
            process.exit(1);
        }
        
        // Étape 7: Vérifier le résultat
        if (!verifierResultat()) {
            console.error('❌ Vérification échouée');
            process.exit(1);
        }
        
        // Étape 8: Afficher les informations finales
        afficherInformationsFinales();
        
        console.log('\n🕐 Fin de la génération:', new Date().toLocaleString('fr-FR'));
        
    } catch (error) {
        console.error('❌ Erreur fatale:', error.message);
        process.exit(1);
    }
}

// Lancer le script
main();
