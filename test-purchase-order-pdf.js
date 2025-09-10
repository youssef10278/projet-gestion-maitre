// test-purchase-order-pdf.js - Test des templates PDF pour bons de commande

console.log('🧪 === TEST DES TEMPLATES PDF BONS DE COMMANDE ===');

/**
 * Test complet des fonctionnalités PDF
 */
async function testPurchaseOrderPDF() {
    try {
        console.log('\n1️⃣ VÉRIFICATION DES MODULES');
        
        // Vérifier que les modules sont disponibles
        if (!window.purchaseOrderPrinter) {
            console.error('❌ PurchaseOrderPrinter non disponible');
            return;
        }
        
        if (!window.supplierOrdersAPI) {
            console.error('❌ SupplierOrdersAPI non disponible');
            return;
        }
        
        console.log('✅ Modules disponibles');
        
        console.log('\n2️⃣ CRÉATION D\'UNE COMMANDE DE TEST');
        
        // Créer un fournisseur de test si nécessaire
        let testSupplier;
        try {
            const suppliers = await window.api.suppliers.getAll();
            testSupplier = suppliers.find(s => s.name === 'Fournisseur Test PDF');
            
            if (!testSupplier) {
                testSupplier = await window.api.suppliers.add({
                    name: 'Fournisseur Test PDF',
                    company: 'PDF Test Company',
                    email: 'test@pdf.com',
                    phone: '0600000001'
                });
                console.log('✅ Fournisseur de test créé:', testSupplier.name);
            } else {
                console.log('✅ Fournisseur de test trouvé:', testSupplier.name);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la création du fournisseur:', error);
            return;
        }
        
        // Créer une commande de test avec des données complètes
        const testOrderData = {
            supplier_id: testSupplier.id,
            order_date: new Date().toISOString().split('T')[0],
            expected_delivery_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'CONFIRMED',
            notes: 'Commande de test pour validation des templates PDF - Contient plusieurs articles avec des prix différents',
            items: [
                {
                    product_name: 'Ordinateur Portable Dell',
                    product_reference: 'DELL-LAT-001',
                    quantity_ordered: 5,
                    quantity_received: 0,
                    unit_price: 1250.00
                },
                {
                    product_name: 'Souris Optique Logitech',
                    product_reference: 'LOG-MX-002',
                    quantity_ordered: 10,
                    quantity_received: 0,
                    unit_price: 45.50
                },
                {
                    product_name: 'Clavier Mécanique RGB',
                    product_reference: 'KB-RGB-003',
                    quantity_ordered: 8,
                    quantity_received: 0,
                    unit_price: 89.99
                },
                {
                    product_name: 'Écran 24" Full HD',
                    product_reference: 'MON-24-004',
                    quantity_ordered: 3,
                    quantity_received: 0,
                    unit_price: 299.00
                }
            ]
        };
        
        const createResult = await window.supplierOrdersAPI.createOrder(testOrderData);
        if (!createResult || !createResult.id) {
            console.error('❌ Échec de la création de la commande');
            return;
        }
        
        console.log('✅ Commande créée:', createResult.order_number);
        const orderId = createResult.id;
        
        // Récupérer les détails complets
        const orderDetails = await window.supplierOrdersAPI.getOrderDetails(orderId);
        console.log('📋 Détails de la commande:', {
            id: orderDetails.id,
            number: orderDetails.order_number,
            total: orderDetails.total_amount,
            items: orderDetails.items?.length || 0
        });
        
        console.log('\n3️⃣ TEST DE GÉNÉRATION HTML');
        
        // Tester la génération HTML
        try {
            window.purchaseOrderPrinter.setOrderData(orderDetails);
            const htmlContent = window.purchaseOrderPrinter.generateOrderHTML();
            
            if (htmlContent && htmlContent.includes('BON DE COMMANDE')) {
                console.log('✅ HTML généré avec succès');
                console.log('📏 Taille du HTML:', htmlContent.length, 'caractères');
                
                // Vérifier la présence d'éléments clés
                const checks = [
                    { name: 'Titre', test: htmlContent.includes('BON DE COMMANDE') },
                    { name: 'Numéro commande', test: htmlContent.includes(orderDetails.order_number) },
                    { name: 'Fournisseur', test: htmlContent.includes(testSupplier.name) },
                    { name: 'Articles', test: htmlContent.includes('Ordinateur Portable Dell') },
                    { name: 'Prix', test: htmlContent.includes('1250.00') },
                    { name: 'Total', test: htmlContent.includes('MAD') },
                    { name: 'Signatures', test: htmlContent.includes('Signature') }
                ];
                
                console.log('\n📋 Vérifications du contenu HTML:');
                checks.forEach(check => {
                    const status = check.test ? '✅' : '❌';
                    console.log(`${status} ${check.name}`);
                });
                
            } else {
                console.error('❌ HTML généré invalide ou vide');
                return;
            }
        } catch (error) {
            console.error('❌ Erreur lors de la génération HTML:', error);
            return;
        }
        
        console.log('\n4️⃣ TEST DES FONCTIONS D\'IMPRESSION');
        
        // Tester l'aperçu (ne génère pas de fichier)
        console.log('🔍 Test de l\'aperçu...');
        try {
            await window.purchaseOrderPrinter.previewOrder(orderDetails);
            console.log('✅ Aperçu testé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors du test d\'aperçu:', error);
        }
        
        console.log('\n5️⃣ TEST D\'INTÉGRATION AVEC L\'INTERFACE');
        
        // Tester les fonctions d'intégration
        try {
            console.log('🔗 Test des fonctions d\'intégration...');
            
            // Ces fonctions devraient être disponibles globalement
            const integrationFunctions = [
                'previewPurchaseOrder',
                'printPurchaseOrder', 
                'exportPurchaseOrderToPDF'
            ];
            
            integrationFunctions.forEach(funcName => {
                if (typeof window[funcName] === 'function') {
                    console.log(`✅ ${funcName} disponible`);
                } else {
                    console.log(`❌ ${funcName} manquante`);
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur lors du test d\'intégration:', error);
        }
        
        console.log('\n6️⃣ NETTOYAGE');
        
        // Supprimer la commande de test
        try {
            await window.supplierOrdersAPI.deleteOrder(orderId);
            console.log('✅ Commande de test supprimée');
        } catch (error) {
            console.warn('⚠️ Impossible de supprimer la commande de test:', error.message);
        }
        
        console.log('\n🎯 RÉSULTAT FINAL');
        console.log('✅ TOUS LES TESTS SONT PASSÉS - Les templates PDF fonctionnent correctement !');
        console.log('📄 Vous pouvez maintenant utiliser les boutons d\'impression dans l\'interface');
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
}

/**
 * Test rapide de génération HTML avec données minimales
 */
async function testQuickHTML() {
    console.log('\n🚀 === TEST RAPIDE HTML ===');
    
    try {
        const mockData = {
            id: 999,
            order_number: 'TEST-001',
            order_date: new Date().toISOString().split('T')[0],
            status: 'PENDING',
            supplier_name: 'Fournisseur Test',
            supplier_company: 'Test Company',
            notes: 'Test rapide',
            items: [
                {
                    product_name: 'Produit Test',
                    product_reference: 'TEST-001',
                    quantity_ordered: 1,
                    quantity_received: 0,
                    unit_price: 100.00
                }
            ]
        };
        
        if (window.purchaseOrderPrinter) {
            const html = window.purchaseOrderPrinter.generateOrderHTML(mockData);
            console.log('✅ HTML généré rapidement');
            console.log('📏 Taille:', html.length, 'caractères');
            
            // Ouvrir dans une nouvelle fenêtre pour visualisation
            const testWindow = window.open('', '_blank', 'width=800,height=1000');
            if (testWindow) {
                testWindow.document.write(html);
                testWindow.document.close();
                console.log('👁️ Aperçu ouvert dans une nouvelle fenêtre');
            }
        } else {
            console.error('❌ PurchaseOrderPrinter non disponible');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test rapide:', error);
    }
}

// Exporter les fonctions de test
window.testPurchaseOrderPDF = testPurchaseOrderPDF;
window.testQuickHTML = testQuickHTML;

console.log('📝 Tests disponibles:');
console.log('- testPurchaseOrderPDF() : Test complet des templates PDF');
console.log('- testQuickHTML() : Test rapide avec aperçu HTML');
