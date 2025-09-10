@echo off
echo.
echo ========================================
echo   GENERATION INSTALLATEUR GESTIONPRO
echo ========================================
echo.

echo [1/5] Verification de l'environnement...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installe
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: npm n'est pas installe
    pause
    exit /b 1
)

echo ✅ Node.js et npm detectes

echo.
echo [2/5] Installation des dependances...
if not exist "node_modules" (
    echo Installation en cours...
    npm install
    if errorlevel 1 (
        echo ERREUR: Echec installation dependances
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependances deja installees
)

echo.
echo [3/5] Compilation CSS...
npm run build-css
if errorlevel 1 (
    echo ATTENTION: Erreur CSS, continuation...
)

echo.
echo [4/5] Nettoyage cache...
if exist "dist-installer" (
    echo Suppression ancien build...
    rmdir /s /q "dist-installer"
)

echo.
echo [5/5] Generation installateur...
echo ⏳ Cela peut prendre plusieurs minutes...
echo.

npm run dist
if errorlevel 1 (
    echo.
    echo ❌ ERREUR: Echec generation installateur
    echo.
    echo Solutions possibles:
    echo - Verifier que tous les fichiers sont presents
    echo - Relancer en tant qu'administrateur
    echo - Verifier l'espace disque disponible
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   INSTALLATEUR GENERE AVEC SUCCES !
echo ========================================
echo.

if exist "dist-installer" (
    echo 📁 Fichiers generes dans: dist-installer\
    echo.
    dir "dist-installer\*.exe" /b 2>nul
    if errorlevel 1 (
        echo ⚠️ Aucun fichier .exe trouve
    ) else (
        echo.
        echo 🎉 INSTALLATEUR PRET !
        echo.
        echo Prochaines etapes:
        echo 1. Tester l'installateur sur une machine propre
        echo 2. Verifier le fonctionnement de l'application
        echo 3. Distribuer aux utilisateurs
    )
) else (
    echo ⚠️ Dossier dist-installer non trouve
)

echo.
echo Appuyez sur une touche pour continuer...
pause >nul
