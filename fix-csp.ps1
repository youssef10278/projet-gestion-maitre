# Script pour corriger les CSP dans tous les fichiers HTML
Write-Host "Correction des Content Security Policy..." -ForegroundColor Yellow

$htmlFiles = Get-ChildItem -Path "src" -Filter "*.html" -Recurse

foreach ($file in $htmlFiles) {
    Write-Host "Traitement de $($file.Name)..." -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw
    
    # Remplacer la CSP restrictive par une CSP qui permet les scripts inline
    $newContent = $content -replace 'content="script-src ''self''"', 'content="script-src ''self'' ''unsafe-inline''"'
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "  CSP mise a jour pour $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "  Aucune modification necessaire pour $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "Correction des CSP terminee !" -ForegroundColor Green
