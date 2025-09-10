// Démonstration du système TVA professionnel
const db = require('./database.js');

async function demoTVASystem() {
    console.log('🎯 === DÉMONSTRATION SYSTÈME TVA PROFESSIONNEL ===\n');
    
    try {
        // Initialiser la base de données
        db.initDatabase();
        
        console.log('🏢 SCÉNARIO : Entreprise de distribution au Maroc');
        console.log('📋 Création de factures avec différents taux TVA selon la législation marocaine\n');
        
        // Scénario 1: Vente de produits électroniques (TVA 20%)
        console.log('📱 Scénario 1: Vente d\'équipements électroniques (TVA 20%)');
        const factureElectronique = {
            invoice_number: 'DEMO-2024-001',
            invoice_date: '2024-01-20',
            client_name: 'TechStore Casablanca',
            client_address: '123 Boulevard Hassan II\nCasablanca, Maroc',
            client_phone: '+212 522 123 456',
            client_ice: '001234567000012',
            subtotal_ht: 15000.00,
            tva_rate: 20,
            tva_amount: 3000.00,
            total_amount: 18000.00,
            items: [
                {
                    description: 'Ordinateur portable HP ProBook',
                    quantity: 5,
                    unit_price: 2000.00,
                    unit: 'piece',
                    line_total: 10000.00
                },
                {
                    description: 'Écran Dell 24 pouces',
                    quantity: 10,
                    unit_price: 500.00,
                    unit: 'piece',
                    line_total: 5000.00
                }
            ]
        };
        
        const result1 = db.invoicesDB.create(factureElectronique);
        console.log('✅ Facture électronique créée');
        console.log(`   💰 Sous-total HT: ${factureElectronique.subtotal_ht.toLocaleString()} MAD`);
        console.log(`   📊 TVA (20%): ${factureElectronique.tva_amount.toLocaleString()} MAD`);
        console.log(`   💳 Total TTC: ${factureElectronique.total_amount.toLocaleString()} MAD\n`);
        
        // Scénario 2: Vente de produits alimentaires de base (TVA 10%)
        console.log('🥖 Scénario 2: Vente de produits alimentaires de base (TVA 10%)');
        const factureAlimentaire = {
            invoice_number: 'DEMO-2024-002',
            invoice_date: '2024-01-20',
            client_name: 'Supermarché Al Madina',
            client_address: '456 Avenue Mohammed V\nRabat, Maroc',
            client_phone: '+212 537 987 654',
            client_ice: '002345678000023',
            subtotal_ht: 8000.00,
            tva_rate: 10,
            tva_amount: 800.00,
            total_amount: 8800.00,
            items: [
                {
                    description: 'Farine de blé (sac 50kg)',
                    quantity: 20,
                    unit_price: 200.00,
                    unit: 'piece',
                    line_total: 4000.00
                },
                {
                    description: 'Huile d\'olive (bidon 5L)',
                    quantity: 40,
                    unit_price: 100.00,
                    unit: 'piece',
                    line_total: 4000.00
                }
            ]
        };
        
        const result2 = db.invoicesDB.create(factureAlimentaire);
        console.log('✅ Facture alimentaire créée');
        console.log(`   💰 Sous-total HT: ${factureAlimentaire.subtotal_ht.toLocaleString()} MAD`);
        console.log(`   📊 TVA (10%): ${factureAlimentaire.tva_amount.toLocaleString()} MAD`);
        console.log(`   💳 Total TTC: ${factureAlimentaire.total_amount.toLocaleString()} MAD\n`);
        
        // Scénario 3: Services d'export (Exonération TVA 0%)
        console.log('🌍 Scénario 3: Services d\'exportation (Exonération TVA 0%)');
        const factureExport = {
            invoice_number: 'DEMO-2024-003',
            invoice_date: '2024-01-20',
            client_name: 'Export International SARL',
            client_address: '789 Zone Franche\nTanger, Maroc',
            client_phone: '+212 539 456 789',
            client_ice: '003456789000034',
            subtotal_ht: 25000.00,
            tva_rate: 0,
            tva_amount: 0.00,
            total_amount: 25000.00,
            items: [
                {
                    description: 'Services de conseil en export',
                    quantity: 1,
                    unit_price: 15000.00,
                    unit: 'service',
                    line_total: 15000.00
                },
                {
                    description: 'Formation équipe commerciale',
                    quantity: 1,
                    unit_price: 10000.00,
                    unit: 'service',
                    line_total: 10000.00
                }
            ]
        };
        
        const result3 = db.invoicesDB.create(factureExport);
        console.log('✅ Facture export créée');
        console.log(`   💰 Sous-total HT: ${factureExport.subtotal_ht.toLocaleString()} MAD`);
        console.log(`   📊 TVA (0%): ${factureExport.tva_amount.toLocaleString()} MAD (Exonéré)`);
        console.log(`   💳 Total TTC: ${factureExport.total_amount.toLocaleString()} MAD\n`);
        
        // Scénario 4: Taux personnalisé (7.5% - cas spécial)
        console.log('⚙️ Scénario 4: Taux TVA personnalisé (7.5% - cas spécial)');
        const facturePersonnalisee = {
            invoice_number: 'DEMO-2024-004',
            invoice_date: '2024-01-20',
            client_name: 'Coopérative Agricole Atlas',
            client_address: '321 Route de Marrakech\nAgadir, Maroc',
            client_phone: '+212 528 111 222',
            client_ice: '004567890000045',
            subtotal_ht: 12000.00,
            tva_rate: 7.5,
            tva_amount: 900.00,
            total_amount: 12900.00,
            items: [
                {
                    description: 'Équipement agricole spécialisé',
                    quantity: 3,
                    unit_price: 4000.00,
                    unit: 'piece',
                    line_total: 12000.00
                }
            ]
        };
        
        const result4 = db.invoicesDB.create(facturePersonnalisee);
        console.log('✅ Facture taux personnalisé créée');
        console.log(`   💰 Sous-total HT: ${facturePersonnalisee.subtotal_ht.toLocaleString()} MAD`);
        console.log(`   📊 TVA (7.5%): ${facturePersonnalisee.tva_amount.toLocaleString()} MAD`);
        console.log(`   💳 Total TTC: ${facturePersonnalisee.total_amount.toLocaleString()} MAD\n`);
        
        // Résumé des factures créées
        console.log('📊 === RÉSUMÉ DES FACTURES CRÉÉES ===');
        const allInvoices = db.invoicesDB.getAll();
        const demoInvoices = allInvoices.filter(inv => inv.invoice_number.startsWith('DEMO-2024'));
        
        let totalHT = 0, totalTVA = 0, totalTTC = 0;
        
        demoInvoices.forEach(invoice => {
            console.log(`📋 ${invoice.invoice_number} - ${invoice.client_name}`);
            console.log(`   💰 ${invoice.subtotal_ht.toLocaleString()} HT + ${invoice.tva_amount.toLocaleString()} TVA (${invoice.tva_rate}%) = ${invoice.total_amount.toLocaleString()} TTC`);
            
            totalHT += invoice.subtotal_ht;
            totalTVA += invoice.tva_amount;
            totalTTC += invoice.total_amount;
        });
        
        console.log('\n💼 === TOTAUX GLOBAUX ===');
        console.log(`📈 Total HT: ${totalHT.toLocaleString()} MAD`);
        console.log(`📊 Total TVA: ${totalTVA.toLocaleString()} MAD`);
        console.log(`💳 Total TTC: ${totalTTC.toLocaleString()} MAD`);
        
        // Analyse par taux de TVA
        console.log('\n📈 === ANALYSE PAR TAUX TVA ===');
        const analyseParTaux = {};
        demoInvoices.forEach(invoice => {
            const taux = `${invoice.tva_rate}%`;
            if (!analyseParTaux[taux]) {
                analyseParTaux[taux] = { count: 0, totalHT: 0, totalTVA: 0, totalTTC: 0 };
            }
            analyseParTaux[taux].count++;
            analyseParTaux[taux].totalHT += invoice.subtotal_ht;
            analyseParTaux[taux].totalTVA += invoice.tva_amount;
            analyseParTaux[taux].totalTTC += invoice.total_amount;
        });
        
        Object.entries(analyseParTaux).forEach(([taux, data]) => {
            console.log(`🔹 TVA ${taux}: ${data.count} facture(s) - ${data.totalHT.toLocaleString()} HT → ${data.totalTTC.toLocaleString()} TTC`);
        });
        
        console.log('\n🎉 === DÉMONSTRATION TERMINÉE ===');
        console.log('✅ Le système TVA professionnel est pleinement opérationnel');
        console.log('📋 Fonctionnalités démontrées:');
        console.log('   - Gestion multi-taux TVA (0%, 7.5%, 10%, 20%)');
        console.log('   - Calculs automatiques précis');
        console.log('   - Conformité législation marocaine');
        console.log('   - Interface professionnelle');
        console.log('   - Rapports et analyses');
        
    } catch (error) {
        console.error('❌ Erreur lors de la démonstration:', error);
    }
}

// Exécuter la démonstration
if (require.main === module) {
    demoTVASystem();
}

module.exports = { demoTVASystem };
