// Test pour les scans multiples rapides
console.log('🧪 === TEST SCANS MULTIPLES RAPIDES ===\n');

// Simuler la fonction de nettoyage de code-barres
function cleanAndValidateBarcode(barcode) {
    if (!barcode) return '';

    let cleaned = String(barcode)
        .trim()
        .replace(/[\r\n\t]/g, '')
        .toUpperCase();

    const prefixesToRemove = [
        'CODE:', 'BARCODE:', 'BC:', 'ID:', 'PROD:', 'ITEM:', 'SKU:', 'REF:'
    ];

    prefixesToRemove.forEach(prefix => {
        if (cleaned.startsWith(prefix)) {
            cleaned = cleaned.substring(prefix.length);
        }
    });

    const suffixesToRemove = ['END', 'STOP', 'FIN'];
    suffixesToRemove.forEach(suffix => {
        if (cleaned.endsWith(suffix)) {
            cleaned = cleaned.substring(0, cleaned.length - suffix.length);
        }
    });

    cleaned = cleaned.replace(/[^a-zA-Z0-9\-_]/g, '');

    if (cleaned.length < 4 || cleaned.length > 20) {
        console.warn('⚠️ Code-barres longueur invalide:', cleaned.length, 'Code:', cleaned);
        return '';
    }

    return cleaned;
}

// Simuler la détection de codes multiples
function detectMultipleBarcodes(concatenatedValue) {
    console.log('🔍 Analyse de la chaîne concaténée:', concatenatedValue);
    console.log('   Longueur totale:', concatenatedValue.length);
    
    const possibleCodes = [];
    
    // Essayer de séparer en codes de 13 caractères (EAN-13 standard)
    console.log('\n📊 Tentative séparation en codes de 13 caractères:');
    for (let i = 0; i < concatenatedValue.length; i += 13) {
        const code = concatenatedValue.substring(i, i + 13);
        if (code.length >= 8) {
            possibleCodes.push(code);
            console.log(`   Code ${possibleCodes.length}: "${code}" (${code.length} chars)`);
        }
    }
    
    // Si ça ne marche pas bien, essayer des codes de 12 caractères (UPC-A)
    if (possibleCodes.length === 0 || possibleCodes.some(code => code.length !== 13)) {
        console.log('\n📊 Tentative séparation en codes de 12 caractères:');
        possibleCodes.length = 0;
        for (let i = 0; i < concatenatedValue.length; i += 12) {
            const code = concatenatedValue.substring(i, i + 12);
            if (code.length >= 8) {
                possibleCodes.push(code);
                console.log(`   Code ${possibleCodes.length}: "${code}" (${code.length} chars)`);
            }
        }
    }
    
    // Si ça ne marche toujours pas, essayer de détecter des patterns
    if (possibleCodes.length === 0 || possibleCodes.some(code => code.length < 8)) {
        console.log('\n📊 Tentative détection de patterns répétitifs:');
        possibleCodes.length = 0;
        
        // Chercher des répétitions de patterns
        const halfLength = Math.floor(concatenatedValue.length / 2);
        for (let len = 8; len <= halfLength; len++) {
            const firstPart = concatenatedValue.substring(0, len);
            const secondPart = concatenatedValue.substring(len, len * 2);
            
            if (firstPart === secondPart) {
                console.log(`   Pattern répétitif détecté: "${firstPart}" (${len} chars)`);
                possibleCodes.push(firstPart, secondPart);
                break;
            }
        }
    }
    
    return possibleCodes;
}

