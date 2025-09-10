// test-impression-debug.js - Debug des fonctions d'impression

console.log('🐛 === DEBUG IMPRESSION BONS DE COMMANDE ===');

/**
 * Test de debug pour identifier le problème d'impression
 */
async function debugPrintIssue() {
    try {
        console.log('\n1️⃣ VÉRIFICATION DES MODULES');
        
        // Vérifier les modules
        console.log('- supplierOrdersAPI:', !!window.supplierOrdersAPI);
        console.log('- purchaseOrderPrinter:', !!window.purchaseOrderPrinter);
        
        if (!window.supplierOrdersAPI) {
            console.error('❌ supplierOrdersAPI non disponible');
            return;
        }
        
        console.log('\n2️⃣ LISTE DES COMMANDES DISPONIBLES');
        
        // Récupérer toutes les commandes
        const orders = await window.supplierOrdersAPI.getOrders();
        console.log('📋 Nombre de commandes:', orders.length);
        
        if (orders.length === 0) {
            console.warn('⚠️ Aucune commande disponible pour le test');
            return;
        }
        
        // Afficher les détails des commandes
        orders.forEach((order, index) => {
            console.log(`📦 Commande ${index + 1}:`);
            console.log(`   - ID: ${order.id} (type: ${typeof order.id})`);
            console.log(`   - Numéro: ${order.order_number}`);
            console.log(`   - Fournisseur: ${order.supplier_name}`);
            console.log(`   - Statut: ${order.status}`);
            console.log(`   - Articles: ${order.items_count || 'N/A'}`);
        });
        
        console.log('\n3️⃣ TEST DE RÉCUPÉRATION DES DÉTAILS');
        
        // Tester avec la première commande
        const firstOrder = orders[0];
        console.log(`🔍 Test avec commande ID: ${firstOrder.id}`);
        
        try {
            const orderDetails = await window.supplierOrdersAPI.getOrderDetails(firstOrder.id);
            console.log('✅ Détails récupérés avec succès:');
            console.log('   - Numéro:', orderDetails.order_number);
            console.log('   - Fournisseur:', orderDetails.supplier_name);
            console.log('   - Articles:', orderDetails.items?.length || 0);
            
            if (orderDetails.items && orderDetails.items.length > 0) {
                console.log('📦 Premier article:');
                const firstItem = orderDetails.items[0];
                console.log('   - Nom:', firstItem.product_name);
                console.log('   - Quantité:', firstItem.quantity_ordered);
                console.log('   - Prix:', firstItem.unit_price);
            }
            
            console.log('\n4️⃣ TEST DE GÉNÉRATION HTML');
            
            if (window.purchaseOrderPrinter) {
                try {
                    const html = window.purchaseOrderPrinter.generateOrderHTML(orderDetails);
                    console.log('✅ HTML généré avec succès');
                    console.log('📏 Taille HTML:', html.length, 'caractères');
                    
                    // Vérifier le contenu
                    const hasTitle = html.includes('BON DE COMMANDE');
                    const hasOrderNumber = html.includes(orderDetails.order_number);
                    const hasSupplier = html.includes(orderDetails.supplier_name);
                    
                    console.log('🔍 Vérifications du contenu:');
                    console.log('   - Titre présent:', hasTitle ? '✅' : '❌');
                    console.log('   - Numéro commande:', hasOrderNumber ? '✅' : '❌');
                    console.log('   - Nom fournisseur:', hasSupplier ? '✅' : '❌');
                    
                    console.log('\n5️⃣ TEST D\'APERÇU');
                    
                    // Tester l'aperçu
                    await window.purchaseOrderPrinter.previewOrder(orderDetails);
                    console.log('✅ Aperçu testé avec succès');
                    
                } catch (error) {
                    console.error('❌ Erreur lors de la génération HTML:', error);
                }
            } else {
                console.error('❌ purchaseOrderPrinter non disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des détails:', error);
            console.error('📋 Détails de l\'erreur:', error.message);
        }
        
        console.log('\n6️⃣ TEST DES FONCTIONS D\'INTÉGRATION');
        
        // Tester les fonctions globales
        try {
            console.log('🔍 Test de previewPurchaseOrder...');
            if (typeof previewPurchaseOrder === 'function') {
                await previewPurchaseOrder(firstOrder.id);
                console.log('✅ previewPurchaseOrder fonctionne');
            } else {
                console.error('❌ previewPurchaseOrder non définie');
            }
        } catch (error) {
            console.error('❌ Erreur previewPurchaseOrder:', error.message);
        }
        
        console.log('\n🎯 RÉSULTAT DU DEBUG');
        console.log('✅ Debug terminé - Vérifiez les logs ci-dessus pour identifier les problèmes');
        
    } catch (error) {
        console.error('❌ Erreur lors du debug:', error);
    }
}

/**
 * Test rapide avec une commande spécifique
 */
async function testSpecificOrder(orderId) {
    try {
        console.log(`\n🎯 TEST SPÉCIFIQUE - Commande ID: ${orderId}`);
        
        // Convertir en nombre si c'est une chaîne
        const numericId = parseInt(orderId);
        console.log(`🔢 ID numérique: ${numericId}`);
        
        // Tester la récupération
        const orderDetails = await window.supplierOrdersAPI.getOrderDetails(numericId);
        console.log('✅ Commande trouvée:', orderDetails.order_number);
        
        // Tester l'aperçu
        if (window.purchaseOrderPrinter) {
            await window.purchaseOrderPrinter.previewOrder(orderDetails);
            console.log('✅ Aperçu ouvert avec succès');
        }
        
    } catch (error) {
        console.error('❌ Erreur test spécifique:', error.message);
    }
}

/**
 * Créer une commande de test si aucune n'existe
 */
async function createTestOrderIfNeeded() {
    try {
        const orders = await window.supplierOrdersAPI.getOrders();
        
        if (orders.length > 0) {
            console.log('✅ Commandes existantes trouvées, pas besoin de créer de test');
            return;
        }
        
        console.log('🔧 Création d\'une commande de test...');
        
        // Récupérer un fournisseur
        const suppliers = await window.api.suppliers.getAll();
        if (suppliers.length === 0) {
            console.error('❌ Aucun fournisseur disponible');
            return;
        }
        
        const testOrderData = {
            supplier_id: suppliers[0].id,
            order_date: new Date().toISOString().split('T')[0],
            status: 'PENDING',
            notes: 'Commande de test pour debug impression',
            items: [
                {
                    product_name: 'Produit Test Debug',
                    product_reference: 'TEST-DEBUG-001',
                    quantity_ordered: 5,
                    unit_price: 100.00
                }
            ]
        };
        
        const result = await window.supplierOrdersAPI.createOrder(testOrderData);
        console.log('✅ Commande de test créée:', result.order_number);
        
        return result.id;
        
    } catch (error) {
        console.error('❌ Erreur lors de la création de commande test:', error);
    }
}

// Exporter les fonctions
window.debugPrintIssue = debugPrintIssue;
window.testSpecificOrder = testSpecificOrder;
window.createTestOrderIfNeeded = createTestOrderIfNeeded;

console.log('🛠️ Fonctions de debug disponibles:');
console.log('- debugPrintIssue() : Debug complet du système d\'impression');
console.log('- testSpecificOrder(id) : Test avec une commande spécifique');
console.log('- createTestOrderIfNeeded() : Créer une commande de test si nécessaire');
console.log('\n💡 Commencez par: debugPrintIssue()');
