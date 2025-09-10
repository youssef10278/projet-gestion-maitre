/**
 * Gestion des Fournisseurs
 * Interface pour créer, modifier, supprimer et gérer les fournisseurs
 */

let allSuppliers = [];
let availableProducts = []; // Produits disponibles pour les commandes
let currentSupplier = null;
let orders = [];
let currentOrder = null;
let orderItems = [];
let activeTab = 'suppliers';

// ===== INITIALISATION =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏭 Initialisation de la gestion des fournisseurs');

    // L'initialisation du menu se fait automatiquement via data-page-name="suppliers"
    // Attendre un peu pour que le menu soit initialisé, puis vérifier
    setTimeout(async () => {
        await checkAndInitializeMenu();
        await forceTranslations();
        initializeEventListeners();
        loadSuppliers();
        loadStatistics();

        // Charger les produits disponibles pour les commandes
        loadAvailableProducts();
    }, 500);
});

/**
 * Force l'application des traductions
 */
async function forceTranslations() {
    try {
        console.log('🌐 Forçage des traductions...');

        // Attendre que les traductions soient chargées
        if (window.i18n && typeof window.i18n.loadTranslations === 'function') {
            await window.i18n.loadTranslations();
            console.log('✅ Traductions chargées');
        }

        // Appliquer les traductions
        if (window.i18n && typeof window.i18n.forceRetranslate === 'function') {
            window.i18n.forceRetranslate();
            console.log('✅ Traductions appliquées avec forceRetranslate');
        } else if (window.i18n && typeof window.i18n.applyTranslationsToHTML === 'function') {
            window.i18n.applyTranslationsToHTML();
            console.log('✅ Traductions appliquées avec applyTranslationsToHTML');
        } else {
            console.warn('⚠️ Système de traduction non disponible');
        }

        // Vérifier si les traductions ont été appliquées
        const testElement = document.querySelector('[data-i18n="suppliers_management"]');
        if (testElement && testElement.textContent.includes('[suppliers_management]')) {
            console.warn('⚠️ Les traductions ne semblent pas avoir été appliquées, nouvelle tentative...');
            setTimeout(() => forceTranslations(), 500);
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'application des traductions:', error);
    }
}

/**
 * Vérifie si le menu est initialisé et force l'initialisation si nécessaire
 */
async function checkAndInitializeMenu() {
    const navContainer = document.getElementById('main-nav');

    if (!navContainer) {
        console.error('❌ Conteneur de navigation non trouvé');
        return;
    }

    // Vérifier si le menu est vide
    if (navContainer.children.length === 0 || navContainer.innerHTML.trim() === '') {
        console.log('⚠️ Menu vide détecté, forçage de l\'initialisation...');

        try {
            // Essayer différentes méthodes d'initialisation
            if (typeof window.initializePage === 'function') {
                console.log('🔧 Utilisation de initializePage...');
                await window.initializePage('suppliers');
            } else if (typeof window.buildNavigation === 'function') {
                console.log('🔧 Utilisation de buildNavigation...');
                await window.buildNavigation('suppliers');
            } else if (typeof window.rebuildMenu === 'function') {
                console.log('🔧 Utilisation de rebuildMenu...');
                await window.rebuildMenu('suppliers');
            } else {
                console.error('❌ Aucune fonction d\'initialisation du menu trouvée');
                // Afficher un message d'erreur dans le menu
                navContainer.innerHTML = `
                    <div class="text-white p-4">
                        <p class="text-red-300">⚠️ Erreur de chargement du menu</p>
                        <button onclick="location.reload()" class="bg-red-600 text-white px-4 py-2 rounded mt-2 text-sm">
                            Recharger la page
                        </button>
                    </div>
                `;
            }

            console.log('✅ Menu initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation forcée du menu:', error);
        }
    } else {
        console.log('✅ Menu déjà initialisé');
    }
}

/**
 * Initialiser les événements
 */
function initializeEventListeners() {
    // Gestion des onglets
    initializeTabNavigation();

    // Bouton nouveau fournisseur
    const addSupplierBtn = document.getElementById('addSupplierBtn');
    if (addSupplierBtn) {
        addSupplierBtn.addEventListener('click', () => openSupplierModal());
    }

    // Bouton nouvelle commande
    const createOrderBtn = document.getElementById('createOrderBtn');
    if (createOrderBtn) {
        createOrderBtn.addEventListener('click', () => openOrderModal());
    }

    // Bouton ajouter article à la commande
    const addOrderItemBtn = document.getElementById('addOrderItem');
    if (addOrderItemBtn) {
        addOrderItemBtn.addEventListener('click', addOrderItem);
    }



    // Événements pour les filtres de commandes
    initializeOrderFilters();

    // Initialiser les événements du modal de commande
    initializeOrderModalEvents();

    // Initialiser les événements du modal de statut
    initializeStatusModalEvents();

    // Modal events
    const supplierModal = document.getElementById('supplierModal');
    const closeSupplierModal = document.getElementById('closeSupplierModal');
    const cancelSupplier = document.getElementById('cancelSupplier');
    const supplierForm = document.getElementById('supplierForm');

    if (closeSupplierModal) {
        closeSupplierModal.addEventListener('click', () => closeModal());
    }

    if (cancelSupplier) {
        cancelSupplier.addEventListener('click', () => closeModal());
    }

    if (supplierModal) {
        supplierModal.addEventListener('click', (e) => {
            if (e.target === supplierModal) closeModal();
        });
    }

    if (supplierForm) {
        supplierForm.addEventListener('submit', handleSupplierSubmit);
    }

    // Filtres et recherche
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const sortBy = document.getElementById('sortBy');

    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadSuppliers();
            }, 300);
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => loadSuppliers());
    }

    if (sortBy) {
        sortBy.addEventListener('change', () => loadSuppliers());
    }
}

/**
 * Initialiser les filtres de commandes
 */
function initializeOrderFilters() {
    const orderSupplierFilter = document.getElementById('orderSupplierFilter');
    const orderStatusFilter = document.getElementById('orderStatusFilter');
    const orderDateFrom = document.getElementById('orderDateFrom');
    const orderDateTo = document.getElementById('orderDateTo');

    // Note: Les événements pour le filtre fournisseur sont gérés dans initSupplierFilterAutocomplete()

    if (orderStatusFilter) {
        orderStatusFilter.addEventListener('change', () => {
            if (activeTab === 'orders') {
                loadOrders();
            }
        });
    }

    if (orderDateFrom) {
        orderDateFrom.addEventListener('change', () => {
            if (activeTab === 'orders') {
                loadOrders();
            }
        });
    }

    if (orderDateTo) {
        orderDateTo.addEventListener('change', () => {
            if (activeTab === 'orders') {
                loadOrders();
            }
        });
    }
}

/**
 * Initialiser les événements du modal de commande
 */
function initializeOrderModalEvents() {
    console.log('🔧 Initialisation des événements du modal de commande...');

    // Attendre un peu pour que le DOM soit complètement chargé
    setTimeout(() => {
        const orderModal = document.getElementById('orderModal');
        const closeOrderModal = document.getElementById('closeOrderModal');
        const cancelOrder = document.getElementById('cancelOrder');
        const orderForm = document.getElementById('orderForm');

        console.log('🔍 Vérification des éléments du modal:');
        console.log('- Modal:', orderModal ? '✅ Trouvé' : '❌ Non trouvé');
        console.log('- Bouton fermer:', closeOrderModal ? '✅ Trouvé' : '❌ Non trouvé');
        console.log('- Bouton annuler:', cancelOrder ? '✅ Trouvé' : '❌ Non trouvé');
        console.log('- Formulaire:', orderForm ? '✅ Trouvé' : '❌ Non trouvé');

        if (closeOrderModal) {
            // Supprimer les anciens événements
            closeOrderModal.removeEventListener('click', closeOrderModalFunction);
            closeOrderModal.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🚪 Clic sur bouton fermer (X)');
                closeOrderModalFunction();
            });
        }

        if (cancelOrder) {
            cancelOrder.removeEventListener('click', closeOrderModalFunction);
            cancelOrder.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('❌ Clic sur bouton annuler');
                closeOrderModalFunction();
            });
        }

        if (orderModal) {
            orderModal.addEventListener('click', (e) => {
                if (e.target === orderModal) {
                    console.log('🚪 Clic sur arrière-plan du modal');
                    closeOrderModalFunction();
                }
            });
        }

        if (orderForm) {
            orderForm.removeEventListener('submit', handleOrderSubmit);
            orderForm.addEventListener('submit', (e) => {
                console.log('📝 Soumission du formulaire de commande');
                handleOrderSubmit(e);
            });
        }

        // Événements pour la sélection de produits
        const addSelectedProduct = document.getElementById('addSelectedProduct');

        if (addSelectedProduct) {
            addSelectedProduct.removeEventListener('click', handleAddSelectedProduct);
            addSelectedProduct.addEventListener('click', handleAddSelectedProduct);
        }

        // Note: Les événements pour l'autocomplétion des produits sont gérés dans initProductAutocomplete()

        console.log('✅ Événements du modal de commande initialisés');
    }, 100);
}

