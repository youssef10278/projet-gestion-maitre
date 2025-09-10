/**
 * Gestion des Devis - Module Principal
 * Basé sur la structure de la caisse avec adaptations pour les devis
 */

// Variables globales
let allQuotes = [];
let filteredQuotes = [];
let currentQuote = null;
let isEditMode = false;

// Variables pour le formulaire de devis
let allProducts = [];
let allClients = [];
let categories = [];
let quoteCart = [];
let selectedClient = null;
let selectedCategory = 'all';

// Variables de calcul
let subtotal = 0;
let discountType = 'percentage';
let discountValue = 0;
let discountAmount = 0;
let totalAmount = 0;

/**
 * Construit un menu de navigation de base sans dépendre de l'API
 * Utilisé comme fallback si l'API n'est pas disponible
 */
async function buildBasicMenu() {
    console.log('🔧 Construction du menu de base...');

    const navContainer = document.getElementById('main-nav');
    if (!navContainer) {
        console.error('❌ Conteneur nav non trouvé pour le menu de base');
        return;
    }

    // Menu de base avec les liens principaux
    const basicMenuHTML = `
        <div class="p-4 space-y-2">
            <a href="index.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-colors duration-300 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/20 group-hover:bg-white/20 transition-colors duration-300">
                    <svg class="w-5 h-5 text-blue-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0H8v0z"></path>
                    </svg>
                </div>
                <span>Dashboard</span>
            </a>

            <a href="caisse.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-colors duration-300 text-white hover:bg-gradient-to-r hover:from-green-600 hover:to-green-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500/20 group-hover:bg-white/20 transition-colors duration-300">
                    <svg class="w-5 h-5 text-green-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
                <span>Caisse</span>
            </a>

            <a href="quotes.html" class="nav-link active-nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-colors duration-300 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 transition-colors duration-300">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <span>Gestion des Devis</span>
            </a>

            <a href="returns.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-colors duration-300 text-white hover:bg-gradient-to-r hover:from-orange-600 hover:to-orange-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500/20 group-hover:bg-white/20 transition-colors duration-300">
                    <svg class="w-5 h-5 text-orange-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                    </svg>
                </div>
                <span>Retours</span>
            </a>
        </div>
    `;

    navContainer.innerHTML = basicMenuHTML;
    console.log('✅ Menu de base construit avec succès');
}

/**
 * Applique les styles personnalisés au menu hamburger de la page quotes
 */
function applyQuotesMenuStyles() {
    console.log('🎨 Application des styles personnalisés au menu quotes...');

    const sidebar = document.querySelector('aside');
    if (!sidebar) {
        console.warn('⚠️ Sidebar non trouvée pour appliquer les styles');
        return;
    }

    // 1. Masquer toutes les alertes (badges rouges)
    const alertBadges = sidebar.querySelectorAll('.alert-badge');
    alertBadges.forEach(badge => {
        badge.style.display = 'none';
        console.log('🔧 Badge d\'alerte masqué');
    });

    // 2. Modifier le bouton fermer pour qu'il soit noir
    const closeBtn = sidebar.querySelector('.sidebar-close-btn');
    if (closeBtn) {
        closeBtn.style.background = 'rgba(0, 0, 0, 0.8)';
        closeBtn.style.color = 'white';
        console.log('🔧 Bouton fermer modifié en noir');
    }

    // 3. Augmenter la hauteur du header
    const header = sidebar.querySelector('.sidebar-header');
    if (header) {
        header.style.height = '80px';
        header.style.minHeight = '80px';
        header.style.padding = '1rem';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        console.log('🔧 Header redimensionné');
    }

    // 4. Déplacer le logo à droite
    const logo = sidebar.querySelector('.sidebar-logo');
    if (logo) {
        logo.style.order = '2';
        logo.style.marginLeft = 'auto';
        logo.style.marginRight = '0';
        console.log('🔧 Logo déplacé à droite');
    }

    // 5. Déplacer le bouton fermer à gauche
    if (closeBtn) {
        closeBtn.style.order = '1';
        closeBtn.style.position = 'relative';
        closeBtn.style.top = 'auto';
        closeBtn.style.right = 'auto';
        closeBtn.style.marginRight = 'auto';
        console.log('🔧 Bouton fermer déplacé à gauche');
    }

    console.log('✅ Styles personnalisés appliqués au menu quotes');
}

// Éléments DOM
let quotesContainer;
let searchInput;
let statusFilter;
let dateFilter;
let newQuoteBtn;
let refreshBtn;
let quoteModal;
let closeModalBtn;

/**
 * Initialisation de la page des devis
 */
async function initQuotesPage() {
    console.log('🚀 Initialisation du module devis...');
    
    try {
        // Vérification des API
        if (!window.api || !window.api.quotes) {
            console.error('❌ API quotes non disponible');
            showError('API non disponible');
            return;
        }
        
        // Récupération des éléments DOM
        initDOMElements();
        
        // Configuration des événements
        setupEventListeners();
        
        // Chargement initial des données
        await loadQuotes();
        
        // Mise à jour des statistiques
        updateStatistics();
        
        console.log('✅ Module devis initialisé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des devis:', error);
        showError('Erreur lors du chargement des devis');
    }
}

