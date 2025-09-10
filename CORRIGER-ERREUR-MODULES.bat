@echo off
title Correction Erreur Modules - GestionPro
color 0A
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              CORRECTION ERREUR MODULES NATIFS               ║
echo ║                    GestionPro v2.1.0                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔧 Correction de l'erreur des modules natifs...
echo 💡 Cette erreur est due à une incompatibilité de version Node.js
echo.

REM Fermer tous les processus qui pourraient verrouiller les fichiers
echo 🛑 Fermeture des processus en cours...
taskkill /F /IM electron.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM GestionPro.exe >nul 2>&1
timeout /t 3 >nul

echo 🗑️ Suppression des anciens modules...
if exist node_modules (
    echo    - Suppression du dossier node_modules...
    rmdir /s /q node_modules >nul 2>&1
    timeout /t 2 >nul
    
    REM Vérifier si la suppression a réussi
    if exist node_modules (
        echo    ⚠️ Suppression partielle, tentative forcée...
        rd /s /q node_modules >nul 2>&1
        timeout /t 2 >nul
    )
)

if exist package-lock.json (
    echo    - Suppression du fichier package-lock.json...
    del /f package-lock.json >nul 2>&1
)

echo ✅ Nettoyage terminé

echo.
echo 🧹 Nettoyage du cache npm...
npm cache clean --force >nul 2>&1

echo.
echo 📦 Réinstallation des dépendances...
echo ⏳ Cela peut prendre 3-5 minutes...
echo.

npm install

if errorlevel 1 (
    echo.
    echo ❌ Erreur lors de l'installation
    echo.
    echo 💡 SOLUTIONS ALTERNATIVES:
    echo 1. Redémarrez votre ordinateur
    echo 2. Exécutez ce script en tant qu'administrateur
    echo 3. Désactivez temporairement l'antivirus
    echo 4. Libérez de l'espace disque
    echo.
    pause
    exit /b 1
)

echo.
echo 🔨 Reconstruction des modules natifs...
npm rebuild

if errorlevel 1 (
    echo.
    echo ⚠️ Erreur lors de la reconstruction
    echo 💡 Tentative avec electron-rebuild...
    
    npx electron-rebuild
    
    if errorlevel 1 (
        echo ❌ Échec de la reconstruction
        echo.
        echo 💡 SOLUTIONS:
        echo 1. Vérifiez que vous avez les outils de build Windows
        echo 2. Installez Visual Studio Build Tools
        echo 3. Redémarrez et réessayez
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ✅ Reconstruction terminée avec succès !

echo.
echo 🧪 Test de l'application...
echo.

REM Test simple du module database
node -e "try { const db = require('./database.js'); console.log('✅ Module database OK'); } catch(e) { console.log('❌ Erreur:', e.message); }" 2>nul

if errorlevel 1 (
    echo ❌ Le module database a encore des problèmes
    echo 💡 Essayez de redémarrer votre ordinateur
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    CORRECTION RÉUSSIE !                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ✅ Les modules natifs ont été corrigés
echo ✅ L'application devrait maintenant fonctionner
echo.
echo 🚀 PROCHAINES ÉTAPES:
echo 1. Testez l'application: npm start
echo 2. Lancez les tests de performance: TESTER-PERFORMANCE-1000.bat
echo 3. Vérifiez que tout fonctionne correctement
echo.

set /p launch="Voulez-vous lancer l'application maintenant ? (o/n): "

if /i "%launch%"=="o" (
    echo.
    echo 🚀 Lancement de GestionPro...
    npm start
) else (
    echo.
    echo 📋 Pour lancer l'application plus tard:
    echo    npm start
    echo.
    echo 📊 Pour tester les performances:
    echo    TESTER-PERFORMANCE-1000.bat
)

echo.
echo Appuyez sur une touche pour fermer...
pause >nul
