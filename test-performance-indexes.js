#!/usr/bin/env node

/**
 * TEST DE PERFORMANCE - VÉRIFICATION DES INDEX
 * 
 * Ce script teste l'amélioration de performance après l'ajout des index critiques
 * Mesure le temps d'exécution des requêtes les plus fréquentes
 */

const path = require('path');
const fs = require('fs');

console.log('🚀 TEST DE PERFORMANCE - VÉRIFICATION DES INDEX');
console.log('================================================\n');

// Fonction pour mesurer le temps d'exécution
function measureTime(name, fn) {
    const start = process.hrtime.bigint();
    const result = fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convertir en millisecondes
    
    console.log(`  ${name}: ${duration.toFixed(2)}ms`);
    return { name, duration, resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0) };
}

try {
    // Importer la base de données
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, 'database', 'main.db');
    
    if (!fs.existsSync(dbPath)) {
        console.log('❌ Base de données non trouvée:', dbPath);
        console.log('   Veuillez d\'abord lancer l\'application pour créer la base de données.');
        process.exit(1);
    }
    
    const db = new Database(dbPath);
    console.log('✅ Connexion à la base de données établie\n');
    
    // ===== TESTS DE PERFORMANCE =====
    console.log('📊 Tests de performance des requêtes optimisées:\n');
    
    const results = [];
    
    // Test 1: Recherche produits par nom (avec index)
    results.push(measureTime('Recherche produits par nom', () => {
        return db.prepare('SELECT * FROM products WHERE name LIKE ? LIMIT 50').all('%a%');
    }));
    
    // Test 2: Recherche produits par code-barres (avec index)
    results.push(measureTime('Recherche par code-barres', () => {
        return db.prepare('SELECT * FROM products WHERE barcode LIKE ? LIMIT 50').all('%BAR%');
    }));
    
    // Test 3: Recherche clients par nom (avec index)
    results.push(measureTime('Recherche clients par nom', () => {
        return db.prepare('SELECT * FROM clients WHERE name LIKE ? LIMIT 50').all('%Client%');
    }));
    
    // Test 4: Produits en rupture de stock (avec index composé)
    results.push(measureTime('Produits en rupture de stock', () => {
        return db.prepare('SELECT * FROM products WHERE stock <= alert_threshold AND alert_threshold > 0').all();
    }));
    
    // Test 5: Historique des ventes récentes (avec index sur date)
    results.push(measureTime('Historique ventes récentes', () => {
        return db.prepare('SELECT * FROM sales ORDER BY sale_date DESC LIMIT 100').all();
    }));
    
    // Test 6: Ventes par client (avec index)
    results.push(measureTime('Ventes par client', () => {
        return db.prepare('SELECT * FROM sales WHERE client_id = ? ORDER BY sale_date DESC LIMIT 50').all(1);
    }));
    
    // Test 7: Items de vente avec jointure (avec index)
    results.push(measureTime('Items de vente avec produits', () => {
        return db.prepare(`
            SELECT si.*, p.name as product_name 
            FROM sale_items si 
            JOIN products p ON si.product_id = p.id 
            LIMIT 100
        `).all();
    }));
    
    // Test 8: Recherche devis par statut (avec index)
    results.push(measureTime('Devis par statut', () => {
        return db.prepare('SELECT * FROM quotes WHERE status = ? LIMIT 50').all('draft');
    }));
    
    // Test 9: Factures récentes (avec index sur date)
    results.push(measureTime('Factures récentes', () => {
        return db.prepare('SELECT * FROM invoices ORDER BY invoice_date DESC LIMIT 50').all();
    }));
    
    // Test 10: Mouvements de stock récents (avec index)
    results.push(measureTime('Mouvements de stock récents', () => {
        return db.prepare('SELECT * FROM stock_movements ORDER BY movement_date DESC LIMIT 100').all();
    }));
    
    db.close();
    
    // ===== ANALYSE DES RÉSULTATS =====
    console.log('\n📈 ANALYSE DES PERFORMANCES:\n');
    
    const fastQueries = results.filter(r => r.duration < 10);
    const mediumQueries = results.filter(r => r.duration >= 10 && r.duration < 50);
    const slowQueries = results.filter(r => r.duration >= 50);
    
    console.log(`🟢 Requêtes rapides (< 10ms): ${fastQueries.length}`);
    fastQueries.forEach(q => console.log(`   ✅ ${q.name}: ${q.duration.toFixed(2)}ms (${q.resultCount} résultats)`));
    
    if (mediumQueries.length > 0) {
        console.log(`\n🟡 Requêtes moyennes (10-50ms): ${mediumQueries.length}`);
        mediumQueries.forEach(q => console.log(`   ⚠️  ${q.name}: ${q.duration.toFixed(2)}ms (${q.resultCount} résultats)`));
    }
    
    if (slowQueries.length > 0) {
        console.log(`\n🔴 Requêtes lentes (> 50ms): ${slowQueries.length}`);
        slowQueries.forEach(q => console.log(`   ❌ ${q.name}: ${q.duration.toFixed(2)}ms (${q.resultCount} résultats)`));
    }
    
    // Calcul de la performance globale
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    console.log(`\n📊 RÉSUMÉ GLOBAL:`);
    console.log(`   • Temps moyen par requête: ${avgDuration.toFixed(2)}ms`);
    console.log(`   • Requêtes testées: ${results.length}`);
    console.log(`   • Performance globale: ${avgDuration < 20 ? '🟢 EXCELLENTE' : avgDuration < 50 ? '🟡 BONNE' : '🔴 À AMÉLIORER'}`);
    
    if (avgDuration < 20) {
        console.log('\n🎉 FÉLICITATIONS !');
        console.log('   Les index de performance ont considérablement amélioré les temps de réponse.');
        console.log('   Votre application peut maintenant gérer efficacement de gros volumes de données.');
    } else if (avgDuration < 50) {
        console.log('\n👍 BIEN !');
        console.log('   Les performances sont bonnes. Quelques optimisations supplémentaires pourraient être bénéfiques.');
    } else {
        console.log('\n⚠️  ATTENTION !');
        console.log('   Certaines requêtes sont encore lentes. Vérifiez que les index ont été correctement créés.');
    }
    
    console.log('\n✅ Test de performance terminé.');
    
} catch (error) {
    console.error('❌ Erreur lors du test de performance:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
}
