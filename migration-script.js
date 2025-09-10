/**
 * Script de migration des données depuis une version antérieure
 * Convertit l'ancienne base de données en format JSON pour import
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔄 === SCRIPT DE MIGRATION GESTIONPRO ===\n');

// Chemin vers l'ancienne base de données
const oldDbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'GestionPro', 'database.db');
const backupPath = path.join(os.homedir(), 'Desktop', 'migration-gestionpro.json');

console.log('📁 Chemins:');
console.log(`   Ancienne DB: ${oldDbPath}`);
console.log(`   Fichier export: ${backupPath}`);
console.log('');

// Vérifier que l'ancienne base existe
if (!fs.existsSync(oldDbPath)) {
    console.log('❌ ERREUR: Ancienne base de données non trouvée');
    console.log('   Vérifiez que GestionPro était installé et utilisé');
    console.log('   Chemin attendu:', oldDbPath);
    process.exit(1);
}

try {
    console.log('🔍 Connexion à l\'ancienne base de données...');
    const db = Database(oldDbPath, { readonly: true });
    
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            version: '2.1.0',
            source: 'GestionPro Migration Script',
            migrationFrom: 'v2.0.0 ou antérieure'
        }
    };

    console.log('📦 Extraction des données...');

    // Extraction des produits
    try {
        const products = db.prepare('SELECT * FROM products').all();
        exportData.products = products;
        console.log(`   ✅ Produits: ${products.length} trouvés`);
    } catch (error) {
        console.log('   ⚠️ Produits: Erreur lors de l\'extraction');
        exportData.products = [];
    }

    // Extraction des clients
    try {
        const clients = db.prepare('SELECT * FROM clients').all();
        exportData.clients = clients;
        console.log(`   ✅ Clients: ${clients.length} trouvés`);
    } catch (error) {
        console.log('   ⚠️ Clients: Erreur lors de l\'extraction');
        exportData.clients = [];
    }

    // Extraction des ventes
    try {
        const sales = db.prepare('SELECT * FROM sales').all();
        exportData.sales = sales;
        console.log(`   ✅ Ventes: ${sales.length} trouvées`);
    } catch (error) {
        console.log('   ⚠️ Ventes: Erreur lors de l\'extraction');
        exportData.sales = [];
    }

    // Extraction des éléments de vente
    try {
        const saleItems = db.prepare('SELECT * FROM sale_items').all();
        exportData.saleItems = saleItems;
        console.log(`   ✅ Éléments de vente: ${saleItems.length} trouvés`);
    } catch (error) {
        console.log('   ⚠️ Éléments de vente: Erreur lors de l\'extraction');
        exportData.saleItems = [];
    }

    // Extraction des factures
    try {
        const invoices = db.prepare('SELECT * FROM invoices').all();
        exportData.invoices = invoices;
        console.log(`   ✅ Factures: ${invoices.length} trouvées`);
    } catch (error) {
        console.log('   ⚠️ Factures: Table non trouvée (normal pour anciennes versions)');
        exportData.invoices = [];
    }

    // Extraction des éléments de facture
    try {
        const invoiceItems = db.prepare('SELECT * FROM invoice_items').all();
        exportData.invoiceItems = invoiceItems;
        console.log(`   ✅ Éléments de facture: ${invoiceItems.length} trouvés`);
    } catch (error) {
        console.log('   ⚠️ Éléments de facture: Table non trouvée (normal pour anciennes versions)');
        exportData.invoiceItems = [];
    }

    // Extraction des paramètres
    try {
        const settings = db.prepare('SELECT * FROM settings').all();
        exportData.settings = settings;
        console.log(`   ✅ Paramètres: ${settings.length} trouvés`);
    } catch (error) {
        console.log('   ⚠️ Paramètres: Erreur lors de l\'extraction');
        exportData.settings = [];
    }

    // Fermer la connexion
    db.close();

    console.log('');
    console.log('💾 Génération du fichier de migration...');

    // Écrire le fichier JSON
    fs.writeFileSync(backupPath, JSON.stringify(exportData, null, 2));

    const fileSize = (fs.statSync(backupPath).size / 1024 / 1024).toFixed(2);
    console.log(`   ✅ Fichier créé: ${backupPath}`);
    console.log(`   📏 Taille: ${fileSize} MB`);

    console.log('');
    console.log('🎉 === MIGRATION RÉUSSIE ===');
    console.log('');
    console.log('📋 ÉTAPES SUIVANTES:');
    console.log('');
    console.log('1. 🚀 INSTALLER GestionPro v2.1.0');
    console.log('   - Lancer "GestionPro Setup 2.1.0.exe"');
    console.log('   - Suivre l\'assistant d\'installation');
    console.log('');
    console.log('2. 📥 IMPORTER LES DONNÉES');
    console.log('   - Ouvrir GestionPro v2.1.0');
    console.log('   - Aller dans "Sauvegarde"');
    console.log('   - Glisser le fichier: migration-gestionpro.json');
    console.log('   - Choisir "Remplacer toutes les données"');
    console.log('   - Cliquer "Démarrer l\'Import"');
    console.log('');
    console.log('3. ✅ VÉRIFIER');
    console.log('   - Tous les produits présents');
    console.log('   - Tous les clients présents');
    console.log('   - Historique des ventes intact');
    console.log('   - Paramètres conservés');
    console.log('');
    console.log('💡 Le fichier migration-gestionpro.json est sur votre Bureau');
    console.log('💡 Conservez-le comme sauvegarde de sécurité');

} catch (error) {
    console.error('❌ ERREUR lors de la migration:', error.message);
    console.log('');
    console.log('🔧 SOLUTIONS POSSIBLES:');
    console.log('   1. Vérifier que GestionPro est fermé');
    console.log('   2. Vérifier les permissions du fichier database.db');
    console.log('   3. Essayer de copier database.db sur le Bureau d\'abord');
    console.log('   4. Contacter le support technique');
    process.exit(1);
}
