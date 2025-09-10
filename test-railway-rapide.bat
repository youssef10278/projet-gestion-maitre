@echo off
echo.
echo ========================================
echo   TEST RAPIDE SERVEUR RAILWAY
echo ========================================
echo.

echo [1/3] Test de base...
node test-serveur-railway.js

echo.
echo [2/3] Test complet...
node test-railway-complet.js

echo.
echo [3/3] Test manuel avec curl...
echo.

set SERVER_URL=https://gestionpro-license-server-production-e0b2.up.railway.app

echo Test endpoint racine:
curl -s -o nul -w "Status: %%{http_code} | Temps: %%{time_total}s\n" %SERVER_URL%

echo.
echo Test endpoint /health:
curl -s -o nul -w "Status: %%{http_code} | Temps: %%{time_total}s\n" %SERVER_URL%/health

echo.
echo ========================================
echo   TESTS TERMINES
echo ========================================
echo.
echo Si tous les tests montrent Status: 200, votre serveur fonctionne !
echo.
pause
