/**
 * Script pour finaliser l'installateur existant
 * Utilise le build existant et crée l'installateur NSIS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    📦 FINALISATION INSTALLATEUR GESTIONPRO                  ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

function checkExistingBuild() {
    console.log('🔍 VÉRIFICATION DU BUILD EXISTANT...');
    console.log('');
    
    const buildDir = 'installateur-gestionpro/win-unpacked';
    const exePath = path.join(buildDir, 'GestionPro.exe');
    
    if (fs.existsSync(buildDir)) {
        console.log('✅ Dossier de build trouvé');
        
        if (fs.existsSync(exePath)) {
            const stats = fs.statSync(exePath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`✅ Exécutable GestionPro.exe trouvé (${sizeMB} MB)`);
            
            // Vérifier les ressources
            const resourcesPath = path.join(buildDir, 'resources');
            if (fs.existsSync(resourcesPath)) {
                console.log('✅ Dossier resources présent');
                
                const appAsarPath = path.join(resourcesPath, 'app.asar');
                if (fs.existsSync(appAsarPath)) {
                    const asarStats = fs.statSync(appAsarPath);
                    const asarSizeMB = (asarStats.size / (1024 * 1024)).toFixed(2);
                    console.log(`✅ Archive app.asar présente (${asarSizeMB} MB)`);
                    return true;
                }
            }
        }
    }
    
    console.log('❌ Build incomplet ou manquant');
    return false;
}

function createPortableVersion() {
    console.log('📦 CRÉATION DE LA VERSION PORTABLE...');
    console.log('');
    
    const sourceDir = 'installateur-gestionpro/win-unpacked';
    const portableDir = 'GestionPro-Portable-v2.0.0';
    
    try {
        // Supprimer l'ancien dossier portable s'il existe
        if (fs.existsSync(portableDir)) {
            fs.rmSync(portableDir, { recursive: true, force: true });
        }
        
        // Copier le contenu
        fs.cpSync(sourceDir, portableDir, { recursive: true });
        
        // Créer un fichier de lancement
        const launcherContent = `@echo off
title GestionPro v2.0.0
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
start "" "GestionPro.exe"
`;
        
        fs.writeFileSync(path.join(portableDir, 'Lancer-GestionPro.bat'), launcherContent);
        
        // Créer un fichier README
        const readmeContent = `# GestionPro v2.0.0 - Version Portable

## 🚀 Lancement
Double-cliquez sur "Lancer-GestionPro.bat" ou directement sur "GestionPro.exe"

## 🔑 Connexion initiale
- Utilisateur: proprietaire
- Mot de passe: admin

⚠️ Changez le mot de passe après la première connexion !

## ✨ Fonctionnalités incluses
- Système de caisse complet
- Gestion clients et produits
- Facturation avec TVA
- Dashboard et rapports
- Support multilingue FR/AR
- Base de données SQLite intégrée

## 📁 Structure
- GestionPro.exe : Application principale
- resources/ : Ressources de l'application
- *.dll : Bibliothèques système requises

## 💾 Données
Les données sont stockées dans :
%APPDATA%\\GestionPro\\

## 🔧 Support
Pour toute assistance, consultez la documentation incluse.

---
GestionPro v2.0.0 - Solution complète de gestion commerciale
© 2025 - Tous droits réservés
`;
        
        fs.writeFileSync(path.join(portableDir, 'README.txt'), readmeContent);
        
        console.log(`✅ Version portable créée: ${portableDir}/`);
        
        // Calculer la taille totale
        const calculateDirSize = (dirPath) => {
            let totalSize = 0;
            const files = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const file of files) {
                const filePath = path.join(dirPath, file.name);
                if (file.isDirectory()) {
                    totalSize += calculateDirSize(filePath);
                } else {
                    totalSize += fs.statSync(filePath).size;
                }
            }
            return totalSize;
        };
        
        const totalSize = calculateDirSize(portableDir);
        const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        console.log(`📏 Taille totale: ${totalSizeMB} MB`);
        
        return true;
    } catch (error) {
        console.log(`❌ Erreur lors de la création de la version portable: ${error.message}`);
        return false;
    }
}

function createInstaller() {
    console.log('🏗️  CRÉATION DE L\'INSTALLATEUR NSIS...');
    console.log('');
    
    try {
        // Utiliser electron-builder pour créer uniquement l'installateur NSIS
        execSync('npx electron-builder --win nsis --prepackaged installateur-gestionpro/win-unpacked', { 
            stdio: 'inherit',
            timeout: 300000 // 5 minutes
        });
        
        console.log('✅ Installateur NSIS créé avec succès');
        return true;
    } catch (error) {
        console.log('❌ Erreur lors de la création de l\'installateur NSIS');
        console.log('🔧 Tentative avec méthode alternative...');
        
        try {
            // Méthode alternative : forcer la création
            execSync('npx electron-builder --win --prepackaged installateur-gestionpro/win-unpacked', { 
                stdio: 'inherit',
                timeout: 300000
            });
            
            console.log('✅ Installateur créé avec méthode alternative');
            return true;
        } catch (altError) {
            console.log('❌ Échec de la création de l\'installateur');
            return false;
        }
    }
}

function verifyResults() {
    console.log('🔍 VÉRIFICATION DES RÉSULTATS...');
    console.log('');
    
    const installerPath = 'installateur-gestionpro/GestionPro Setup 2.0.0.exe';
    const portablePath = 'GestionPro-Portable-v2.0.0';
    
    let hasInstaller = false;
    let hasPortable = false;
    
    // Vérifier l'installateur
    if (fs.existsSync(installerPath)) {
        const stats = fs.statSync(installerPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ Installateur: GestionPro Setup 2.0.0.exe (${sizeMB} MB)`);
        hasInstaller = true;
    } else {
        console.log('❌ Installateur non trouvé');
    }
    
    // Vérifier la version portable
    if (fs.existsSync(portablePath)) {
        console.log(`✅ Version portable: ${portablePath}/`);
        hasPortable = true;
    } else {
        console.log('❌ Version portable non trouvée');
    }
    
    return { hasInstaller, hasPortable };
}

async function main() {
    console.log('🚀 Finalisation de l\'installateur GestionPro v2.0.0');
    console.log('');
    
    // Vérifier le build existant
    if (!checkExistingBuild()) {
        console.log('❌ Aucun build valide trouvé');
        console.log('💡 Exécutez d\'abord: npm run dist');
        process.exit(1);
    }
    
    console.log('');
    
    // Créer la version portable
    const portableSuccess = createPortableVersion();
    
    console.log('');
    
    // Créer l'installateur NSIS
    const installerSuccess = createInstaller();
    
    console.log('');
    
    // Vérifier les résultats
    const results = verifyResults();
    
    console.log('');
    console.log('📊 RÉSUMÉ FINAL');
    console.log('═'.repeat(60));
    
    if (results.hasInstaller || results.hasPortable) {
        console.log('🎉 SUCCÈS ! Distribution créée');
        console.log('');
        
        if (results.hasInstaller) {
            console.log('📦 INSTALLATEUR DISPONIBLE:');
            console.log('   📁 Emplacement: installateur-gestionpro/');
            console.log('   📄 Fichier: GestionPro Setup 2.0.0.exe');
            console.log('   🔧 Installation: Exécuter et suivre l\'assistant');
        }
        
        if (results.hasPortable) {
            console.log('');
            console.log('💼 VERSION PORTABLE DISPONIBLE:');
            console.log('   📁 Dossier: GestionPro-Portable-v2.0.0/');
            console.log('   🚀 Lancement: Double-clic sur "Lancer-GestionPro.bat"');
            console.log('   📝 Documentation: README.txt inclus');
        }
        
        console.log('');
        console.log('🔑 CONNEXION INITIALE:');
        console.log('   👤 Utilisateur: proprietaire');
        console.log('   🔐 Mot de passe: admin');
        console.log('   ⚠️  Changez le mot de passe après la première connexion');
        
        console.log('');
        console.log('✅ FONCTIONNALITÉS INCLUSES:');
        console.log('   • Système de caisse complet avec scanner');
        console.log('   • Gestion clients avec ICE et crédit');
        console.log('   • Gestion produits et stocks');
        console.log('   • Facturation professionnelle avec TVA');
        console.log('   • Dashboard et analytics');
        console.log('   • Support multilingue (FR/AR)');
        console.log('   • Base de données SQLite intégrée');
        
        console.log('');
        console.log('🎯 PRÊT POUR LA DISTRIBUTION !');
        
    } else {
        console.log('❌ ÉCHEC DE LA CRÉATION');
        console.log('🔧 Vérifiez les erreurs ci-dessus et réessayez');
        process.exit(1);
    }
}

// Lancer le processus
main().catch(error => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
});
