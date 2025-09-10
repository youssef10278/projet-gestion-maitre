@echo off
title Test de Réinitialisation Totale - GestionPro
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    TEST DE RÉINITIALISATION TOTALE - GESTIONPRO             ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🧪 Ce script va tester la fonction de réinitialisation totale
echo.
echo ⚠️  ATTENTION: Ce test nécessite une base de données existante
echo.
echo ═══════════════════════════════════════════════════════════════════════════════
echo.

echo 🔍 Étape 1: Validation de la complétude du script...
echo.
node valider-reinitialisation-complete.js
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo 🧪 Étape 2: Test de l'état actuel de la base...
echo.
node test-reinitialisation-totale.js
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo.
echo 💡 INSTRUCTIONS POUR TESTER LA RÉINITIALISATION:
echo.
echo 1. Lancez l'application GestionPro
echo 2. Allez dans Paramètres ^> Données
echo 3. Cliquez sur "🗑️ SUPPRIMER TOUT"
echo 4. Confirmez la réinitialisation
echo 5. Relancez ce script pour vérifier le résultat
echo.
echo ⚠️  RAPPEL: La réinitialisation supprime TOUT définitivement !
echo.

pause
echo.
echo 🔚 Test terminé. Appuyez sur une touche pour fermer...
pause >nul
