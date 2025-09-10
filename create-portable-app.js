/**
 * Créer une version portable de GestionPro sans passer par electron-builder
 * Utilise les sources directement avec Electron
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    📱 CRÉATION VERSION PORTABLE GESTIONPRO                  ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

function createPortableApp() {
    console.log('🚀 Création de GestionPro Portable v2.0.0');
    console.log('');
    
    const portableDir = 'GestionPro-Portable-v2.0.0';
    
    try {
        // Supprimer l'ancien dossier s'il existe
        if (fs.existsSync(portableDir)) {
            console.log('🗑️  Suppression de l\'ancienne version...');
            fs.rmSync(portableDir, { recursive: true, force: true });
        }
        
        // Créer le nouveau dossier
        fs.mkdirSync(portableDir, { recursive: true });
        
        console.log('📁 Dossier portable créé');
        
        // Copier tous les fichiers sources nécessaires
        console.log('📋 Copie des fichiers sources...');
        
        const filesToCopy = [
            'main.js',
            'preload.js',
            'database.js',
            'package.json',
            'src/',
            'database/',
            'node_modules/'
        ];
        
        filesToCopy.forEach(item => {
            const sourcePath = item;
            const destPath = path.join(portableDir, item);
            
            if (fs.existsSync(sourcePath)) {
                if (fs.statSync(sourcePath).isDirectory()) {
                    console.log(`   📂 Copie du dossier ${item}...`);
                    fs.cpSync(sourcePath, destPath, { recursive: true });
                } else {
                    console.log(`   📄 Copie du fichier ${item}...`);
                    fs.copyFileSync(sourcePath, destPath);
                }
            } else {
                console.log(`   ⚠️  ${item} non trouvé - ignoré`);
            }
        });
        
        // Créer un lanceur Node.js
        const launcherContent = `const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Lancement de GestionPro...');
console.log('');
console.log('🔑 CONNEXION INITIALE:');
console.log('   👤 Utilisateur: proprietaire');
console.log('   🔐 Mot de passe: admin');
console.log('');

// Lancer Electron avec l'application
const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron.cmd');
const appPath = path.join(__dirname, 'main.js');

const child = spawn(electronPath, [appPath], {
    stdio: 'inherit',
    cwd: __dirname
});

child.on('error', (error) => {
    console.error('❌ Erreur lors du lancement:', error.message);
    console.log('💡 Assurez-vous que Node.js est installé');
    process.exit(1);
});

child.on('exit', (code) => {
    if (code !== 0) {
        console.log('⚠️  L\\'application s\\'est fermée avec le code:', code);
    }
    process.exit(code);
});
`;
        
        fs.writeFileSync(path.join(portableDir, 'lancer-gestionpro.js'), launcherContent);
        
        // Créer un lanceur batch pour Windows
        const batchLauncherContent = `@echo off
title GestionPro v2.0.0 - Version Portable
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           GESTIONPRO v2.0.0                                 ║
echo ║                        Version Portable                                      ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🚀 Démarrage de GestionPro...
echo.
echo ✨ FONCTIONNALITÉS INCLUSES:
echo    • 💰 Système de caisse complet avec scanner
echo    • 👥 Gestion clients avec ICE et crédit
echo    • 📦 Gestion produits et stocks
echo    • 🧾 Facturation professionnelle avec TVA
echo    • 📊 Dashboard et analytics
echo    • 🔐 Système d'authentification sécurisé
echo    • 🌍 Support multilingue (FR/AR)
echo.
echo 🔑 CONNEXION INITIALE:
echo    👤 Utilisateur: proprietaire
echo    🔐 Mot de passe: admin
echo.
echo ⚠️  IMPORTANT: Changez le mot de passe après la première connexion !
echo.

REM Vérifier Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js n'est pas installé !
    echo.
    echo 📥 Veuillez installer Node.js depuis https://nodejs.org/
    echo    Version recommandée: LTS (Long Term Support)
    echo.
    pause
    exit /b 1
)

echo 📱 Lancement de l'application...
echo.
node lancer-gestionpro.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erreur lors du lancement de l'application
    echo 🔧 Vérifiez que toutes les dépendances sont installées
    echo.
    pause
)
`;
        
        fs.writeFileSync(path.join(portableDir, 'Lancer-GestionPro.bat'), batchLauncherContent);
        
        // Créer un README complet
        const readmeContent = `# GestionPro v2.0.0 - Version Portable

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** version 16 ou supérieure
- **Windows** 8.1 ou supérieur
- **4 GB RAM** minimum (8 GB recommandé)
- **500 MB** d'espace disque libre

### Lancement
1. **Double-cliquez** sur "Lancer-GestionPro.bat"
2. Ou exécutez: \`node lancer-gestionpro.js\`

## 🔑 Connexion Initiale
- **Utilisateur**: proprietaire
- **Mot de passe**: admin
- ⚠️ **IMPORTANT**: Changez le mot de passe après la première connexion !

## ✨ Fonctionnalités Complètes

### 💰 Système de Caisse
- Point de vente avec scanner de codes-barres
- Gestion multi-paiements (Comptant, Chèque, Crédit)
- Affichage crédit client en temps réel
- Mode modification de ventes
- Impression de tickets

### 👥 Gestion Clients
- Base de données clients avec numéro ICE
- Suivi des crédits et dettes
- Système de paiement de crédits
- Filtrage et recherche avancée
- Historique des achats

### 📦 Gestion Produits & Stocks
- Catalogue avec catégories et codes-barres
- Gestion multi-prix (détail, gros, carton)
- Alertes de rupture de stock
- Ajustement des prix et stocks
- Import/Export de données

### 🧾 Facturation Professionnelle avec TVA
- Système TVA complet (0%, 10%, 20%, personnalisé)
- Calculs automatiques HT → TVA → TTC
- Factures PDF conformes à la réglementation marocaine
- Numérotation automatique et export
- Modèles de factures personnalisables

### 📊 Dashboard & Analytics
- Statistiques de ventes en temps réel
- Produits les plus rentables
- Insights et recommandations
- Export Excel avec formatage professionnel
- Graphiques et tendances

### 🔐 Sécurité & Authentification
- Mots de passe hachés avec Bcrypt
- Rôles utilisateurs (Propriétaire/Vendeur)
- Session management sécurisé
- Protection contre l'injection SQL
- Logs d'audit

### 🌍 Support Multilingue
- **Français** (par défaut)
- **Arabe** avec support RTL complet
- Interface adaptative selon la langue
- Traductions complètes

## 📁 Structure des Fichiers
- **lancer-gestionpro.js**: Lanceur Node.js
- **Lancer-GestionPro.bat**: Lanceur Windows
- **main.js**: Point d'entrée Electron
- **src/**: Code source de l'application
- **database/**: Base de données SQLite
- **node_modules/**: Dépendances Node.js
- **README.txt**: Cette documentation

## 💾 Stockage des Données
Les données sont sauvegardées dans :
\`%APPDATA%\\GestionPro\\\`

Contenu :
- **database/**: Base de données principale
- **backups/**: Sauvegardes automatiques
- **exports/**: Fichiers exportés (PDF, Excel)
- **logs/**: Journaux système

## 🔧 Configuration Recommandée
1. **Modifier le mot de passe** administrateur
2. **Configurer les informations** de l'entreprise
3. **Paramétrer la TVA** selon votre activité
4. **Ajouter les premiers produits**
5. **Créer les comptes utilisateurs** supplémentaires
6. **Configurer l'imprimante** pour les tickets

## 🛠️ Dépannage

### L'application ne démarre pas
1. Vérifiez que **Node.js** est installé
2. Exécutez en tant qu'**administrateur**
3. Vérifiez l'**antivirus** (ajoutez une exception)
4. Redémarrez votre **ordinateur**
5. Vérifiez l'**espace disque** disponible

### Erreur de base de données
1. Fermez complètement l'application
2. Redémarrez en tant qu'administrateur
3. Restaurez une sauvegarde si nécessaire

### Problème d'impression
1. Vérifiez que l'imprimante est **connectée**
2. Mettez à jour les **pilotes d'imprimante**
3. Testez l'impression depuis une autre application

## 📞 Support Technique
- **Documentation**: Guides inclus dans le projet
- **Logs**: Consultez %APPDATA%\\GestionPro\\logs\\
- **Sauvegarde**: Effectuez des sauvegardes régulières

## 🔄 Mise à Jour
1. Sauvegardez vos données
2. Téléchargez la nouvelle version
3. Remplacez les fichiers (données préservées)
4. Relancez l'application

## 📋 Avantages Version Portable
- ✅ **Aucune installation** requise
- ✅ **Fonctionne** depuis n'importe quel dossier
- ✅ **Portable** sur clé USB
- ✅ **Pas de modification** du registre Windows
- ✅ **Facile à déployer** en entreprise

---
**GestionPro v2.0.0** - Solution complète de gestion commerciale
© 2025 - Tous droits réservés

**Version Portable** - Prête à l'emploi
Nécessite Node.js installé sur le système
`;
        
        fs.writeFileSync(path.join(portableDir, 'README.txt'), readmeContent);
        
        // Créer un script d'installation des dépendances
        const installDepsContent = `@echo off
title Installation des dépendances GestionPro
echo.
echo 🔧 Installation des dépendances Node.js...
echo.
npm install --production
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Dépendances installées avec succès !
    echo 🚀 Vous pouvez maintenant lancer GestionPro
) else (
    echo.
    echo ❌ Erreur lors de l'installation des dépendances
    echo 💡 Vérifiez votre connexion internet
)
echo.
pause
`;
        
        fs.writeFileSync(path.join(portableDir, 'installer-dependances.bat'), installDepsContent);
        
        // Calculer la taille
        const calculateSize = (dir) => {
            let size = 0;
            try {
                const files = fs.readdirSync(dir, { withFileTypes: true });
                for (const file of files) {
                    const filePath = path.join(dir, file.name);
                    if (file.isDirectory()) {
                        size += calculateSize(filePath);
                    } else {
                        size += fs.statSync(filePath).size;
                    }
                }
            } catch (error) {
                // Ignorer les erreurs d'accès
            }
            return size;
        };
        
        const totalSize = calculateSize(portableDir);
        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        
        console.log('');
        console.log('✅ VERSION PORTABLE CRÉÉE AVEC SUCCÈS !');
        console.log('');
        console.log('📦 INFORMATIONS:');
        console.log(`   📁 Dossier: ${portableDir}/`);
        console.log(`   📏 Taille: ${sizeMB} MB`);
        console.log(`   📄 Fichiers: ${fs.readdirSync(portableDir).length} éléments`);
        console.log('');
        console.log('🚀 UTILISATION:');
        console.log('   1. Assurez-vous que Node.js est installé');
        console.log('   2. Double-cliquez sur "Lancer-GestionPro.bat"');
        console.log('   3. Ou exécutez: node lancer-gestionpro.js');
        console.log('');
        console.log('🔑 CONNEXION INITIALE:');
        console.log('   👤 Utilisateur: proprietaire');
        console.log('   🔐 Mot de passe: admin');
        console.log('');
        console.log('📋 AVANTAGES VERSION PORTABLE:');
        console.log('   ✅ Aucune installation requise');
        console.log('   ✅ Fonctionne depuis n\'importe quel dossier');
        console.log('   ✅ Portable sur clé USB');
        console.log('   ✅ Facile à déployer');
        console.log('');
        console.log('🎯 PRÊT POUR LA DISTRIBUTION !');
        
        return true;
    } catch (error) {
        console.log(`❌ Erreur lors de la création: ${error.message}`);
        return false;
    }
}

// Lancer la création
if (createPortableApp()) {
    console.log('');
    console.log('🎉 SUCCÈS COMPLET !');
    process.exit(0);
} else {
    console.log('');
    console.log('❌ ÉCHEC DE LA CRÉATION');
    process.exit(1);
}
