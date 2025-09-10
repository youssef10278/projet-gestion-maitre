/**
 * Script pour forcer la création de l'installateur à partir du build existant
 * Utilise le dossier win-unpacked pour créer l'installateur NSIS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    🔧 CRÉATION FORCÉE DE L\'INSTALLATEUR                     ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

function checkExistingBuild() {
    console.log('🔍 VÉRIFICATION DU BUILD EXISTANT...');
    console.log('');
    
    const unpackedDir = 'installateur-gestionpro/win-unpacked';
    const exePath = path.join(unpackedDir, 'GestionPro.exe');
    
    if (fs.existsSync(unpackedDir)) {
        console.log('✅ Dossier win-unpacked trouvé');
        
        if (fs.existsSync(exePath)) {
            const stats = fs.statSync(exePath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`✅ GestionPro.exe trouvé (${sizeMB} MB)`);
            
            // Lister le contenu
            const files = fs.readdirSync(unpackedDir);
            console.log(`✅ ${files.length} fichiers dans le build`);
            
            return true;
        } else {
            console.log('❌ GestionPro.exe manquant');
            return false;
        }
    } else {
        console.log('❌ Dossier win-unpacked manquant');
        return false;
    }
}

function killProcesses() {
    console.log('🔄 ARRÊT DES PROCESSUS...');
    console.log('');
    
    try {
        // Arrêter tous les processus qui pourraient verrouiller les fichiers
        const processes = ['electron.exe', 'GestionPro.exe', 'node.exe'];
        
        processes.forEach(proc => {
            try {
                execSync(`taskkill /F /IM ${proc} /T 2>nul`, { stdio: 'ignore' });
            } catch (e) {
                // Ignorer les erreurs si le processus n'existe pas
            }
        });
        
        console.log('✅ Processus arrêtés');
        
        // Attendre un peu
        console.log('⏳ Attente (5 secondes)...');
        return new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
        console.log('⚠️  Erreur lors de l\'arrêt des processus');
        return Promise.resolve();
    }
}

function createInstallerFromUnpacked() {
    console.log('🏗️  CRÉATION DE L\'INSTALLATEUR NSIS...');
    console.log('');
    
    try {
        // Méthode 1: Utiliser electron-builder avec --prepackaged
        console.log('📦 Tentative avec --prepackaged...');
        execSync('npx electron-builder --win nsis --prepackaged installateur-gestionpro/win-unpacked', {
            stdio: 'inherit',
            timeout: 300000 // 5 minutes
        });
        
        console.log('✅ Installateur créé avec succès');
        return true;
    } catch (error) {
        console.log('❌ Échec avec --prepackaged');
        
        try {
            // Méthode 2: Forcer la reconstruction complète
            console.log('🔄 Tentative de reconstruction...');
            execSync('npx electron-builder --win --publish=never', {
                stdio: 'inherit',
                timeout: 300000
            });
            
            console.log('✅ Installateur créé par reconstruction');
            return true;
        } catch (error2) {
            console.log('❌ Échec de la reconstruction');
            return false;
        }
    }
}

function createPortableVersion() {
    console.log('💼 CRÉATION VERSION PORTABLE...');
    console.log('');
    
    const sourceDir = 'installateur-gestionpro/win-unpacked';
    const portableDir = 'GestionPro-Portable-v2.0.0';
    
    try {
        // Supprimer l'ancien dossier portable
        if (fs.existsSync(portableDir)) {
            console.log('🗑️  Suppression ancienne version portable...');
            fs.rmSync(portableDir, { recursive: true, force: true });
        }
        
        // Copier le contenu
        console.log('📁 Copie des fichiers...');
        fs.cpSync(sourceDir, portableDir, { recursive: true });
        
        // Créer un lanceur amélioré
        const launcherContent = `@echo off
title GestionPro v2.0.0 - Version Portable
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           GESTIONPRO v2.0.0                                 ║
echo ║                        Version Portable                                      ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🚀 Lancement de GestionPro...
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
echo 📱 Démarrage de l'application...
echo.
start "" "GestionPro.exe"
`;
        
        fs.writeFileSync(path.join(portableDir, 'Lancer-GestionPro.bat'), launcherContent);
        
        // Créer un README détaillé
        const readmeContent = `# GestionPro v2.0.0 - Version Portable

## 🚀 Démarrage Rapide
1. Double-cliquez sur "Lancer-GestionPro.bat"
2. Ou lancez directement "GestionPro.exe"

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

### 👥 Gestion Clients
- Base de données clients avec numéro ICE
- Suivi des crédits et dettes
- Système de paiement de crédits
- Filtrage et recherche avancée

### 📦 Gestion Produits & Stocks
- Catalogue avec catégories et codes-barres
- Gestion multi-prix (détail, gros, carton)
- Alertes de rupture de stock
- Ajustement des prix et stocks

### 🧾 Facturation Professionnelle avec TVA
- Système TVA complet (0%, 10%, 20%, personnalisé)
- Calculs automatiques HT → TVA → TTC
- Factures PDF conformes à la réglementation marocaine
- Numérotation automatique et export

### 📊 Dashboard & Analytics
- Statistiques de ventes en temps réel
- Produits les plus rentables
- Insights et recommandations
- Export Excel avec formatage professionnel

### 🔐 Sécurité & Authentification
- Mots de passe hachés avec Bcrypt
- Rôles utilisateurs (Propriétaire/Vendeur)
- Session management sécurisé
- Protection contre l'injection SQL

### 🌍 Support Multilingue
- Français (par défaut)
- Arabe avec support RTL complet
- Interface adaptative selon la langue

## 📁 Structure des Fichiers
- **GestionPro.exe**: Application principale
- **resources/**: Ressources de l'application
- ***.dll**: Bibliothèques système requises
- **Lancer-GestionPro.bat**: Lanceur avec informations
- **README.txt**: Cette documentation

## 💾 Stockage des Données
Les données sont automatiquement sauvegardées dans :
\`%APPDATA%\\GestionPro\\\`

Cela inclut :
- Base de données principale (SQLite)
- Sauvegardes automatiques quotidiennes
- Fichiers d'export (PDF, Excel)
- Logs système pour diagnostic

## 🔧 Configuration Recommandée
1. **Modifier le mot de passe** administrateur
2. **Configurer les informations** de l'entreprise
3. **Paramétrer la TVA** selon votre activité
4. **Ajouter les premiers produits**
5. **Créer les comptes utilisateurs** supplémentaires

## 🛠️ Dépannage
Si l'application ne démarre pas :
1. Vérifiez que Windows est à jour
2. Exécutez en tant qu'administrateur
3. Vérifiez l'antivirus (ajoutez une exception si nécessaire)
4. Redémarrez votre ordinateur
5. Vérifiez l'espace disque disponible (minimum 500 MB)

## 📞 Support Technique
Pour toute assistance technique :
- Consultez la documentation incluse
- Vérifiez les logs dans %APPDATA%\\GestionPro\\logs\\
- Contactez le support technique

## 🔄 Mise à Jour
Pour mettre à jour GestionPro :
1. Sauvegardez vos données
2. Téléchargez la nouvelle version
3. Remplacez les fichiers (vos données seront préservées)

---
**GestionPro v2.0.0** - Solution complète de gestion commerciale
© 2025 - Tous droits réservés

**Version Portable** - Aucune installation requise
Fonctionne directement depuis n'importe quel dossier
`;
        
        fs.writeFileSync(path.join(portableDir, 'README.txt'), readmeContent);
        
        // Calculer la taille
        const calculateSize = (dir) => {
            let size = 0;
            const files = fs.readdirSync(dir, { withFileTypes: true });
            for (const file of files) {
                const filePath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    size += calculateSize(filePath);
                } else {
                    size += fs.statSync(filePath).size;
                }
            }
            return size;
        };
        
        const totalSize = calculateSize(portableDir);
        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ Version portable créée: ${portableDir}/`);
        console.log(`📏 Taille totale: ${sizeMB} MB`);
        
        return true;
    } catch (error) {
        console.log(`❌ Erreur création version portable: ${error.message}`);
        return false;
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
        console.log(`✅ Installateur NSIS: GestionPro Setup 2.0.0.exe (${sizeMB} MB)`);
        hasInstaller = true;
    } else {
        console.log('❌ Installateur NSIS non trouvé');
    }
    
    // Vérifier la version portable
    if (fs.existsSync(portablePath)) {
        const files = fs.readdirSync(portablePath);
        console.log(`✅ Version portable: ${portablePath}/ (${files.length} fichiers)`);
        hasPortable = true;
    } else {
        console.log('❌ Version portable non trouvée');
    }
    
    return { hasInstaller, hasPortable };
}

async function main() {
    console.log('🚀 Création forcée de l\'installateur GestionPro v2.0.0');
    console.log('');
    
    // Vérifier le build existant
    if (!checkExistingBuild()) {
        console.log('❌ Aucun build valide trouvé');
        console.log('💡 Exécutez d\'abord: npm run dist');
        process.exit(1);
    }
    
    console.log('');
    
    // Arrêter les processus
    await killProcesses();
    
    // Créer la version portable (toujours possible)
    const portableSuccess = createPortableVersion();
    
    console.log('');
    
    // Tenter de créer l'installateur NSIS
    const installerSuccess = createInstallerFromUnpacked();
    
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
            console.log('📦 INSTALLATEUR NSIS DISPONIBLE:');
            console.log('   📁 Emplacement: installateur-gestionpro/');
            console.log('   📄 Fichier: GestionPro Setup 2.0.0.exe');
            console.log('   🔧 Installation: Exécuter et suivre l\'assistant');
            console.log('   🎯 Type: Installation complète avec raccourcis');
        }
        
        if (results.hasPortable) {
            console.log('');
            console.log('💼 VERSION PORTABLE DISPONIBLE:');
            console.log('   📁 Dossier: GestionPro-Portable-v2.0.0/');
            console.log('   🚀 Lancement: Double-clic sur "Lancer-GestionPro.bat"');
            console.log('   📝 Documentation: README.txt inclus');
            console.log('   🎯 Type: Aucune installation requise');
        }
        
        console.log('');
        console.log('🔑 CONNEXION INITIALE (pour les deux versions):');
        console.log('   👤 Utilisateur: proprietaire');
        console.log('   🔐 Mot de passe: admin');
        console.log('   ⚠️  Changez le mot de passe après la première connexion');
        
        console.log('');
        console.log('✅ FONCTIONNALITÉS COMPLÈTES INCLUSES:');
        console.log('   • Système de caisse avec scanner codes-barres');
        console.log('   • Gestion clients avec ICE et crédit');
        console.log('   • Gestion produits et stocks');
        console.log('   • Facturation professionnelle avec TVA');
        console.log('   • Dashboard et analytics');
        console.log('   • Support multilingue (FR/AR)');
        console.log('   • Base de données SQLite intégrée');
        console.log('   • Authentification sécurisée');
        
        console.log('');
        console.log('🎯 PRÊT POUR LA DISTRIBUTION !');
        
    } else {
        console.log('❌ ÉCHEC DE LA CRÉATION');
        console.log('🔧 Aucune version n\'a pu être créée');
        process.exit(1);
    }
}

// Lancer le processus
main().catch(error => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
});
