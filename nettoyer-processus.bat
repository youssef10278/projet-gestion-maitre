@echo off
title Nettoyage Processus GestionPro
echo.
echo 🔄 Arrêt forcé des processus...
echo.

REM Arrêter tous les processus Electron
taskkill /F /IM electron.exe /T 2>nul
if %ERRORLEVEL% EQU 0 echo ✅ Processus Electron arrêtés

REM Arrêter tous les processus Node.js
taskkill /F /IM node.exe /T 2>nul
if %ERRORLEVEL% EQU 0 echo ✅ Processus Node.js arrêtés

REM Arrêter GestionPro
taskkill /F /IM GestionPro.exe /T 2>nul
if %ERRORLEVEL% EQU 0 echo ✅ GestionPro arrêté

REM Arrêter app-builder
taskkill /F /IM app-builder.exe /T 2>nul
if %ERRORLEVEL% EQU 0 echo ✅ App-builder arrêté

echo.
echo ⏳ Attente de libération des fichiers (5 secondes)...
timeout /t 5 /nobreak >nul

echo.
echo 🧹 Nettoyage des dossiers de build...

if exist "installateur-gestionpro" (
    rmdir /s /q "installateur-gestionpro" 2>nul
    if %ERRORLEVEL% EQU 0 echo ✅ installateur-gestionpro supprimé
)

if exist "gestionpro-installer-final" (
    rmdir /s /q "gestionpro-installer-final" 2>nul
    if %ERRORLEVEL% EQU 0 echo ✅ gestionpro-installer-final supprimé
)

if exist "dist" (
    rmdir /s /q "dist" 2>nul
    if %ERRORLEVEL% EQU 0 echo ✅ dist supprimé
)

echo.
echo 🎯 Nettoyage terminé ! Vous pouvez maintenant lancer la génération.
echo.
pause
