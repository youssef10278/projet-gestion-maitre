@echo off
chcp 65001 >nul
title Génération EXE GestionPro - MAINTENANT

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              GÉNÉRATION INSTALLATEUR .EXE                   ║
echo ║                    GestionPro v2.1.0                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🚀 Démarrage de la génération...
echo.

REM Vérifier Node.js
echo 🔍 Vérification de Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js non trouvé. Installez Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js OK

REM Vérifier npm
echo 🔍 Vérification de npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm non trouvé
    pause
    exit /b 1
)
echo ✅ npm OK

echo.
echo 📦 Installation/Mise à jour des dépendances...
npm install
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)

echo.
echo 🎨 Construction du CSS...
npm run build-css
if errorlevel 1 (
    echo ⚠️  Erreur CSS - on continue quand même...
)

echo.
echo 🔧 Reconstruction des modules natifs...
npm run rebuild
if errorlevel 1 (
    echo ⚠️  Erreur rebuild - on continue quand même...
)

echo.
echo 🏗️  GÉNÉRATION DE L'INSTALLATEUR...
echo ⏳ Cela peut prendre 5-10 minutes...
echo.

npm run dist

if errorlevel 1 (
    echo.
    echo ❌ ERREUR lors de la génération
    echo.
    echo 🔧 Essayons une méthode alternative...
    echo.
    
    REM Méthode alternative avec electron-builder direct
    echo 📦 Tentative avec electron-builder direct...
    npx electron-builder --win --x64
    
    if errorlevel 1 (
        echo ❌ Échec de la génération
        echo.
        echo 💡 SOLUTIONS:
        echo 1. Vérifiez que vous êtes sur Windows
        echo 2. Exécutez en tant qu'administrateur
        echo 3. Désactivez temporairement l'antivirus
        echo 4. Libérez de l'espace disque (minimum 2GB)
        echo.
        pause
        exit /b 1
    )
)

echo.
echo 🔍 Recherche du fichier .exe généré...

REM Chercher dans dist-installer
if exist "dist-installer" (
    echo 📁 Dossier dist-installer trouvé
    dir /b "dist-installer\*.exe" >nul 2>&1
    if not errorlevel 1 (
        echo.
        echo 🎉 SUCCÈS! Installateur trouvé dans dist-installer:
        dir "dist-installer\*.exe"
        echo.
        echo 📂 Ouverture du dossier...
        start "" "dist-installer"
        goto :success
    )
)

REM Chercher dans dist
if exist "dist" (
    echo 📁 Dossier dist trouvé
    dir /b "dist\*.exe" >nul 2>&1
    if not errorlevel 1 (
        echo.
        echo 🎉 SUCCÈS! Installateur trouvé dans dist:
        dir "dist\*.exe"
        echo.
        echo 📂 Ouverture du dossier...
        start "" "dist"
        goto :success
    )
)

REM Chercher partout
echo 🔍 Recherche dans tous les dossiers...
for /r . %%f in (*.exe) do (
    echo Trouvé: %%f
)

echo.
echo ⚠️  Aucun .exe trouvé dans les emplacements habituels
echo 💡 Vérifiez les messages d'erreur ci-dessus
goto :end

:success
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    GÉNÉRATION RÉUSSIE!                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🎯 Votre installateur .exe est prêt!
echo.
echo 📋 PROCHAINES ÉTAPES:
echo 1. Testez l'installateur sur cette machine
echo 2. Copiez le .exe sur une clé USB
echo 3. Installez sur l'ordinateur cible
echo 4. Lancez GestionPro depuis le menu Démarrer
echo.

:end
echo Appuyez sur une touche pour fermer...
pause >nul
