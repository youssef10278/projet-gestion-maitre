@echo off
echo 🚀 === GÉNÉRATION INSTALLATEUR GESTIONPRO v2.0 ===
echo.

echo 🧹 Nettoyage préalable...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM GestionPro.exe 2>nul
timeout /t 2 >nul

if exist "gestionpro-professionnel" (
    echo Suppression ancien dossier...
    rmdir /s /q "gestionpro-professionnel" 2>nul
    timeout /t 1 >nul
)

echo ✅ Nettoyage terminé

echo.
echo 📦 Génération de l'installateur...
echo ⏳ Cela peut prendre plusieurs minutes...
echo 💡 Ne fermez pas cette fenêtre !
echo.

npm run dist

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 === INSTALLATEUR GÉNÉRÉ AVEC SUCCÈS ===
    echo.
    
    if exist "gestionpro-professionnel\GestionPro Setup 2.0.0.exe" (
        echo ✅ Fichier trouvé: GestionPro Setup 2.0.0.exe
        
        for %%I in ("gestionpro-professionnel\GestionPro Setup 2.0.0.exe") do (
            set size=%%~zI
            set /a sizeMB=!size!/1024/1024
        )
        
        echo 📊 Taille: %sizeMB% MB
        echo 📁 Emplacement: gestionpro-professionnel\
        echo.
        echo 🎯 FONCTIONNALITÉS:
        echo    ✅ Système de licences professionnel
        echo    ✅ Activation unique et définitive
        echo    ✅ Pas de validation périodique
        echo    ✅ Protection anti-piratage
        echo.
        echo 🧪 POUR TESTER:
        echo    1. Double-cliquez sur l'installateur
        echo    2. Installez l'application
        echo    3. Activez avec une clé valide
        echo    4. Fermez et relancez → Doit s'ouvrir directement
        echo.
        echo 🔑 IDENTIFIANTS:
        echo    Utilisateur: proprietaire
        echo    Mot de passe: admin
        
    ) else (
        echo ❌ Fichier installateur non trouvé !
        echo 💡 Vérifiez les erreurs ci-dessus
    )
    
) else (
    echo.
    echo ❌ ERREUR lors de la génération
    echo 💡 Vérifiez les messages d'erreur ci-dessus
    echo 🔧 Solutions possibles:
    echo    - Libérez de l'espace disque
    echo    - Fermez toutes les instances de l'application
    echo    - Relancez en tant qu'administrateur
)

echo.
pause