/**
 * Initialise les références aux éléments DOM
 */
function initDOMElements() {
    quotesContainer = document.getElementById('quotes-container');
    searchInput = document.getElementById('search-quotes');
    statusFilter = document.getElementById('status-filter');
    dateFilter = document.getElementById('date-filter');
    newQuoteBtn = document.getElementById('new-quote-btn');
    refreshBtn = document.getElementById('refresh-quotes-btn');
    quoteModal = document.getElementById('quote-modal');
    closeModalBtn = document.getElementById('close-modal-btn');
    
    // Vérification des éléments critiques
    if (!quotesContainer) {
        throw new Error('Conteneur des devis non trouvé');
    }
}

/**
 * Configure les événements
 */
function setupEventListeners() {
    // Bouton nouveau devis
    if (newQuoteBtn) {
        newQuoteBtn.addEventListener('click', () => openQuoteModal());
    }
    
    // Bouton actualiser
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadQuotes());
    }
    
    // Fermeture du modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => closeQuoteModal());
    }
    
    // Fermeture du modal en cliquant à l'extérieur
    if (quoteModal) {
        quoteModal.addEventListener('click', (e) => {
            if (e.target === quoteModal) {
                closeQuoteModal();
            }
        });
    }
    
    // Recherche et filtres
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterQuotes, 300));
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterQuotes);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', filterQuotes);
    }
}

/**
 * Charge tous les devis depuis la base de données
 */
async function loadQuotes() {
    try {
        console.log('📋 Chargement des devis...');
        
        allQuotes = await window.api.quotes.getAll();
        filteredQuotes = [...allQuotes];
        
        console.log(`✅ ${allQuotes.length} devis chargés`);
        
        renderQuotes();
        updateStatistics();
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des devis:', error);
        showError('Erreur lors du chargement des devis');
    }
}

/**
 * Affiche les devis dans l'interface
 */
