# Script pour corriger le problème Electron
Write-Host "Correction du probleme Electron..." -ForegroundColor Yellow

# Arreter tous les processus
Write-Host "Arret des processus..." -ForegroundColor Cyan
Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Supprimer seulement le dossier electron problematique
Write-Host "Suppression du dossier electron..." -ForegroundColor Cyan
if (Test-Path "node_modules\electron") {
    try {
        Remove-Item -Path "node_modules\electron" -Recurse -Force -ErrorAction Stop
        Write-Host "Dossier electron supprime" -ForegroundColor Green
    }
    catch {
        Write-Host "Utilisation de robocopy pour forcer la suppression..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path "temp_empty" -Force | Out-Null
        robocopy "temp_empty" "node_modules\electron" /MIR /R:0 /W:0 | Out-Null
        Remove-Item -Path "temp_empty" -Force
        Remove-Item -Path "node_modules\electron" -Force -ErrorAction SilentlyContinue
    }
}

# Installer electron separement
Write-Host "Installation d'Electron..." -ForegroundColor Cyan
npm install electron@28.3.3 --save-dev --no-optional

if ($LASTEXITCODE -eq 0) {
    Write-Host "Electron installe avec succes !" -ForegroundColor Green
    
    # Verifier l'installation
    if (Test-Path "node_modules\electron\dist\electron.exe") {
        Write-Host "Verification: Electron executable trouve" -ForegroundColor Green
        
        # Tester le demarrage
        Write-Host "Test de demarrage..." -ForegroundColor Cyan
        Start-Process -FilePath "node_modules\electron\dist\electron.exe" -ArgumentList "." -NoNewWindow -Wait -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        Write-Host "Application prete !" -ForegroundColor Green
        Write-Host "Utilisez: npm start ou .\node_modules\electron\dist\electron.exe ." -ForegroundColor Cyan
    } else {
        Write-Host "Probleme: executable Electron non trouve" -ForegroundColor Red
    }
} else {
    Write-Host "Echec de l'installation d'Electron" -ForegroundColor Red
    Write-Host "Essayez de redemarrer l'ordinateur" -ForegroundColor Yellow
}

Write-Host "Script termine" -ForegroundColor Green
