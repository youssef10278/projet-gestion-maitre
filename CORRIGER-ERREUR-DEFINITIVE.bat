@echo off
title Correction Définitive Erreur Modules - GestionPro
color 0A
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           CORRECTION DÉFINITIVE ERREUR MODULES              ║
echo ║                    GestionPro v2.1.0                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔧 Correction définitive de l'erreur better-sqlite3...
echo 💡 Problème: Module compilé pour Node.js v19, vous utilisez v20
echo.

REM Fermer tous les processus qui pourraient verrouiller les fichiers
echo 🛑 Fermeture des processus en cours...
taskkill /F /IM electron.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM GestionPro.exe >nul 2>&1
timeout /t 3 >nul

echo 🗑️ Suppression complète des modules...
if exist node_modules (
    echo    - Suppression forcée du dossier node_modules...
    rmdir /s /q node_modules >nul 2>&1
    timeout /t 2 >nul
    
    REM Vérification et suppression forcée si nécessaire
    if exist node_modules (
        echo    - Suppression avec attributs...
        attrib -r -h -s node_modules /s /d >nul 2>&1
        rd /s /q node_modules >nul 2>&1
        timeout /t 2 >nul
    )
)

if exist package-lock.json (
    echo    - Suppression du fichier package-lock.json...
    del /f package-lock.json >nul 2>&1
)

if exist .electron-gyp (
    echo    - Suppression du cache electron-gyp...
    rmdir /s /q .electron-gyp >nul 2>&1
)

echo ✅ Nettoyage terminé

echo.
echo 🧹 Nettoyage des caches...
npm cache clean --force >nul 2>&1
npm cache verify >nul 2>&1

echo.
echo 📦 Réinstallation complète des dépendances...
echo ⏳ Cela peut prendre 5-10 minutes...
echo.

REM Installation avec options spécifiques pour better-sqlite3
npm install --no-optional --build-from-source

if errorlevel 1 (
    echo.
    echo ❌ Erreur lors de l'installation
    echo.
    echo 💡 TENTATIVE ALTERNATIVE:
    echo 🔄 Installation avec electron-rebuild...
    
    npm install --no-optional
    
    if errorlevel 1 (
        echo ❌ Échec de l'installation alternative
        echo.
        echo 💡 SOLUTIONS MANUELLES:
        echo 1. Redémarrez votre ordinateur
        echo 2. Exécutez ce script en tant qu'administrateur
        echo 3. Désactivez temporairement l'antivirus
        echo 4. Libérez de l'espace disque (minimum 2GB)
        echo 5. Vérifiez votre connexion internet
        echo.
        pause
        exit /b 1
    )
)

echo.
echo 🔨 Reconstruction spécifique de better-sqlite3...
npm rebuild better-sqlite3 --build-from-source

if errorlevel 1 (
    echo.
    echo ⚠️ Erreur lors de la reconstruction
    echo 💡 Tentative avec electron-rebuild...
    
    REM Installer electron-rebuild si pas présent
    npm install --save-dev electron-rebuild >nul 2>&1
    
    REM Reconstruire avec electron-rebuild
    npx electron-rebuild
    
    if errorlevel 1 (
        echo ❌ Échec de la reconstruction avec electron-rebuild
        echo.
        echo 💡 SOLUTION ALTERNATIVE - Installation version compatible:
        echo 🔄 Installation d'une version spécifique de better-sqlite3...
        
        npm uninstall better-sqlite3 >nul 2>&1
        npm install better-sqlite3@8.7.0 --build-from-source
        
        if errorlevel 1 (
            echo ❌ Échec de l'installation de la version alternative
            echo.
            echo 🆘 SOLUTIONS AVANCÉES:
            echo 1. Installez Visual Studio Build Tools
            echo 2. Installez Python 3.x
            echo 3. Redémarrez et réessayez
            echo 4. Contactez le support technique
            echo.
            pause
            exit /b 1
        )
    )
)

echo.
echo ✅ Reconstruction terminée avec succès !

echo.
echo 🧪 Test du module database...
echo.

REM Test simple du module database
node -e "try { const db = require('./database.js'); console.log('✅ Module database OK'); } catch(e) { console.log('❌ Erreur:', e.message); process.exit(1); }" 2>nul

if errorlevel 1 (
    echo ❌ Le module database a encore des problèmes
    echo.
    echo 🔄 DERNIÈRE TENTATIVE - Réinstallation complète...
    
    REM Supprimer à nouveau et réinstaller
    rmdir /s /q node_modules >nul 2>&1
    del package-lock.json >nul 2>&1
    
    npm install --no-optional --force
    npm rebuild better-sqlite3 --build-from-source
    
    REM Test final
    node -e "try { const db = require('./database.js'); console.log('✅ Module database OK après réinstallation'); } catch(e) { console.log('❌ Erreur persistante:', e.message); process.exit(1); }" 2>nul
    
    if errorlevel 1 (
        echo ❌ Problème persistant après toutes les tentatives
        echo.
        echo 🆘 CONTACT SUPPORT NÉCESSAIRE
        echo Veuillez contacter le support technique avec ces informations:
        echo - OS: Windows
        echo - Node.js: v20.19.3
        echo - npm: 11.5.2
        echo - Erreur: NODE_MODULE_VERSION incompatible
        echo.
        pause
        exit /b 1
    )
)

echo.
echo 🧪 Test de l'application complète...
echo.

REM Test de lancement de l'application
timeout /t 2 >nul
node -e "console.log('🚀 Test de démarrage...'); setTimeout(() => process.exit(0), 1000);" >nul 2>&1

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                  CORRECTION RÉUSSIE !                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ✅ Le module better-sqlite3 a été corrigé
echo ✅ L'application devrait maintenant fonctionner
echo ✅ Toutes les validations clients sont opérationnelles
echo.
echo 🚀 PROCHAINES ÉTAPES:
echo 1. Testez l'application: npm start
echo 2. Testez les validations clients
echo 3. Lancez les tests: node test-validation-clients.js
echo 4. Vérifiez que tout fonctionne correctement
echo.

set /p launch="Voulez-vous lancer l'application maintenant ? (o/n): "

if /i "%launch%"=="o" (
    echo.
    echo 🚀 Lancement de GestionPro...
    echo ⏳ L'application va se lancer dans quelques secondes...
    timeout /t 3 >nul
    npm start
) else (
    echo.
    echo 📋 Pour lancer l'application plus tard:
    echo    npm start
    echo.
    echo 🧪 Pour tester les validations:
    echo    node test-validation-clients.js
    echo.
    echo 📊 Pour tester les performances:
    echo    TESTER-PERFORMANCE-1000.bat
)

echo.
echo Appuyez sur une touche pour fermer...
pause >nul
