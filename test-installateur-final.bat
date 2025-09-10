@echo off
title Test Installateur GestionPro v2.0.0
color 0A
echo.
echo ===============================================================
echo 🎉 INSTALLATEUR GESTIONPRO v2.0.0 GÉNÉRÉ AVEC SUCCÈS !
echo ===============================================================
echo.

set "INSTALLER_PATH=gestionpro-installer-final\GestionPro Setup 2.0.0.exe"

if exist "%INSTALLER_PATH%" (
    echo ✅ INSTALLATEUR TROUVÉ !
    echo.
    echo 📦 INFORMATIONS DE L'INSTALLATEUR:
    echo    📁 Emplacement: %CD%\%INSTALLER_PATH%
    echo    📄 Nom: GestionPro Setup 2.0.0.exe
    
    setlocal enabledelayedexpansion
    for %%I in ("%INSTALLER_PATH%") do (
        set size=%%~zI
        set /a sizeMB=!size!/1024/1024
        echo    📏 Taille: !sizeMB! MB
    )
    endlocal
    
    echo    🕒 Créé: %date% %time%
    echo.
    echo ✨ FONCTIONNALITÉS INCLUSES:
    echo    • 💰 Système de caisse complet
    echo    • 👥 Gestion clients avec ICE
    echo    • 📦 Gestion produits et stocks
    echo    • 🧾 Facturation professionnelle avec TVA
    echo    • 📊 Dashboard et analytics
    echo    • 🔐 Authentification sécurisée
    echo    • 🌍 Support multilingue (FR/AR)
    echo    • 🎨 Interface moderne Tailwind CSS
    echo.
    echo 🔧 POUR INSTALLER:
    echo    1. Double-cliquez sur "GestionPro Setup 2.0.0.exe"
    echo    2. Suivez l'assistant d'installation
    echo    3. Choisissez le répertoire d'installation
    echo    4. Lancez GestionPro depuis le raccourci
    echo.
    echo 🔑 PREMIÈRE CONNEXION:
    echo    👤 Utilisateur: proprietaire
    echo    🔐 Mot de passe: admin
    echo    ⚠️  Changez le mot de passe après la première connexion
    echo.
    echo 🎯 PRÊT POUR LA DISTRIBUTION !
    echo.
    
    choice /C YN /M "Voulez-vous ouvrir le dossier de l'installateur"
    if errorlevel 2 goto :end
    if errorlevel 1 explorer "%CD%\gestionpro-installer-final"
    
) else (
    echo ❌ ERREUR: Installateur non trouvé !
    echo 💡 Vérifiez que la génération s'est bien terminée
    echo 📁 Chemin attendu: %CD%\%INSTALLER_PATH%
)

:end
echo.
echo Appuyez sur une touche pour fermer...
pause >nul
