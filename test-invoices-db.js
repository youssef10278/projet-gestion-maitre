/**
 * Test pour vérifier les factures dans la base de données
 */

const { initDatabase } = require('./database.js');
const Database = require('better-sqlite3');
const path = require('path');

async function testInvoicesDatabase() {
    console.log('🧪 === TEST BASE DE DONNÉES FACTURES ===\n');

    try {
        // 1. Initialiser la base de données
        await initDatabase();
        console.log('✅ Base de données initialisée\n');

        // 2. Ouvrir la base de données directement
        const dbPath = path.join(__dirname, 'database.db');
        const db = new Database(dbPath);

        // 3. Vérifier si la table invoices existe
        console.log('2️⃣ Vérification de la table invoices...');
        const tableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='invoices'
        `).get();

        if (!tableExists) {
            console.log('❌ Table invoices n\'existe pas');
            return;
        }
        console.log('✅ Table invoices existe');

        // 4. Compter le nombre de factures
        console.log('\n3️⃣ Comptage des factures...');
        const countResult = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
        console.log(`📊 Nombre total de factures: ${countResult.count}`);

        // 5. Récupérer quelques factures d'exemple
        if (countResult.count > 0) {
            console.log('\n4️⃣ Exemples de factures:');
            const invoices = db.prepare(`
                SELECT id, invoice_number, client_name, total_amount, invoice_date 
                FROM invoices 
                LIMIT 5
            `).all();

            invoices.forEach((invoice, index) => {
                console.log(`   ${index + 1}. ID: ${invoice.id}`);
                console.log(`      Numéro: ${invoice.invoice_number}`);
                console.log(`      Client: ${invoice.client_name}`);
                console.log(`      Montant: ${invoice.total_amount} MAD`);
                console.log(`      Date: ${invoice.invoice_date}`);
                console.log('');
            });
        } else {
            console.log('\n📝 Aucune facture trouvée dans la base de données');
            console.log('💡 Suggestion: Créez une facture de test pour vérifier le système');
        }

        // 6. Vérifier la structure de la table
        console.log('5️⃣ Structure de la table invoices:');
        const tableInfo = db.prepare('PRAGMA table_info(invoices)').all();
        tableInfo.forEach(column => {
            console.log(`   - ${column.name}: ${column.type} ${column.notnull ? '(NOT NULL)' : ''} ${column.pk ? '(PRIMARY KEY)' : ''}`);
        });

        // 7. Vérifier la table invoice_items
        console.log('\n6️⃣ Vérification de la table invoice_items...');
        const itemsTableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='invoice_items'
        `).get();

        if (itemsTableExists) {
            const itemsCount = db.prepare('SELECT COUNT(*) as count FROM invoice_items').get();
            console.log(`✅ Table invoice_items existe avec ${itemsCount.count} articles`);
        } else {
            console.log('❌ Table invoice_items n\'existe pas');
        }

        db.close();

        console.log('\n🎉 === TEST TERMINÉ ===');
        console.log('\n📋 Résumé:');
        console.log(`   ✅ Base de données: Accessible`);
        console.log(`   ✅ Table invoices: ${tableExists ? 'Existe' : 'N\'existe pas'}`);
        console.log(`   📊 Nombre de factures: ${countResult.count}`);
        console.log(`   ✅ Table invoice_items: ${itemsTableExists ? 'Existe' : 'N\'existe pas'}`);

        if (countResult.count === 0) {
            console.log('\n💡 RECOMMANDATION:');
            console.log('   La base de données est vide. Pour tester la page factures:');
            console.log('   1. Créez une facture de test manuellement');
            console.log('   2. Ou vérifiez pourquoi les factures ne se chargent pas');
        }

    } catch (error) {
        console.error('\n❌ === ERREUR LORS DU TEST ===');
        console.error('Erreur:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Exécuter le test
if (require.main === module) {
    testInvoicesDatabase();
}

module.exports = { testInvoicesDatabase };
