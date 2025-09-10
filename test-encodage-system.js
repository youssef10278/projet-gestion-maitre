/**
 * Test d'encodage système pour les codes-barres
 * Vérifie l'encodage au niveau du système d'exploitation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 === TEST D\'ENCODAGE SYSTÈME ===\n');

// Informations système
console.log('💻 INFORMATIONS SYSTÈME:');
console.log(`   OS: ${os.type()} ${os.release()}`);
console.log(`   Architecture: ${os.arch()}`);
console.log(`   Plateforme: ${os.platform()}`);
console.log(`   Locale: ${process.env.LANG || process.env.LC_ALL || 'Non définie'}`);
console.log(`   Encodage par défaut: ${process.stdout.encoding || 'utf8'}`);
console.log('');

// Tests d'encodage
const testCodes = [
    'CODE:xyz789',
    '  abc123  ',
    'test@#$123',
    'abc\r\n123',
    'BARCODE:456789',
    '123END',
    'PROD-2024-001',
    'éàçù123',  // Caractères accentués
    '测试123',   // Caractères chinois
    '🔍📱💾',   // Emojis
];

console.log('🧪 TESTS D\'ENCODAGE:');
console.log('');

testCodes.forEach((code, index) => {
    console.log(`Test ${index + 1}: "${code}"`);
    console.log(`   Longueur: ${code.length} caractères`);
    console.log(`   Taille UTF-8: ${Buffer.byteLength(code, 'utf8')} bytes`);
    console.log(`   Taille ASCII: ${Buffer.byteLength(code, 'ascii')} bytes`);
    
    // Analyse caractère par caractère
    const chars = [];
    for (let i = 0; i < code.length; i++) {
        const char = code.charAt(i);
        const charCode = code.charCodeAt(i);
        chars.push(`${char}(${charCode})`);
    }
    console.log(`   Caractères: [${chars.join(', ')}]`);
    
    // Encodage hexadécimal
    const hex = Buffer.from(code, 'utf8').toString('hex');
    console.log(`   Hex UTF-8: ${hex}`);
    
    // Test de nettoyage
    const cleaned = cleanAndValidateBarcode(code);
    console.log(`   Nettoyé: "${cleaned}"`);
    console.log(`   Statut: ${cleaned ? '✅ VALIDE' : '❌ INVALIDE'}`);
    console.log('');
});

// Fonction de nettoyage (copie de GestionPro)
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
        console.warn(`   ⚠️ Longueur invalide: ${cleaned.length} caractères`);
        return '';
    }
    
    return cleaned;
}

// Test de lecture/écriture de fichier
console.log('📁 TEST LECTURE/ÉCRITURE FICHIER:');
const testFile = path.join(__dirname, 'test-encodage-temp.txt');

try {
    // Écrire les codes de test dans un fichier
    const content = testCodes.join('\n');
    fs.writeFileSync(testFile, content, 'utf8');
    console.log('   ✅ Écriture fichier réussie');
    
    // Relire le fichier
    const readContent = fs.readFileSync(testFile, 'utf8');
    const isIdentical = content === readContent;
    console.log(`   ✅ Lecture fichier: ${isIdentical ? 'IDENTIQUE' : 'DIFFÉRENT'}`);
    
    if (!isIdentical) {
        console.log('   ❌ PROBLÈME D\'ENCODAGE DÉTECTÉ !');
        console.log(`   Original: ${content.length} caractères`);
        console.log(`   Lu: ${readContent.length} caractères`);
    }
    
    // Nettoyer
    fs.unlinkSync(testFile);
    console.log('   🧹 Fichier temporaire supprimé');
    
} catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
}

console.log('');

// Test des variables d'environnement
console.log('🌐 VARIABLES D\'ENVIRONNEMENT:');
const envVars = ['LANG', 'LC_ALL', 'LC_CTYPE', 'CHCP', 'CODEPAGE'];
envVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`   ${varName}: ${value || 'Non définie'}`);
});

console.log('');

// Test de la console
console.log('🖥️ TEST CONSOLE:');
console.log('   Encodage stdout:', process.stdout.encoding || 'utf8');
console.log('   Encodage stderr:', process.stderr.encoding || 'utf8');
console.log('   Encodage stdin:', process.stdin.encoding || 'utf8');

// Test de caractères spéciaux dans la console
console.log('');
console.log('🔤 TEST AFFICHAGE CARACTÈRES SPÉCIAUX:');
const specialChars = [
    { name: 'Accents français', chars: 'éàçùôî' },
    { name: 'Caractères étendus', chars: 'ñüß€£' },
    { name: 'Symboles', chars: '©®™°±' },
    { name: 'Flèches', chars: '←→↑↓' },
    { name: 'Boîtes', chars: '┌┐└┘│─' }
];

specialChars.forEach(test => {
    console.log(`   ${test.name}: ${test.chars}`);
});

console.log('');

// Recommandations
console.log('💡 RECOMMANDATIONS:');
console.log('');

if (os.platform() === 'win32') {
    console.log('   🪟 WINDOWS DÉTECTÉ:');
    console.log('   • Vérifier que la console utilise UTF-8');
    console.log('   • Commande: chcp 65001');
    console.log('   • Vérifier les paramètres régionaux');
    console.log('');
}

console.log('   📋 POUR TESTER AVEC SCANNER:');
console.log('   1. Ouvrir test-encodage-codes-barres.html');
console.log('   2. Scanner des codes dans les champs de test');
console.log('   3. Observer les résultats d\'encodage');
console.log('   4. Comparer avec les résultats attendus');
console.log('');

console.log('   🔧 SI PROBLÈMES DÉTECTÉS:');
console.log('   • Vérifier les paramètres du scanner');
console.log('   • Tester le scanner dans un éditeur de texte');
console.log('   • Vérifier l\'encodage du système');
console.log('   • Mettre à jour les pilotes du scanner');
console.log('');

// Résumé final
console.log('📊 RÉSUMÉ DU TEST:');
console.log('');

const validCodes = testCodes.filter(code => cleanAndValidateBarcode(code)).length;
const totalCodes = testCodes.length;

console.log(`   Codes testés: ${totalCodes}`);
console.log(`   Codes valides après nettoyage: ${validCodes}`);
console.log(`   Taux de réussite: ${Math.round((validCodes / totalCodes) * 100)}%`);
console.log('');

if (validCodes === totalCodes) {
    console.log('🎉 TOUS LES TESTS SONT RÉUSSIS !');
    console.log('   Le système d\'encodage fonctionne correctement.');
} else {
    console.log('⚠️ CERTAINS CODES ONT ÉTÉ REJETÉS');
    console.log('   Cela peut être normal selon les règles de validation.');
}

console.log('');
console.log('🔍 Pour des tests interactifs, ouvrez: test-encodage-codes-barres.html');
console.log('📱 Testez avec votre scanner physique pour des résultats réels.');
console.log('');
console.log('✅ Test d\'encodage système terminé.');
