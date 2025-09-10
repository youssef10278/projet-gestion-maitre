/**
 * Fonctions du formulaire de devis
 * Gestion des produits, calculs et actions
 */

/**
 * Rend les produits dans la grille
 */
async function renderQuoteProducts() {
    const productsGrid = document.getElementById('products-grid');
    const productSearch = document.getElementById('product-search');
    
    if (!productsGrid) return;
    
    try {
        const searchTerm = productSearch?.value.toLowerCase() || '';
        
        // Filtrer les produits
        const filteredProducts = allProducts.filter(product => {
            const inCategory = selectedCategory === 'all' || product.category === selectedCategory;
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm) ||
                (product.barcode && product.barcode.includes(searchTerm));
            return inCategory && matchesSearch;
        });
        
        if (filteredProducts.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-gray-400 mb-4">
                        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-4.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"></path>
                        </svg>
                    </div>
                    <p class="text-gray-500">Aucun produit trouvé</p>
                </div>
            `;
            return;
        }
        
        // Créer les cartes de produits
        const productsHTML = filteredProducts.map(product => createProductCard(product)).join('');
        productsGrid.innerHTML = productsHTML;
        
    } catch (error) {
        console.error('❌ Erreur lors du rendu des produits:', error);
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-8 text-red-500">
                Erreur lors du chargement des produits
            </div>
        `;
    }
}

/**
 * Crée une carte de produit
 */
function createProductCard(product) {
    const isOutOfStock = product.stock <= 0;
    const stockClass = isOutOfStock ? 'opacity-50' : '';
    const stockText = isOutOfStock ? 'Rupture' : `Stock: ${product.stock}`;
    
    return `
        <div class="product-card ${stockClass} bg-white dark:bg-gray-700 p-3 rounded-lg shadow hover:shadow-md transition-all cursor-pointer border"
             onclick="addProductToQuote(${product.id})" ${isOutOfStock ? 'title="Produit en rupture de stock"' : ''}>
            <div class="text-center">
                <div class="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                </div>
                <h4 class="font-medium text-gray-800 dark:text-white text-sm mb-1 line-clamp-2">${product.name}</h4>
                <p class="text-cyan-600 font-bold text-lg">${(product.price_retail || 0).toFixed(2)} MAD</p>
                <p class="text-xs text-gray-500 mt-1">${stockText}</p>
                ${product.barcode ? `<p class="text-xs text-gray-400 mt-1">${product.barcode}</p>` : ''}
            </div>
        </div>
    `;
}

/**
 * Ajoute un produit au devis
 */
function addProductToQuote(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        console.error('❌ Produit non trouvé:', productId);
        return;
    }
    
    // Vérifier si le produit est déjà dans le panier
    const existingItem = quoteCart.find(item => item.product_id === productId);
    
    if (existingItem) {
        // Augmenter la quantité
        existingItem.quantity += 1;
        existingItem.line_total = existingItem.quantity * existingItem.unit_price;
        existingItem.final_price = existingItem.line_total; // Sans remise par ligne pour l'instant
    } else {
        // Ajouter un nouvel article
        const unitPrice = product.price_retail || 0;
        const newItem = {
            id: Date.now() + Math.random(), // ID temporaire
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            unit_price: unitPrice,
            line_total: unitPrice,
            discount_type: 'percentage',
            discount_value: 0,
            discount_amount: 0,
            final_price: unitPrice
        };
        quoteCart.push(newItem);
    }
    
    console.log('🛒 Produit ajouté au devis:', product.name);
    
    // Mettre à jour l'affichage
    renderQuoteCart();
    calculateTotals();
}

/**
 * Rend le panier du devis
 */
