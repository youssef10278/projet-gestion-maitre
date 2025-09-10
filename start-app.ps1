# Script PowerShell pour démarrer GestionPro
Write-Host "🚀 Démarrage de GestionPro..." -ForegroundColor Green
Write-Host ""

# Fonction pour vérifier si un processus Electron est en cours
function Test-ElectronRunning {
    $electronProcesses = Get-Process -Name "electron" -ErrorAction SilentlyContinue
    return $electronProcesses.Count -gt 0
}

# Fonction pour arrêter les processus Electron
function Stop-ElectronProcesses {
    Write-Host "🔄 Arrêt des processus Electron en cours..." -ForegroundColor Yellow
    Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️ node_modules manquant, installation des dépendances..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "✅ Dépendances installées avec succès" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erreur lors de l'installation des dépendances: $($_.Exception.Message)" -ForegroundColor Red
        Read-Host "Appuyez sur Entrée pour continuer..."
        exit 1
    }
}

# Si Electron est déjà en cours, proposer de l'arrêter
if (Test-ElectronRunning) {
    Write-Host "⚠️ Des processus Electron sont déjà en cours d'exécution" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous les arrêter et redémarrer l'application ? (o/n)"
    if ($response -eq "o" -or $response -eq "O" -or $response -eq "oui") {
        Stop-ElectronProcesses
    }
}

# Tentative de démarrage avec npm start
Write-Host "🔄 Tentative de démarrage avec npm start..." -ForegroundColor Cyan
try {
    npm start
    Write-Host "✅ Application démarrée avec succès !" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ npm start a échoué, tentative avec npx..." -ForegroundColor Yellow
    try {
        npx electron .
        Write-Host "✅ Application démarrée avec npx !" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Impossible de démarrer l'application" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Solutions possibles:" -ForegroundColor Cyan
        Write-Host "1. Fermer tous les processus Electron en cours" -ForegroundColor White
        Write-Host "2. Redémarrer l'ordinateur" -ForegroundColor White
        Write-Host "3. Supprimer node_modules et réinstaller:" -ForegroundColor White
        Write-Host "   Remove-Item -Recurse -Force node_modules" -ForegroundColor Gray
        Write-Host "   npm install" -ForegroundColor Gray
        Write-Host ""
        Read-Host "Appuyez sur Entrée pour continuer..."
        exit 1
    }
}
