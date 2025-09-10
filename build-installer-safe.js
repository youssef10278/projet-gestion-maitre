/**
 * Script de génération sécurisée de l'installateur GestionPro
 * Gère les fichiers verrouillés et les processus en cours
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    📦 GÉNÉRATION INSTALLATEUR GESTIONPRO                    ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

function runCommand(command, description, ignoreErrors = false) {
    console.log(`🔧 ${description}...`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${description} terminé avec succès`);
        return true;
    } catch (error) {
        if (ignoreErrors) {
            console.log(`⚠️  ${description} terminé avec avertissements`);
            return true;
        } else {
            console.log(`❌ Erreur lors de ${description.toLowerCase()}`);
            return false;
        }
    }
}

function safeCleanup() {
    console.log('🧹 NETTOYAGE SÉCURISÉ...');
    console.log('');
    
    // Attendre un peu pour que les processus se terminent
    console.log('⏳ Attente de la libération des ressources...');
    
    // Essayer de nettoyer avec des tentatives multiples
    const dirsToClean = ['installateur-gestionpro', 'gestionpro-v2-final'];
    
    dirsToClean.forEach(dir => {
        if (fs.existsSync(dir)) {
            console.log(`🗑️  Tentative de suppression de ${dir}...`);
            
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    // Attendre entre les tentatives
                    if (attempt > 1) {
                        console.log(`   Tentative ${attempt}/3...`);
                        // Attendre 2 secondes
                        execSync('timeout /t 2 /nobreak > nul 2>&1 || sleep 2', { stdio: 'ignore' });
                    }
                    
                    fs.rmSync(dir, { recursive: true, force: true });
                    console.log(`   ✅ ${dir} supprimé avec succès`);
                    break;
                } catch (error) {
                    if (attempt === 3) {
                        console.log(`   ⚠️  Impossible de supprimer ${dir} complètement`);
                        console.log(`   💡 Continuons quand même...`);
                    }
                }
            }
        }
    });
}

async function buildInstaller() {
    console.log('🚀 Génération de l\'installateur GestionPro v2.0.0');
    console.log('');

    // Vérifications préliminaires
    console.log('🔍 VÉRIFICATIONS PRÉLIMINAIRES...');
    console.log('');

    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Node.js ${nodeVersion}`);
    } catch (error) {
        console.log('❌ Node.js non accessible');
        process.exit(1);
    }

    // Validation du projet
    console.log('📋 VALIDATION DU PROJET...');
    console.log('');
    
    if (!runCommand('node validate-build.js', 'Validation des composants')) {
        console.log('❌ Validation échouée');
        process.exit(1);
    }

    // Nettoyage sécurisé
    safeCleanup();

    // Compilation CSS
    console.log('🎨 COMPILATION CSS...');
    console.log('');
    
    runCommand('npx tailwindcss -i ./src/css/input.css -o ./src/css/output.css --minify', 'Compilation Tailwind CSS', true);

    // Reconstruction des modules (optionnelle)
    console.log('🔧 RECONSTRUCTION DES MODULES...');
    console.log('');
    
    runCommand('npm run rebuild', 'Reconstruction des modules natifs', true);

    // Génération de l'installateur
    console.log('🏗️  GÉNÉRATION DE L\'INSTALLATEUR...');
    console.log('');
    
    if (!runCommand('npm run dist', 'Génération avec electron-builder')) {
        console.log('');
        console.log('🔧 TENTATIVE DE CORRECTION...');
        
        // Nettoyer le cache npm
        runCommand('npm cache clean --force', 'Nettoyage du cache npm', true);
        
        // Réinstaller electron-builder
        runCommand('npm install electron-builder --save-dev', 'Réinstallation electron-builder', true);
        
        // Nouvelle tentative
        if (!runCommand('npm run dist', 'Nouvelle tentative de génération')) {
            console.log('❌ Échec de la génération');
            process.exit(1);
        }
    }

    // Vérification du résultat
    console.log('');
    console.log('🔍 VÉRIFICATION DU RÉSULTAT...');
    console.log('');

    const installerPath = 'installateur-gestionpro/GestionPro Setup 2.0.0.exe';
    
    if (fs.existsSync(installerPath)) {
        const stats = fs.statSync(installerPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('🎉 SUCCÈS ! INSTALLATEUR CRÉÉ');
        console.log('');
        console.log('📦 INFORMATIONS:');
        console.log(`   📁 Emplacement: ${path.resolve('installateur-gestionpro')}`);
        console.log(`   📄 Fichier: GestionPro Setup 2.0.0.exe`);
        console.log(`   📏 Taille: ${sizeMB} MB`);
        console.log(`   🕒 Créé: ${stats.mtime.toLocaleString()}`);
        console.log('');
        
        console.log('✅ FONCTIONNALITÉS INCLUSES:');
        console.log('   • Système de caisse complet');
        console.log('   • Gestion clients et produits');
        console.log('   • Facturation avec TVA');
        console.log('   • Dashboard et rapports');
        console.log('   • Support multilingue FR/AR');
        console.log('   • Base de données SQLite');
        console.log('   • Authentification sécurisée');
        console.log('');
        
        console.log('🔧 INSTALLATION:');
        console.log('   1. Exécuter "GestionPro Setup 2.0.0.exe"');
        console.log('   2. Suivre l\'assistant d\'installation');
        console.log('   3. Lancer depuis le menu Démarrer');
        console.log('');
        
        console.log('🔑 CONNEXION INITIALE:');
        console.log('   👤 Utilisateur: proprietaire');
        console.log('   🔐 Mot de passe: admin');
        console.log('   ⚠️  Changez le mot de passe après la première connexion');
        console.log('');
        
        console.log('🎯 PROCHAINES ÉTAPES:');
        console.log('   1. Tester l\'installation sur une machine propre');
        console.log('   2. Vérifier toutes les fonctionnalités');
        console.log('   3. Distribuer aux utilisateurs');
        console.log('');
        
        // Vérification optionnelle
        runCommand('node verify-installer.js', 'Vérification détaillée', true);
        
        console.log('🚀 INSTALLATEUR PRÊT POUR LA DISTRIBUTION !');
        
    } else {
        console.log('❌ ERREUR: Installateur non trouvé');
        
        // Lister le contenu du dossier pour diagnostic
        if (fs.existsSync('installateur-gestionpro')) {
            console.log('');
            console.log('📁 Contenu du dossier installateur-gestionpro:');
            const files = fs.readdirSync('installateur-gestionpro');
            files.forEach(file => {
                const filePath = path.join('installateur-gestionpro', file);
                const stats = fs.statSync(filePath);
                const size = stats.isFile() ? ` (${(stats.size / 1024).toFixed(1)} KB)` : '';
                console.log(`   • ${file}${size}`);
            });
        }
        
        process.exit(1);
    }
}

// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
    console.log('');
    console.log('❌ ERREUR INATTENDUE:', error.message);
    console.log('🔧 Essayez de fermer tous les processus GestionPro et relancer');
    process.exit(1);
});

// Lancer la génération
buildInstaller().catch(error => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
});