function renderQuotes() {
    if (!quotesContainer) return;
    
    if (filteredQuotes.length === 0) {
        quotesContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="text-gray-400 mb-4">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Aucun devis trouvé</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Commencez par créer votre premier devis</p>
                <button onclick="openQuoteModal()" class="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg">
                    Créer un devis
                </button>
            </div>
        `;
        return;
    }
    
    const quotesHTML = filteredQuotes.map(quote => createQuoteCard(quote)).join('');
    quotesContainer.innerHTML = quotesHTML;
}

/**
 * Crée une carte de devis
 */
function createQuoteCard(quote) {
    const statusClass = `status-${quote.status}`;
    const statusText = getStatusText(quote.status);
    const isExpired = new Date(quote.date_validity) < new Date();
    
    return `
        <div class="quote-card bg-white dark:bg-gray-700 p-4 rounded-lg shadow mb-4 border-l-4 border-cyan-500">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white">${quote.number}</h3>
                    <p class="text-gray-600 dark:text-gray-400">${quote.client_name}</p>
                    ${quote.client_phone ? `<p class="text-sm text-gray-500">${quote.client_phone}</p>` : ''}
                </div>
                <div class="text-right">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    ${isExpired && quote.status !== 'expired' ? '<p class="text-xs text-red-500 mt-1">⚠️ Expiré</p>' : ''}
                </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                <div>
                    <span class="text-gray-500">Date création:</span>
                    <p class="font-medium">${formatDate(quote.date_created)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Validité:</span>
                    <p class="font-medium">${formatDate(quote.date_validity)}</p>
                </div>
                <div>
                    <span class="text-gray-500">Total:</span>
                    <p class="font-bold text-cyan-600">${quote.total_amount.toFixed(2)} MAD</p>
                </div>
                <div>
                    <span class="text-gray-500">Créé par:</span>
                    <p class="font-medium">${quote.created_by}</p>
                </div>
            </div>
            
            <div class="quote-actions flex gap-2 justify-end flex-wrap">
                <button onclick="viewQuote(${quote.id})" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                    👁️ Voir
                </button>
                <button onclick="editQuote(${quote.id})" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">
                    ✏️ Modifier
                </button>
                <button onclick="previewQuoteFromList(${quote.id})" class="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded text-sm">
                    👁️ Aperçu
                </button>
                <button onclick="printQuoteFromList(${quote.id})" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                    🖨️ Imprimer
                </button>
                <button onclick="exportQuoteToPDF(${quote.id})" class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">
                    📄 PDF
                </button>
                ${quote.status === 'accepted' ? `
                    <button onclick="convertToSale(${quote.id})" class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm">
                        🛒 Convertir
                    </button>
                ` : ''}
                <button onclick="deleteQuote(${quote.id})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                    🗑️ Supprimer
                </button>
            </div>
        </div>
    `;
}

/**
 * Filtre les devis selon les critères
 */
function filterQuotes() {
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const statusValue = statusFilter?.value || '';
    const dateValue = dateFilter?.value || '';
    
    filteredQuotes = allQuotes.filter(quote => {
        // Filtre par recherche
        const matchesSearch = !searchTerm || 
            quote.number.toLowerCase().includes(searchTerm) ||
            quote.client_name.toLowerCase().includes(searchTerm);
        
        // Filtre par statut
        const matchesStatus = !statusValue || quote.status === statusValue;
        
        // Filtre par date (à implémenter selon les besoins)
        const matchesDate = !dateValue || filterByDate(quote, dateValue);
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    renderQuotes();
}

/**
 * Met à jour les statistiques
 */
function updateStatistics() {
    const totalElement = document.getElementById('total-quotes');
    const pendingElement = document.getElementById('pending-quotes');
    const acceptedElement = document.getElementById('accepted-quotes');
    const totalValueElement = document.getElementById('total-value');
    
    if (totalElement) totalElement.textContent = allQuotes.length;
    
    const pendingCount = allQuotes.filter(q => ['draft', 'sent'].includes(q.status)).length;
    if (pendingElement) pendingElement.textContent = pendingCount;
    
    const acceptedCount = allQuotes.filter(q => q.status === 'accepted').length;
    if (acceptedElement) acceptedElement.textContent = acceptedCount;
    
    const totalValue = allQuotes.reduce((sum, q) => sum + q.total_amount, 0);
    if (totalValueElement) totalValueElement.textContent = `${totalValue.toFixed(2)} MAD`;
}

/**
 * Ouvre le modal de création/édition de devis
 */
function openQuoteModal(quoteId = null) {
    isEditMode = !!quoteId;
    currentQuote = quoteId;
    
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = isEditMode ? 'Modifier le Devis' : 'Nouveau Devis';
    }
    
    // Charger le formulaire (sera implémenté dans la prochaine étape)
    loadQuoteForm(quoteId);
    
    if (quoteModal) {
        quoteModal.classList.remove('hidden');
    }
}

/**
 * Ferme le modal de devis
 */
function closeQuoteModal() {
    if (quoteModal) {
        quoteModal.classList.add('hidden');
    }
    currentQuote = null;
    isEditMode = false;
}

/**
 * Charge le formulaire de devis
 */
async function loadQuoteForm(quoteId = null) {
    const container = document.getElementById('quote-form-container');
    if (!container) return;

    try {
        console.log('📝 Chargement du formulaire de devis...');

        // Charger les données nécessaires
        await loadQuoteFormData();

        // Créer l'interface
        container.innerHTML = createQuoteFormHTML();

        // Initialiser les composants
        await initQuoteFormComponents();

        // Si mode édition, charger les données du devis
        if (quoteId) {
            await loadQuoteForEdit(quoteId);
        } else {
            // Mode création : initialiser avec des valeurs par défaut
            initNewQuoteDefaults();
        }

        console.log('✅ Formulaire de devis chargé');

    } catch (error) {
        console.error('❌ Erreur lors du chargement du formulaire:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-red-500 mb-4">
                    <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Erreur de chargement</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Impossible de charger le formulaire</p>
                <button onclick="closeQuoteModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                    Fermer
                </button>
            </div>
        `;
    }
}

// ===== FONCTIONS DU FORMULAIRE DE DEVIS =====

/**
 * Charge les données nécessaires pour le formulaire
 */
async function loadQuoteFormData() {
    try {
        console.log('📊 Chargement des données pour le formulaire...');

        // Charger en parallèle pour optimiser les performances
        const [productsData, clientsData, categoriesData] = await Promise.all([
            window.api.products.getAll(),
            window.api.clients.getAll(),
            window.api.products.getCategories()
        ]);

        allProducts = productsData || [];
        allClients = clientsData || [];
        categories = categoriesData || [];

        console.log(`✅ Données chargées: ${allProducts.length} produits, ${allClients.length} clients, ${categories.length} catégories`);

    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        throw error;
    }
}

/**
 * Crée le HTML du formulaire de devis
 */
function createQuoteFormHTML() {
    return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <!-- Colonne 1: Recherche et sélection de produits -->
            <div class="lg:col-span-2 space-y-4">
                <!-- Informations du devis -->
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">📋 Informations du Devis</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Numéro de devis</label>
                            <input type="text" id="quote-number" readonly class="w-full p-3 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-500" placeholder="Généré automatiquement">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Validité (jours)</label>
                            <input type="number" id="validity-days" value="30" min="1" max="365" class="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        </div>
                    </div>
                </div>

                <!-- Sélection du client -->
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">👤 Client</h3>
                    <div class="relative">
                        <input type="text" id="client-search" placeholder="Rechercher un client..."
                               class="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <div id="client-dropdown" class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto hidden"></div>
                    </div>
                    <div id="selected-client-display" class="mt-3 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg hidden">
                        <div class="flex items-center justify-between">
                            <div>
                                <p id="selected-client-name" class="font-medium text-gray-800 dark:text-white"></p>
                                <p id="selected-client-details" class="text-sm text-gray-600 dark:text-gray-400"></p>
                            </div>
                            <button onclick="clearSelectedClient()" class="text-red-500 hover:text-red-700">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Recherche de produits -->
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">🛒 Produits</h3>

                    <!-- Recherche -->
                    <div class="mb-4">
                        <input type="text" id="product-search" placeholder="Rechercher un produit..."
                               class="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    </div>

                    <!-- Catégories -->
                    <div class="mb-4">
                        <div class="relative">
                            <button type="button" id="category-dropdown-button"
                                    class="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-left flex items-center justify-between">
                                <span id="selected-category-text">Toutes les catégories</span>
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                            <div id="category-dropdown-list" class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto hidden"></div>
                        </div>
                    </div>

                    <!-- Grille des produits -->
                    <div id="products-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                        <div class="col-span-full text-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                            <p class="text-gray-500">Chargement des produits...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Colonne 2: Devis en cours -->
            <div class="space-y-4">
                <!-- Panier du devis -->
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">📋 Devis en Cours</h3>

                    <div id="quote-cart" class="space-y-2 mb-4 max-h-64 overflow-y-auto">
                        <div class="text-center py-8 text-gray-500">
                            Aucun produit ajouté
                        </div>
                    </div>

                    <!-- Calculs -->
                    <div class="border-t dark:border-gray-600 pt-4 space-y-3">
                        <!-- Sous-total initial -->
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">Sous-total initial:</span>
                            <span id="quote-subtotal" class="font-medium">0.00 MAD</span>
                        </div>

                        <!-- Zone des détails (remises par ligne) -->
                        <div id="totals-details" class="text-sm space-y-1 border-t dark:border-gray-600 pt-2 mt-2 hidden">
                            <!-- Sera rempli dynamiquement -->
                        </div>

                        <!-- Remise globale -->
                        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div class="flex items-center gap-2 mb-2">
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Remise globale:</label>
                                <select id="discount-type" class="text-sm border rounded px-2 py-1 dark:bg-gray-600 dark:border-gray-500">
                                    <option value="percentage">%</option>
                                    <option value="amount">MAD</option>
                                </select>
                            </div>
                            <div class="flex gap-2">
                                <input type="number" id="discount-value" value="0" min="0" step="0.01"
                                       class="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                       placeholder="Valeur de remise">
                                <span id="discount-amount" class="text-sm text-red-600 font-medium self-center">-0.00 MAD</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                💡 Remise appliquée après les remises par ligne
                            </div>

                            <!-- Boutons de remise rapide -->
                            <div class="mt-3">
                                <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">Remises rapides:</p>
                                <div class="flex gap-1 flex-wrap">
                                    <button onclick="applyQuickDiscount('percentage', 5)" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">5%</button>
                                    <button onclick="applyQuickDiscount('percentage', 10)" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">10%</button>
                                    <button onclick="applyQuickDiscount('percentage', 15)" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">15%</button>
                                    <button onclick="applyQuickDiscount('percentage', 20)" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">20%</button>
                                    <button onclick="applyQuickDiscount('amount', 50)" class="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded">50 MAD</button>
                                    <button onclick="applyQuickDiscount('amount', 100)" class="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded">100 MAD</button>
                                </div>
                            </div>
                        </div>

                        <!-- Total final -->
                        <div class="bg-cyan-50 dark:bg-cyan-900 p-3 rounded-lg">
                            <div class="flex justify-between text-lg font-bold">
                                <span class="text-gray-800 dark:text-white">TOTAL FINAL:</span>
                                <span id="quote-total" class="text-cyan-600">0.00 MAD</span>
                            </div>
                        </div>

                        <!-- Résumé des économies -->
                        <div id="savings-summary" class="bg-green-50 dark:bg-green-900 p-2 rounded text-sm text-center text-green-700 dark:text-green-300 hidden">
                            <span id="total-savings">Économies totales: 0.00 MAD</span>
                        </div>
                    </div>
                </div>

                <!-- Notes et conditions -->
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">📝 Notes</h3>
                    <textarea id="quote-notes" rows="3" placeholder="Notes internes..."
                              class="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>

                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2 mt-4">📋 Conditions</h3>
                    <textarea id="quote-conditions" rows="3" placeholder="Conditions de vente..."
                              class="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                </div>

                <!-- Actions rapides remises -->
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 class="text-sm font-semibold text-gray-800 dark:text-white mb-3">⚡ Actions Rapides</h3>

                    <!-- Remises rapides pour tous les articles -->
                    <div class="mb-3">
                        <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">Remise sur tous les articles:</p>
                        <div class="grid grid-cols-2 gap-1">
                            <button onclick="applyQuickDiscountToAllItems('percentage', 5)" class="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded">5% tous</button>
                            <button onclick="applyQuickDiscountToAllItems('percentage', 10)" class="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded">10% tous</button>
                            <button onclick="applyQuickDiscountToAllItems('percentage', 15)" class="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded">15% tous</button>
                            <button onclick="applyQuickDiscountToAllItems('percentage', 20)" class="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded">20% tous</button>
                        </div>
                    </div>

                    <!-- Actions de gestion -->
                    <div class="space-y-2">
                        <button onclick="clearAllDiscounts()" class="w-full text-sm bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-lg flex items-center justify-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Effacer toutes les remises
                        </button>

                        <button onclick="duplicateQuoteCart()" class="w-full text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded-lg flex items-center justify-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                            Dupliquer le panier
                        </button>
                    </div>
                </div>

                <!-- Actions principales -->
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <div class="space-y-3">
                        <button id="save-quote-btn" class="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                            </svg>
                            ${isEditMode ? 'Mettre à jour' : 'Sauvegarder'} le Devis
                        </button>

                        <button id="print-quote-btn" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                            </svg>
                            Aperçu et Impression
                        </button>

                        <button onclick="closeQuoteModal()" class="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialise les composants du formulaire
 */
async function initQuoteFormComponents() {
    console.log('⚙️ Initialisation des composants du formulaire...');

    // Réinitialiser les variables
    quoteCart = [];
    selectedClient = null;
    selectedCategory = 'all';
    resetCalculations();

    // Générer le numéro de devis
    await generateQuoteNumber();

    // Initialiser les composants
    initClientSearch();
    initProductSearch();
    initCategoryDropdown();
    initDiscountCalculation();
    initFormActions();

    // Rendre les produits
    await renderQuoteProducts();

    console.log('✅ Composants du formulaire initialisés');
}

/**
 * Génère un nouveau numéro de devis
 */
async function generateQuoteNumber() {
    try {
        const number = await window.api.quotes.getNextNumber();
        const numberInput = document.getElementById('quote-number');
        if (numberInput) {
            numberInput.value = number;
        }
    } catch (error) {
        console.error('❌ Erreur lors de la génération du numéro:', error);
        // Fallback : générer localement
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const fallbackNumber = `DEV-${today}-${Date.now().toString().slice(-4)}`;
        const numberInput = document.getElementById('quote-number');
        if (numberInput) {
            numberInput.value = fallbackNumber;
        }
    }
}

/**
 * Initialise la recherche de clients
 */
function initClientSearch() {
    const clientSearch = document.getElementById('client-search');
    const clientDropdown = document.getElementById('client-dropdown');

    if (!clientSearch || !clientDropdown) return;

    let searchTimeout;

    // Événement de recherche
    clientSearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchClients(e.target.value);
        }, 300);
    });

    // Afficher tous les clients au focus
    clientSearch.addEventListener('focus', () => {
        if (clientSearch.value.trim() === '') {
            showAllClients();
        } else {
            searchClients(clientSearch.value);
        }
    });

    // Fermer la liste quand on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!clientSearch.parentElement.contains(e.target)) {
            clientDropdown.classList.add('hidden');
        }
    });
}