// ===== GESTION DES DONNÉES =====

/**
 * Charger les fournisseurs
 */
async function loadSuppliers() {
    try {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const sortBy = document.getElementById('sortBy');

        const options = {
            search: searchInput?.value || '',
            status: statusFilter?.value || 'ALL',
            sortBy: sortBy?.value?.split('-')[0] || 'name',
            sortOrder: sortBy?.value?.split('-')[1] || 'ASC'
        };

        allSuppliers = await window.api.suppliers.getAllWithStats(options);
        displaySuppliers(allSuppliers);

    } catch (error) {
        console.error('Erreur lors du chargement des fournisseurs:', error);
        showNotification('Erreur lors du chargement des fournisseurs', 'error');
    }
}

/**
 * Charger les statistiques
 */
async function loadStatistics() {
    try {
        const suppliers = await window.api.suppliers.getAll();
        
        const totalSuppliers = suppliers.length;
        const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE').length;
        
        // Calculer les statistiques des lots
        let totalLots = 0;
        let totalValue = 0;
        
        for (const supplier of suppliers) {
            const stats = await window.api.suppliers.getStats(supplier.id);
            totalLots += stats.total_lots || 0;
            totalValue += stats.total_value || 0;
        }

        // Mettre à jour l'affichage
        updateStatistic('totalSuppliers', totalSuppliers);
        updateStatistic('activeSuppliers', activeSuppliers);
        updateStatistic('totalLots', totalLots.toLocaleString());
        updateStatistic('totalValue', totalValue.toFixed(2) + ' MAD');

    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

/**
 * Mettre à jour une statistique
 */
function updateStatistic(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// ===== AFFICHAGE =====

/**
 * Afficher les fournisseurs
 */
function displaySuppliers(suppliers) {
    const container = document.getElementById('suppliersContainer');
    
    if (!suppliers || suppliers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                </div>
                <h3 class="empty-title">Aucun fournisseur trouvé</h3>
                <p class="empty-description">Commencez par ajouter votre premier fournisseur</p>
                <button onclick="openSupplierModal()" class="btn btn-primary mt-4">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Nouveau Fournisseur
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = suppliers.map(supplier => {
        const stats = supplier.stats || {};
        const statusClass = getStatusClass(supplier.status);
        const statusText = getStatusText(supplier.status);

        return `
            <div class="supplier-card" data-supplier-id="${supplier.id}">
                <div class="supplier-header">
                    <div class="supplier-info">
                        <h3 class="supplier-name">${supplier.name}</h3>
                        ${supplier.company ? `<p class="supplier-company">${supplier.company}</p>` : ''}
                        <span class="supplier-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="supplier-actions">
                        <button onclick="viewSupplierDetails(${supplier.id})" class="btn-icon" title="Voir détails">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                        </button>
                        <button onclick="editSupplier(${supplier.id})" class="btn-icon" title="Modifier">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button onclick="deleteSupplier(${supplier.id})" class="btn-icon text-red-600" title="Supprimer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="supplier-contact">
                    ${supplier.email ? `
                        <div class="contact-item">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                            <span>${supplier.email}</span>
                        </div>
                    ` : ''}
                    ${supplier.phone ? `
                        <div class="contact-item">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                            </svg>
                            <span>${supplier.phone}</span>
                        </div>
                    ` : ''}
                    ${supplier.city ? `
                        <div class="contact-item">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            <span>${supplier.city}${supplier.country && supplier.country !== 'Maroc' ? `, ${supplier.country}` : ''}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="supplier-stats">
                    <div class="stat-item">
                        <span class="stat-label">Lots</span>
                        <span class="stat-value">${stats.total_lots || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Produits</span>
                        <span class="stat-value">${stats.products_count || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Valeur</span>
                        <span class="stat-value">${(stats.total_value || 0).toFixed(0)} MAD</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Délai</span>
                        <span class="stat-value">${supplier.payment_terms || 30}j</span>
                    </div>
                </div>

                ${supplier.notes ? `
                    <div class="supplier-notes">
                        <p>${supplier.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Obtenir la classe CSS pour le statut
 */
function getStatusClass(status) {
    switch (status) {
        case 'ACTIVE': return 'status-active';
        case 'INACTIVE': return 'status-inactive';
        case 'SUSPENDED': return 'status-suspended';
        default: return 'status-unknown';
    }
}

/**
 * Obtenir le texte pour le statut
 */
function getStatusText(status) {
    switch (status) {
        case 'ACTIVE': return 'Actif';
        case 'INACTIVE': return 'Inactif';
        case 'SUSPENDED': return 'Suspendu';
        default: return 'Inconnu';
    }
}

// ===== GESTION DU MODAL =====

/**
 * Ouvrir le modal pour un nouveau fournisseur
 */
function openSupplierModal(supplier = null) {
    currentSupplier = supplier;
    const modal = document.getElementById('supplierModal');
    const title = document.getElementById('supplierModalTitle');
    const form = document.getElementById('supplierForm');

    if (supplier) {
        title.textContent = 'Modifier le fournisseur';
        fillSupplierForm(supplier);
    } else {
        title.textContent = 'Nouveau fournisseur';
        form.reset();
        document.getElementById('supplierId').value = '';
        document.getElementById('supplierCountry').value = 'Maroc';
        document.getElementById('supplierPaymentTerms').value = '30';
        document.getElementById('supplierCreditLimit').value = '0';
        document.getElementById('supplierDiscountRate').value = '0';
        document.getElementById('supplierStatus').value = 'ACTIVE';
    }

    modal.classList.remove('hidden');
}

/**
 * Fermer le modal
 */
function closeModal() {
    const modal = document.getElementById('supplierModal');
    modal.classList.add('hidden');
    currentSupplier = null;
}

/**
 * Remplir le formulaire avec les données du fournisseur
 */
function fillSupplierForm(supplier) {
    document.getElementById('supplierId').value = supplier.id;
    document.getElementById('supplierName').value = supplier.name || '';
    document.getElementById('supplierCompany').value = supplier.company || '';
    document.getElementById('supplierEmail').value = supplier.email || '';
    document.getElementById('supplierPhone').value = supplier.phone || '';
    document.getElementById('supplierAddress').value = supplier.address || '';
    document.getElementById('supplierCity').value = supplier.city || '';
    document.getElementById('supplierPostalCode').value = supplier.postal_code || '';
    document.getElementById('supplierCountry').value = supplier.country || 'Maroc';
    document.getElementById('supplierTaxId').value = supplier.tax_id || '';
    document.getElementById('supplierPaymentTerms').value = supplier.payment_terms || 30;
    document.getElementById('supplierCreditLimit').value = supplier.credit_limit || 0;
    document.getElementById('supplierDiscountRate').value = supplier.discount_rate || 0;
    document.getElementById('supplierStatus').value = supplier.status || 'ACTIVE';
    document.getElementById('supplierNotes').value = supplier.notes || '';
}

// ===== ACTIONS =====

/**
 * Gérer la soumission du formulaire
 */
async function handleSupplierSubmit(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('supplierName').value.trim(),
        company: document.getElementById('supplierCompany').value.trim(),
        email: document.getElementById('supplierEmail').value.trim(),
        phone: document.getElementById('supplierPhone').value.trim(),
        address: document.getElementById('supplierAddress').value.trim(),
        city: document.getElementById('supplierCity').value.trim(),
        postal_code: document.getElementById('supplierPostalCode').value.trim(),
        country: document.getElementById('supplierCountry').value.trim(),
        tax_id: document.getElementById('supplierTaxId').value.trim(),
        payment_terms: parseInt(document.getElementById('supplierPaymentTerms').value) || 30,
        credit_limit: parseFloat(document.getElementById('supplierCreditLimit').value) || 0,
        discount_rate: parseFloat(document.getElementById('supplierDiscountRate').value) || 0,
        status: document.getElementById('supplierStatus').value,
        notes: document.getElementById('supplierNotes').value.trim()
    };

    if (!formData.name) {
        showNotification('Le nom du fournisseur est obligatoire', 'error');
        return;
    }

    try {
        const supplierId = document.getElementById('supplierId').value;
        let result;

        if (supplierId) {
            // Modification
            result = await window.api.suppliers.update(parseInt(supplierId), formData);
        } else {
            // Création
            result = await window.api.suppliers.create(formData);
        }

        if (result.success) {
            showNotification(result.message, 'success');
            closeModal();
            loadSuppliers();
            loadStatistics();
        } else {
            showNotification(result.error, 'error');
        }

    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde du fournisseur', 'error');
    }
}

/**
 * Modifier un fournisseur
 */
async function editSupplier(supplierId) {
    try {
        const supplier = await window.api.suppliers.getById(supplierId);
        if (supplier) {
            openSupplierModal(supplier);
        } else {
            showNotification('Fournisseur non trouvé', 'error');
        }
    } catch (error) {
        console.error('Erreur lors du chargement du fournisseur:', error);
        showNotification('Erreur lors du chargement du fournisseur', 'error');
    }
}

/**
 * Supprimer un fournisseur
 */
async function deleteSupplier(supplierId) {
    const supplier = allSuppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const confirmed = confirm(
        `Êtes-vous sûr de vouloir supprimer le fournisseur "${supplier.name}" ?\n\n` +
        `Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
        const result = await window.api.suppliers.delete(supplierId);
        
        if (result.success) {
            showNotification(result.message, 'success');
            loadSuppliers();
            loadStatistics();
        } else {
            showNotification(result.error, 'error');
        }

    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification('Erreur lors de la suppression du fournisseur', 'error');
    }
}

/**
 * Voir les détails d'un fournisseur
 */
async function viewSupplierDetails(supplierId) {
    try {
        const supplier = await window.api.suppliers.getById(supplierId);
        const stats = await window.api.suppliers.getStats(supplierId);
        
        if (!supplier) {
            showNotification('Fournisseur non trouvé', 'error');
            return;
        }

        // TODO: Implémenter un modal de détails ou rediriger vers une page dédiée
        console.log('Détails du fournisseur:', { supplier, stats });
        
        // Pour l'instant, ouvrir le modal d'édition
        openSupplierModal(supplier);

    } catch (error) {
        console.error('Erreur lors du chargement des détails:', error);
        showNotification('Erreur lors du chargement des détails', 'error');
    }
}

// ===== GESTION DES ONGLETS =====

/**
 * Initialiser la navigation par onglets
 */
function initializeTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.target.id.replace('Tab', '');
            switchTab(tabId);
        });
    });
}

/**
 * Changer d'onglet
 */
function switchTab(tabName) {
    // Mettre à jour les boutons d'onglets
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'border-orange-500', 'text-orange-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });

    const activeButton = document.getElementById(tabName + 'Tab');
    if (activeButton) {
        activeButton.classList.add('active', 'border-orange-500', 'text-orange-600');
        activeButton.classList.remove('border-transparent', 'text-gray-500');
    }

    // Mettre à jour le contenu
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });

    const activeContent = document.getElementById(tabName + 'Content');
    if (activeContent) {
        activeContent.classList.remove('hidden');
        activeContent.classList.add('active');
    }

    activeTab = tabName;

    // Charger le contenu de l'onglet
    switch (tabName) {
        case 'suppliers':
            loadSuppliers();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'catalog':
            loadCatalog();
            break;
    }
}

// ===== GESTION DES COMMANDES =====

/**
 * Charger les commandes
 */
async function loadOrders() {
    try {
        console.log('🔄 Chargement des commandes...');

        // Récupérer les filtres
        const filters = {
            supplier_id: document.getElementById('orderSupplierFilter')?.value || '',
            status: document.getElementById('orderStatusFilter')?.value || '',
            date_from: document.getElementById('orderDateFrom')?.value || '',
            date_to: document.getElementById('orderDateTo')?.value || ''
        };

        // Charger les commandes via l'API
        orders = await window.supplierOrdersAPI.getOrders(filters);
        displayOrders(orders);

        // Charger la liste des fournisseurs pour le filtre
        await loadSuppliersForFilter();

    } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        showNotification('Erreur lors du chargement des commandes', 'error');
    }
}

