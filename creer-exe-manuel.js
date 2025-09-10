const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('🚀 Création manuelle de l\'exécutable GestionPro');
console.log('=' .repeat(50));

// Configuration
const appName = 'GestionPro';
const version = '2.1.0';
const outputDir = './dist-manual';

// Fonction pour créer un dossier s'il n'existe pas
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Fonction pour copier récursivement
function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        ensureDir(dest);
        const files = fs.readdirSync(src);
        files.forEach(file => {
            copyRecursive(path.join(src, file), path.join(dest, file));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Fonction pour créer un package.json minimal pour l'app
function createAppPackageJson(appDir) {
    const packageJson = {
        name: "gestionpro",
        version: version,
        description: "Application de gestion GestionPro",
        main: "main.js",
        author: "GestionPro Team",
        license: "ISC"
    };
    
    fs.writeFileSync(
        path.join(appDir, 'package.json'), 
        JSON.stringify(packageJson, null, 2)
    );
}

// Fonction pour créer un script de lancement
function createLauncher(appDir) {
    const launcherScript = `@echo off
title GestionPro v${version}
cd /d "%~dp0"
echo Démarrage de GestionPro...
node_modules\\.bin\\electron . || node_modules\\electron\\dist\\electron.exe .
if errorlevel 1 (
    echo.
    echo Erreur lors du démarrage de GestionPro
    echo Vérifiez que Node.js est installé
    pause
)`;

    fs.writeFileSync(path.join(appDir, 'GestionPro.bat'), launcherScript);
}

// Fonction pour créer un installateur ZIP
function createZipInstaller(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`✅ Archive créée: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
            resolve();
        });

        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

// Fonction principale
async function creerExecutable() {
    try {
        console.log('\n🧹 Nettoyage...');
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true, force: true });
        }
        ensureDir(outputDir);

        const appDir = path.join(outputDir, appName);
        ensureDir(appDir);

        console.log('\n📁 Copie des fichiers de l\'application...');
        
        // Copier les fichiers essentiels
        const filesToCopy = [
            'main.js',
            'preload.js',
            'config.js',
            'database.js',
            'src',
            'database',
            'tailwind.config.js'
        ];

        for (const file of filesToCopy) {
            if (fs.existsSync(file)) {
                const destPath = path.join(appDir, file);
                if (fs.statSync(file).isDirectory()) {
                    copyRecursive(file, destPath);
                } else {
                    fs.copyFileSync(file, destPath);
                }
                console.log(`✅ Copié: ${file}`);
            }
        }

        console.log('\n📦 Installation des dépendances de production...');
        
        // Créer package.json pour l'app
        createAppPackageJson(appDir);
        
        // Installer seulement les dépendances de production
        const productionDeps = [
            'electron@28.3.3',
            'better-sqlite3@12.2.0',
            'bcrypt@5.1.1',
            'axios@1.10.0',
            'node-fetch@3.3.2',
            'node-machine-id@1.1.12'
        ];

        // Installer les dépendances dans le répertoire de l'app
        const originalDir = process.cwd();
        process.chdir(appDir);

        for (const dep of productionDeps) {
            try {
                console.log(`📦 Installation de ${dep}...`);
                execSync(`npm install ${dep}`, { stdio: 'pipe' });
                console.log(`✅ ${dep} installé`);
            } catch (error) {
                console.warn(`⚠️  Erreur avec ${dep}, on continue...`);
            }
        }

        // Retourner au répertoire original
        process.chdir(originalDir);

        console.log('\n🚀 Création du script de lancement...');
        createLauncher(appDir);

        console.log('\n📋 Création du fichier README...');
        const readme = `# GestionPro v${version}

## Installation
1. Décompressez ce fichier ZIP
2. Double-cliquez sur GestionPro.bat pour lancer l'application

## Prérequis
- Windows 10/11
- Node.js 18+ (téléchargeable sur nodejs.org)

## Première utilisation
1. Lancez GestionPro.bat
2. L'application s'ouvrira dans votre navigateur par défaut
3. Utilisez les identifiants par défaut pour vous connecter

## Support
Pour toute question, contactez l'équipe de support.

## Version: ${version}
Date de création: ${new Date().toLocaleDateString('fr-FR')}
`;

        fs.writeFileSync(path.join(appDir, 'README.txt'), readme);

        console.log('\n📦 Création de l\'archive ZIP...');
        const zipPath = path.join(outputDir, `${appName}-v${version}-Portable.zip`);
        await createZipInstaller(appDir, zipPath);

        console.log('\n🎉 SUCCÈS! Application portable créée!');
        console.log('=' .repeat(50));
        console.log(`📁 Emplacement: ${path.resolve(zipPath)}`);
        console.log(`📏 Taille: ${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(2)} MB`);
        
        console.log('\n🚀 INSTRUCTIONS:');
        console.log('1. Distribuez le fichier ZIP');
        console.log('2. L\'utilisateur décompresse le ZIP');
        console.log('3. L\'utilisateur lance GestionPro.bat');
        console.log('4. L\'application démarre automatiquement');

        // Ouvrir le dossier
        try {
            execSync(`start "" "${outputDir}"`, { stdio: 'ignore' });
            console.log('\n📂 Dossier ouvert automatiquement');
        } catch (error) {
            console.log(`\n📂 Ouvrez manuellement: ${path.resolve(outputDir)}`);
        }

        return true;

    } catch (error) {
        console.error('\n💥 ERREUR:', error.message);
        console.log('\n🔧 Vérifiez que:');
        console.log('1. Node.js est installé');
        console.log('2. Vous avez les droits d\'écriture');
        console.log('3. Aucun antivirus ne bloque l\'opération');
        return false;
    }
}

// Lancement
if (require.main === module) {
    creerExecutable().then(success => {
        if (success) {
            console.log('\n✨ Application portable prête à distribuer!');
        } else {
            console.log('\n❌ Échec de la création');
            process.exit(1);
        }
    });
}

module.exports = { creerExecutable };