// Test des scénarios de scans multiples
function testMultipleScanScenarios() {
    console.log('🔍 === TESTS SCÉNARIOS SCANS MULTIPLES ===\n');
    
    const testCases = [
        {
            name: 'Double scan EAN-13 identique',
            input: '61126895662116112689566211',
            expected: ['6112689566211', '6112689566211']
        },
        {
            name: 'Double scan EAN-13 différent',
            input: '61126895662111234567890123',
            expected: ['6112689566211', '1234567890123']
        },
        {
            name: 'Triple scan EAN-13',
            input: '611268956621161126895662119876543210987',
            expected: ['6112689566211', '6112689566211', '9876543210987']
        },
        {
            name: 'Double scan UPC-A',
            input: '123456789012987654321098',
            expected: ['123456789012', '987654321098']
        },
        {
            name: 'Scan unique normal',
            input: '6112689566211',
            expected: ['6112689566211']
        },
        {
            name: 'Scan unique long',
            input: '1234567890123456',
            expected: ['1234567890123456']
        },
        {
            name: 'Codes de longueurs différentes',
            input: '12345678901234567890',
            expected: ['12345678', '90123456', '7890'] // Dépend de l'algorithme
        }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`📱 Test ${index + 1}: ${testCase.name}`);
        console.log(`   Input: "${testCase.input}" (${testCase.input.length} chars)`);
        
        const detected = detectMultipleBarcodes(testCase.input);
        
        console.log(`   Détecté: [${detected.map(c => `"${c}"`).join(', ')}]`);
        console.log(`   Attendu: [${testCase.expected.map(c => `"${c}"`).join(', ')}]`);
        
        // Vérifier si la détection est correcte
        const isCorrect = detected.length === testCase.expected.length &&
                         detected.every((code, i) => code === testCase.expected[i]);
        
        console.log(`   Résultat: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        // Nettoyer et valider chaque code détecté
        console.log('   Validation:');
        detected.forEach((code, i) => {
            const cleaned = cleanAndValidateBarcode(code);
            const isValid = cleaned.length >= 8;
            console.log(`     Code ${i + 1}: "${code}" → "${cleaned}" ${isValid ? '✅' : '❌'}`);
        });
        
        console.log('');
    });
}

// Test de performance
function testPerformance() {
    console.log('⚡ === TEST PERFORMANCE DÉTECTION MULTIPLE ===\n');
    
    const testInput = '61126895662116112689566211';
    const iterations = 1000;
    
    console.log(`🏃 Test de ${iterations} détections de "${testInput}"...\n`);
    
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
        const detected = detectMultipleBarcodes(testInput);
        detected.forEach(code => cleanAndValidateBarcode(code));
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`📊 Résultats de performance:`);
    console.log(`   - Temps total: ${totalTime}ms`);
    console.log(`   - Temps moyen par détection: ${avgTime.toFixed(3)}ms`);
    console.log(`   - Détections par seconde: ${(1000 / avgTime).toFixed(0)}`);
    
    if (avgTime < 1) {
        console.log(`   ✅ Performance excellente !`);
    } else if (avgTime < 5) {
        console.log(`   ✅ Performance bonne`);
    } else {
        console.log(`   ⚠️ Performance à améliorer`);
    }
    
    console.log('');
}

// Conseils pour éviter les scans multiples
function showPreventionTips() {
    console.log('💡 === CONSEILS PRÉVENTION SCANS MULTIPLES ===\n');
    
    console.log('🔧 SOLUTIONS TECHNIQUES APPLIQUÉES:');
    console.log('');
    console.log('1. 📱 DÉTECTION AUTOMATIQUE:');
    console.log('   - Event listener "input" sur le champ scanner');
    console.log('   - Traitement immédiat dès 8+ caractères');
    console.log('   - Séparation automatique des codes concaténés');
    console.log('');
    console.log('2. 🧹 NETTOYAGE IMMÉDIAT:');
    console.log('   - Vider le champ après chaque traitement');
    console.log('   - Éviter l\'accumulation de caractères');
    console.log('   - Délai de 50ms entre traitements multiples');
    console.log('');
    console.log('3. 🛡️ PROTECTION ANTI-DOUBLON:');
    console.log('   - Même code ignoré pendant 1000ms');
    console.log('   - Verrou de traitement (isProcessingBarcode)');
    console.log('   - Logs détaillés pour debug');
    console.log('');
    console.log('4. 🎯 REDIRECTION FOCUS:');
    console.log('   - Capture globale des frappes rapides');
    console.log('   - Redirection automatique vers le scanner');
    console.log('   - Maintien du focus sur le champ');
    console.log('');
    console.log('🎮 CONSEILS UTILISATION:');
    console.log('');
    console.log('1. 📏 DISTANCE SCANNER:');
    console.log('   - Maintenir 10-15cm du code-barres');
    console.log('   - Éviter les scans trop rapprochés');
    console.log('   - Attendre le bip de confirmation');
    console.log('');
    console.log('2. ⏱️ TIMING:');
    console.log('   - Attendre 1 seconde entre scans');
    console.log('   - Vérifier l\'ajout au panier avant nouveau scan');
    console.log('   - Observer les notifications de succès');
    console.log('');
    console.log('3. 🔍 VÉRIFICATION:');
    console.log('   - Vérifier que le champ scanner est vide');
    console.log('   - Contrôler le nombre d\'articles dans le panier');
    console.log('   - Utiliser les logs console en cas de problème');
    console.log('');
}

// Instructions de test manuel
function showManualTestInstructions() {
    console.log('📋 === INSTRUCTIONS TEST MANUEL ===\n');
    
    console.log('🎯 SÉQUENCE DE TEST SCANS MULTIPLES:');
    console.log('');
    console.log('1. 🚀 LANCER L\'APPLICATION:');
    console.log('   npm start');
    console.log('');
    console.log('2. 📱 ALLER DANS LA CAISSE:');
    console.log('   - Page Caisse');
    console.log('   - Vérifier focus sur champ scanner');
    console.log('   - Ouvrir console développeur (F12)');
    console.log('');
    console.log('3. 🔍 TEST SCAN NORMAL:');
    console.log('   - Scanner un code-barres une fois');
    console.log('   - Vérifier ajout au panier');
    console.log('   - Vérifier que le champ se vide');
    console.log('');
    console.log('4. 🔍🔍 TEST DOUBLE SCAN RAPIDE:');
    console.log('   - Scanner le MÊME code-barres 2 fois rapidement');
    console.log('   - Vérifier dans la console:');
    console.log('     📱 Détection scan automatique dans input: [codes concaténés]');
    console.log('     🔍 Détection possible de codes multiples: [longueur]');
    console.log('     📱 Codes détectés: [array des codes]');
    console.log('     🔄 Code-barres déjà traité récemment, ignoré: [code]');
    console.log('   - Résultat attendu: UN SEUL article ajouté');
    console.log('');
    console.log('5. 🔍🔍 TEST DOUBLE SCAN DIFFÉRENT:');
    console.log('   - Scanner DEUX codes-barres différents rapidement');
    console.log('   - Résultat attendu: DEUX articles ajoutés');
    console.log('');
    console.log('6. 🔍🔍🔍 TEST TRIPLE SCAN:');
    console.log('   - Scanner TROIS fois très rapidement');
    console.log('   - Vérifier la séparation automatique');
    console.log('   - Vérifier la protection anti-doublon');
    console.log('');
    console.log('🚨 SIGNAUX D\'ALERTE:');
    console.log('');
    console.log('❌ PROBLÈMES À ÉVITER:');
    console.log('   - Champ scanner qui ne se vide pas');
    console.log('   - Codes-barres concaténés visibles');
    console.log('   - Plusieurs articles identiques ajoutés');
    console.log('   - Application qui se bloque');
    console.log('');
    console.log('✅ COMPORTEMENT CORRECT:');
    console.log('   - Champ scanner toujours vide après traitement');
    console.log('   - Un seul article par scan (sauf codes différents)');
    console.log('   - Messages de protection anti-doublon dans console');
    console.log('   - Application fluide et réactive');
    console.log('');
}

// Fonction principale
function runMultipleScanTest() {
    try {
        console.log('🔧 Initialisation du test scans multiples...\n');
        
        // Tests de détection
        testMultipleScanScenarios();
        
        // Test de performance
        testPerformance();
        
        // Conseils et instructions
        showPreventionTips();
        showManualTestInstructions();
        
        console.log('🎊 Test de simulation scans multiples terminé !');
        console.log('');
        console.log('🚀 PROCHAINE ÉTAPE: Testez manuellement dans l\'application');
        console.log('   Essayez de scanner rapidement 2-3 fois le même code');
        console.log('   Vérifiez que seul UN article est ajouté au panier');
        console.log('');
        
    } catch (error) {
        console.error('❌ Erreur lors du test scans multiples:', error);
    }
}

// Lancer le test
runMultipleScanTest();
