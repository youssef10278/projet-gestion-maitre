@echo off
chcp 65001 >nul
title Test Installateur GestionPro v2.1.0
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                TEST INSTALLATEUR GESTIONPRO                 ║
echo ║                        v2.1.0                               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Vérification de l'installateur...
echo.

set "INSTALLER_PATH=dist-installer\GestionPro-Installer-v2.1.0-win-x64.exe"

if exist "%INSTALLER_PATH%" (
    echo ✅ Installateur trouvé !
    echo 📁 Fichier: %INSTALLER_PATH%
    
    REM Afficher la taille du fichier
    for %%I in ("%INSTALLER_PATH%") do (
        set size=%%~zI
        set /a sizeMB=!size!/1024/1024
    )
    
    echo 💾 Taille: !sizeMB! MB
    echo.
    
    echo 🎯 TESTS DISPONIBLES:
    echo ═══════════════════════════════════════════
    echo [1] Lancer l'installateur (Installation complète)
    echo [2] Tester la version décompressée (Test rapide)
    echo [3] Ouvrir le dossier de l'installateur
    echo [4] Valider l'intégrité de l'installateur
    echo [5] Quitter
    echo.
    
    set /p choice="Votre choix (1-5): "
    
    if "%choice%"=="1" (
        echo.
        echo 🚀 Lancement de l'installateur...
        echo ⚠️  ATTENTION: Cela va installer GestionPro sur cette machine !
        echo.
        pause
        start "" "%INSTALLER_PATH%"
        goto :end
    )
    
    if "%choice%"=="2" (
        echo.
        echo 🧪 Test de la version décompressée...
        if exist "dist-installer\win-unpacked\GestionPro.exe" (
            echo ✅ Version décompressée trouvée
            echo 🚀 Lancement du test...
            start "" "dist-installer\win-unpacked\GestionPro.exe"
        ) else (
            echo ❌ Version décompressée non trouvée
        )
        goto :end
    )
    
    if "%choice%"=="3" (
        echo.
        echo 📂 Ouverture du dossier...
        start "" "dist-installer"
        goto :end
    )
    
    if "%choice%"=="4" (
        echo.
        echo 🔍 Validation de l'intégrité...
        node validate-installer-generated.js
        goto :end
    )
    
    if "%choice%"=="5" (
        goto :end
    )
    
    echo ❌ Choix invalide
    
) else (
    echo ❌ ERREUR: Installateur non trouvé !
    echo 📍 Chemin recherché: %INSTALLER_PATH%
    echo.
    echo 💡 SOLUTIONS:
    echo 1. Générez l'installateur avec: npm run dist
    echo 2. Ou utilisez: GENERER-EXE-MAINTENANT.bat
    echo 3. Vérifiez que vous êtes dans le bon dossier
)

:end
echo.
echo Appuyez sur une touche pour fermer...
pause >nul
