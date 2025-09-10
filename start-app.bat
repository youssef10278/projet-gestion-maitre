@echo off
echo 🚀 Démarrage de GestionPro...
echo.

REM Vérifier si node_modules existe
if not exist "node_modules" (
    echo ⚠️ node_modules manquant, installation des dépendances...
    npm install
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
)

REM Essayer de démarrer avec npm start
echo 🔄 Tentative de démarrage avec npm start...
npm start
if errorlevel 1 (
    echo ⚠️ npm start a échoué, tentative avec npx...
    npx electron .
    if errorlevel 1 (
        echo ❌ Impossible de démarrer l'application
        echo.
        echo 💡 Solutions possibles:
        echo 1. Fermer tous les processus Electron en cours
        echo 2. Redémarrer l'ordinateur
        echo 3. Supprimer node_modules et réinstaller
        echo.
        pause
        exit /b 1
    )
)

echo ✅ Application démarrée avec succès !
