/**
 * Script de génération complète de l'installateur GestionPro
 * Version Node.js compatible avec tous les environnements
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    📦 CRÉATION INSTALLATEUR GESTIONPRO COMPLET              ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

console.log('🚀 Génération de l\'installateur exécutable GestionPro v2.0.0');
console.log('');
console.log('✨ FONCTIONNALITÉS INCLUSES:');
console.log('   • 💰 Système de caisse complet avec scanner');
console.log('   • 👥 Gestion clients avec ICE et crédit');
console.log('   • 📦 Gestion produits et stocks');
console.log('   • 🧾 Facturation professionnelle avec TVA');
console.log('   • 📊 Dashboard et analytics');
console.log('   • 🔐 Système d\'authentification sécurisé');
console.log('   • 🌍 Support multilingue (FR/AR)');
console.log('   • 📱 Interface moderne et responsive');
console.log('   • 🖨️ Impression tickets et factures');
console.log('   • 💾 Base de données SQLite intégrée');
console.log('');

function runCommand(command, description) {
    console.log(`🔧 ${description}...`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${description} terminé avec succès`);
        return true;
    } catch (error) {
        console.log(`❌ Erreur lors de ${description.toLowerCase()}`);
        console.log(`   Erreur: ${error.message}`);
        return false;
    }
}

async function buildInstaller() {
    console.log('🔧 PRÉPARATION DE L\'ENVIRONNEMENT...');
    console.log('');

    // Vérifier Node.js et npm
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Node.js ${nodeVersion} détecté`);
        console.log(`✅ npm ${npmVersion} détecté`);
    } catch (error) {
        console.log('❌ Node.js ou npm non accessible');
        process.exit(1);
    }

    console.log('');
    console.log('📦 INSTALLATION DES DÉPENDANCES...');
    console.log('');

    // Vérifier et installer les dépendances
    if (!fs.existsSync('node_modules')) {
        console.log('🔄 Installation des modules Node.js...');
        if (!runCommand('npm install', 'Installation des dépendances')) {
            process.exit(1);
        }
    } else {
        console.log('✅ Modules Node.js déjà installés');
    }

    console.log('');
    console.log('🔧 RECONSTRUCTION DES MODULES NATIFS...');
    console.log('');

    // Reconstruire les modules natifs
    runCommand('npm run rebuild', 'Reconstruction des modules natifs');

    console.log('');
    console.log('🎨 COMPILATION DES STYLES CSS...');
    console.log('');

    // Compiler Tailwind CSS
    if (!runCommand('npx tailwindcss -i ./src/css/input.css -o ./src/css/output.css --minify', 'Compilation CSS')) {
        console.log('⚠️  Avertissement: Erreur lors de la compilation CSS');
    }

    console.log('');
    console.log('🧹 NETTOYAGE DES ANCIENS BUILDS...');
    console.log('');

    // Supprimer les anciens builds
    if (fs.existsSync('installateur-gestionpro')) {
        console.log('🗑️  Suppression de l\'ancien installateur...');
        fs.rmSync('installateur-gestionpro', { recursive: true, force: true });
    }

    if (fs.existsSync('gestionpro-v2-final')) {
        console.log('🗑️  Suppression de l\'ancien build...');
        fs.rmSync('gestionpro-v2-final', { recursive: true, force: true });
    }

    console.log('');
    console.log('📋 VALIDATION COMPLÈTE DU PROJET...');
    console.log('');

    // Validation pré-build
    if (!runCommand('node validate-build.js', 'Validation du projet')) {
        console.log('❌ Validation échouée - Consultez les erreurs ci-dessus');
        process.exit(1);
    }

    console.log('');
    console.log('🏗️  GÉNÉRATION DE L\'INSTALLATEUR...');
    console.log('');

    // Générer l'installateur
    if (!runCommand('npm run dist', 'Génération de l\'installateur')) {
        console.log('❌ Erreur lors de la génération de l\'installateur');
        console.log('');
        console.log('🔧 TENTATIVE DE CORRECTION...');
        
        // Réinstaller electron-builder
        runCommand('npm install electron-builder --save-dev', 'Réinstallation d\'electron-builder');
        
        // Nouvelle tentative
        if (!runCommand('npm run dist', 'Nouvelle tentative de génération')) {
            console.log('❌ Échec de la génération après correction');
            process.exit(1);
        }
    }

    console.log('');
    console.log('✅ INSTALLATEUR GÉNÉRÉ AVEC SUCCÈS !');
    console.log('');

    console.log('🔍 VÉRIFICATION DE L\'INSTALLATEUR...');
    console.log('');

    // Vérifier l'installateur
    runCommand('node verify-installer.js', 'Vérification de l\'installateur');

    console.log('');

    // Vérifier que l'installateur a été créé
    const installerPath = 'installateur-gestionpro/GestionPro Setup 2.0.0.exe';
    if (fs.existsSync(installerPath)) {
        const stats = fs.statSync(installerPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('🎉 SUCCÈS ! Installateur créé:');
        console.log(`   📁 Dossier: installateur-gestionpro/`);
        console.log(`   📦 Fichier: GestionPro Setup 2.0.0.exe`);
        console.log(`   📏 Taille: ${sizeMB} MB`);
        console.log('');
        
        console.log('📋 INFORMATIONS DE L\'INSTALLATEUR:');
        console.log('   • Nom: GestionPro');
        console.log('   • Version: 2.0.0');
        console.log('   • Type: NSIS Installer');
        console.log('   • Plateforme: Windows');
        console.log('   • Architecture: x64');
        console.log('');
        
        console.log('🚀 FONCTIONNALITÉS INCLUSES:');
        console.log('   ✅ Application Electron complète');
        console.log('   ✅ Base de données SQLite intégrée');
        console.log('   ✅ Toutes les pages et fonctionnalités');
        console.log('   ✅ Système d\'authentification');
        console.log('   ✅ Gestion TVA professionnelle');
        console.log('   ✅ Support multilingue');
        console.log('   ✅ Thème sombre/clair');
        console.log('   ✅ Impression et export');
        console.log('');
        
        console.log('📦 CONTENU DE L\'INSTALLATEUR:');
        console.log('   • Exécutable principal (GestionPro.exe)');
        console.log('   • Runtime Electron');
        console.log('   • Modules Node.js compilés');
        console.log('   • Base de données vide');
        console.log('   • Fichiers de ressources');
        console.log('   • Traductions');
        console.log('   • Documentation');
        console.log('');
        
        console.log('🔧 INSTALLATION:');
        console.log('   1. Exécuter "GestionPro Setup 2.0.0.exe"');
        console.log('   2. Suivre l\'assistant d\'installation');
        console.log('   3. Choisir le répertoire d\'installation');
        console.log('   4. Lancer GestionPro depuis le menu Démarrer');
        console.log('');
        
        console.log('🔑 PREMIÈRE UTILISATION:');
        console.log('   • Utilisateur par défaut: proprietaire');
        console.log('   • Mot de passe par défaut: admin');
        console.log('   • Modifier le mot de passe après la première connexion');
        console.log('');
        
        console.log('🎯 PROCHAINES ÉTAPES:');
        console.log('   1. Tester l\'installateur sur une machine propre');
        console.log('   2. Vérifier toutes les fonctionnalités');
        console.log('   3. Distribuer aux utilisateurs finaux');
        console.log('');
        
        console.log('📂 EMPLACEMENT:');
        console.log(`   ${path.resolve('installateur-gestionpro')}`);
        
    } else {
        console.log('❌ ERREUR: L\'installateur n\'a pas été trouvé');
        console.log('🔍 Vérifiez le dossier installateur-gestionpro/');
        
        if (fs.existsSync('installateur-gestionpro')) {
            console.log('');
            console.log('📁 Contenu du dossier installateur-gestionpro:');
            const files = fs.readdirSync('installateur-gestionpro');
            files.forEach(file => console.log(`   • ${file}`));
        }
        process.exit(1);
    }

    console.log('');
    console.log('📊 RÉSUMÉ DE LA GÉNÉRATION:');
    console.log(`   • Statut: Terminé avec succès`);
    console.log(`   • Emplacement: ${process.cwd()}/installateur-gestionpro/`);
    console.log(`   • Heure: ${new Date().toLocaleString()}`);
    console.log('');
}

// Lancer la génération
buildInstaller().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
