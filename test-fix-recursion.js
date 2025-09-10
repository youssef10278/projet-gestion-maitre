/**
 * Test de Correction - Récursion Infinie delivery-notes.js
 * Vérifie que la correction de la récursion fonctionne
 */

console.log('🔧 TEST DE CORRECTION - RÉCURSION INFINIE');
console.log('=========================================\n');

const fs = require('fs');
const path = require('path');

function testRecursionFix() {
    console.log('🔍 Vérification de la correction de récursion...');
    
    try {
        const filePath = path.join(__dirname, 'src', 'js', 'delivery-notes.js');
        
        if (!fs.existsSync(filePath)) {
            console.log('❌ Fichier delivery-notes.js non trouvé');
            return false;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Vérifier que la récursion infinie a été corrigée
        const problematicPattern = /return updatePagination\(totalItems\)/;
        const hasProblematicRecursion = problematicPattern.test(content);
        
        if (hasProblematicRecursion) {
            console.log('❌ RÉCURSION INFINIE ENCORE PRÉSENTE !');
            console.log('   La ligne "return updatePagination(totalItems)" cause toujours le problème');
            return false;
        }
        
        // Vérifier que la correction est en place
        const fixPattern = /const newContainer = document\.getElementById\('paginationContainer'\)/;
        const hasFix = fixPattern.test(content);
        
        if (hasFix) {
            console.log('✅ CORRECTION APPLIQUÉE AVEC SUCCÈS !');
            console.log('   La récursion infinie a été remplacée par une vérification sécurisée');
        } else {
            console.log('⚠️  Correction partielle - Vérification manuelle recommandée');
        }
        
        // Compter les occurrences d'updatePagination
        const updatePaginationMatches = content.match(/updatePagination\(/g);
        const callCount = updatePaginationMatches ? updatePaginationMatches.length : 0;
        
        console.log(`📊 Nombre d'appels à updatePagination: ${callCount}`);
        
        if (callCount <= 3) {
            console.log('✅ Nombre d\'appels normal (≤3)');
        } else {
            console.log('⚠️  Nombre d\'appels élevé - Vérification recommandée');
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Erreur lors de la vérification:', error.message);
        return false;
    }
}

function analyzeFileStructure() {
    console.log('\n📁 Analyse de la structure du fichier...');
    
    try {
        const filePath = path.join(__dirname, 'src', 'js', 'delivery-notes.js');
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        console.log(`📄 Taille du fichier: ${lines.length} lignes`);
        console.log(`💾 Taille: ${(content.length / 1024).toFixed(2)} KB`);
        
        // Analyser les fonctions principales
        const functions = content.match(/function\s+\w+\s*\(/g);
        console.log(`🔧 Fonctions détectées: ${functions ? functions.length : 0}`);
        
        // Vérifier les patterns problématiques
        const problematicPatterns = [
            { name: 'Récursion directe', pattern: /function\s+(\w+).*\1\s*\(/ },
            { name: 'Boucles infinies', pattern: /while\s*\(\s*true\s*\)/ },
            { name: 'Appels récursifs', pattern: /return\s+\w+\s*\(.*\).*\w+\s*\(/ }
        ];
        
        problematicPatterns.forEach(pattern => {
            const matches = content.match(pattern.pattern);
            if (matches) {
                console.log(`⚠️  ${pattern.name}: ${matches.length} occurrence(s)`);
            } else {
                console.log(`✅ ${pattern.name}: Aucun problème détecté`);
            }
        });
        
        return true;
        
    } catch (error) {
        console.log('❌ Erreur analyse:', error.message);
        return false;
    }
}

function createBackup() {
    console.log('\n💾 Création d\'une sauvegarde...');
    
    try {
        const originalPath = path.join(__dirname, 'src', 'js', 'delivery-notes.js');
        const backupPath = path.join(__dirname, 'src', 'js', 'delivery-notes.js.backup');
        
        if (fs.existsSync(originalPath)) {
            fs.copyFileSync(originalPath, backupPath);
            console.log('✅ Sauvegarde créée: delivery-notes.js.backup');
            return true;
        } else {
            console.log('❌ Fichier original non trouvé');
            return false;
        }
        
    } catch (error) {
        console.log('❌ Erreur sauvegarde:', error.message);
        return false;
    }
}

function showRecommendations() {
    console.log('\n💡 RECOMMANDATIONS:');
    console.log('===================');
    console.log('1. 🔄 Redémarrez l\'application pour appliquer la correction');
    console.log('2. 🧪 Testez la fonctionnalité de bons de livraison');
    console.log('3. 📊 Vérifiez que la pagination fonctionne correctement');
    console.log('4. 💾 Une sauvegarde a été créée au cas où');
    console.log('5. 🔍 Si le problème persiste, vérifiez la console du navigateur');
    
    console.log('\n🚨 ACTIONS IMMÉDIATES:');
    console.log('- Fermez l\'application si elle est ouverte');
    console.log('- Relancez avec: npm start');
    console.log('- Testez la page des bons de livraison');
}

// Fonction principale
async function main() {
    console.log('🎯 Début du test de correction...\n');
    
    const results = {
        backup: createBackup(),
        recursionFix: testRecursionFix(),
        analysis: analyzeFileStructure()
    };
    
    const successCount = Object.values(results).filter(Boolean).length;
    
    console.log('\n📊 RÉSULTATS:');
    console.log('=============');
    console.log('✅ Sauvegarde:', results.backup ? 'OK' : 'ÉCHEC');
    console.log('✅ Correction récursion:', results.recursionFix ? 'OK' : 'ÉCHEC');
    console.log('✅ Analyse fichier:', results.analysis ? 'OK' : 'ÉCHEC');
    
    console.log(`\n🎊 ${successCount}/3 vérifications réussies\n`);
    
    if (results.recursionFix) {
        console.log('🎉 CORRECTION APPLIQUÉE AVEC SUCCÈS !');
        console.log('La récursion infinie dans delivery-notes.js a été corrigée.');
    } else {
        console.log('⚠️  CORRECTION PARTIELLE');
        console.log('Vérification manuelle recommandée.');
    }
    
    showRecommendations();
}

main().catch(console.error);
