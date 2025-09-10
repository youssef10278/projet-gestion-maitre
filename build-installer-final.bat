@echo off
title Génération Installateur GestionPro v2.0 - Système Professionnel
color 0A
echo.
echo ===============================================================
echo 🎯 GÉNÉRATION INSTALLATEUR GESTIONPRO v2.0 - SYSTÈME PROFESSIONNEL
echo ===============================================================
echo.
echo ✅ Fonctionnalités incluses:
echo    - Système de licences professionnel
echo    - Activation unique et définitive
echo    - Pas de validation périodique
echo    - Protection anti-piratage
echo    - Fonctionne hors ligne après activation
echo.
echo 🧹 Nettoyage préalable...

REM Fermer tous les processus Electron
taskkill /F /IM electron.exe >nul 2>&1
taskkill /F /IM GestionPro.exe >nul 2>&1
timeout /t 2 >nul

REM Supprimer les anciens builds
if exist "gestionpro-v2-final" (
    echo Suppression ancien dossier de build...
    rmdir /s /q "gestionpro-v2-final" >nul 2>&1
    timeout /t 1 >nul
)

echo ✅ Nettoyage terminé
echo.
echo 📦 Génération de l'installateur...
echo ⏳ Cela peut prendre 5-10 minutes selon votre machine
echo 💡 Ne fermez pas cette fenêtre pendant le processus !
echo.

REM Lancer le build
npm run dist

REM Vérifier le résultat
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================
    echo 🎉 INSTALLATEUR GÉNÉRÉ AVEC SUCCÈS !
    echo ===============================================================
    echo.
    
    if exist "gestionpro-v2-final\GestionPro Setup 2.0.0.exe" (
        echo ✅ Fichier installateur créé: GestionPro Setup 2.0.0.exe
        echo 📁 Emplacement: gestionpro-v2-final\
        
        REM Afficher la taille du fichier
        for %%I in ("gestionpro-v2-final\GestionPro Setup 2.0.0.exe") do (
            set size=%%~zI
            set /a sizeMB=!size!/1024/1024
        )
        
        echo 💾 Taille: !sizeMB! MB
        echo.
        echo 🎯 FONCTIONNALITÉS DE L'INSTALLATEUR:
        echo    ✅ Installation Windows standard (NSIS)
        echo    ✅ Choix du répertoire d'installation
        echo    ✅ Création des raccourcis bureau/menu
        echo    ✅ Désinstallation propre
        echo    ✅ Système de licences professionnel intégré
        echo.
        echo 🧪 POUR TESTER L'INSTALLATEUR:
        echo    1. Double-cliquez sur "GestionPro Setup 2.0.0.exe"
        echo    2. Suivez l'assistant d'installation
        echo    3. Lancez GestionPro depuis le raccourci
        echo    4. Activez avec votre clé de licence
        echo    5. Fermez et relancez → Doit s'ouvrir directement !
        echo.
        echo 🔑 IDENTIFIANTS DE CONNEXION:
        echo    Utilisateur: proprietaire
        echo    Mot de passe: admin
        echo.
        echo 🎊 INSTALLATEUR PROFESSIONNEL PRÊT À DISTRIBUER !
        
    ) else (
        echo ❌ Erreur: Fichier installateur non trouvé
        echo 💡 Vérifiez les messages d'erreur ci-dessus
    )
    
) else (
    echo.
    echo ===============================================================
    echo ❌ ERREUR LORS DE LA GÉNÉRATION
    echo ===============================================================
    echo.
    echo 💡 Solutions possibles:
    echo    - Vérifiez l'espace disque disponible
    echo    - Fermez toutes les instances de l'application
    echo    - Relancez en tant qu'administrateur
    echo    - Vérifiez les messages d'erreur ci-dessus
)

echo.
echo Appuyez sur une touche pour fermer...
pause >nul
