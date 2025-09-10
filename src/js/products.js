// src/js/products.js - MODIFIÉ POUR L'INTERNATIONALISATION

document.addEventListener('DOMContentLoaded', async () => {
    // ================== DÉBUT DES AJOUTS I18N ==================
    // 1. Charger les traductions et les appliquer au HTML
    await window.i18n.loadTranslations();
    window.i18n.applyTranslationsToHTML();
    // On récupère la fonction t() pour l'utiliser plus facilement
    const t = window.i18n.t;
    // =================== FIN DES AJOUTS I18N ===================

    // La fonction showNotification est maintenant disponible globalement via notifications.js

    // Vérification des API nécessaires
    if (!window.api || !window.api.products || !window.api.session || !window.api.dialog) {
        document.body.innerHTML = "<h1>ERREUR: Une API essentielle est manquante.</h1>";
        return;
    }

    // --- Éléments du DOM ---
    const tableBody = document.getElementById('productsTableBody');
    const searchInput = document.getElementById('searchInput');
    const addProductBtn = document.getElementById('addProductBtn');

    // Nouveaux éléments pour les statistiques et filtres
    const totalProducts = document.getElementById('totalProducts');
    const inStockProducts = document.getElementById('inStockProducts');
    const alertProducts = document.getElementById('alertProducts');
    const outOfStockProducts = document.getElementById('outOfStockProducts');
    const filterAll = document.getElementById('filterAll');
    const filterInStock = document.getElementById('filterInStock');
    const filterAlert = document.getElementById('filterAlert');
    const filterOutOfStock = document.getElementById('filterOutOfStock');
    const productModal = document.getElementById('productModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const productForm = document.getElementById('productForm');
    const modalTitle = document.getElementById('modalTitle');
    const chooseImageBtn = document.getElementById('chooseImageBtn');
    const imagePreview = document.getElementById('imagePreview');
    const imagePathInput = document.getElementById('imagePath');
    let tempImageDataBase64 = null;
    const purchasePriceContainer = document.getElementById('purchasePriceContainer');
    const categoryInput = document.getElementById('category');
    const categoryResults = document.getElementById('categoryResults');
    const categoryContainer = document.getElementById('categoryContainer');
    let allCategories = [];

    // Variables pour la gestion des filtres et données
    let allProducts = [];
    let filteredProducts = [];

    // ===== OPTIMISATION PERFORMANCE =====
    // Fonction debounce pour optimiser les recherches
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
    let currentFilter = 'all';
    let currentProductForLots = null;

    // Variables pour le scanner code-barres
    let productBarcodeBuffer = '';
    let productBarcodeTimer = null;
    let productLastKeyTime = 0;
    let productIsScanning = false;

    // --- Fonctions du Scanner Code-Barres pour Produits ---

    /**
     * Nettoie et valide un code-barres avec suppression des préfixes (même fonction que dans caisse.js)
     */
    function cleanAndValidateBarcode(barcode) {
        if (!barcode) return '';

        // Convertir en string et nettoyer les caractères de base
        let cleaned = String(barcode)
            .trim()                           // Supprimer espaces début/fin
            .replace(/[\r\n\t]/g, '')         // Supprimer retours chariot/tabulations
            .toUpperCase();                   // Normaliser en majuscules d'abord

        // Supprimer les préfixes courants AVANT le nettoyage des caractères spéciaux
        const prefixesToRemove = [
            'CODE:', 'BARCODE:', 'BC:', 'ID:', 'PROD:', 'ITEM:', 'SKU:', 'REF:'
        ];

        prefixesToRemove.forEach(prefix => {
            if (cleaned.startsWith(prefix)) {
                cleaned = cleaned.substring(prefix.length);
            }
        });

        // Supprimer les suffixes courants
        const suffixesToRemove = ['END', 'STOP', 'FIN'];
        suffixesToRemove.forEach(suffix => {
            if (cleaned.endsWith(suffix)) {
                cleaned = cleaned.substring(0, cleaned.length - suffix.length);
            }
        });

        // Maintenant nettoyer les caractères spéciaux
        cleaned = cleaned.replace(/[^a-zA-Z0-9\-_]/g, '');

        // Validation de longueur (codes-barres standards: 4-20 caractères)
        if (cleaned.length < 4 || cleaned.length > 20) {
            console.warn('Code-barres longueur invalide:', cleaned.length, 'Code:', cleaned);
            return '';
        }

        return cleaned;
    }

    /**
     * Vérifie si un code-barres existe déjà
     */
    function checkBarcodeExists(barcode) {
        if (!barcode || barcode.trim() === '') return false;

        const cleanBarcode = cleanAndValidateBarcode(barcode);
        if (!cleanBarcode) return false;

        return allProducts.some(product => {
            if (!product.barcode) return false;
            const productBarcode = cleanAndValidateBarcode(product.barcode);
            return productBarcode === cleanBarcode;
        });
    }

    /**
     * Traite l'entrée du code-barres dans le formulaire produit avec nettoyage amélioré
     */
    function processProductBarcodeInput(barcode) {
        if (!barcode || barcode.trim() === '') return;

        const barcodeInput = document.getElementById('barcode');
        const status = document.getElementById('productBarcodeStatus');
        const feedback = document.getElementById('productBarcodeFeedback');
        const message = document.getElementById('productBarcodeMessage');

        try {
            // Mettre à jour le statut
            updateProductBarcodeStatus('scanning');

            // Nettoyer et valider le code-barres
            const cleanedBarcode = cleanAndValidateBarcode(barcode);

            // Log pour diagnostic
            console.log('Code-barres produit reçu:', barcode);
            console.log('Code-barres produit nettoyé:', cleanedBarcode);

            if (!cleanedBarcode) {
                showProductBarcodeFeedback('error', 'Code-barres invalide ou trop court');
                updateProductBarcodeStatus('ready');
                return;
            }

            // Mettre à jour le champ avec le code nettoyé
            if (barcodeInput) barcodeInput.value = cleanedBarcode;

            // Vérifier si le code-barres existe déjà
            if (checkBarcodeExists(cleanedBarcode)) {
                showProductBarcodeFeedback('warning', `${t('barcode_already_exists') || 'Ce code-barres existe déjà'}: ${cleanedBarcode}`);
                barcodeInput.classList.add('barcode-invalid');
            } else {
                // Code-barres valide et unique
                showProductBarcodeFeedback('success', `${t('barcode_valid') || 'Code-barres valide'}: ${cleanedBarcode}`);
                barcodeInput.classList.add('barcode-valid');
            }

            // Remettre le statut à prêt
            setTimeout(() => {
                updateProductBarcodeStatus('ready');
                barcodeInput.classList.remove('barcode-valid', 'barcode-invalid', 'barcode-scanning');
            }, 2000);

        } catch (error) {
            console.error('Erreur lors du traitement du code-barres produit:', error);
            showProductBarcodeFeedback('error', t('barcode_scan_error') || 'Erreur lors du scan');
            updateProductBarcodeStatus('ready');
        }
    }

    /**
     * Met à jour le statut du scanner de produit
     */
    function updateProductBarcodeStatus(status) {
        const statusElement = document.getElementById('productBarcodeStatus');
        if (!statusElement) return;

        const statusDot = statusElement.querySelector('.w-2.h-2');
        const statusText = statusElement.querySelector('span');

        if (statusDot && statusText) {
            switch (status) {
                case 'ready':
                    statusDot.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
                    statusText.textContent = t('scanner_ready') || 'Prêt';
                    break;
                case 'scanning':
                    statusDot.className = 'w-2 h-2 bg-blue-500 rounded-full animate-spin';
                    statusText.textContent = t('scanner_scanning') || 'Scan en cours...';
                    break;
                case 'error':
                    statusDot.className = 'w-2 h-2 bg-red-500 rounded-full';
                    statusText.textContent = 'Erreur';
                    break;
                case 'warning':
                    statusDot.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
                    statusText.textContent = 'Attention';
                    break;
            }
        }
    }

    /**
     * Affiche un feedback du scanner de produit
     */
    function showProductBarcodeFeedback(type, message) {
        const feedback = document.getElementById('productBarcodeFeedback');
        const messageElement = document.getElementById('productBarcodeMessage');

        if (!feedback || !messageElement) return;

        // Définir les couleurs selon le type
        let bgColor, textColor, iconPath;

        switch (type) {
            case 'success':
                bgColor = 'bg-green-100 dark:bg-green-900/30';
                textColor = 'text-green-800 dark:text-green-200';
                iconPath = 'M5 13l4 4L19 7'; // Checkmark
                break;
            case 'warning':
                bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                textColor = 'text-yellow-800 dark:text-yellow-200';
                iconPath = 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'; // Warning
                break;
            case 'error':
                bgColor = 'bg-red-100 dark:bg-red-900/30';
                textColor = 'text-red-800 dark:text-red-200';
                iconPath = 'M6 18L18 6M6 6l12 12'; // X
                break;
            default:
                bgColor = 'bg-blue-100 dark:bg-blue-900/30';
                textColor = 'text-blue-800 dark:text-blue-200';
                iconPath = 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Info
        }

        // Mettre à jour le contenu
        feedback.className = `mt-1 text-sm ${bgColor} ${textColor} rounded-lg`;
        feedback.innerHTML = `
            <div class="flex items-center gap-2 p-2">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
                </svg>
                <span>${message}</span>
            </div>
        `;

        // Afficher le feedback
        feedback.classList.remove('hidden');

        // Masquer après 3 secondes
        setTimeout(() => {
            if (feedback) {
                feedback.classList.add('hidden');
            }
        }, 3000);
    }

    function showLoadingSkeleton() {
        tableBody.innerHTML = '';
        for (let i = 0; i < 5; i++) {
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
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="h-4 w-20 loading-skeleton rounded"></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="h-4 w-16 loading-skeleton rounded"></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="h-4 w-16 loading-skeleton rounded"></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="h-6 w-20 loading-skeleton rounded"></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex items-center justify-end gap-2">
                        <div class="h-8 w-16 loading-skeleton rounded"></div>
                        <div class="h-8 w-16 loading-skeleton rounded"></div>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        }
    }

    // ===== OPTIMISATION: Pagination et chargement optimisé =====
    const ITEMS_PER_PAGE = 100; // Limiter à 100 produits par page
    let currentPage = 1;
    let totalPages = 1;

    async function loadProducts(searchTerm = '') {
        try {
            showLoadingSkeleton();

            // Optimisation: Limiter les résultats pour améliorer les performances
            const allProductsData = await window.api.products.getAll(searchTerm);

            // Si plus de 1000 produits, afficher un avertissement
            if (allProductsData.length > 1000) {
                console.warn(`⚠️ ${allProductsData.length} produits chargés. Considérez utiliser des filtres pour améliorer les performances.`);
            }

            allProducts = allProductsData;
            applyCurrentFilter();

        } catch (error) {
            console.error(t('error_loading_products'), error);
            showNotification(t('error_loading_products'), 'error');
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-500">${t('error_loading_products')}</td></tr>`;
        }
    }

    function applyCurrentFilter() {
        // Filtrer les produits selon le filtre actuel
        switch (currentFilter) {
            case 'inStock':
                filteredProducts = allProducts.filter(p => p.stock > 0 && (p.alert_threshold === 0 || p.stock > p.alert_threshold));
                break;
            case 'alert':
                filteredProducts = allProducts.filter(p => p.alert_threshold > 0 && p.stock <= p.alert_threshold && p.stock > 0);
                break;
            case 'outOfStock':
                filteredProducts = allProducts.filter(p => p.stock <= 0);
                break;
            default:
                filteredProducts = [...allProducts];
        }

        renderProducts();
        updateStatistics();
    }

    function renderProducts() {
        tableBody.innerHTML = '';

        if (filteredProducts.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-500 dark:text-gray-400">${t('no_product_found')}</td></tr>`;
            return;
        }

        // ===== OPTIMISATION: Pagination pour améliorer les performances =====
        totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length);
        const pageProducts = filteredProducts.slice(startIndex, endIndex);

        // Afficher un indicateur si beaucoup de produits
        if (filteredProducts.length > ITEMS_PER_PAGE) {
            const infoRow = document.createElement('tr');
            infoRow.innerHTML = `
                <td colspan="6" class="text-center py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
                    📊 Affichage de ${startIndex + 1}-${endIndex} sur ${filteredProducts.length} produits
                    (Page ${currentPage}/${totalPages})
                </td>
            `;
            tableBody.appendChild(infoRow);
        }

        pageProducts.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200';

            // Déterminer le statut du stock
            let stockStatus = 'in-stock';
            let stockBadge = '';
            let stockIcon = '🟢';

            if (p.stock <= 0) {
                stockStatus = 'out-of-stock';
                stockIcon = '🔴';
                stockBadge = `<span class="stock-badge out-of-stock">${stockIcon} Rupture</span>`;
            } else if (p.alert_threshold > 0 && p.stock <= p.alert_threshold) {
                stockStatus = 'alert';
                stockIcon = '🟡';
                stockBadge = `<span class="stock-badge alert">${stockIcon} Alerte</span>`;
            } else {
                stockBadge = `<span class="stock-badge in-stock">${stockIcon} En stock</span>`;
            }

            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center min-w-0">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                ${p.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div class="ml-4 product-info-container">
                            <div class="text-sm font-medium text-gray-900 dark:text-white product-name-truncate" title="${p.name}">${p.name}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 product-name-truncate" title="${p.category || 'Sans catégorie'}">${p.category || 'Sans catégorie'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 dark:text-white font-mono product-name-truncate" title="${p.barcode || 'N/A'}">${p.barcode || '<span class="text-gray-400">N/A</span>'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-gray-900 dark:text-white">${p.price_retail.toFixed(2)} <span class="text-gray-500">MAD</span></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-gray-900 dark:text-white">${p.price_wholesale.toFixed(2)} <span class="text-gray-500">MAD</span></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                        <span class="text-lg font-bold text-gray-900 dark:text-white">${p.stock}</span>
                        ${stockBadge}
                        <button class="view-lots-btn text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-2 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                data-product-id="${p.id}"
                                title="Voir les lots détaillés">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                            </svg>
                        </button>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end gap-1">
                        <button class="action-btn edit edit-btn" data-id="${p.id}" title="${t('edit')}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button class="action-btn delete delete-btn" data-id="${p.id}" title="${t('delete')}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);
        });

        // Créer les contrôles de pagination
        createPaginationControls();
    }

    function updateStatistics() {
        const total = allProducts.length;
        const inStock = allProducts.filter(p => p.stock > 0 && (p.alert_threshold === 0 || p.stock > p.alert_threshold)).length;
        const alert = allProducts.filter(p => p.alert_threshold > 0 && p.stock <= p.alert_threshold && p.stock > 0).length;
        const outOfStock = allProducts.filter(p => p.stock <= 0).length;

        if (totalProducts) totalProducts.textContent = total;
        if (inStockProducts) inStockProducts.textContent = inStock;
        if (alertProducts) alertProducts.textContent = alert;
        if (outOfStockProducts) outOfStockProducts.textContent = outOfStock;
    }

    function openModal() {
        productModal.classList.replace('hidden', 'flex');
        // Pas de focus automatique pour éviter les conflits avec les événements clavier
    }
    
    function closeModal() {
        productModal.classList.replace('flex', 'hidden');
        productForm.reset();
        document.getElementById('productId').value = '';
        imagePreview.src = 'assets/placeholder.png';
        imagePathInput.value = '';
        tempImageDataBase64 = null;
        // Pas de focus automatique pour éviter les conflits avec les événements clavier
    }
    
    function renderCategorySuggestions(categories) {
        categoryResults.innerHTML = '';
        if (categories.length === 0) {
            categoryResults.classList.add('hidden');
            return;
        }
        categories.forEach(cat => {
            const itemDiv = document.createElement('div');
            itemDiv.textContent = cat;
            itemDiv.className = 'category-result-item';
            itemDiv.addEventListener('click', () => {
                categoryInput.value = cat;
                categoryResults.classList.add('hidden');
            });
            categoryResults.appendChild(itemDiv);
        });
        categoryResults.classList.remove('hidden');
    }

    categoryInput.addEventListener('focus', () => {
        renderCategorySuggestions(allCategories);
    });

    categoryInput.addEventListener('input', () => {
        const searchTerm = categoryInput.value.toLowerCase();
        const filteredCategories = allCategories.filter(cat => cat.toLowerCase().includes(searchTerm));
        renderCategorySuggestions(filteredCategories);
    });
    
    document.addEventListener('click', (e) => {
        if (!categoryContainer.contains(e.target)) {
            categoryResults.classList.add('hidden');
        }
    });

    addProductBtn.addEventListener('click', () => {
        // On traduit le titre de la modale
        modalTitle.textContent = t('add_product_modal_title');
        openModal();
    });

    cancelBtn.addEventListener('click', closeModal);
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
        loadProducts(searchTerm);
    }, 300);

    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    // --- Fonctions pour les filtres ---
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

    // Event listeners pour les filtres
    if (filterAll) filterAll.addEventListener('click', () => setActiveFilter('all'));
    if (filterInStock) filterInStock.addEventListener('click', () => setActiveFilter('inStock'));
    if (filterAlert) filterAlert.addEventListener('click', () => setActiveFilter('alert'));
    if (filterOutOfStock) filterOutOfStock.addEventListener('click', () => setActiveFilter('outOfStock'));

    chooseImageBtn.addEventListener('click', async () => {
        const dataUrl = await window.api.dialog.openImage();
        if (dataUrl) {
            tempImageDataBase64 = dataUrl;
            imagePreview.src = dataUrl;
        }
    });

    // --- Calcul automatique du prix carton ---
    const calculateCartonPriceBtn = document.getElementById('calculate-carton-price-btn');
    const priceWholesaleInput = document.getElementById('price_wholesale');
    const piecesPerCartonInput = document.getElementById('pieces_per_carton');
    const priceCartonInput = document.getElementById('price_carton');

    function calculateCartonPrice() {
        const priceWholesale = parseFloat(priceWholesaleInput.value) || 0;
        const piecesPerCarton = parseInt(piecesPerCartonInput.value) || 0;

        if (priceWholesale > 0 && piecesPerCarton > 0) {
            const calculatedPrice = priceWholesale * piecesPerCarton;
            priceCartonInput.value = calculatedPrice.toFixed(2);

            // Animation de succès
            priceCartonInput.style.backgroundColor = '#dcfce7'; // Vert clair
            setTimeout(() => {
                priceCartonInput.style.backgroundColor = '';
            }, 1000);

            showNotification(
                `${t('carton_price_calculated')}: ${priceWholesale.toFixed(2)} × ${piecesPerCarton} = ${calculatedPrice.toFixed(2)} DH`,
                'success'
            );
        } else {
            let errorMessage = '';
            if (priceWholesale <= 0 && piecesPerCarton <= 0) {
                errorMessage = t('error_price_wholesale_and_pieces_required');
            } else if (priceWholesale <= 0) {
                errorMessage = t('error_price_wholesale_required');
            } else {
                errorMessage = t('error_pieces_per_carton_required');
            }
            showNotification(errorMessage, 'error');
        }
    }

    // Event listener pour le bouton de calcul
    if (calculateCartonPriceBtn) {
        calculateCartonPriceBtn.addEventListener('click', calculateCartonPrice);
    }

    // Calcul automatique en temps réel (optionnel)
    function autoCalculateCartonPrice() {
        const priceWholesale = parseFloat(priceWholesaleInput.value) || 0;
        const piecesPerCarton = parseInt(piecesPerCartonInput.value) || 0;

        if (priceWholesale > 0 && piecesPerCarton > 0) {
            // Afficher un indicateur visuel que le calcul est possible
            calculateCartonPriceBtn.classList.remove('opacity-50');
            calculateCartonPriceBtn.disabled = false;
            calculateCartonPriceBtn.title = `Calculer: ${priceWholesale.toFixed(2)} × ${piecesPerCarton} = ${(priceWholesale * piecesPerCarton).toFixed(2)} DH`;
        } else {
            calculateCartonPriceBtn.classList.add('opacity-50');
            calculateCartonPriceBtn.disabled = true;
            if (priceWholesale <= 0) {
                calculateCartonPriceBtn.title = 'Veuillez renseigner le prix de gros pour calculer le prix carton';
            } else {
                calculateCartonPriceBtn.title = t('calculate_carton_price_tooltip');
            }
        }
    }

    // Event listeners pour le calcul automatique en temps réel
    if (priceWholesaleInput && piecesPerCartonInput) {
        priceWholesaleInput.addEventListener('input', autoCalculateCartonPrice);
        piecesPerCartonInput.addEventListener('input', autoCalculateCartonPrice);

        // Initialiser l'état du bouton
        autoCalculateCartonPrice();
    }

    // Event listeners pour le scanner code-barres dans le formulaire produit
    const barcodeInput = document.getElementById('barcode');
    if (barcodeInput) {
        // Traitement de l'entrée du code-barres
        barcodeInput.addEventListener('input', (e) => {
            const barcode = e.target.value.trim();
            if (barcode.length >= 6) { // Code-barres minimum 6 caractères pour les produits
                processProductBarcodeInput(barcode);
            }
        });

        // Traitement de la touche Entrée
        barcodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const barcode = e.target.value.trim();
                if (barcode.length > 0) {
                    processProductBarcodeInput(barcode);
                }
            }
        });

        // Détection automatique du scanner (basée sur la vitesse de frappe)
        barcodeInput.addEventListener('keydown', (e) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - productLastKeyTime;
            productLastKeyTime = currentTime;

            // Si l'intervalle entre les touches est très court, c'est probablement un scanner
            if (timeDiff < 50 && timeDiff > 0) {
                productIsScanning = true;
                updateProductBarcodeStatus('scanning');

                // Réinitialiser le timeout
                if (productBarcodeTimer) clearTimeout(productBarcodeTimer);
                productBarcodeTimer = setTimeout(() => {
                    productIsScanning = false;
                    updateProductBarcodeStatus('ready');
                }, 200);
            }
        });

        // Validation en temps réel lors de la perte de focus
        barcodeInput.addEventListener('blur', (e) => {
            const barcode = e.target.value.trim();
            if (barcode.length > 0) {
                processProductBarcodeInput(barcode);
            }
        });

        // Focus automatique sur le champ code-barres quand le modal s'ouvre
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const modal = document.getElementById('productModal');
                    if (modal && !modal.classList.contains('hidden')) {
                        // Modal ouvert, focus sur le code-barres après un délai
                        setTimeout(() => {
                            if (barcodeInput && document.activeElement !== barcodeInput) {
                                barcodeInput.focus();
                            }
                        }, 300);
                    }
                }
            });
        });

        const modal = document.getElementById('productModal');
        if (modal) {
            observer.observe(modal, { attributes: true });
        }
    }

    tableBody.addEventListener('click', async (e) => {
        const editButton = e.target.closest('.edit-btn');
        const deleteButton = e.target.closest('.delete-btn');

        if (editButton) {
            const id = editButton.dataset.id;
            const product = await window.api.products.getById(id);
            if (!product) return;
            
            // On traduit le titre de la modale
            modalTitle.textContent = t('edit_product_modal_title');
            document.getElementById('productId').value = product.id;
            document.getElementById('name').value = product.name;
            document.getElementById('barcode').value = product.barcode;
            document.getElementById('purchase_price').value = product.purchase_price;
            document.getElementById('price_retail').value = product.price_retail;
            document.getElementById('price_wholesale').value = product.price_wholesale;
            document.getElementById('stock').value = product.stock;
            document.getElementById('alert_threshold').value = product.alert_threshold;
            document.getElementById('category').value = product.category;
            document.getElementById('price_carton').value = product.price_carton;
            document.getElementById('pieces_per_carton').value = product.pieces_per_carton;
            imagePathInput.value = product.image_path || '';
            tempImageDataBase64 = null; 
            imagePreview.src = product.image_path || 'assets/placeholder.png';
            
            openModal();
        }

        if (deleteButton) {
            const id = deleteButton.dataset.id;
            // On traduit le message de confirmation
            const confirmed = await showConfirmation(t('confirm_delete_product'));
            if (confirmed) {
                try {
                    await window.api.products.delete(id);
                    loadProducts(searchInput.value); 
                    if (window.updateStockAlertBadge) window.updateStockAlertBadge();
                } catch (error) {
                    showNotification(t('delete_failed') + ': ' + error.message, 'error');
                }
            }
        }
    });

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('productId').value;
        const productData = {
            name: document.getElementById('name').value,
            barcode: document.getElementById('barcode').value,
            purchase_price: parseFloat(document.getElementById('purchase_price').value) || 0,
            price_retail: parseFloat(document.getElementById('price_retail').value),
            price_wholesale: parseFloat(document.getElementById('price_wholesale').value) || 0,
            stock: parseInt(document.getElementById('stock').value),
            alert_threshold: parseInt(document.getElementById('alert_threshold').value),
            category: document.getElementById('category').value,
            image_path: tempImageDataBase64 || imagePathInput.value,
            price_carton: parseFloat(document.getElementById('price_carton').value) || 0,
            pieces_per_carton: parseInt(document.getElementById('pieces_per_carton').value) || 0,
        };

        if (!productData.name || isNaN(productData.price_retail)) {
            showNotification(t('error_name_price_required'), 'error');
            return;
        }

        try {
            if (id) {
                // Modification d'un produit existant
                const productId = parseInt(id);
                const oldProduct = await window.api.products.getById(productId);
                const oldStock = oldProduct ? oldProduct.stock : 0;
                const newStock = productData.stock;

                // Mettre à jour le produit avec l'ancien stock d'abord
                productData.id = productId;
                productData.stock = oldStock; // Garder l'ancien stock temporairement
                await window.api.products.update(productData);

                // Si le stock a changé, utiliser l'intégration transparente
                if (oldStock !== newStock) {
                    await window.api.stockLots.adjustStockDirectly(productId, newStock);
                    console.log(`📦 Stock ajusté de ${oldStock} à ${newStock} via intégration transparente`);
                }
            } else {
                // Création d'un nouveau produit
                const result = await window.api.products.add(productData);

                // S'assurer que le nouveau produit a des lots si nécessaire
                if (result.id && productData.stock > 0) {
                    await window.api.stockLots.ensureProductHasLots(result.id);
                }
            }

            closeModal();
            loadProducts(searchInput.value);
            allCategories = await window.api.products.getCategories();
            if(window.updateStockAlertBadge) window.updateStockAlertBadge();

        } catch (error) {
            console.error(t('error_saving_product'), error);
            if (error.message.includes('UNIQUE constraint failed: products.barcode')) {
                showNotification(t('error_barcode_unique'), 'error');
            } else {
                showNotification(t('operation_failed') + ': ' + error.message, 'error');
            }
        }
    });

    // ===== FONCTIONS DE PAGINATION =====
    function createPaginationControls() {
        const tableContainer = document.querySelector('.table-container');
        if (!tableContainer) return;

        // Supprimer les contrôles existants
        const existingControls = document.querySelector('.pagination-controls');
        if (existingControls) existingControls.remove();

        if (totalPages <= 1) return; // Pas besoin de pagination

        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination-controls flex justify-center items-center gap-2 mt-4 p-4';

        // Bouton Précédent
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '← Précédent';
        prevBtn.className = `px-3 py-1 rounded text-sm ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`;
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderProducts();
                createPaginationControls();
            }
        };

        // Info page
        const pageInfo = document.createElement('span');
        pageInfo.className = 'px-3 py-1 text-sm text-gray-600 dark:text-gray-300';
        pageInfo.textContent = `Page ${currentPage} sur ${totalPages}`;

        // Bouton Suivant
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = 'Suivant →';
        nextBtn.className = `px-3 py-1 rounded text-sm ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`;
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderProducts();
                createPaginationControls();
            }
        };

        paginationDiv.appendChild(prevBtn);
        paginationDiv.appendChild(pageInfo);
        paginationDiv.appendChild(nextBtn);

        tableContainer.parentNode.insertBefore(paginationDiv, tableContainer.nextSibling);
    }

    async function initPage() {
        // La traduction est déjà chargée en haut du script
        await initializePage('products');

        const user = await window.api.session.getCurrentUser();
        if (user.role !== 'Propriétaire') {
            if (purchasePriceContainer) {
                purchasePriceContainer.style.display = 'none';
            }
        }

        try {
            allCategories = await window.api.products.getCategories();
        } catch (error) {
            console.error("Erreur lors du chargement des catégories:", error);
        }

        loadProducts();
    }

    // Fonction pour gérer le scroll horizontal du tableau
    function setupResponsiveTable() {
        const tableContainer = document.querySelector('.table-container');

        if (!tableContainer) return;

        // Fonction pour gérer le scroll et les indicateurs
        function handleTableScroll() {
            const scrollLeft = tableContainer.scrollLeft;
            const scrollWidth = tableContainer.scrollWidth;
            const clientWidth = tableContainer.clientWidth;

            // Si on peut scroller (contenu plus large que le container)
            if (scrollWidth > clientWidth) {
                // Ajouter une classe pour indiquer qu'on peut scroller
                tableContainer.classList.add('scrollable');

                // Gérer les indicateurs de début/fin de scroll
                if (scrollLeft === 0) {
                    tableContainer.classList.add('scroll-start');
                    tableContainer.classList.remove('scroll-end');
                } else if (scrollLeft >= scrollWidth - clientWidth - 1) {
                    tableContainer.classList.add('scroll-end');
                    tableContainer.classList.remove('scroll-start');
                } else {
                    tableContainer.classList.remove('scroll-start', 'scroll-end');
                }
            } else {
                tableContainer.classList.remove('scrollable', 'scroll-start', 'scroll-end');
            }
        }

        // Écouter les événements de scroll
        tableContainer.addEventListener('scroll', handleTableScroll);

        // Écouter le redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            setTimeout(handleTableScroll, 100);
        });

        // Initialiser
        setTimeout(handleTableScroll, 100);

        // Ajouter un indicateur visuel pour le scroll sur mobile
        if (window.innerWidth <= 1024) {
            tableContainer.style.position = 'relative';

            // Ajouter des ombres pour indiquer le scroll possible
            const style = document.createElement('style');
            style.textContent = `
                .table-container.scrollable {
                    background:
                        linear-gradient(90deg, white 30%, transparent),
                        linear-gradient(90deg, transparent, white 70%),
                        linear-gradient(90deg, rgba(0,0,0,0.1), transparent 20%),
                        linear-gradient(270deg, rgba(0,0,0,0.1), transparent 20%);
                    background-repeat: no-repeat;
                    background-size: 40px 100%, 40px 100%, 20px 100%, 20px 100%;
                    background-position: left, right, left, right;
                    background-attachment: local, local, scroll, scroll;
                }

                .table-container.scroll-start {
                    background:
                        linear-gradient(90deg, transparent, white 70%),
                        linear-gradient(270deg, rgba(0,0,0,0.1), transparent 20%);
                    background-repeat: no-repeat;
                    background-size: 40px 100%, 20px 100%;
                    background-position: right, right;
                    background-attachment: local, scroll;
                }

                .table-container.scroll-end {
                    background:
                        linear-gradient(90deg, white 30%, transparent),
                        linear-gradient(90deg, rgba(0,0,0,0.1), transparent 20%);
                    background-repeat: no-repeat;
                    background-size: 40px 100%, 20px 100%;
                    background-position: left, left;
                    background-attachment: local, scroll;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Initialiser le responsive après le chargement
    setTimeout(setupResponsiveTable, 100);

    // ===== GESTION DES LOTS =====

    // Gestionnaire pour le bouton de visualisation des lots
    document.addEventListener('click', function(e) {
        if (e.target.closest('.view-lots-btn')) {
            const productId = parseInt(e.target.closest('.view-lots-btn').dataset.productId);
            openLotsModal(productId);
        }
    });

    // Gestionnaires pour le modal des lots
    const lotsModal = document.getElementById('lotsModal');
    const closeLotsModal = document.getElementById('closeLotsModal');

    if (closeLotsModal) {
        closeLotsModal.addEventListener('click', () => {
            lotsModal.classList.add('hidden');
            currentProductForLots = null;
        });
    }

    // Gestionnaire pour les onglets du modal des lots
    document.addEventListener('click', function(e) {
        if (e.target.closest('.tab-btn')) {
            const tabBtn = e.target.closest('.tab-btn');
            const tabName = tabBtn.dataset.tab;
            switchLotsTab(tabName);
        }
    });

    // Gestionnaire pour le formulaire de création de lot
    const createLotForm = document.getElementById('createLotForm');
    if (createLotForm) {
        createLotForm.addEventListener('submit', handleCreateLot);
    }

    // Fermer le modal en cliquant à l'extérieur
    if (lotsModal) {
        lotsModal.addEventListener('click', (e) => {
            if (e.target === lotsModal) {
                lotsModal.classList.add('hidden');
                currentProductForLots = null;
            }
        });
    }

    // Migration automatique de tous les produits au démarrage
    ensureAllProductsHaveLots();

    initPage();

    // ===== FONCTIONS DE GESTION DES LOTS =====

    /**
     * Ouvrir le modal de gestion des lots pour un produit
     */
    async function openLotsModal(productId) {
        try {
            currentProductForLots = allProducts.find(p => p.id === productId);
            if (!currentProductForLots) {
                showNotification('Produit non trouvé', 'error');
                return;
            }

            // Mettre à jour le titre du modal
            document.getElementById('lotsModalSubtitle').textContent = currentProductForLots.name;

            // Afficher le modal
            document.getElementById('lotsModal').classList.remove('hidden');

            // Initialiser le gestionnaire de filtres si pas encore fait
            if (!window.lotFiltersManager) {
                window.lotFiltersManager = new LotFiltersManager();

                // Configurer le callback de changement de filtres
                window.lotFiltersManager.setOnFiltersChange((preferences) => {
                    loadLotsData(productId, preferences);
                });
            }

            // Charger les fournisseurs pour le formulaire de création
            await loadSuppliersForLotForm();

            // Charger les données avec les préférences actuelles
            await loadLotsData(productId, window.lotFiltersManager.getPreferences());

            // Activer l'onglet des lots par défaut
            switchLotsTab('lots');

        } catch (error) {
            console.error('Erreur lors de l\'ouverture du modal des lots:', error);
            showNotification('Erreur lors du chargement des lots', 'error');
        }
    }

    /**
     * Charger les fournisseurs pour le formulaire de création de lot
     */
    async function loadSuppliersForLotForm() {
        try {
            const suppliers = await window.api.suppliers.getAll({ status: 'ACTIVE' });

            // Initialiser l'autocomplétion pour le formulaire de lot
            initLotSupplierAutocomplete(suppliers);

            // Définir la date d'achat par défaut à aujourd'hui
            const purchaseDateInput = document.getElementById('newLotPurchaseDate');
            if (purchaseDateInput && !purchaseDateInput.value) {
                purchaseDateInput.value = new Date().toISOString().slice(0, 10);
            }

        } catch (error) {
            console.error('Erreur lors du chargement des fournisseurs:', error);
            // Ne pas afficher d'erreur à l'utilisateur car ce n'est pas critique
        }
    }

    /**
     * Initialiser l'autocomplétion pour le fournisseur du lot
     */
    function initLotSupplierAutocomplete(suppliers) {
        const searchInput = document.getElementById('newLotSupplierSearch');
        const hiddenInput = document.getElementById('newLotSupplier');
        const dropdown = document.getElementById('newLotSupplierDropdown');
        const dropdownBtn = document.getElementById('newLotSupplierDropdownBtn');

        if (!searchInput || !hiddenInput || !dropdown || !dropdownBtn) {
            console.warn('Éléments d\'autocomplétion fournisseur lot non trouvés');
            return;
        }

        let selectedSupplier = null;

        // Fonction pour afficher les suggestions
        function showLotSupplierSuggestions(filteredSuppliers, query = '') {
            dropdown.innerHTML = '';

            // Ajouter l'option "Aucun fournisseur"
            const noneOption = document.createElement('div');
            noneOption.className = 'p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600';
            noneOption.innerHTML = `
                <div class="font-medium text-gray-600 dark:text-gray-400">Aucun fournisseur</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Lot sans fournisseur associé</div>
            `;
            noneOption.addEventListener('click', () => {
                selectLotSupplier(null);
            });
            dropdown.appendChild(noneOption);

            if (filteredSuppliers.length === 0) {
                const noResult = document.createElement('div');
                noResult.className = 'p-3 text-sm text-gray-500 dark:text-gray-400';
                noResult.textContent = 'Aucun fournisseur trouvé';
                dropdown.appendChild(noResult);
            } else {
                filteredSuppliers.forEach(supplier => {
                    const item = document.createElement('div');
                    item.className = 'p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0';

                    const highlightedName = highlightMatch(supplier.name, query);
                    const highlightedCompany = supplier.company ? highlightMatch(supplier.company, query) : 'Pas d\'entreprise';

                    item.innerHTML = `
                        <div class="font-medium text-gray-900 dark:text-white">${highlightedName}</div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">${highlightedCompany}</div>
                        <div class="text-xs text-gray-400 dark:text-gray-500">${supplier.email || 'Pas d\'email'}</div>
                    `;

                    item.addEventListener('click', () => {
                        selectLotSupplier(supplier);
                    });

                    dropdown.appendChild(item);
                });
            }

            dropdown.classList.remove('hidden');
        }

        // Fonction pour sélectionner un fournisseur
        function selectLotSupplier(supplier) {
            selectedSupplier = supplier;

            if (supplier) {
                searchInput.value = `${supplier.name} - ${supplier.company || 'N/A'}`;
                hiddenInput.value = supplier.id;
            } else {
                searchInput.value = '';
                hiddenInput.value = '';
            }

            dropdown.classList.add('hidden');

            console.log('🏢 Fournisseur lot sélectionné:', supplier ? supplier.name : 'Aucun');
        }

        // Fonction pour filtrer les fournisseurs
        function filterSuppliers(query) {
            if (!query.trim()) {
                return suppliers;
            }

            const lowerQuery = query.toLowerCase();
            return suppliers.filter(supplier =>
                supplier.name.toLowerCase().includes(lowerQuery) ||
                (supplier.company && supplier.company.toLowerCase().includes(lowerQuery)) ||
                (supplier.email && supplier.email.toLowerCase().includes(lowerQuery))
            );
        }

        // Fonction pour highlight les correspondances
        function highlightMatch(text, query) {
            if (!query.trim()) return text;

            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
        }

        // Événement de saisie dans le champ de recherche
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            const filtered = filterSuppliers(query);
            showLotSupplierSuggestions(filtered, query);

            // Si le champ est vide, réinitialiser la sélection
            if (!query.trim()) {
                selectedSupplier = null;
                hiddenInput.value = '';
            }
        });

        // Événement focus pour afficher toutes les suggestions
        searchInput.addEventListener('focus', () => {
            const filtered = filterSuppliers(searchInput.value);
            showLotSupplierSuggestions(filtered, searchInput.value);
        });

        // Événement clic sur le bouton dropdown
        dropdownBtn.addEventListener('click', () => {
            if (dropdown.classList.contains('hidden')) {
                searchInput.focus();
                showLotSupplierSuggestions(suppliers);
            } else {
                dropdown.classList.add('hidden');
            }
        });

        // Fermer le dropdown en cliquant ailleurs
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !dropdown.contains(e.target) && !dropdownBtn.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        // Gestion des touches clavier
        searchInput.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.cursor-pointer');
            let currentIndex = Array.from(items).findIndex(item => item.classList.contains('bg-blue-100'));

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (items.length > 0) {
                        if (currentIndex >= 0) items[currentIndex].classList.remove('bg-blue-100', 'dark:bg-blue-800');
                        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                        items[nextIndex].classList.add('bg-blue-100', 'dark:bg-blue-800');
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (items.length > 0) {
                        if (currentIndex >= 0) items[currentIndex].classList.remove('bg-blue-100', 'dark:bg-blue-800');
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                        items[prevIndex].classList.add('bg-blue-100', 'dark:bg-blue-800');
                    }
                    break;

                case 'Enter':
                    e.preventDefault();
                    if (currentIndex >= 0 && items[currentIndex]) {
                        items[currentIndex].click();
                    }
                    break;

                case 'Escape':
                    dropdown.classList.add('hidden');
                    searchInput.blur();
                    break;
            }
        });

        console.log('✅ Autocomplétion fournisseur lot initialisée avec', suppliers.length, 'fournisseurs');
    }

    /**
     * Charger les données des lots pour un produit
     */
    async function loadLotsData(productId, filterPreferences = null) {
        try {
            // Utiliser les préférences de filtrage ou les valeurs par défaut
            const options = filterPreferences || {
                includeEmpty: true,
                sortBy: 'created_at',
                sortOrder: 'DESC',
                statusFilter: 'ALL',
                searchTerm: '',
                expiryFilter: 'ALL'
            };

            // Charger les lots avec filtrage
            const allLots = await window.api.stockLots.getProductLots(productId, options);
            const allLotsCount = await window.api.stockLots.getProductLots(productId, { includeEmpty: true });

            // Charger les mouvements
            const movements = await window.api.stockLots.getMovements(productId, 50);

            // Calculer le coût moyen
            const averageCost = await window.api.stockLots.calculateAverageCost(productId);

            // Créer l'interface de filtrage si elle n'existe pas
            const filtersContainer = document.getElementById('lotsFiltersContainer');
            if (filtersContainer && window.lotFiltersManager) {
                window.lotFiltersManager.createFilterInterface(filtersContainer);
                window.lotFiltersManager.updateStats(allLots, allLotsCount.length);
            }

            // Mettre à jour les statistiques
            updateLotsStatistics(allLots, averageCost);

            // Afficher les lots avec sélection multiple
            displayLots(allLots, true);

            // Afficher les mouvements
            displayMovements(movements);

        } catch (error) {
            console.error('Erreur lors du chargement des données des lots:', error);
            showNotification('Erreur lors du chargement des données', 'error');
        }
    }

    /**
     * Mettre à jour les statistiques du modal
     */
    function updateLotsStatistics(lots, averageCost) {
        const activeLots = lots.filter(lot => lot.quantity > 0);
        const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);
        const totalValue = lots.reduce((sum, lot) => sum + (lot.quantity * lot.purchase_price), 0);

        document.getElementById('activeLots').textContent = activeLots.length;
        document.getElementById('totalStock').textContent = totalQuantity;
        document.getElementById('averageCost').textContent = averageCost.toFixed(2) + ' MAD';
        document.getElementById('totalValue').textContent = totalValue.toFixed(2) + ' MAD';
    }

    /**
     * Afficher les lots dans l'onglet correspondant
     */
    function displayLots(lots, enableSelection = false) {
        const container = document.getElementById('lotsContainer');

        if (!lots || lots.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 mb-4">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-lg">Aucun lot trouvé</p>
                    <p class="text-sm text-gray-400 dark:text-gray-500 mt-2">Créez un nouveau lot dans l'onglet "Nouveau Lot"</p>
                </div>
            `;
            return;
        }

        container.innerHTML = lots.map(lot => {
            // Déterminer le statut calculé
            const computedStatus = lot.computed_status || lot.status;
            const statusClass = getLotStatusClass(computedStatus);
            const statusText = getLotStatusText(computedStatus);

            // Indicateur visuel selon le statut
            let statusIndicator = '';
            switch (computedStatus) {
                case 'EXPIRED':
                    statusIndicator = '🔴';
                    break;
                case 'EXPIRING_SOON':
                    statusIndicator = '🟠';
                    break;
                case 'AVAILABLE':
                    statusIndicator = '🟢';
                    break;
                case 'SOLD_OUT':
                    statusIndicator = '⚫';
                    break;
                default:
                    statusIndicator = '🔵';
            }

            return `
                <div class="lot-card ${computedStatus.toLowerCase()}" data-lot-id="${lot.id}">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-start gap-3">
                            ${enableSelection ? `
                                <input type="checkbox"
                                       class="lot-checkbox mt-1"
                                       data-lot-id="${lot.id}"
                                       onchange="window.lotFiltersManager?.toggleLotSelection(${lot.id}, this.checked)">
                            ` : ''}
                            <div>
                                <h4 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    ${statusIndicator} ${lot.lot_number}
                                </h4>
                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                    Créé le ${new Date(lot.created_at || lot.purchase_date).toLocaleDateString('fr-FR')}
                                </p>
                                ${lot.supplier_name ? `
                                    <p class="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                        </svg>
                                        ${lot.supplier_company ? `${lot.supplier_name} (${lot.supplier_company})` : lot.supplier_name}
                                    </p>
                                ` : ''}
                                ${lot.days_until_expiry !== null && lot.days_until_expiry !== undefined ? `
                                    <p class="text-xs ${lot.days_until_expiry <= 7 ? 'text-red-600' : 'text-orange-600'}">
                                        ${lot.days_until_expiry > 0
                                            ? `Expire dans ${Math.ceil(lot.days_until_expiry)} jour(s)`
                                            : `Expiré depuis ${Math.abs(Math.floor(lot.days_until_expiry))} jour(s)`
                                        }
                                    </p>
                                ` : ''}
                            </div>
                        </div>
                        <span class="lot-status ${statusClass}">
                            ${statusText}
                        </span>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <span class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Quantité</span>
                            <div class="text-lg font-bold ${lot.quantity > 0 ? 'text-green-600' : 'text-red-600'}">${lot.quantity}</div>
                        </div>
                        <div>
                            <span class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prix d'achat</span>
                            <div class="text-lg font-bold text-gray-900 dark:text-white">${lot.purchase_price.toFixed(2)} MAD</div>
                        </div>
                        <div>
                            <span class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Valeur</span>
                            <div class="text-lg font-bold text-blue-600">${(lot.total_value || (lot.quantity * lot.purchase_price)).toFixed(2)} MAD</div>
                        </div>
                        <div>
                            <span class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Expiration</span>
                            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                ${lot.expiry_date ? new Date(lot.expiry_date).toLocaleDateString('fr-FR') : 'Non définie'}
                            </div>
                        </div>
                    </div>

                    ${lot.notes ? `
                        <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                            <span class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notes</span>
                            <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">${lot.notes}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Afficher les mouvements dans l'onglet correspondant
     */
    function displayMovements(movements) {
        const container = document.getElementById('movementsContainer');

        if (!movements || movements.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 mb-4">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-lg">Aucun mouvement trouvé</p>
                </div>
            `;
            return;
        }

        container.innerHTML = movements.map(movement => `
            <div class="movement-card ${movement.movement_type.toLowerCase()}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-lg">${getMovementIcon(movement.movement_type)}</span>
                            <span class="font-semibold text-gray-900 dark:text-white">
                                ${getMovementText(movement.movement_type)}
                            </span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">
                                ${movement.lot_number || 'Lot supprimé'}
                            </span>
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            <span class="font-medium">${Math.abs(movement.quantity)}</span> unités
                            ${movement.unit_cost > 0 ? `à ${movement.unit_cost.toFixed(2)} MAD` : ''}
                        </div>
                        ${movement.notes ? `
                            <div class="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">${movement.notes}</div>
                        ` : ''}
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                            ${new Date(movement.movement_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            ${new Date(movement.movement_date).toLocaleTimeString('fr-FR')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Changer d'onglet dans le modal des lots
     */
    function switchLotsTab(tabName) {
        // Désactiver tous les onglets
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));

        // Activer l'onglet sélectionné
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.remove('hidden');

        // Générer un numéro de lot automatique si on ouvre l'onglet création
        if (tabName === 'create' && currentProductForLots) {
            generateLotNumber();
        }
    }

    /**
     * Générer un numéro de lot automatique
     */
    function generateLotNumber() {
        const now = new Date();
        const timestamp = now.getFullYear().toString().slice(-2) +
                         (now.getMonth() + 1).toString().padStart(2, '0') +
                         now.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        document.getElementById('newLotNumber').value = `LOT-${timestamp}-${random}`;
    }

    /**
     * Gérer la création d'un nouveau lot
     */
    async function handleCreateLot(e) {
        e.preventDefault();

        if (!currentProductForLots) {
            showNotification('Aucun produit sélectionné', 'error');
            return;
        }

        const formData = new FormData(e.target);
        const lotData = {
            product_id: currentProductForLots.id,
            lot_number: document.getElementById('newLotNumber').value.trim(),
            quantity: parseInt(document.getElementById('newLotQuantity').value),
            purchase_price: parseFloat(document.getElementById('newLotPrice').value),
            expiry_date: document.getElementById('newLotExpiry').value || null,
            supplier_id: document.getElementById('newLotSupplier').value ? parseInt(document.getElementById('newLotSupplier').value) : null,
            purchase_date: document.getElementById('newLotPurchaseDate').value || new Date().toISOString().slice(0, 10),
            notes: document.getElementById('newLotNotes').value.trim() || null
        };

        // Validation
        if (!lotData.lot_number || !lotData.quantity || !lotData.purchase_price) {
            showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        if (lotData.quantity <= 0 || lotData.purchase_price <= 0) {
            showNotification('La quantité et le prix doivent être positifs', 'error');
            return;
        }

        try {
            // Créer le lot
            const newLot = await window.api.stockLots.createLot(lotData);

            // Enregistrer le mouvement d'entrée
            await window.api.stockLots.recordMovement({
                product_id: currentProductForLots.id,
                lot_id: newLot.id,
                movement_type: 'IN',
                quantity: lotData.quantity,
                unit_cost: lotData.purchase_price,
                reference_type: 'PURCHASE',
                notes: `Entrée initiale du lot ${lotData.lot_number}`
            });

            // Le stock est automatiquement mis à jour par la fonction createStockLot
            // Recharger les données du modal
            await loadLotsData(currentProductForLots.id);

            // Recharger la liste des produits pour refléter le nouveau stock
            await loadProducts();

            // Réinitialiser le formulaire
            document.getElementById('createLotForm').reset();

            // Retourner à l'onglet des lots
            switchLotsTab('lots');

            showNotification(`Lot ${lotData.lot_number} créé avec succès !`, 'success');

        } catch (error) {
            console.error('Erreur lors de la création du lot:', error);
            showNotification('Erreur lors de la création du lot: ' + error.message, 'error');
        }
    }

    // ===== FONCTIONS UTILITAIRES =====

    function getLotStatusClass(status) {
        switch (status) {
            case 'AVAILABLE': return 'available';
            case 'SOLD_OUT': return 'sold-out';
            case 'EXPIRED': return 'expired';
            default: return 'available';
        }
    }

    function getLotStatusText(status) {
        switch (status) {
            case 'AVAILABLE': return 'Disponible';
            case 'SOLD_OUT': return 'Épuisé';
            case 'EXPIRED': return 'Expiré';
            default: return status;
        }
    }

    function getMovementIcon(type) {
        switch (type) {
            case 'IN': return '📥';
            case 'OUT': return '📤';
            case 'ADJUSTMENT': return '⚖️';
            case 'TRANSFER': return '🔄';
            default: return '📋';
        }
    }

    function getMovementText(type) {
        switch (type) {
            case 'IN': return 'Entrée';
            case 'OUT': return 'Sortie';
            case 'ADJUSTMENT': return 'Ajustement';
            case 'TRANSFER': return 'Transfert';
            default: return type;
        }
    }

    /**
     * S'assurer que tous les produits ont des lots (migration automatique)
     */
    async function ensureAllProductsHaveLots() {
        try {
            const result = await window.api.stockLots.ensureAllProductsHaveLots();

            if (result.success && result.lotsCreated > 0) {
                console.log(`✅ Migration automatique : ${result.lotsCreated} lots génériques créés`);
            }
        } catch (error) {
            console.warn('Erreur lors de la migration automatique:', error);
        }
    }



});