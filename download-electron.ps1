# Script pour télécharger Electron manuellement
Write-Host "Telechargement manuel d'Electron..." -ForegroundColor Yellow

# URL de téléchargement d'Electron pour Windows x64
$electronVersion = "28.3.3"
$electronUrl = "https://github.com/electron/electron/releases/download/v$electronVersion/electron-v$electronVersion-win32-x64.zip"
$tempFile = "electron-temp.zip"
$electronDir = "node_modules\electron\dist"

Write-Host "Version: $electronVersion" -ForegroundColor Cyan
Write-Host "URL: $electronUrl" -ForegroundColor Gray

# Créer le dossier de destination
if (-not (Test-Path $electronDir)) {
    New-Item -ItemType Directory -Path $electronDir -Force | Out-Null
}

try {
    Write-Host "Telechargement en cours..." -ForegroundColor Cyan
    
    # Télécharger Electron
    Invoke-WebRequest -Uri $electronUrl -OutFile $tempFile -UseBasicParsing
    
    Write-Host "Extraction..." -ForegroundColor Cyan
    
    # Extraire le zip
    Expand-Archive -Path $tempFile -DestinationPath $electronDir -Force
    
    # Nettoyer
    Remove-Item $tempFile -Force
    
    # Vérifier que l'exécutable existe
    if (Test-Path "$electronDir\electron.exe") {
        Write-Host "Electron installe avec succes !" -ForegroundColor Green
        
        # Créer le dossier .bin et le lien
        $binDir = "node_modules\.bin"
        if (-not (Test-Path $binDir)) {
            New-Item -ItemType Directory -Path $binDir -Force | Out-Null
        }
        
        # Créer un script batch pour electron
        $electronBat = @"
@echo off
"%~dp0..\electron\dist\electron.exe" %*
"@
        Set-Content -Path "$binDir\electron.cmd" -Value $electronBat
        
        Write-Host "Script electron.cmd cree dans .bin" -ForegroundColor Green
        
        # Tester le démarrage
        Write-Host "Test de l'application..." -ForegroundColor Cyan
        
        # Créer un script de démarrage simple
        $startScript = @"
@echo off
echo Demarrage de GestionPro...
"%~dp0node_modules\electron\dist\electron.exe" .
if errorlevel 1 (
    echo Erreur lors du demarrage
    pause
)
"@
        Set-Content -Path "start-gestionpro.bat" -Value $startScript
        
        Write-Host "Script start-gestionpro.bat cree" -ForegroundColor Green
        Write-Host "" -ForegroundColor White
        Write-Host "SUCCES ! Vous pouvez maintenant utiliser:" -ForegroundColor Green
        Write-Host "  1. start-gestionpro.bat" -ForegroundColor White
        Write-Host "  2. npm start" -ForegroundColor White
        Write-Host "  3. node_modules\electron\dist\electron.exe ." -ForegroundColor White
        
    } else {
        Write-Host "Erreur: electron.exe non trouve apres extraction" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Erreur lors du telechargement: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifiez votre connexion internet" -ForegroundColor Yellow
}

Write-Host "Script termine" -ForegroundColor Green
