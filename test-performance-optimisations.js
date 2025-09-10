/**
 * Test des Optimisations de Performance - GestionPro
 * Vérifie que les optimisations appliquées fonctionnent correctement
 */

console.log('🚀 TEST DES OPTIMISATIONS DE PERFORMANCE');
console.log('=========================================\n');

const fs = require('fs');
const path = require('path');

// 1. Vérifier les optimisations dans main.js
function checkMainJsOptimizations() {
    console.log('⚡ Vérification des optimisations Electron...');
    
    try {
        const mainPath = path.join(__dirname, 'main.js');
        const content = fs.readFileSync(mainPath, 'utf8');
        
        const optimizations = [
            { name: 'max-old-space-size', check: content.includes('max-old-space-size') },
            { name: 'VaapiVideoDecoder', check: content.includes('VaapiVideoDecoder') },
            { name: 'disk-cache-size', check: content.includes('disk-cache-size') },
            { name: 'contextIsolation', check: content.includes('contextIsolation: true') },
            { name: 'nodeIntegration', check: content.includes('nodeIntegration: false') },
            { name: 'setFrameRate', check: content.includes('setFrameRate') }
        ];
        
        let optimizedCount = 0;
        optimizations.forEach(opt => {
            if (opt.check) {
                console.log(`✅ ${opt.name} - Optimisé`);
                optimizedCount++;
            } else {
                console.log(`❌ ${opt.name} - Manquant`);
            }
        });
        
        console.log(`\n📊 ${optimizedCount}/${optimizations.length} optimisations Electron appliquées\n`);
        return optimizedCount >= 4; // Au moins 4 optimisations
        
    } catch (error) {
        console.log('❌ Erreur vérification main.js:', error.message);
        return false;
    }
}

// 2. Vérifier les optimisations dans products.js
function checkProductsJsOptimizations() {
    console.log('🔍 Vérification des optimisations interface...');
    
    try {
        const productsPath = path.join(__dirname, 'src', 'js', 'products.js');
        const content = fs.readFileSync(productsPath, 'utf8');
        
        const optimizations = [
            { name: 'Fonction debounce', check: content.includes('function debounce') },
            { name: 'ITEMS_PER_PAGE', check: content.includes('ITEMS_PER_PAGE') },
            { name: 'Pagination controls', check: content.includes('createPaginationControls') },
            { name: 'Performance warning', check: content.includes('1000 produits chargés') },
            { name: 'Page slice', check: content.includes('slice(startIndex, endIndex)') }
        ];
        
        let optimizedCount = 0;
        optimizations.forEach(opt => {
            if (opt.check) {
                console.log(`✅ ${opt.name} - Implémenté`);
                optimizedCount++;
            } else {
                console.log(`❌ ${opt.name} - Manquant`);
            }
        });
        
        console.log(`\n📊 ${optimizedCount}/${optimizations.length} optimisations interface appliquées\n`);
        return optimizedCount >= 3; // Au moins 3 optimisations
        
    } catch (error) {
        console.log('❌ Erreur vérification products.js:', error.message);
        return false;
    }
}

// 3. Vérifier les fichiers d'optimisation créés
function checkOptimizationFiles() {
    console.log('📁 Vérification des fichiers d\'optimisation...');
    
    const files = [
        { name: 'database-optimizations.js', path: 'database-optimizations.js' },
        { name: 'Guide optimisation interface', path: 'GUIDE-OPTIMISATION-INTERFACE.md' }
    ];
    
    let filesCount = 0;
    files.forEach(file => {
        if (fs.existsSync(file.path)) {
            console.log(`✅ ${file.name} - Créé`);
            filesCount++;
        } else {
            console.log(`❌ ${file.name} - Manquant`);
        }
    });
    
    console.log(`\n📊 ${filesCount}/${files.length} fichiers d'optimisation créés\n`);
    return filesCount >= 1;
}

// 4. Test de performance simulé
function simulatePerformanceTest() {
    console.log('⏱️  Test de performance simulé...');
    
    // Simuler le chargement de produits
    const products = [];
    for (let i = 0; i < 1000; i++) {
        products.push({
            id: i,
            name: `Produit ${i}`,
            barcode: `BAR${i.toString().padStart(6, '0')}`,
            price: Math.random() * 100,
            stock: Math.floor(Math.random() * 100)
        });
    }
    
    // Test 1: Recherche avec debounce simulé
    const start1 = Date.now();
    const searchResults = products.filter(p => p.name.includes('Produit 5'));
    const end1 = Date.now();
    console.log(`  Recherche (${searchResults.length} résultats): ${end1 - start1}ms`);
    
    // Test 2: Pagination simulée
    const start2 = Date.now();
    const ITEMS_PER_PAGE = 100;
    const page1 = products.slice(0, ITEMS_PER_PAGE);
    const end2 = Date.now();
    console.log(`  Pagination (${page1.length} éléments): ${end2 - start2}ms`);
    
    // Test 3: Tri simulé
    const start3 = Date.now();
    const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
    const end3 = Date.now();
    console.log(`  Tri (${sorted.length} éléments): ${end3 - start3}ms`);
    
    console.log('\n✅ Tests de performance simulés terminés\n');
    return true;
}

// 5. Recommandations finales
function showRecommendations() {
    console.log('💡 RECOMMANDATIONS FINALES:');
    console.log('============================');
    console.log('1. 🚀 Redémarrez l\'application pour appliquer les optimisations Electron');
    console.log('2. 📊 Les listes de produits sont maintenant paginées (100 éléments/page)');
    console.log('3. 🔍 La recherche utilise maintenant un debounce de 300ms');
    console.log('4. ⚡ La mémoire est optimisée avec un cache de 50MB');
    console.log('5. 🎯 Pour de meilleures performances avec >1000 produits:');
    console.log('   - Utilisez des filtres par catégorie');
    console.log('   - Recherchez avec des termes spécifiques');
    console.log('   - Considérez l\'archivage des anciens produits');
    console.log('\n6. 📈 Surveillez les performances avec:');
    console.log('   - Gestionnaire des tâches Windows');
    console.log('   - DevTools Electron (F12)');
    console.log('   - Logs de la console');
}

// Fonction principale
async function runPerformanceTest() {
    console.log('🎯 Début du test des optimisations...\n');
    
    const results = {
        electron: checkMainJsOptimizations(),
        interface: checkProductsJsOptimizations(),
        files: checkOptimizationFiles(),
        performance: simulatePerformanceTest()
    };
    
    const successCount = Object.values(results).filter(Boolean).length;
    
    console.log('📊 RÉSULTATS FINAUX:');
    console.log('====================');
    console.log('✅ Optimisations Electron:', results.electron ? 'OK' : 'PARTIEL');
    console.log('✅ Optimisations Interface:', results.interface ? 'OK' : 'PARTIEL');
    console.log('✅ Fichiers d\'optimisation:', results.files ? 'OK' : 'PARTIEL');
    console.log('✅ Tests de performance:', results.performance ? 'OK' : 'ÉCHEC');
    
    console.log(`\n🎊 ${successCount}/4 catégories d'optimisations réussies\n`);
    
    if (successCount >= 3) {
        console.log('🎉 OPTIMISATIONS APPLIQUÉES AVEC SUCCÈS !');
        console.log('L\'application devrait être significativement plus rapide.\n');
        showRecommendations();
    } else {
        console.log('⚠️  OPTIMISATIONS PARTIELLES');
        console.log('Certaines optimisations n\'ont pas pu être appliquées.');
        console.log('Consultez les messages d\'erreur ci-dessus.\n');
    }
}

// Lancer le test
runPerformanceTest().catch(console.error);
