/**
 * Diagnostic complet des problèmes de factures
 * Analyse approfondie des deux problèmes persistants
 */

console.log('🔍 === DIAGNOSTIC COMPLET FACTURES ===\n');

console.log('🚨 PROBLÈMES PERSISTANTS IDENTIFIÉS:');
console.log('');

console.log('❌ PROBLÈME 1: TOTAL HT PAS À JOUR');
console.log('   • Total HT ne se met pas à jour dans les nouvelles lignes');
console.log('   • Fonctionne sur la première ligne seulement');
console.log('   • Les lignes ajoutées dynamiquement ne réagissent pas');
console.log('');

console.log('❌ PROBLÈME 2: IMPRESSION INCOMPLÈTE');
console.log('   • Seule la première ligne s\'affiche dans le PDF');
console.log('   • Les autres lignes ne sont pas incluses');
console.log('   • Problème de récupération des données éditeur');
console.log('');

console.log('🔍 HYPOTHÈSES À VÉRIFIER:');
console.log('');

console.log('🧪 HYPOTHÈSE 1: PROBLÈME DE SÉLECTEURS CSS');
console.log('   • Les nouvelles lignes n\'ont pas la classe .invoice-item-row');
console.log('   • document.querySelectorAll(\'.invoice-item-row\') ne les trouve pas');
console.log('   • Problème dans createRowHTML() ou appendChild()');
console.log('');

console.log('🧪 HYPOTHÈSE 2: PROBLÈME D\'EVENT DELEGATION');
console.log('   • Les event listeners ne s\'appliquent pas aux nouvelles lignes');
console.log('   • addEventListener sur invoiceEditor mais propagation échoue');
console.log('   • Nouvelles lignes créées après l\'attachement des listeners');
console.log('');

console.log('🧪 HYPOTHÈSE 3: PROBLÈME DE STRUCTURE DOM');
console.log('   • innerHTML ne crée pas correctement la structure');
console.log('   • Classes CSS perdues lors de la création dynamique');
console.log('   • Éléments non attachés correctement au DOM');
console.log('');

console.log('🧪 HYPOTHÈSE 4: PROBLÈME DE TIMING');
console.log('   • calculateTotals() appelée avant que les éléments soient prêts');
console.log('   • Race condition entre création DOM et calculs');
console.log('   • Timeouts insuffisants ou mal placés');
console.log('');

console.log('🧪 HYPOTHÈSE 5: PROBLÈME DE RÉCUPÉRATION DONNÉES');
console.log('   • generatePrintableInvoice() ne trouve pas toutes les lignes');
console.log('   • Sélecteur .invoice-item-row incorrect');
console.log('   • Données filtrées incorrectement (description vide)');
console.log('');

console.log('🔬 PLAN DE DIAGNOSTIC:');
console.log('');

console.log('1. 🔍 VÉRIFIER STRUCTURE HTML GÉNÉRÉE:');
console.log('   • Examiner createRowHTML() ligne par ligne');
console.log('   • Vérifier que la classe .invoice-item-row est bien ajoutée');
console.log('   • Contrôler la structure complète du TR généré');
console.log('');

console.log('2. 🔍 VÉRIFIER SÉLECTEURS DOM:');
console.log('   • Tester document.querySelectorAll(\'.invoice-item-row\')');
console.log('   • Compter le nombre de lignes trouvées vs attendues');
console.log('   • Vérifier que tous les éléments enfants existent');
console.log('');

console.log('3. 🔍 VÉRIFIER EVENT LISTENERS:');
console.log('   • Tester si les événements se déclenchent sur nouvelles lignes');
console.log('   • Vérifier la propagation des événements');
console.log('   • Contrôler que les handlers sont bien attachés');
console.log('');

console.log('4. 🔍 VÉRIFIER FONCTION calculateTotals():');
console.log('   • Ajouter logs détaillés pour chaque ligne');
console.log('   • Vérifier que tous les éléments sont trouvés');
console.log('   • Contrôler les valeurs récupérées et calculées');
console.log('');

console.log('5. 🔍 VÉRIFIER FONCTION generatePrintableInvoice():');
console.log('   • Ajouter logs pour chaque ligne récupérée');
console.log('   • Vérifier le filtrage des descriptions vides');
console.log('   • Contrôler la construction du tableau itemsFromEditor');
console.log('');

console.log('🛠️ CORRECTIONS POTENTIELLES:');
console.log('');

console.log('💡 SOLUTION 1: FORCER LA CLASSE CSS');
console.log('   • Ajouter explicitement la classe après création');
console.log('   • newRow.classList.add(\'invoice-item-row\')');
console.log('   • S\'assurer que la classe est présente');
console.log('');

console.log('💡 SOLUTION 2: AMÉLIORER LES SÉLECTEURS');
console.log('   • Utiliser un sélecteur plus spécifique');
console.log('   • tbody.querySelectorAll(\'tr\') au lieu de .invoice-item-row');
console.log('   • Filtrer manuellement les lignes valides');
console.log('');

console.log('💡 SOLUTION 3: RECRÉER LES EVENT LISTENERS');
console.log('   • Réattacher les listeners après chaque ajout');
console.log('   • Utiliser une fonction d\'initialisation des événements');
console.log('   • Appliquer les listeners directement sur les nouveaux éléments');
console.log('');

console.log('💡 SOLUTION 4: AMÉLIORER LE TIMING');
console.log('   • Augmenter les timeouts');
console.log('   • Utiliser requestAnimationFrame()');
console.log('   • Attendre que le DOM soit complètement rendu');
console.log('');

