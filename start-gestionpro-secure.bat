@echo off
title GestionPro v2.0 - Démarrage Sécurisé avec TVA
color 0A
echo.
echo ===============================================================
echo 🚀 GESTIONPRO v2.0 - DÉMARRAGE SÉCURISÉ AVEC SYSTÈME TVA
echo ===============================================================
echo.
echo ✅ Fonctionnalités incluses:
echo    - Système TVA professionnel complet
echo    - Calculs automatiques HT/TVA/TTC
echo    - Taux multiples (0%%, 10%%, 20%%, personnalisé)
echo    - Factures PDF conformes
echo    - Interface multilingue (FR/AR)
echo.

echo 🔍 Vérification des modules Electron...
node -e "const db = require('./database.js'); console.log('✅ Modules OK');" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Problème détecté avec les modules natifs
    echo 🔧 Correction automatique en cours...
    echo.
    
    echo 📦 Reconstruction des modules pour Electron...
    call npx electron-rebuild
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erreur lors de la reconstruction
        echo 💡 Essayez d'exécuter: fix-electron-modules.bat
        pause
        exit /b 1
    )
    
    echo 🧪 Test après correction...
    node -e "const db = require('./database.js'); console.log('✅ Correction réussie');" >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Correction échouée
        echo 💡 Exécutez manuellement: fix-electron-modules.bat
        pause
        exit /b 1
    )
    echo ✅ Modules corrigés avec succès
) else (
    echo ✅ Modules Electron OK
)
echo.

echo 🗄️ Initialisation de la base de données...
node -e "const db = require('./database.js'); db.initDatabase(); console.log('✅ Base initialisée');"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur d'initialisation de la base
    pause
    exit /b 1
)
echo.

echo 🎯 Vérification du système TVA...
node -e "const db = require('./database.js'); const invoice = db.invoicesDB.getAll(); console.log('✅ Système TVA opérationnel');"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur système TVA
    pause
    exit /b 1
)
echo.

echo 🚀 Lancement de GestionPro avec système TVA...
echo.
echo 🔑 IDENTIFIANTS DE CONNEXION:
echo    Utilisateur: proprietaire
echo    Mot de passe: admin
echo.
echo 💰 POUR TESTER LE SYSTÈME TVA:
echo    1. Allez dans "Facturation"
echo    2. Créez une "Nouvelle Facture"
echo    3. Ajoutez des articles
echo    4. Testez les différents taux TVA
echo    5. Vérifiez les calculs automatiques
echo    6. Sauvegardez et imprimez en PDF
echo.
echo ⏳ Démarrage de l'application...

npm start

echo.
echo ===============================================================
echo 🎉 SESSION GESTIONPRO TERMINÉE
echo ===============================================================
echo.
echo 💡 En cas de problème:
echo    - Modules natifs: fix-electron-modules.bat
echo    - Tests TVA: node test-tva-system.js
echo    - Démonstration: node demo-tva-system.js
echo.
pause