/**
 * Recherche les clients
 */
function searchClients(searchTerm) {
    const clientDropdown = document.getElementById('client-dropdown');
    if (!clientDropdown) return;

    const term = searchTerm.toLowerCase().trim();
    let filteredClients = [];

    if (term === '') {
        filteredClients = allClients.slice(0, 50);
    } else {
        filteredClients = allClients.filter(client =>
            client.name.toLowerCase().includes(term) ||
            (client.phone && client.phone.includes(term)) ||
            (client.email && client.email.toLowerCase().includes(term))
        ).slice(0, 20);
    }

    displayClientResults(filteredClients, term);
}

/**
 * Affiche tous les clients
 */
function showAllClients() {
    const filteredClients = allClients.slice(0, 50);
    displayClientResults(filteredClients, '');
}

/**
 * Affiche les résultats de recherche de clients
 */
function displayClientResults(clients, searchTerm) {
    const clientDropdown = document.getElementById('client-dropdown');
    if (!clientDropdown) return;

    clientDropdown.innerHTML = '';

    if (clients.length === 0) {
        clientDropdown.innerHTML = `
            <div class="p-3 text-center text-gray-500">
                ${searchTerm ? 'Aucun client trouvé' : 'Aucun client disponible'}
            </div>
        `;
    } else {
        clients.forEach(client => {
            const clientItem = document.createElement('div');
            clientItem.className = 'p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-600 last:border-b-0';
            clientItem.onclick = () => selectClient(client);

            let displayName = client.name;
            let displayPhone = client.phone || '';

            // Surligner les termes de recherche
            if (searchTerm) {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                displayName = displayName.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
                if (displayPhone) {
                    displayPhone = displayPhone.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
                }
            }

            clientItem.innerHTML = `
                <div class="font-medium text-gray-900 dark:text-white">${displayName}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    ${displayPhone ? `📞 ${displayPhone}` : ''}
                    ${client.credit_balance ? ` • Crédit: ${client.credit_balance.toFixed(2)} MAD` : ''}
                </div>
            `;

            clientDropdown.appendChild(clientItem);
        });
    }

    clientDropdown.classList.remove('hidden');
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Sélectionne un client
 */
function selectClient(client) {
    selectedClient = client;

    const clientSearch = document.getElementById('client-search');
    const clientDropdown = document.getElementById('client-dropdown');
    const selectedDisplay = document.getElementById('selected-client-display');
    const selectedName = document.getElementById('selected-client-name');
    const selectedDetails = document.getElementById('selected-client-details');

    if (clientSearch) clientSearch.value = client.name;
    if (clientDropdown) clientDropdown.classList.add('hidden');

    if (selectedDisplay && selectedName && selectedDetails) {
        selectedName.textContent = client.name;
        selectedDetails.textContent = `${client.phone || 'Pas de téléphone'} ${client.address ? '• ' + client.address : ''}`;
        selectedDisplay.classList.remove('hidden');
    }

    console.log('👤 Client sélectionné:', client.name);
}

/**
 * Efface la sélection de client
 */
function clearSelectedClient() {
    selectedClient = null;

    const clientSearch = document.getElementById('client-search');
    const selectedDisplay = document.getElementById('selected-client-display');

    if (clientSearch) clientSearch.value = '';
    if (selectedDisplay) selectedDisplay.classList.add('hidden');

    console.log('👤 Sélection de client effacée');
}

/**
 * Initialise la recherche de produits
 */
function initProductSearch() {
    const productSearch = document.getElementById('product-search');

    if (!productSearch) return;

    let searchTimeout;

    productSearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderQuoteProducts();
        }, 300);
    });
}

