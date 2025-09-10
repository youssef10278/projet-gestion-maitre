/**
 * Script simple pour créer un installateur GestionPro
 * Alternative à electron-builder en cas de problème avec app-builder
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Création d\'un installateur GestionPro simple...');

// Vérifier si l'installateur existe déjà
const existingInstaller = 'gestionpro-installer-final/GestionPro Setup 2.0.0.exe';
if (fs.existsSync(existingInstaller)) {
    console.log('✅ Installateur existant trouvé !');
    
    // Obtenir les informations du fichier
    const stats = fs.statSync(existingInstaller);
    const sizeMB = Math.round(stats.size / (1024 * 1024));
    
    console.log(`📁 Fichier: ${existingInstaller}`);
    console.log(`💾 Taille: ${sizeMB} MB`);
    console.log(`📅 Modifié: ${stats.mtime.toLocaleString()}`);
    
    // Créer une copie avec un nom plus explicite
    const newName = `GestionPro-Installer-v2.0.0-${new Date().toISOString().slice(0,10)}.exe`;
    
    try {
        fs.copyFileSync(existingInstaller, newName);
        console.log(`✅ Copie créée: ${newName}`);
        
        console.log('\n🎯 INSTALLATEUR PRÊT !');
        console.log('===============================================');
        console.log('📦 Fichiers disponibles:');
        console.log(`   • ${existingInstaller}`);
        console.log(`   • ${newName}`);
        console.log('\n🧪 POUR TESTER:');
        console.log('   1. Double-cliquez sur l\'installateur');
        console.log('   2. Suivez l\'assistant d\'installation');
        console.log('   3. Lancez GestionPro');
        console.log('   4. Connectez-vous avec: proprietaire / admin');
        console.log('\n✨ FONCTIONNALITÉS INCLUSES:');
        console.log('   • Système de caisse complet');
        console.log('   • Gestion clients et produits');
        console.log('   • Facturation avec TVA');
        console.log('   • Dashboard et analytics');
        console.log('   • Support multilingue (FR/AR)');
        console.log('   • Système de licences professionnel');
        
    } catch (error) {
        console.error('❌ Erreur lors de la copie:', error.message);
    }
    
} else {
    console.log('⚠️ Aucun installateur existant trouvé');
    console.log('💡 Essayons de créer un package portable...');
    
    // Créer un package portable simple
    createPortablePackage();
}

function createPortablePackage() {
    console.log('\n📦 Création d\'un package portable...');
    
    const portableDir = 'GestionPro-Portable-Simple';
    
    // Créer le dossier portable
    if (!fs.existsSync(portableDir)) {
        fs.mkdirSync(portableDir, { recursive: true });
    }
    
    // Fichiers essentiels à copier
    const filesToCopy = [
        'main.js',
        'preload.js',
        'database.js',
        'package.json',
        'src',
        'database'
    ];
    
    console.log('📋 Copie des fichiers essentiels...');
    
    filesToCopy.forEach(file => {
        const srcPath = path.join('.', file);
        const destPath = path.join(portableDir, file);
        
        if (fs.existsSync(srcPath)) {
            try {
                if (fs.statSync(srcPath).isDirectory()) {
                    copyDirectory(srcPath, destPath);
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
                console.log(`✅ Copié: ${file}`);
            } catch (error) {
                console.log(`⚠️ Erreur copie ${file}:`, error.message);
            }
        }
    });
    
    // Créer un lanceur simple
    const launcherScript = `@echo off
title GestionPro v2.0.0 - Version Portable
echo 🚀 Démarrage de GestionPro...
echo.
echo ⚠️ IMPORTANT: Node.js et npm doivent être installés
echo.
echo 📦 Installation des dépendances...
npm install --production
echo.
echo 🎯 Lancement de l'application...
npm start
pause`;
    
    fs.writeFileSync(path.join(portableDir, 'Lancer-GestionPro.bat'), launcherScript);
    
    // Créer un README
    const readme = `# GestionPro v2.0.0 - Version Portable

## 🚀 Démarrage Rapide

1. **Double-cliquez** sur "Lancer-GestionPro.bat"
2. Attendez l'installation des dépendances
3. L'application se lancera automatiquement

## 🔑 Connexion Initiale
- **Utilisateur**: proprietaire
- **Mot de passe**: admin

## ⚠️ Prérequis
- Node.js version 16 ou supérieure
- Windows 8.1 ou supérieur
- 4 GB RAM minimum

## 📞 Support
Pour toute question, contactez l'équipe de développement.
`;
    
    fs.writeFileSync(path.join(portableDir, 'README.txt'), readme);
    
    console.log(`✅ Package portable créé: ${portableDir}/`);
    console.log('📋 Contenu:');
    console.log('   • Lancer-GestionPro.bat (lanceur)');
    console.log('   • README.txt (instructions)');
    console.log('   • Code source complet');
    console.log('\n🎯 Pour distribuer: Compressez le dossier en ZIP');
}

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

console.log('\n🎊 Script terminé !');
