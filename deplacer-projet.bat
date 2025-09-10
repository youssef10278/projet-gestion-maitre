@echo off
title Déplacement du Projet GestionPro
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    📁 DÉPLACEMENT PROJET GESTIONPRO                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🎯 PROBLÈME IDENTIFIÉ:
echo    • Chemin actuel trop long (131 caractères)
echo    • Contient des espaces et caractères accentués
echo    • Peut causer des problèmes avec electron-builder
echo.
echo 📍 Chemin actuel:
echo    %CD%
echo.
echo 💡 SOLUTION RECOMMANDÉE:
echo    Déplacer le projet vers: C:\GestionPro\
echo.
echo ⚠️  ATTENTION: Cette opération va:
echo    1. Créer le dossier C:\GestionPro\
echo    2. Copier tous les fichiers du projet
echo    3. Vous devrez ensuite travailler depuis le nouveau dossier
echo.
set /p confirm="Voulez-vous continuer? (O/N): "
if /i "%confirm%" NEQ "O" (
    echo.
    echo ❌ Opération annulée
    echo.
    echo 🔧 ALTERNATIVES:
    echo    1. Déplacez manuellement le projet vers un chemin plus court
    echo    2. Ou utilisez la version portable déjà créée
    echo.
    pause
    exit /b 0
)

echo.
echo 🚀 Démarrage du déplacement...
echo.

REM Créer le nouveau dossier
if not exist "C:\GestionPro" (
    mkdir "C:\GestionPro"
    echo ✅ Dossier C:\GestionPro créé
) else (
    echo ⚠️  Le dossier C:\GestionPro existe déjà
    set /p overwrite="Voulez-vous le remplacer? (O/N): "
    if /i "%overwrite%" NEQ "O" (
        echo ❌ Opération annulée
        pause
        exit /b 0
    )
    rmdir /s /q "C:\GestionPro" 2>nul
    mkdir "C:\GestionPro"
    echo ✅ Dossier C:\GestionPro recréé
)

echo.
echo 📋 Copie des fichiers en cours...
echo    Cela peut prendre quelques minutes...
echo.

REM Copier tous les fichiers sauf les dossiers de build
xcopy "%CD%" "C:\GestionPro" /E /I /H /Y /EXCLUDE:exclusions.txt

REM Créer le fichier d'exclusions pour éviter de copier les builds
echo installateur-gestionpro\ > exclusions.txt
echo gestionpro-installer-final\ >> exclusions.txt
echo node_modules\.cache\ >> exclusions.txt
echo .git\ >> exclusions.txt

echo.
echo ✅ Copie terminée !
echo.
echo 📂 NOUVEAU EMPLACEMENT:
echo    C:\GestionPro\
echo.
echo 🎯 PROCHAINES ÉTAPES:
echo    1. Ouvrez une nouvelle invite de commande
echo    2. Naviguez vers: cd C:\GestionPro
echo    3. Installez les dépendances: npm install
echo    4. Générez l'installateur: npm run dist
echo.
echo 💡 AVANTAGES DU NOUVEAU CHEMIN:
echo    • Chemin court (13 caractères)
echo    • Pas d'espaces ni d'accents
echo    • Compatible avec tous les outils de build
echo.
echo 🗑️  NETTOYAGE:
echo    Une fois que tout fonctionne dans C:\GestionPro\,
echo    vous pourrez supprimer l'ancien dossier.
echo.
echo 🚀 Ouvrir le nouveau dossier maintenant?
set /p open="Ouvrir C:\GestionPro dans l'explorateur? (O/N): "
if /i "%open%" EQU "O" (
    explorer "C:\GestionPro"
)

echo.
echo 🎉 DÉPLACEMENT TERMINÉ !
echo.
pause