/**
 * Initialise le dropdown des catégories
 */
function initCategoryDropdown() {
    const dropdownButton = document.getElementById('category-dropdown-button');
    const dropdownList = document.getElementById('category-dropdown-list');

    if (!dropdownButton || !dropdownList) return;

    // Rendre les catégories
    renderQuoteCategories();

    // Événement du bouton
    dropdownButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownList.classList.toggle('hidden');
    });

    // Fermer quand on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!dropdownButton.parentElement.contains(e.target)) {
            dropdownList.classList.add('hidden');
        }
    });
}

/**
 * Rend les catégories dans le dropdown
 */
function renderQuoteCategories() {
    const dropdownList = document.getElementById('category-dropdown-list');
    if (!dropdownList) return;

    dropdownList.innerHTML = '';

    // Toutes les catégories
    const allItem = document.createElement('div');
    allItem.className = 'p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
    allItem.textContent = 'Toutes les catégories';
    allItem.onclick = () => selectQuoteCategory('all');
    dropdownList.appendChild(allItem);

    // Catégories spécifiques
    categories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
        item.textContent = category;
        item.onclick = () => selectQuoteCategory(category);
        dropdownList.appendChild(item);
    });
}

/**
 * Sélectionne une catégorie
 */
async function selectQuoteCategory(category) {
    selectedCategory = category;

    const selectedText = document.getElementById('selected-category-text');
    const dropdownList = document.getElementById('category-dropdown-list');

    if (selectedText) {
        selectedText.textContent = category === 'all' ? 'Toutes les catégories' : category;
    }

    if (dropdownList) {
        dropdownList.classList.add('hidden');
    }

    await renderQuoteProducts();
    console.log('📂 Catégorie sélectionnée:', category);
}

