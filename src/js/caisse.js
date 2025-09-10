// caisse.js - Basé sur la version stable fournie, avec traductions et corrections de bugs.

function debounce(func, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// Variables pour éviter les conflits de rendu et gérer l'état
let isRendering = false;
let isProcessing = false;
let isUserTyping = false;

// Fonction utilitaire pour gérer l'état des inputs
function setInputsState(disabled) {
    const inputs = document.querySelectorAll('input, button');
    inputs.forEach(input => {
        if (disabled) {
            input.dataset.wasDisabled = input.disabled;
            input.disabled = true;
        } else {
            input.disabled = input.dataset.wasDisabled === 'true';
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // --- Initialisation premium de la page ---
    await initPagePremium('caisse', async () => {
        // Initialisation spécifique à la page caisse
        await initCaissePage();
    });
});

async function initCaissePage() {
    // --- Récupération de la fonction de traduction ---
    const t = window.i18n.t;

    // --- Vérification des API ---
    if (!window.api || !window.api.products || !window.api.clients || !window.api.sales || !window.api.session) {
        document.body.innerHTML = "<h1 class='text-red-500 text-center p-8'>ERREUR CRITIQUE: Une API nécessaire est manquante.</h1>";
        return;
    }

    // --- État de l'application (inchangé) ---
    let cart = [], allProducts = [], categories = [], selectedCategory = 'all', selectedClientId = 1, editMode = false,
        originalSaleId = null, countdownInterval = null, barcodeBuffer = '', barcodeTimer = null;

    // Variables supplémentaires pour le scanner code-barres
    let lastKeyTime = 0;
    let isScanning = false;
    let scannerTimeout = null;
    let lastProcessedBarcode = '';
    let lastProcessedTime = 0;
    let isProcessingBarcode = false;

    // Variables pour l'impression
    let lastSaleData = null;

    // --- Variables pour le nouveau workflow de modification ---
    let editWorkflowStep = 'products'; // 'products' | 'payment'
    let originalSaleData = null; // Stockage des données originales de la vente

    // --- Fonctions du Scanner Code-Barres ---

    /**
     * Nettoie et valide un code-barres avec suppression des préfixes
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
     * Recherche un produit par code-barres
     */
    function findProductByBarcode(barcode) {
        if (!barcode || barcode.trim() === '') return null;

        // Nettoyer le code-barres avec la nouvelle fonction
        const cleanBarcode = cleanAndValidateBarcode(barcode);
        if (!cleanBarcode) return null;

        return allProducts.find(product => {
            if (!product.barcode) return false;
            const productBarcode = cleanAndValidateBarcode(product.barcode);
            return productBarcode === cleanBarcode;
        });
    }

    /**
     * Traite le scan d'un code-barres avec nettoyage amélioré
     */
    async function processBarcodeInput(barcode) {
        console.log('📱 processBarcodeInput appelé avec:', barcode);

        if (!barcode || barcode.trim() === '') {
            console.log('📱 Code-barres vide, abandon');
            return;
        }

        // Protection contre les appels multiples
        const currentTime = Date.now();
        const cleanedBarcode = cleanAndValidateBarcode(barcode);

        console.log('📱 État avant traitement:', {
            cleanedBarcode,
            lastProcessedBarcode,
            timeDiff: currentTime - lastProcessedTime,
            isProcessingBarcode
        });

        // Si c'est le même code-barres traité récemment (dans les 1000ms), ignorer
        if (cleanedBarcode === lastProcessedBarcode && (currentTime - lastProcessedTime) < 1000) {
            console.log('🔄 Code-barres déjà traité récemment, ignoré:', cleanedBarcode);
            return;
        }

        // Si on est déjà en train de traiter un code-barres, ignorer
        if (isProcessingBarcode) {
            console.log('⏳ Traitement en cours, code-barres ignoré:', cleanedBarcode);
            return;
        }

        // Marquer comme en cours de traitement
        isProcessingBarcode = true;
        lastProcessedBarcode = cleanedBarcode;
        lastProcessedTime = currentTime;

        const barcodeInput = document.getElementById('barcodeInput');
        const scannerStatus = document.getElementById('scannerStatus');
        const scannerFeedback = document.getElementById('scannerFeedback');
        const scannerMessage = document.getElementById('scannerMessage');

        try {
            // Mettre à jour le statut
            updateScannerStatus('scanning');

            // Log pour diagnostic
            console.log('📱 Code-barres reçu:', barcode);
            console.log('🧹 Code-barres nettoyé:', cleanedBarcode);

            if (!cleanedBarcode) {
                showScannerFeedback('error', 'Code-barres invalide ou trop court');
                updateScannerStatus('ready');
                isProcessingBarcode = false; // Libérer le verrou
                return;
            }

            // Mettre à jour le champ avec le code nettoyé (temporairement pour feedback)
            if (barcodeInput) barcodeInput.value = cleanedBarcode;

            // Rechercher le produit
            const product = findProductByBarcode(cleanedBarcode);

            if (product) {
                // Vérifier le stock avant d'afficher le feedback de succès
                if (product.stock <= 0) {
                    // Produit trouvé mais en rupture de stock
                    showScannerFeedback('error', `❌ ${product.name} : Rupture de stock (${cleanedBarcode})`);
                    console.log(`📦 Produit scanné "${product.name}" en rupture de stock`);
                } else {
                    // Produit trouvé et en stock - l'ajouter au panier
                    addProductToCart(product.id);

                    // Feedback positif avec code nettoyé et stock
                    const stockInfo = product.stock > 10 ? '' : ` (${product.stock} restants)`;
                    showScannerFeedback('success', `✅ ${product.name} ajouté${stockInfo} (${cleanedBarcode})`);
                    console.log(`📦 Produit scanné "${product.name}" ajouté au panier (stock: ${product.stock})`);
                }

                // CORRECTION: Vider le champ après traitement
                setTimeout(() => {
                    if (barcodeInput) {
                        barcodeInput.value = '';
                        barcodeInput.focus(); // Remettre le focus pour le prochain scan
                    }
                    // Réinitialiser le buffer
                    barcodeBuffer = '';
                    // Libérer le verrou après le délai
                    isProcessingBarcode = false;
                }, product.stock <= 0 ? 2000 : 100); // Délai plus long si rupture de stock

                // Mettre à jour le statut
                updateScannerStatus('ready');

            } else {
                // Produit non trouvé - afficher le code nettoyé
                showScannerFeedback('error', `${t('product_not_found_by_barcode')}: ${cleanedBarcode}`);

                // CORRECTION: Vider le champ même en cas d'erreur après un délai plus long
                setTimeout(() => {
                    if (barcodeInput) {
                        barcodeInput.value = '';
                        barcodeInput.focus(); // Remettre le focus pour le prochain scan
                    }
                    // Réinitialiser le buffer
                    barcodeBuffer = '';
                    // Libérer le verrou après le délai
                    isProcessingBarcode = false;
                }, 2000);

                updateScannerStatus('ready');
            }

        } catch (error) {
            console.error('❌ Erreur lors du traitement du code-barres:', error);
            showScannerFeedback('error', t('barcode_scan_error'));
            updateScannerStatus('ready');
            isProcessingBarcode = false; // Libérer le verrou en cas d'erreur
        } finally {
            // S'assurer que le verrou est libéré dans tous les cas
            setTimeout(() => {
                isProcessingBarcode = false;
            }, 3000); // Sécurité : libérer après 3 secondes maximum
        }
    }

    /**
     * Met à jour le statut du scanner
     */
    function updateScannerStatus(status) {
        const scannerStatus = document.getElementById('scannerStatus');
        if (!scannerStatus) return;

        const statusDot = scannerStatus.querySelector('.w-3.h-3');
        const statusText = scannerStatus.querySelector('span');

        if (statusDot && statusText) {
            switch (status) {
                case 'ready':
                    statusDot.className = 'w-3 h-3 bg-green-500 rounded-full animate-pulse';
                    statusText.textContent = t('scanner_ready');
                    break;
                case 'scanning':
                    statusDot.className = 'w-3 h-3 bg-blue-500 rounded-full animate-spin';
                    statusText.textContent = t('scanner_scanning');
                    break;
                case 'error':
                    statusDot.className = 'w-3 h-3 bg-red-500 rounded-full';
                    statusText.textContent = 'Erreur';
                    break;
            }
        }
    }

    /**
     * Affiche un feedback du scanner
     */
    function showScannerFeedback(type, message) {
        const scannerFeedback = document.getElementById('scannerFeedback');
        const scannerMessage = document.getElementById('scannerMessage');

        if (!scannerFeedback || !scannerMessage) return;

        // Définir les couleurs selon le type
        let bgColor, textColor, iconPath;

        switch (type) {
            case 'success':
                bgColor = 'bg-green-100 dark:bg-green-900/30';
                textColor = 'text-green-800 dark:text-green-200';
                iconPath = 'M5 13l4 4L19 7'; // Checkmark
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
        scannerFeedback.className = `mt-2 text-sm ${bgColor} ${textColor} rounded-lg`;
        scannerFeedback.innerHTML = `
            <div class="flex items-center gap-2 p-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
                </svg>
                <span>${message}</span>
            </div>
        `;

        // Afficher le feedback
        scannerFeedback.classList.remove('hidden');

        // Masquer après 3 secondes
        setTimeout(() => {
            if (scannerFeedback) {
                scannerFeedback.classList.add('hidden');
            }
        }, 3000);
    }

    /**
     * Détecte si l'entrée provient d'un scanner (basé sur la vitesse de frappe)
     */
    function detectBarcodeScanner(event) {
        const currentTime = Date.now();
        const timeDiff = currentTime - lastKeyTime;
        lastKeyTime = currentTime;

        // Si l'intervalle entre les touches est très court (< 50ms), c'est probablement un scanner
        return timeDiff < 50 && timeDiff > 0;
    }

    // --- Fonctions d'Impression ---

    /**
     * Récupère les paramètres de la société depuis la base de données
     */
    async function getCompanySettings() {
        try {
            if (window.api && window.api.settings) {
                const settings = await window.api.settings.getCompanyInfo();
                return {
                    name: settings.name || settings.company_name || 'MAGASIN GÉNÉRAL',
                    address: settings.address || settings.company_address || '123 Avenue Mohammed V, Casablanca',
                    phone: settings.phone || settings.company_phone || '+212 522 123 456',
                    ice: settings.ice || settings.company_ice || '001234567890123',
                    email: settings.email || settings.company_email || '',
                    website: settings.website || settings.company_website || ''
                };
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des paramètres société:', error);
        }

        // Fallback par défaut
        return {
            name: 'MAGASIN GÉNÉRAL',
            address: '123 Avenue Mohammed V, Casablanca',
            phone: '+212 522 123 456',
            ice: '001234567890123',
            email: '',
            website: ''
        };
    }

    /**
     * Récupère les informations du client sélectionné
     */
    async function getSelectedClientInfo() {
        try {
            if (selectedClientId && selectedClientId !== 1 && window.api && window.api.clients) {
                const client = await window.api.clients.getById(selectedClientId);
                return {
                    id: client.id,
                    name: client.name || 'Client',
                    phone: client.phone || '',
                    address: client.address || '',
                    credit: client.credit || 0
                };
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des infos client:', error);
        }

        // Client par défaut
        return {
            id: 1,
            name: 'Client Passager',
            phone: '',
            address: '',
            credit: 0
        };
    }

    /**
     * Prépare les données de vente pour l'impression
     */
    async function prepareSaleDataForPrint(originalSaleData) {
        try {
            // Récupérer les paramètres de la société
            const companySettings = await getCompanySettings();

            // Récupérer les informations du client
            const clientInfo = await getSelectedClientInfo();

            // Récupérer le nom du vendeur (utilisateur connecté)
            let sellerName = 'Vendeur';
            try {
                if (window.api && window.api.auth) {
                    const currentUser = await window.api.auth.getCurrentUser();
                    sellerName = currentUser?.username || currentUser?.name || 'Vendeur';
                }
            } catch (error) {
                console.log('Impossible de récupérer le vendeur connecté');
            }

            // Calculer l'avance pour les paiements crédit
            let advanceAmount = 0;
            if (originalSaleData?.method === 'credit' || originalSaleData?.paymentMethod === 'credit') {
                // Récupérer l'avance depuis différentes sources possibles
                advanceAmount = originalSaleData?.advanceAmount ||
                              originalSaleData?.advance ||
                              originalSaleData?.amountPaidCash ||
                              originalSaleData?.amountPaid ||
                              parseFloat(document.getElementById('amountPaidInput')?.value) || 0;

                console.log('DEBUG AVANCE - originalSaleData:', originalSaleData);
                console.log('DEBUG AVANCE - advanceAmount calculé:', advanceAmount);
                console.log('DEBUG AVANCE - amountPaidInput value:', document.getElementById('amountPaidInput')?.value);
            }

            // Récupérer les données de paiement comptant si disponibles
            const cashPaymentData = window.lastCashPaymentData || null;

            const printData = {
                // Données des produits
                items: cart.map(item => ({
                    name: item.name || 'Produit',
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                    total: (item.quantity || 1) * (item.price || 0)
                })),

                // Données de paiement
                paymentMethod: originalSaleData?.method || originalSaleData?.paymentMethod || 'cash',
                amountPaid: originalSaleData?.amountPaid || originalSaleData?.amount || originalSaleData?.amountPaidCash || 0,
                advanceAmount: advanceAmount,
                checkNumber: originalSaleData?.checkNumber || originalSaleData?.check || null,
                discount: 0,

                // Données de rendu pour paiement comptant
                amountReceived: cashPaymentData?.amountReceived || null,
                changeAmount: cashPaymentData?.change || null,

                // Données de la société (dynamiques)
                company: companySettings,

                // Données du vendeur (dynamiques)
                sellerName: sellerName,

                // Données du client (dynamiques)
                customer: clientInfo,
                customerName: clientInfo.name,

                // Numéro de ticket de la base de données
                ticketNumber: originalSaleData?.ticketNumber || 'N/A',
                saleId: originalSaleData?.saleId || null,

                // Métadonnées
                timestamp: new Date()
            };

            return printData;
        } catch (error) {
            console.error('Erreur dans prepareSaleDataForPrint:', error);
            // Retourner des données par défaut en cas d'erreur
            return {
                items: [{ name: 'Erreur', quantity: 1, price: 0, total: 0 }],
                paymentMethod: 'cash',
                amountPaid: 0,
                advanceAmount: 0,
                checkNumber: null,
                discount: 0,
                company: {
                    name: 'MAGASIN GÉNÉRAL',
                    address: '123 Avenue Mohammed V, Casablanca',
                    phone: '+212 522 123 456',
                    ice: '001234567890123'
                },
                sellerName: 'Vendeur',
                customer: { name: 'Client Passager' },
                customerName: 'Client Passager',
                ticketNumber: 'ERREUR',
                saleId: null,
                timestamp: new Date()
            };
        }
    }

    /**
     * Récupère le nom du client sélectionné
     */
    function getClientName() {
        const clientDisplay = document.getElementById('selectedClientDisplay');
        return clientDisplay ? clientDisplay.textContent.trim() : null;
    }

    /**
     * Affiche le bouton d'impression après une vente réussie ou imprime automatiquement
     */
    async function showPrintSection(saleData) {
        try {
            lastSaleData = saleData;

            // Stocker les données dans le ticket printer
            if (window.ticketPrinter) {
                window.ticketPrinter.setSaleData(saleData);
            } else {
                console.error('TicketPrinter non disponible');
                return;
            }

            // Vérifier si l'impression automatique est activée
            const autoPrintEnabled = await checkAutoPrintSetting();

            if (autoPrintEnabled) {
                // Impression automatique
                console.log('🖨️ Impression automatique activée - Impression en cours...');
                await performAutoPrint();
            } else {
                // Mode manuel - Afficher la section d'impression
                const printSection = document.getElementById('print-section');
                if (printSection) {
                    printSection.classList.remove('hidden');
                } else {
                    console.error('Élément print-section non trouvé');
                }
            }
        } catch (error) {
            console.error('Erreur dans showPrintSection:', error);
        }
    }

    /**
     * Vérifie si l'impression automatique est activée
     */
    async function checkAutoPrintSetting() {
        try {
            const setting = await window.api.getSetting('auto_print_tickets');
            return setting === 'true';
        } catch (error) {
            console.error('Erreur lors de la vérification du paramètre auto_print_tickets:', error);
            return false; // Par défaut, mode manuel
        }
    }

    /**
     * Effectue l'impression automatique
     */
    async function performAutoPrint() {
        try {
            if (!window.ticketPrinter) {
                console.error('TicketPrinter non disponible pour impression automatique');
                showNotification('Erreur: Système d\'impression non disponible', 'error');
                return;
            }

            // Tenter l'impression directe
            await window.ticketPrinter.printDirect();

            // Notification de succès
            showNotification('Ticket imprimé automatiquement ✅', 'success');
            console.log('✅ Impression automatique réussie');

        } catch (error) {
            console.error('❌ Erreur lors de l\'impression automatique:', error);

            // En cas d'erreur, afficher le bouton manuel comme fallback
            showNotification('Échec impression automatique - Bouton manuel affiché', 'warning');

            const printSection = document.getElementById('print-section');
            if (printSection) {
                printSection.classList.remove('hidden');
            }
        }
    }

    /**
     * Masque le bouton d'impression
     */
    function hidePrintSection() {
        const printSection = document.getElementById('print-section');
        if (printSection) {
            printSection.classList.add('hidden');
        }
        lastSaleData = null;
    }

    /**
     * Ouvre le modal de choix d'impression
     */
    function openPrintModal() {
        const modal = document.getElementById('printModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    }

    /**
     * Ferme le modal de choix d'impression
     */
    function closePrintModal() {
        const modal = document.getElementById('printModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    // --- Éléments du DOM ---
    const productSearchInput = document.getElementById('productSearch');
    const categoryFiltersDiv = document.getElementById('category-filters'); // Ancien système (conservé pour compatibilité)
    const productGridDiv = document.getElementById('product-grid');

    // Nouveaux éléments pour le dropdown
    const categoryDropdownButton = document.getElementById('category-dropdown-button');
    const categoryDropdownMenu = document.getElementById('category-dropdown-menu');
    const categorySearchInput = document.getElementById('category-search-input');
    const clearSearchButton = document.getElementById('clear-search');
    const clientSearchInput = document.getElementById('clientSearchInput');
    const clientSearchResultsDiv = document.getElementById('clientSearchResults');
    const selectedClientDisplay = document.getElementById('selectedClientDisplay');
    const selectedClientContainer = document.getElementById('selectedClientContainer');
    const clientCreditBadge = document.getElementById('clientCreditBadge');
    const cartItemsTbody = document.getElementById('cart-items');
    const totalAmountSpan = document.getElementById('total-amount');
    const amountPaidInput = document.getElementById('amount-paid');
    const setTotalBtn = document.getElementById('set-total-btn');
    const creditInfoP = document.getElementById('credit-info');
    const changeInfoP = document.getElementById('change-info');
    const cancelSaleBtn = document.getElementById('cancel-sale-btn');
    const cashPaymentBtn = document.getElementById('cash-payment-btn');
    const creditPaymentBtn = document.getElementById('credit-payment-btn');

    // Nouveaux éléments pour le workflow de paiement
    const validatePaymentBtn = document.getElementById('validate-payment-btn');
    const checkPaymentBtn = document.getElementById('check-payment-btn');
    const confirmPartialBtn = document.getElementById('confirm-partial-btn');
    const backToStep1Btn = document.getElementById('back-to-step1-btn');
    const backToStep2Btn = document.getElementById('back-to-step2-btn');
    const paymentStep1 = document.getElementById('payment-step-1');
    const paymentStep2 = document.getElementById('payment-step-2');
    const paymentStep3 = document.getElementById('payment-step-3');
    const paymentStepCash = document.getElementById('payment-step-cash');
    const totalDisplay = document.getElementById('total-display');
    const creditDisplay = document.getElementById('credit-display');

    // Nouveaux éléments pour le calcul de rendu
    const amountReceivedInput = document.getElementById('amount-received');
    const cashTotalDisplay = document.getElementById('cash-total-display');
    const changeAmountDisplay = document.getElementById('change-amount-display');
    const missingAmountDisplay = document.getElementById('missing-amount-display');
    const changeDisplayPositive = document.getElementById('change-display-positive');
    const changeDisplayExact = document.getElementById('change-display-exact');
    const changeDisplayInsufficient = document.getElementById('change-display-insufficient');
    const confirmCashPaymentBtn = document.getElementById('confirm-cash-payment-btn');
    const backToPaymentTypesBtn = document.getElementById('back-to-payment-types-btn');
    const exactAmountBtn = document.getElementById('exact-amount-btn');
    const lastSalePanel = document.getElementById('lastSalePanel');
    const lastSaleIdSpan = document.getElementById('lastSaleId');
    const countdownSpan = document.getElementById('countdownSpan');
    const editSaleBtn = document.getElementById('editSaleBtn');
    const quickAddClientBtn = document.getElementById('quickAddClientBtn');
    const addClientModal = document.getElementById('addClientModal');
    const addClientForm = document.getElementById('addClientForm');
    const cancelAddClientBtn = document.getElementById('cancelAddClientBtn');

    // --- Fonctions utilitaires ---

    function showNotification(message, type = 'info') {
        // Créer une notification non-bloquante
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        // Style initial pour l'animation
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';

        document.body.appendChild(notification);

        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);

        // Suppression automatique après 3 secondes
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // --- Fonctions (votre logique originale avec traductions) ---

    function renderCart() {
        if (!cartItemsTbody) return;
        cartItemsTbody.innerHTML = '';
        if (cart.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="5" class="text-center py-8 text-gray-500">${t('cart_is_empty')}</td>`;
            cartItemsTbody.appendChild(tr);
        } else {
            cart.forEach(item => {
                // Validation défensive pour éviter les erreurs
                const safeItem = {
                    id: item.id || 0,
                    name: item.name || 'Produit inconnu',
                    price: parseFloat(item.price) || 0,
                    quantity: parseInt(item.quantity) || 1,
                    unit: item.unit || 'retail',
                    price_retail: parseFloat(item.price_retail) || 0,
                    price_wholesale: parseFloat(item.price_wholesale) || 0,
                    price_carton: parseFloat(item.price_carton) || 0,
                    pieces_per_carton: parseInt(item.pieces_per_carton) || 0,
                    stock: parseInt(item.stock) || 999
                };

                const tr = document.createElement('tr');
                tr.dataset.productId = safeItem.id;
                const retailBtnClass = safeItem.unit === 'retail' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600';
                const wholesaleBtnClass = safeItem.unit === 'wholesale' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600';
                const cartonBtnClass = safeItem.unit === 'carton' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600';
                const isCartonDisabled = safeItem.pieces_per_carton === 0;
                tr.innerHTML = `<td class="px-2 py-2 align-top"><p class="font-semibold text-sm product-name-truncate-cart" title="${safeItem.name}">${safeItem.name}</p><div class="flex items-center gap-1 mt-1"><span class="text-xs mr-1">Tarif:</span><button class="set-price-btn text-xs px-2 py-0.5 rounded ${retailBtnClass}" data-price-type="retail" data-product-id="${safeItem.id}" title="Prix Détail">D</button><button class="set-price-btn text-xs px-2 py-0.5 rounded ${wholesaleBtnClass}" data-price-type="wholesale" data-product-id="${safeItem.id}" title="Prix Gros">G</button><button class="set-price-btn text-xs px-2 py-0.5 rounded ${cartonBtnClass}" data-price-type="carton" data-product-id="${safeItem.id}" title="Prix Carton" ${isCartonDisabled ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>C</button></div></td><td class="px-2 py-2 align-top"><input type="number" class="quantity-input w-16 text-center font-bold border rounded dark:bg-gray-700 dark:border-gray-600" value="${safeItem.quantity}" min="1" max="${safeItem.stock}"></td><td class="px-2 py-2 align-top"><input type="number" step="0.01" class="price-input w-24 text-center font-bold border rounded dark:bg-gray-700 dark:border-gray-600" value="${safeItem.price.toFixed(2)}"></td><td class="line-total py-2 px-4 text-right font-bold whitespace-nowrap align-top">${(safeItem.quantity * safeItem.price).toFixed(2)}</td><td class="px-2 py-2 align-top"><button class="text-red-500 hover:text-red-700 remove-item-btn font-bold">X</button></td>`;
                cartItemsTbody.appendChild(tr);

                // Protéger les nouveaux inputs créés dynamiquement
                const quantityInput = tr.querySelector('.quantity-input');
                const priceInput = tr.querySelector('.price-input');
                protectInput(quantityInput);
                protectInput(priceInput);
            });
        }
        updateTotals();
        updatePaymentButtonsVisibility();
    }
    
    function addProductToCart(productId) {
        console.log('🛒 Tentative d\'ajout produit au panier:', {
            productId,
            cartLength: cart.length,
            editMode,
            isProcessing,
            isProcessingBarcode,
            isRendering
        });

        if (cart.length === 0 && !editMode) {
            hideLastSalePanel();
            hidePrintSection(); // Masquer le bouton d'impression quand on commence une nouvelle vente
        }

        const product = allProducts.find(p => p.id === productId);

        // Vérifier si le produit existe
        if (!product) {
            console.warn(`⚠️ Produit avec ID ${productId} non trouvé`);
            showNotification('Produit non trouvé', 'error');
            return;
        }

        // CORRECTION: Vérifier le stock avec message d'alerte approprié
        if (product.stock <= 0) {
            console.warn(`⚠️ Produit "${product.name}" en rupture de stock (stock: ${product.stock})`);
            showNotification(`❌ "${product.name}" n'est plus en stock`, 'error');

            // Feedback visuel pour le scanner si c'est un scan
            showScannerFeedback('error', `Produit en rupture de stock : ${product.name}`);
            return;
        }

        const unitToAdd = 'retail';
        let existingItem = cart.find(item => item.id === productId && item.unit === unitToAdd);

        if (existingItem) {
            // Vérifier si on peut ajouter une unité de plus
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
                console.log(`✅ Quantité augmentée pour "${product.name}" : ${existingItem.quantity}/${product.stock}`);
                showNotification(`"${product.name}" ajouté au panier (${existingItem.quantity})`, 'success');
            } else {
                console.warn(`⚠️ Stock maximum atteint pour "${product.name}" (${product.stock})`);
                showNotification(`Stock maximum atteint pour "${product.name}" (${product.stock} disponibles)`, 'warning');
            }
        } else {
            // Ajouter le produit au panier
            cart.push({
                id: product.id,
                name: product.name,
                quantity: 1,
                unit: 'retail',
                price: product.price_retail,
                price_retail: product.price_retail,
                price_wholesale: product.price_wholesale,
                price_carton: product.price_carton,
                pieces_per_carton: product.pieces_per_carton,
                stock: product.stock
            });
            console.log(`✅ Produit "${product.name}" ajouté au panier (stock disponible: ${product.stock})`);
            showNotification(`"${product.name}" ajouté au panier`, 'success');
        }

        renderCart();
    }

    // SUPPRIMÉ: Ancienne fonction processBarcode() remplacée par processBarcodeInput()
    async function handleKeyDown(e) {
        const activeElement = document.activeElement;
        const isTypingInInput = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.tagName === 'SELECT' ||
            activeElement.isContentEditable ||
            activeElement.classList.contains('quantity-input') ||
            activeElement.classList.contains('price-input')
        );

        // Marquer que l'utilisateur tape si c'est dans un input
        if (isTypingInInput) {
            isUserTyping = true;
            // Arrêter le marquage après un délai
            clearTimeout(window.typingTimeout);
            window.typingTimeout = setTimeout(() => {
                isUserTyping = false;
            }, 500);
        }

        // Vérifier si une modal est ouverte
        const isModalOpen = addClientModal && !addClientModal.classList.contains('hidden');

        // Ne pas traiter les codes-barres si on tape dans un champ ou si une modal est ouverte
        // Aussi ignorer si l'utilisateur maintient Ctrl, Alt, ou Meta (pour les raccourcis)
        if (isTypingInInput || isModalOpen || e.ctrlKey || e.altKey || e.metaKey || isUserTyping) {
            return;
        }

        // Ignorer complètement si l'élément actif a un type spécifique
        if (activeElement && activeElement.type &&
            ['text', 'number', 'email', 'tel', 'password', 'search'].includes(activeElement.type)) {
            return;
        }

        // Raccourcis clavier pour le workflow de paiement
        if (e.key === 'F1' && !paymentStep1.classList.contains('hidden')) {
            e.preventDefault();
            if (cart.length > 0) showPaymentStep2();
            return;
        }

        if (e.key === 'F1' && !paymentStep2.classList.contains('hidden')) {
            e.preventDefault();
            processPayment('cash');
            return;
        }

        if (e.key === 'F2' && !paymentStep2.classList.contains('hidden')) {
            e.preventDefault();
            processPayment('check');
            return;
        }

        if (e.key === 'F3' && !paymentStep2.classList.contains('hidden')) {
            e.preventDefault();
            if (selectedClientId === 1) {
                showNotification(t('credit_for_default_client_error'), 'error');
                return;
            }
            showPaymentStep3();
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            if (!paymentStep3.classList.contains('hidden')) {
                showPaymentStep2();
            } else if (!paymentStep2.classList.contains('hidden')) {
                showPaymentStep1();
            }
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            // CORRECTION: Utiliser la nouvelle fonction processBarcodeInput
            if (barcodeBuffer.trim()) {
                await processBarcodeInput(barcodeBuffer);
            }
            barcodeBuffer = '';
            return;
        }

        // Ignorer les touches spéciales et de navigation
        if (e.key.length > 1 || e.key === ' ') return;

        barcodeBuffer += e.key;
        clearTimeout(barcodeTimer);
        barcodeTimer = setTimeout(() => {
            barcodeBuffer = '';
        }, 100);
    }
    async function handlePaste(e) {
        const activeElement = document.activeElement;
        const isTypingInInput = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.tagName === 'SELECT' ||
            activeElement.isContentEditable ||
            activeElement.classList.contains('quantity-input') ||
            activeElement.classList.contains('price-input')
        );
        const isModalOpen = addClientModal && !addClientModal.classList.contains('hidden');

        // Ne pas intercepter le paste si l'utilisateur tape dans un champ
        if (isTypingInInput || isModalOpen) return;

        // Ignorer complètement si l'élément actif a un type spécifique
        if (activeElement && activeElement.type &&
            ['text', 'number', 'email', 'tel', 'password', 'search'].includes(activeElement.type)) {
            return;
        }

        e.preventDefault();
        const pastedText = e.clipboardData ? e.clipboardData.getData('text') : '';
        if (pastedText) {
            // CORRECTION: Utiliser la nouvelle fonction processBarcodeInput
            await processBarcodeInput(pastedText);
        }
    }
    function openAddClientModal() {
        if (addClientModal) {
            addClientModal.classList.replace('hidden', 'flex');
            // Pas de focus automatique pour éviter les conflits avec les événements clavier
        }
    }
    function closeAddClientModal() {
        if (addClientModal) {
            addClientModal.classList.replace('flex', 'hidden');
            addClientForm.reset();
            // Pas de focus automatique pour éviter les conflits
        }
    }

    async function initPage() {
        if (typeof initializePage === 'function') await initializePage('caisse');
        [categories, allProducts] = await Promise.all([ window.api.products.getCategories(), window.api.products.getAll() ]);

        // Charger les clients pour les bons de livraison
        await loadCaisseClients();

        renderCategories();
        await renderProducts();

        // Vérifier s'il y a des données de modification depuis l'historique
        const editSaleData = localStorage.getItem('editSaleData');
        if (editSaleData) {
            try {
                const data = JSON.parse(editSaleData);
                if (data.isEdit && data.saleId && data.items) {
                    // Entrer en mode modification
                    editMode = true;
                    originalSaleId = data.saleId;

                    // Sélectionner le client
                    if (data.clientId) {
                        selectedClientId = data.clientId;
                        if (clientSearchInput) {
                            clientSearchInput.value = data.clientName || '';
                        }
                    }

                    // Charger les articles dans le panier avec données complètes
                    cart = data.items.map(item => {
                        // Trouver le produit complet pour récupérer toutes les informations
                        const fullProduct = allProducts.find(p => p.id === item.product_id);

                        if (fullProduct) {
                            return {
                                id: item.product_id,
                                name: item.product_name,
                                price: item.unit_price || 0,
                                quantity: item.quantity || 1,
                                unit: item.unit || 'retail',
                                total: item.line_total || 0,
                                price_retail: fullProduct.price_retail || 0,
                                price_wholesale: fullProduct.price_wholesale || 0,
                                price_carton: fullProduct.price_carton || 0,
                                pieces_per_carton: fullProduct.pieces_per_carton || 0,
                                stock: fullProduct.stock || 0
                            };
                        } else {
                            // Fallback si le produit n'est pas trouvé
                            return {
                                id: item.product_id,
                                name: item.product_name,
                                price: item.unit_price || 0,
                                quantity: item.quantity || 1,
                                unit: item.unit || 'retail',
                                total: item.line_total || 0,
                                price_retail: item.unit_price || 0,
                                price_wholesale: item.unit_price || 0,
                                price_carton: item.unit_price || 0,
                                pieces_per_carton: 0,
                                stock: 999
                            };
                        }
                    });

                    // Afficher un message d'information
                    showNotification(`Mode modification activé pour la vente #${data.saleId}`, 'info', 5000);

                    // Mettre à jour l'interface
                    if (editSaleBtn) {
                        editSaleBtn.textContent = `Modifier Vente #${data.saleId}`;
                        editSaleBtn.classList.remove('hidden');
                    }
                }

                // Nettoyer les données du localStorage
                localStorage.removeItem('editSaleData');
            } catch (error) {
                console.error('Erreur lors du chargement des données de modification:', error);
                localStorage.removeItem('editSaleData');
            }
        }

        renderCart();

        // S'assurer que les boutons de paiement sont dans le bon état au démarrage
        updatePaymentButtonsVisibility();

        // Mettre à jour l'affichage du client par défaut
        await updateClientDisplay(selectedClientId);

        // Pas de focus automatique pour éviter les conflits avec les événements clavier

        // Nettoyer les anciens événements avant d'en ajouter de nouveaux
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('paste', handlePaste);

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('paste', handlePaste);
    }
    
    function updateTotals() {
        // Utiliser requestAnimationFrame pour éviter le blocage
        requestAnimationFrame(() => {
            const total = cart.reduce((sum, item) => {
                const quantity = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.price) || 0;
                return sum + (quantity * price);
            }, 0);
            if (totalAmountSpan) totalAmountSpan.textContent = total.toFixed(2);

            // Ne plus afficher automatiquement crédit/rendu ici
            // Ces informations seront gérées dans updatePartialPaymentDisplay()
        });
    }

    // === NOUVELLES FONCTIONS POUR LE WORKFLOW DE PAIEMENT ===

    /**
     * Gère l'affichage des boutons de paiement selon l'état du panier
     */
    function updatePaymentButtonsVisibility() {
        const hasItems = cart.length > 0;

        if (paymentStep1) {
            if (hasItems) {
                paymentStep1.classList.remove('hidden');
            } else {
                paymentStep1.classList.add('hidden');
                // Si on masque l'étape 1, masquer aussi les autres étapes
                if (paymentStep2) paymentStep2.classList.add('hidden');
                if (paymentStep3) paymentStep3.classList.add('hidden');
            }
        }
    }

    /**
     * Affiche l'étape 1 (boutons principaux)
     */
    function showPaymentStep1() {
        if (paymentStep1) paymentStep1.classList.remove('hidden');
        if (paymentStep2) paymentStep2.classList.add('hidden');
        if (paymentStep3) paymentStep3.classList.add('hidden');
    }

    /**
     * Affiche l'étape 2 (choix du type de paiement)
     */
    function showPaymentStep2() {
        if (paymentStep1) paymentStep1.classList.add('hidden');
        if (paymentStep2) paymentStep2.classList.remove('hidden');
        if (paymentStep3) paymentStep3.classList.add('hidden');
        if (paymentStepCash) paymentStepCash.classList.add('hidden');
    }

    /**
     * Affiche l'étape de calcul de rendu pour paiement comptant
     */
    function showPaymentStepCash() {
        if (paymentStep1) paymentStep1.classList.add('hidden');
        if (paymentStep2) paymentStep2.classList.add('hidden');
        if (paymentStep3) paymentStep3.classList.add('hidden');
        if (paymentStepCash) paymentStepCash.classList.remove('hidden');

        // Mettre à jour l'affichage du total
        const total = parseFloat(totalAmountSpan?.textContent) || 0;
        if (cashTotalDisplay) cashTotalDisplay.textContent = `${total.toFixed(2)} MAD`;

        // Réinitialiser le champ de saisie
        if (amountReceivedInput) {
            amountReceivedInput.value = '';
            amountReceivedInput.focus();
        }

        // Mettre à jour l'affichage du rendu
        updateChangeDisplay();
    }

    /**
     * Affiche l'étape 3 (détails pour crédit/partiel)
     */
    function showPaymentStep3() {
        if (paymentStep1) paymentStep1.classList.add('hidden');
        if (paymentStep2) paymentStep2.classList.add('hidden');
        if (paymentStep3) paymentStep3.classList.remove('hidden');
        if (paymentStepCash) paymentStepCash.classList.add('hidden');

        // Mettre à jour les affichages
        updatePartialPaymentDisplay();
    }

    /**
     * Met à jour l'affichage du calcul de rendu pour paiement comptant
     */
    function updateChangeDisplay() {
        const total = parseFloat(totalAmountSpan?.textContent) || 0;
        const amountReceived = parseFloat(amountReceivedInput?.value) || 0;
        const change = amountReceived - total;

        // Masquer tous les affichages
        if (changeDisplayPositive) changeDisplayPositive.classList.add('hidden');
        if (changeDisplayExact) changeDisplayExact.classList.add('hidden');
        if (changeDisplayInsufficient) changeDisplayInsufficient.classList.add('hidden');

        // Désactiver le bouton de confirmation par défaut
        if (confirmCashPaymentBtn) {
            confirmCashPaymentBtn.disabled = true;
            confirmCashPaymentBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
            confirmCashPaymentBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        }

        if (amountReceived === 0) {
            // Aucun montant saisi
            return;
        } else if (change > 0) {
            // Montant supérieur - afficher le rendu
            if (changeDisplayPositive) {
                changeDisplayPositive.classList.remove('hidden');
                if (changeAmountDisplay) changeAmountDisplay.textContent = `${change.toFixed(2)} MAD`;
            }
            // Activer le bouton de confirmation
            if (confirmCashPaymentBtn) {
                confirmCashPaymentBtn.disabled = false;
                confirmCashPaymentBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
                confirmCashPaymentBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            }
        } else if (change === 0) {
            // Montant exact
            if (changeDisplayExact) changeDisplayExact.classList.remove('hidden');
            // Activer le bouton de confirmation
            if (confirmCashPaymentBtn) {
                confirmCashPaymentBtn.disabled = false;
                confirmCashPaymentBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
                confirmCashPaymentBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            }
        } else {
            // Montant insuffisant
            if (changeDisplayInsufficient) {
                changeDisplayInsufficient.classList.remove('hidden');
                if (missingAmountDisplay) missingAmountDisplay.textContent = `${Math.abs(change).toFixed(2)} MAD manquant`;
            }
        }
    }

    /**
     * Définit le montant exact dans le champ de saisie
     */
    function setExactAmount() {
        const total = parseFloat(totalAmountSpan?.textContent) || 0;
        if (amountReceivedInput) {
            amountReceivedInput.value = total.toFixed(2);
            updateChangeDisplay();
        }
    }

    /**
     * Met à jour l'affichage pour le paiement partiel
     */
    function updatePartialPaymentDisplay() {
        const total = parseFloat(totalAmountSpan?.textContent) || 0;
        const amountPaid = parseFloat(amountPaidInput?.value) || 0;
        const credit = Math.max(0, total - amountPaid);
        const balance = amountPaid - total;

        // Mise à jour des affichages dans l'étape 3
        if (totalDisplay) totalDisplay.textContent = `${total.toFixed(2)} MAD`;
        if (creditDisplay) creditDisplay.textContent = `${credit.toFixed(2)} MAD`;

        // Gestion de l'affichage crédit/rendu seulement dans l'étape 3
        if (!paymentStep3.classList.contains('hidden')) {
            if (balance >= 0) {
                if (creditInfoP) creditInfoP.classList.add('hidden');
                if (changeInfoP) {
                    changeInfoP.classList.remove('hidden');
                    changeInfoP.textContent = `${t('change_due')}: ${balance.toFixed(2)} MAD`;
                }
            } else {
                if (creditInfoP) {
                    creditInfoP.classList.remove('hidden');
                    creditInfoP.textContent = `${t('credit')}: ${(-balance).toFixed(2)} MAD`;
                }
                if (changeInfoP) changeInfoP.classList.add('hidden');
            }
        } else {
            // Masquer les informations si on n'est pas dans l'étape 3
            if (creditInfoP) creditInfoP.classList.add('hidden');
            if (changeInfoP) changeInfoP.classList.add('hidden');
        }
    }

    /**
     * Valide et traite le paiement selon le type
     */
    async function processPayment(paymentType) {
        if (cart.length === 0) {
            showNotification(t('cart_is_empty_alert'), 'warning');
            return;
        }

        try {
            switch (paymentType) {
                case 'cash':
                    await processAndValidateSale(true, 'cash');
                    break;
                case 'check':
                    await processAndValidateSale(true, 'check');
                    break;
                case 'credit':
                    await processAndValidateSale(false, 'credit');
                    break;
                default:
                    console.error('Type de paiement inconnu:', paymentType);
            }
        } catch (error) {
            console.error('Erreur lors du traitement du paiement:', error);
            showNotification(t('payment_processing_error') || 'Erreur lors du traitement du paiement', 'error');
        }
    }

    /**
     * Réinitialise le workflow de paiement
     */
    function resetPaymentWorkflow() {
        // Réinitialiser à l'étape 1 seulement si le panier n'est pas vide
        if (cart.length > 0) {
            showPaymentStep1();
        } else {
            // Si le panier est vide, masquer toutes les étapes
            if (paymentStep1) paymentStep1.classList.add('hidden');
            if (paymentStep2) paymentStep2.classList.add('hidden');
            if (paymentStep3) paymentStep3.classList.add('hidden');
            if (paymentStepCash) paymentStepCash.classList.add('hidden');
        }

        if (amountPaidInput) amountPaidInput.value = '0';
        if (amountReceivedInput) amountReceivedInput.value = '';

        // Masquer les informations de crédit/rendu
        if (creditInfoP) creditInfoP.classList.add('hidden');
        if (changeInfoP) changeInfoP.classList.add('hidden');

        // Réinitialiser l'affichage du calcul de rendu
        if (changeDisplayPositive) changeDisplayPositive.classList.add('hidden');
        if (changeDisplayExact) changeDisplayExact.classList.add('hidden');
        if (changeDisplayInsufficient) changeDisplayInsufficient.classList.add('hidden');

        updatePartialPaymentDisplay();
        updatePaymentButtonsVisibility();
    }

    async function renderProducts() {
        if (!productGridDiv || isRendering) return;

        isRendering = true;

        try {
            const searchTerm = productSearchInput.value.toLowerCase();
            const productsToDisplay = allProducts.filter(p => {
                const inCategory = selectedCategory === 'all' || p.category === selectedCategory;
                const matchesSearch = p.name.toLowerCase().includes(searchTerm) || (p.barcode && p.barcode.includes(searchTerm));
                return inCategory && matchesSearch; // Afficher tous les produits, même ceux en rupture
            });

            // Utiliser requestAnimationFrame pour éviter le blocage de l'UI
            await new Promise(resolve => requestAnimationFrame(resolve));

            productGridDiv.innerHTML = '';

            if (productsToDisplay.length === 0) {
                productGridDiv.innerHTML = `<p class="text-center text-gray-500 mt-8 col-span-full">${t('no_product_found')}</p>`;
                return;
            }

            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';

            // Traitement par lots pour éviter le blocage
            const batchSize = 20;
            for (let i = 0; i < productsToDisplay.length; i += batchSize) {
                const batch = productsToDisplay.slice(i, i + batchSize);

                batch.forEach(p => {
                    const card = document.createElement('div');
                    const isOutOfStock = p.stock <= 0;

                    // Classes CSS différentes selon le stock
                    if (isOutOfStock) {
                        card.className = 'bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-3 flex flex-col text-center cursor-not-allowed opacity-60 transition-all relative';
                    } else {
                        card.className = 'bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-3 flex flex-col text-center cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all add-product-btn';
                        card.dataset.productId = p.id;
                    }

                    const imageSrc = p.image_path ? p.image_path : 'assets/placeholder.png';

                    // Contenu différent selon le stock
                    if (isOutOfStock) {
                        card.innerHTML = `
                            <div class="w-full h-20 mb-2 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded relative">
                                <img src="${imageSrc}" alt="${p.name}" class="max-w-full max-h-full object-contain grayscale" onerror="this.src='assets/placeholder.png'">
                                <div class="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-20 rounded">
                                    <span class="text-red-600 font-bold text-xs">RUPTURE</span>
                                </div>
                            </div>
                            <div class="flex-1 product-card-content">
                                <span class="font-bold text-sm text-gray-500 dark:text-gray-400 line-through product-name-truncate-card" title="${p.name}">${p.name}</span>
                            </div>
                            <div class="mt-auto">
                                <span class="text-xs text-red-500 font-semibold">❌ Rupture de stock</span>
                                <p class="font-semibold text-gray-400 dark:text-gray-500">${p.price_retail.toFixed(2)} MAD</p>
                            </div>
                        `;
                    } else {
                        // Couleur du stock selon la quantité
                        let stockColor = 'text-green-600';
                        if (p.stock <= 5) stockColor = 'text-red-600';
                        else if (p.stock <= 10) stockColor = 'text-orange-600';

                        card.innerHTML = `
                            <div class="w-full h-20 mb-2 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded">
                                <img src="${imageSrc}" alt="${p.name}" class="max-w-full max-h-full object-contain" onerror="this.src='assets/placeholder.png'">
                            </div>
                            <div class="flex-1 product-card-content">
                                <span class="font-bold text-sm text-gray-900 dark:text-white product-name-truncate-card" title="${p.name}">${p.name}</span>
                            </div>
                            <div class="mt-auto">
                                <span class="text-xs ${stockColor} font-semibold">Stock: ${p.stock}</span>
                                <p class="font-semibold text-blue-600 dark:text-blue-400">${p.price_retail.toFixed(2)} MAD</p>
                            </div>
                        `;
                    }

                    grid.appendChild(card);
                });

                // Pause entre les lots pour permettre à l'UI de respirer
                if (i + batchSize < productsToDisplay.length) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            productGridDiv.appendChild(grid);
        } finally {
            isRendering = false;
        }
    }
    
    function renderCategories() {
        console.log(`🏷️ Rendu des catégories dropdown : ${categories.length} catégories`);

        const dropdownList = document.getElementById('category-dropdown-list');
        const selectedCategoryText = document.getElementById('selected-category-text');

        if (!dropdownList || !selectedCategoryText) {
            console.error('❌ Éléments dropdown non trouvés');
            return;
        }

        // Vider la liste
        dropdownList.innerHTML = '';

        // Mettre à jour le texte sélectionné
        updateSelectedCategoryText();

        // Créer l'item "Toutes les catégories"
        const allItem = createCategoryDropdownItem('all', t('all_categories') || 'Toutes les catégories');
        dropdownList.appendChild(allItem);

        // Créer les items pour chaque catégorie
        categories.forEach(category => {
            const item = createCategoryDropdownItem(category, category);
            dropdownList.appendChild(item);
        });

        console.log(`✅ ${categories.length + 1} items de catégorie créés dans le dropdown`);
    }

    function createCategoryDropdownItem(categoryValue, categoryLabel) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `category-dropdown-item w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-600 ${
            selectedCategory === categoryValue ? 'selected bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
        }`;
        item.dataset.category = categoryValue;
        item.textContent = categoryLabel;
        item.title = categoryLabel;

        // Event listener pour la sélection
        item.addEventListener('click', () => {
            selectCategory(categoryValue);
        });

        return item;
    }

    function updateSelectedCategoryText() {
        const selectedCategoryText = document.getElementById('selected-category-text');
        if (!selectedCategoryText) return;

        if (selectedCategory === 'all') {
            selectedCategoryText.textContent = t('all_categories') || 'Toutes les catégories';
        } else {
            selectedCategoryText.textContent = selectedCategory;
        }
    }

    async function selectCategory(category) {
        console.log(`📂 Sélection de la catégorie : ${category}`);

        selectedCategory = category;

        // Fermer le dropdown
        closeDropdown();

        // Mettre à jour l'affichage
        updateSelectedCategoryText();

        // Re-rendre les catégories pour mettre à jour les états sélectionnés
        renderCategories();

        // Re-rendre les produits
        await renderProducts();
    }

    function openDropdown() {
        const dropdownMenu = document.getElementById('category-dropdown-menu');
        const chevron = document.getElementById('dropdown-chevron');
        const searchInput = document.getElementById('category-search-input');

        if (dropdownMenu) {
            dropdownMenu.classList.remove('hidden');
            console.log('📂 Dropdown catégories ouvert');
        }

        if (chevron) {
            chevron.classList.add('open');
        }

        // Focus sur le champ de recherche
        if (searchInput) {
            setTimeout(() => {
                searchInput.focus();
            }, 100);
        }
    }

    function closeDropdown() {
        const dropdownMenu = document.getElementById('category-dropdown-menu');
        const chevron = document.getElementById('dropdown-chevron');
        const searchInput = document.getElementById('category-search-input');

        if (dropdownMenu) {
            dropdownMenu.classList.add('hidden');
            console.log('📂 Dropdown catégories fermé');
        }

        if (chevron) {
            chevron.classList.remove('open');
        }

        // Réinitialiser la recherche
        if (searchInput) {
            searchInput.value = '';
            filterCategories('');
        }
    }

    function toggleDropdown() {
        const dropdownMenu = document.getElementById('category-dropdown-menu');

        if (dropdownMenu) {
            if (dropdownMenu.classList.contains('hidden')) {
                openDropdown();
            } else {
                closeDropdown();
            }
        }
    }

    function filterCategories(searchTerm) {
        const dropdownList = document.getElementById('category-dropdown-list');
        const noResultsMessage = document.getElementById('no-results-message');
        const clearButton = document.getElementById('clear-search');

        if (!dropdownList) return;

        const items = dropdownList.querySelectorAll('.category-dropdown-item');
        let visibleCount = 0;

        // Afficher/masquer le bouton de nettoyage
        if (clearButton) {
            if (searchTerm.length > 0) {
                clearButton.classList.remove('hidden');
            } else {
                clearButton.classList.add('hidden');
            }
        }

        items.forEach(item => {
            const categoryName = item.textContent.toLowerCase();
            const matches = categoryName.includes(searchTerm.toLowerCase());

            if (matches) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Afficher/masquer le message "aucun résultat"
        if (noResultsMessage) {
            if (visibleCount === 0 && searchTerm.length > 0) {
                noResultsMessage.classList.remove('hidden');
            } else {
                noResultsMessage.classList.add('hidden');
            }
        }

        console.log(`🔍 Recherche "${searchTerm}" : ${visibleCount} catégories trouvées`);
    }
    
    async function resetSale() {
        console.log('🔄 Réinitialisation de la vente...');

        cart = [];
        selectedClientId = 1;
        if(clientSearchInput) clientSearchInput.value = '';
        if(clientSearchResultsDiv) clientSearchResultsDiv.classList.add('hidden');

        // Mettre à jour l'affichage du client avec la nouvelle fonction
        await updateClientDisplay(selectedClientId);

        if(amountPaidInput) amountPaidInput.value = '';
        if(productSearchInput) productSearchInput.value = '';
        selectedCategory = 'all';

        // CORRECTION: Réinitialiser le champ code-barres et les variables associées
        const barcodeInput = document.getElementById('barcodeInput');
        if (barcodeInput) {
            barcodeInput.value = '';
            console.log('✅ Champ code-barres réinitialisé');
        }

        // Réinitialiser TOUTES les variables du scanner
        barcodeBuffer = '';
        lastKeyTime = 0;
        isScanning = false;
        isProcessingBarcode = false; // IMPORTANT: Libérer le verrou du scanner
        lastProcessedBarcode = '';
        lastProcessedTime = 0;

        if (barcodeTimer) {
            clearTimeout(barcodeTimer);
            barcodeTimer = null;
        }
        if (scannerTimeout) {
            clearTimeout(scannerTimeout);
            scannerTimeout = null;
        }

        console.log('✅ Variables scanner réinitialisées (isProcessingBarcode: false)');

        // Réinitialiser les variables globales d'état
        isRendering = false;
        isProcessing = false;
        isUserTyping = false;

        console.log('✅ Variables globales d\'état réinitialisées');

        // Réinitialiser le statut du scanner
        updateScannerStatus('ready');

        // Masquer le feedback du scanner
        const scannerFeedback = document.getElementById('scannerFeedback');
        if (scannerFeedback) {
            scannerFeedback.classList.add('hidden');
        }

        // Réinitialiser le workflow de paiement
        resetPaymentWorkflow();

        // Cacher le bouton de génération de bon de livraison
        hideDeliveryNoteButton();

        if (!editMode) {
            await renderProducts();
        }
        renderCategories();
        renderCart();

        // CORRECTION: Remettre le focus sur le scanner après un délai
        setTimeout(() => {
            if (barcodeInput && !document.activeElement.matches('input, textarea, select')) {
                barcodeInput.focus();
                console.log('✅ Focus remis sur le scanner');
            }
        }, 500);

        console.log('✅ Réinitialisation terminée');
    }
    
    function startCountdown(duration) { let timer = duration; countdownInterval = setInterval(() => { const minutes = Math.floor(timer / 60); const seconds = timer % 60; if(countdownSpan) countdownSpan.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; if (--timer < 0) { clearInterval(countdownInterval); if(editSaleBtn) { editSaleBtn.disabled = true; editSaleBtn.classList.add('opacity-50', 'cursor-not-allowed'); } if(countdownSpan) countdownSpan.textContent = t('expired'); } }, 1000); }
    
    function showLastSalePanel(saleId) { if (countdownInterval) clearInterval(countdownInterval); if(lastSaleIdSpan) lastSaleIdSpan.textContent = `#${saleId}`; originalSaleId = saleId; if(lastSalePanel) lastSalePanel.classList.remove('hidden'); if(editSaleBtn) { editSaleBtn.disabled = false; editSaleBtn.classList.remove('opacity-50', 'cursor-not-allowed'); } startCountdown(300); }
    
    function hideLastSalePanel() { if (countdownInterval) clearInterval(countdownInterval); if(lastSalePanel) lastSalePanel.classList.add('hidden'); }
    
    async function enterEditMode() {
        if (!originalSaleId) return;
        try {
            const saleDetails = await window.api.sales.getDetails(originalSaleId);
            if (!saleDetails) {
                showNotification(t('edit_details_error'), 'error');
                return;
            }
            editMode = true;
            editWorkflowStep = 'products'; // Commencer par l'étape produits

            // Stocker les données originales pour référence
            originalSaleData = {
                client_id: saleDetails.client_id,
                client_name: saleDetails.client_name,
                total_amount: saleDetails.total_amount,
                amount_paid_cash: saleDetails.amount_paid_cash,
                amount_paid_credit: saleDetails.amount_paid_credit,
                payment_method: saleDetails.amount_paid_credit > 0 ? 'credit' : 'cash' // Déduire la méthode
            };
            cart = await Promise.all(saleDetails.items.map(async item => {
                const productInfo = allProducts.find(p => p.id === item.product_id);
                const originalStock = (productInfo ? productInfo.stock : 0) + item.quantity;

                // Déterminer l'unité basée sur le prix unitaire
                let unit = 'retail'; // par défaut
                if (productInfo) {
                    if (Math.abs(item.unit_price - productInfo.price_wholesale) < 0.01) {
                        unit = 'wholesale';
                    } else if (Math.abs(item.unit_price - productInfo.price_carton) < 0.01) {
                        unit = 'carton';
                    }
                }

                return {
                    id: item.product_id,
                    name: item.product_name,
                    quantity: item.quantity,
                    price: item.unit_price,
                    unit: unit,
                    price_retail: productInfo ? productInfo.price_retail : item.unit_price,
                    price_wholesale: productInfo ? productInfo.price_wholesale : item.unit_price,
                    price_carton: productInfo ? productInfo.price_carton : item.unit_price,
                    pieces_per_carton: productInfo ? productInfo.pieces_per_carton : 0,
                    stock: originalStock
                };
            }));
            selectedClientId = saleDetails.client_id;
            await updateClientDisplay(selectedClientId, saleDetails.client_name);
            if(amountPaidInput) amountPaidInput.value = saleDetails.amount_paid_cash.toFixed(2);

            // Adapter l'interface pour l'étape produits du mode édition
            if(validatePaymentBtn) {
                validatePaymentBtn.textContent = t('continue_to_payment_button') || '→ Continuer vers Paiement';
                validatePaymentBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                validatePaymentBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            }

            // Afficher seulement l'étape 1 pour la modification des produits
            showPaymentStep1();
            hideLastSalePanel();
            renderCart();

            // Message d'aide pour le nouveau workflow
            showNotification(
                'Mode modification : Modifiez d\'abord les produits, puis cliquez sur "Continuer vers Paiement" pour corriger la méthode de paiement.',
                'info',
                5000
            );
        } catch (error) {
            console.error("Erreur lors du passage en mode édition:", error);
            showNotification(t('edit_mode_error'), 'error');
        }
    }
    
    function exitEditMode() {
        editMode = false;
        originalSaleId = null;
        editWorkflowStep = 'products';
        originalSaleData = null;

        // Restaurer l'interface normale
        if(validatePaymentBtn) {
            validatePaymentBtn.textContent = t('validate_payment_button') || '✓ Valider Paiement';
            validatePaymentBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            validatePaymentBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            validatePaymentBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
        }

        // Nettoyer les indicateurs de paiement
        document.querySelectorAll('.current-payment-indicator').forEach(el => el.remove());

        resetSale();
    }

    /**
     * Met à jour l'affichage du client sélectionné avec son crédit
     */
    async function updateClientDisplay(clientId, clientName = null) {
        try {
            if (clientId === 1) {
                // Client de passage
                if (selectedClientDisplay) selectedClientDisplay.textContent = t('default_client');
                if (clientCreditBadge) clientCreditBadge.classList.add('hidden');
                if (selectedClientContainer) {
                    selectedClientContainer.className = 'flex-shrink-0 text-center bg-blue-50 dark:bg-blue-900/60 p-2 rounded-lg min-w-[150px] transition-colors duration-200';
                }
                if (selectedClientDisplay) {
                    selectedClientDisplay.className = 'font-bold text-blue-800 dark:text-blue-200 truncate flex-1';
                }
                return;
            }

            // Récupérer les informations du client
            const client = await window.api.clients.getById(clientId);
            if (!client) return;

            // Récupérer le crédit du client
            const creditAmount = await window.api.credits.getClientCredit(clientId);

            // Mettre à jour le nom du client
            const displayName = clientName || client.name;
            if (selectedClientDisplay) selectedClientDisplay.textContent = displayName;

            // Mettre à jour l'affichage selon le crédit
            if (creditAmount > 0) {
                // Client avec crédit (dette) - thème rouge
                if (selectedClientContainer) {
                    selectedClientContainer.className = 'flex-shrink-0 text-center bg-red-50 dark:bg-red-900/60 p-2 rounded-lg min-w-[150px] transition-colors duration-200';
                }
                if (selectedClientDisplay) {
                    selectedClientDisplay.className = 'font-bold text-red-800 dark:text-red-200 truncate flex-1';
                }
                if (clientCreditBadge) {
                    clientCreditBadge.textContent = `🔴 ${creditAmount.toFixed(2)} MAD`;
                    clientCreditBadge.className = 'text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
                    clientCreditBadge.classList.remove('hidden');
                }
            } else {
                // Client à jour - thème vert
                if (selectedClientContainer) {
                    selectedClientContainer.className = 'flex-shrink-0 text-center bg-green-50 dark:bg-green-900/60 p-2 rounded-lg min-w-[150px] transition-colors duration-200';
                }
                if (selectedClientDisplay) {
                    selectedClientDisplay.className = 'font-bold text-green-800 dark:text-green-200 truncate flex-1';
                }
                if (clientCreditBadge) {
                    clientCreditBadge.textContent = `✅ ${t('client_up_to_date')}`;
                    clientCreditBadge.className = 'text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
                    clientCreditBadge.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'affichage client:', error);
        }
    }

    /**
     * Passe à l'étape paiement en mode édition
     */
    function proceedToPaymentStep() {
        if (!editMode) return;

        editWorkflowStep = 'payment';

        // Changer l'interface pour l'étape paiement
        if(validatePaymentBtn) {
            validatePaymentBtn.textContent = t('validate_payment_button') || '✓ Valider Paiement';
            validatePaymentBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            validatePaymentBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        }

        // Passer à l'étape 2 du workflow de paiement
        showPaymentStep2();

        // Pré-remplir les données de paiement si disponibles
        if (originalSaleData && amountPaidInput) {
            amountPaidInput.value = originalSaleData.amount_paid_cash.toFixed(2);
        }

        // Ajouter une indication visuelle de la méthode actuelle
        addPaymentMethodIndicator();

        showNotification(t('edit_payment_step_info') || 'Choisissez la méthode de paiement pour cette vente', 'info', 3000);
    }

    /**
     * Retourne à l'étape produits en mode édition
     */
    function backToProductsStep() {
        if (!editMode) return;

        editWorkflowStep = 'products';

        // Restaurer l'interface pour l'étape produits
        if(validatePaymentBtn) {
            validatePaymentBtn.textContent = t('continue_to_payment_button') || '→ Continuer vers Paiement';
            validatePaymentBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            validatePaymentBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }

        // Retourner à l'étape 1
        showPaymentStep1();
    }

    /**
     * Ajoute une indication visuelle de la méthode de paiement actuelle
     */
    function addPaymentMethodIndicator() {
        if (!editMode || !originalSaleData) return;

        // Supprimer les anciens indicateurs
        document.querySelectorAll('.current-payment-indicator').forEach(el => el.remove());

        // Déterminer la méthode actuelle
        let currentMethod = 'cash';
        if (originalSaleData.amount_paid_credit > 0) {
            currentMethod = 'credit';
        }

        // Ajouter l'indicateur sur le bon bouton
        let targetButton = null;
        if (currentMethod === 'cash' && cashPaymentBtn) {
            targetButton = cashPaymentBtn;
        } else if (currentMethod === 'credit' && creditPaymentBtn) {
            targetButton = creditPaymentBtn;
        }

        if (targetButton) {
            const indicator = document.createElement('span');
            indicator.className = 'current-payment-indicator absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full';
            indicator.textContent = 'Actuel';
            indicator.style.position = 'absolute';
            indicator.style.fontSize = '10px';
            indicator.style.zIndex = '10';

            // Positionner le bouton en relatif pour l'indicateur
            targetButton.style.position = 'relative';
            targetButton.appendChild(indicator);
        }
    }

    async function processAndValidateSale(isCashOnly = false, paymentType = 'cash') {
        if (cart.length === 0) {
            showNotification(t('cart_is_empty_alert'), 'warning');
            return;
        }

        if (isProcessing) {
            console.log('Vente déjà en cours de traitement...');
            return;
        }

        isProcessing = true;
        setInputsState(true);

        try {
            const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
            let amountPaidCash = 0;
            let credit = 0;

            // Gestion selon le type de paiement
            switch (paymentType) {
                case 'cash':
                    amountPaidCash = total;
                    credit = 0;
                    // Stocker le montant reçu pour l'impression du ticket
                    if (amountReceivedInput && amountReceivedInput.value) {
                        const amountReceived = parseFloat(amountReceivedInput.value) || total;
                        // Stocker dans une variable globale pour l'impression
                        window.lastCashPaymentData = {
                            amountReceived: amountReceived,
                            change: amountReceived - total
                        };
                    }
                    break;
                case 'check':
                    amountPaidCash = total;
                    credit = 0;
                    break;
                case 'credit':
                    amountPaidCash = parseFloat(amountPaidInput.value) || 0;
                    credit = Math.max(0, total - amountPaidCash);
                    break;
                default:
                    // Fallback vers l'ancienne logique
                    if (isCashOnly) {
                        amountPaidCash = total;
                        credit = 0;
                    } else {
                        amountPaidCash = parseFloat(amountPaidInput.value) || 0;
                        credit = Math.max(0, total - amountPaidCash);
                    }
            }

            // Validation pour les crédits
            if (credit > 0 && selectedClientId === 1) {
                showNotification(t('credit_for_default_client_error'), 'error');
                return;
            }

            // Validation pour les montants négatifs
            if (amountPaidCash < 0) {
                showNotification('Le montant payé ne peut pas être négatif', 'error');
                return;
            }

            // Validation pour les paiements partiels supérieurs au total
            if (paymentType === 'credit' && amountPaidCash > total) {
                showNotification('Le montant payé ne peut pas être supérieur au total', 'error');
                return;
            }

            const saleCart = cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                unit: item.unit,
                purchase_price: allProducts.find(p => p.id === item.id)?.purchase_price || 0
            }));

            const saleData = {
                clientId: selectedClientId,
                cart: saleCart,
                total,
                amountPaidCash,
                credit,
                paymentMethod: paymentType
            };

            let result;
            if (editMode) {
                // Vérifier qu'on est bien dans l'étape paiement
                if (editWorkflowStep !== 'payment') {
                    showNotification('Erreur: Vous devez d\'abord passer à l\'étape paiement', 'error');
                    return;
                }

                // Mode modification : mettre à jour la vente existante
                result = await window.api.sales.edit({
                    originalSaleId: originalSaleId,
                    newSaleData: saleData
                });
            } else {
                // Mode normal : créer une nouvelle vente
                result = await window.api.sales.process(saleData);
            }

            if (result && result.success) {
                // Préparer les données pour l'impression avec le numéro de ticket de la base de données
                console.log('Résultat de la vente:', result);
                console.log('Données de vente originales pour impression:', saleData);

                // Ajouter le ticketNumber du résultat aux données de vente
                const saleDataWithTicket = {
                    ...saleData,
                    ticketNumber: result.ticketNumber,
                    saleId: result.saleId
                };

                const printData = await prepareSaleDataForPrint(saleDataWithTicket);
                console.log('Données préparées pour impression avec ticket:', printData);

                if (editMode) {
                    showNotification(t('sale_corrected_success').replace('%s', result.saleId), 'success');
                    // Réinitialiser les variables du mode édition
                    editMode = false;
                    editWorkflowStep = 'products';
                    originalSaleData = null;
                    originalSaleId = null;
                } else {
                    showNotification(t('sale_processed_success').replace('%s', result.saleId), 'success');
                }

                // IMPORTANT: Sauvegarder les données AVANT de vider le panier
                lastSaleData = printData;
                console.log('💾 Données de vente sauvegardées avant réinitialisation:', lastSaleData);

                // Réinitialiser d'abord (mais sans masquer le bouton d'impression)
                resetSale();
                resetPaymentWorkflow();

                // Puis afficher le panneau de dernière vente
                showLastSalePanel(result.saleId);

                // Enfin afficher le bouton d'impression
                showPrintSection(printData);

                // Afficher le bouton de génération de bon de livraison
                showDeliveryNoteButton();

                // Mettre à jour l'affichage du client après la vente (le crédit peut avoir changé)
                await updateClientDisplay(selectedClientId);

                // Recharger les produits de manière asynchrone
                setTimeout(async () => {
                    allProducts = await window.api.products.getAll();
                    await renderProducts();
                    if (window.updateStockAlertBadge) window.updateStockAlertBadge();
                }, 100);
            } else {
                throw new Error(result.error || t('sale_failed_unknown'));
            }
        } catch (error) {
            console.error(t('validation_error'), error);
            showNotification(`Erreur: ${error.message}`, 'error');
        } finally {
            isProcessing = false;
            // Réactiver les champs avec un délai
            setTimeout(() => {
                setInputsState(false);
            }, 200);
        }
    }

    // --- Écouteurs d'événements (logique originale avec vérifications de sécurité) ---
    if (cartItemsTbody) {
        cartItemsTbody.addEventListener('change', e => {
            if (e.target.classList.contains('quantity-input') || e.target.classList.contains('price-input')) {
                const row = e.target.closest('tr'); if (!row) return;
                const productId = parseInt(row.dataset.productId);
                const activeBtn = row.querySelector('.set-price-btn.bg-blue-600'); if (!activeBtn) return;
                const itemIndex = cart.findIndex(i => i.id === productId && i.unit === activeBtn.dataset.priceType);
                if (itemIndex === -1) return;
                const item = cart[itemIndex];
                const newQuantity = parseInt(row.querySelector('.quantity-input').value);
                if (isNaN(newQuantity) || newQuantity < 1) { item.quantity = 1; } 
                else if (newQuantity > item.stock) { showNotification(t('stock_max_reached'), 'warning'); item.quantity = item.stock; }
                else { item.quantity = newQuantity; }
                const newPrice = parseFloat(row.querySelector('.price-input').value);
                if (!isNaN(newPrice) && newPrice >= 0) { item.price = newPrice; }
                renderCart();
            }
        });

        cartItemsTbody.addEventListener('click', e => {
            const row = e.target.closest('tr'); if (!row) return;
            const productId = parseInt(row.dataset.productId);
            const activeBtn = row.querySelector('.set-price-btn.bg-blue-600');
            if (!activeBtn) { if (e.target.classList.contains('remove-item-btn')) { const itemIndex = cart.findIndex(i => i.id === productId); if (itemIndex > -1) cart.splice(itemIndex, 1); renderCart(); } return; }
            const currentUnit = activeBtn.dataset.priceType;
            const itemIndex = cart.findIndex(i => i.id === productId && i.unit === currentUnit);
            if (e.target.classList.contains('remove-item-btn')) {
                if (itemIndex > -1) cart.splice(itemIndex, 1);
                renderCart();
            } else if (e.target.classList.contains('set-price-btn')) {
                if (itemIndex > -1) {
                    const item = cart[itemIndex]; item.unit = e.target.dataset.priceType;
                    if (item.unit === 'retail') item.price = item.price_retail;
                    else if (item.unit === 'wholesale') item.price = item.price_wholesale;
                    else if (item.unit === 'carton') item.price = item.price_carton;
                }
                renderCart();
            }
        });
    }
    
    if (quickAddClientBtn) quickAddClientBtn.addEventListener('click', openAddClientModal);
    if (cancelAddClientBtn) cancelAddClientBtn.addEventListener('click', closeAddClientModal);
    if (addClientForm) addClientForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const clientData = {
            name: document.getElementById('modal_client_name').value.trim(),
            phone: document.getElementById('modal_client_phone').value.trim(),
            ice: document.getElementById('modal_client_ice').value.trim(),
            address: document.getElementById('modal_client_address').value.trim()
        };

        if (!clientData.name) {
            // Afficher l'erreur dans la modal au lieu d'un alert bloquant
            const nameInput = document.getElementById('modal_client_name');
            if (nameInput) {
                nameInput.style.borderColor = 'red';
                // Pas de focus automatique pour éviter les conflits avec les événements clavier
            }
            showNotification("Le nom du client est obligatoire.", 'error');
            return;
        }

        // Empêcher les soumissions multiples
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (submitButton && submitButton.disabled) {
            return; // Déjà en cours de traitement
        }

        // Désactiver le bouton pendant le traitement
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Ajout...';
        }

        try {
            await handleCaisseClientAdd(clientData, submitButton);
        } catch (error) {
            console.error('Erreur lors de l\'ajout du client:', error);
            showNotification(`L'ajout du client a échoué: ${error.message}`, 'error');
        } finally {
            // Réactiver le bouton
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Ajouter';
            }
        }
    });
    
    // Ajouter des protections spécifiques pour tous les inputs
    function protectInput(input) {
        if (!input) return;

        input.addEventListener('focus', () => {
            isUserTyping = true;
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                isUserTyping = false;
            }, 100);
        });

        input.addEventListener('keydown', (e) => {
            e.stopPropagation(); // Empêcher la propagation vers les gestionnaires globaux
        });

        input.addEventListener('keyup', (e) => {
            e.stopPropagation();
        });

        input.addEventListener('input', (e) => {
            e.stopPropagation();
        });
    }

    // Protéger tous les inputs
    protectInput(productSearchInput);
    protectInput(amountPaidInput);
    protectInput(clientSearchInput);
    protectInput(document.getElementById('modal_client_name'));
    protectInput(document.getElementById('modal_client_phone'));
    protectInput(document.getElementById('modal_client_ice'));
    protectInput(document.getElementById('modal_client_address'));
    protectInput(document.getElementById('barcodeInput'));

    if (productSearchInput) productSearchInput.addEventListener('input', debounce(async () => await renderProducts(), 500));

    // Event listeners pour le scanner code-barres
    const barcodeInput = document.getElementById('barcodeInput');
    if (barcodeInput) {
        // SUPPRIMÉ: Event listener 'input' pour éviter les appels multiples
        // Seul le traitement sur Enter est conservé pour plus de contrôle

        // Traitement de la touche Entrée
        barcodeInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const barcode = e.target.value.trim();
                if (barcode.length > 0) {
                    console.log('🔍 Scan manuel via Enter:', barcode);
                    await processBarcodeInput(barcode);
                    // Vider le champ immédiatement après traitement
                    e.target.value = '';
                }
            }
        });

        // Détection automatique avec timeout pour éviter les traitements prématurés
        let inputTimeout = null;
        barcodeInput.addEventListener('input', async (e) => {
            const currentValue = e.target.value.trim();

            // Annuler le timeout précédent
            if (inputTimeout) {
                clearTimeout(inputTimeout);
            }

            // Si le champ contient un code-barres potentiel, attendre un peu avant de traiter
            if (currentValue.length >= 8) {
                inputTimeout = setTimeout(async () => {
                    console.log('📱 Détection scan automatique dans input:', currentValue);

                    // Traiter le code-barres (simple ou multiple)
                    await handleBarcodeInput(currentValue, e.target);
                }, 100); // Attendre 100ms pour s'assurer que la saisie est terminée
            }
        });

        // Focus automatique sur le champ scanner quand on arrive sur la page
        setTimeout(() => {
            if (barcodeInput && document.activeElement !== barcodeInput) {
                barcodeInput.focus();
            }
        }, 500);
    }

    // Fonction pour gérer les codes-barres simples et multiples
    async function handleBarcodeInput(inputValue, inputElement) {
        try {
            console.log('🔍 Analyse de l\'input:', inputValue, 'longueur:', inputValue.length);

            const possibleCodes = [];

            // Détecter si c'est probablement des codes multiples concaténés
            if (inputValue.length > 20) {
                console.log('🔍 Détection possible de codes multiples:', inputValue.length, 'caractères');

                // Essayer de séparer en codes de 13 caractères (EAN-13 standard)
                for (let i = 0; i < inputValue.length; i += 13) {
                    const code = inputValue.substring(i, i + 13);
                    if (code.length >= 8) {
                        possibleCodes.push(code);
                    }
                }

                // Si ça ne donne pas de bons résultats, essayer 12 caractères (UPC-A)
                if (possibleCodes.length === 0 || possibleCodes.some(code => code.length < 10)) {
                    possibleCodes.length = 0;
                    for (let i = 0; i < inputValue.length; i += 12) {
                        const code = inputValue.substring(i, i + 12);
                        if (code.length >= 8) {
                            possibleCodes.push(code);
                        }
                    }
                }
            } else {
                // Code unique
                possibleCodes.push(inputValue);
            }

            console.log('📱 Codes détectés:', possibleCodes);

            // Traiter chaque code séparément
            for (let i = 0; i < possibleCodes.length; i++) {
                const code = possibleCodes[i];
                if (code.length >= 8) {
                    console.log(`🔍 Traitement code ${i + 1}/${possibleCodes.length}:`, code);
                    await processBarcodeInput(code);

                    // Petit délai entre les traitements pour éviter les conflits
                    if (i < possibleCodes.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            }

            // Vider le champ après traitement complet
            if (inputElement) {
                setTimeout(() => {
                    inputElement.value = '';
                    inputElement.focus();
                }, 200);
            }

        } catch (error) {
            console.error('❌ Erreur lors du traitement de l\'input:', error);
        }
    }

    // Event listener global simplifié pour rediriger vers le scanner
    document.addEventListener('keydown', (e) => {
        // Si on tape rapidement et que ce n'est pas dans un input, rediriger vers le scanner
        if (!e.target.matches('input, textarea, select') && e.key.match(/[0-9a-zA-Z]/)) {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime;

            // Si frappe rapide, rediriger vers le champ scanner
            if (timeDiff < 100 && barcodeInput && document.activeElement !== barcodeInput) {
                console.log('🔄 Redirection vers scanner, caractère:', e.key);
                barcodeInput.focus();
                // Laisser l'événement se propager normalement vers le champ input
            }

            lastKeyTime = currentTime;
        }
    });
    // Event listeners pour l'ancien système de catégories (conservé pour compatibilité)
    if (categoryFiltersDiv) categoryFiltersDiv.addEventListener('click', async e => { if (e.target.tagName === 'BUTTON') { selectedCategory = e.target.dataset.category; renderCategories(); await renderProducts(); } });

    // Event listeners pour le nouveau dropdown de catégories
    if (categoryDropdownButton) {
        categoryDropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown();
        });
    }

    // Recherche dans les catégories
    if (categorySearchInput) {
        categorySearchInput.addEventListener('input', (e) => {
            filterCategories(e.target.value);
        });

        categorySearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDropdown();
            }
        });
    }

    // Bouton de nettoyage de la recherche
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', () => {
            if (categorySearchInput) {
                categorySearchInput.value = '';
                filterCategories('');
                categorySearchInput.focus();
            }
        });
    }

    // Fermer le dropdown en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
        if (categoryDropdownMenu && !categoryDropdownMenu.contains(e.target) && !categoryDropdownButton?.contains(e.target)) {
            closeDropdown();
        }
    });

    // Navigation clavier dans le dropdown
    if (categoryDropdownMenu) {
        categoryDropdownMenu.addEventListener('keydown', (e) => {
            const items = categoryDropdownMenu.querySelectorAll('.category-dropdown-item:not([style*="display: none"])');
            const currentFocus = document.activeElement;
            const currentIndex = Array.from(items).indexOf(currentFocus);

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                    items[nextIndex]?.focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                    items[prevIndex]?.focus();
                    break;
                case 'Escape':
                    closeDropdown();
                    categoryDropdownButton?.focus();
                    break;
            }
        });
    }
    if (productGridDiv) productGridDiv.addEventListener('click', e => { const card = e.target.closest('.add-product-btn'); if (card) { addProductToCart(parseInt(card.dataset.productId)); } });
    if (amountPaidInput) amountPaidInput.addEventListener('input', updatePartialPaymentDisplay);
    if (clientSearchInput) clientSearchInput.addEventListener('input', debounce(async () => { const searchTerm = clientSearchInput.value; if (searchTerm.length < 2) { if(clientSearchResultsDiv) clientSearchResultsDiv.classList.add('hidden'); return; } try { const clients = await window.api.clients.getAll(searchTerm); if(clientSearchResultsDiv) clientSearchResultsDiv.innerHTML = ''; if (clients.length > 0) { clients.forEach(c => { const itemDiv = document.createElement('div'); itemDiv.className = 'search-result-item p-2 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer'; itemDiv.textContent = `${c.name} (${c.phone || 'N/A'})`; itemDiv.dataset.clientId = c.id; itemDiv.dataset.clientName = c.name; clientSearchResultsDiv.appendChild(itemDiv); }); clientSearchResultsDiv.classList.remove('hidden'); } else { clientSearchResultsDiv.classList.add('hidden'); } } catch (error) { console.error("Erreur pendant la recherche de client:", error); } }, 300));
    if (clientSearchResultsDiv) clientSearchResultsDiv.addEventListener('click', async e => {
        if (e.target.classList.contains('search-result-item')) {
            selectedClientId = parseInt(e.target.dataset.clientId);
            await updateClientDisplay(selectedClientId, e.target.dataset.clientName);
            clientSearchInput.value = '';
            clientSearchResultsDiv.classList.add('hidden');
            /* Pas de focus automatique pour éviter les conflits */
        }
    });
    if (setTotalBtn) setTotalBtn.addEventListener('click', () => { const total = parseFloat(totalAmountSpan.textContent) || 0; amountPaidInput.value = total.toFixed(2); updatePartialPaymentDisplay(); });
    if (cancelSaleBtn) cancelSaleBtn.addEventListener('click', () => { if (editMode) { exitEditMode(); } else { resetSale(); } hideLastSalePanel(); });

    // === NOUVEAUX EVENT LISTENERS POUR LE WORKFLOW DE PAIEMENT ===

    // Étape 1: Valider paiement
    if (validatePaymentBtn) validatePaymentBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification(t('cart_is_empty_alert'), 'warning');
            return;
        }

        // En mode édition, gérer selon l'étape du workflow
        if (editMode) {
            if (editWorkflowStep === 'products') {
                // Étape produits : passer à l'étape paiement
                proceedToPaymentStep();
                return;
            } else if (editWorkflowStep === 'payment') {
                // Étape paiement : traiter la correction (sera géré par les boutons de paiement)
                showPaymentStep2();
                return;
            }
        }

        // En mode normal, passer à l'étape 2
        showPaymentStep2();
    });

    // Étape 2: Types de paiement
    if (cashPaymentBtn) cashPaymentBtn.addEventListener('click', () => {
        // Aller à l'étape de calcul de rendu pour paiement comptant
        showPaymentStepCash();
    });
    if (checkPaymentBtn) checkPaymentBtn.addEventListener('click', () => processPayment('check'));
    if (creditPaymentBtn) creditPaymentBtn.addEventListener('click', () => {
        if (selectedClientId === 1) {
            showNotification(t('credit_for_default_client_error'), 'error');
            return;
        }
        showPaymentStep3();
    });

    // Étape 3: Confirmation paiement partiel
    if (confirmPartialBtn) confirmPartialBtn.addEventListener('click', () => processPayment('credit'));

    // Boutons de retour
    if (backToStep1Btn) backToStep1Btn.addEventListener('click', () => {
        if (editMode && editWorkflowStep === 'payment') {
            // En mode édition, retourner à l'étape produits
            backToProductsStep();
        } else {
            // Mode normal
            showPaymentStep1();
        }
    });

    if (backToStep2Btn) backToStep2Btn.addEventListener('click', showPaymentStep2);
    if (editSaleBtn) editSaleBtn.addEventListener('click', enterEditMode);

    // Event listeners pour le calcul de rendu
    if (amountReceivedInput) {
        amountReceivedInput.addEventListener('input', updateChangeDisplay);
        amountReceivedInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !confirmCashPaymentBtn.disabled) {
                e.preventDefault();
                processPayment('cash');
            }
        });
    }

    if (confirmCashPaymentBtn) {
        confirmCashPaymentBtn.addEventListener('click', () => processPayment('cash'));
    }

    if (backToPaymentTypesBtn) {
        backToPaymentTypesBtn.addEventListener('click', showPaymentStep2);
    }

    if (exactAmountBtn) {
        exactAmountBtn.addEventListener('click', setExactAmount);
    }
    document.addEventListener('click', (e) => { const clientSearchContainer = document.getElementById('clientSearchContainer'); if (clientSearchContainer && !clientSearchContainer.contains(e.target)) { if (clientSearchResultsDiv) clientSearchResultsDiv.classList.add('hidden'); } });

    // Event listeners pour l'impression
    const printTicketBtn = document.getElementById('print-ticket-btn');
    if (printTicketBtn) {
        printTicketBtn.addEventListener('click', openPrintModal);
    }

    // Event listener pour la génération de bon de livraison
    const generateDeliveryNoteBtn = document.getElementById('generate-delivery-note-btn');
    if (generateDeliveryNoteBtn) {
        generateDeliveryNoteBtn.addEventListener('click', generateDeliveryNoteFromSale);
    }

    // Event listener pour le nouveau bouton bon de livraison
    const deliveryNoteBtn = document.getElementById('delivery-note-btn');
    if (deliveryNoteBtn) {
        deliveryNoteBtn.addEventListener('click', showDeliveryClientModal);
    }

    // Event listeners pour le modal de sélection client
    const closeDeliveryClientModal = document.getElementById('closeDeliveryClientModal');
    const cancelDeliveryBtn = document.getElementById('cancelDeliveryBtn');
    const confirmDeliveryBtn = document.getElementById('confirmDeliveryBtn');

    if (closeDeliveryClientModal) {
        closeDeliveryClientModal.addEventListener('click', hideDeliveryClientModal);
    }
    if (cancelDeliveryBtn) {
        cancelDeliveryBtn.addEventListener('click', hideDeliveryClientModal);
    }
    if (confirmDeliveryBtn) {
        confirmDeliveryBtn.addEventListener('click', createDeliveryNoteFromCaisse);
    }



    const closePrintModalBtn = document.getElementById('closePrintModal');
    if (closePrintModalBtn) {
        closePrintModalBtn.addEventListener('click', closePrintModal);
    }

    const cancelPrintBtn = document.getElementById('cancelPrintBtn');
    if (cancelPrintBtn) {
        cancelPrintBtn.addEventListener('click', closePrintModal);
    }

    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', async () => {
            try {
                closePrintModal();
                if (window.ticketPrinter) {
                    await window.ticketPrinter.exportToPDF();
                } else {
                    console.error('TicketPrinter non disponible pour PDF');
                    showNotification('Erreur: Système d\'impression non disponible', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'export PDF:', error);
                showNotification('Erreur lors de l\'export PDF', 'error');
            }
        });
    }

    const directPrintBtn = document.getElementById('directPrintBtn');
    if (directPrintBtn) {
        directPrintBtn.addEventListener('click', async () => {
            try {
                closePrintModal();
                if (window.ticketPrinter) {
                    await window.ticketPrinter.printDirect();
                } else {
                    console.error('TicketPrinter non disponible pour impression');
                    showNotification('Erreur: Système d\'impression non disponible', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de l\'impression directe:', error);
                showNotification('Erreur lors de l\'impression', 'error');
            }
        });
    }

    // Fermer le modal en cliquant à l'extérieur
    const printModal = document.getElementById('printModal');
    if (printModal) {
        printModal.addEventListener('click', (e) => {
            if (e.target === printModal) {
                closePrintModal();
            }
        });
    }

    // --- Fonctions de gestion des validations clients pour la caisse ---

    // Gérer l'ajout d'un client avec validation dans la caisse
    async function handleCaisseClientAdd(clientData, submitButton) {
        try {
            const newClient = await window.api.clients.add(clientData);
            if (newClient && newClient.id) {
                // 1. Fermer la modal IMMÉDIATEMENT
                closeAddClientModal();

                // 2. Mettre à jour la sélection du client
                selectedClientId = newClient.id;
                await updateClientDisplay(selectedClientId, newClient.name);

                // 3. Notification de succès non-bloquante
                showNotification(`Client '${newClient.name}' ajouté avec succès !`, 'success');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout du client:', error);

            // Analyser le type d'erreur
            if (error.message.startsWith('ICE_EXISTS:')) {
                handleCaisseICEError(error.message, clientData, submitButton);
            } else if (error.message.startsWith('PHONE_EXISTS:')) {
                handleCaissePhoneError(error.message, clientData, submitButton);
            } else if (error.message.startsWith('SIMILAR_NAME_FOUND:')) {
                handleCaisseSimilarNameFound(error.message, clientData, submitButton);
            } else {
                // Erreur générique
                showNotification('Erreur lors de l\'ajout : ' + error.message, 'error');
            }
        }
    }

    // Gérer l'erreur ICE existant dans la caisse
    function handleCaisseICEError(errorMessage, clientData, submitButton) {
        const [, existingName, existingPhone, existingId] = errorMessage.split(':');

        if (window.clientValidation) {
            // Configurer le callback pour sélectionner le client existant
            window.clientValidation.setOnModifyExistingClient((clientId) => {
                selectExistingClientInCaisse(clientId);
            });

            window.clientValidation.showICEError(
                existingName,
                existingPhone,
                clientData.ice,
                parseInt(existingId)
            );
        } else {
            showNotification(`ICE ${clientData.ice} déjà utilisé par ${existingName}`, 'error');
        }
    }

    // Gérer l'erreur téléphone existant dans la caisse
    function handleCaissePhoneError(errorMessage, clientData, submitButton) {
        const [, existingName, existingICE, existingId] = errorMessage.split(':');

        if (window.clientValidation) {
            // Configurer le callback pour sélectionner le client existant
            window.clientValidation.setOnModifyExistingClient((clientId) => {
                selectExistingClientInCaisse(clientId);
            });

            window.clientValidation.showPhoneError(
                existingName,
                existingICE,
                clientData.phone,
                parseInt(existingId)
            );
        } else {
            showNotification(`Téléphone ${clientData.phone} déjà utilisé par ${existingName}`, 'error');
        }
    }

    // Gérer la détection de nom similaire dans la caisse
    function handleCaisseSimilarNameFound(errorMessage, clientData, submitButton) {
        const [, similarInfo] = errorMessage.split(':', 2);
        const similarClients = similarInfo.split('|').map(info => {
            const [id, name, phone, ice] = info.split(':');
            return { id: parseInt(id), name, phone, ice };
        });

        if (window.clientValidation) {
            window.clientValidation.showSimilarNameAlert(
                clientData.name,
                similarClients,
                () => forceCaisseAddClient(clientData, submitButton), // Continuer quand même
                (clientId) => selectExistingClientInCaisse(clientId) // Sélectionner l'existant
            );
        } else {
            // Fallback si la validation n'est pas disponible
            const proceed = confirm(`Un client similaire existe : ${similarClients[0].name}. Continuer quand même ?`);
            if (proceed) {
                forceCaisseAddClient(clientData, submitButton);
            }
        }
    }

    // Forcer l'ajout d'un client malgré un nom similaire dans la caisse
    async function forceCaisseAddClient(clientData, submitButton) {
        try {
            const newClient = await window.api.clients.forceAdd(clientData);
            if (newClient && newClient.id) {
                closeAddClientModal();
                selectedClientId = newClient.id;
                await updateClientDisplay(selectedClientId, newClient.name);
                showNotification(`Client '${newClient.name}' ajouté avec succès !`, 'success');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout forcé:', error);

            // Même en mode forcé, ICE et téléphone restent bloquants
            if (error.message.startsWith('ICE_EXISTS:')) {
                handleCaisseICEError(error.message, clientData, submitButton);
            } else if (error.message.startsWith('PHONE_EXISTS:')) {
                handleCaissePhoneError(error.message, clientData, submitButton);
            } else {
                showNotification('Erreur lors de l\'ajout : ' + error.message, 'error');
            }
        }
    }

    // Sélectionner un client existant dans la caisse
    async function selectExistingClientInCaisse(clientId) {
        try {
            const client = await window.api.clients.getById(clientId);
            if (client) {
                closeAddClientModal();
                selectedClientId = client.id;
                await updateClientDisplay(selectedClientId, client.name);
                showNotification(`Client '${client.name}' sélectionné`, 'success');
            }
        } catch (error) {
            console.error('Erreur lors de la sélection du client:', error);
            showNotification('Erreur lors de la sélection du client', 'error');
        }
    }

    // ===== GESTION BON DE LIVRAISON DEPUIS CAISSE =====

    let deliverySelectedClient = null;
    let caisseClients = [];

    /**
     * Charge les clients pour la sélection dans le bon de livraison
     */
    async function loadCaisseClients() {
        try {
            console.log('👥 Chargement des clients pour bon de livraison...');
            caisseClients = await window.api.clients.getAll();
            console.log(`✅ ${caisseClients.length} clients chargés pour bon de livraison`);
        } catch (error) {
            console.error('❌ Erreur lors du chargement des clients:', error);
            showNotification('Erreur lors du chargement des clients', 'error');
            caisseClients = [];
        }
    }

    /**
     * Récupère les données de vente actuelles depuis le panier ou lastSaleData
     */
    function getCurrentSaleData() {
        console.log('🔍 getCurrentSaleData() appelée');
        console.log('  - cart.length:', cart.length);
        console.log('  - lastSaleData:', lastSaleData);

        // Si le panier a des éléments, utiliser le panier
        if (cart.length > 0) {
            console.log('✅ Utilisation du panier actuel');
            const total = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);

            const cartData = {
                cart: cart.map(item => ({
                    id: item.id,
                    name: item.name || 'Produit',
                    quantity: item.quantity,
                    price: item.price,
                    total: item.quantity * item.price
                })),
                total: total,
                saleId: 'TEMP_' + Date.now(),
                timestamp: new Date()
            };
            console.log('  - cartData:', cartData);
            return cartData;
        }

        // Si le panier est vide mais qu'on a lastSaleData, l'utiliser
        if (lastSaleData && lastSaleData.cart && lastSaleData.cart.length > 0) {
            console.log('📦 Utilisation de lastSaleData car panier vide');
            const saleData = {
                cart: lastSaleData.cart,
                total: lastSaleData.total,
                saleId: lastSaleData.saleId || 'LAST_SALE_' + Date.now(),
                timestamp: new Date()
            };
            console.log('  - saleData:', saleData);
            return saleData;
        }

        // Aucune donnée disponible
        console.warn('⚠️ Aucune donnée de vente disponible');
        console.log('  - cart.length:', cart.length);
        console.log('  - lastSaleData:', lastSaleData);
        console.log('  - lastSaleData?.cart:', lastSaleData?.cart);
        console.log('  - lastSaleData?.cart?.length:', lastSaleData?.cart?.length);
        return null;
    }

    /**
     * Affiche le modal de sélection client pour bon de livraison
     */
    async function showDeliveryClientModal() {
        console.log('📄 Ouverture modal sélection client pour bon de livraison');

        // DEBUG: Afficher l'état des variables
        console.log('🔍 DEBUG - État des variables:');
        console.log('  - cart.length:', cart.length);
        console.log('  - cart:', cart);
        console.log('  - lastSaleData:', lastSaleData);

        // Récupérer les données de vente (lastSaleData ou panier actuel)
        const currentSaleData = lastSaleData || getCurrentSaleData();
        console.log('  - currentSaleData:', currentSaleData);

        // Vérifier si on a des données de vente (soit cart soit items)
        const hasCartData = currentSaleData && currentSaleData.cart && currentSaleData.cart.length > 0;
        const hasItemsData = currentSaleData && currentSaleData.items && currentSaleData.items.length > 0;
        const hasCurrentCart = cart.length > 0;

        console.log('🔍 Vérification des données:');
        console.log('  - hasCartData:', hasCartData);
        console.log('  - hasItemsData:', hasItemsData);
        console.log('  - hasCurrentCart:', hasCurrentCart);

        if (!currentSaleData || (!hasCartData && !hasItemsData && !hasCurrentCart)) {
            console.error('❌ Aucune donnée de vente disponible');
            console.log('  - currentSaleData:', currentSaleData);
            console.log('  - currentSaleData?.cart:', currentSaleData?.cart);
            console.log('  - currentSaleData?.items:', currentSaleData?.items);
            console.log('  - cart.length:', cart.length);
            showNotification('Aucune vente récente trouvée', 'error');
            return;
        }

        console.log('✅ Données de vente trouvées, ouverture du modal...');

        // Charger les clients si nécessaire
        if (!caisseClients || caisseClients.length === 0) {
            await loadCaisseClients();
        }

        // Réinitialiser la sélection
        deliverySelectedClient = null;
        clearDeliveryClientSelection();

        // Définir la date par défaut (aujourd'hui)
        const deliveryDate = document.getElementById('deliveryDate');
        if (deliveryDate) {
            deliveryDate.value = new Date().toISOString().split('T')[0];
        }

        // Vider les notes
        const deliveryNotes = document.getElementById('deliveryNotes');
        if (deliveryNotes) {
            deliveryNotes.value = '';
        }

        // Initialiser la recherche client
        initializeDeliveryClientSearch();

        // Afficher le modal
        const modal = document.getElementById('deliveryClientModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';

            // Focus sur le champ de recherche
            setTimeout(() => {
                const searchInput = document.getElementById('deliveryClientSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }, 100);
        }
    }

    /**
     * Crée un bon de livraison depuis la caisse
     */
    async function createDeliveryNoteFromCaisse() {
        console.log('📄 Création bon de livraison depuis la caisse...');

        // Récupérer les données de vente (lastSaleData ou panier actuel)
        const currentSaleData = lastSaleData || getCurrentSaleData();

        // Vérifications avec support pour structure 'items' et 'cart'
        const hasCartData = currentSaleData && currentSaleData.cart && currentSaleData.cart.length > 0;
        const hasItemsData = currentSaleData && currentSaleData.items && currentSaleData.items.length > 0;
        const hasCurrentCart = cart.length > 0;

        if (!currentSaleData || (!hasCartData && !hasItemsData && !hasCurrentCart)) {
            showNotification('Aucune vente récente trouvée', 'error');
            return;
        }

        if (!deliverySelectedClient) {
            showNotification('Veuillez sélectionner un client', 'error');
            return;
        }

        try {
            // Récupérer les données du formulaire
            const deliveryDate = document.getElementById('deliveryDate')?.value;
            const deliveryNotes = document.getElementById('deliveryNotes')?.value || '';

            // Utiliser les données de vente (cart, items, ou panier actuel)
            let sourceItems = [];

            if (currentSaleData.cart && currentSaleData.cart.length > 0) {
                // Structure avec 'cart'
                sourceItems = currentSaleData.cart;
                console.log('📦 Utilisation de currentSaleData.cart');
            } else if (currentSaleData.items && currentSaleData.items.length > 0) {
                // Structure avec 'items' (format lastSaleData)
                sourceItems = currentSaleData.items;
                console.log('📦 Utilisation de currentSaleData.items');
            } else if (cart.length > 0) {
                // Panier actuel
                sourceItems = cart;
                console.log('📦 Utilisation du panier actuel');
            }

            console.log('📦 sourceItems:', sourceItems);

            // Préparer les articles du bon de livraison depuis la vente
            const deliveryItems = sourceItems.map(item => ({
                id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                product_id: item.id || item.productId,
                product_name: item.name || item.productName || 'Produit',
                quantity: item.quantity,
                unit_price: item.price || item.unitPrice,
                total: item.quantity * (item.price || item.unitPrice)
            }));

            console.log('📦 deliveryItems créés:', deliveryItems);

            // Créer le bon de livraison
            const deliveryNote = {
                id: 'dn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
                number: generateDeliveryNumberFromCaisse(),
                type: 'outgoing',
                date: deliveryDate ? new Date(deliveryDate).toISOString() : new Date().toISOString(),
                customer_name: deliverySelectedClient.name,
                customer_id: deliverySelectedClient.id,
                customer_phone: deliverySelectedClient.phone || '',
                items: deliveryItems,
                notes: deliveryNotes,
                status: 'paid_pending_delivery',
                created_by: 'caisse',
                created_at: new Date().toISOString(),
                sale_reference: currentSaleData.saleId || currentSaleData.id || 'CAISSE_' + Date.now(),
                total_amount: currentSaleData.total || deliveryItems.reduce((sum, item) => sum + item.total, 0)
            };

            // Sauvegarder le bon de livraison
            await saveDeliveryNoteFromCaisse(deliveryNote);

            // Fermer le modal
            hideDeliveryClientModal();

            // Afficher le succès
            showNotification(`Bon de livraison ${deliveryNote.number} créé avec succès`, 'success');

            console.log('✅ Bon de livraison créé depuis la caisse:', deliveryNote.number);

        } catch (error) {
            console.error('❌ Erreur lors de la création du bon de livraison:', error);
            showNotification('Erreur lors de la création du bon de livraison', 'error');
        }
    }

    /**
     * Génère un numéro de bon de livraison depuis la caisse
     */
    function generateDeliveryNumberFromCaisse() {
        const date = new Date();
        const year = date.getFullYear().toString().substring(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const timestamp = Date.now().toString().slice(-4);
        return `BL-${year}${month}${day}-${timestamp}`;
    }

    /**
     * Sauvegarde le bon de livraison créé depuis la caisse
     */
    async function saveDeliveryNoteFromCaisse(deliveryNote) {
        try {
            // Utiliser l'API si disponible
            if (window.api && window.api.deliveryNotes && window.api.deliveryNotes.create) {
                await window.api.deliveryNotes.create(deliveryNote);
                console.log('✅ Bon de livraison sauvegardé via API');
            } else {
                // Fallback : localStorage
                const storageKey = 'delivery_notes';
                let deliveryNotes = [];

                try {
                    const stored = localStorage.getItem(storageKey);
                    if (stored) {
                        deliveryNotes = JSON.parse(stored);
                    }
                } catch (error) {
                    console.warn('⚠️ Erreur lecture localStorage, création nouvelle liste');
                    deliveryNotes = [];
                }

                deliveryNotes.push(deliveryNote);
                localStorage.setItem(storageKey, JSON.stringify(deliveryNotes));
                console.log('✅ Bon de livraison sauvegardé dans localStorage');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            throw error;
        }
    }

    /**
     * Masque le modal de sélection client
     */
    function hideDeliveryClientModal() {
        const modal = document.getElementById('deliveryClientModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }

        // Réinitialiser la sélection
        deliverySelectedClient = null;
        clearDeliveryClientSelection();
    }

    /**
     * Initialise la recherche de clients pour le bon de livraison
     */
    function initializeDeliveryClientSearch() {
        const clientSearch = document.getElementById('deliveryClientSearch');
        const clientDropdown = document.getElementById('deliveryClientDropdown');

        if (!clientSearch || !clientDropdown) return;

        // Événement de saisie avec debounce
        let searchTimeout;
        clientSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchDeliveryClients(e.target.value);
            }, 300);
        });

        // Événement focus pour afficher la liste
        clientSearch.addEventListener('focus', () => {
            if (clientSearch.value.trim() === '') {
                showAllDeliveryClients();
            } else {
                searchDeliveryClients(clientSearch.value);
            }
        });
    }

    /**
     * Recherche les clients pour le bon de livraison
     */
    function searchDeliveryClients(searchTerm) {
        const clientDropdown = document.getElementById('deliveryClientDropdown');
        if (!clientDropdown) return;

        const term = searchTerm.toLowerCase().trim();
        let filteredClients = [];

        if (term === '') {
            filteredClients = caisseClients.slice(0, 50);
        } else {
            filteredClients = caisseClients.filter(client =>
                client.name.toLowerCase().includes(term) ||
                (client.phone && client.phone.includes(term)) ||
                (client.email && client.email.toLowerCase().includes(term))
            ).slice(0, 20);
        }

        displayDeliveryClientResults(filteredClients, term);
    }

    /**
     * Affiche tous les clients (limité)
     */
    function showAllDeliveryClients() {
        const limitedClients = caisseClients.slice(0, 50);
        displayDeliveryClientResults(limitedClients, '');
    }

    /**
     * Affiche les résultats de recherche clients pour le bon de livraison
     */
    function displayDeliveryClientResults(clients, searchTerm) {
        const clientDropdown = document.getElementById('deliveryClientDropdown');
        if (!clientDropdown) return;

        clientDropdown.innerHTML = '';

        if (clients.length === 0) {
            clientDropdown.innerHTML = `
                <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    ${searchTerm ? `Aucun client trouvé pour "${searchTerm}"` : 'Aucun client disponible'}
                </div>
            `;
        } else {
            clients.forEach(client => {
                const clientItem = document.createElement('div');
                clientItem.className = 'px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0';
                clientItem.onclick = () => selectDeliveryClient(client);

                // Mettre en surbrillance le terme recherché
                let displayName = client.name;
                let displayPhone = client.phone || '';

                if (searchTerm) {
                    const regex = new RegExp(`(${searchTerm})`, 'gi');
                    displayName = displayName.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
                    displayPhone = displayPhone.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
                }

                clientItem.innerHTML = `
                    <div class="font-medium text-gray-900 dark:text-white">${displayName}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        ${displayPhone ? `📞 ${displayPhone}` : ''}
                        ${client.credit_balance ? `• Crédit: ${client.credit_balance.toFixed(2)} MAD` : ''}
                    </div>
                `;

                clientDropdown.appendChild(clientItem);
            });
        }

        clientDropdown.classList.remove('hidden');
    }

    /**
     * Sélectionne un client pour le bon de livraison
     */
    function selectDeliveryClient(client) {
        deliverySelectedClient = client;

        const clientSearch = document.getElementById('deliveryClientSearch');
        const clientDropdown = document.getElementById('deliveryClientDropdown');
        const selectedClientDisplay = document.getElementById('deliverySelectedClientDisplay');
        const selectedClientName = document.getElementById('deliverySelectedClientName');
        const selectedClientDetails = document.getElementById('deliverySelectedClientDetails');

        // Mettre à jour l'input de recherche
        if (clientSearch) {
            clientSearch.value = client.name;
        }

        // Masquer la liste déroulante
        if (clientDropdown) {
            clientDropdown.classList.add('hidden');
        }

        // Afficher le client sélectionné
        if (selectedClientDisplay && selectedClientName && selectedClientDetails) {
            selectedClientName.textContent = client.name;
            selectedClientDetails.textContent = `${client.phone || 'Pas de téléphone'} • ID: ${client.id}`;
            selectedClientDisplay.classList.remove('hidden');
        }

        console.log('👤 Client sélectionné pour bon de livraison:', client.name);
    }

    /**
     * Efface la sélection de client pour le bon de livraison
     */
    function clearDeliveryClientSelection() {
        deliverySelectedClient = null;

        const clientSearch = document.getElementById('deliveryClientSearch');
        const selectedClientDisplay = document.getElementById('deliverySelectedClientDisplay');
        const clientDropdown = document.getElementById('deliveryClientDropdown');

        // Vider l'input de recherche
        if (clientSearch) {
            clientSearch.value = '';
        }

        // Masquer les affichages
        if (selectedClientDisplay) {
            selectedClientDisplay.classList.add('hidden');
        }

        if (clientDropdown) {
            clientDropdown.classList.add('hidden');
        }

        console.log('🗑️ Sélection client bon de livraison effacée');
    }

    // Rendre les fonctions accessibles globalement
    window.showDeliveryClientModal = showDeliveryClientModal;
    window.createDeliveryNoteFromCaisse = createDeliveryNoteFromCaisse;

    // Lancement de l'initialisation de la page
    initPage();
}

// ===== INTÉGRATION BONS DE LIVRAISON =====

/**
 * Génère un bon de livraison depuis une vente
 */
async function generateDeliveryNoteFromSale() {
    try {
        console.log('📦 Génération bon de livraison depuis vente...');

        // Vérifier qu'il y a une vente en cours
        if (cart.length === 0) {
            showNotification('Aucune vente en cours pour générer un bon de livraison', 'warning');
            return;
        }

        // Récupérer les informations du client
        let clientName = 'Client par défaut';
        if (selectedClientId && selectedClientId !== 1) {
            try {
                const client = await window.api.clients.getById(selectedClientId);
                if (client) {
                    clientName = client.name;
                }
            } catch (error) {
                console.warn('Impossible de récupérer le nom du client:', error);
            }
        }

        // Préparer les articles du bon de livraison
        const deliveryItems = cart.map(item => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price
        }));

        // Créer l'objet bon de livraison
        const deliveryNote = {
            id: generateDeliveryNoteId(),
            number: generateDeliveryNoteNumber(),
            type: 'outgoing',
            date: new Date().toISOString(),
            customer_name: clientName,
            customer_id: selectedClientId ? `client_${selectedClientId}` : 'client_default',
            status: 'confirmed',
            items: deliveryItems,
            notes: `Généré depuis vente caisse - Total: ${calculateTotal().toFixed(2)} MAD`,
            created_by: 'caisse',
            created_at: new Date().toISOString(),
            sale_reference: `SALE_${Date.now()}`
        };

        // Sauvegarder le bon de livraison
        await saveDeliveryNoteToStorage(deliveryNote);

        // Afficher le message de succès
        showNotification(`Bon de livraison ${deliveryNote.number} généré avec succès`, 'success');

        // Proposer d'ouvrir la page des bons de livraison
        setTimeout(() => {
            if (confirm('Voulez-vous ouvrir la page des bons de livraison pour voir le bon créé ?')) {
                window.open('delivery-notes.html', '_blank');
            }
        }, 1000);

        console.log('✅ Bon de livraison généré:', deliveryNote);

    } catch (error) {
        console.error('❌ Erreur lors de la génération du bon de livraison:', error);
        showNotification('Erreur lors de la génération du bon de livraison', 'error');
    }
}

/**
 * Génère un ID unique pour le bon de livraison
 */
function generateDeliveryNoteId() {
    return 'dn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Génère un numéro de bon de livraison
 */
function generateDeliveryNoteNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = date.getHours().toString().padStart(2, '0') + date.getMinutes().toString().padStart(2, '0');

    return `BL${year}${month}${day}-${time}`;
}

/**
 * Sauvegarde le bon de livraison dans le localStorage
 */
async function saveDeliveryNoteToStorage(deliveryNote) {
    try {
        const storageKey = 'delivery_notes';
        let deliveryNotes = [];

        // Charger les bons existants
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            deliveryNotes = JSON.parse(stored);
        }

        // Ajouter le nouveau bon
        deliveryNotes.push(deliveryNote);

        // Sauvegarder
        localStorage.setItem(storageKey, JSON.stringify(deliveryNotes));

        console.log('✅ Bon de livraison sauvegardé dans localStorage');

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        throw error;
    }
}

/**
 * Affiche le bouton de génération de bon de livraison après validation
 */
function showDeliveryNoteButton() {
    const deliverySection = document.getElementById('delivery-note-section');
    if (deliverySection) {
        deliverySection.classList.remove('hidden');
    }
}

/**
 * Cache le bouton de génération de bon de livraison
 */
function hideDeliveryNoteButton() {
    const deliverySection = document.getElementById('delivery-note-section');
    if (deliverySection) {
        deliverySection.classList.add('hidden');
    }
}