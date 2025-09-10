// Script de correction d'urgence pour le scanner
// À exécuter dans la console de l'application (F12)

console.log('🚨 === CORRECTION D\'URGENCE SCANNER ===');

// 1. Nettoyer toutes les variables d'état
console.log('🧹 Nettoyage des variables d\'état...');
if (typeof isProcessingBarcode !== 'undefined') isProcessingBarcode = false;
if (typeof lastProcessedBarcode !== 'undefined') lastProcessedBarcode = '';
if (typeof lastProcessedTime !== 'undefined') lastProcessedTime = 0;
if (typeof inputTimeout !== 'undefined' && inputTimeout) {
    clearTimeout(inputTimeout);
    inputTimeout = null;
}

// 2. Vérifier que le champ scanner existe
const barcodeInput = document.getElementById('barcodeInput');
if (!barcodeInput) {
    console.error('❌ Champ scanner non trouvé !');
    console.log('💡 Vérifiez que vous êtes sur la page Caisse');
} else {
    console.log('✅ Champ scanner trouvé');
}

// 3. Supprimer tous les event listeners existants (méthode brutale)
console.log('🔄 Suppression des anciens event listeners...');
const newBarcodeInput = barcodeInput.cloneNode(true);
barcodeInput.parentNode.replaceChild(newBarcodeInput, barcodeInput);

// 4. Redéfinir les fonctions essentielles si elles n'existent pas
if (typeof processBarcodeInput === 'undefined') {
    console.log('🔧 Redéfinition de processBarcodeInput...');
    window.processBarcodeInput = async function(barcode) {
        console.log('📱 processBarcodeInput (mode urgence):', barcode);
        
        if (!barcode || barcode.trim() === '') return;
        
        const cleanedBarcode = barcode.trim().replace(/[\r\n\t]/g, '');
        if (cleanedBarcode.length < 4) {
            console.log('❌ Code-barres trop court:', cleanedBarcode);
            return;
        }
        
        console.log('🔍 Recherche produit pour code:', cleanedBarcode);
        
        // Chercher le produit
        if (typeof allProducts !== 'undefined' && allProducts.length > 0) {
            const product = allProducts.find(p => p.barcode === cleanedBarcode);
            if (product) {
                console.log('✅ Produit trouvé:', product.name);
                if (typeof addProductToCart === 'function') {
                    addProductToCart(product.id);
                    console.log('🛒 Produit ajouté au panier');
                } else {
                    console.log('⚠️ Fonction addProductToCart non disponible');
                }
            } else {
                console.log('❌ Produit non trouvé pour le code:', cleanedBarcode);
                if (typeof showNotification === 'function') {
                    showNotification(`Aucun produit trouvé pour le code: ${cleanedBarcode}`, 'error');
                }
            }
        } else {
            console.log('⚠️ Liste des produits non disponible');
        }
    };
}

// 5. Attacher les nouveaux event listeners (version simplifiée)
console.log('🔗 Attachement des nouveaux event listeners...');

// Event listener pour Enter (prioritaire)
newBarcodeInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const barcode = e.target.value.trim();
        if (barcode.length > 0) {
            console.log('🔍 Scan manuel via Enter:', barcode);
            await processBarcodeInput(barcode);
            e.target.value = '';
            e.target.focus();
        }
    }
});

// Event listener pour input automatique (simplifié)
let simpleInputTimeout = null;
newBarcodeInput.addEventListener('input', async (e) => {
    const currentValue = e.target.value.trim();
    
    // Annuler le timeout précédent
    if (simpleInputTimeout) {
        clearTimeout(simpleInputTimeout);
    }
    
    // Si le champ contient un code-barres potentiel
    if (currentValue.length >= 8) {
        simpleInputTimeout = setTimeout(async () => {
            console.log('📱 Détection automatique (mode urgence):', currentValue);
            
            // Traitement simple - pas de codes multiples pour l'instant
            await processBarcodeInput(currentValue);
            
            // Vider le champ
            e.target.value = '';
            e.target.focus();
        }, 150); // Délai un peu plus long pour la sécurité
    }
});

// 6. Remettre le focus
console.log('🎯 Remise du focus...');
newBarcodeInput.focus();

// 7. Test automatique
console.log('🧪 Test automatique...');
setTimeout(() => {
    console.log('🔍 Test avec code de démonstration...');
    if (typeof allProducts !== 'undefined' && allProducts.length > 0) {
        // Prendre le premier produit avec un code-barres
        const testProduct = allProducts.find(p => p.barcode && p.barcode.length >= 8);
        if (testProduct) {
            console.log(`🧪 Test avec produit existant: ${testProduct.name} (${testProduct.barcode})`);
            newBarcodeInput.value = testProduct.barcode;
            // Simuler Enter
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            newBarcodeInput.dispatchEvent(enterEvent);
        } else {
            console.log('🧪 Test avec code générique...');
            newBarcodeInput.value = '1234567890123';
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            newBarcodeInput.dispatchEvent(enterEvent);
        }
    } else {
        console.log('⚠️ Aucun produit disponible pour le test');
    }
}, 1000);

// 8. Instructions pour l'utilisateur
console.log('');
console.log('✅ === CORRECTION D\'URGENCE TERMINÉE ===');
console.log('');
console.log('📋 INSTRUCTIONS:');
console.log('1. Le scanner est maintenant en mode simplifié');
console.log('2. Scannez un code-barres ou tapez-le manuellement');
console.log('3. Appuyez sur Enter après la saisie manuelle');
console.log('4. Vérifiez que le produit s\'ajoute au panier');
console.log('');
console.log('🔍 TESTS À FAIRE:');
console.log('- Tapez "1234567890123" et appuyez sur Enter');
console.log('- Scannez un vrai code-barres');
console.log('- Vérifiez les logs dans cette console');
console.log('');
console.log('🚨 SI ÇA NE FONCTIONNE TOUJOURS PAS:');
console.log('1. Rechargez la page (F5)');
console.log('2. Réexécutez ce script');
console.log('3. Contactez le support technique');
console.log('');

// 9. Fonction de diagnostic
window.diagnosticScanner = function() {
    console.log('🔍 === DIAGNOSTIC SCANNER ===');
    console.log('Champ scanner:', !!document.getElementById('barcodeInput'));
    console.log('Focus actuel:', document.activeElement?.id || 'aucun');
    console.log('processBarcodeInput:', typeof processBarcodeInput);
    console.log('addProductToCart:', typeof addProductToCart);
    console.log('allProducts:', typeof allProducts, allProducts?.length || 0);
    console.log('isProcessingBarcode:', typeof isProcessingBarcode !== 'undefined' ? isProcessingBarcode : 'undefined');
    console.log('lastProcessedBarcode:', typeof lastProcessedBarcode !== 'undefined' ? lastProcessedBarcode : 'undefined');
    console.log('');
    console.log('💡 Tapez diagnosticScanner() pour relancer ce diagnostic');
};

console.log('💡 Tapez diagnosticScanner() pour un diagnostic complet');
console.log('💡 Le scanner devrait maintenant fonctionner en mode basique');
