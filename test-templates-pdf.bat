@echo off
echo.
echo ========================================
echo    TEST DES TEMPLATES PDF COMMANDES
echo ========================================
echo.
echo Ce script vous guide pour tester les nouveaux templates PDF
echo pour les bons de commande fournisseurs.
echo.
echo ETAPES A SUIVRE :
echo.
echo 1. Assurez-vous que GestionPro est lance
echo 2. Ouvrez la page Fournisseurs
echo 3. Allez dans l'onglet "Commandes"
echo 4. Ouvrez la console (F12)
echo 5. Executez les commandes de test
echo.
echo ========================================
echo           COMMANDES DE TEST
echo ========================================
echo.
echo Pour un test complet :
echo   testPurchaseOrderPDF()
echo.
echo Pour un test rapide avec apercu :
echo   testQuickHTML()
echo.
echo ========================================
echo         VERIFICATION MANUELLE
echo ========================================
echo.
echo 1. Trouvez une commande existante
echo 2. Cliquez sur le bouton APERCU (icone oeil bleu)
echo 3. Verifiez que le document s'affiche correctement
echo 4. Testez l'export PDF (icone orange)
echo 5. Testez l'impression (icone imprimante indigo)
echo.
echo ========================================
echo            NOUVEAUX BOUTONS
echo ========================================
echo.
echo Dans chaque ligne de commande, vous devriez voir :
echo.
echo - Bouton APERCU (bleu, icone oeil)
echo - Bouton IMPRIMER (indigo, icone imprimante)  
echo - Bouton EXPORT PDF (orange, icone telechargement)
echo.
echo Ces boutons sont ajoutes aux boutons existants :
echo - Voir details, Modifier, Changer statut, etc.
echo.
echo ========================================
echo              RESULTATS
echo ========================================
echo.
echo Si tout fonctionne correctement :
echo.
echo ✓ Les boutons sont visibles
echo ✓ L'apercu s'ouvre dans une nouvelle fenetre
echo ✓ Le document est bien formate (en-tete, tableau, totaux)
echo ✓ L'export PDF propose de sauvegarder le fichier
echo ✓ L'impression ouvre la boite de dialogue
echo.
echo ========================================
echo            EN CAS DE PROBLEME
echo ========================================
echo.
echo 1. Actualisez la page (F5)
echo 2. Verifiez la console pour les erreurs
echo 3. Assurez-vous qu'il y a des commandes dans la liste
echo 4. Testez avec une commande au statut CONFIRMED
echo.
echo ========================================
echo.
pause
echo.
echo Appuyez sur une touche pour fermer...
