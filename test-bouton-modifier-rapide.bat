@echo off
echo ========================================
echo    TEST BOUTON MODIFIER - EXPENSES
echo ========================================
echo.

echo 1. Ouverture de la page de test...
start "" "test-bouton-modifier-expenses.html"

echo.
echo 2. Lancement de l'application...
timeout /t 2 /nobreak >nul

if exist "start-app.bat" (
    echo Demarrage avec start-app.bat...
    start "" "start-app.bat"
) else if exist "start.bat" (
    echo Demarrage avec start.bat...
    start "" "start.bat"
) else (
    echo Demarrage avec npm start...
    start "" cmd /c "npm start"
)

echo.
echo ========================================
echo INSTRUCTIONS DE TEST:
echo ========================================
echo.
echo 1. Attendez que l'application se lance
echo 2. Allez dans "Gestion des Depenses"
echo 3. Cliquez sur un bouton "Modifier"
echo 4. Verifiez que le modal s'ouvre
echo 5. Verifiez que les donnees sont pre-remplies
echo.
echo La page de test est aussi ouverte pour
echo verifier les fonctions globales.
echo.
echo Appuyez sur une touche pour fermer...
pause >nul
