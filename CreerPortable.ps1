Write-Host "Creation de l'application portable GestionPro v2.1.0" -ForegroundColor Green

$appName = "GestionPro-Portable"

try {
    # Nettoyer l'ancien dossier
    if (Test-Path $appName) {
        Write-Host "Suppression de l'ancien dossier..." -ForegroundColor Yellow
        Remove-Item $appName -Recurse -Force
    }

    # Créer le dossier portable
    Write-Host "Creation du dossier portable..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Name $appName -Force | Out-Null

    # Copier les fichiers essentiels
    Write-Host "Copie des fichiers essentiels..." -ForegroundColor Cyan
    
    $files = @("main.js", "preload.js", "config.js", "database.js", "package.json")
    foreach ($file in $files) {
        if (Test-Path $file) {
            Copy-Item $file "$appName\" -Force
            Write-Host "Copie: $file" -ForegroundColor Green
        }
    }

    # Copier les dossiers
    if (Test-Path "src") {
        Copy-Item "src" "$appName\src" -Recurse -Force
        Write-Host "Dossier src copie" -ForegroundColor Green
    }

    if (Test-Path "database") {
        Copy-Item "database" "$appName\database" -Recurse -Force
        Write-Host "Base de donnees copiee" -ForegroundColor Green
    }

    # Copier les modules essentiels
    if (Test-Path "node_modules") {
        Write-Host "Copie des modules Node.js..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path "$appName\node_modules" -Force | Out-Null
        
        $modules = @("electron", "better-sqlite3", "bcrypt", "axios", "node-fetch", "node-machine-id", ".bin")
        foreach ($module in $modules) {
            $modulePath = "node_modules\$module"
            if (Test-Path $modulePath) {
                Copy-Item $modulePath "$appName\node_modules\$module" -Recurse -Force
                Write-Host "Module $module copie" -ForegroundColor Green
            }
        }
    }

    # Créer le script de lancement
    Write-Host "Creation du script de lancement..." -ForegroundColor Cyan
    
    $launcher = '@echo off
title GestionPro v2.1.0
cd /d "%~dp0"
echo.
echo ===============================================
echo           GESTIONPRO v2.1.0
echo        Application de Gestion
echo ===============================================
echo.
echo Demarrage de GestionPro...

node --version >nul 2>&1
if errorlevel 1 (
    echo Erreur: Node.js non trouve
    echo Telechargez Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo Lancement de l application...
node_modules\.bin\electron .
if errorlevel 1 (
    node_modules\electron\dist\electron.exe .
)
if errorlevel 1 (
    echo Erreur lors du demarrage
    pause
)'

    $launcher | Out-File -FilePath "$appName\GestionPro.bat" -Encoding ASCII

    # Créer le README
    $readme = 'GestionPro v2.1.0 - Application Portable

INSTALLATION:
1. Assurez-vous que Node.js est installe (https://nodejs.org/)
2. Double-cliquez sur GestionPro.bat
3. L application se lance automatiquement

FONCTIONNALITES:
- Gestion de caisse
- Gestion des clients et produits
- Facturation et devis
- Rapports et statistiques

EN CAS DE PROBLEME:
1. Ouvrez une invite de commande dans ce dossier
2. Tapez: npm install
3. Relancez GestionPro.bat

Version: 2.1.0'

    $readme | Out-File -FilePath "$appName\README.txt" -Encoding UTF8

    Write-Host ""
    Write-Host "APPLICATION PORTABLE CREEE!" -ForegroundColor Green
    Write-Host "Dossier: $appName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
    Write-Host "1. Copiez le dossier sur l'ordinateur cible" -ForegroundColor White
    Write-Host "2. Installez Node.js si necessaire" -ForegroundColor White
    Write-Host "3. Lancez GestionPro.bat" -ForegroundColor White
    Write-Host ""

    # Ouvrir le dossier
    Start-Process explorer.exe -ArgumentList (Resolve-Path $appName).Path
    Write-Host "Dossier ouvert!" -ForegroundColor Green

} catch {
    Write-Host "ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Appuyez sur Entree pour fermer..." -ForegroundColor Gray
Read-Host
