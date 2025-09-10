@echo off
echo Demarrage de GestionPro...
"%~dp0node_modules\electron\dist\electron.exe" .
if errorlevel 1 (
    echo Erreur lors du demarrage
    pause
)
