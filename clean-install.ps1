# Script de nettoyage et réinstallation complète
Write-Host "Nettoyage complet et reinstallation..." -ForegroundColor Yellow

# Arreter tous les processus qui pourraient bloquer
Write-Host "Arret des processus..." -ForegroundColor Cyan
Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Nettoyer le cache npm
Write-Host "Nettoyage du cache npm..." -ForegroundColor Cyan
npm cache clean --force

# Supprimer node_modules avec force
Write-Host "Suppression de node_modules..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    try {
        Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction Stop
        Write-Host "node_modules supprime" -ForegroundColor Green
    }
    catch {
        Write-Host "Suppression partielle, tentative avec robocopy..." -ForegroundColor Yellow
        # Méthode alternative avec robocopy pour les fichiers verrouillés
        New-Item -ItemType Directory -Path "temp_empty" -Force | Out-Null
        robocopy "temp_empty" "node_modules" /MIR /R:0 /W:0 | Out-Null
        Remove-Item -Path "temp_empty" -Force
        Remove-Item -Path "node_modules" -Force -ErrorAction SilentlyContinue
    }
}

# Supprimer package-lock.json
Write-Host "Suppression de package-lock.json..." -ForegroundColor Cyan
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
}

# Reinstaller les dependances
Write-Host "Reinstallation des dependances..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "Installation reussie !" -ForegroundColor Green

    # Tester le demarrage
    Write-Host "Test de demarrage..." -ForegroundColor Cyan
    if (Test-Path "node_modules\electron\dist\electron.exe") {
        Write-Host "Electron installe correctement" -ForegroundColor Green
        Write-Host "Vous pouvez maintenant utiliser:" -ForegroundColor Cyan
        Write-Host "   npm start" -ForegroundColor White
        Write-Host "   ou" -ForegroundColor Gray
        Write-Host "   .\node_modules\electron\dist\electron.exe ." -ForegroundColor White
    } else {
        Write-Host "Electron non trouve, installation manuelle..." -ForegroundColor Yellow
        npm install electron --save-dev
    }
} else {
    Write-Host "Erreur lors de l'installation" -ForegroundColor Red
    Write-Host "Essayez de redemarrer l'ordinateur et relancer ce script" -ForegroundColor Cyan
}

Write-Host "Script termine" -ForegroundColor Green
