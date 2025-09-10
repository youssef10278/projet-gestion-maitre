/**
 * Gestion des Bons de Livraison - JavaScript Principal
 * Phase 1 MVP - Fonctionnalités de base
 * @version 1.0.0
 */

// Variables globales
let deliveryNotes = [];
let filteredDeliveryNotes = [];
let currentDeliveryNote = null;
let isEditMode = false;
let currentItems = [];

// Données système pour les sélecteurs
let allClients = [];
let allProducts = [];
let selectedClient = null;

// Variables de performance et pagination
let currentPage = 1;
let itemsPerPage = 20;
let totalPages = 1;
let searchCache = new Map();
let lastSearchTerm = '';
let searchTimeout = null;

// Configuration
const DELIVERY_CONFIG = {
    storageKey: 'delivery_notes',
    autoSaveInterval: 30000, // 30 secondes
    numberPrefix: 'BL',
    itemsPerPage: 20
};

/**
 * Initialisation de la page bons de livraison
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📦 Initialisation de la page bons de livraison...');

    try {
        // Attendre un peu pour s'assurer que tous les scripts sont chargés
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initialiser le menu de navigation (identique au dashboard)
        if (typeof window.initializePage === 'function') {
            await window.initializePage('delivery-notes');
            console.log('✅ Menu de navigation initialisé via initializePage');
        } else if (typeof window.buildNavigation === 'function') {
            await window.buildNavigation('delivery-notes');
            console.log('✅ Menu de navigation construit via buildNavigation');
        } else {
            console.warn('⚠️ Fonctions de menu non disponibles, tentative de fallback...');
            setTimeout(async () => {
                if (typeof window.buildNavigation === 'function') {
                    await window.buildNavigation('delivery-notes');
                    console.log('✅ Menu de navigation construit (fallback)');
                } else {
                    console.error('❌ Impossible de construire le menu de navigation');
                }
            }, 1000);
        }

        // Vérifier que le menu hamburger est initialisé
        setTimeout(() => {
            if (window.hamburgerMenu) {
                console.log('✅ Menu hamburger disponible');
            } else {
                console.warn('⚠️ Menu hamburger non disponible');
            }
        }, 500);

        // Initialiser les événements
        initializeEvents();

        // Charger les données
        await loadDeliveryNotes();

        // Charger les clients et produits pour les sélecteurs
        await loadClients();
        await loadProducts();

        // Charger les traductions
        if (typeof loadTranslations === 'function') {
            loadTranslations();
        }

        // Mettre à jour l'affichage
        updateDisplay();
        updateStatistics();

        // Initialiser le système d'alertes
        initializeAlertSystem();

        // Intégrer avec le dashboard si disponible
        setTimeout(() => {
            integrateWithDashboardAlerts();
        }, 1000);

        console.log('✅ Page bons de livraison initialisée');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la page bons de livraison:', error);
        
        // Fallback d'urgence pour le menu
        setTimeout(async () => {
            try {
                if (typeof window.buildNavigation === 'function') {
                    await window.buildNavigation('delivery-notes');
                    console.log('✅ Menu de navigation construit (fallback d\'urgence)');
                }
            } catch (fallbackError) {
                console.error('❌ Échec du fallback menu:', fallbackError);
            }
        }, 1000);
    }
});

/**
 * Initialise tous les événements de la page
 */
function initializeEvents() {
    console.log('🎯 Initialisation des événements...');

    // Boutons principaux
    addEventListenerSafe('newDeliveryBtn', 'click', showNewDeliveryModal);
    addEventListenerSafe('refreshBtn', 'click', refreshData);

    // Filtres et recherche
    addEventListenerSafe('searchInput', 'input', handleOptimizedSearch);
    addEventListenerSafe('typeFilter', 'change', handleFilter);
    addEventListenerSafe('statusFilter', 'change', handleFilter);

    // Modales
    addEventListenerSafe('closeModalBtn', 'click', hideDeliveryModal);
    addEventListenerSafe('cancelBtn', 'click', hideDeliveryModal);
    addEventListenerSafe('closePrintModalBtn', 'click', hidePrintModal);
    addEventListenerSafe('cancelPrintBtn', 'click', hidePrintModal);
    addEventListenerSafe('confirmPrintBtn', 'click', handlePrint);

    // Reporting et Export
    addEventListenerSafe('reportingBtn', 'click', showReportingModal);
    addEventListenerSafe('closeReportingBtn', 'click', hideReportingModal);
    addEventListenerSafe('generateReportBtn', 'click', generateReport);
    addEventListenerSafe('exportBtn', 'click', showExportModal);
    addEventListenerSafe('closeExportBtn', 'click', hideExportModal);
    addEventListenerSafe('exportExcelBtn', 'click', exportToExcel);
    addEventListenerSafe('exportCsvBtn', 'click', exportToCsv);

    // Formulaire
    addEventListenerSafe('deliveryForm', 'submit', handleFormSubmit);
    addEventListenerSafe('deliveryType', 'change', handleTypeChange);
    addEventListenerSafe('addItemBtn', 'click', addNewItem);

    // Initialiser la recherche de clients (après chargement des données)
    setTimeout(() => {
        initializeClientSearch();
        initializeProductSearch();
    }, 500);

    // Fermeture modale en cliquant à l'extérieur
    document.getElementById('deliveryModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'deliveryModal') hideDeliveryModal();
    });
    document.getElementById('printModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'printModal') hidePrintModal();
    });
    document.getElementById('reportingModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'reportingModal') hideReportingModal();
    });
    document.getElementById('exportModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'exportModal') hideExportModal();
    });

    console.log('✅ Événements initialisés');
}

/**
 * Ajoute un event listener de manière sécurisée
 */
function addEventListenerSafe(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(event, handler);
        console.log(`✅ Event listener ajouté pour ${elementId}`);
    } else {
        console.warn(`⚠️ Élément ${elementId} non trouvé`);
    }
}

/**
 * Charge les bons de livraison depuis le localStorage
 */
async function loadDeliveryNotes() {
    try {
        console.log('📊 Chargement des bons de livraison...');
        
        const stored = localStorage.getItem(DELIVERY_CONFIG.storageKey);
        if (stored) {
            deliveryNotes = JSON.parse(stored);
            console.log(`✅ ${deliveryNotes.length} bons de livraison chargés`);
        } else {
            // Créer des données de démonstration
            deliveryNotes = createSampleData();
            await saveDeliveryNotes();
            console.log('✅ Données de démonstration créées');
        }
        
        filteredDeliveryNotes = [...deliveryNotes];
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des bons de livraison:', error);
        deliveryNotes = [];
        filteredDeliveryNotes = [];
    }
}

/**
 * Sauvegarde les bons de livraison dans le localStorage
 */
async function saveDeliveryNotes() {
    try {
        localStorage.setItem(DELIVERY_CONFIG.storageKey, JSON.stringify(deliveryNotes));
        console.log('✅ Bons de livraison sauvegardés');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
    }
}

/**
 * Crée des données de démonstration
 */
function createSampleData() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
        {
            id: generateId(),
            number: generateDeliveryNumber(),
            type: 'outgoing',
            date: today.toISOString(),
            customer_name: 'Client ABC',
            customer_id: 'client_001',
            status: 'confirmed',
            items: [
                { product_name: 'Produit A', quantity: 5, unit_price: 25.00 },
                { product_name: 'Produit B', quantity: 2, unit_price: 50.00 }
            ],
            notes: 'Livraison urgente',
            created_by: 'admin',
            created_at: today.toISOString()
        },
        {
            id: generateId(),
            number: generateDeliveryNumber(),
            type: 'incoming',
            date: yesterday.toISOString(),
            supplier_name: 'Fournisseur XYZ',
            supplier_id: 'supplier_001',
            status: 'delivered',
            items: [
                { product_name: 'Produit C', quantity: 10, unit_price: 15.00 },
                { product_name: 'Produit D', quantity: 8, unit_price: 30.00 }
            ],
            notes: 'Réception conforme',
            created_by: 'admin',
            created_at: yesterday.toISOString(),
            delivered_at: yesterday.toISOString()
        },
        {
            id: generateId(),
            number: generateDeliveryNumber(),
            type: 'return',
            date: today.toISOString(),
            customer_name: 'Client DEF',
            customer_id: 'client_002',
            status: 'draft',
            items: [
                { product_name: 'Produit E', quantity: 1, unit_price: 75.00 }
            ],
            notes: 'Produit défectueux',
            created_by: 'admin',
            created_at: today.toISOString()
        }
    ];
}

/**
 * Génère un ID unique
 */
function generateId() {
    return 'dn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Génère un numéro de bon de livraison
 */
function generateDeliveryNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const sequence = (deliveryNotes.length + 1).toString().padStart(4, '0');
    
    return `${DELIVERY_CONFIG.numberPrefix}${year}${month}${day}-${sequence}`;
}

/**
 * Met à jour l'affichage de la liste
 */
