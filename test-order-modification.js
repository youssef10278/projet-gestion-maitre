// test-order-modification.js - Test de la fonctionnalité de modification des commandes

console.log('🧪 === TEST DE MODIFICATION DES COMMANDES ===');

/**
 * Test complet de la modification des commandes
 */
async function testOrderModification() {
    try {
        console.log('\n1️⃣ PRÉPARATION DU TEST');
        
        // Vérifier que l'API est disponible
        if (!window.supplierOrdersAPI) {
            console.error('❌ API des commandes fournisseurs non disponible');
            return;
        }
        
        // Créer un fournisseur de test si nécessaire
        let testSupplier;
        try {
            const suppliers = await window.api.suppliers.getAll();
            testSupplier = suppliers.find(s => s.name === 'Fournisseur Test Modification');
            
            if (!testSupplier) {
                testSupplier = await window.api.suppliers.add({
                    name: 'Fournisseur Test Modification',
                    company: 'Test Company',
                    email: 'test@modification.com',
                    phone: '0600000000'
                });
                console.log('✅ Fournisseur de test créé:', testSupplier.name);
            } else {
                console.log('✅ Fournisseur de test trouvé:', testSupplier.name);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la création du fournisseur:', error);
            return;
        }
        
        console.log('\n2️⃣ CRÉATION D\'UNE COMMANDE INITIALE');
        
        // Créer une commande de test
        const initialOrderData = {
            supplier_id: testSupplier.id,
            order_date: new Date().toISOString().split('T')[0],
            expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'PENDING',
            notes: 'Commande de test pour modification',
            items: [
                {
                    product_name: 'Produit Test 1',
                    product_reference: 'REF001',
                    quantity_ordered: 10,
                    unit_price: 25.50
                },
                {
                    product_name: 'Produit Test 2',
                    product_reference: 'REF002',
                    quantity_ordered: 5,
                    unit_price: 45.00
                }
            ]
        };
        
        const createResult = await window.supplierOrdersAPI.createOrder(initialOrderData);
        if (!createResult || !createResult.id) {
            console.error('❌ Échec de la création de la commande');
            return;
        }
        
        console.log('✅ Commande créée:', createResult.order_number);
        const orderId = createResult.id;
        
        // Vérifier la commande créée
        const initialOrder = await window.supplierOrdersAPI.getOrderDetails(orderId);
        console.log('📋 Commande initiale:', {
            id: initialOrder.id,
            total: initialOrder.total_amount,
            items: initialOrder.items?.length || 0
        });
        
        console.log('\n3️⃣ TEST DE MODIFICATION');
        
        // Données de modification
        const modificationData = {
            supplier_id: testSupplier.id,
            order_date: initialOrder.order_date,
            expected_delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 jours
            status: 'PENDING',
            notes: 'Commande modifiée - Test automatique',
            items: [
                {
                    product_name: 'Produit Test 1 Modifié',
                    product_reference: 'REF001-MOD',
                    quantity_ordered: 15, // Quantité modifiée
                    unit_price: 30.00    // Prix modifié
                },
                {
                    product_name: 'Produit Test 3', // Nouveau produit
                    product_reference: 'REF003',
                    quantity_ordered: 8,
                    unit_price: 55.00
                }
                // Produit Test 2 supprimé
            ]
        };
        
        console.log('🔄 Modification en cours...');
        const updateResult = await window.supplierOrdersAPI.updateOrder(orderId, modificationData);
        
        if (!updateResult || !updateResult.success) {
            console.error('❌ Échec de la modification');
            return;
        }
        
        console.log('✅ Modification réussie');
        
        console.log('\n4️⃣ VÉRIFICATION DES MODIFICATIONS');
        
        // Récupérer la commande modifiée
        const modifiedOrder = await window.supplierOrdersAPI.getOrderDetails(orderId);
        
        console.log('📋 Commande après modification:', {
            id: modifiedOrder.id,
            notes: modifiedOrder.notes,
            expected_delivery_date: modifiedOrder.expected_delivery_date,
            total: modifiedOrder.total_amount,
            items: modifiedOrder.items?.length || 0
        });
        
        // Vérifier les changements
        const checks = [
            {
                name: 'Notes modifiées',
                expected: 'Commande modifiée - Test automatique',
                actual: modifiedOrder.notes,
                passed: modifiedOrder.notes === 'Commande modifiée - Test automatique'
            },
            {
                name: 'Date de livraison modifiée',
                expected: modificationData.expected_delivery_date,
                actual: modifiedOrder.expected_delivery_date,
                passed: modifiedOrder.expected_delivery_date === modificationData.expected_delivery_date
            },
            {
                name: 'Nombre d\'articles',
                expected: 2,
                actual: modifiedOrder.items?.length || 0,
                passed: (modifiedOrder.items?.length || 0) === 2
            }
        ];
        
        console.log('\n5️⃣ RÉSULTATS DES VÉRIFICATIONS');
        let allPassed = true;
        
        checks.forEach(check => {
            const status = check.passed ? '✅' : '❌';
            console.log(`${status} ${check.name}: ${check.actual} (attendu: ${check.expected})`);
            if (!check.passed) allPassed = false;
        });
        
        console.log('\n6️⃣ NETTOYAGE');
        
        // Supprimer la commande de test
        try {
            await window.supplierOrdersAPI.deleteOrder(orderId);
            console.log('✅ Commande de test supprimée');
        } catch (error) {
            console.warn('⚠️ Impossible de supprimer la commande de test:', error.message);
        }
        
        console.log('\n🎯 RÉSULTAT FINAL');
        if (allPassed) {
            console.log('✅ TOUS LES TESTS SONT PASSÉS - La modification des commandes fonctionne correctement !');
        } else {
            console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ - Vérifiez l\'implémentation');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
}

/**
 * Test des restrictions de modification
 */
async function testModificationRestrictions() {
    console.log('\n🔒 === TEST DES RESTRICTIONS DE MODIFICATION ===');
    
    try {
        // Créer une commande et la marquer comme reçue
        const testOrderData = {
            supplier_id: 1,
            order_date: new Date().toISOString().split('T')[0],
            status: 'RECEIVED', // Statut qui ne permet pas la modification
            notes: 'Commande pour test de restriction',
            items: [{
                product_name: 'Produit Test Restriction',
                quantity_ordered: 1,
                unit_price: 10.00
            }]
        };
        
        const createResult = await window.supplierOrdersAPI.createOrder(testOrderData);
        const orderId = createResult.id;
        
        // Tenter de modifier la commande reçue
        try {
            await window.supplierOrdersAPI.updateOrder(orderId, {
                notes: 'Tentative de modification interdite'
            });
            console.log('❌ ÉCHEC: La modification d\'une commande reçue devrait être interdite');
        } catch (error) {
            console.log('✅ SUCCÈS: Modification correctement interdite -', error.message);
        }
        
        // Nettoyage
        await window.supplierOrdersAPI.deleteOrder(orderId);
        
    } catch (error) {
        console.error('❌ Erreur lors du test des restrictions:', error);
    }
}

// Exporter les fonctions de test
window.testOrderModification = testOrderModification;
window.testModificationRestrictions = testModificationRestrictions;

console.log('📝 Tests disponibles:');
console.log('- testOrderModification() : Test complet de modification');
console.log('- testModificationRestrictions() : Test des restrictions');
