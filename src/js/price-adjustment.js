document.addEventListener('DOMContentLoaded', async () => {
    // --- Initialisation de la traduction ---
    await window.i18n.loadTranslations();
    window.i18n.applyTranslationsToHTML();
    const t = window.i18n.t;

    // --- Vérification des API ---
    if (!window.api || !window.api.products || !window.api.session) {
        document.body.innerHTML = "<h1>ERREUR: API manquante.</h1>";
        return;
    }

    // --- Éléments du DOM ---
    const tableBody = document.getElementById('priceAdjustmentTableBody');
    const searchInput = document.getElementById('searchInput');
    const saveBtn = document.getElementById('saveChangesBtn');
    const resetBtn = document.getElementById('resetChangesBtn');

    // Nouveaux éléments pour les statistiques
    const totalProducts = document.getElementById('totalProducts');
    const changedProductsCount = document.getElementById('changedProducts');
    const averageMargin = document.getElementById('averageMargin');

    // Éléments pour les outils d'ajustement en masse
    const marginTypeFilter = document.getElementById('marginTypeFilter');
    const bulkAdjustmentType = document.getElementById('bulkAdjustmentType');
    const bulkAdjustmentValue = document.getElementById('bulkAdjustmentValue');
    const applyBulkAdjustmentBtn = document.getElementById('applyBulkAdjustmentBtn');

    let allProducts = [];
    let filteredProducts = [];
    let changedProducts = new Map();
    let originalPrices = new Map();
    let currentMarginType = 'retail'; // Type de marge affiché (retail, wholesale, carton)

    // La fonction showNotification est maintenant disponible globalement via notifications.js

    // --- Fonctions utilitaires ---
    function calculateMargin(purchasePrice, salePrice) {
        if (purchasePrice <= 0) return 0;
        return ((salePrice - purchasePrice) / purchasePrice) * 100;
    }

    function calculateMarginForType(product, marginType) {
        const purchasePrice = product.purchase_price;
        let salePrice;

        switch (marginType) {
            case 'wholesale':
                salePrice = product.price_wholesale;
                break;
            case 'carton':
                salePrice = product.price_carton || 0;
                break;
            case 'retail':
            default:
                salePrice = product.price_retail;
                break;
        }

        return calculateMargin(purchasePrice, salePrice);
    }

    function getMarginBadge(margin, marginType) {
        let badgeClass = 'margin-badge ';
        let icon = '';
        let typeLabel = '';

        // Définir l'icône selon la marge
        if (margin >= 50) {
            badgeClass += 'high';
            icon = '📈';
        } else if (margin >= 20) {
            badgeClass += 'medium';
            icon = '📊';
        } else {
            badgeClass += 'low';
            icon = '📉';
        }

        // Définir le label du type
        switch (marginType) {
            case 'wholesale':
                typeLabel = 'G';
                break;
            case 'carton':
                typeLabel = 'C';
                break;
            case 'retail':
            default:
                typeLabel = 'D';
                break;
        }

        return `<span class="${badgeClass}">${icon} ${margin.toFixed(1)}% <small>(${typeLabel})</small></span>`;
    }

    function showLoadingSkeleton() {
        tableBody.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="h-4 w-32 loading-skeleton rounded"></div>
                </td>
                <td class="px-6 py-4"><div class="h-8 w-20 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-8 w-20 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-8 w-20 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-8 w-20 loading-skeleton rounded"></div></td>
                <td class="px-6 py-4"><div class="h-6 w-16 loading-skeleton rounded"></div></td>
            `;
            tableBody.appendChild(tr);
        }
    }

    // --- Fonctions ---
    function renderTable(products) {
        tableBody.innerHTML = '';

        if (products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-500 dark:text-gray-400">Aucun produit trouvé</td></tr>`;
            return;
        }

        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.dataset.productId = p.id;
            tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200';

            // Vérifier si le produit a été modifié
            const isChanged = changedProducts.has(p.id);
            if (isChanged) {
                tr.classList.add('row-changed');
            }

            // Calculer la marge selon le type sélectionné
            const margin = calculateMarginForType(p, currentMarginType);

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center min-w-0">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                ${p.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div class="ml-4 product-info-container-price">
                            <div class="text-sm font-medium text-gray-900 dark:text-white product-name-truncate-price" title="${p.name}">${p.name}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 product-name-truncate-price" title="${p.category || 'Sans catégorie'}">${p.category || 'Sans catégorie'}</div>
                        </div>
                        ${isChanged ? '<div class="change-indicator"></div>' : ''}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="relative">
                        <input type="number" step="0.01" value="${p.purchase_price.toFixed(2)}"
                               class="price-input w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-center font-semibold ${isChanged ? 'changed' : ''}"
                               data-field="purchase_price">
                        <span class="absolute right-2 top-2 text-xs text-gray-400">MAD</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="relative">
                        <input type="number" step="0.01" value="${p.price_retail.toFixed(2)}"
                               class="price-input w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-center font-semibold ${isChanged ? 'changed' : ''}"
                               data-field="price_retail">
                        <span class="absolute right-2 top-2 text-xs text-gray-400">MAD</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="relative">
                        <input type="number" step="0.01" value="${p.price_wholesale.toFixed(2)}"
                               class="price-input w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-center font-semibold ${isChanged ? 'changed' : ''}"
                               data-field="price_wholesale">
                        <span class="absolute right-2 top-2 text-xs text-gray-400">MAD</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="relative">
                        <input type="number" step="0.01" value="${(p.price_carton || 0).toFixed(2)}"
                               class="price-input w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-center font-semibold ${isChanged ? 'changed' : ''}"
                               data-field="price_carton">
                        <span class="absolute right-2 top-2 text-xs text-gray-400">MAD</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    ${getMarginBadge(margin, currentMarginType)}
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function updateStatistics() {
        // Mettre à jour le nombre total de produits
        if (totalProducts) totalProducts.textContent = allProducts.length;

        // Mettre à jour le nombre de produits modifiés
        if (changedProductsCount) changedProductsCount.textContent = changedProducts.size;

        // Calculer la marge moyenne selon le type sélectionné
        if (averageMargin && allProducts.length > 0) {
            const totalMargin = allProducts.reduce((sum, p) => {
                return sum + calculateMarginForType(p, currentMarginType);
            }, 0);
            const avgMargin = totalMargin / allProducts.length;

            // Ajouter le type de marge dans l'affichage
            let typeLabel = '';
            switch (currentMarginType) {
                case 'wholesale':
                    typeLabel = ' (Gros)';
                    break;
                case 'carton':
                    typeLabel = ' (Carton)';
                    break;
                case 'retail':
                default:
                    typeLabel = ' (Détail)';
                    break;
            }

            averageMargin.textContent = `${avgMargin.toFixed(1)}%${typeLabel}`;
        }

        // Activer/désactiver le bouton de sauvegarde
        if (saveBtn) {
            saveBtn.disabled = changedProducts.size === 0;
        }
    }



    function applyBulkAdjustment() {
        const adjustmentValue = parseFloat(bulkAdjustmentValue.value);
        const adjustmentType = bulkAdjustmentType.value;

        if (isNaN(adjustmentValue)) {
            showNotification('Veuillez entrer une valeur d\'ajustement valide', 'error');
            return;
        }

        filteredProducts.forEach(product => {
            // Stocker les prix originaux si pas déjà fait
            if (!originalPrices.has(product.id)) {
                originalPrices.set(product.id, { ...product });
            }

            if (adjustmentType === 'percentage') {
                // Ajustement en pourcentage
                product.price_retail *= (1 + adjustmentValue / 100);
                product.price_wholesale *= (1 + adjustmentValue / 100);
                if (product.price_carton > 0) {
                    product.price_carton *= (1 + adjustmentValue / 100);
                }
            } else {
                // Ajustement fixe
                product.price_retail += adjustmentValue;
                product.price_wholesale += adjustmentValue;
                if (product.price_carton > 0) {
                    product.price_carton += adjustmentValue;
                }
            }

            // Marquer comme modifié
            changedProducts.set(product.id, product);
        });

        renderTable(filteredProducts);
        updateStatistics();
        const typeText = adjustmentType === 'percentage' ? '%' : 'MAD';
        showNotification(`Ajustement de ${adjustmentValue}${typeText} appliqué à ${filteredProducts.length} produits`, 'success');
    }

    function resetChanges() {
        if (changedProducts.size === 0) {
            showNotification('Aucune modification à réinitialiser', 'info');
            return;
        }

        // Restaurer les prix originaux
        changedProducts.forEach((product, productId) => {
            const original = originalPrices.get(productId);
            if (original) {
                const currentProduct = allProducts.find(p => p.id === productId);
                if (currentProduct) {
                    currentProduct.purchase_price = original.purchase_price;
                    currentProduct.price_retail = original.price_retail;
                    currentProduct.price_wholesale = original.price_wholesale;
                    currentProduct.price_carton = original.price_carton;
                }
            }
        });

        // Vider les modifications
        changedProducts.clear();
        originalPrices.clear();

        renderTable(filteredProducts);
        updateStatistics();
        showNotification('Toutes les modifications ont été réinitialisées', 'success');
    }

    async function loadProducts() {
        try {
            showLoadingSkeleton();
            allProducts = await window.api.products.getAll();
            filteredProducts = [...allProducts];
            renderTable(filteredProducts);
            updateStatistics();
        } catch (error) {
            console.error('Erreur lors du chargement des produits:', error);
            showNotification('Erreur lors du chargement des produits', 'error');
        }
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
        filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        renderTable(filteredProducts);
    }, 300);

    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('price-input')) {
            const row = e.target.closest('tr');
            const productId = parseInt(row.dataset.productId);
            const field = e.target.dataset.field;
            const newValue = parseFloat(e.target.value);
            
            if (isNaN(newValue)) return;

            if (!changedProducts.has(productId)) {
                const originalProduct = allProducts.find(p => p.id === productId);
                changedProducts.set(productId, { ...originalProduct });
            }
            
            const changedProduct = changedProducts.get(productId);
            changedProduct[field] = newValue;
            
            row.classList.add('row-changed');

            // Mettre à jour les statistiques
            updateStatistics();

            // Mettre à jour l'affichage de la marge si nécessaire
            if (field === 'price_retail' || field === 'price_wholesale' || field === 'price_carton' || field === 'purchase_price') {
                updateMarginDisplay(row);
            }
        }
    });

    // Fonction pour mettre à jour l'affichage de la marge d'une ligne
    function updateMarginDisplay(row) {
        const productId = parseInt(row.dataset.productId);
        const product = allProducts.find(p => p.id === productId);

        if (product) {
            // Mettre à jour les valeurs du produit avec les valeurs des inputs
            product.purchase_price = parseFloat(row.querySelector('[data-field="purchase_price"]').value);
            product.price_retail = parseFloat(row.querySelector('[data-field="price_retail"]').value);
            product.price_wholesale = parseFloat(row.querySelector('[data-field="price_wholesale"]').value);
            product.price_carton = parseFloat(row.querySelector('[data-field="price_carton"]').value) || 0;

            // Calculer et afficher la nouvelle marge
            const margin = calculateMarginForType(product, currentMarginType);
            const marginCell = row.querySelector('td:last-child');
            marginCell.innerHTML = getMarginBadge(margin, currentMarginType);
        }
    }

    // Event listeners pour les nouveaux boutons
    if (resetBtn) {
        resetBtn.addEventListener('click', resetChanges);
    }

    if (applyBulkAdjustmentBtn) {
        applyBulkAdjustmentBtn.addEventListener('click', applyBulkAdjustment);
    }

    // Event listener pour le filtre de type de marge
    if (marginTypeFilter) {
        marginTypeFilter.addEventListener('change', (e) => {
            currentMarginType = e.target.value;
            renderTable(filteredProducts);
            updateStatistics();
        });
    }

    saveBtn.addEventListener('click', async () => {
        if (changedProducts.size === 0) {
            showNotification(t('no_changes_to_save'), 'warning');
            return;
        }

        try {
            const updatePromises = [];
            for (const product of changedProducts.values()) {
                updatePromises.push(window.api.products.update(product));
            }
            
            await Promise.all(updatePromises);

            showNotification(t('products_updated_success').replace('%s', changedProducts.size), 'success');
            changedProducts.clear();
            loadProducts(); 

        } catch (error) {
            console.error("Erreur lors de la sauvegarde des modifications:", error);
            showNotification(t('error_saving_changes'), 'error');
        }
    });

    async function initPage() {
        if(typeof initializePage === 'function') {
            await initializePage('price-adjustment');
        }
        
        const user = await window.api.session.getCurrentUser();
        if (!user || user.role !== 'Propriétaire') {
            document.body.innerHTML = `<div class="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><h1 class='text-red-500 text-2xl font-bold'>${t('owner_only_access')}</h1></div>`;
            return;
        }
        loadProducts();
    }
    
    initPage();
});