function updateDisplay() {
    const tbody = document.getElementById('deliveryNotesTableBody');
    if (!tbody) return;

    if (filteredDeliveryNotes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-500">
                    <div class="flex flex-col items-center">
                        <svg class="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5"></path>
                        </svg>
                        <p>Aucun bon de livraison trouvé</p>
                        <button onclick="showNewDeliveryModalWrapper()" class="mt-2 text-green-600 hover:text-green-800">
                            Créer le premier bon
                        </button>
                    </div>
                </td>
            </tr>
        `;
        updatePagination(0);
        return;
    }

    // Calculer la pagination
    totalPages = Math.ceil(filteredDeliveryNotes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredDeliveryNotes.length);
    const pageData = filteredDeliveryNotes.slice(startIndex, endIndex);

    tbody.innerHTML = pageData.map(delivery => `
        <tr class="fade-in">
            <td class="font-medium">${delivery.number}</td>
            <td>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeClass(delivery.type)}">
                    ${getTypeIcon(delivery.type)} ${getTypeLabel(delivery.type)}
                </span>
            </td>
            <td>${formatDate(delivery.date)}</td>
            <td>${delivery.customer_name || delivery.supplier_name || '-'}</td>
            <td>${delivery.items.length} article(s)</td>
            <td>
                <span class="status-badge status-${delivery.status}">
                    ${getStatusLabel(delivery.status)}
                </span>
            </td>
            <td>
                <div class="flex items-center">
                    <button onclick="editDelivery('${delivery.id}')" class="action-btn btn-edit" title="Modifier">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="printDelivery('${delivery.id}')" class="action-btn btn-print" title="Imprimer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                        </svg>
                    </button>
                    ${delivery.status !== 'delivered' ? `
                        <button onclick="markAsDelivered('${delivery.id}')" class="action-btn" style="background: #d1fae5; color: #065f46;" title="Marquer comme livré">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </button>
                    ` : ''}
                    <button onclick="deleteDelivery('${delivery.id}')" class="action-btn btn-delete" title="Supprimer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Mettre à jour la pagination
    updatePagination(filteredDeliveryNotes.length);
}

/**
 * Met à jour les statistiques
 */
function updateStatistics() {
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const stats = {
        total: deliveryNotes.length,
        pending: deliveryNotes.filter(d => d.status === 'confirmed').length,
        deliveredToday: deliveryNotes.filter(d => 
            d.status === 'delivered' && 
            new Date(d.delivered_at || d.date).toDateString() === today
        ).length,
        monthly: deliveryNotes.filter(d => {
            const date = new Date(d.date);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        }).length
    };

    // Mettre à jour les éléments
    updateElementText('totalDeliveries', stats.total);
    updateElementText('pendingDeliveries', stats.pending);
    updateElementText('deliveredToday', stats.deliveredToday);
    updateElementText('monthlyDeliveries', stats.monthly);
}

/**
 * Met à jour le texte d'un élément
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Gère la recherche
 */
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    applyFilters();
}

/**
 * Gère les filtres
 */
function handleFilter() {
    applyFilters();
}

/**
 * Applique les filtres
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    filteredDeliveryNotes = deliveryNotes.filter(delivery => {
        const matchesSearch = !searchTerm || 
            delivery.number.toLowerCase().includes(searchTerm) ||
            (delivery.customer_name && delivery.customer_name.toLowerCase().includes(searchTerm)) ||
            (delivery.supplier_name && delivery.supplier_name.toLowerCase().includes(searchTerm));
        
        const matchesType = !typeFilter || delivery.type === typeFilter;
        const matchesStatus = !statusFilter || delivery.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    updateDisplay();
}

/**
 * Wrapper pour l'appel depuis le HTML
 */
function showNewDeliveryModalWrapper() {
    showNewDeliveryModal().catch(error => {
        console.error('❌ Erreur lors de l\'ouverture de la modale:', error);
        showNotification('Erreur lors de l\'ouverture de la modale', 'error');
    });
}

/**
 * Affiche la modale de nouveau bon de livraison
 */
async function showNewDeliveryModal() {
    console.log('📝 Ouverture de la modale nouveau bon de livraison');

    // Vérifier que les données sont chargées
    if (!allClients || allClients.length === 0) {
        console.log('👥 Rechargement des clients...');
        await loadClients();
    }

    if (!allProducts || allProducts.length === 0) {
        console.log('📦 Rechargement des produits...');
        await loadProducts();
    }

    isEditMode = false;
    currentDeliveryNote = null;
    currentItems = [];

    // Réinitialiser le formulaire
    resetForm();

    // Mettre à jour le titre
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Nouveau Bon de Livraison';
    }

    // Ajouter un premier article par défaut
    addNewItem();

    // Initialiser la recherche client après l'affichage de la modale
    setTimeout(() => {
        initializeClientSearch();
    }, 100);

    // Afficher la modale
    showDeliveryModal();
}

/**
 * Rafraîchit les données
 */
async function refreshData() {
    console.log('🔄 Rafraîchissement des données...');
    await loadDeliveryNotes();
    updateDisplay();
    updateStatistics();
    console.log('✅ Données rafraîchies');
}

/**
 * Modifie un bon de livraison
 */
function editDelivery(id) {
    console.log('✏️ Modification du bon de livraison:', id);

    const delivery = deliveryNotes.find(d => d.id === id);
    if (!delivery) {
        alert('Bon de livraison non trouvé');
        return;
    }

    isEditMode = true;
    currentDeliveryNote = delivery;
    currentItems = [...delivery.items];

    // Remplir le formulaire avec les données existantes
    fillForm(delivery);

    // Mettre à jour le titre
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Modifier le Bon ${delivery.number}`;
    }

    // Afficher la modale
    showDeliveryModal();
}

/**
 * Imprime un bon de livraison
 */
async function printDelivery(id) {
    console.log('🖨️ Impression du bon de livraison:', id);

    const delivery = deliveryNotes.find(d => d.id === id);
    if (!delivery) {
        alert('Bon de livraison non trouvé');
        return;
    }

    // Générer l'aperçu d'impression
    await generatePrintPreview(delivery);

    // Afficher la modale d'impression
    showPrintModal();
}

/**
 * Marque un bon de livraison comme livré
 */
async function markAsDelivered(id) {
    try {
        const delivery = deliveryNotes.find(d => d.id === id);
        if (!delivery) {
            alert('Bon de livraison non trouvé');
            return;
        }

        if (delivery.status === 'delivered') {
            alert('Ce bon de livraison est déjà marqué comme livré');
            return;
        }

        // Demander confirmation
        const confirmMessage = `Marquer le bon ${delivery.number} comme livré ?\n\nCela mettra automatiquement à jour les stocks.`;
        if (!confirm(confirmMessage)) {
            return;
        }

        // Mettre à jour le statut
        await updateDeliveryStatus(id, 'delivered', 'Marqué comme livré manuellement');

        // Rafraîchir l'affichage
        applyFilters();
        updateStatistics();

        alert(`Bon de livraison ${delivery.number} marqué comme livré avec succès !`);
        console.log('✅ Bon de livraison marqué comme livré');

    } catch (error) {
        console.error('❌ Erreur lors du marquage comme livré:', error);
        alert('Erreur lors du marquage comme livré');
    }
}

/**
 * Supprime un bon de livraison
 */
async function deleteDelivery(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bon de livraison ?')) {
        return;
    }

    try {
        deliveryNotes = deliveryNotes.filter(d => d.id !== id);
        await saveDeliveryNotes();
        applyFilters();
        updateStatistics();
        console.log('✅ Bon de livraison supprimé');
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
    }
}

// Fonctions utilitaires pour l'affichage
function getTypeClass(type) {
    const classes = {
        incoming: 'bg-blue-100 text-blue-800',
        outgoing: 'bg-green-100 text-green-800',
        return: 'bg-orange-100 text-orange-800'
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
}

function getTypeIcon(type) {
    const icons = {
        incoming: '📥',
        outgoing: '📤',
        return: '🔄'
    };
    return icons[type] || '📦';
}

function getTypeLabel(type) {
    const labels = {
        incoming: 'Entrant',
        outgoing: 'Sortant',
        return: 'Retour'
    };
    return labels[type] || type;
}

function getStatusLabel(status) {
    const labels = {
        draft: 'Brouillon',
        confirmed: 'Confirmé',
        delivered: 'Livré',
        cancelled: 'Annulé'
    };
    return labels[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ===== FONCTIONS MODALES =====

/**
 * Affiche la modale de bon de livraison
 */
function showDeliveryModal() {
    const modal = document.getElementById('deliveryModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cache la modale de bon de livraison
 */
function hideDeliveryModal() {
    const modal = document.getElementById('deliveryModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetForm();
    }
}

/**
 * Affiche la modale d'impression
 */
function showPrintModal() {
    const modal = document.getElementById('printModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cache la modale d'impression
 */
function hidePrintModal() {
    const modal = document.getElementById('printModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Réinitialise le formulaire
 */
function resetForm() {
    const form = document.getElementById('deliveryForm');
    if (form) {
        form.reset();
    }

    // Définir la date d'aujourd'hui par défaut
    const dateInput = document.getElementById('deliveryDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Réinitialiser les articles
    currentItems = [];
    updateItemsList();

    // Réinitialiser le type et le label
    handleTypeChange();
}

/**
 * Remplit le formulaire avec les données d'un bon existant
 */
function fillForm(delivery) {
    // Informations générales
    const typeSelect = document.getElementById('deliveryType');
    const dateInput = document.getElementById('deliveryDate');
    const clientInput = document.getElementById('clientName');
    const notesInput = document.getElementById('deliveryNotes');

    if (typeSelect) typeSelect.value = delivery.type;
    if (dateInput) dateInput.value = delivery.date.split('T')[0];
    if (clientInput) clientInput.value = delivery.customer_name || delivery.supplier_name || '';
    if (notesInput) notesInput.value = delivery.notes || '';

    // Mettre à jour le label client/fournisseur
    handleTypeChange();

    // Articles
    currentItems = [...delivery.items];
    updateItemsList();
}

/**
 * Gère le changement de type de bon
 */
function handleTypeChange() {
    const typeSelect = document.getElementById('deliveryType');
    const clientLabel = document.getElementById('clientLabel');
    const clientInput = document.getElementById('clientName');

    if (!typeSelect || !clientLabel || !clientInput) return;

    const type = typeSelect.value;

    switch (type) {
        case 'incoming':
            clientLabel.textContent = 'Fournisseur';
            clientInput.placeholder = 'Nom du fournisseur';
            break;
        case 'outgoing':
            clientLabel.textContent = 'Client';
            clientInput.placeholder = 'Nom du client';
            break;
        case 'return':
            clientLabel.textContent = 'Client (retour)';
            clientInput.placeholder = 'Nom du client';
            break;
        default:
            clientLabel.textContent = 'Client/Fournisseur';
            clientInput.placeholder = 'Nom du client/fournisseur';
    }
}

/**
 * Ajoute un nouvel article
 */
function addNewItem() {
    console.log('➕ Ajout d\'un nouvel article...');
    console.log('📦 Produits disponibles:', allProducts ? allProducts.length : 'Non chargés');
    console.log('👥 Clients disponibles:', allClients ? allClients.length : 'Non chargés');

    const newItem = {
        id: Date.now().toString(),
        product_id: null,
        product_name: '',
        quantity: 1,
        unit_price: 0
    };

    currentItems.push(newItem);
    console.log('📋 Articles actuels:', currentItems.length);

    try {
        updateItemsList();
        console.log('✅ Liste des articles mise à jour');
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de la liste:', error);
    }
}

/**
 * Met à jour la liste des articles
 */
function updateItemsList() {
    const itemsList = document.getElementById('itemsList');
    if (!itemsList) return;

    if (currentItems.length === 0) {
        itemsList.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <p>Aucun article ajouté</p>
                <button type="button" onclick="addNewItem()" class="text-green-600 hover:text-green-800 text-sm">
                    Ajouter le premier article
                </button>
            </div>
        `;
        return;
    }

    // Générer les éléments avec les nouveaux sélecteurs
    itemsList.innerHTML = '';

    currentItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-row bg-gray-50 dark:bg-gray-800 p-4 rounded-lg';
        itemDiv.dataset.itemIndex = index;

        itemDiv.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                <!-- Sélecteur de produit -->
                <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Produit
                    </label>
                    <div id="productSelect-${index}"></div>
                    <div class="stock-info mt-1 hidden"></div>
                </div>

                <!-- Quantité -->
                <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantité
                    </label>
                    <input type="number"
                           value="${item.quantity}"
                           onchange="updateItem(${index}, 'quantity', parseInt(this.value)); calculateItemTotal(${index})"
                           min="1"
                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                           required>
                </div>

                <!-- Prix unitaire -->
                <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prix unitaire (MAD)
                    </label>
                    <input type="number"
                           value="${item.unit_price || 0}"
                           onchange="updateItem(${index}, 'unit_price', parseFloat(this.value)); calculateItemTotal(${index})"
                           min="0"
                           step="0.01"
                           placeholder="Prix unitaire"
                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                           required>
                </div>

                <!-- Actions -->
                <div class="flex items-end">
                    <div class="w-full space-y-2">
                        <div class="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Total: <span id="itemTotal-${index}" class="font-semibold text-green-600">0.00 MAD</span>
                        </div>
                        <button type="button"
                                onclick="removeItem(${index})"
                                class="w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        `;

        itemsList.appendChild(itemDiv);

        // Ajouter le sélecteur de produit avec recherche
        const productSelectContainer = document.getElementById(`productSelect-${index}`);
        if (productSelectContainer) {
            try {
                const productSearchContainer = createProductSelect(index);
                productSelectContainer.appendChild(productSearchContainer);

                // Pré-remplir le produit si défini
                if (item.product_id && item.product_name) {
                    const searchInput = document.getElementById(`productSearch-${index}`);
                    if (searchInput) {
                        searchInput.value = item.product_name;
                    }
                }

                // Calculer le total initial
                setTimeout(() => calculateItemTotal(index), 100);
            } catch (error) {
                console.error('❌ Erreur lors de la création du sélecteur de produit:', error);
                // Fallback : créer un input texte simple
                productSelectContainer.innerHTML = `
                    <input type="text"
                           placeholder="Nom du produit"
                           value="${item.product_name || ''}"
                           onchange="updateItem(${index}, 'product_name', this.value)"
                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                           required>
                `;
            }
        }
    });
}

