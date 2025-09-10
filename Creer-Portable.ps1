# Script PowerShell pour créer une version portable de GestionPro
Write-Host "🚀 Création de l'application portable GestionPro v2.1.0" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Yellow

# Configuration
$appName = "GestionPro-Portable"
$sourceDir = Get-Location

try {
    # Nettoyer l'ancien dossier s'il existe
    if (Test-Path $appName) {
        Write-Host "🧹 Suppression de l'ancien dossier..." -ForegroundColor Yellow
        Remove-Item $appName -Recurse -Force
    }

    # Créer le dossier portable
    Write-Host "📁 Création du dossier portable..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Name $appName -Force | Out-Null

    # Copier les fichiers essentiels
    Write-Host "📋 Copie des fichiers essentiels..." -ForegroundColor Cyan
    
    $filesToCopy = @(
        "main.js",
        "preload.js", 
        "config.js",
        "database.js",
        "package.json"
    )

    foreach ($file in $filesToCopy) {
        if (Test-Path $file) {
            Copy-Item $file "$appName\" -Force
            Write-Host "✅ Copié: $file" -ForegroundColor Green
        }
    }

    # Copier les dossiers
    Write-Host "📂 Copie des dossiers..." -ForegroundColor Cyan
    
    if (Test-Path "src") {
        Copy-Item "src" "$appName\src" -Recurse -Force
        Write-Host "✅ Dossier src copié" -ForegroundColor Green
    }

    if (Test-Path "database") {
        Copy-Item "database" "$appName\database" -Recurse -Force
        Write-Host "✅ Base de données copiée" -ForegroundColor Green
    }

    # Copier les modules Node.js essentiels
    Write-Host "📦 Copie des modules Node.js..." -ForegroundColor Cyan
    
    if (Test-Path "node_modules") {
        New-Item -ItemType Directory -Path "$appName\node_modules" -Force | Out-Null
        
        $essentialModules = @(
            "electron",
            "better-sqlite3", 
            "bcrypt",
            "axios",
            "node-fetch",
            "node-machine-id",
            ".bin"
        )

        foreach ($module in $essentialModules) {
            $modulePath = "node_modules\$module"
            if (Test-Path $modulePath) {
                Copy-Item $modulePath "$appName\node_modules\$module" -Recurse -Force
                Write-Host "✅ Module $module copié" -ForegroundColor Green
            }
        }
    }

    # Créer le script de lancement
    Write-Host "🚀 Création du script de lancement..." -ForegroundColor Cyan
    
    $launcherScript = @"
@echo off
title GestionPro v2.1.0
cd /d "%~dp0"

echo.
echo ===============================================
echo           GESTIONPRO v2.1.0
echo        Application de Gestion
echo ===============================================
echo.
echo Demarrage de GestionPro...
echo.

REM Verifier Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo Erreur: Node.js non trouve
    echo.
    echo SOLUTION:
    echo 1. Telechargez Node.js depuis https://nodejs.org/
    echo 2. Installez Node.js
    echo 3. Relancez ce script
    echo.
    pause
    exit /b 1
)

echo Node.js detecte, lancement de l'application...
node_modules\.bin\electron . || node_modules\electron\dist\electron.exe . || npx electron .

if errorlevel 1 (
    echo.
    echo Erreur lors du demarrage
    echo Essayez d'installer les dependances: npm install
    pause
)
"@

    $launcherScript | Out-File -FilePath "$appName\GestionPro.bat" -Encoding ASCII

    # Créer un fichier README
    Write-Host "📋 Création du fichier README..." -ForegroundColor Cyan
    
    $readmeContent = @"
# GestionPro v2.1.0 - Application Portable

## Installation et Utilisation

### Prerequis
- Windows 10/11
- Node.js 18+ (telechargeable sur https://nodejs.org/)

### Premiere utilisation
1. Assurez-vous que Node.js est installe
2. Double-cliquez sur GestionPro.bat
3. L'application se lancera automatiquement

### En cas de probleme
1. Ouvrez une invite de commande dans ce dossier
2. Tapez: npm install
3. Relancez GestionPro.bat

### Fonctionnalites
- Gestion de caisse
- Gestion des clients
- Gestion des produits
- Facturation
- Systeme de devis
- Gestion des retours
- Rapports et statistiques

### Support
Pour toute question, contactez l'equipe de support.

Version: 2.1.0
Date de creation: $(Get-Date -Format "dd/MM/yyyy")
"@

    $readmeContent | Out-File -FilePath "$appName\README.txt" -Encoding UTF8

    # Créer un script d'installation des dépendances
    $installScript = @"
@echo off
title Installation des dependances GestionPro
echo Installation des dependances manquantes...
npm install
echo.
echo Installation terminee
pause
"@

    $installScript | Out-File -FilePath "$appName\Installer-Dependances.bat" -Encoding ASCII

    # Afficher le résultat
    Write-Host ""
    Write-Host "🎉 APPLICATION PORTABLE CRÉÉE AVEC SUCCÈS!" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📁 Dossier créé: $appName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 INSTRUCTIONS POUR L'UTILISATEUR:" -ForegroundColor Yellow
    Write-Host "1. Copiez le dossier '$appName' sur l'ordinateur cible" -ForegroundColor White
    Write-Host "2. Assurez-vous que Node.js est installé" -ForegroundColor White
    Write-Host "3. Double-cliquez sur GestionPro.bat" -ForegroundColor White
    Write-Host "4. L'application se lance automatiquement" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 CONSEILS:" -ForegroundColor Yellow
    Write-Host "- Vous pouvez compresser le dossier en ZIP pour faciliter le transfert" -ForegroundColor White
    Write-Host "- L'application fonctionne sans installation système" -ForegroundColor White
    Write-Host "- Toutes les données sont stockées localement" -ForegroundColor White
    Write-Host ""

    # Ouvrir le dossier
    Write-Host "📂 Ouverture du dossier..." -ForegroundColor Cyan
    Start-Process explorer.exe -ArgumentList (Resolve-Path $appName).Path

    Write-Host ""
    Write-Host "✨ Application portable prête à distribuer!" -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "❌ ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Vérifiez que:" -ForegroundColor Yellow
    Write-Host "1. Vous avez les droits d'écriture dans ce dossier" -ForegroundColor White
    Write-Host "2. Aucun antivirus ne bloque l'opération" -ForegroundColor White
    Write-Host "3. Les fichiers source existent" -ForegroundColor White
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
