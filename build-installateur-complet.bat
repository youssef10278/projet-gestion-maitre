@echo off
chcp 65001 >nul
cls

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    📦 CRÉATION INSTALLATEUR GESTIONPRO COMPLET              ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

echo 🚀 Génération de l'installateur exécutable GestionPro v2.0.0
echo.
echo ✨ FONCTIONNALITÉS INCLUSES:
echo    • 💰 Système de caisse complet avec scanner
echo    • 👥 Gestion clients avec ICE et crédit
echo    • 📦 Gestion produits et stocks
echo    • 🧾 Facturation professionnelle avec TVA
echo    • 📊 Dashboard et analytics
echo    • 🔐 Système d'authentification sécurisé
echo    • 🌍 Support multilingue (FR/AR)
echo    • 📱 Interface moderne et responsive
echo    • 🖨️ Impression tickets et factures
echo    • 💾 Base de données SQLite intégrée
echo.
echo 🔧 PRÉPARATION DE L'ENVIRONNEMENT...
echo.

REM Vérifier Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js n'est pas installé ou non accessible
    echo 📥 Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier npm
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm n'est pas accessible
    pause
    exit /b 1
)

echo ✅ Node.js et npm détectés
echo.

echo 📦 INSTALLATION DES DÉPENDANCES...
echo.

REM Installer les dépendances si nécessaire
if not exist "node_modules" (
    echo 🔄 Installation des modules Node.js...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
) else (
    echo ✅ Modules Node.js déjà installés
)

echo.
echo 🔧 RECONSTRUCTION DES MODULES NATIFS...
echo.

REM Reconstruire les modules natifs pour Electron
npm run rebuild
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Avertissement: Erreur lors de la reconstruction des modules
    echo 🔄 Tentative de correction...
    npm run fix-modules
)

echo.
echo 🎨 COMPILATION DES STYLES CSS...
echo.

REM Compiler Tailwind CSS
npx tailwindcss -i ./src/css/input.css -o ./src/css/output.css --minify
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de la compilation CSS
    pause
    exit /b 1
)

echo ✅ Styles CSS compilés avec succès
echo.

echo 🧹 NETTOYAGE DES ANCIENS BUILDS...
echo.

REM Supprimer les anciens builds
if exist "installateur-gestionpro" (
    echo 🗑️  Suppression de l'ancien installateur...
    rmdir /s /q "installateur-gestionpro" 2>nul
)

if exist "gestionpro-v2-final" (
    echo 🗑️  Suppression de l'ancien build...
    rmdir /s /q "gestionpro-v2-final" 2>nul
)

echo.
echo 📋 VALIDATION COMPLÈTE DU PROJET...
echo.

REM Exécuter la validation complète
node validate-build.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Validation échouée - Consultez les erreurs ci-dessus
    pause
    exit /b 1
)

echo ✅ Validation réussie - Tous les composants sont présents
echo.

echo 🏗️  GÉNÉRATION DE L'INSTALLATEUR...
echo.

REM Créer l'installateur avec electron-builder
npm run dist
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de la génération de l'installateur
    echo.
    echo 🔧 TENTATIVE DE CORRECTION...
    echo.
    
    REM Réinstaller electron-builder si nécessaire
    npm install electron-builder --save-dev
    
    REM Nouvelle tentative
    npm run dist
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Échec de la génération après correction
        pause
        exit /b 1
    )
)

echo.
echo ✅ INSTALLATEUR GÉNÉRÉ AVEC SUCCÈS !
echo.

echo 🔍 VÉRIFICATION DE L'INSTALLATEUR...
echo.

REM Vérifier l'installateur généré
node verify-installer.js
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Problèmes détectés dans l'installateur
    echo 📝 Consultez les détails ci-dessus
    echo.
)

REM Vérifier que l'installateur a été créé
if exist "installateur-gestionpro\GestionPro Setup 2.0.0.exe" (
    echo 🎉 SUCCÈS ! Installateur créé:
    echo    📁 Dossier: installateur-gestionpro\
    echo    📦 Fichier: GestionPro Setup 2.0.0.exe
    echo.
    
    REM Afficher la taille du fichier
    for %%A in ("installateur-gestionpro\GestionPro Setup 2.0.0.exe") do (
        set "size=%%~zA"
        set /a "size_mb=!size! / 1048576"
        echo    📏 Taille: !size_mb! MB
    )
    
    echo.
    echo 📋 INFORMATIONS DE L'INSTALLATEUR:
    echo    • Nom: GestionPro
    echo    • Version: 2.0.0
    echo    • Type: NSIS Installer
    echo    • Plateforme: Windows
    echo    • Architecture: x64
    echo.
    echo 🚀 FONCTIONNALITÉS INCLUSES:
    echo    ✅ Application Electron complète
    echo    ✅ Base de données SQLite intégrée
    echo    ✅ Toutes les pages et fonctionnalités
    echo    ✅ Système d'authentification
    echo    ✅ Gestion TVA professionnelle
    echo    ✅ Support multilingue
    echo    ✅ Thème sombre/clair
    echo    ✅ Impression et export
    echo.
    echo 📦 CONTENU DE L'INSTALLATEUR:
    echo    • Exécutable principal (GestionPro.exe)
    echo    • Runtime Electron
    echo    • Modules Node.js compilés
    echo    • Base de données vide
    echo    • Fichiers de ressources
    echo    • Traductions
    echo    • Documentation
    echo.
    echo 🔧 INSTALLATION:
    echo    1. Exécuter "GestionPro Setup 2.0.0.exe"
    echo    2. Suivre l'assistant d'installation
    echo    3. Choisir le répertoire d'installation
    echo    4. Lancer GestionPro depuis le menu Démarrer
    echo.
    echo 🔑 PREMIÈRE UTILISATION:
    echo    • Utilisateur par défaut: proprietaire
    echo    • Mot de passe par défaut: admin
    echo    • Modifier le mot de passe après la première connexion
    echo.
    
    REM Proposer d'ouvrir le dossier
    echo 📂 Voulez-vous ouvrir le dossier de l'installateur ? (O/N)
    set /p "open_folder="
    if /i "%open_folder%"=="O" (
        explorer "installateur-gestionpro"
    )
    
) else (
    echo ❌ ERREUR: L'installateur n'a pas été trouvé
    echo 🔍 Vérifiez le dossier installateur-gestionpro\
    
    if exist "installateur-gestionpro" (
        echo.
        echo 📁 Contenu du dossier installateur-gestionpro:
        dir "installateur-gestionpro" /b
    )
)

echo.
echo 📊 RÉSUMÉ DE LA GÉNÉRATION:
echo    • Durée: %time%
echo    • Statut: Terminé
echo    • Emplacement: %cd%\installateur-gestionpro\
echo.
echo 🎯 PROCHAINES ÉTAPES:
echo    1. Tester l'installateur sur une machine propre
echo    2. Vérifier toutes les fonctionnalités
echo    3. Distribuer aux utilisateurs finaux
echo.
pause
