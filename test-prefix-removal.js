/**
 * Test de la suppression des préfixes dans les codes-barres
 */

console.log('🧪 === TEST SUPPRESSION PRÉFIXES CODES-BARRES ===\n');

// Fonction de test (copie de la fonction corrigée)
function cleanAndValidateBarcode(barcode) {
    if (!barcode) return '';
    
    // Convertir en string et nettoyer les caractères de base
    let cleaned = String(barcode)
        .trim()                           // Supprimer espaces début/fin
        .replace(/[\r\n\t]/g, '')         // Supprimer retours chariot/tabulations
        .toUpperCase();                   // Normaliser en majuscules d'abord
    
    // Supprimer les préfixes courants AVANT le nettoyage des caractères spéciaux
    const prefixesToRemove = [
        'CODE:', 'BARCODE:', 'BC:', 'ID:', 'PROD:', 'ITEM:', 'SKU:', 'REF:'
    ];
    
    prefixesToRemove.forEach(prefix => {
        if (cleaned.startsWith(prefix)) {
            cleaned = cleaned.substring(prefix.length);
        }
    });
    
    // Supprimer les suffixes courants
    const suffixesToRemove = ['END', 'STOP', 'FIN'];
    suffixesToRemove.forEach(suffix => {
        if (cleaned.endsWith(suffix)) {
            cleaned = cleaned.substring(0, cleaned.length - suffix.length);
        }
    });
    
    // Maintenant nettoyer les caractères spéciaux
    cleaned = cleaned.replace(/[^a-zA-Z0-9\-_]/g, '');
    
    // Validation de longueur (codes-barres standards: 4-20 caractères)
    if (cleaned.length < 4 || cleaned.length > 20) {
        console.warn('Code-barres longueur invalide:', cleaned.length, 'Code:', cleaned);
        return '';
    }
    
    return cleaned;
}

// Tests de suppression des préfixes
const testCases = [
    // Cas problématique signalé
    { input: 'CODE:xyz789', expected: 'XYZ789', description: 'Préfixe CODE: avec code alphanumérique' },
    
    // Autres préfixes
    { input: 'BARCODE:123456', expected: '123456', description: 'Préfixe BARCODE: avec code numérique' },
    { input: 'BC:test123', expected: 'TEST123', description: 'Préfixe BC: court' },
    { input: 'ID:prod001', expected: 'PROD001', description: 'Préfixe ID: avec code produit' },
    { input: 'PROD:abc123', expected: 'ABC123', description: 'Préfixe PROD: avec code mixte' },
    { input: 'ITEM:xyz456', expected: 'XYZ456', description: 'Préfixe ITEM: avec code alphanumérique' },
    { input: 'SKU:789012', expected: '789012', description: 'Préfixe SKU: avec code numérique' },
    { input: 'REF:test789', expected: 'TEST789', description: 'Préfixe REF: avec code test' },
    
    // Suffixes
    { input: 'abc123END', expected: 'ABC123', description: 'Suffixe END' },
    { input: 'xyz456STOP', expected: 'XYZ456', description: 'Suffixe STOP' },
    { input: 'test789FIN', expected: 'TEST789', description: 'Suffixe FIN' },
    
    // Combinaisons
    { input: 'CODE:abc123END', expected: 'ABC123', description: 'Préfixe + Suffixe' },
    { input: '  PROD:xyz789  ', expected: 'XYZ789', description: 'Préfixe avec espaces' },
    { input: 'ID:test@#123', expected: 'TEST123', description: 'Préfixe avec caractères spéciaux' },
    
    // Cas sans préfixes (doivent rester inchangés)
    { input: 'simple123', expected: 'SIMPLE123', description: 'Code simple sans préfixe' },
    { input: 'test-456', expected: 'TEST-456', description: 'Code avec tiret' },
    { input: 'abc_789', expected: 'ABC_789', description: 'Code avec underscore' },
    
    // Cas limites
    { input: 'CODE:', expected: '', description: 'Préfixe seul (trop court)' },
    { input: 'CODE:ab', expected: '', description: 'Préfixe + code trop court' },
    { input: 'CODE:abcd', expected: 'ABCD', description: 'Préfixe + code minimum' },
];

console.log('📋 Exécution des tests...\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    const result = cleanAndValidateBarcode(test.input);
    const success = result === test.expected;
    
    console.log(`Test ${index + 1}: ${test.description}`);
    console.log(`   Entrée: "${test.input}"`);
    console.log(`   Attendu: "${test.expected}"`);
    console.log(`   Résultat: "${result}"`);
    console.log(`   Statut: ${success ? '✅ RÉUSSI' : '❌ ÉCHEC'}`);
    console.log('');
    
    if (success) {
        passed++;
    } else {
        failed++;
    }
});

console.log('🎯 === RÉSULTATS DES TESTS ===');
console.log('');
console.log(`✅ Tests réussis: ${passed}`);
console.log(`❌ Tests échoués: ${failed}`);
console.log(`📊 Total: ${testCases.length}`);
console.log(`📈 Taux de réussite: ${Math.round((passed / testCases.length) * 100)}%`);
console.log('');

if (failed === 0) {
    console.log('🎉 TOUS LES TESTS SONT RÉUSSIS !');
    console.log('');
    console.log('✅ La suppression des préfixes fonctionne correctement');
    console.log('✅ CODE:xyz789 devient maintenant XYZ789');
    console.log('✅ Tous les préfixes courants sont supprimés');
    console.log('✅ Les suffixes sont également gérés');
    console.log('');
    console.log('🚀 CORRECTION VALIDÉE - PRÊTE POUR PRODUCTION');
} else {
    console.log('⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('');
    console.log('🔧 Vérifiez la fonction cleanAndValidateBarcode()');
    console.log('🔧 Assurez-vous que les préfixes sont supprimés AVANT le nettoyage');
}

console.log('');
console.log('📋 INSTRUCTIONS POUR TESTER DANS GESTIONPRO:');
console.log('');
console.log('1. 🔄 Redémarrer GestionPro');
console.log('2. 🖥️ Aller dans Caisse');
console.log('3. 📝 Taper: CODE:xyz789');
console.log('4. ✅ Vérifier que ça devient: XYZ789');
console.log('5. 🧪 Tester autres préfixes: PROD:test123 → TEST123');
console.log('');
console.log('💡 Si le problème persiste, vérifiez que les fichiers JS sont bien sauvegardés.');
