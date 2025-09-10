@echo off
echo.
echo ========================================
echo   TEST MODIFICATION DES COMMANDES
echo ========================================
echo.

echo [INFO] Ce script va tester la nouvelle fonctionnalite de modification des commandes
echo [INFO] Assurez-vous que l'application GestionPro est fermee avant de continuer
echo.
pause

echo [1/3] Verification de l'environnement...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installe
    pause
    exit /b 1
)

echo [2/3] Demarrage de l'application pour test...
echo [INFO] L'application va se lancer. Une fois ouverte:
echo [INFO] 1. Connectez-vous avec vos identifiants
echo [INFO] 2. Allez dans la page Fournisseurs
echo [INFO] 3. Ouvrez la console de developpement (F12)
echo [INFO] 4. Tapez: testOrderModification()
echo [INFO] 5. Observez les resultats du test
echo.

echo [3/3] Lancement...
npm start

echo.
echo [INFO] Test termine. Verifiez les resultats dans la console.
pause