/**
 * Met à jour un article
 */
function updateItem(index, field, value) {
    if (currentItems[index]) {
        currentItems[index][field] = value;
    }
}

/**
 * Calcule le total d'un article
 */
function calculateItemTotal(index) {
    const item = currentItems[index];
    if (!item) {
        console.warn(`⚠️ Article ${index} non trouvé pour le calcul du total`);
        return;
    }

    const quantity = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    const total = quantity * unitPrice;

    // Utiliser setTimeout pour s'assurer que l'élément DOM existe
    setTimeout(() => {
        const totalElement = document.getElementById(`itemTotal-${index}`);
        if (totalElement) {
            totalElement.textContent = `${total.toFixed(2)} MAD`;
            console.log(`💰 Total article ${index}: ${total.toFixed(2)} MAD`);
        } else {
            console.warn(`⚠️ Élément total ${index} non trouvé dans le DOM`);
        }
    }, 50);

    // Mettre à jour le total général
    calculateGrandTotal();
}

/**
 * Calcule le total général de tous les articles
 */
function calculateGrandTotal() {
    const grandTotal = currentItems.reduce((sum, item) => {
        return sum + ((item.quantity || 0) * (item.unit_price || 0));
    }, 0);

    // Afficher le total quelque part (à ajouter dans l'interface si nécessaire)
    console.log('💰 Total général:', grandTotal.toFixed(2), 'MAD');
}

/**
 * Supprime un article
 */
function removeItem(index) {
    currentItems.splice(index, 1);
    updateItemsList();
}

/**
 * Gère la soumission du formulaire
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    try {
        // Récupérer les données du formulaire
        const formData = getFormData();

        // Valider les données
        if (!validateFormData(formData)) {
            return;
        }

        if (isEditMode && currentDeliveryNote) {
            // Modification
            await updateDeliveryNote(formData);
        } else {
            // Création
            await createDeliveryNote(formData);
        }

        // Fermer la modale
        hideDeliveryModal();

        // Rafraîchir l'affichage
        applyFilters();
        updateStatistics();

        console.log('✅ Bon de livraison sauvegardé');

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde du bon de livraison');
    }
}

/**
 * Récupère les données du formulaire
 */
function getFormData() {
    const typeSelect = document.getElementById('deliveryType');
    const dateInput = document.getElementById('deliveryDate');
    const clientSelect = document.getElementById('clientSelect');
    const notesInput = document.getElementById('deliveryNotes');

    const type = typeSelect?.value || 'outgoing';

    // Utiliser le client sélectionné ou fallback sur l'ancien système
    let clientName = '';
    let clientId = null;

    if (selectedClient) {
        clientName = selectedClient.name;
        clientId = selectedClient.id;
    } else if (clientSelect?.value) {
        // Fallback si selectedClient n'est pas défini mais qu'une sélection existe
        const selectedOption = clientSelect.options[clientSelect.selectedIndex];
        if (selectedOption.dataset.client) {
            const client = JSON.parse(selectedOption.dataset.client);
            clientName = client.name;
            clientId = client.id;
        }
    }

    // Filtrer et enrichir les articles avec les informations produit
    const validItems = currentItems.filter(item => {
        return item.product_id && item.quantity > 0;
    }).map(item => {
        // Trouver le produit correspondant pour récupérer le nom
        const product = allProducts.find(p => p.id == item.product_id);
        return {
            ...item,
            product_name: product ? product.name : item.product_name || 'Produit inconnu',
            product_barcode: product ? product.barcode : null
        };
    });

    return {
        type: type,
        date: dateInput?.value ? new Date(dateInput.value).toISOString() : new Date().toISOString(),
        [type === 'incoming' ? 'supplier_name' : 'customer_name']: clientName,
        [type === 'incoming' ? 'supplier_id' : 'customer_id']: clientId,
        items: validItems,
        notes: notesInput?.value?.trim() || '',
        status: 'draft'
    };
}

/**
 * Valide les données du formulaire
 */
function validateFormData(data) {
    if (!data.customer_name && !data.supplier_name) {
        alert('Veuillez saisir le nom du client/fournisseur');
        return false;
    }

    if (data.items.length === 0) {
        alert('Veuillez ajouter au moins un article');
        return false;
    }

    for (let item of data.items) {
        if (!item.product_name.trim()) {
            alert('Veuillez saisir le nom de tous les produits');
            return false;
        }
        if (item.quantity <= 0) {
            alert('La quantité doit être supérieure à 0');
            return false;
        }
    }

    return true;
}

/**
 * Crée un nouveau bon de livraison
 */
async function createDeliveryNote(data) {
    const newDelivery = {
        id: generateId(),
        number: generateDeliveryNumber(),
        ...data,
        created_by: 'admin', // TODO: Récupérer l'utilisateur connecté
        created_at: new Date().toISOString()
    };

    deliveryNotes.push(newDelivery);
    await saveDeliveryNotes();
}

