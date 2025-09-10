document.addEventListener('DOMContentLoaded', async () => {
    // --- Début des ajouts pour la traduction ---
    await window.i18n.loadTranslations();
    window.i18n.applyTranslationsToHTML();
    const t = window.i18n.t;
    // --- Fin des ajouts pour la traduction ---

    // --- Initialisation et Vérifications (votre code stable) ---
    if (!window.api || !window.api.products || !window.api.session) {
        document.body.innerHTML = "<h1>ERREUR: API manquante.</h1>";
        return;
    }
    
    // --- Éléments du DOM ---
    const tableBody = document.getElementById('adjustmentTableBody');
    const searchInput = document.getElementById('searchInput');
    const reasonInput = document.getElementById('reasonInput');
    const saveBtn = document.getElementById('saveAdjustmentsBtn');
    const resetBtn = document.getElementById('resetChangesBtn');

    // Nouveaux éléments pour les statistiques
    const totalProducts = document.getElementById('totalProducts');
    const inStockProducts = document.getElementById('inStockProducts');
    const alertProducts = document.getElementById('alertProducts');
    const outOfStockProducts = document.getElementById('outOfStockProducts');
    const totalStockValue = document.getElementById('totalStockValue');
    const changedProducts = document.getElementById('changedProducts');

    // Éléments pour les filtres
    const filterAll = document.getElementById('filterAll');
    const filterInStock = document.getElementById('filterInStock');
    const filterAlert = document.getElementById('filterAlert');
    const filterOutOfStock = document.getElementById('filterOutOfStock');

    // Éléments pour les outils d'ajustement en masse
    const bulkAdjustmentType = document.getElementById('bulkAdjustmentType');
    const bulkAdjustmentValue = document.getElementById('bulkAdjustmentValue');
    const applyBulkAdjustmentBtn = document.getElementById('applyBulkAdjustmentBtn');
    const bulkThresholdValue = document.getElementById('bulkThresholdValue');
    const applyBulkThresholdBtn = document.getElementById('applyBulkThresholdBtn');

    let allProducts = [];
    let filteredProducts = [];
    let changedProductsMap = new Map();
    let originalValues = new Map();
    let currentFilter = 'all';

    // La fonction showNotification est maintenant disponible globalement via notifications.js

    // --- Fonctions utilitaires ---
    function getStockStatus(product) {
        if (product.stock <= 0) return 'out-of-stock';
        if (product.alert_threshold > 0 && product.stock <= product.alert_threshold) return 'alert';
        return 'in-stock';
    }

    function getStatusBadge(product) {
        const status = getStockStatus(product);
        let badgeClass = 'status-badge ';
        let icon = '';
        let text = '';

        switch (status) {
            case 'out-of-stock':
                badgeClass += 'out-of-stock';
                icon = '🔴';
                text = 'Rupture';
                break;
            case 'alert':
                badgeClass += 'alert';
                icon = '🟡';
                text = 'Alerte';
                break;
            case 'in-stock':
            default:
                badgeClass += 'in-stock';
                icon = '🟢';
                text = 'En stock';
                break;
        }

        return `<span class="${badgeClass}">${icon} ${text}</span>`;
    }

    function getMovementBadge(oldStock, newStock) {
        if (newStock === oldStock || newStock === '') return '';

        const movement = newStock - oldStock;
        let badgeClass = 'movement-badge ';
        let icon = '';
        let text = '';

        if (movement > 0) {
            badgeClass += 'increase';
            icon = '📈';
            text = `+${movement}`;
        } else if (movement < 0) {
            badgeClass += 'decrease';
            icon = '📉';
            text = `${movement}`;
        } else {
            badgeClass += 'neutral';
            icon = '➡️';
            text = '0';
        }

        return `<span class="${badgeClass}">${icon} ${text}</span>`;
    }

    function calculateStockValue(product, quantity = null) {
        const stock = quantity !== null ? quantity : product.stock;
        return stock * (product.purchase_price || 0);
    }

    function showLoadingSkeleton() {
        tableBody.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-lg loading-skeleton"></div>
                        </div>
                        <div class="ml-4 space-y-2">
                            <div class="h-4 w-32 loading-skeleton rounded"></div>
                            <div class="h-3 w-24 loading-skeleton rounded"></div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4"><div class="h-6 w-16 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-4 w-12 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-8 w-20 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-6 w-16 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-4 w-20 loading-skeleton rounded"></div></td>
            `;
            tableBody.appendChild(tr);
        }
    }

    // --- Logique de la page ---
    async function loadProducts() {
        try {
            showLoadingSkeleton();
            allProducts = await window.api.products.getAll();
            filteredProducts = [...allProducts];
            applyCurrentFilter();
            updateStatistics();
        } catch (error) {
            console.error('Erreur lors du chargement des produits:', error);
            showNotification('Erreur lors du chargement des produits', 'error');
        }
    }

    function applyCurrentFilter() {
        // Filtrer les produits selon le filtre actuel
        switch (currentFilter) {
            case 'inStock':
                filteredProducts = allProducts.filter(p => getStockStatus(p) === 'in-stock');
                break;
            case 'alert':
                filteredProducts = allProducts.filter(p => getStockStatus(p) === 'alert');
                break;
            case 'outOfStock':
                filteredProducts = allProducts.filter(p => getStockStatus(p) === 'out-of-stock');
                break;
            default:
                filteredProducts = [...allProducts];
        }

        renderTable(filteredProducts);
    }

    function renderTable(products) {
        tableBody.innerHTML = '';

        if (products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-500 dark:text-gray-400">Aucun produit trouvé</td></tr>`;
            return;
        }

        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.dataset.productId = p.id;
            tr.dataset.oldQuantity = p.stock;
            tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200';

            // Vérifier si le produit a été modifié
            const isChanged = changedProductsMap.has(p.id);
            if (isChanged) {
                tr.classList.add('row-changed');
            }

            // Calculer la valeur du stock actuel
            const currentValue = calculateStockValue(p);

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center min-w-0">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                ${p.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div class="ml-4 product-info-container-stock">
                            <div class="text-sm font-medium text-gray-900 dark:text-white product-name-truncate-stock" title="${p.name}">${p.name}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 product-name-truncate-stock" title="${p.category || 'Sans catégorie'}">${p.category || 'Sans catégorie'}</div>
                        </div>
                        ${isChanged ? '<div class="change-indicator"></div>' : ''}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex flex-col gap-1">
                        <span class="text-lg font-bold text-gray-900 dark:text-white">${p.stock}</span>
                        ${getStatusBadge(p)}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="relative">
                        <input type="number"
                               class="threshold-input w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-center font-semibold ${isChanged ? 'changed' : ''}"
                               value="${p.alert_threshold || 0}"
                               min="0"
                               data-original="${p.alert_threshold || 0}">
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="relative">
                        <input type="number"
                               class="stock-input w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-center font-semibold new-quantity-input ${isChanged ? 'changed' : ''}"
                               placeholder="${p.stock}"
                               min="0"
                               data-original="${p.stock}">
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div id="movement-${p.id}">
                        ${getMovementBadge(p.stock, '')}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="text-sm font-semibold text-gray-900 dark:text-white">
                        <span id="value-${p.id}">${currentValue.toFixed(2)}</span>
                        <span class="text-gray-500 ml-1">MAD</span>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function updateStatistics() {
        // Mettre à jour le nombre total de produits
        if (totalProducts) totalProducts.textContent = allProducts.length;

        // Calculer les statistiques de stock
        const inStock = allProducts.filter(p => getStockStatus(p) === 'in-stock').length;
        const alert = allProducts.filter(p => getStockStatus(p) === 'alert').length;
        const outOfStock = allProducts.filter(p => getStockStatus(p) === 'out-of-stock').length;

        if (inStockProducts) inStockProducts.textContent = inStock;
        if (alertProducts) alertProducts.textContent = alert;
        if (outOfStockProducts) outOfStockProducts.textContent = outOfStock;

        // Calculer la valeur totale du stock
        const totalValue = allProducts.reduce((sum, p) => sum + calculateStockValue(p), 0);
        if (totalStockValue) totalStockValue.textContent = `${totalValue.toFixed(2)} MAD`;

        // Mettre à jour le nombre de produits modifiés
        if (changedProducts) changedProducts.textContent = changedProductsMap.size;

        // Activer/désactiver le bouton de sauvegarde
        if (saveBtn) {
            saveBtn.disabled = changedProductsMap.size === 0;
        }
    }

    function setActiveFilter(filterType) {
        currentFilter = filterType;

        // Mettre à jour les styles des boutons
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));

        switch (filterType) {
            case 'all':
                if (filterAll) filterAll.classList.add('active');
                break;
            case 'inStock':
                if (filterInStock) filterInStock.classList.add('active');
                break;
            case 'alert':
                if (filterAlert) filterAlert.classList.add('active');
                break;
            case 'outOfStock':
                if (filterOutOfStock) filterOutOfStock.classList.add('active');
                break;
        }

        applyCurrentFilter();
    }

    function applyBulkAdjustment() {
        const adjustmentType = bulkAdjustmentType.value;
        const adjustmentValue = parseInt(bulkAdjustmentValue.value);

        if (isNaN(adjustmentValue) || adjustmentValue < 0) {
            showNotification('Veuillez entrer une valeur d\'ajustement valide', 'error');
            return;
        }

        let affectedCount = 0;
        filteredProducts.forEach(product => {
            const currentStock = product.stock;
            let newStock;

            switch (adjustmentType) {
                case 'add':
                    newStock = currentStock + adjustmentValue;
                    break;
                case 'subtract':
                    newStock = Math.max(0, currentStock - adjustmentValue);
                    break;
                case 'set':
                    newStock = adjustmentValue;
                    break;
                default:
                    return;
            }

            // Stocker les valeurs originales si pas déjà fait
            if (!originalValues.has(product.id)) {
                originalValues.set(product.id, {
                    stock: product.stock,
                    alert_threshold: product.alert_threshold
                });
            }

            // Mettre à jour le stock
            product.stock = newStock;

            // Marquer comme modifié
            changedProductsMap.set(product.id, product);
            affectedCount++;
        });

        renderTable(filteredProducts);
        updateStatistics();

        const typeText = adjustmentType === 'add' ? 'ajouté' :
                        adjustmentType === 'subtract' ? 'retiré' : 'défini à';
        showNotification(`${adjustmentValue} ${typeText} pour ${affectedCount} produits`, 'success');
    }

    function applyBulkThreshold() {
        const thresholdValue = parseInt(bulkThresholdValue.value);

        if (isNaN(thresholdValue) || thresholdValue < 0) {
            showNotification('Veuillez entrer une valeur de seuil valide', 'error');
            return;
        }

        let affectedCount = 0;
        filteredProducts.forEach(product => {
            // Stocker les valeurs originales si pas déjà fait
            if (!originalValues.has(product.id)) {
                originalValues.set(product.id, {
                    stock: product.stock,
                    alert_threshold: product.alert_threshold
                });
            }

            // Mettre à jour le seuil
            product.alert_threshold = thresholdValue;

            // Marquer comme modifié
            changedProductsMap.set(product.id, product);
            affectedCount++;
        });

        renderTable(filteredProducts);
        updateStatistics();
        showNotification(`Seuil de ${thresholdValue} appliqué à ${affectedCount} produits`, 'success');
    }

    function resetChanges() {
        if (changedProductsMap.size === 0) {
            showNotification('Aucune modification à réinitialiser', 'info');
            return;
        }

        // Restaurer les valeurs originales
        changedProductsMap.forEach((product, productId) => {
            const original = originalValues.get(productId);
            if (original) {
                const currentProduct = allProducts.find(p => p.id === productId);
                if (currentProduct) {
                    currentProduct.stock = original.stock;
                    currentProduct.alert_threshold = original.alert_threshold;
                }
            }
        });

        // Vider les modifications
        changedProductsMap.clear();
        originalValues.clear();

        applyCurrentFilter();
        updateStatistics();
        showNotification('Toutes les modifications ont été réinitialisées', 'success');
    }

    // Fonction debounce pour la recherche
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    const debouncedSearch = debounce((searchTerm) => {
        const filtered = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        renderTable(filtered);
    }, 300);

    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    saveBtn.addEventListener('click', async () => {
        const reason = reasonInput.value;
        if (!reason) {
            alert(t('reason_required_alert')); // Texte traduit
            reasonInput.focus();
            return;
        }

        // Utiliser la nouvelle logique avec changedProductsMap
        if (changedProductsMap.size === 0) {
            showNotification(t('no_stock_changes_alert'), 'info'); // Texte traduit
            return;
        }

        const adjustments = [];
        const thresholdUpdates = [];

        changedProductsMap.forEach((product, productId) => {
            const original = originalValues.get(productId);
            if (original) {
                // Vérifier les changements de stock
                if (product.stock !== original.stock) {
                    adjustments.push({
                        productId: productId,
                        oldQuantity: original.stock,
                        newQuantity: product.stock
                    });
                }

                // Vérifier les changements de seuil
                if (product.alert_threshold !== original.alert_threshold) {
                    thresholdUpdates.push({
                        productId: productId,
                        oldThreshold: original.alert_threshold,
                        newThreshold: product.alert_threshold
                    });
                }
            }
        });

        const totalChanges = adjustments.length + thresholdUpdates.length;
        const confirmMessage = `Confirmer ${totalChanges} modification(s) : ${adjustments.length} stock, ${thresholdUpdates.length} seuils ?`;

        const confirmed = await showConfirmation(confirmMessage);
        if (confirmed) {
            try {
                // Sauvegarder les ajustements de stock
                if (adjustments.length > 0) {
                    await window.api.products.adjustStock({ adjustments, reason });
                }

                // Sauvegarder les modifications de seuils
                if (thresholdUpdates.length > 0) {
                    for (const update of thresholdUpdates) {
                        await window.api.products.updateThreshold(update.productId, update.newThreshold);
                    }
                }

                showNotification(`${totalChanges} modification(s) sauvegardée(s) avec succès`, 'success');

                // Réinitialiser l'interface
                reasonInput.value = '';
                searchInput.value = '';
                changedProductsMap.clear();
                originalValues.clear();

                loadProducts();
                if (window.updateStockAlertBadge) window.updateStockAlertBadge();
            } catch (error) {
                showNotification('Erreur lors de la sauvegarde', 'error');
                console.error(error);
            }
        }
    });

    // Nouveau event listener pour les modifications de stock et seuils avec fonctionnalités avancées
    tableBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('new-quantity-input')) {
            const row = e.target.closest('tr');
            const productId = parseInt(row.dataset.productId);
            const product = allProducts.find(p => p.id === productId);
            const oldQuantity = parseInt(row.dataset.oldQuantity);
            const newQuantity = parseInt(e.target.value);

            if (!isNaN(newQuantity) && newQuantity !== oldQuantity) {
                // Stocker les valeurs originales si pas déjà fait
                if (!originalValues.has(productId)) {
                    originalValues.set(productId, {
                        stock: product.stock,
                        alert_threshold: product.alert_threshold
                    });
                }

                // Mettre à jour le produit
                product.stock = newQuantity;
                changedProductsMap.set(productId, product);

                // Mettre à jour l'affichage
                row.classList.add('row-changed');
                e.target.classList.add('changed');

                // Mettre à jour le mouvement et la valeur
                const movementCell = document.getElementById(`movement-${productId}`);
                const valueCell = document.getElementById(`value-${productId}`);

                if (movementCell) {
                    movementCell.innerHTML = getMovementBadge(oldQuantity, newQuantity);
                }

                if (valueCell) {
                    const newValue = calculateStockValue(product, newQuantity);
                    valueCell.textContent = newValue.toFixed(2);
                }

            } else if (newQuantity === oldQuantity || e.target.value === '') {
                // Restaurer les valeurs originales
                const original = originalValues.get(productId);
                if (original) {
                    product.stock = original.stock;
                    product.alert_threshold = original.alert_threshold;
                }

                // Retirer des modifications
                changedProductsMap.delete(productId);
                originalValues.delete(productId);

                // Mettre à jour l'affichage
                row.classList.remove('row-changed');
                e.target.classList.remove('changed');

                // Réinitialiser le mouvement et la valeur
                const movementCell = document.getElementById(`movement-${productId}`);
                const valueCell = document.getElementById(`value-${productId}`);

                if (movementCell) {
                    movementCell.innerHTML = '';
                }

                if (valueCell) {
                    const originalValue = calculateStockValue(product, oldQuantity);
                    valueCell.textContent = originalValue.toFixed(2);
                }
            }

            updateStatistics();
        }

        // Gestion des modifications de seuil d'alerte
        else if (e.target.classList.contains('threshold-input')) {
            const row = e.target.closest('tr');
            const productId = parseInt(row.dataset.productId);
            const product = allProducts.find(p => p.id === productId);
            const oldThreshold = parseInt(e.target.dataset.original);
            const newThreshold = parseInt(e.target.value);

            if (!isNaN(newThreshold) && newThreshold !== oldThreshold) {
                // Stocker les valeurs originales si pas déjà fait
                if (!originalValues.has(productId)) {
                    originalValues.set(productId, {
                        stock: product.stock,
                        alert_threshold: product.alert_threshold
                    });
                }

                // Mettre à jour le seuil
                product.alert_threshold = newThreshold;
                changedProductsMap.set(productId, product);

                // Mettre à jour l'affichage
                row.classList.add('row-changed');
                e.target.classList.add('changed');

                // Mettre à jour le badge de statut si nécessaire
                const statusCell = row.querySelector('td:nth-child(2) .status-badge').parentElement;
                statusCell.innerHTML = `
                    <div class="flex flex-col gap-1">
                        <span class="text-lg font-bold text-gray-900 dark:text-white">${product.stock}</span>
                        ${getStatusBadge(product)}
                    </div>
                `;

            } else if (newThreshold === oldThreshold || e.target.value === '') {
                // Restaurer les valeurs originales
                const original = originalValues.get(productId);
                if (original) {
                    product.stock = original.stock;
                    product.alert_threshold = original.alert_threshold;
                }

                // Retirer des modifications si aucun autre changement
                const stockInput = row.querySelector('.new-quantity-input');
                const stockChanged = stockInput.value !== '' && parseInt(stockInput.value) !== parseInt(row.dataset.oldQuantity);

                if (!stockChanged) {
                    changedProductsMap.delete(productId);
                    originalValues.delete(productId);
                    row.classList.remove('row-changed');
                    e.target.classList.remove('changed');
                }
            }

            updateStatistics();
        }
    });

    // Event listeners pour les filtres
    if (filterAll) filterAll.addEventListener('click', () => setActiveFilter('all'));
    if (filterInStock) filterInStock.addEventListener('click', () => setActiveFilter('inStock'));
    if (filterAlert) filterAlert.addEventListener('click', () => setActiveFilter('alert'));
    if (filterOutOfStock) filterOutOfStock.addEventListener('click', () => setActiveFilter('outOfStock'));

    // Event listeners pour les outils d'ajustement en masse
    if (applyBulkAdjustmentBtn) {
        applyBulkAdjustmentBtn.addEventListener('click', applyBulkAdjustment);
    }

    if (applyBulkThresholdBtn) {
        applyBulkThresholdBtn.addEventListener('click', applyBulkThreshold);
    }

    // Event listener pour le bouton de réinitialisation
    if (resetBtn) {
        resetBtn.addEventListener('click', resetChanges);
    }

    // --- Initialisation de la Page (votre code stable) ---
    async function initPage() {
        if(typeof initializePage === 'function') {
           await initializePage('stock-adjustment'); 
        }
        
        const user = await window.api.session.getCurrentUser();
        if (!user || user.role !== 'Propriétaire') {
            document.body.innerHTML = `<div class="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><h1 class='text-red-500 text-2xl font-bold'>${t('owner_only_access')}</h1></div>`; // Texte traduit
            return;
        }
        loadProducts();
    }

    initPage();
});