function renderQuoteCart() {
    const cartContainer = document.getElementById('quote-cart');
    if (!cartContainer) return;
    
    if (quoteCart.length === 0) {
        cartContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0L3 3m4 10h10m0 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6z"></path>
                </svg>
                Aucun produit ajouté
            </div>
        `;
        return;
    }
    
    const cartHTML = quoteCart.map(item => createQuoteCartItem(item)).join('');
    cartContainer.innerHTML = cartHTML;
}

/**
 * Crée un élément du panier de devis avec remises par ligne
 */
function createQuoteCartItem(item) {
    const hasLineDiscount = item.discount_value && item.discount_value > 0;
    const lineDiscountAmount = item.discount_amount || 0;
    const finalPrice = item.final_price || item.line_total;

    return `
        <div class="quote-cart-item bg-gray-50 dark:bg-gray-600 p-3 rounded-lg border-l-4 border-cyan-500">
            <!-- Header avec nom et suppression -->
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-medium text-gray-800 dark:text-white text-sm">${item.product_name}</h4>
                <button onclick="removeFromQuoteCart(${item.id})" class="text-red-500 hover:text-red-700 p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Quantité et prix unitaire -->
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <button onclick="updateQuoteItemQuantity(${item.id}, ${item.quantity - 1})"
                            class="w-7 h-7 bg-gray-300 dark:bg-gray-500 rounded text-sm hover:bg-gray-400 flex items-center justify-center"
                            ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                    <span class="w-10 text-center font-medium text-gray-800 dark:text-white">${item.quantity}</span>
                    <button onclick="updateQuoteItemQuantity(${item.id}, ${item.quantity + 1})"
                            class="w-7 h-7 bg-gray-300 dark:bg-gray-500 rounded text-sm hover:bg-gray-400 flex items-center justify-center">+</button>
                </div>

                <div class="text-right">
                    <p class="text-sm text-gray-600 dark:text-gray-400">${item.unit_price.toFixed(2)} MAD/u</p>
                    <p class="text-sm font-medium text-gray-800 dark:text-white">Sous-total: ${item.line_total.toFixed(2)} MAD</p>
                </div>
            </div>

            <!-- Remise par ligne -->
            <div class="bg-white dark:bg-gray-700 p-2 rounded border mb-3">
                <div class="flex items-center gap-2 mb-2">
                    <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Remise ligne:</label>
                    <select onchange="updateItemDiscountType(${item.id}, this.value)"
                            class="text-xs border rounded px-1 py-1 dark:bg-gray-600 dark:border-gray-500">
                        <option value="percentage" ${(item.discount_type || 'percentage') === 'percentage' ? 'selected' : ''}>%</option>
                        <option value="amount" ${(item.discount_type || 'percentage') === 'amount' ? 'selected' : ''}>MAD</option>
                    </select>
                </div>
                <div class="flex gap-2 items-center">
                    <input type="number" value="${item.discount_value || 0}" min="0" step="0.01"
                           onchange="updateItemDiscount(${item.id}, this.value)"
                           class="flex-1 p-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <span class="text-xs text-red-600 font-medium">-${lineDiscountAmount.toFixed(2)} MAD</span>
                </div>
            </div>

            <!-- Total final de la ligne -->
            <div class="flex justify-between items-center pt-2 border-t dark:border-gray-500">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Total ligne:</span>
                <span class="font-bold text-lg ${hasLineDiscount ? 'text-green-600' : 'text-cyan-600'}">${finalPrice.toFixed(2)} MAD</span>
            </div>
        </div>
    `;
}

/**
 * Met à jour la quantité d'un article
 */
function updateQuoteItemQuantity(itemId, newQuantity) {
    if (newQuantity < 1) return;

    const item = quoteCart.find(i => i.id === itemId);
    if (!item) return;

    item.quantity = newQuantity;
    item.line_total = item.quantity * item.unit_price;

    // Recalculer la remise de ligne avec la nouvelle quantité
    calculateItemDiscount(item);

    renderQuoteCart();
    calculateTotals();

    console.log('📊 Quantité mise à jour:', item.product_name, 'x', newQuantity);
}

/**
 * Supprime un article du panier
 */
function removeFromQuoteCart(itemId) {
    const index = quoteCart.findIndex(i => i.id === itemId);
    if (index === -1) return;

    const item = quoteCart[index];
    quoteCart.splice(index, 1);

    renderQuoteCart();
    calculateTotals();

    console.log('🗑️ Produit supprimé du devis:', item.product_name);
}

/**
 * Met à jour le type de remise d'un article
 */
function updateItemDiscountType(itemId, discountType) {
    const item = quoteCart.find(i => i.id === itemId);
    if (!item) return;

    item.discount_type = discountType;

    // Recalculer la remise avec le nouveau type
    calculateItemDiscount(item);

    renderQuoteCart();
    calculateTotals();

    console.log('💰 Type de remise ligne mis à jour:', item.product_name, '→', discountType);
}

/**
 * Met à jour la valeur de remise d'un article
 */
function updateItemDiscount(itemId, discountValue) {
    const item = quoteCart.find(i => i.id === itemId);
    if (!item) return;

    item.discount_value = parseFloat(discountValue) || 0;

    // Recalculer la remise
    calculateItemDiscount(item);

    renderQuoteCart();
    calculateTotals();

    console.log('💰 Remise ligne mise à jour:', item.product_name, '→', discountValue);
}

/**
 * Calcule la remise d'un article spécifique
 */
function calculateItemDiscount(item) {
    if (!item.discount_value || item.discount_value <= 0) {
        item.discount_amount = 0;
        item.final_price = item.line_total;
        return;
    }

    if (item.discount_type === 'percentage') {
        // Remise en pourcentage
        item.discount_amount = (item.line_total * item.discount_value) / 100;
    } else {
        // Remise en montant fixe
        item.discount_amount = item.discount_value;
    }

    // S'assurer que la remise ne dépasse pas le total de la ligne
    item.discount_amount = Math.min(item.discount_amount, item.line_total);

    // Calculer le prix final
    item.final_price = item.line_total - item.discount_amount;

    console.log(`💰 Remise calculée pour ${item.product_name}: -${item.discount_amount.toFixed(2)} MAD`);
}

/**
 * Initialise le calcul des remises
 */
function initDiscountCalculation() {
    const discountTypeSelect = document.getElementById('discount-type');
    const discountValueInput = document.getElementById('discount-value');
    
    if (discountTypeSelect) {
        discountTypeSelect.addEventListener('change', (e) => {
            discountType = e.target.value;
            calculateTotals();
        });
    }
    
    if (discountValueInput) {
        discountValueInput.addEventListener('input', (e) => {
            discountValue = parseFloat(e.target.value) || 0;
            calculateTotals();
        });
    }
}

/**
 * Calcule les totaux avec remises par ligne et remise globale
 */
function calculateTotals() {
    // Calcul du sous-total (avant toute remise)
    subtotal = quoteCart.reduce((sum, item) => sum + item.line_total, 0);

    // Calcul du total après remises par ligne
    const totalAfterLineDiscounts = quoteCart.reduce((sum, item) => sum + (item.final_price || item.line_total), 0);

    // Calcul de la remise globale (appliquée sur le total après remises par ligne)
    let globalDiscountAmount = 0;
    if (discountValue > 0) {
        if (discountType === 'percentage') {
            globalDiscountAmount = (totalAfterLineDiscounts * discountValue) / 100;
        } else {
            globalDiscountAmount = discountValue;
        }

        // S'assurer que la remise globale ne dépasse pas le total après remises par ligne
        globalDiscountAmount = Math.min(globalDiscountAmount, totalAfterLineDiscounts);
    }

    // Calcul du total final
    totalAmount = totalAfterLineDiscounts - globalDiscountAmount;

    // Mettre à jour les variables globales
    discountAmount = globalDiscountAmount;

    // Mettre à jour l'affichage
    updateTotalsDisplay();

    console.log('📊 Calculs mis à jour:', {
        subtotal: subtotal.toFixed(2),
        totalAfterLineDiscounts: totalAfterLineDiscounts.toFixed(2),
        globalDiscount: globalDiscountAmount.toFixed(2),
        finalTotal: totalAmount.toFixed(2)
    });
}

/**
 * Met à jour l'affichage des totaux avec détails des remises
 */
function updateTotalsDisplay() {
    const subtotalElement = document.getElementById('quote-subtotal');
    const discountAmountElement = document.getElementById('discount-amount');
    const totalElement = document.getElementById('quote-total');

    // Calculer les remises par ligne
    const totalLineDiscounts = quoteCart.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
    const totalAfterLineDiscounts = subtotal - totalLineDiscounts;

    // Mettre à jour l'affichage de base
    if (subtotalElement) subtotalElement.textContent = `${subtotal.toFixed(2)} MAD`;
    if (discountAmountElement) discountAmountElement.textContent = `-${discountAmount.toFixed(2)} MAD`;
    if (totalElement) totalElement.textContent = `${totalAmount.toFixed(2)} MAD`;

    // Ajouter les détails des remises si nécessaire
    updateDetailedTotalsDisplay(totalLineDiscounts, totalAfterLineDiscounts);

    // Afficher le résumé des économies
    updateSavingsSummary(totalLineDiscounts);
}

/**
 * Met à jour l'affichage détaillé des totaux
 */
function updateDetailedTotalsDisplay(totalLineDiscounts, totalAfterLineDiscounts) {
    // Chercher ou créer la zone de détails
    let detailsContainer = document.getElementById('totals-details');
    const parentContainer = document.getElementById('quote-subtotal')?.parentElement;

    if (!detailsContainer && parentContainer) {
        detailsContainer = document.createElement('div');
        detailsContainer.id = 'totals-details';
        detailsContainer.className = 'text-sm space-y-1 border-t dark:border-gray-600 pt-2 mt-2';

        // Insérer avant la remise globale
        const discountContainer = document.getElementById('discount-amount')?.parentElement?.parentElement;
        if (discountContainer) {
            parentContainer.insertBefore(detailsContainer, discountContainer);
        }
    }

    if (detailsContainer) {
        // Afficher les détails seulement s'il y a des remises par ligne
        if (totalLineDiscounts > 0) {
            detailsContainer.innerHTML = `
                <div class="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Sous-total:</span>
                    <span>${subtotal.toFixed(2)} MAD</span>
                </div>
                <div class="flex justify-between text-green-600">
                    <span>Remises par ligne:</span>
                    <span>-${totalLineDiscounts.toFixed(2)} MAD</span>
                </div>
                <div class="flex justify-between font-medium text-gray-800 dark:text-white">
                    <span>Total après remises ligne:</span>
                    <span>${totalAfterLineDiscounts.toFixed(2)} MAD</span>
                </div>
            `;
            detailsContainer.classList.remove('hidden');
        } else {
            detailsContainer.classList.add('hidden');
        }
    }
}

/**
 * Met à jour le résumé des économies
 */
function updateSavingsSummary(totalLineDiscounts) {
    const savingsContainer = document.getElementById('savings-summary');
    const savingsText = document.getElementById('total-savings');

    if (!savingsContainer || !savingsText) return;

    const totalSavings = totalLineDiscounts + discountAmount;

    if (totalSavings > 0) {
        savingsText.textContent = `💰 Économies totales: ${totalSavings.toFixed(2)} MAD`;
        savingsContainer.classList.remove('hidden');
    } else {
        savingsContainer.classList.add('hidden');
    }
}

/**
 * Applique une remise rapide globale
 */
function applyQuickDiscount(type, value) {
    const discountTypeSelect = document.getElementById('discount-type');
    const discountValueInput = document.getElementById('discount-value');

    if (discountTypeSelect) {
        discountTypeSelect.value = type;
        discountType = type;
    }

    if (discountValueInput) {
        discountValueInput.value = value;
        discountValue = value;
    }

    calculateTotals();

    console.log('⚡ Remise rapide appliquée:', type, value);
}

/**
 * Applique une remise rapide à tous les articles
 */
function applyQuickDiscountToAllItems(type, value) {
    if (quoteCart.length === 0) {
        showQuoteNotification('warning', 'Aucun produit dans le devis');
        return;
    }

    quoteCart.forEach(item => {
        item.discount_type = type;
        item.discount_value = value;
        calculateItemDiscount(item);
    });

    renderQuoteCart();
    calculateTotals();

    console.log('⚡ Remise rapide appliquée à tous les articles:', type, value);
}

/**
 * Efface toutes les remises (lignes et globale)
 */
function clearAllDiscounts() {
    // Effacer les remises par ligne
    quoteCart.forEach(item => {
        item.discount_type = 'percentage';
        item.discount_value = 0;
        item.discount_amount = 0;
        item.final_price = item.line_total;
    });

    // Effacer la remise globale
    const discountTypeSelect = document.getElementById('discount-type');
    const discountValueInput = document.getElementById('discount-value');

    if (discountTypeSelect) discountTypeSelect.value = 'percentage';
    if (discountValueInput) discountValueInput.value = '0';

    discountType = 'percentage';
    discountValue = 0;
    discountAmount = 0;

    renderQuoteCart();
    calculateTotals();

    console.log('🧹 Toutes les remises effacées');
}

/**
 * Réinitialise les calculs
 */
function resetCalculations() {
    subtotal = 0;
    discountType = 'percentage';
    discountValue = 0;
    discountAmount = 0;
    totalAmount = 0;
    updateTotalsDisplay();
}

/**
 * Initialise les valeurs par défaut pour un nouveau devis
 */
function initNewQuoteDefaults() {
    const validityInput = document.getElementById('validity-days');
    const discountTypeSelect = document.getElementById('discount-type');
    const discountValueInput = document.getElementById('discount-value');
    
    if (validityInput) validityInput.value = '30';
    if (discountTypeSelect) discountTypeSelect.value = 'percentage';
    if (discountValueInput) discountValueInput.value = '0';
    
    resetCalculations();
    console.log('✅ Valeurs par défaut initialisées');
}

/**
 * Charge un devis pour édition
 */
async function loadQuoteForEdit(quoteId) {
    try {
        console.log('📝 Chargement du devis pour édition:', quoteId);
        
        const quote = await window.api.quotes.getById(quoteId);
        if (!quote) {
            throw new Error('Devis non trouvé');
        }
        
        // Remplir les champs
        const numberInput = document.getElementById('quote-number');
        const validityInput = document.getElementById('validity-days');
        const notesInput = document.getElementById('quote-notes');
        const conditionsInput = document.getElementById('quote-conditions');
        const discountTypeSelect = document.getElementById('discount-type');
        const discountValueInput = document.getElementById('discount-value');
        
        if (numberInput) numberInput.value = quote.number;
        if (validityInput) validityInput.value = quote.validity_days;
        if (notesInput) notesInput.value = quote.notes || '';
        if (conditionsInput) conditionsInput.value = quote.conditions || '';
        if (discountTypeSelect) discountTypeSelect.value = quote.discount_type || 'percentage';
        if (discountValueInput) discountValueInput.value = quote.discount_value || 0;
        
        // Sélectionner le client
        if (quote.client_id) {
            const client = allClients.find(c => c.id === quote.client_id);
            if (client) {
                selectClient(client);
            }
        } else if (quote.client_name) {
            // Client sans ID (client temporaire)
            selectedClient = {
                id: null,
                name: quote.client_name,
                phone: quote.client_phone,
                address: quote.client_address
            };
            
            const clientSearch = document.getElementById('client-search');
            const selectedDisplay = document.getElementById('selected-client-display');
            const selectedName = document.getElementById('selected-client-name');
            const selectedDetails = document.getElementById('selected-client-details');
            
            if (clientSearch) clientSearch.value = quote.client_name;
            if (selectedDisplay && selectedName && selectedDetails) {
                selectedName.textContent = quote.client_name;
                selectedDetails.textContent = `${quote.client_phone || 'Pas de téléphone'} ${quote.client_address ? '• ' + quote.client_address : ''}`;
                selectedDisplay.classList.remove('hidden');
            }
        }
        
        // Charger les articles
        if (quote.items && quote.items.length > 0) {
            quoteCart = quote.items.map(item => ({
                id: item.id || Date.now() + Math.random(),
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                line_total: item.line_total,
                final_price: item.final_price
            }));
        }
        
        // Mettre à jour les variables de calcul
        discountType = quote.discount_type || 'percentage';
        discountValue = quote.discount_value || 0;
        
        // Recalculer et afficher
        renderQuoteCart();
        calculateTotals();
        
        console.log('✅ Devis chargé pour édition');
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement du devis:', error);
        showQuoteNotification('error', 'Erreur lors du chargement du devis');
        closeQuoteModal();
    }
}

/**
 * Initialise les actions du formulaire
 */
function initFormActions() {
    const saveBtn = document.getElementById('save-quote-btn');
    const printBtn = document.getElementById('print-quote-btn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveQuote);
    }
    
    if (printBtn) {
        printBtn.addEventListener('click', previewAndPrintQuote);
    }
}

/**
 * Sauvegarde le devis
 */
async function saveQuote() {
    try {
        console.log('💾 Sauvegarde du devis...');
        
        // Validation
        if (!selectedClient) {
            showQuoteNotification('warning', 'Veuillez sélectionner un client');
            return;
        }

        if (quoteCart.length === 0) {
            showQuoteNotification('warning', 'Veuillez ajouter au moins un produit');
            return;
        }
        
        // Validation avancée des remises
        const validationResult = validateQuoteDiscounts();
        if (!validationResult.valid) {
            showQuoteNotification('error', validationResult.message);
            return;
        }

        // Préparer les articles avec remises par ligne
        const itemsWithDiscounts = quoteCart.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
            discount_type: item.discount_type || 'percentage',
            discount_value: item.discount_value || 0,
            discount_amount: item.discount_amount || 0,
            final_price: item.final_price || item.line_total
        }));

        // Préparer les données
        const quoteData = {
            clientId: selectedClient.id,
            clientName: selectedClient.name,
            clientPhone: selectedClient.phone || '',
            clientAddress: selectedClient.address || '',
            validityDays: parseInt(document.getElementById('validity-days')?.value) || 30,
            items: itemsWithDiscounts,
            subtotal: subtotal,
            discountType: discountType,
            discountValue: discountValue,
            discountAmount: discountAmount,
            totalAmount: totalAmount,
            notes: document.getElementById('quote-notes')?.value || '',
            conditions: document.getElementById('quote-conditions')?.value || ''
        };
        
        let result;
        if (isEditMode && currentQuote) {
            result = await window.api.quotes.update(currentQuote, quoteData);
        } else {
            result = await window.api.quotes.create(quoteData);
        }
        
        if (result.success) {
            console.log('✅ Devis sauvegardé:', result.number || 'ID: ' + currentQuote);
            showQuoteNotification('success', `Devis ${isEditMode ? 'mis à jour' : 'créé'} avec succès !`);
            closeQuoteModal();
            await loadQuotes(); // Recharger la liste
        } else {
            throw new Error(result.error || 'Erreur lors de la sauvegarde');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        showQuoteNotification('error', 'Erreur lors de la sauvegarde du devis');
    }
}

/**
 * Aperçu et impression du devis
 */
async function previewAndPrintQuote() {
    console.log('🖨️ Aperçu et impression du devis...');

    // Validation
    if (!selectedClient) {
        showQuoteNotification('warning', 'Veuillez sélectionner un client');
        return;
    }

    if (quoteCart.length === 0) {
        showQuoteNotification('warning', 'Veuillez ajouter au moins un produit');
        return;
    }

    try {
        // Préparer les données pour l'impression
        const printData = await preparePrintData();

        // Afficher le modal de choix d'impression
        showPrintOptionsModal(printData);

    } catch (error) {
        console.error('❌ Erreur lors de la préparation de l\'impression:', error);
        showQuoteNotification('error', 'Erreur lors de la préparation de l\'impression');
    }
}

/**
 * Prépare les données pour l'impression
 */
async function preparePrintData() {
    // Obtenir les informations de l'entreprise
    let companySettings = {};
    try {
        if (window.api && window.api.settings) {
            companySettings = await window.api.settings.getCompanyInfo() || {};
        }
    } catch (error) {
        console.warn('Impossible de récupérer les informations de l\'entreprise:', error);
    }

    // Calculer les totaux détaillés
    const lineDiscountsTotal = quoteCart.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
    const totalAfterLineDiscounts = subtotal - lineDiscountsTotal;

    // Préparer les données complètes
    const printData = {
        // Informations de base
        number: document.getElementById('quote-number')?.value || 'DEV-TEMP',
        date_created: new Date().toISOString(),
        date_validity: calculateValidityDate(),
        validity_days: parseInt(document.getElementById('validity-days')?.value) || 30,
        status: 'draft',

        // Client
        client_name: selectedClient.name,
        client_phone: selectedClient.phone || '',
        client_address: selectedClient.address || '',

        // Articles avec remises détaillées
        items: quoteCart.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
            discount_type: item.discount_type || 'percentage',
            discount_value: item.discount_value || 0,
            discount_amount: item.discount_amount || 0,
            final_price: item.final_price || item.line_total
        })),

        // Totaux
        subtotal: subtotal,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,
        total_amount: totalAmount,

        // Notes et conditions
        notes: document.getElementById('quote-notes')?.value || '',
        conditions: document.getElementById('quote-conditions')?.value || getDefaultConditions(),

        // Informations entreprise
        company: companySettings,

        // Métadonnées
        created_by: 'GestionPro',
        line_discounts_total: lineDiscountsTotal,
        total_after_line_discounts: totalAfterLineDiscounts
    };

    console.log('📋 Données d\'impression préparées:', printData);
    return printData;
}

/**
 * Calcule la date de validité
 */
function calculateValidityDate() {
    const validityDays = parseInt(document.getElementById('validity-days')?.value) || 30;
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + validityDays);
    return validityDate.toISOString();
}

/**
 * Retourne les conditions par défaut
 */
function getDefaultConditions() {
    return `• Devis valable ${document.getElementById('validity-days')?.value || 30} jours
• Prix exprimés en MAD TTC
• Règlement à la commande
• Livraison sous réserve de disponibilité`;
}

/**
 * Affiche le modal de choix d'impression
 */
function showPrintOptionsModal(printData) {
    // Créer le modal s'il n'existe pas
    let modal = document.getElementById('print-options-modal');
    if (!modal) {
        modal = createPrintOptionsModal();
        document.body.appendChild(modal);
    }

    // Configurer les boutons avec les données
    const previewBtn = modal.querySelector('#preview-quote-btn');
    const printBtn = modal.querySelector('#print-quote-btn');
    const pdfBtn = modal.querySelector('#pdf-quote-btn');

    previewBtn.onclick = () => {
        window.quotePrinter.previewQuote(printData);
        closePrintOptionsModal();
    };

    printBtn.onclick = () => {
        window.quotePrinter.printQuote(printData);
        closePrintOptionsModal();
    };

    pdfBtn.onclick = () => {
        window.quotePrinter.exportToPDF(printData);
        closePrintOptionsModal();
    };

    // Afficher le modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Crée le modal de choix d'impression
 */
function createPrintOptionsModal() {
    const modal = document.createElement('div');
    modal.id = 'print-options-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50';

    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">🖨️ Options d'impression</h3>
                <button onclick="closePrintOptionsModal()" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <div class="space-y-3">
                <button id="preview-quote-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    👁️ Aperçu du devis
                </button>

                <button id="print-quote-btn" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                    </svg>
                    🖨️ Imprimer directement
                </button>

                <button id="pdf-quote-btn" class="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    📄 Exporter en PDF
                </button>

                <button onclick="closePrintOptionsModal()" class="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                    Annuler
                </button>
            </div>
        </div>
    `;

    return modal;
}

/**
 * Ferme le modal d'impression
 */
function closePrintOptionsModal() {
    const modal = document.getElementById('print-options-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Affiche une notification non-bloquante pour le module devis
 */
function showQuoteNotification(type, message) {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
        createQuoteNotification(type, message);
    }
}

/**
 * Crée une notification temporaire pour le module devis
 */
function createQuoteNotification(type, message) {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.quote-notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `quote-notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-black' :
        'bg-blue-500 text-white'
    }`;

    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <div class="flex-shrink-0">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div class="flex-1">${message}</div>
            <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 text-white hover:text-gray-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);

    // Supprimer automatiquement après 4 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 4000);
}

/**
 * Duplique le panier actuel (utile pour créer des variantes)
 */
function duplicateQuoteCart() {
    if (quoteCart.length === 0) {
        showQuoteNotification('warning', 'Aucun produit à dupliquer');
        return;
    }

    const duplicatedItems = quoteCart.map(item => ({
        ...item,
        id: Date.now() + Math.random(), // Nouvel ID
        quantity: item.quantity
    }));

    quoteCart.push(...duplicatedItems);

    renderQuoteCart();
    calculateTotals();

    console.log('📋 Panier dupliqué:', duplicatedItems.length, 'articles ajoutés');
}

/**
 * Valide les remises du devis
 */
function validateQuoteDiscounts() {
    // Vérifier les remises par ligne
    for (const item of quoteCart) {
        if (item.discount_value > 0) {
            if (item.discount_type === 'percentage' && item.discount_value > 100) {
                return {
                    valid: false,
                    message: `Remise de ${item.product_name}: Le pourcentage ne peut pas dépasser 100%`
                };
            }

            if (item.discount_type === 'amount' && item.discount_value > item.line_total) {
                return {
                    valid: false,
                    message: `Remise de ${item.product_name}: Le montant ne peut pas dépasser le total de la ligne (${item.line_total.toFixed(2)} MAD)`
                };
            }
        }
    }

    // Vérifier la remise globale
    if (discountValue > 0) {
        const totalAfterLineDiscounts = quoteCart.reduce((sum, item) => sum + (item.final_price || item.line_total), 0);

        if (discountType === 'percentage' && discountValue > 100) {
            return {
                valid: false,
                message: 'La remise globale ne peut pas dépasser 100%'
            };
        }

        if (discountType === 'amount' && discountValue > totalAfterLineDiscounts) {
            return {
                valid: false,
                message: `La remise globale ne peut pas dépasser le total après remises par ligne (${totalAfterLineDiscounts.toFixed(2)} MAD)`
            };
        }
    }

    // Vérifier que le total final n'est pas négatif
    if (totalAmount < 0) {
        return {
            valid: false,
            message: 'Le total final ne peut pas être négatif. Réduisez les remises.'
        };
    }

    return { valid: true };
}

// Exposer les fonctions globalement
window.renderQuoteProducts = renderQuoteProducts;
window.addProductToQuote = addProductToQuote;
window.updateQuoteItemQuantity = updateQuoteItemQuantity;
window.removeFromQuoteCart = removeFromQuoteCart;
window.selectClient = selectClient;
window.clearSelectedClient = clearSelectedClient;
window.selectQuoteCategory = selectQuoteCategory;
window.saveQuote = saveQuote;
window.previewAndPrintQuote = previewAndPrintQuote;
window.updateItemDiscountType = updateItemDiscountType;
window.updateItemDiscount = updateItemDiscount;
window.applyQuickDiscount = applyQuickDiscount;
window.applyQuickDiscountToAllItems = applyQuickDiscountToAllItems;
window.clearAllDiscounts = clearAllDiscounts;
window.duplicateQuoteCart = duplicateQuoteCart;
window.closePrintOptionsModal = closePrintOptionsModal;
