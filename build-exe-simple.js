/**
 * Script simple pour créer l'installateur .exe
 * Approche directe avec nettoyage minimal
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    📦 CRÉATION INSTALLATEUR .EXE SIMPLE                     ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

function cleanOldBuilds() {
    console.log('🧹 NETTOYAGE DES ANCIENS BUILDS...');
    console.log('');
    
    const dirsToClean = ['installateur-gestionpro', 'dist'];
    
    dirsToClean.forEach(dir => {
        if (fs.existsSync(dir)) {
            try {
                console.log(`🗑️  Suppression de ${dir}...`);
                fs.rmSync(dir, { recursive: true, force: true });
                console.log(`   ✅ ${dir} supprimé`);
            } catch (error) {
                console.log(`   ⚠️  Erreur lors de la suppression de ${dir}: ${error.message}`);
            }
        }
    });
}

function buildInstaller() {
    console.log('📦 GÉNÉRATION DE L\'INSTALLATEUR .EXE...');
    console.log('');
    
    try {
        // Utiliser npm run dist directement
        execSync('npm run dist', {
            stdio: 'inherit',
            timeout: 600000 // 10 minutes
        });
        
        return true;
    } catch (error) {
        console.log('❌ Erreur lors de la génération');
        return false;
    }
}

function checkResult() {
    console.log('🔍 VÉRIFICATION DU RÉSULTAT...');
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
            
            console.log('🎯 PRÊT POUR LA DISTRIBUTION !');
            
            return true;
        }
    }
    
    console.log('❌ Aucun installateur .exe trouvé');
    
    // Diagnostic
    console.log('');
    console.log('🔍 DIAGNOSTIC:');
    ['installateur-gestionpro', 'dist'].forEach(dir => {
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
    console.log('🚀 Création d\'un installateur .exe pour GestionPro v2.0.0');
    console.log('');
    
    // Étape 1: Nettoyage
    cleanOldBuilds();
    
    console.log('');
    
    // Étape 2: Génération
    if (!buildInstaller()) {
        console.log('❌ Échec de la génération');
        process.exit(1);
    }
    
    console.log('');
    
    // Étape 3: Vérification
    if (checkResult()) {
        console.log('');
        console.log('🎉 MISSION ACCOMPLIE !');
        console.log('L\'installateur .exe a été créé avec succès.');
    } else {
        console.log('');
        console.log('❌ ÉCHEC');
        console.log('L\'installateur .exe n\'a pas pu être créé.');
        process.exit(1);
    }
}

// Lancer
main();