/**
 * Met à jour un bon de livraison existant
 */
async function updateDeliveryNote(data) {
    const index = deliveryNotes.findIndex(d => d.id === currentDeliveryNote.id);
    if (index !== -1) {
        const oldDelivery = { ...currentDeliveryNote };
        const newDelivery = {
            ...currentDeliveryNote,
            ...data,
            updated_at: new Date().toISOString()
        };

        deliveryNotes[index] = newDelivery;
        await saveDeliveryNotes();

        // Mettre à jour les stocks si le statut change
        await handleStockUpdate(oldDelivery, newDelivery);
    }
}

/**
 * Génère un ID client/fournisseur
 */
function generateClientId(name) {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now();
}

// ===== FONCTIONS D'IMPRESSION =====

/**
 * Génère l'aperçu d'impression
 */
async function generatePrintPreview(delivery) {
    const preview = document.getElementById('printPreview');
    if (!preview) return;

    const total = delivery.items.reduce((sum, item) => sum + (item.quantity * (item.unit_price || 0)), 0);

    // Récupérer les informations de la société
    let companyInfo = {};
    try {
        companyInfo = await window.api.settings.getCompanyInfo();
    } catch (error) {
        console.warn('Impossible de récupérer les informations de la société:', error);
        companyInfo = {
            name: 'VOTRE SOCIÉTÉ',
            address: 'Adresse de votre société',
            phone: 'Téléphone',
            email: 'Email',
            ice: 'ICE'
        };
    }

    preview.innerHTML = `
        <div class="print-document">
            <!-- En-tête Société -->
            <div class="company-header mb-6 border-b-2 border-gray-300 pb-6">
                <div class="flex justify-between items-start">
                    <div class="company-info">
                        ${companyInfo.logo ? `<img src="${companyInfo.logo}" alt="Logo" class="company-logo mb-3" style="max-height: 80px; max-width: 200px;">` : ''}
                        <h2 class="text-xl font-bold text-gray-900 mb-2">${companyInfo.name || 'VOTRE SOCIÉTÉ'}</h2>
                        ${companyInfo.address ? `<p class="text-sm text-gray-600 mb-1"><strong>Adresse:</strong> ${companyInfo.address}</p>` : ''}
                        <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                            ${companyInfo.phone ? `<span><strong>Tél:</strong> ${companyInfo.phone}</span>` : ''}
                            ${companyInfo.email ? `<span><strong>Email:</strong> ${companyInfo.email}</span>` : ''}
                        </div>
                        ${companyInfo.ice ? `<p class="text-sm text-gray-600 mt-1"><strong>ICE:</strong> ${companyInfo.ice}</p>` : ''}
                        ${companyInfo.website ? `<p class="text-sm text-gray-600"><strong>Site web:</strong> ${companyInfo.website}</p>` : ''}
                    </div>
                    <div class="document-info text-right">
                        <h1 class="text-2xl font-bold text-gray-900 mb-2">BON DE LIVRAISON</h1>
                        <p class="text-lg font-semibold text-gray-700">${delivery.number}</p>
                        <p class="text-sm text-gray-600 mt-2">Date: ${new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
            </div>

            <!-- Informations générales -->
            <div class="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <h3 class="font-semibold text-gray-900 mb-2">Informations générales</h3>
                    <p><strong>Type:</strong> ${getTypeLabel(delivery.type)}</p>
                    <p><strong>Date:</strong> ${formatDate(delivery.date)}</p>
                    <p><strong>Statut:</strong> ${getStatusLabel(delivery.status)}</p>
                </div>
                <div>
                    <h3 class="font-semibold text-gray-900 mb-2">${delivery.type === 'incoming' ? 'Fournisseur' : 'Client'}</h3>
                    <p class="font-medium">${delivery.customer_name || delivery.supplier_name || '-'}</p>
                </div>
            </div>

            <!-- Articles -->
            <div class="mb-6">
                <h3 class="font-semibold text-gray-900 mb-3">Articles</h3>
                <table class="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border border-gray-300 px-3 py-2 text-left">Produit</th>
                            <th class="border border-gray-300 px-3 py-2 text-center">Quantité</th>
                            ${delivery.items.some(item => item.unit_price > 0) ? '<th class="border border-gray-300 px-3 py-2 text-right">Prix Unit.</th><th class="border border-gray-300 px-3 py-2 text-right">Total</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${delivery.items.map(item => `
                            <tr>
                                <td class="border border-gray-300 px-3 py-2">${item.product_name}</td>
                                <td class="border border-gray-300 px-3 py-2 text-center">${item.quantity}</td>
                                ${item.unit_price > 0 ? `
                                    <td class="border border-gray-300 px-3 py-2 text-right">${item.unit_price.toFixed(2)} MAD</td>
                                    <td class="border border-gray-300 px-3 py-2 text-right">${(item.quantity * item.unit_price).toFixed(2)} MAD</td>
                                ` : ''}
                            </tr>
                        `).join('')}
                        ${total > 0 ? `
                            <tr class="bg-gray-50 font-semibold">
                                <td class="border border-gray-300 px-3 py-2" colspan="${delivery.items.some(item => item.unit_price > 0) ? '3' : '1'}">TOTAL</td>
                                <td class="border border-gray-300 px-3 py-2 text-right">${total.toFixed(2)} MAD</td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>

            <!-- Notes -->
            ${delivery.notes ? `
                <div class="mb-6">
                    <h3 class="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p class="text-gray-700 bg-gray-50 p-3 rounded">${delivery.notes}</p>
                </div>
            ` : ''}

            <!-- Signatures -->
            <div class="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-300">
                <div class="text-center">
                    <div class="border-t border-gray-400 mt-12 pt-2">
                        <p class="text-sm text-gray-600">Signature ${delivery.type === 'incoming' ? 'Fournisseur' : 'Client'}</p>
                    </div>
                </div>
                <div class="text-center">
                    <div class="border-t border-gray-400 mt-12 pt-2">
                        <p class="text-sm text-gray-600">Signature Responsable</p>
                    </div>
                </div>
            </div>

            <!-- Pied de page -->
            <div class="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-gray-200">
                <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
        </div>
    `;
}

/**
 * Gère l'impression
 */
function handlePrint() {
    const printContent = document.getElementById('printPreview');
    if (!printContent) return;

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les pop-ups ne sont pas bloqués.');
        return;
    }

    // Styles pour l'impression
    const printStyles = `
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
            .print-document { max-width: 800px; margin: 0 auto; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; }
            th { background-color: #f0f0f0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .mb-2 { margin-bottom: 8px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-6 { margin-bottom: 24px; }
            .mt-6 { margin-top: 24px; }
            .mt-8 { margin-top: 32px; }
            .mt-12 { margin-top: 48px; }
            .pt-2 { padding-top: 8px; }
            .pt-4 { padding-top: 16px; }
            .pt-6 { padding-top: 24px; }
            .pb-4 { padding-bottom: 16px; }
            .p-3 { padding: 12px; }
            .px-3 { padding-left: 12px; padding-right: 12px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .border-t { border-top: 1px solid #ccc; }
            .border-b-2 { border-bottom: 2px solid #ccc; }
            .bg-gray-50 { background-color: #f9f9f9; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .gap-6 { gap: 24px; }

            /* Styles pour l'en-tête société */
            .company-header {
                border-bottom: 2px solid #000;
                padding-bottom: 20px;
                margin-bottom: 20px;
            }
            .company-info {
                flex: 1;
                max-width: 60%;
            }
            .company-logo {
                max-height: 80px;
                max-width: 200px;
                margin-bottom: 10px;
                display: block;
            }
            .document-info {
                text-align: right;
                flex: 1;
                max-width: 35%;
            }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-start { align-items: flex-start; }
            .flex-wrap { flex-wrap: wrap; }
            .gap-4 { gap: 16px; }
            .mb-1 { margin-bottom: 4px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .text-gray-900 { color: #111827; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-sm { font-size: 14px; }
            .text-lg { font-size: 18px; }
            .text-xl { font-size: 20px; }
            .text-2xl { font-size: 24px; }

            @media print {
                body { margin: 0; }
                .print-document { margin: 0; }
                .company-header {
                    page-break-inside: avoid;
                    border-bottom: 2px solid #000;
                }
                .company-logo {
                    max-height: 60px;
                    max-width: 150px;
                }
            }
        </style>
    `;

    // Contenu HTML pour l'impression
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bon de Livraison</title>
            <meta charset="utf-8">
            ${printStyles}
        </head>
        <body>
            ${printContent.innerHTML}
        </body>
        </html>
    `);

    printWindow.document.close();

    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
    };

    // Fermer la modale d'impression
    hidePrintModal();
}

// ===== INTÉGRATIONS SYSTÈME =====

/**
 * Gère la mise à jour des stocks lors des changements de statut
 */
async function handleStockUpdate(oldDelivery, newDelivery) {
    try {
        // Vérifier si le statut a changé vers "delivered"
        if (oldDelivery.status !== 'delivered' && newDelivery.status === 'delivered') {
            await updateStockFromDelivery(newDelivery, 'delivered');
        }
        // Vérifier si le statut a changé depuis "delivered" vers autre chose
        else if (oldDelivery.status === 'delivered' && newDelivery.status !== 'delivered') {
            await updateStockFromDelivery(oldDelivery, 'cancelled');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des stocks:', error);
        // Ne pas bloquer l'opération principale
    }
}

/**
 * Met à jour les stocks en fonction du bon de livraison
 */
async function updateStockFromDelivery(delivery, action) {
    try {
        console.log(`📦 Mise à jour stock pour bon ${delivery.number}, action: ${action}`);

        for (const item of delivery.items) {
            await updateProductStock(item, delivery.type, action);
        }

        console.log('✅ Stocks mis à jour avec succès');

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des stocks:', error);
        throw error;
    }
}

/**
 * Met à jour le stock d'un produit spécifique
 */
async function updateProductStock(item, deliveryType, action) {
    try {
        // Charger les produits depuis localStorage
        const products = await loadProductsFromStorage();

        // Trouver le produit par nom (approximatif)
        const product = findProductByName(products, item.product_name);

        if (!product) {
            console.warn(`⚠️ Produit non trouvé: ${item.product_name}`);
            return;
        }

        // Calculer la variation de stock
        let stockChange = 0;

        if (deliveryType === 'incoming') {
            // Bon entrant : augmente le stock quand livré
            stockChange = action === 'delivered' ? item.quantity : -item.quantity;
        } else if (deliveryType === 'outgoing') {
            // Bon sortant : diminue le stock quand livré
            stockChange = action === 'delivered' ? -item.quantity : item.quantity;
        } else if (deliveryType === 'return') {
            // Bon retour : augmente le stock quand livré (retour en stock)
            stockChange = action === 'delivered' ? item.quantity : -item.quantity;
        }

        // Appliquer la variation
        if (stockChange !== 0) {
            product.stock = Math.max(0, (product.stock || 0) + stockChange);

            // Sauvegarder les produits
            await saveProductsToStorage(products);

            console.log(`📊 Stock ${product.name}: ${stockChange > 0 ? '+' : ''}${stockChange} (nouveau: ${product.stock})`);
        }

    } catch (error) {
        console.error(`❌ Erreur mise à jour stock ${item.product_name}:`, error);
    }
}

/**
 * Charge les produits depuis localStorage
 */
async function loadProductsFromStorage() {
    try {
        const stored = localStorage.getItem('products');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('❌ Erreur chargement produits:', error);
        return [];
    }
}

/**
 * Sauvegarde les produits dans localStorage
 */
async function saveProductsToStorage(products) {
    try {
        localStorage.setItem('products', JSON.stringify(products));
    } catch (error) {
        console.error('❌ Erreur sauvegarde produits:', error);
        throw error;
    }
}

/**
 * Trouve un produit par nom (recherche approximative)
 */
function findProductByName(products, productName) {
    if (!products || !productName) return null;

    const searchName = productName.toLowerCase().trim();

    // Recherche exacte d'abord
    let product = products.find(p => p.name && p.name.toLowerCase().trim() === searchName);

    // Si pas trouvé, recherche approximative
    if (!product) {
        product = products.find(p => p.name && p.name.toLowerCase().includes(searchName));
    }

    // Si toujours pas trouvé, recherche inverse
    if (!product) {
        product = products.find(p => p.name && searchName.includes(p.name.toLowerCase()));
    }

    return product;
}

/**
 * Ajoute un statut avancé au bon de livraison
 */
async function updateDeliveryStatus(deliveryId, newStatus, notes = '') {
    try {
        const delivery = deliveryNotes.find(d => d.id === deliveryId);
        if (!delivery) {
            throw new Error('Bon de livraison non trouvé');
        }

        const oldStatus = delivery.status;
        delivery.status = newStatus;
        delivery.status_updated_at = new Date().toISOString();
        delivery.status_notes = notes;

        // Ajouter à l'historique des statuts
        if (!delivery.status_history) {
            delivery.status_history = [];
        }

        delivery.status_history.push({
            from: oldStatus,
            to: newStatus,
            timestamp: new Date().toISOString(),
            notes: notes,
            updated_by: 'admin' // TODO: Récupérer l'utilisateur connecté
        });

        // Sauvegarder
        await saveDeliveryNotes();

        // Mettre à jour les stocks si nécessaire
        await handleStockUpdate({ ...delivery, status: oldStatus }, delivery);

        console.log(`✅ Statut mis à jour: ${oldStatus} → ${newStatus}`);

        return delivery;

    } catch (error) {
        console.error('❌ Erreur mise à jour statut:', error);
        throw error;
    }
}

// ===== SYSTÈME DE NOTIFICATIONS =====

/**
 * Vérifie les bons de livraison en retard et génère des alertes
 */
function checkDeliveryAlerts() {
    try {
        const alerts = [];
        const today = new Date();
        const twoDaysAgo = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000));

        for (const delivery of deliveryNotes) {
            const deliveryDate = new Date(delivery.date);

            // Bon confirmé depuis plus de 2 jours
            if (delivery.status === 'confirmed' && deliveryDate < twoDaysAgo) {
                alerts.push({
                    type: 'warning',
                    title: 'Livraison en retard',
                    message: `Le bon ${delivery.number} est confirmé depuis ${Math.floor((today - deliveryDate) / (24 * 60 * 60 * 1000))} jours`,
                    deliveryId: delivery.id,
                    priority: 'medium'
                });
            }

            // Bon sortant non livré depuis plus de 3 jours
            if (delivery.type === 'outgoing' && delivery.status !== 'delivered' && deliveryDate < new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000))) {
                alerts.push({
                    type: 'error',
                    title: 'Livraison client urgente',
                    message: `Le bon sortant ${delivery.number} pour ${delivery.customer_name} n'est pas livré depuis ${Math.floor((today - deliveryDate) / (24 * 60 * 60 * 1000))} jours`,
                    deliveryId: delivery.id,
                    priority: 'high'
                });
            }

            // Stock critique après livraison entrant
            if (delivery.type === 'incoming' && delivery.status === 'delivered') {
                // Cette vérification nécessiterait l'accès aux données de stock
                // Pour l'instant, on peut juste noter que c'est une fonctionnalité à implémenter
            }
        }

        return alerts;

    } catch (error) {
        console.error('❌ Erreur lors de la vérification des alertes:', error);
        return [];
    }
}

/**
 * Affiche les notifications d'alerte
 */
function showDeliveryAlerts() {
    const alerts = checkDeliveryAlerts();

    if (alerts.length === 0) {
        return;
    }

    // Trier par priorité
    alerts.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Afficher les alertes les plus importantes
    const highPriorityAlerts = alerts.filter(a => a.priority === 'high');
    const mediumPriorityAlerts = alerts.filter(a => a.priority === 'medium');

    if (highPriorityAlerts.length > 0) {
        console.warn('🚨 Alertes haute priorité:', highPriorityAlerts);
        // Ici on pourrait intégrer avec le système d'alertes du dashboard
    }

    if (mediumPriorityAlerts.length > 0) {
        console.warn('⚠️ Alertes priorité moyenne:', mediumPriorityAlerts);
    }

    return alerts;
}

/**
 * Initialise le système de vérification automatique des alertes
 */
function initializeAlertSystem() {
    // Vérifier les alertes au chargement
    showDeliveryAlerts();

    // Vérifier les alertes toutes les 5 minutes
    setInterval(() => {
        showDeliveryAlerts();
    }, 5 * 60 * 1000);

    console.log('✅ Système d\'alertes initialisé');
}

/**
 * Intégration avec le système d'alertes du dashboard
 */
function integrateWithDashboardAlerts() {
    try {
        // Vérifier si le système d'alertes du dashboard est disponible
        if (typeof window.AlertsManager !== 'undefined' && window.alertsManager) {
            const alerts = checkDeliveryAlerts();

            for (const alert of alerts) {
                window.alertsManager.addAlert({
                    id: `delivery_${alert.deliveryId}`,
                    type: alert.type,
                    title: alert.title,
                    message: alert.message,
                    timestamp: new Date().toISOString(),
                    module: 'delivery-notes',
                    action: {
                        label: 'Voir le bon',
                        callback: () => {
                            // Rediriger vers la page des bons de livraison avec filtre
                            window.location.href = `delivery-notes.html?highlight=${alert.deliveryId}`;
                        }
                    }
                });
            }

            console.log(`✅ ${alerts.length} alertes intégrées au dashboard`);
        }
    } catch (error) {
        console.error('❌ Erreur intégration alertes dashboard:', error);
    }
}

// ===== SYSTÈME DE REPORTING ET ANALYTICS =====

/**
 * Affiche la modal de reporting
 */
function showReportingModal() {
    const modal = document.getElementById('reportingModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Initialiser les dates par défaut (30 derniers jours)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

        const dateFromInput = document.getElementById('reportDateFrom');
        const dateToInput = document.getElementById('reportDateTo');

        if (dateFromInput) dateFromInput.value = thirtyDaysAgo.toISOString().split('T')[0];
        if (dateToInput) dateToInput.value = today.toISOString().split('T')[0];
    }
}

/**
 * Cache la modal de reporting
 */
function hideReportingModal() {
    const modal = document.getElementById('reportingModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Génère le rapport d'analytics
 */
function generateReport() {
    try {
        const dateFrom = document.getElementById('reportDateFrom')?.value;
        const dateTo = document.getElementById('reportDateTo')?.value;
        const type = document.getElementById('reportType')?.value;

        // Filtrer les données selon les critères
        const filteredData = filterDeliveryNotesForReport(dateFrom, dateTo, type);

        // Générer les statistiques
        const analytics = calculateAnalytics(filteredData);

        // Afficher le rapport
        displayReport(analytics, filteredData);

        console.log('✅ Rapport généré:', analytics);

    } catch (error) {
        console.error('❌ Erreur génération rapport:', error);
        alert('Erreur lors de la génération du rapport');
    }
}

/**
 * Filtre les bons de livraison pour le rapport
 */
function filterDeliveryNotesForReport(dateFrom, dateTo, type) {
    let filtered = [...deliveryNotes];

    // Filtre par date
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filtered = filtered.filter(d => new Date(d.date) >= fromDate);
    }

    if (dateTo) {
        const toDate = new Date(dateTo + 'T23:59:59');
        filtered = filtered.filter(d => new Date(d.date) <= toDate);
    }

    // Filtre par type
    if (type) {
        filtered = filtered.filter(d => d.type === type);
    }

    return filtered;
}

/**
 * Calcule les analytics des bons de livraison
 */
function calculateAnalytics(data) {
    const analytics = {
        total: data.length,
        byType: {},
        byStatus: {},
        byMonth: {},
        totalValue: 0,
        averageValue: 0,
        deliveryTimes: [],
        topCustomers: {},
        topSuppliers: {},
        itemsCount: 0
    };

    data.forEach(delivery => {
        // Par type
        analytics.byType[delivery.type] = (analytics.byType[delivery.type] || 0) + 1;

        // Par statut
        analytics.byStatus[delivery.status] = (analytics.byStatus[delivery.status] || 0) + 1;

        // Par mois
        const month = new Date(delivery.date).toISOString().substr(0, 7);
        analytics.byMonth[month] = (analytics.byMonth[month] || 0) + 1;

        // Valeur totale
        const deliveryValue = delivery.items.reduce((sum, item) =>
            sum + (item.quantity * (item.unit_price || 0)), 0);
        analytics.totalValue += deliveryValue;

        // Clients/Fournisseurs
        if (delivery.customer_name) {
            analytics.topCustomers[delivery.customer_name] =
                (analytics.topCustomers[delivery.customer_name] || 0) + 1;
        }
        if (delivery.supplier_name) {
            analytics.topSuppliers[delivery.supplier_name] =
                (analytics.topSuppliers[delivery.supplier_name] || 0) + 1;
        }

        // Nombre d'articles
        analytics.itemsCount += delivery.items.length;

        // Temps de livraison (si livré)
        if (delivery.status === 'delivered' && delivery.status_history) {
            const created = new Date(delivery.created_at);
            const delivered = delivery.status_history.find(h => h.to === 'delivered');
            if (delivered) {
                const deliveryTime = (new Date(delivered.timestamp) - created) / (24 * 60 * 60 * 1000);
                analytics.deliveryTimes.push(deliveryTime);
            }
        }
    });

    // Valeur moyenne
    analytics.averageValue = analytics.total > 0 ? analytics.totalValue / analytics.total : 0;

    // Temps de livraison moyen
    analytics.averageDeliveryTime = analytics.deliveryTimes.length > 0
        ? analytics.deliveryTimes.reduce((a, b) => a + b, 0) / analytics.deliveryTimes.length
        : 0;

    return analytics;
}

/**
 * Affiche le rapport d'analytics
 */
function displayReport(analytics, data) {
    const container = document.getElementById('reportContent');
    if (!container) return;

    container.innerHTML = `
        <!-- Statistiques générales -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Bons</p>
                        <p class="text-3xl font-bold text-blue-900 dark:text-blue-100">${analytics.total}</p>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-600 dark:text-green-400 text-sm font-medium">Valeur Totale</p>
                        <p class="text-3xl font-bold text-green-900 dark:text-green-100">${analytics.totalValue.toFixed(2)} MAD</p>
                    </div>
                    <div class="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-purple-600 dark:text-purple-400 text-sm font-medium">Valeur Moyenne</p>
                        <p class="text-3xl font-bold text-purple-900 dark:text-purple-100">${analytics.averageValue.toFixed(2)} MAD</p>
                    </div>
                    <div class="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-orange-600 dark:text-orange-400 text-sm font-medium">Temps Livraison Moyen</p>
                        <p class="text-3xl font-bold text-orange-900 dark:text-orange-100">${analytics.averageDeliveryTime.toFixed(1)} jours</p>
                    </div>
                    <div class="w-12 h-12 bg-orange-100 dark:bg-orange-800 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- Graphiques -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Répartition par type -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 class="text-lg font-semibold mb-4">Répartition par Type</h3>
                <div class="space-y-3">
                    ${Object.entries(analytics.byType).map(([type, count]) => {
                        const percentage = ((count / analytics.total) * 100).toFixed(1);
                        const typeLabel = getTypeLabel(type);
                        const color = type === 'outgoing' ? 'bg-blue-500' : type === 'incoming' ? 'bg-green-500' : 'bg-orange-500';
                        return `
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-4 h-4 ${color} rounded mr-3"></div>
                                    <span>${typeLabel}</span>
                                </div>
                                <div class="text-right">
                                    <span class="font-semibold">${count}</span>
                                    <span class="text-sm text-gray-500 ml-2">(${percentage}%)</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Répartition par statut -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 class="text-lg font-semibold mb-4">Répartition par Statut</h3>
                <div class="space-y-3">
                    ${Object.entries(analytics.byStatus).map(([status, count]) => {
                        const percentage = ((count / analytics.total) * 100).toFixed(1);
                        const statusLabel = getStatusLabel(status);
                        const color = status === 'delivered' ? 'bg-green-500' : status === 'confirmed' ? 'bg-blue-500' : 'bg-gray-500';
                        return `
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-4 h-4 ${color} rounded mr-3"></div>
                                    <span>${statusLabel}</span>
                                </div>
                                <div class="text-right">
                                    <span class="font-semibold">${count}</span>
                                    <span class="text-sm text-gray-500 ml-2">(${percentage}%)</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>

        <!-- Top clients/fournisseurs -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Top clients -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 class="text-lg font-semibold mb-4">Top Clients</h3>
                <div class="space-y-3">
                    ${Object.entries(analytics.topCustomers)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([customer, count]) => `
                            <div class="flex items-center justify-between">
                                <span class="truncate">${customer}</span>
                                <span class="font-semibold">${count} bons</span>
                            </div>
                        `).join('')}
                </div>
            </div>

            <!-- Top fournisseurs -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 class="text-lg font-semibold mb-4">Top Fournisseurs</h3>
                <div class="space-y-3">
                    ${Object.entries(analytics.topSuppliers)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([supplier, count]) => `
                            <div class="flex items-center justify-between">
                                <span class="truncate">${supplier}</span>
                                <span class="font-semibold">${count} bons</span>
                            </div>
                        `).join('')}
                </div>
            </div>
        </div>
    `;
}

// ===== SYSTÈME D'EXPORT =====

/**
 * Affiche la modal d'export
 */
function showExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Initialiser les dates par défaut (30 derniers jours)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

        const dateFromInput = document.getElementById('exportDateFrom');
        const dateToInput = document.getElementById('exportDateTo');

        if (dateFromInput) dateFromInput.value = thirtyDaysAgo.toISOString().split('T')[0];
        if (dateToInput) dateToInput.value = today.toISOString().split('T')[0];
    }
}

/**
 * Cache la modal d'export
 */
function hideExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Exporte les données en format Excel
 */
function exportToExcel() {
    try {
        const data = getExportData();
        const workbook = createExcelWorkbook(data);
        downloadExcelFile(workbook, 'bons-de-livraison.xlsx');

        hideExportModal();
        console.log('✅ Export Excel terminé');

    } catch (error) {
        console.error('❌ Erreur export Excel:', error);
        alert('Erreur lors de l\'export Excel');
    }
}

/**
 * Exporte les données en format CSV
 */
function exportToCsv() {
    try {
        const data = getExportData();
        const csv = createCsvContent(data);
        downloadCsvFile(csv, 'bons-de-livraison.csv');

        hideExportModal();
        console.log('✅ Export CSV terminé');

    } catch (error) {
        console.error('❌ Erreur export CSV:', error);
        alert('Erreur lors de l\'export CSV');
    }
}

/**
 * Récupère les données à exporter selon les filtres
 */
function getExportData() {
    const dateFrom = document.getElementById('exportDateFrom')?.value;
    const dateTo = document.getElementById('exportDateTo')?.value;
    const includeItems = document.getElementById('includeItems')?.checked;
    const includeHistory = document.getElementById('includeHistory')?.checked;
    const includeNotes = document.getElementById('includeNotes')?.checked;

    // Filtrer par date
    let filtered = [...deliveryNotes];

    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filtered = filtered.filter(d => new Date(d.date) >= fromDate);
    }

    if (dateTo) {
        const toDate = new Date(dateTo + 'T23:59:59');
        filtered = filtered.filter(d => new Date(d.date) <= toDate);
    }

    // Préparer les données d'export
    const exportData = [];

    filtered.forEach(delivery => {
        if (includeItems && delivery.items.length > 0) {
            // Une ligne par article
            delivery.items.forEach(item => {
                exportData.push({
                    numero_bon: delivery.number,
                    type: getTypeLabel(delivery.type),
                    date: formatDate(delivery.date),
                    statut: getStatusLabel(delivery.status),
                    client_fournisseur: delivery.customer_name || delivery.supplier_name || '',
                    produit: item.product_name,
                    quantite: item.quantity,
                    prix_unitaire: item.unit_price || 0,
                    total_article: (item.quantity * (item.unit_price || 0)).toFixed(2),
                    notes: includeNotes ? delivery.notes || '' : '',
                    cree_par: delivery.created_by || '',
                    date_creation: formatDate(delivery.created_at),
                    derniere_modification: delivery.updated_at ? formatDate(delivery.updated_at) : ''
                });
            });
        } else {
            // Une ligne par bon
            const totalValue = delivery.items.reduce((sum, item) =>
                sum + (item.quantity * (item.unit_price || 0)), 0);

            exportData.push({
                numero_bon: delivery.number,
                type: getTypeLabel(delivery.type),
                date: formatDate(delivery.date),
                statut: getStatusLabel(delivery.status),
                client_fournisseur: delivery.customer_name || delivery.supplier_name || '',
                nombre_articles: delivery.items.length,
                valeur_totale: totalValue.toFixed(2),
                notes: includeNotes ? delivery.notes || '' : '',
                cree_par: delivery.created_by || '',
                date_creation: formatDate(delivery.created_at),
                derniere_modification: delivery.updated_at ? formatDate(delivery.updated_at) : ''
            });
        }
    });

    return exportData;
}

/**
 * Crée le contenu CSV
 */
function createCsvContent(data) {
    if (data.length === 0) return '';

    // En-têtes
    const headers = Object.keys(data[0]);
    let csv = headers.map(h => `"${h}"`).join(',') + '\n';

    // Données
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csv += values.join(',') + '\n';
    });

    return csv;
}

/**
 * Télécharge le fichier CSV
 */
function downloadCsvFile(content, filename) {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Crée un workbook Excel (simulation - nécessiterait une vraie librairie Excel)
 */
function createExcelWorkbook(data) {
    // Pour une vraie implémentation, il faudrait utiliser une librairie comme SheetJS
    // Ici on simule en créant un CSV avec extension .xlsx
    return createCsvContent(data);
}

/**
 * Télécharge le fichier Excel
 */
function downloadExcelFile(content, filename) {
    // Pour une vraie implémentation Excel, il faudrait utiliser SheetJS
    // Ici on télécharge en CSV avec extension .xlsx pour la démo
    downloadCsvFile(content, filename);
}

// ===== SYSTÈME DE PAGINATION =====

/**
 * Met à jour l'affichage de la pagination
 */
function updatePagination(totalItems) {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) {
        // Créer le conteneur de pagination s'il n'existe pas
        createPaginationContainer();
        // Récupérer le conteneur après création
        const newContainer = document.getElementById('paginationContainer');
        if (!newContainer) {
            console.error('❌ Impossible de créer le conteneur de pagination');
            return;
        }
    }

    if (totalItems === 0) {
        paginationContainer.style.display = 'none';
        return;
    }

    totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    paginationContainer.innerHTML = `
        <div class="flex items-center justify-between w-full">
            <div class="text-sm text-gray-700 dark:text-gray-300">
                Affichage de ${startItem} à ${endItem} sur ${totalItems} résultats
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}
                        class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
                    </svg>
                </button>
                <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}
                        class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>

                ${generatePageNumbers()}

                <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}
                        class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
                <button onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}
                        class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

/**
 * Génère les numéros de page
 */
function generatePageNumbers() {
    let pages = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Ajuster si on est près de la fin
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages += `
            <button onclick="goToPage(${i})"
                    class="pagination-btn ${i === currentPage ? 'active' : ''}">
                ${i}
            </button>
        `;
    }

    return pages;
}

/**
 * Navigue vers une page spécifique
 */
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;

    currentPage = page;
    updateDisplay();
}

/**
 * Crée le conteneur de pagination
 */
function createPaginationContainer() {
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;

    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'paginationContainer';
    paginationContainer.className = 'pagination-container flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700';

    tableContainer.appendChild(paginationContainer);
}

// ===== OPTIMISATIONS DE RECHERCHE =====

/**
 * Recherche optimisée avec cache et debouncing
 */
function optimizedSearch(searchTerm) {
    // Vérifier le cache
    if (searchCache.has(searchTerm)) {
        filteredDeliveryNotes = searchCache.get(searchTerm);
        currentPage = 1;
        updateDisplay();
        return;
    }

    // Effectuer la recherche
    const results = performSearch(searchTerm);

    // Mettre en cache (limiter la taille du cache)
    if (searchCache.size > 50) {
        const firstKey = searchCache.keys().next().value;
        searchCache.delete(firstKey);
    }
    searchCache.set(searchTerm, results);

    filteredDeliveryNotes = results;
    currentPage = 1;
    updateDisplay();
}

/**
 * Effectue la recherche dans les données
 */
function performSearch(searchTerm) {
    if (!searchTerm.trim()) {
        return [...deliveryNotes];
    }

    const term = searchTerm.toLowerCase().trim();

    return deliveryNotes.filter(delivery => {
        return (
            delivery.number.toLowerCase().includes(term) ||
            (delivery.customer_name && delivery.customer_name.toLowerCase().includes(term)) ||
            (delivery.supplier_name && delivery.supplier_name.toLowerCase().includes(term)) ||
            delivery.items.some(item => item.product_name.toLowerCase().includes(term)) ||
            (delivery.notes && delivery.notes.toLowerCase().includes(term))
        );
    });
}

/**
 * Gestionnaire de recherche avec debouncing
 */
function handleOptimizedSearch(event) {
    const searchTerm = event.target.value;

    // Annuler la recherche précédente
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    // Si le terme n'a pas changé, ne rien faire
    if (searchTerm === lastSearchTerm) {
        return;
    }

    lastSearchTerm = searchTerm;

    // Délai de 300ms avant de lancer la recherche
    searchTimeout = setTimeout(() => {
        optimizedSearch(searchTerm);
    }, 300);
}

// ===== GESTION DES CLIENTS ET PRODUITS =====

/**
 * Charge la liste des clients depuis la base de données
 */
async function loadClients() {
    try {
        console.log('📋 Chargement des clients...');
        allClients = await window.api.clients.getAll();
        console.log(`✅ ${allClients.length} clients chargés`);
        populateClientSelect();
    } catch (error) {
        console.error('❌ Erreur lors du chargement des clients:', error);
        showNotification('Erreur lors du chargement des clients', 'error');
    }
}

/**
 * Charge la liste des produits depuis la base de données
 */
async function loadProducts() {
    try {
        console.log('📦 Chargement des produits...');
        allProducts = await window.api.products.getAll();
        console.log(`✅ ${allProducts.length} produits chargés`);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des produits:', error);
        showNotification('Erreur lors du chargement des produits', 'error');
    }
}

/**
 * Initialise la recherche de clients
 */
function initializeClientSearch() {
    const clientSearch = document.getElementById('clientSearch');
    const clientDropdown = document.getElementById('clientDropdown');

    if (!clientSearch || !clientDropdown) return;

    // Événement de saisie avec debounce
    let searchTimeout;
    clientSearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchClients(e.target.value);
        }, 300);
    });

    // Événement focus pour afficher la liste
    clientSearch.addEventListener('focus', () => {
        if (clientSearch.value.trim() === '') {
            showAllClients();
        } else {
            searchClients(clientSearch.value);
        }
    });

    // Fermer la liste quand on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!clientSearch.contains(e.target) && !clientDropdown.contains(e.target)) {
            clientDropdown.classList.add('hidden');
        }
    });
}

/**
 * Recherche les clients selon le terme saisi
 */
function searchClients(searchTerm) {
    const clientDropdown = document.getElementById('clientDropdown');
    if (!clientDropdown) return;

    const term = searchTerm.toLowerCase().trim();
    let filteredClients = [];

    if (term === '') {
        // Afficher tous les clients (limité à 50 pour les performances)
        filteredClients = allClients.slice(0, 50);
    } else {
        // Filtrer les clients
        filteredClients = allClients.filter(client =>
            client.name.toLowerCase().includes(term) ||
            (client.phone && client.phone.includes(term)) ||
            (client.email && client.email.toLowerCase().includes(term))
        ).slice(0, 20); // Limiter à 20 résultats
    }

    displayClientResults(filteredClients, term);
}

/**
 * Affiche tous les clients (limité)
 */
function showAllClients() {
    const limitedClients = allClients.slice(0, 50);
    displayClientResults(limitedClients, '');
}

/**
 * Affiche les résultats de recherche clients
 */
function displayClientResults(clients, searchTerm) {
    const clientDropdown = document.getElementById('clientDropdown');
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
            clientItem.onclick = () => selectClient(client);

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
 * Sélectionne un client depuis les résultats de recherche
 */
function selectClient(client) {
    selectedClient = client;

    const clientSearch = document.getElementById('clientSearch');
    const clientDropdown = document.getElementById('clientDropdown');
    const selectedClientDisplay = document.getElementById('selectedClientDisplay');
    const selectedClientName = document.getElementById('selectedClientName');
    const selectedClientDetails = document.getElementById('selectedClientDetails');
    const clientInfo = document.getElementById('clientInfo');
    const clientPhone = document.getElementById('clientPhone');
    const clientCredit = document.getElementById('clientCredit');

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

    // Afficher les informations détaillées
    if (clientInfo && clientPhone && clientCredit) {
        clientPhone.textContent = client.phone || 'Non renseigné';
        clientCredit.textContent = `${(client.credit_balance || 0).toFixed(2)} MAD`;

        // Colorer le crédit selon le montant
        if (client.credit_balance > 0) {
            clientCredit.className = 'font-semibold text-red-600';
        } else if (client.credit_balance < 0) {
            clientCredit.className = 'font-semibold text-green-600';
        } else {
            clientCredit.className = 'font-semibold text-gray-600';
        }

        clientInfo.classList.remove('hidden');
    }

    console.log('👤 Client sélectionné:', client.name);
}

/**
 * Efface la sélection de client
 */
function clearClientSelection() {
    selectedClient = null;

    const clientSearch = document.getElementById('clientSearch');
    const selectedClientDisplay = document.getElementById('selectedClientDisplay');
    const clientInfo = document.getElementById('clientInfo');

    // Vider l'input de recherche
    if (clientSearch) {
        clientSearch.value = '';
        clientSearch.focus();
    }

    // Masquer les affichages
    if (selectedClientDisplay) {
        selectedClientDisplay.classList.add('hidden');
    }

    if (clientInfo) {
        clientInfo.classList.add('hidden');
    }

    console.log('🗑️ Sélection client effacée');
}

/**
 * Crée un sélecteur de produits avec recherche pour un article
 */
function createProductSelect(itemIndex) {
    const container = document.createElement('div');
    container.className = 'relative';

    // Input de recherche
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Tapez pour rechercher un produit...';
    searchInput.className = 'w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white';
    searchInput.autocomplete = 'off';
    searchInput.id = `productSearch-${itemIndex}`;

    // Icône de recherche
    const searchIcon = document.createElement('div');
    searchIcon.className = 'absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none';
    searchIcon.innerHTML = `
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
    `;

    // Liste déroulante des résultats
    const dropdown = document.createElement('div');
    dropdown.id = `productDropdown-${itemIndex}`;
    dropdown.className = 'absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto hidden';

    // Assembler le container
    container.appendChild(searchInput);
    container.appendChild(searchIcon);
    container.appendChild(dropdown);

    // Événements de recherche
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchProducts(e.target.value, itemIndex);
        }, 300);
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() === '') {
            showAllProducts(itemIndex);
        } else {
            searchProducts(searchInput.value, itemIndex);
        }
    });

    // Fermer la liste quand on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    return container;
}

/**
 * Recherche les produits selon le terme saisi
 */
function searchProducts(searchTerm, itemIndex) {
    const dropdown = document.getElementById(`productDropdown-${itemIndex}`);
    if (!dropdown) return;

    const term = searchTerm.toLowerCase().trim();
    let filteredProducts = [];

    if (term === '') {
        filteredProducts = allProducts.slice(0, 50);
    } else {
        filteredProducts = allProducts.filter(product =>
            product.name.toLowerCase().includes(term) ||
            (product.barcode && product.barcode.toLowerCase().includes(term)) ||
            (product.category && product.category.toLowerCase().includes(term))
        ).slice(0, 20);
    }

    displayProductResults(filteredProducts, term, itemIndex);
}

/**
 * Affiche tous les produits (limité)
 */
function showAllProducts(itemIndex) {
    const limitedProducts = allProducts.slice(0, 50);
    displayProductResults(limitedProducts, '', itemIndex);
}

/**
 * Affiche les résultats de recherche produits
 */
function displayProductResults(products, searchTerm, itemIndex) {
    const dropdown = document.getElementById(`productDropdown-${itemIndex}`);
    if (!dropdown) return;

    dropdown.innerHTML = '';

    if (products.length === 0) {
        dropdown.innerHTML = `
            <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                ${searchTerm ? `Aucun produit trouvé pour "${searchTerm}"` : 'Aucun produit disponible'}
            </div>
        `;
    } else {
        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0';
            productItem.onclick = () => selectProduct(product, itemIndex);

            // Mettre en surbrillance le terme recherché
            let displayName = product.name;
            let displayBarcode = product.barcode || '';

            if (searchTerm) {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                displayName = displayName.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
                displayBarcode = displayBarcode.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
            }

            // Indicateur de stock
            const stockLevel = product.stock || 0;
            let stockIndicator = '';
            let stockClass = 'text-green-600';

            if (stockLevel <= 0) {
                stockIndicator = '🔴 Rupture';
                stockClass = 'text-red-600';
            } else if (stockLevel <= (product.alert_threshold || 5)) {
                stockIndicator = `🟠 Stock: ${stockLevel}`;
                stockClass = 'text-orange-600';
            } else {
                stockIndicator = `🟢 Stock: ${stockLevel}`;
                stockClass = 'text-green-600';
            }

            productItem.innerHTML = `
                <div class="font-medium text-gray-900 dark:text-white">${displayName}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>${displayBarcode ? `📦 ${displayBarcode}` : 'Sans code-barres'}</span>
                    <span class="${stockClass} font-medium">${stockIndicator}</span>
                </div>
                <div class="text-sm font-semibold text-green-600 mt-1">
                    ${(product.price_retail || product.price || 0).toFixed(2)} MAD
                </div>
            `;

            dropdown.appendChild(productItem);
        });
    }

    dropdown.classList.remove('hidden');
}

/**
 * Sélectionne un produit depuis les résultats de recherche
 */
function selectProduct(product, itemIndex) {
    const searchInput = document.getElementById(`productSearch-${itemIndex}`);
    const dropdown = document.getElementById(`productDropdown-${itemIndex}`);

    // Mettre à jour l'input de recherche
    if (searchInput) {
        searchInput.value = product.name;
    }

    // Masquer la liste déroulante
    if (dropdown) {
        dropdown.classList.add('hidden');
    }

    // Mettre à jour l'item avec les informations du produit
    if (currentItems[itemIndex]) {
        currentItems[itemIndex].product_id = product.id;
        currentItems[itemIndex].product_name = product.name;
        currentItems[itemIndex].unit_price = product.price_retail || product.price || 0;

        // Mettre à jour le prix dans l'input
        const priceInput = document.querySelector(`[data-item-index="${itemIndex}"] input[placeholder*="Prix"]`);
        if (priceInput) {
            priceInput.value = currentItems[itemIndex].unit_price;
        }

        // Afficher les informations de stock
        const stockInfo = document.querySelector(`[data-item-index="${itemIndex}"] .stock-info`);
        if (stockInfo) {
            const stockLevel = product.stock || 0;
            const alertThreshold = product.alert_threshold || 5;

            let stockClass = 'text-green-600';
            let stockText = `Stock: ${stockLevel}`;

            if (stockLevel <= 0) {
                stockClass = 'text-red-600';
                stockText = 'Rupture de stock';
            } else if (stockLevel <= alertThreshold) {
                stockClass = 'text-orange-600';
                stockText = `Stock faible: ${stockLevel}`;
            }

            stockInfo.innerHTML = `
                <span class="${stockClass} text-sm font-medium">
                    ${stockText}
                </span>
            `;
            stockInfo.classList.remove('hidden');
        }

        // Recalculer le total
        calculateItemTotal(itemIndex);

        console.log('📦 Produit sélectionné:', product.name, 'Prix:', product.price_retail);
    }
}

/**
 * Initialise la recherche de produits (fonction placeholder)
 */
function initializeProductSearch() {
    console.log('🔍 Recherche de produits initialisée');
    // Cette fonction est appelée mais la logique est dans createProductSelect
    // car chaque article a son propre sélecteur
}

/**
 * Gère la sélection d'un produit dans un article
 */
function handleProductSelection(itemIndex) {
    const itemRow = document.querySelector(`[data-item-index="${itemIndex}"]`);
    if (!itemRow) return;

    const productSelect = itemRow.querySelector('select');
    const priceInput = itemRow.querySelector('input[placeholder*="Prix"]');
    const stockInfo = itemRow.querySelector('.stock-info');

    const selectedOption = productSelect.options[productSelect.selectedIndex];

    if (selectedOption.value && selectedOption.dataset.product) {
        const product = JSON.parse(selectedOption.dataset.product);

        // Mettre à jour l'item avec les informations du produit
        if (currentItems[itemIndex]) {
            currentItems[itemIndex].product_id = product.id;
            currentItems[itemIndex].product_name = product.name;
            currentItems[itemIndex].unit_price = product.price_retail || product.price || 0;
        }

        // Remplir automatiquement le prix
        if (priceInput) {
            priceInput.value = product.price_retail || product.price || 0;
        }

        // Afficher les informations de stock
        if (stockInfo) {
            const stockLevel = product.stock || 0;
            const alertThreshold = product.alert_threshold || 0;

            let stockClass = 'text-green-600';
            let stockText = `Stock: ${stockLevel}`;

            if (stockLevel <= 0) {
                stockClass = 'text-red-600';
                stockText = 'Rupture de stock';
            } else if (stockLevel <= alertThreshold) {
                stockClass = 'text-orange-600';
                stockText = `Stock faible: ${stockLevel}`;
            }

            stockInfo.innerHTML = `
                <span class="${stockClass} text-sm font-medium">
                    ${stockText}
                </span>
            `;
            stockInfo.classList.remove('hidden');
        }

        console.log('📦 Produit sélectionné:', product.name, 'Prix:', product.price_retail);
    } else {
        // Réinitialiser les champs
        if (priceInput) priceInput.value = '';
        if (stockInfo) stockInfo.classList.add('hidden');
    }

    // Recalculer le total
    calculateItemTotal(itemIndex);
}