/**
 * Retourne le texte du statut en français
 */
function getStatusText(status) {
    const statusMap = {
        'draft': 'Brouillon',
        'sent': 'Envoyé',
        'accepted': 'Accepté',
        'rejected': 'Refusé',
        'expired': 'Expiré',
        'converted': 'Converti'
    };
    return statusMap[status] || status;
}

/**
 * Formate une date pour l'affichage
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Filtre par date
 */
function filterByDate(quote, dateValue) {
    const quoteDate = new Date(quote.date_created);
    const now = new Date();
    
    switch (dateValue) {
        case 'today':
            return quoteDate.toDateString() === now.toDateString();
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return quoteDate >= weekAgo;
        case 'month':
            return quoteDate.getMonth() === now.getMonth() && quoteDate.getFullYear() === now.getFullYear();
        case 'year':
            return quoteDate.getFullYear() === now.getFullYear();
        default:
            return true;
    }
}

/**
 * Fonction debounce pour optimiser les recherches
 */
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

/**
 * Affiche une erreur
 */
function showError(message) {
    if (quotesContainer) {
        quotesContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="text-red-500 mb-4">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Erreur</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">${message}</p>
                <button onclick="loadQuotes()" class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg">
                    Réessayer
                </button>
            </div>
        `;
    }
}

// ===== ACTIONS SUR LES DEVIS =====

/**
 * Voir un devis
 */
async function viewQuote(quoteId) {
    console.log('👁️ Affichage du devis:', quoteId);
    // À implémenter
}

/**
 * Modifier un devis
 */
async function editQuote(quoteId) {
    console.log('✏️ Modification du devis:', quoteId);
    openQuoteModal(quoteId);
}

/**
 * Imprimer un devis
 */
async function printQuote(quoteId) {
    console.log('🖨️ Impression du devis:', quoteId);
    // À implémenter
}

/**
 * Convertir un devis en vente
 */
async function convertToSale(quoteId) {
    console.log('🛒 Conversion du devis en vente:', quoteId);
    // À implémenter
}

/**
 * Supprimer un devis
 */
async function deleteQuote(quoteId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
        return;
    }
    
    try {
        await window.api.quotes.delete(quoteId);
        await loadQuotes();
        console.log('✅ Devis supprimé');
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showQuoteNotification('error', 'Erreur lors de la suppression du devis');
    }
}

/**
 * Aperçu d'un devis depuis la liste
 */
async function previewQuoteFromList(quoteId) {
    try {
        console.log('👁️ Aperçu du devis depuis la liste:', quoteId);

        // Récupérer les données complètes du devis
        const quoteData = await loadQuoteDataForPrint(quoteId);

        // Utiliser le système d'impression pour l'aperçu
        window.quotePrinter.previewQuote(quoteData);

    } catch (error) {
        console.error('❌ Erreur lors de l\'aperçu:', error);
        showQuoteNotification('error', 'Erreur lors de l\'aperçu du devis');
    }
}

/**
 * Impression d'un devis depuis la liste
 */
async function printQuoteFromList(quoteId) {
    try {
        console.log('🖨️ Impression du devis depuis la liste:', quoteId);

        // Récupérer les données complètes du devis
        const quoteData = await loadQuoteDataForPrint(quoteId);

        // Utiliser le système d'impression
        window.quotePrinter.printQuote(quoteData);

    } catch (error) {
        console.error('❌ Erreur lors de l\'impression:', error);
        showQuoteNotification('error', 'Erreur lors de l\'impression du devis');
    }
}

/**
 * Export PDF d'un devis depuis la liste
 */
async function exportQuoteToPDF(quoteId) {
    try {
        console.log('📄 Export PDF du devis depuis la liste:', quoteId);

        // Récupérer les données complètes du devis
        const quoteData = await loadQuoteDataForPrint(quoteId);

        // Utiliser le système d'impression pour l'export PDF
        window.quotePrinter.exportToPDF(quoteData);

    } catch (error) {
        console.error('❌ Erreur lors de l\'export PDF:', error);
        showQuoteNotification('error', 'Erreur lors de l\'export PDF du devis');
    }
}

/**
 * Charge les données complètes d'un devis pour l'impression
 */
async function loadQuoteDataForPrint(quoteId) {
    try {
        // Récupérer le devis avec ses articles
        const quote = await window.api.quotes.getById(quoteId);
        if (!quote) {
            throw new Error('Devis non trouvé');
        }

        // Récupérer les informations de l'entreprise
        let companySettings = {};
        try {
            if (window.api && window.api.settings) {
                companySettings = await window.api.settings.getCompanyInfo() || {};
            }
        } catch (error) {
            console.warn('Impossible de récupérer les informations de l\'entreprise:', error);
        }

        // Préparer les données pour l'impression
        const printData = {
            // Informations de base du devis
            id: quote.id,
            number: quote.number,
            date_created: quote.date_created,
            date_validity: quote.date_validity,
            validity_days: quote.validity_days,
            status: quote.status,

            // Client
            client_name: quote.client_name,
            client_phone: quote.client_phone || '',
            client_address: quote.client_address || '',

            // Articles (avec remises détaillées)
            items: quote.items || [],

            // Totaux
            subtotal: quote.subtotal || 0,
            discount_type: quote.discount_type || 'percentage',
            discount_value: quote.discount_value || 0,
            discount_amount: quote.discount_amount || 0,
            total_amount: quote.total_amount || 0,

            // Notes et conditions
            notes: quote.notes || '',
            conditions: quote.conditions || getDefaultPrintConditions(quote.validity_days),

            // Informations entreprise
            company: companySettings,

            // Métadonnées
            created_by: quote.created_by || 'GestionPro'
        };

        console.log('📋 Données de devis chargées pour impression:', printData);
        return printData;

    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        throw error;
    }
}

/**
 * Retourne les conditions par défaut pour l'impression
 */
function getDefaultPrintConditions(validityDays = 30) {
    return `• Devis valable ${validityDays} jours
• Prix exprimés en MAD TTC
• Règlement à la commande
• Livraison sous réserve de disponibilité`;
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

// Exposer les fonctions globalement
window.initQuotesPage = initQuotesPage;
window.openQuoteModal = openQuoteModal;
window.closeQuoteModal = closeQuoteModal;
window.viewQuote = viewQuote;
window.editQuote = editQuote;
window.printQuote = printQuote;
window.convertToSale = convertToSale;
window.deleteQuote = deleteQuote;
window.previewQuoteFromList = previewQuoteFromList;
window.printQuoteFromList = printQuoteFromList;
window.exportQuoteToPDF = exportQuoteToPDF;

// Initialisation automatique de la page (comme les autres pages)
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation automatique de la page des devis...');

    try {
        // Attendre que l'API soit disponible (critique pour Electron)
        let apiReady = false;
        let attempts = 0;
        const maxAttempts = 50; // 5 secondes max

        while (!apiReady && attempts < maxAttempts) {
            if (window.api && window.api.session && window.api.i18n) {
                apiReady = true;
                console.log('✅ API Electron disponible');
            } else {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }

        if (!apiReady) {
            console.warn('⚠️ API Electron non disponible après 5s, continuation...');
        }

        // Initialiser la traduction
        if (typeof window.i18n !== 'undefined' && window.i18n.loadTranslations) {
            await window.i18n.loadTranslations();
            window.i18n.applyTranslationsToHTML();
            console.log('✅ Traductions chargées');
        } else if (typeof window.initializeI18n === 'function') {
            await window.initializeI18n();
            console.log('✅ Traductions initialisées (fallback)');
        }

        // Attendre que les fonctions de navigation soient disponibles
        let navReady = false;
        attempts = 0;

        while (!navReady && attempts < 20) { // 2 secondes max
            if (typeof window.initializePage === 'function' || typeof window.buildNavigation === 'function') {
                navReady = true;
            } else {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }

        // Initialiser le menu de navigation (CRITIQUE pour la navigation)
        console.log('🔧 Tentative d\'initialisation du menu de navigation...');

        // Vérifier que l'élément nav existe
        const navElement = document.getElementById('main-nav');
        if (!navElement) {
            console.error('❌ Élément nav#main-nav non trouvé dans le DOM');
        } else {
            console.log('✅ Élément nav#main-nav trouvé');
        }

        if (typeof window.initializePage === 'function') {
            console.log('🔧 Appel de initializePage...');
            await window.initializePage('quotes');
            console.log('✅ Menu de navigation initialisé via initializePage');

            // Vérifier si le menu a été construit
            if (navElement && navElement.innerHTML.trim() !== '') {
                console.log('✅ Menu construit avec succès, contenu présent');
            } else {
                console.error('❌ Menu non construit, nav reste vide');
            }
        } else if (typeof window.buildNavigation === 'function') {
            console.log('🔧 Appel de buildNavigation...');
            await window.buildNavigation('quotes');
            console.log('✅ Menu de navigation construit via buildNavigation');

            // Vérifier si le menu a été construit
            if (navElement && navElement.innerHTML.trim() !== '') {
                console.log('✅ Menu construit avec succès, contenu présent');
            } else {
                console.error('❌ Menu non construit, nav reste vide');
            }
        } else {
            console.error('❌ Fonctions de navigation non disponibles après attente');
            console.log('🔍 Fonctions disponibles sur window:', Object.keys(window).filter(key => key.includes('nav') || key.includes('Nav') || key.includes('menu') || key.includes('Menu')));

            // Fallback : construire un menu de base sans API
            console.log('🔧 Tentative de construction d\'un menu de base...');
            await buildBasicMenu();
        }

        // Initialiser le menu hamburger (TOUJOURS visible sur la page quotes)
        if (typeof HamburgerMenu !== 'undefined') {
            const hamburgerMenu = new HamburgerMenu();
            // Forcer le breakpoint à une valeur très élevée pour que le hamburger soit toujours actif
            hamburgerMenu.setBreakpoint(99999); // Le hamburger sera toujours visible
            hamburgerMenu.setup();

            // Forcer l'état hamburger actif
            document.body.classList.add('hamburger-active');

            // S'assurer que le sidebar a les bonnes classes
            const sidebar = document.querySelector('aside');
            if (sidebar) {
                sidebar.classList.add('responsive-sidebar', 'sidebar-responsive');
                // Forcer l'état responsive pour que le hamburger fonctionne
                sidebar.classList.add('sidebar-responsive');

                // Appliquer les styles personnalisés pour la page quotes
                setTimeout(() => {
                    applyQuotesMenuStyles();
                }, 500); // Attendre que le menu soit construit

                // Observateur pour réappliquer les styles si le menu se reconstruit
                const observer = new MutationObserver(() => {
                    setTimeout(() => {
                        applyQuotesMenuStyles();
                    }, 100);
                });

                observer.observe(sidebar, {
                    childList: true,
                    subtree: true
                });

                console.log('✅ Sidebar configurée pour le hamburger');
                console.log('🔧 Classes sidebar:', sidebar.className);
            }

            console.log('✅ Menu hamburger initialisé (toujours visible)');

            // Ajouter un diagnostic pour le clic sur hamburger
            setTimeout(() => {
                const hamburgerBtn = document.querySelector('.hamburger-menu-btn');
                if (hamburgerBtn) {
                    console.log('✅ Bouton hamburger trouvé');
                    hamburgerBtn.addEventListener('click', () => {
                        console.log('🔧 Clic sur hamburger détecté');
                        const sidebar = document.querySelector('aside');
                        if (sidebar) {
                            console.log('🔧 Sidebar classes:', sidebar.className);
                            console.log('🔧 Sidebar style:', sidebar.style.cssText);
                        }
                    });
                } else {
                    console.error('❌ Bouton hamburger non trouvé');
                }
            }, 1000);
        }

        // Initialiser le module devis
        await initQuotesPage();

        console.log('✅ Page des devis initialisée avec succès');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la page des devis:', error);
    }
});
