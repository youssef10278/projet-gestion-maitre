@echo off
chcp 65001 >nul
title Création Application Portable GestionPro

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           CRÉATION APPLICATION PORTABLE GESTIONPRO           ║
echo ║                        Version 2.1.0                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🚀 Création de l'application portable...
echo.

REM Créer le dossier de destination
if exist "GestionPro-Portable" (
    echo 🧹 Suppression de l'ancien dossier...
    rmdir /s /q "GestionPro-Portable"
)

echo 📁 Création du dossier portable...
mkdir "GestionPro-Portable"

echo 📋 Copie des fichiers essentiels...

REM Copier les fichiers principaux
copy "main.js" "GestionPro-Portable\" >nul
copy "preload.js" "GestionPro-Portable\" >nul
copy "config.js" "GestionPro-Portable\" >nul
copy "database.js" "GestionPro-Portable\" >nul
copy "package.json" "GestionPro-Portable\" >nul

REM Copier les dossiers
echo 📂 Copie du dossier src...
xcopy "src" "GestionPro-Portable\src" /E /I /Q >nul

echo 📂 Copie de la base de données...
xcopy "database" "GestionPro-Portable\database" /E /I /Q >nul

echo 📂 Copie des modules Node.js essentiels...
if exist "node_modules" (
    mkdir "GestionPro-Portable\node_modules"
    
    REM Copier seulement les modules essentiels
    if exist "node_modules\electron" (
        xcopy "node_modules\electron" "GestionPro-Portable\node_modules\electron" /E /I /Q >nul
        echo ✅ Electron copié
    )
    
    if exist "node_modules\better-sqlite3" (
        xcopy "node_modules\better-sqlite3" "GestionPro-Portable\node_modules\better-sqlite3" /E /I /Q >nul
        echo ✅ Better-sqlite3 copié
    )
    
    if exist "node_modules\bcrypt" (
        xcopy "node_modules\bcrypt" "GestionPro-Portable\node_modules\bcrypt" /E /I /Q >nul
        echo ✅ Bcrypt copié
    )
    
    if exist "node_modules\axios" (
        xcopy "node_modules\axios" "GestionPro-Portable\node_modules\axios" /E /I /Q >nul
        echo ✅ Axios copié
    )
    
    if exist "node_modules\node-fetch" (
        xcopy "node_modules\node-fetch" "GestionPro-Portable\node_modules\node-fetch" /E /I /Q >nul
        echo ✅ Node-fetch copié
    )
    
    if exist "node_modules\node-machine-id" (
        xcopy "node_modules\node-machine-id" "GestionPro-Portable\node_modules\node-machine-id" /E /I /Q >nul
        echo ✅ Node-machine-id copié
    )
    
    REM Copier le dossier .bin si il existe
    if exist "node_modules\.bin" (
        xcopy "node_modules\.bin" "GestionPro-Portable\node_modules\.bin" /E /I /Q >nul
        echo ✅ Binaires copiés
    )
)

echo 🚀 Création du script de lancement...

REM Créer le script de lancement principal
(
echo @echo off
echo title GestionPro v2.1.0
echo cd /d "%%~dp0"
echo echo.
echo echo ╔══════════════════════════════════════════════════════════════╗
echo echo ║                    GESTIONPRO v2.1.0                        ║
echo echo ║                Application de Gestion                       ║
echo echo ╚══════════════════════════════════════════════════════════════╝
echo echo.
echo echo 🚀 Démarrage de GestionPro...
echo echo.
echo REM Vérifier Node.js
echo node --version ^>nul 2^>^&1
echo if errorlevel 1 ^(
echo     echo ❌ Node.js non trouvé
echo     echo.
echo     echo 💡 SOLUTION:
echo     echo 1. Téléchargez Node.js depuis https://nodejs.org/
echo     echo 2. Installez Node.js
echo     echo 3. Relancez ce script
echo     echo.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo REM Lancer l'application
echo echo ✅ Node.js détecté, lancement de l'application...
echo node_modules\.bin\electron . ^|^| node_modules\electron\dist\electron.exe . ^|^| npx electron .
echo.
echo if errorlevel 1 ^(
echo     echo.
echo     echo ❌ Erreur lors du démarrage
echo     echo 💡 Essayez d'installer les dépendances: npm install
echo     pause
echo ^)
) > "GestionPro-Portable\GestionPro.bat"

REM Créer un fichier README
(
echo # GestionPro v2.1.0 - Application Portable
echo.
echo ## Installation et Utilisation
echo.
echo ### Prérequis
echo - Windows 10/11
echo - Node.js 18+ ^(téléchargeable sur https://nodejs.org/^)
echo.
echo ### Première utilisation
echo 1. Assurez-vous que Node.js est installé
echo 2. Double-cliquez sur GestionPro.bat
echo 3. L'application se lancera automatiquement
echo.
echo ### En cas de problème
echo 1. Ouvrez une invite de commande dans ce dossier
echo 2. Tapez: npm install
echo 3. Relancez GestionPro.bat
echo.
echo ### Fonctionnalités
echo - Gestion de caisse
echo - Gestion des clients
echo - Gestion des produits
echo - Facturation
echo - Système de devis
echo - Gestion des retours
echo - Rapports et statistiques
echo.
echo ### Support
echo Pour toute question, contactez l'équipe de support.
echo.
echo Version: 2.1.0
echo Date de création: %date%
) > "GestionPro-Portable\README.txt"

REM Créer un script d'installation des dépendances
(
echo @echo off
echo title Installation des dépendances GestionPro
echo echo 📦 Installation des dépendances manquantes...
echo npm install
echo echo.
echo echo ✅ Installation terminée
echo pause
) > "GestionPro-Portable\Installer-Dependances.bat"

echo.
echo 🎉 APPLICATION PORTABLE CRÉÉE AVEC SUCCÈS!
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                      SUCCÈS!                                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 📁 Dossier créé: GestionPro-Portable
echo.
echo 🚀 INSTRUCTIONS POUR L'UTILISATEUR:
echo 1. Copiez le dossier "GestionPro-Portable" sur l'ordinateur cible
echo 2. Assurez-vous que Node.js est installé
echo 3. Double-cliquez sur GestionPro.bat
echo 4. L'application se lance automatiquement
echo.
echo 💡 CONSEILS:
echo - Vous pouvez compresser le dossier en ZIP pour faciliter le transfert
echo - L'application fonctionne sans installation système
echo - Toutes les données sont stockées localement
echo.

echo 📂 Ouverture du dossier...
start "" "GestionPro-Portable"

echo.
echo Appuyez sur une touche pour fermer...
pause >nul
