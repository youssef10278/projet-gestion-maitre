const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Génération de l\'installateur GestionPro v2.1.0');
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

// Fonction pour vérifier les prérequis
function verifierPrerequisites() {
    console.log('\n🔍 Vérification des prérequis...');
    
    // Vérifier que node_modules existe
    if (!fs.existsSync('./node_modules')) {
        console.log('📦 Installation des dépendances...');
        executeCommand('npm install', 'Installation des dépendances');
    }
    
    // Vérifier que les fichiers principaux existent
    const fichiersRequis = [
        './main.js',
        './package.json',
        './src/index.html',
        './database/main.db'
    ];
    
    for (const fichier of fichiersRequis) {
        if (!fs.existsSync(fichier)) {
            throw new Error(`Fichier requis manquant: ${fichier}`);
        }
    }
    
    console.log('✅ Tous les prérequis sont satisfaits');
}

// Fonction pour nettoyer les anciens builds
function nettoyerAnciensBuild() {
    console.log('\n🧹 Nettoyage des anciens builds...');
    
    const dossiers = ['dist', 'dist-installer', 'build'];
    
    for (const dossier of dossiers) {
        if (fs.existsSync(dossier)) {
            try {
                fs.rmSync(dossier, { recursive: true, force: true });
                console.log(`🗑️  Supprimé: ${dossier}`);
            } catch (error) {
                console.warn(`⚠️  Impossible de supprimer ${dossier}: ${error.message}`);
            }
        }
    }
}

// Fonction pour préparer les ressources
function preparerRessources() {
    console.log('\n📁 Préparation des ressources...');
    
    // Créer le dossier build s'il n'existe pas
    if (!fs.existsSync('./build')) {
        fs.mkdirSync('./build', { recursive: true });
    }
    
    // Créer une icône par défaut si elle n'existe pas
    const iconPath = './build/icon.ico';
    if (!fs.existsSync(iconPath)) {
        console.log('🎨 Création d\'une icône par défaut...');
        // Copier une icône par défaut ou en créer une simple
        const iconContent = Buffer.from(''); // Icône vide pour l'instant
        // Dans un vrai projet, vous devriez avoir une vraie icône .ico
    }
}

// Fonction principale
async function genererInstallateur() {
    try {
        console.log('🎯 Début de la génération de l\'installateur...\n');
        
        // Étape 1: Vérification des prérequis
        verifierPrerequisites();
        
        // Étape 2: Nettoyage
        nettoyerAnciensBuild();
        
        // Étape 3: Préparation des ressources
        preparerRessources();
        
        // Étape 4: Construction du CSS
        executeCommand('npm run build-css', 'Construction du CSS avec Tailwind');
        
        // Étape 5: Reconstruction des modules natifs
        executeCommand('npm run rebuild', 'Reconstruction des modules natifs');
        
        // Étape 6: Génération de l'installateur
        executeCommand('npm run dist', 'Génération de l\'installateur avec Electron Builder');
        
        // Étape 7: Vérification du résultat
        verifierResultat();
        
        console.log('\n🎉 SUCCÈS! L\'installateur a été généré avec succès!');
        console.log('=' .repeat(60));
        afficherInformationsInstallateur();
        
    } catch (error) {
        console.error('\n💥 ERREUR lors de la génération:');
        console.error(error.message);
        console.log('\n🔧 Solutions possibles:');
        console.log('1. Vérifiez que toutes les dépendances sont installées: npm install');
        console.log('2. Nettoyez le cache: npm cache clean --force');
        console.log('3. Supprimez node_modules et réinstallez: rm -rf node_modules && npm install');
        process.exit(1);
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
        console.log('2. Exécutez le fichier en tant qu\'administrateur');
        console.log('3. Suivez les instructions d\'installation');
        console.log('4. L\'application sera disponible dans le menu Démarrer');
        
        console.log('\n✨ FONCTIONNALITÉS DE L\'INSTALLATEUR:');
        console.log('• Installation guidée avec interface graphique');
        console.log('• Choix du répertoire d\'installation');
        console.log('• Création automatique des raccourcis bureau et menu');
        console.log('• Désinstallation propre via le Panneau de configuration');
        console.log('• Base de données incluse et configurée automatiquement');
    }
}

// Lancement du script
if (require.main === module) {
    genererInstallateur();
}

module.exports = { genererInstallateur };
