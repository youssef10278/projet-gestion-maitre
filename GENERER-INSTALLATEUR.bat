@echo off
chcp 65001 >nul
title Génération Installateur GestionPro v2.1.0

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                 GÉNÉRATEUR D'INSTALLATEUR                   ║
echo ║                    GestionPro v2.1.0                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🚀 Préparation de la génération de l'installateur...
echo.

REM Vérifier que Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERREUR: Node.js n'est pas installé ou n'est pas dans le PATH
    echo.
    echo 📋 SOLUTION:
    echo 1. Téléchargez Node.js depuis https://nodejs.org/
    echo 2. Installez la version LTS recommandée
    echo 3. Redémarrez cette fenêtre de commande
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js détecté
echo.

REM Vérifier que npm est disponible
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERREUR: npm n'est pas disponible
    pause
    exit /b 1
)

echo ✅ npm détecté
echo.

REM Lancer le script de génération
echo 🎯 Lancement de la génération...
echo.

node generer-installateur-final.js

if errorlevel 1 (
    echo.
    echo ❌ ERREUR lors de la génération de l'installateur
    echo.
    echo 🔧 SOLUTIONS POSSIBLES:
    echo 1. Vérifiez que toutes les dépendances sont installées
    echo 2. Exécutez: npm install
    echo 3. Nettoyez le cache: npm cache clean --force
    echo 4. Supprimez node_modules et réinstallez
    echo.
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    GÉNÉRATION TERMINÉE                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🎉 L'installateur a été généré avec succès!
echo.
echo 📁 Vérifiez le dossier 'dist-installer' pour trouver votre fichier .exe
echo.

REM Ouvrir le dossier de destination si possible
if exist "dist-installer" (
    echo 📂 Ouverture du dossier de destination...
    start "" "dist-installer"
)

echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause >nul