/**
 * Charger les fournisseurs pour le filtre
 */
async function loadSuppliersForFilter() {
    try {
        const suppliers = await window.api.suppliers.getAll();

        // Initialiser l'autocomplétion pour le filtre
        initSupplierFilterAutocomplete(suppliers);

    } catch (error) {
        console.error('Erreur lors du chargement des fournisseurs pour le filtre:', error);
    }
}

/**
 * Initialiser l'autocomplétion pour le filtre fournisseur
 */
function initSupplierFilterAutocomplete(suppliers) {
    const searchInput = document.getElementById('orderSupplierFilterSearch');
    const hiddenInput = document.getElementById('orderSupplierFilter');
    const dropdown = document.getElementById('orderSupplierFilterDropdown');
    const dropdownBtn = document.getElementById('orderSupplierFilterDropdownBtn');

    if (!searchInput || !hiddenInput || !dropdown || !dropdownBtn) {
        console.warn('Éléments d\'autocomplétion filtre fournisseur non trouvés');
        return;
    }

    let selectedSupplier = null;

    // Fonction pour afficher les suggestions
    function showFilterSuggestions(filteredSuppliers, query = '') {
        dropdown.innerHTML = '';

        // Ajouter l'option "Tous les fournisseurs"
        const allOption = document.createElement('div');
        allOption.className = 'p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600';
        allOption.innerHTML = `
            <div class="font-medium text-blue-600 dark:text-blue-400">Tous les fournisseurs</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Afficher toutes les commandes</div>
        `;
        allOption.addEventListener('click', () => {
            selectFilterSupplier(null);
        });
        dropdown.appendChild(allOption);

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
                    selectFilterSupplier(supplier);
                });

                dropdown.appendChild(item);
            });
        }

        dropdown.classList.remove('hidden');
    }

    // Fonction pour sélectionner un fournisseur
    function selectFilterSupplier(supplier) {
        selectedSupplier = supplier;

        if (supplier) {
            searchInput.value = `${supplier.name} - ${supplier.company || 'N/A'}`;
            hiddenInput.value = supplier.id;
        } else {
            searchInput.value = '';
            hiddenInput.value = '';
        }

        dropdown.classList.add('hidden');

        // Déclencher le filtrage des commandes
        if (activeTab === 'orders') {
            loadOrders();
        }

        console.log('🏢 Filtre fournisseur:', supplier ? supplier.name : 'Tous');
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
        showFilterSuggestions(filtered, query);

        // Si le champ est vide, réinitialiser le filtre
        if (!query.trim()) {
            selectedSupplier = null;
            hiddenInput.value = '';
            if (activeTab === 'orders') {
                loadOrders();
            }
        }
    });

    // Événement focus pour afficher toutes les suggestions
    searchInput.addEventListener('focus', () => {
        const filtered = filterSuppliers(searchInput.value);
        showFilterSuggestions(filtered, searchInput.value);
    });

    // Événement clic sur le bouton dropdown
    dropdownBtn.addEventListener('click', () => {
        if (dropdown.classList.contains('hidden')) {
            searchInput.focus();
            showFilterSuggestions(suppliers);
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

    console.log('✅ Autocomplétion filtre fournisseur initialisée avec', suppliers.length, 'fournisseurs');
}

/**
 * Afficher les commandes
 */
function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center">
                <div class="w-16 h-16 mx-auto mb-4 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune commande trouvée</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4">Commencez par créer votre première commande</p>
                <button id="newOrderFromEmpty" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
                    Nouvelle Commande
                </button>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Commande</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fournisseur</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Articles</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    ${orders.map(order => `
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900 dark:text-white">${order.order_number}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">ID: ${order.id}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900 dark:text-white">${order.supplier_name}</div>
                                ${order.supplier_company ? `<div class="text-sm text-gray-500 dark:text-gray-400">${order.supplier_company}</div>` : ''}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                ${new Date(order.order_date).toLocaleDateString('fr-FR')}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center gap-2">
                                    <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}">
                                        ${getStatusIcon(order.status)}
                                        ${getOrderStatusText(order.status)}
                                    </span>
                                    ${getStockImpactIndicator(order.status)}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                ${order.items_count || 0} article(s)
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                ${(order.total_amount || 0).toFixed(2)} MAD
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div class="flex space-x-2">
                                    <button data-action="view" data-order-id="${order.id}" class="order-action-btn text-blue-600 hover:text-blue-900 dark:text-blue-400" title="Voir détails">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                    </button>
                                    <button data-action="status" data-order-id="${order.id}" class="order-action-btn text-purple-600 hover:text-purple-900 dark:text-purple-400" title="Changer le statut">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                    </button>
                                    <button data-action="edit" data-order-id="${order.id}" class="order-action-btn text-green-600 hover:text-green-900 dark:text-green-400" title="Modifier">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                        </svg>
                                    </button>
                                    <button data-action="preview" data-order-id="${order.id}" class="order-action-btn text-blue-600 hover:text-blue-900 dark:text-blue-400" title="Aperçu PDF">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                    </button>
                                    <button data-action="print" data-order-id="${order.id}" class="order-action-btn text-indigo-600 hover:text-indigo-900 dark:text-indigo-400" title="Imprimer">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                                        </svg>
                                    </button>
                                    <button data-action="export-pdf" data-order-id="${order.id}" class="order-action-btn text-orange-600 hover:text-orange-900 dark:text-orange-400" title="Exporter PDF">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                    </button>
                                    ${order.status === 'confirmed' || order.status === 'shipped' ? `
                                        <button data-action="delivery-note" data-order-id="${order.id}" class="order-action-btn text-emerald-600 hover:text-emerald-900 dark:text-emerald-400" title="Générer Bon de Livraison">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                            </svg>
                                        </button>
                                    ` : ''}
                                    <button data-action="delete" data-order-id="${order.id}" class="order-action-btn text-red-600 hover:text-red-900 dark:text-red-400" title="Supprimer">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHTML;

    // Ajouter la délégation d'événements pour les boutons d'actions
    setupOrderActionButtons();
}

/**
 * Configure la délégation d'événements pour les boutons d'actions des commandes
 */
function setupOrderActionButtons() {
    const container = document.getElementById('ordersContainer');

    // Supprimer les anciens événements pour éviter les doublons
    container.removeEventListener('click', handleOrderActionClick);

    // Ajouter la délégation d'événements
    container.addEventListener('click', handleOrderActionClick);

    // Gérer le bouton "Nouvelle Commande" dans le message vide
    const newOrderFromEmptyBtn = document.getElementById('newOrderFromEmpty');
    if (newOrderFromEmptyBtn) {
        newOrderFromEmptyBtn.removeEventListener('click', openOrderModal);
        newOrderFromEmptyBtn.addEventListener('click', openOrderModal);
    }
}

/**
 * Gère les clics sur les boutons d'actions des commandes
 */
async function handleOrderActionClick(event) {
    console.log('🖱️ Clic détecté sur:', event.target);

    const button = event.target.closest('.order-action-btn');

    if (!button) {
        console.log('❌ Pas un bouton d\'action');
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const action = button.dataset.action;
    const orderId = button.dataset.orderId;

    console.log(`🔧 Action "${action}" sur la commande ${orderId}`);

    try {
        switch (action) {
            case 'view':
                console.log('👁️ Affichage des détails...');
                await viewOrderDetails(orderId);
                break;
            case 'status':
                console.log('🔄 Changement de statut...');
                await openStatusModal(orderId);
                break;
            case 'edit':
                console.log('✏️ Édition de la commande...');
                await editOrder(orderId);
                break;
            case 'delete':
                console.log('🗑️ Suppression de la commande...');
                await deleteOrder(orderId);
                break;
            case 'preview':
                console.log('👁️ Aperçu du bon de commande...');
                await previewPurchaseOrder(orderId);
                break;
            case 'print':
                console.log('🖨️ Impression du bon de commande...');
                await printPurchaseOrder(orderId);
                break;
            case 'export-pdf':
                console.log('📄 Export PDF du bon de commande...');
                await exportPurchaseOrderToPDF(orderId);
                break;
            case 'delivery-note':
                console.log('📦 Génération bon de livraison...');
                await generateDeliveryNoteFromOrder(orderId);
                break;
            default:
                console.warn('❓ Action inconnue:', action);
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'exécution de l\'action:', error);
        showNotification('Erreur lors de l\'exécution de l\'action', 'error');
    }
}

/**
 * Obtenir la classe CSS pour le statut de commande
 */
function getOrderStatusClass(status) {
    switch (status) {
        case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'CONFIRMED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'SHIPPED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        case 'PARTIALLY_RECEIVED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
        case 'RECEIVED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
}

/**
 * Obtenir le texte pour le statut de commande
 */
function getOrderStatusText(status) {
    switch (status) {
        case 'PENDING': return 'En attente';
        case 'CONFIRMED': return 'Confirmée';
        case 'SHIPPED': return 'Expédiée';
        case 'PARTIALLY_RECEIVED': return 'Partiellement reçue';
        case 'RECEIVED': return 'Reçue';
        case 'CANCELLED': return 'Annulée';
        default: return 'Inconnu';
    }
}

/**
 * Ouvrir le modal pour créer/modifier une commande
 */
async function openOrderModal(order = null) {
    currentOrder = order;
    const modal = document.getElementById('orderModal');
    const title = document.getElementById('orderModalTitle');
    const form = document.getElementById('orderForm');

    if (order) {
        title.textContent = 'Modifier la commande';
        await fillOrderForm(order);
    } else {
        title.textContent = 'Nouvelle commande';
        form.reset();
        document.getElementById('orderId').value = '';
        document.getElementById('orderDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('orderStatus').value = 'PENDING';
        orderItems = [];
        updateOrderItemsDisplay();
        updateOrderTotal();
    }

    // Charger les fournisseurs et les produits
    await loadSuppliersForOrderForm();
    await loadAvailableProducts();

    modal.classList.remove('hidden');

    // Réinitialiser les événements du modal pour être sûr qu'ils fonctionnent
    setTimeout(() => {
        initializeOrderModalEvents();
    }, 50);
}

/**
 * Charger les fournisseurs pour le formulaire de commande
 */
async function loadSuppliersForOrderForm() {
    try {
        const suppliers = await window.api.suppliers.getAll();

        // Initialiser le système d'autocomplétion
        initSupplierAutocomplete(suppliers);

    } catch (error) {
        console.error('Erreur lors du chargement des fournisseurs:', error);
    }
}

/**
 * Initialiser le système d'autocomplétion pour les fournisseurs
 */
function initSupplierAutocomplete(suppliers) {
    const searchInput = document.getElementById('orderSupplierSearch');
    const hiddenInput = document.getElementById('orderSupplier');
    const dropdown = document.getElementById('orderSupplierDropdown');
    const dropdownBtn = document.getElementById('orderSupplierDropdownBtn');

    if (!searchInput || !hiddenInput || !dropdown || !dropdownBtn) {
        console.warn('Éléments d\'autocomplétion non trouvés');
        return;
    }

    let selectedSupplier = null;

    // Fonction pour afficher les suggestions
    function showSuggestions(filteredSuppliers) {
        dropdown.innerHTML = '';

        if (filteredSuppliers.length === 0) {
            dropdown.innerHTML = '<div class="p-3 text-sm text-gray-500 dark:text-gray-400">Aucun fournisseur trouvé</div>';
        } else {
            filteredSuppliers.forEach(supplier => {
                const item = document.createElement('div');
                item.className = 'p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0';
                item.innerHTML = `
                    <div class="font-medium text-gray-900 dark:text-white">${supplier.name}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${supplier.company || 'Pas d\'entreprise'}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500">${supplier.email || 'Pas d\'email'}</div>
                `;

                item.addEventListener('click', () => {
                    selectSupplier(supplier);
                });

                dropdown.appendChild(item);
            });
        }

        dropdown.classList.remove('hidden');
    }

    // Fonction pour sélectionner un fournisseur
    function selectSupplier(supplier) {
        selectedSupplier = supplier;
        searchInput.value = `${supplier.name} - ${supplier.company || 'N/A'}`;
        hiddenInput.value = supplier.id;
        dropdown.classList.add('hidden');

        console.log('🏢 Fournisseur sélectionné:', supplier);
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

    // Événement de saisie dans le champ de recherche
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        const filtered = filterSuppliers(query);
        showSuggestions(filtered);

        // Réinitialiser la sélection si l'utilisateur tape
        if (selectedSupplier && query !== `${selectedSupplier.name} - ${selectedSupplier.company || 'N/A'}`) {
            selectedSupplier = null;
            hiddenInput.value = '';
        }
    });

    // Événement focus pour afficher toutes les suggestions
    searchInput.addEventListener('focus', () => {
        const filtered = filterSuppliers(searchInput.value);
        showSuggestions(filtered);
    });

    // Événement clic sur le bouton dropdown
    dropdownBtn.addEventListener('click', () => {
        if (dropdown.classList.contains('hidden')) {
            searchInput.focus();
            showSuggestions(suppliers);
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

    // Gestion des touches clavier pour navigation
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
                } else if (items.length === 1) {
                    // Si un seul résultat, le sélectionner automatiquement
                    items[0].click();
                }
                break;

            case 'Escape':
                dropdown.classList.add('hidden');
                searchInput.blur();
                break;

            case 'Tab':
                // Permettre la navigation par Tab
                dropdown.classList.add('hidden');
                break;
        }
    });

    // Améliorer l'affichage des suggestions avec highlight
    function highlightMatch(text, query) {
        if (!query.trim()) return text;

        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
    }

    // Mettre à jour la fonction showSuggestions pour inclure le highlight
    const originalShowSuggestions = showSuggestions;
    showSuggestions = function(filteredSuppliers, query = '') {
        dropdown.innerHTML = '';

        if (filteredSuppliers.length === 0) {
            dropdown.innerHTML = '<div class="p-3 text-sm text-gray-500 dark:text-gray-400">Aucun fournisseur trouvé</div>';
        } else {
            filteredSuppliers.forEach((supplier, index) => {
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
                    selectSupplier(supplier);
                });

                dropdown.appendChild(item);
            });
        }

        dropdown.classList.remove('hidden');
    };

    // Mettre à jour l'événement input pour passer la query
    searchInput.removeEventListener('input', searchInput._inputHandler);
    searchInput._inputHandler = (e) => {
        const query = e.target.value;
        const filtered = filterSuppliers(query);
        showSuggestions(filtered, query);

        // Réinitialiser la sélection si l'utilisateur tape
        if (selectedSupplier && query !== `${selectedSupplier.name} - ${selectedSupplier.company || 'N/A'}`) {
            selectedSupplier = null;
            hiddenInput.value = '';
        }
    };
    searchInput.addEventListener('input', searchInput._inputHandler);

    console.log('✅ Autocomplétion fournisseurs initialisée avec', suppliers.length, 'fournisseurs');
}

/**
 * Charger les produits disponibles pour les commandes
 */
async function loadAvailableProducts() {
    try {
        console.log('📦 Chargement des produits disponibles...');
        availableProducts = await window.supplierOrdersAPI.getAvailableProducts();
        console.log(`✅ ${availableProducts.length} produits chargés`);

        // Initialiser l'autocomplétion des produits
        initProductAutocomplete();

    } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        availableProducts = [];
    }
}

/**
 * Mettre à jour le sélecteur de produits
 */
function initProductAutocomplete() {
    const searchInput = document.getElementById('productSelectorSearch');
    const hiddenInput = document.getElementById('productSelector');
    const dropdown = document.getElementById('productSelectorDropdown');
    const dropdownBtn = document.getElementById('productSelectorDropdownBtn');

    if (!searchInput || !hiddenInput || !dropdown || !dropdownBtn) {
        console.warn('Éléments d\'autocomplétion produits non trouvés');
        return;
    }

    let selectedProduct = null;

    // Fonction pour afficher les suggestions de produits
    function showProductSuggestions(filteredProducts, query = '') {
        dropdown.innerHTML = '';

        if (filteredProducts.length === 0) {
            dropdown.innerHTML = '<div class="p-3 text-sm text-gray-500 dark:text-gray-400">Aucun produit trouvé</div>';
        } else {
            filteredProducts.forEach(product => {
                const item = document.createElement('div');
                item.className = 'p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0';

                const highlightedName = highlightMatch(product.name, query);
                const highlightedReference = product.reference ? highlightMatch(product.reference, query) : '';

                // Déterminer la couleur du stock
                let stockColor = 'text-green-600 dark:text-green-400';
                if (product.current_stock <= 0) {
                    stockColor = 'text-red-600 dark:text-red-400';
                } else if (product.current_stock <= (product.alert_threshold || 5)) {
                    stockColor = 'text-orange-600 dark:text-orange-400';
                }

                item.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="font-medium text-gray-900 dark:text-white">${highlightedName}</div>
                            ${highlightedReference ? `<div class="text-sm text-gray-500 dark:text-gray-400">Réf: ${highlightedReference}</div>` : ''}
                            <div class="text-xs text-gray-400 dark:text-gray-500">${product.category || 'Sans catégorie'}</div>
                        </div>
                        <div class="text-right ml-3">
                            <div class="text-sm font-medium ${stockColor}">Stock: ${product.current_stock}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">${product.purchase_price || 0} MAD</div>
                        </div>
                    </div>
                `;

                item.addEventListener('click', () => {
                    selectProduct(product);
                });

                dropdown.appendChild(item);
            });
        }

        dropdown.classList.remove('hidden');
    }

    // Fonction pour sélectionner un produit
    function selectProduct(product) {
        selectedProduct = product;
        searchInput.value = `${product.name} (Stock: ${product.current_stock})`;
        hiddenInput.value = product.id;
        hiddenInput.dataset.product = JSON.stringify(product);
        dropdown.classList.add('hidden');

        console.log('📦 Produit sélectionné:', product);
    }

    // Fonction pour filtrer les produits
    function filterProducts(query) {
        if (!query.trim()) {
            return availableProducts;
        }

        const lowerQuery = query.toLowerCase();
        return availableProducts.filter(product =>
            product.name.toLowerCase().includes(lowerQuery) ||
            (product.reference && product.reference.toLowerCase().includes(lowerQuery)) ||
            (product.category && product.category.toLowerCase().includes(lowerQuery)) ||
            (product.id && product.id.toString().includes(query))
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
        const filtered = filterProducts(query);
        showProductSuggestions(filtered, query);

        // Réinitialiser la sélection si l'utilisateur tape
        if (selectedProduct && query !== `${selectedProduct.name} (Stock: ${selectedProduct.current_stock})`) {
            selectedProduct = null;
            hiddenInput.value = '';
            delete hiddenInput.dataset.product;
        }
    });

    // Événement focus pour afficher toutes les suggestions
    searchInput.addEventListener('focus', () => {
        const filtered = filterProducts(searchInput.value);
        showProductSuggestions(filtered, searchInput.value);
    });

    // Événement clic sur le bouton dropdown
    dropdownBtn.addEventListener('click', () => {
        if (dropdown.classList.contains('hidden')) {
            searchInput.focus();
            showProductSuggestions(availableProducts);
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
                } else if (items.length === 1) {
                    items[0].click();
                }
                break;

            case 'Escape':
                dropdown.classList.add('hidden');
                searchInput.blur();
                break;
        }
    });

    console.log('✅ Autocomplétion produits initialisée avec', availableProducts.length, 'produits');
}

