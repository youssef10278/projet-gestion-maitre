@echo off
title GestionPro - Configuration Test Local
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    GESTIONPRO - CONFIGURATION TEST LOCAL                    ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

echo 🧹 Étape 1: Nettoyage des données d'activation...
node reset-activation.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors du nettoyage
    pause
    exit /b 1
)
echo.

echo 🗄️ Étape 2: Démarrage du serveur de licences local...
echo ⚠️ IMPORTANT: Laissez cette fenêtre ouverte !
echo.
echo 📋 Dans une NOUVELLE fenêtre de commande, exécutez:
echo    cd serveur-licence
echo    node server.js
echo.
echo 🔑 Puis générez une clé de test:
echo    node generate-keys.js
echo.
echo 🚀 Enfin, lancez GestionPro:
echo    cd ..
echo    npm start
echo.
echo 💡 La configuration est maintenant en mode LOCAL (localhost:3000)
echo.
pause