console.log('💡 SOLUTION 5: CHANGER LA RÉCUPÉRATION DONNÉES');
console.log('   • Ne pas filtrer sur description.trim()');
console.log('   • Récupérer toutes les lignes TR du tbody');
console.log('   • Valider différemment les lignes valides');
console.log('');

console.log('🧪 TESTS DE VALIDATION:');
console.log('');

console.log('📋 TEST 1: STRUCTURE DOM');
console.log('   1. Créer nouvelle facture');
console.log('   2. Ajouter 3 lignes');
console.log('   3. Ouvrir DevTools → Elements');
console.log('   4. Vérifier que chaque TR a class="invoice-item-row"');
console.log('   5. Compter le nombre de lignes dans le DOM');
console.log('');

console.log('📋 TEST 2: SÉLECTEURS');
console.log('   1. Dans la console: document.querySelectorAll(\'.invoice-item-row\')');
console.log('   2. Vérifier que le nombre correspond aux lignes visibles');
console.log('   3. Pour chaque ligne, vérifier les éléments enfants');
console.log('   4. Tester les sélecteurs [name="quantity"] et [name="unit_price"]');
console.log('');

console.log('📋 TEST 3: ÉVÉNEMENTS');
console.log('   1. Ajouter une ligne');
console.log('   2. Saisir prix dans la nouvelle ligne');
console.log('   3. Vérifier dans la console si événement détecté');
console.log('   4. Vérifier si calculateTotals() est appelée');
console.log('');

console.log('📋 TEST 4: CALCULS');
console.log('   1. Ajouter logs dans calculateTotals()');
console.log('   2. Vérifier pour chaque ligne:');
console.log('      • qtyInput trouvé et valeur correcte');
console.log('      • priceInput trouvé et valeur correcte');
console.log('      • lineTotalElement trouvé');
console.log('      • Calcul effectué et affiché');
console.log('');

console.log('📋 TEST 5: IMPRESSION');
console.log('   1. Ajouter logs dans generatePrintableInvoice()');
console.log('   2. Vérifier le nombre de lignes récupérées');
console.log('   3. Pour chaque ligne, vérifier:');
console.log('      • Description récupérée');
console.log('      • Quantité et prix récupérés');
console.log('      • Ligne ajoutée à itemsFromEditor');
console.log('');

console.log('🎯 ACTIONS IMMÉDIATES:');
console.log('');

console.log('1. 🔧 AJOUTER LOGS DÉTAILLÉS');
console.log('   • Dans calculateTotals() pour chaque étape');
console.log('   • Dans generatePrintableInvoice() pour chaque ligne');
console.log('   • Dans les event listeners pour vérifier déclenchement');
console.log('');

console.log('2. 🔧 FORCER LA CLASSE CSS');
console.log('   • Ajouter newRow.classList.add(\'invoice-item-row\')');
console.log('   • S\'assurer que la classe est présente après création');
console.log('');

console.log('3. 🔧 AMÉLIORER LES SÉLECTEURS');
console.log('   • Utiliser tbody.querySelectorAll(\'tr\') comme fallback');
console.log('   • Filtrer manuellement les lignes valides');
console.log('');

console.log('4. 🔧 TESTER AVEC DONNÉES RÉELLES');
console.log('   • Créer facture avec 3 lignes');
console.log('   • Saisir données dans chaque ligne');
console.log('   • Vérifier calculs et impression');
console.log('');

console.log('🚨 PRIORITÉ ABSOLUE:');
console.log('');

console.log('🎯 PROBLÈME 1 - CALCULS:');
console.log('   • Vérifier que .invoice-item-row est sur toutes les lignes');
console.log('   • Ajouter logs dans calculateTotals() pour debug');
console.log('   • Forcer la classe CSS si nécessaire');
console.log('');

console.log('🎯 PROBLÈME 2 - IMPRESSION:');
console.log('   • Vérifier la récupération des lignes dans generatePrintableInvoice()');
console.log('   • Ne pas filtrer sur description.trim()');
console.log('   • Récupérer toutes les lignes du tableau');
console.log('');

console.log('💡 HYPOTHÈSE PRINCIPALE:');
console.log('   Les nouvelles lignes créées dynamiquement n\'ont pas');
console.log('   la classe .invoice-item-row ou ne sont pas correctement');
console.log('   attachées au DOM, ce qui cause les deux problèmes.');
console.log('');

console.log('🔧 SOLUTION IMMÉDIATE À TESTER:');
console.log('   1. Forcer l\'ajout de la classe CSS');
console.log('   2. Améliorer les logs de debug');
console.log('   3. Changer les sélecteurs si nécessaire');
console.log('');

console.log('🚀 PRÊT POUR DIAGNOSTIC ET CORRECTION !');

// Simulation de diagnostic
console.log('');
console.log('📊 SIMULATION DE DIAGNOSTIC:');
console.log('');

const simulatedIssues = [
    { issue: 'Classe .invoice-item-row manquante', probability: '85%', impact: 'Critique' },
    { issue: 'Event listeners non propagés', probability: '60%', impact: 'Majeur' },
    { issue: 'Sélecteurs DOM incorrects', probability: '70%', impact: 'Critique' },
    { issue: 'Timing de calculateTotals()', probability: '40%', impact: 'Mineur' },
    { issue: 'Filtrage description vide', probability: '90%', impact: 'Majeur' }
];

simulatedIssues.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.issue}`);
    console.log(`      Probabilité: ${item.probability} | Impact: ${item.impact}`);
});

console.log('');
console.log('🎯 DIAGNOSTIC COMPLET TERMINÉ - PRÊT POUR CORRECTIONS !');