/**
 * Gérer la sélection d'un produit
 */
function handleProductSelection(event) {
    const selectedOption = event.target.selectedOptions[0];
    const productInfo = document.getElementById('productInfo');

    if (selectedOption && selectedOption.dataset.product) {
        const product = JSON.parse(selectedOption.dataset.product);

        // Afficher les informations du produit
        document.getElementById('productCurrentStock').textContent = product.current_stock;
        document.getElementById('productPurchasePrice').textContent = `${product.purchase_price} MAD`;
        document.getElementById('productReference').textContent = product.reference || 'N/A';
        document.getElementById('productAlertThreshold').textContent = product.alert_threshold;

        productInfo.classList.remove('hidden');

        console.log('📋 Produit sélectionné:', product.name);
    } else {
        productInfo.classList.add('hidden');
    }
}

/**
 * Ajouter le produit sélectionné à la commande
 */
function handleAddSelectedProduct() {
    const hiddenInput = document.getElementById('productSelector');
    const searchInput = document.getElementById('productSelectorSearch');

    if (!hiddenInput.value || !hiddenInput.dataset.product) {
        showNotification('Veuillez sélectionner un produit', 'warning');
        return;
    }

    const product = JSON.parse(hiddenInput.dataset.product);

    // Vérifier si le produit n'est pas déjà dans la commande
    const existingItem = orderItems.find(item => item.product_id === product.id);
    if (existingItem) {
        showNotification('Ce produit est déjà dans la commande', 'warning');
        return;
    }

    // Ajouter le produit à la commande
    const newItem = {
        product_id: product.id,
        product_name: product.name,
        product_reference: product.reference || '',
        quantity_ordered: 1,
        unit_price: product.purchase_price || 0
    };

    orderItems.push(newItem);

    // Mettre à jour l'affichage
    updateOrderItemsDisplay();
    updateOrderTotal();

    // Réinitialiser la sélection
    hiddenInput.value = '';
    delete hiddenInput.dataset.product;
    searchInput.value = '';

    // Fermer le dropdown s'il est ouvert
    const dropdown = document.getElementById('productSelectorDropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }

    // Cacher l'info produit
    const productInfo = document.getElementById('productInfo');
    if (productInfo) {
        productInfo.classList.add('hidden');
    }

    console.log('✅ Produit ajouté à la commande:', product.name);
    showNotification(`Produit "${product.name}" ajouté à la commande`, 'success');
}

/**
 * Remplir le formulaire avec les données d'une commande existante
 */
async function fillOrderForm(order) {
    try {
        // Remplir les champs de base
        document.getElementById('orderId').value = order.id;

        // Gérer le nouveau système de sélection de fournisseur
        const orderSupplierHidden = document.getElementById('orderSupplier');
        const orderSupplierSearch = document.getElementById('orderSupplierSearch');

        if (orderSupplierHidden && orderSupplierSearch) {
            orderSupplierHidden.value = order.supplier_id;

            // Trouver le nom du fournisseur pour l'affichage
            if (order.supplier_name) {
                orderSupplierSearch.value = order.supplier_name + (order.supplier_company ? ` - ${order.supplier_company}` : '');
            } else {
                // Fallback: chercher le fournisseur par ID
                try {
                    const supplier = await window.api.suppliers.getById(order.supplier_id);
                    if (supplier) {
                        orderSupplierSearch.value = `${supplier.name} - ${supplier.company || 'N/A'}`;
                    }
                } catch (error) {
                    console.warn('Impossible de charger le fournisseur:', error);
                    orderSupplierSearch.value = `Fournisseur ID: ${order.supplier_id}`;
                }
            }
        } else {
            // Fallback pour l'ancien système
            const orderSupplierSelect = document.getElementById('orderSupplier');
            if (orderSupplierSelect) {
                orderSupplierSelect.value = order.supplier_id;
            }
        }
        document.getElementById('orderDate').value = order.order_date;
        document.getElementById('expectedDeliveryDate').value = order.expected_delivery_date || '';
        document.getElementById('orderStatus').value = order.status;
        document.getElementById('orderNotes').value = order.notes || '';

        // Charger les articles de la commande
        if (order.items && order.items.length > 0) {
            orderItems = order.items.map(item => ({
                product_id: item.product_id,
                product_name: item.product_name,
                product_reference: item.product_reference || '',
                quantity_ordered: item.quantity_ordered,
                unit_price: item.unit_price
            }));
        } else {
            orderItems = [];
        }

        updateOrderItemsDisplay();
        updateOrderTotal();

    } catch (error) {
        console.error('Erreur lors du remplissage du formulaire:', error);
        showNotification('Erreur lors du chargement des données de la commande', 'error');
    }
}

/**
 * Mettre à jour l'affichage des articles de commande
 */
function updateOrderItemsDisplay() {
    const container = document.getElementById('orderItemsContainer');

    if (orderItems.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"/>
                </svg>
                <p>Aucun article ajouté</p>
                <p class="text-sm">Cliquez sur "Ajouter un article" pour commencer</p>
            </div>
        `;
        return;
    }

    container.innerHTML = orderItems.map((item, index) => `
        <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produit</label>
                    <input type="text" value="${item.product_name}" onchange="updateOrderItem(${index}, 'product_name', this.value)"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Référence</label>
                    <input type="text" value="${item.product_reference || ''}" onchange="updateOrderItem(${index}, 'product_reference', this.value)"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantité</label>
                    <input type="number" value="${item.quantity_ordered}" min="1" onchange="updateOrderItem(${index}, 'quantity_ordered', parseInt(this.value))"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix unitaire (MAD)</label>
                    <input type="number" value="${item.unit_price}" min="0" step="0.01" onchange="updateOrderItem(${index}, 'unit_price', parseFloat(this.value))"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                </div>
                <div class="flex items-end">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total</label>
                        <div class="px-3 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium">
                            ${(item.quantity_ordered * item.unit_price).toFixed(2)} MAD
                        </div>
                    </div>
                    <button type="button" onclick="removeOrderItem(${index})"
                            class="ml-2 p-2 text-red-600 hover:text-red-800 dark:text-red-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Mettre à jour un article de commande
 */
function updateOrderItem(index, field, value) {
    if (orderItems[index]) {
        orderItems[index][field] = value;
        updateOrderItemsDisplay();
        updateOrderTotal();
    }
}

/**
 * Supprimer un article de commande
 */
function removeOrderItem(index) {
    orderItems.splice(index, 1);
    updateOrderItemsDisplay();
    updateOrderTotal();
}

/**
 * Mettre à jour le total de la commande
 */
function updateOrderTotal() {
    const total = orderItems.reduce((sum, item) => {
        return sum + (item.quantity_ordered * item.unit_price);
    }, 0);

    const totalElement = document.getElementById('orderTotal');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2) + ' MAD';
    }
}

// ===== FONCTIONS GLOBALES POUR LES COMMANDES =====

/**
 * Ajouter un nouvel article à la commande (ancienne méthode - dépréciée)
 * Utiliser maintenant handleAddSelectedProduct() avec le sélecteur de produits
 */
function addOrderItem() {
    console.warn('⚠️ addOrderItem() est déprécié. Utilisez le sélecteur de produits.');
    showNotification('Veuillez utiliser le sélecteur de produits pour ajouter un article', 'warning');
}

/**
 * Voir les détails d'une commande
 */
async function viewOrderDetails(orderId) {
    try {
        console.log('🔍 Chargement des détails de la commande:', orderId);
        const orderDetails = await window.supplierOrdersAPI.getOrderDetails(orderId);
        console.log('📋 Détails de la commande:', orderDetails);

        // Ouvrir le modal d'édition avec les détails
        await openOrderModal(orderDetails);

    } catch (error) {
        console.error('Erreur lors du chargement des détails de la commande:', error);
        showNotification('Erreur lors du chargement des détails', 'error');
    }
}

/**
 * Modifier une commande
 */
async function editOrder(orderId) {
    await viewOrderDetails(orderId);
}

/**
 * Supprimer une commande
 */
async function deleteOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const confirmed = confirm(
        `Êtes-vous sûr de vouloir supprimer la commande "${order.order_number}" ?\n\n` +
        `Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
        await window.supplierOrdersAPI.deleteOrder(orderId);
        showNotification('Commande supprimée avec succès', 'success');
        loadOrders();

    } catch (error) {
        console.error('Erreur lors de la suppression de la commande:', error);
        showNotification('Erreur lors de la suppression de la commande', 'error');
    }
}

/**
 * Charger le catalogue (placeholder)
 */
function loadCatalog() {
    const container = document.getElementById('catalogContainer');
    container.innerHTML = `
        <div class="p-8 text-center">
            <div class="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Catalogue en développement</h3>
            <p class="text-gray-500 dark:text-gray-400">Cette fonctionnalité sera bientôt disponible</p>
        </div>
    `;
}

/**
 * Fermer le modal de commande
 */
function closeOrderModalFunction() {
    const modal = document.getElementById('orderModal');
    modal.classList.add('hidden');
    currentOrder = null;
    orderItems = [];
    console.log('🚪 Modal de commande fermé');
}

/**
 * Ouvrir le modal de changement de statut
 */
async function openStatusModal(orderId) {
    try {
        console.log('🔄 Ouverture du modal de statut pour commande:', orderId);

        // Charger les détails de la commande
        const orderDetails = await window.supplierOrdersAPI.getOrderDetails(orderId);
        if (!orderDetails) {
            showNotification('Commande non trouvée', 'error');
            return;
        }

        // Remplir le modal
        document.getElementById('statusOrderId').value = orderId;
        document.getElementById('newStatus').value = orderDetails.status;
        document.getElementById('statusNotes').value = '';

        // Afficher le modal
        const modal = document.getElementById('statusModal');
        modal.classList.remove('hidden');

        // Initialiser les événements du modal
        initializeStatusModalEvents();

        // Mettre à jour l'avertissement d'impact sur le stock
        updateStockImpactWarning(orderDetails.status, orderDetails.status);

    } catch (error) {
        console.error('Erreur lors de l\'ouverture du modal de statut:', error);
        showNotification('Erreur lors du chargement des informations', 'error');
    }
}

/**
 * Fermer le modal de changement de statut
 */
function closeStatusModal() {
    const modal = document.getElementById('statusModal');
    modal.classList.add('hidden');

    // Réinitialiser le formulaire
    document.getElementById('statusForm').reset();
    document.getElementById('stockImpactWarning').classList.add('hidden');

    console.log('🚪 Modal de statut fermé');
}

/**
 * Initialiser les événements du modal de statut
 */
function initializeStatusModalEvents() {
    console.log('🔧 Initialisation des événements du modal de statut...');

    const closeBtn = document.getElementById('closeStatusModal');
    const cancelBtn = document.getElementById('cancelStatusChange');
    const statusForm = document.getElementById('statusForm');
    const statusSelect = document.getElementById('newStatus');
    const modal = document.getElementById('statusModal');

    // Bouton fermer
    if (closeBtn) {
        closeBtn.removeEventListener('click', closeStatusModal);
        closeBtn.addEventListener('click', closeStatusModal);
    }

    // Bouton annuler
    if (cancelBtn) {
        cancelBtn.removeEventListener('click', closeStatusModal);
        cancelBtn.addEventListener('click', closeStatusModal);
    }

    // Clic sur l'arrière-plan
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeStatusModal();
            }
        });
    }

    // Formulaire
    if (statusForm) {
        statusForm.removeEventListener('submit', handleStatusSubmit);
        statusForm.addEventListener('submit', handleStatusSubmit);
    }

    // Changement de statut pour afficher l'avertissement
    if (statusSelect) {
        statusSelect.removeEventListener('change', handleStatusChange);
        statusSelect.addEventListener('change', handleStatusChange);
    }

    console.log('✅ Événements du modal de statut initialisés');
}

/**
 * Gérer le changement de statut dans le sélecteur
 */
async function handleStatusChange(event) {
    const newStatus = event.target.value;
    const orderId = document.getElementById('statusOrderId').value;

    try {
        // Charger les détails de la commande pour connaître le statut actuel
        const orderDetails = await window.supplierOrdersAPI.getOrderDetails(orderId);
        if (orderDetails) {
            updateStockImpactWarning(orderDetails.status, newStatus);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des détails de commande:', error);
    }
}

/**
 * Mettre à jour l'avertissement d'impact sur le stock
 */
function updateStockImpactWarning(currentStatus, newStatus) {
    const warningDiv = document.getElementById('stockImpactWarning');
    const messageSpan = document.getElementById('stockImpactMessage');

    let showWarning = false;
    let message = '';

    // Logique d'avertissement selon les changements de statut
    if (currentStatus !== newStatus) {
        if (newStatus === 'CONFIRMED' && currentStatus !== 'CONFIRMED') {
            showWarning = true;
            message = 'Les quantités commandées seront ajoutées au stock automatiquement.';
        } else if (newStatus === 'CANCELLED' && currentStatus === 'CONFIRMED') {
            showWarning = true;
            message = 'Les quantités seront retirées du stock car la commande était confirmée.';
        } else if (currentStatus === 'CONFIRMED' && newStatus !== 'CONFIRMED' && newStatus !== 'SHIPPED' && newStatus !== 'RECEIVED') {
            showWarning = true;
            message = 'Les quantités seront retirées du stock car la commande ne sera plus confirmée.';
        }
    }

    if (showWarning) {
        messageSpan.textContent = message;
        warningDiv.classList.remove('hidden');
    } else {
        warningDiv.classList.add('hidden');
    }

    console.log(`⚠️ Avertissement stock: ${currentStatus} → ${newStatus} = ${showWarning ? 'Affiché' : 'Masqué'}`);
}

/**
 * Gérer la soumission du formulaire de changement de statut
 */
async function handleStatusSubmit(event) {
    event.preventDefault();

    const orderId = document.getElementById('statusOrderId').value;
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('statusNotes').value;

    try {
        console.log(`
🔄 ========================================
   CHANGEMENT DE STATUT DEPUIS L'INTERFACE
========================================`);
        console.log(`📋 Commande: ${orderId}`);
        console.log(`🔄 Nouveau statut: ${newStatus}`);
        console.log(`📝 Notes: ${notes}`);

        // Vérifier que l'API est disponible
        if (!window.supplierOrdersAPI) {
            console.error('❌ API supplierOrdersAPI non disponible !');
            showNotification('Erreur: API non disponible', 'error');
            return;
        }

        // Récupérer la commande avant changement pour debug
        const orderBefore = await window.supplierOrdersAPI.getOrderDetails(orderId);
        console.log(`📦 Commande avant changement:`, orderBefore);

        // Mettre à jour le statut via l'API
        console.log(`🚀 Appel de updateOrderStatus...`);
        const result = await window.supplierOrdersAPI.updateOrderStatus(orderId, newStatus, notes);
        console.log(`📥 Résultat de updateOrderStatus:`, result);

        if (result) {
            console.log(`✅ Statut mis à jour avec succès !`);
            showNotification('Statut mis à jour avec succès', 'success');
            closeStatusModal();

            // Recharger la liste des commandes
            if (activeTab === 'orders') {
                console.log(`🔄 Rechargement de la liste des commandes...`);
                loadOrders();
            }

            // Vérifier la commande après changement
            setTimeout(async () => {
                const orderAfter = await window.supplierOrdersAPI.getOrderDetails(orderId);
                console.log(`📦 Commande après changement:`, orderAfter);
            }, 1000);

        } else {
            console.error(`❌ Échec de la mise à jour du statut`);
            showNotification('Échec de la mise à jour du statut', 'error');
        }

        console.log(`========================================`);

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du statut:', error);
        showNotification('Erreur lors de la mise à jour du statut', 'error');
    }
}

/**
 * Gérer la soumission du formulaire de commande
 */
async function handleOrderSubmit(e) {
    e.preventDefault();

    console.log(`
🔄 ========================================
   SOUMISSION FORMULAIRE COMMANDE
========================================`);
    console.log(`📦 Articles avant filtrage:`, orderItems);

    const formData = {
        supplier_id: parseInt(document.getElementById('orderSupplier').value),
        order_date: document.getElementById('orderDate').value,
        expected_delivery_date: document.getElementById('expectedDeliveryDate').value,
        status: document.getElementById('orderStatus').value,
        notes: document.getElementById('orderNotes').value.trim(),
        items: orderItems.filter(item => {
            // Nouveau filtrage : vérifier product_id ET product_name ET quantité
            const hasProductId = item.product_id && item.product_id !== '';
            const hasProductName = item.product_name && item.product_name.trim() !== '';
            const hasQuantity = item.quantity_ordered && item.quantity_ordered > 0;

            console.log(`🔍 Article: ${item.product_name || 'Sans nom'}`);
            console.log(`  - Product ID: ${hasProductId ? '✅' : '❌'} (${item.product_id})`);
            console.log(`  - Product Name: ${hasProductName ? '✅' : '❌'} (${item.product_name})`);
            console.log(`  - Quantité: ${hasQuantity ? '✅' : '❌'} (${item.quantity_ordered})`);

            const isValid = hasProductId && hasProductName && hasQuantity;
            console.log(`  - Valide: ${isValid ? '✅' : '❌'}`);

            return isValid;
        })
    };

    console.log(`📦 Articles après filtrage:`, formData.items);
    console.log(`📊 Nombre d'articles valides: ${formData.items.length}`);

    // Validation
    if (!formData.supplier_id) {
        showNotification('Veuillez sélectionner un fournisseur', 'error');
        return;
    }

    if (!formData.order_date) {
        showNotification('Veuillez saisir une date de commande', 'error');
        return;
    }

    if (formData.items.length === 0) {
        showNotification('Veuillez ajouter au moins un article à la commande', 'error');
        return;
    }

    try {
        const orderId = document.getElementById('orderId').value;
        let result;

        if (orderId) {
            // Modification
            console.log('🔄 Modification de la commande:', orderId);
            result = await window.supplierOrdersAPI.updateOrder(parseInt(orderId), formData);
        } else {
            // Création
            result = await window.supplierOrdersAPI.createOrder(formData);
        }

        if (result) {
            const message = orderId ? 'Commande modifiée avec succès' : 'Commande créée avec succès';
            showNotification(message, 'success');
            closeOrderModalFunction();
            if (activeTab === 'orders') {
                loadOrders();
            }
        }

    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la commande:', error);
        showNotification('Erreur lors de la sauvegarde de la commande', 'error');
    }
}

/**
 * Obtenir la couleur du statut de commande
 */
function getStatusColor(status) {
    switch (status) {
        case 'PENDING':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'CONFIRMED':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'SHIPPED':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        case 'RECEIVED':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'CANCELLED':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
}

/**
 * Obtenir le texte du statut de commande
 */
function getOrderStatusText(status) {
    switch (status) {
        case 'PENDING':
            return 'En attente';
        case 'CONFIRMED':
            return 'Confirmée';
        case 'SHIPPED':
            return 'Expédiée';
        case 'RECEIVED':
            return 'Reçue';
        case 'CANCELLED':
            return 'Annulée';
        default:
            return 'Inconnu';
    }
}

/**
 * Obtenir l'icône du statut de commande
 */
function getStatusIcon(status) {
    switch (status) {
        case 'PENDING':
            return '<svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        case 'CONFIRMED':
            return '<svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        case 'SHIPPED':
            return '<svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>';
        case 'RECEIVED':
            return '<svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>';
        case 'CANCELLED':
            return '<svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        default:
            return '';
    }
}

/**
 * Obtenir l'indicateur d'impact sur le stock
 */
function getStockImpactIndicator(status) {
    switch (status) {
        case 'CONFIRMED':
        case 'SHIPPED':
        case 'RECEIVED':
            return '<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" title="Stock mis à jour"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg></span>';
        case 'CANCELLED':
            return '<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" title="Stock ajusté"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"/></svg></span>';
        default:
            return '';
    }
}

// Exposition des fonctions globales
window.addOrderItem = addOrderItem;
window.updateOrderItem = updateOrderItem;
window.removeOrderItem = removeOrderItem;
window.viewOrderDetails = viewOrderDetails;
window.editOrder = editOrder;
window.deleteOrder = deleteOrder;
window.loadOrders = loadOrders;
window.activeTab = activeTab;

// FONCTION DE DIAGNOSTIC SIMPLE
window.diagnosticSimple = async () => {
    console.log(`
🔍 ========================================
   DIAGNOSTIC SIMPLE DU SYSTÈME
========================================`);

    try {
        // 1. Vérifier les APIs
        console.log(`\n1️⃣ VÉRIFICATION DES APIs`);
        console.log(`- window.api: ${window.api ? '✅' : '❌'}`);
        console.log(`- window.api.products: ${window.api?.products ? '✅' : '❌'}`);
        console.log(`- window.supplierOrdersAPI: ${window.supplierOrdersAPI ? '✅' : '❌'}`);

        // 2. Test simple de produit
        console.log(`\n2️⃣ TEST PRODUITS`);
        if (window.api?.products) {
            const products = await window.api.products.getAll();
            console.log(`Nombre de produits: ${products.length}`);

            if (products.length > 0) {
                const firstProduct = products[0];
                console.log(`Premier produit:`, firstProduct);
                console.log(`- ID: ${firstProduct.id}`);
                console.log(`- Nom: ${firstProduct.name}`);
                console.log(`- Stock: ${firstProduct.stock}`);

                // Test de mise à jour directe
                console.log(`\n3️⃣ TEST MISE À JOUR STOCK`);
                const stockAvant = firstProduct.stock;
                console.log(`Stock avant: ${stockAvant}`);

                // Ajouter 1 unité
                const updateData = { ...firstProduct, stock: parseInt(stockAvant) + 1 };
                const result = await window.api.products.update(firstProduct.id, updateData);
                console.log(`Résultat mise à jour:`, result);

                // Vérifier le résultat
                const productApres = await window.api.products.getById(firstProduct.id);
                console.log(`Stock après: ${productApres.stock}`);

                if (parseInt(productApres.stock) === parseInt(stockAvant) + 1) {
                    console.log(`✅ SUCCÈS: La mise à jour du stock fonctionne !`);

                    // Remettre le stock original
                    const restoreData = { ...productApres, stock: parseInt(stockAvant) };
                    await window.api.products.update(firstProduct.id, restoreData);
                    console.log(`Stock remis à l'original: ${stockAvant}`);
                } else {
                    console.log(`❌ ÉCHEC: La mise à jour du stock ne fonctionne pas`);
                }
            }
        }

        // 3. Vérifier les commandes
        console.log(`\n4️⃣ VÉRIFICATION COMMANDES`);
        if (window.supplierOrdersAPI) {
            const orders = window.supplierOrdersAPI.getAllOrders();
            console.log(`Nombre de commandes: ${orders.length}`);

            if (orders.length > 0) {
                const lastOrder = orders[orders.length - 1];
                console.log(`Dernière commande: ${lastOrder.id}`);
                console.log(`- Statut: ${lastOrder.status}`);
                console.log(`- Articles: ${lastOrder.items?.length || 0}`);

                if (lastOrder.items && lastOrder.items.length > 0) {
                    console.log(`\n📦 ARTICLES DE LA COMMANDE:`);
                    lastOrder.items.forEach((item, index) => {
                        console.log(`  ${index + 1}. ${item.product_name}`);
                        console.log(`     - Product ID: ${item.product_id || '❌ MANQUANT'}`);
                        console.log(`     - Quantité: ${item.quantity_ordered}`);
                    });
                }
            }
        }

        console.log(`\n✅ DIAGNOSTIC TERMINÉ`);
        console.log(`========================================`);

    } catch (error) {
        console.error(`❌ Erreur lors du diagnostic:`, error);
    }
};

// FONCTION POUR TESTER UNE COMMANDE SPÉCIFIQUE
window.testerCommande = async (orderId) => {
    console.log(`
🧪 ========================================
   TEST D'UNE COMMANDE SPÉCIFIQUE
========================================`);

    try {
        console.log(`📋 Test de la commande: ${orderId}`);

        if (!window.supplierOrdersAPI) {
            console.error(`❌ supplierOrdersAPI non disponible`);
            return;
        }

        // Récupérer la commande
        const order = await window.supplierOrdersAPI.getOrderDetails(orderId);
        if (!order) {
            console.error(`❌ Commande ${orderId} non trouvée`);
            return;
        }

        console.log(`✅ Commande trouvée:`, order);
        console.log(`- Statut actuel: ${order.status}`);
        console.log(`- Articles: ${order.items?.length || 0}`);

        // Vérifier les stocks avant
        if (order.items && order.items.length > 0) {
            console.log(`\n📊 STOCKS AVANT:`);
            for (const item of order.items) {
                if (item.product_id) {
                    const product = await window.api.products.getById(item.product_id);
                    console.log(`  - ${item.product_name}: ${product?.stock || 'N/A'} unités`);
                } else {
                    console.log(`  - ${item.product_name}: ❌ Pas de product_id`);
                }
            }
        }

        // Si la commande n'est pas confirmée, proposer de la confirmer
        if (order.status !== 'CONFIRMED') {
            console.log(`\n🔄 Commande pas encore confirmée. Pour tester:`);
            console.log(`testerChangementStatut('${orderId}', 'CONFIRMED')`);
        }

    } catch (error) {
        console.error(`❌ Erreur lors du test:`, error);
    }
};

// FONCTION POUR TESTER LE CHANGEMENT DE STATUT
window.testerChangementStatut = async (orderId, nouveauStatut) => {
    console.log(`
🔄 ========================================
   TEST CHANGEMENT DE STATUT
========================================`);

    try {
        console.log(`📋 Commande: ${orderId}`);
        console.log(`🔄 Nouveau statut: ${nouveauStatut}`);

        // Stocks avant
        const orderBefore = await window.supplierOrdersAPI.getOrderDetails(orderId);
        console.log(`\n📊 STOCKS AVANT CHANGEMENT:`);
        if (orderBefore.items) {
            for (const item of orderBefore.items) {
                if (item.product_id) {
                    const product = await window.api.products.getById(item.product_id);
                    console.log(`  - ${item.product_name}: ${product?.stock || 'N/A'} unités`);
                }
            }
        }

        // Changement de statut
        console.log(`\n🚀 Changement de statut en cours...`);
        const result = await window.supplierOrdersAPI.updateOrderStatus(orderId, nouveauStatut, 'Test manuel');
        console.log(`Résultat: ${result ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);

        // Stocks après
        console.log(`\n📊 STOCKS APRÈS CHANGEMENT:`);
        if (orderBefore.items) {
            for (const item of orderBefore.items) {
                if (item.product_id) {
                    const product = await window.api.products.getById(item.product_id);
                    console.log(`  - ${item.product_name}: ${product?.stock || 'N/A'} unités`);
                }
            }
        }

        console.log(`\n✅ TEST TERMINÉ`);

    } catch (error) {
        console.error(`❌ Erreur lors du test:`, error);
    }
};

// ===== INTÉGRATION BONS DE LIVRAISON =====

/**
 * Génère un bon de livraison depuis une commande fournisseur
 */
async function generateDeliveryNoteFromOrder(orderId) {
    try {
        console.log('📦 Génération bon de livraison depuis commande:', orderId);

        // Récupérer la commande
        const order = supplierOrders.find(o => o.id === orderId);
        if (!order) {
            showNotification('Commande non trouvée', 'error');
            return;
        }

        // Vérifier le statut de la commande
        if (order.status !== 'confirmed' && order.status !== 'shipped') {
            showNotification('Seules les commandes confirmées ou expédiées peuvent générer un bon de livraison', 'warning');
            return;
        }

        // Récupérer les informations du fournisseur
        const supplier = suppliers.find(s => s.id === order.supplier_id);
        const supplierName = supplier ? supplier.name : 'Fournisseur inconnu';

        // Préparer les articles du bon de livraison
        const deliveryItems = order.items.map(item => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price || 0
        }));

        // Créer l'objet bon de livraison
        const deliveryNote = {
            id: generateDeliveryNoteId(),
            number: generateDeliveryNoteNumber(),
            type: 'incoming',
            date: new Date().toISOString(),
            supplier_name: supplierName,
            supplier_id: `supplier_${order.supplier_id}`,
            status: 'confirmed',
            items: deliveryItems,
            notes: `Généré depuis commande fournisseur ${order.order_number} - Total: ${order.total_amount?.toFixed(2) || '0.00'} MAD`,
            created_by: 'suppliers',
            created_at: new Date().toISOString(),
            order_reference: order.order_number
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

        console.log('✅ Bon de livraison généré depuis commande:', deliveryNote);

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

// ===== FONCTIONS D'IMPRESSION DES BONS DE COMMANDE =====

/**
 * Aperçu du bon de commande
 */
async function previewPurchaseOrder(orderId) {
    try {
        console.log('👁️ Aperçu du bon de commande:', orderId);

        // Récupérer les détails de la commande
        const orderDetails = await window.supplierOrdersAPI.getOrderDetails(parseInt(orderId));
        if (!orderDetails) {
            throw new Error('Commande introuvable');
        }

        // Utiliser le printer pour l'aperçu
        if (window.purchaseOrderPrinter) {
            await window.purchaseOrderPrinter.previewOrder(orderDetails);
        } else {
            throw new Error('Module d\'impression non disponible');
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'aperçu:', error);
        showNotification('Erreur lors de l\'aperçu du bon de commande', 'error');
    }
}

/**
 * Impression du bon de commande
 */
async function printPurchaseOrder(orderId) {
    try {
        console.log('🖨️ Impression du bon de commande:', orderId);

        // Récupérer les détails de la commande
        const orderDetails = await window.supplierOrdersAPI.getOrderDetails(parseInt(orderId));
        if (!orderDetails) {
            throw new Error('Commande introuvable');
        }

        // Utiliser le printer pour l'impression
        if (window.purchaseOrderPrinter) {
            await window.purchaseOrderPrinter.printOrder(orderDetails);
        } else {
            throw new Error('Module d\'impression non disponible');
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'impression:', error);
        showNotification('Erreur lors de l\'impression du bon de commande', 'error');
    }
}

/**
 * Export PDF du bon de commande
 */
async function exportPurchaseOrderToPDF(orderId) {
    try {
        console.log('📄 Export PDF du bon de commande:', orderId);

        // Récupérer les détails de la commande
        const orderDetails = await window.supplierOrdersAPI.getOrderDetails(parseInt(orderId));
        if (!orderDetails) {
            throw new Error('Commande introuvable');
        }

        // Utiliser le printer pour l'export PDF
        if (window.purchaseOrderPrinter) {
            await window.purchaseOrderPrinter.exportToPDF(orderDetails);
        } else {
            throw new Error('Module d\'impression non disponible');
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'export PDF:', error);
        showNotification('Erreur lors de l\'export PDF du bon de commande', 'error');
    }
}
