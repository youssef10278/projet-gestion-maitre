/**
 * Script de génération d'installateur avec nettoyage complet
 * Résout les problèmes de fichiers verrouillés
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    📦 GÉNÉRATION INSTALLATEUR GESTIONPRO                    ║');
console.log('║                         (avec nettoyage complet)                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

function killElectronProcesses() {
    console.log('🔄 ARRÊT DES PROCESSUS ELECTRON...');
    console.log('');
    
    try {
        // Tuer tous les processus Electron
        execSync('taskkill /F /IM electron.exe /T 2>nul || true', { stdio: 'ignore' });
        execSync('taskkill /F /IM GestionPro.exe /T 2>nul || true', { stdio: 'ignore' });
        execSync('taskkill /F /IM app-builder.exe /T 2>nul || true', { stdio: 'ignore' });
        
        console.log('✅ Processus Electron arrêtés');
        
        // Attendre un peu
        console.log('⏳ Attente de la libération des ressources...');
        return new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
        console.log('⚠️  Aucun processus Electron à arrêter');
        return Promise.resolve();
    }
}

function forceCleanup() {
    console.log('🧹 NETTOYAGE FORCÉ...');
    console.log('');
    
    const dirsToClean = [
        'installateur-gestionpro',
        'gestionpro-v2-final',
        'node_modules/.cache',
        'dist'
    ];
    
    dirsToClean.forEach(dir => {
        if (fs.existsSync(dir)) {
            console.log(`🗑️  Suppression de ${dir}...`);
            
            try {
                // Méthode 1: Suppression normale
                fs.rmSync(dir, { recursive: true, force: true });
                console.log(`   ✅ ${dir} supprimé`);
            } catch (error) {
                console.log(`   ⚠️  Suppression partielle de ${dir}`);
                
                try {
                    // Méthode 2: Suppression avec rmdir (Windows)
                    execSync(`rmdir /s /q "${dir}" 2>nul || rm -rf "${dir}" 2>/dev/null || true`, { stdio: 'ignore' });
                    console.log(`   ✅ ${dir} supprimé (méthode alternative)`);
                } catch (altError) {
                    console.log(`   ⚠️  ${dir} partiellement supprimé - continuons`);
                }
            }
        }
    });
}

function createCleanBuild() {
    console.log('🏗️  GÉNÉRATION PROPRE...');
    console.log('');
    
    try {
        // Nettoyer le cache npm
        console.log('🧹 Nettoyage du cache npm...');
        execSync('npm cache clean --force', { stdio: 'inherit' });
        
        // Reconstruire les modules natifs
        console.log('🔧 Reconstruction des modules natifs...');
        execSync('npm rebuild', { stdio: 'inherit' });
        
        // Générer l'installateur
        console.log('📦 Génération de l\'installateur...');
        execSync('npm run dist', { stdio: 'inherit' });
        
        return true;
    } catch (error) {
        console.log('❌ Erreur lors de la génération');
        return false;
    }
}

function createPortableVersion() {
    console.log('💼 CRÉATION VERSION PORTABLE...');
    console.log('');
    
    const sourceDir = 'installateur-gestionpro/win-unpacked';
    const portableDir = 'GestionPro-Portable-v2.0.0';
    
    if (!fs.existsSync(sourceDir)) {
        console.log('❌ Dossier source non trouvé pour la version portable');
        return false;
    }
    
    try {
        // Supprimer l'ancien dossier portable
        if (fs.existsSync(portableDir)) {
            fs.rmSync(portableDir, { recursive: true, force: true });
        }
        
        // Copier le contenu
        fs.cpSync(sourceDir, portableDir, { recursive: true });
        
        // Créer un lanceur
        const launcherContent = `@echo off
title GestionPro v2.0.0 - Version Portable
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           GESTIONPRO v2.0.0                                 ║
echo ║                        Version Portable                                      ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🚀 Lancement de GestionPro...
echo.
echo 🔑 CONNEXION INITIALE:
echo    👤 Utilisateur: proprietaire
echo    🔐 Mot de passe: admin
echo.
echo ⚠️  Changez le mot de passe après la première connexion !
echo.
start "" "GestionPro.exe"
`;
        
        fs.writeFileSync(path.join(portableDir, 'Lancer-GestionPro.bat'), launcherContent);
        
        // Créer un README
        const readmeContent = `# GestionPro v2.0.0 - Version Portable

## 🚀 Lancement Rapide
Double-cliquez sur "Lancer-GestionPro.bat" ou directement sur "GestionPro.exe"

## 🔑 Connexion Initiale
- Utilisateur: proprietaire  
- Mot de passe: admin
- ⚠️ IMPORTANT: Changez le mot de passe après la première connexion !

## ✨ Fonctionnalités Complètes
✅ Système de caisse avec scanner de codes-barres
✅ Gestion clients avec ICE et suivi crédit
✅ Gestion produits et stocks avec alertes
✅ Facturation professionnelle avec TVA (0%, 10%, 20%)
✅ Dashboard et analytics en temps réel
✅ Support multilingue (Français/Arabe)
✅ Impression tickets et factures
✅ Base de données SQLite intégrée
✅ Système d'authentification sécurisé
✅ Thème sombre/clair

## 📁 Structure des Fichiers
- GestionPro.exe : Application principale
- resources/ : Ressources de l'application
- *.dll : Bibliothèques système requises
- Lancer-GestionPro.bat : Lanceur avec informations

## 💾 Stockage des Données
Les données sont automatiquement sauvegardées dans :
%APPDATA%\\GestionPro\\

Cela inclut :
- Base de données principale
- Sauvegardes automatiques
- Fichiers d'export
- Logs système

## 🔧 Dépannage
Si l'application ne démarre pas :
1. Vérifiez que Windows est à jour
2. Exécutez en tant qu'administrateur
3. Vérifiez l'antivirus (ajoutez une exception si nécessaire)
4. Redémarrez votre ordinateur

## 📞 Support
Pour toute assistance technique, consultez la documentation incluse
ou contactez le support technique.

---
GestionPro v2.0.0 - Solution complète de gestion commerciale
© 2025 - Tous droits réservés
`;
        
        fs.writeFileSync(path.join(portableDir, 'README.txt'), readmeContent);
        
        console.log(`✅ Version portable créée: ${portableDir}/`);
        return true;
    } catch (error) {
        console.log(`❌ Erreur lors de la création de la version portable: ${error.message}`);
        return false;
    }
}

function verifyResults() {
    console.log('🔍 VÉRIFICATION DES RÉSULTATS...');
    console.log('');
    
    const installerPath = 'installateur-gestionpro/GestionPro Setup 2.0.0.exe';
    const portablePath = 'GestionPro-Portable-v2.0.0';
    
    let success = false;
    
    // Vérifier l'installateur
    if (fs.existsSync(installerPath)) {
        const stats = fs.statSync(installerPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ Installateur: GestionPro Setup 2.0.0.exe (${sizeMB} MB)`);
        success = true;
    } else {
        console.log('❌ Installateur non trouvé');
    }
    
    // Vérifier la version portable
    if (fs.existsSync(portablePath)) {
        const files = fs.readdirSync(portablePath);
        console.log(`✅ Version portable: ${portablePath}/ (${files.length} fichiers)`);
    }
    
    return success;
}

async function main() {
    console.log('🚀 Génération complète de l\'installateur GestionPro v2.0.0');
    console.log('');
    
    // Étape 1: Arrêter les processus
    await killElectronProcesses();
    
    // Étape 2: Nettoyage forcé
    forceCleanup();
    
    // Étape 3: Validation
    console.log('📋 VALIDATION...');
    try {
        execSync('node validate-build.js', { stdio: 'inherit' });
        console.log('✅ Validation réussie');
    } catch (error) {
        console.log('❌ Validation échouée');
        process.exit(1);
    }
    
    console.log('');
    
    // Étape 4: Compilation CSS
    console.log('🎨 COMPILATION CSS...');
    try {
        execSync('npx tailwindcss -i ./src/css/input.css -o ./src/css/output.css --minify', { stdio: 'inherit' });
        console.log('✅ CSS compilé');
    } catch (error) {
        console.log('⚠️  Avertissement: Erreur CSS - continuons');
    }
    
    console.log('');
    
    // Étape 5: Génération propre
    const buildSuccess = createCleanBuild();
    
    if (!buildSuccess) {
        console.log('❌ Échec de la génération');
        process.exit(1);
    }
    
    console.log('');
    
    // Étape 6: Version portable
    createPortableVersion();
    
    console.log('');
    
    // Étape 7: Vérification finale
    const success = verifyResults();
    
    console.log('');
    console.log('📊 RÉSUMÉ FINAL');
    console.log('═'.repeat(60));
    
    if (success) {
        console.log('🎉 SUCCÈS ! INSTALLATEUR CRÉÉ');
        console.log('');
        console.log('📦 FICHIERS GÉNÉRÉS:');
        console.log('   📄 GestionPro Setup 2.0.0.exe (Installateur NSIS)');
        console.log('   📁 GestionPro-Portable-v2.0.0/ (Version portable)');
        console.log('');
        console.log('🔑 CONNEXION INITIALE:');
        console.log('   👤 Utilisateur: proprietaire');
        console.log('   🔐 Mot de passe: admin');
        console.log('');
        console.log('🚀 PRÊT POUR LA DISTRIBUTION !');
    } else {
        console.log('❌ ÉCHEC DE LA GÉNÉRATION');
        process.exit(1);
    }
}

// Lancer le processus
main().catch(error => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
});
