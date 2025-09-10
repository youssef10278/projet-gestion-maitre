@echo off
title Correction Modules Electron - GestionPro v2.0
color 0A
echo.
echo ===============================================================
echo 🔧 CORRECTION MODULES ELECTRON - GESTIONPRO v2.0
echo ===============================================================
echo.
echo 🎯 Problème détecté: Incompatibilité modules natifs avec Electron
echo 💡 Solution: Reconstruction des modules pour Electron
echo.

echo 🔄 Étape 1: Nettoyage des modules existants...
if exist "node_modules" (
    echo Suppression du dossier node_modules...
    rmdir /s /q node_modules
    echo ✅ Dossier node_modules supprimé
) else (
    echo ℹ️ Dossier node_modules déjà absent
)
echo.

echo 📦 Étape 2: Réinstallation des dépendances...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)
echo ✅ Dépendances réinstallées
echo.

echo 🔨 Étape 3: Reconstruction pour Electron...
call npx electron-rebuild
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de la reconstruction Electron
    pause
    exit /b 1
)
echo ✅ Modules reconstruits pour Electron
echo.

echo 🧪 Étape 4: Test de la base de données...
node -e "const db = require('./database.js'); console.log('✅ Base de données accessible');"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur d'accès à la base de données
    pause
    exit /b 1
)
echo ✅ Base de données testée avec succès
echo.

echo ===============================================================
echo 🎉 CORRECTION TERMINÉE AVEC SUCCÈS
echo ===============================================================
echo.
echo ✅ Modules Electron corrigés
echo ✅ Base de données accessible
echo ✅ Application prête à être lancée
echo.
echo 🚀 Pour lancer l'application: npm start
echo 🧪 Pour tester la TVA: node test-tva-system.js
echo.
echo 💡 CONSEIL: Exécutez ce script à chaque fois que vous rencontrez
echo    des erreurs de modules natifs avec Electron.
echo.
pause
