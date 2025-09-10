@echo off
title GestionPro v2.0 - Système Professionnel
echo.
echo 🎯 === GESTIONPRO v2.0 - SYSTÈME PROFESSIONNEL ===
echo.
echo ✅ Système de licences professionnel
echo ✅ Activation unique et définitive  
echo ✅ Pas de validation périodique
echo ✅ Fonctionne hors ligne après activation
echo.
echo 🚀 Lancement de GestionPro...
echo.

cd /d "%~dp0"

if exist "installateur-final\win-unpacked\GestionPro.exe" (
    echo 📁 Lancement depuis: installateur-final\win-unpacked\
    start "" "installateur-final\win-unpacked\GestionPro.exe"
    echo ✅ Application lancée !
    echo.
    echo 🔑 IDENTIFIANTS DE CONNEXION:
    echo    Utilisateur: proprietaire
    echo    Mot de passe: admin
    echo.
    echo 💡 PREMIÈRE UTILISATION:
    echo    1. Activez avec votre clé de licence
    echo    2. Fermez et relancez → S'ouvrira directement
    echo.
    echo 🎊 Profitez du système professionnel !
) else (
    echo ❌ Erreur: Fichier GestionPro.exe non trouvé
    echo 💡 Vérifiez que le dossier installateur-final existe
    pause
)

timeout /t 3 >nul
