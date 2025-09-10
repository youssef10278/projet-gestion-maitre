@echo off
echo 🎯 === CRÉATION INSTALLATEUR PORTABLE GESTIONPRO v2.0 ===
echo.

set "SOURCE_DIR=installateur-final\win-unpacked"
set "PORTABLE_DIR=GestionPro-v2.0-Portable"
set "ZIP_FILE=GestionPro-v2.0-Portable.zip"

if not exist "%SOURCE_DIR%" (
    echo ❌ Erreur: Dossier source non trouvé: %SOURCE_DIR%
    echo 💡 Lancez d'abord: npm run dist
    pause
    exit /b 1
)

echo 📁 Création du dossier portable...
if exist "%PORTABLE_DIR%" rmdir /s /q "%PORTABLE_DIR%"
mkdir "%PORTABLE_DIR%"

echo 📋 Copie des fichiers...
xcopy "%SOURCE_DIR%\*" "%PORTABLE_DIR%\" /E /I /H /Y >nul

echo 📝 Création du fichier README...
(
echo === GESTIONPRO v2.0 - VERSION PORTABLE ===
echo.
echo 🎯 SYSTÈME DE LICENCES PROFESSIONNEL
echo    ✅ Activation unique et définitive
echo    ✅ Pas de validation périodique  
echo    ✅ Fonctionne hors ligne
echo    ✅ Protection anti-piratage
echo.
echo 🚀 UTILISATION:
echo    1. Double-cliquez sur GestionPro.exe
echo    2. Activez avec votre clé de licence
echo    3. Fermez et relancez → S'ouvre directement
echo.
echo 🔑 IDENTIFIANTS DE CONNEXION:
echo    Utilisateur: proprietaire
echo    Mot de passe: admin
echo.
echo 📁 INSTALLATION:
echo    - Aucune installation requise
echo    - Copiez ce dossier où vous voulez
echo    - Lancez GestionPro.exe
echo.
echo ⚠️ IMPORTANT:
echo    - Gardez tous les fichiers ensemble
echo    - Ne supprimez aucun fichier du dossier
echo    - Votre licence sera sauvée localement
echo.
echo 🎊 Version: 2.0.0
echo 📅 Date: %date%
) > "%PORTABLE_DIR%\README.txt"

echo 🚀 Création du lanceur...
(
echo @echo off
echo title GestionPro v2.0 - Système Professionnel
echo echo 🎯 Lancement de GestionPro v2.0...
echo echo ✅ Système de licences professionnel
echo echo 💡 Activation unique et définitive
echo echo.
echo start "" "GestionPro.exe"
) > "%PORTABLE_DIR%\Lancer-GestionPro.bat"

echo ✅ Installateur portable créé !
echo.
echo 📊 INFORMATIONS:
echo    📁 Dossier: %PORTABLE_DIR%
echo    🚀 Lanceur: %PORTABLE_DIR%\Lancer-GestionPro.bat
echo    📖 Guide: %PORTABLE_DIR%\README.txt
echo.

for /f %%A in ('dir "%PORTABLE_DIR%" /s /-c ^| find "fichier(s)"') do set filecount=%%A
echo    📋 Fichiers: %filecount%

for /f "tokens=3" %%A in ('dir "%PORTABLE_DIR%" /s /-c ^| find "octets"') do set totalsize=%%A
set /a sizeMB=%totalsize%/1024/1024
echo    💾 Taille: %sizeMB% MB

echo.
echo 🎯 UTILISATION:
echo    1. Copiez le dossier "%PORTABLE_DIR%" où vous voulez
echo    2. Double-cliquez sur "Lancer-GestionPro.bat"
echo    3. Activez avec votre clé de licence
echo    4. Profitez du système professionnel !
echo.
echo 🎊 INSTALLATEUR PORTABLE PRÊT !

pause
