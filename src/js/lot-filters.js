/**
 * Gestionnaire de Filtrage et Tri des Lots
 * Gestion des préférences utilisateur et interface de filtrage
 */

class LotFiltersManager {
    constructor() {
        this.preferences = {
            sortBy: 'created_at',
            sortOrder: 'DESC',
            statusFilter: 'ALL',
            searchTerm: '',
            expiryFilter: 'ALL'
        };
        this.selectedLots = new Set();
        this.onFiltersChange = null;
        
        this.init();
    }

    /**
     * Initialiser le gestionnaire
     */
    async init() {
        await this.loadPreferences();
        console.log('🔍 Gestionnaire de filtres des lots initialisé');
    }

    /**
     * Charger les préférences utilisateur
     */
    async loadPreferences() {
        try {
            const saved = await window.api.stockLots.getFilterPreferences(1);
            this.preferences = { ...this.preferences, ...saved };
        } catch (error) {
            console.warn('Erreur lors du chargement des préférences:', error);
        }
    }

    /**
     * Sauvegarder les préférences utilisateur
     */
    async savePreferences() {
        try {
            await window.api.stockLots.saveFilterPreferences(1, this.preferences);
        } catch (error) {
            console.warn('Erreur lors de la sauvegarde des préférences:', error);
        }
    }

    /**
     * Créer l'interface de filtrage
     * @param {HTMLElement} container - Conteneur pour les filtres
     */
    createFilterInterface(container) {
        container.innerHTML = `
            <div class="lot-filters-bar bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <div class="flex flex-wrap gap-3 items-center">
                    <!-- Recherche -->
                    <div class="flex-1 min-w-64">
                        <div class="relative">
                            <input type="text" 
                                   id="lotSearchInput" 
                                   placeholder="🔍 Rechercher un lot..."
                                   value="${this.preferences.searchTerm}"
                                   class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </div>
                    </div>

                    <!-- Tri -->
                    <div class="relative">
                        <select id="lotSortSelect" class="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                            <option value="created_at-DESC" ${this.preferences.sortBy === 'created_at' && this.preferences.sortOrder === 'DESC' ? 'selected' : ''}>📅 Plus récent</option>
                            <option value="created_at-ASC" ${this.preferences.sortBy === 'created_at' && this.preferences.sortOrder === 'ASC' ? 'selected' : ''}>📅 Plus ancien</option>
                            <option value="expiry_date-ASC" ${this.preferences.sortBy === 'expiry_date' && this.preferences.sortOrder === 'ASC' ? 'selected' : ''}>⏰ Expire bientôt</option>
                            <option value="expiry_date-DESC" ${this.preferences.sortBy === 'expiry_date' && this.preferences.sortOrder === 'DESC' ? 'selected' : ''}>⏰ Expire tard</option>
                            <option value="quantity-DESC" ${this.preferences.sortBy === 'quantity' && this.preferences.sortOrder === 'DESC' ? 'selected' : ''}>📦 Quantité ↓</option>
                            <option value="quantity-ASC" ${this.preferences.sortBy === 'quantity' && this.preferences.sortOrder === 'ASC' ? 'selected' : ''}>📦 Quantité ↑</option>
                            <option value="purchase_price-DESC" ${this.preferences.sortBy === 'purchase_price' && this.preferences.sortOrder === 'DESC' ? 'selected' : ''}>💰 Prix ↓</option>
                            <option value="purchase_price-ASC" ${this.preferences.sortBy === 'purchase_price' && this.preferences.sortOrder === 'ASC' ? 'selected' : ''}>💰 Prix ↑</option>
                            <option value="total_value-DESC" ${this.preferences.sortBy === 'total_value' && this.preferences.sortOrder === 'DESC' ? 'selected' : ''}>💎 Valeur ↓</option>
                            <option value="lot_number-ASC" ${this.preferences.sortBy === 'lot_number' && this.preferences.sortOrder === 'ASC' ? 'selected' : ''}>🏷️ Nom A-Z</option>
                        </select>
                        <svg class="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>

                    <!-- Statut -->
                    <div class="relative">
                        <select id="lotStatusSelect" class="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                            <option value="ALL" ${this.preferences.statusFilter === 'ALL' ? 'selected' : ''}>📋 Tous</option>
                            <option value="AVAILABLE" ${this.preferences.statusFilter === 'AVAILABLE' ? 'selected' : ''}>✅ Disponibles</option>
                            <option value="SOLD_OUT" ${this.preferences.statusFilter === 'SOLD_OUT' ? 'selected' : ''}>❌ Épuisés</option>
                            <option value="EXPIRED" ${this.preferences.statusFilter === 'EXPIRED' ? 'selected' : ''}>⚠️ Expirés</option>
                            <option value="EXPIRING_SOON" ${this.preferences.statusFilter === 'EXPIRING_SOON' ? 'selected' : ''}>🔔 Expire bientôt</option>
                        </select>
                        <svg class="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>

                    <!-- Actions en lot -->
                    <div class="flex gap-2">
                        <button id="selectAllLots" class="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                            Tout sélectionner
                        </button>
                        <button id="bulkActionsBtn" class="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50" disabled>
                            Actions (<span id="selectedCount">0</span>)
                        </button>
                    </div>
                </div>

                <!-- Statistiques -->
                <div id="lotStats" class="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    Chargement des statistiques...
                </div>
            </div>
        `;

        this.setupEventListeners(container);
    }

    /**
     * Configurer les événements
     */
    setupEventListeners(container) {
        // Recherche
        const searchInput = container.querySelector('#lotSearchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.preferences.searchTerm = e.target.value;
                    this.savePreferences();
                    this.triggerFiltersChange();
                }, 300);
            });
        }

        // Tri
        const sortSelect = container.querySelector('#lotSortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                this.preferences.sortBy = sortBy;
                this.preferences.sortOrder = sortOrder;
                this.savePreferences();
                this.triggerFiltersChange();
            });
        }

        // Statut
        const statusSelect = container.querySelector('#lotStatusSelect');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                this.preferences.statusFilter = e.target.value;
                this.savePreferences();
                this.triggerFiltersChange();
            });
        }

        // Sélection multiple
        const selectAllBtn = container.querySelector('#selectAllLots');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.toggleSelectAll());
        }

        // Actions en lot
        const bulkActionsBtn = container.querySelector('#bulkActionsBtn');
        if (bulkActionsBtn) {
            bulkActionsBtn.addEventListener('click', () => this.showBulkActionsMenu());
        }
    }

    /**
     * Déclencher le callback de changement de filtres
     */
    triggerFiltersChange() {
        if (this.onFiltersChange) {
            this.onFiltersChange(this.preferences);
        }
    }

    /**
     * Mettre à jour les statistiques
     */
    updateStats(lots, totalLots) {
        const statsElement = document.getElementById('lotStats');
        if (!statsElement) return;

        const totalValue = lots.reduce((sum, lot) => sum + (lot.total_value || 0), 0);
        const totalQuantity = lots.reduce((sum, lot) => sum + (lot.quantity || 0), 0);

        statsElement.innerHTML = `
            Affichage : <strong>${lots.length}</strong> lot(s) sur <strong>${totalLots}</strong> total | 
            Quantité : <strong>${totalQuantity.toLocaleString()}</strong> unités | 
            Valeur : <strong>${totalValue.toFixed(2)} MAD</strong>
        `;
    }

    /**
     * Gérer la sélection d'un lot
     */
    toggleLotSelection(lotId, isSelected) {
        if (isSelected) {
            this.selectedLots.add(lotId);
        } else {
            this.selectedLots.delete(lotId);
        }
        this.updateSelectionUI();
    }

    /**
     * Sélectionner/désélectionner tous les lots
     */
    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.lot-checkbox');
        const allSelected = this.selectedLots.size === checkboxes.length;
        
        if (allSelected) {
            this.selectedLots.clear();
            checkboxes.forEach(cb => cb.checked = false);
        } else {
            checkboxes.forEach(cb => {
                cb.checked = true;
                this.selectedLots.add(parseInt(cb.dataset.lotId));
            });
        }
        
        this.updateSelectionUI();
    }

    /**
     * Mettre à jour l'interface de sélection
     */
    updateSelectionUI() {
        const selectedCount = document.getElementById('selectedCount');
        const bulkActionsBtn = document.getElementById('bulkActionsBtn');
        const selectAllBtn = document.getElementById('selectAllLots');
        
        if (selectedCount) {
            selectedCount.textContent = this.selectedLots.size;
        }
        
        if (bulkActionsBtn) {
            bulkActionsBtn.disabled = this.selectedLots.size === 0;
        }
        
        if (selectAllBtn) {
            const checkboxes = document.querySelectorAll('.lot-checkbox');
            selectAllBtn.textContent = this.selectedLots.size === checkboxes.length ? 'Tout désélectionner' : 'Tout sélectionner';
        }
    }

    /**
     * Afficher le menu des actions en lot
     */
    showBulkActionsMenu() {
        if (this.selectedLots.size === 0) return;

        const menu = document.createElement('div');
        menu.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        menu.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Actions sur ${this.selectedLots.size} lot(s)
                </h3>
                <div class="space-y-3">
                    <button class="bulk-action-btn w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400" data-action="delete">
                        🗑️ Supprimer les lots sélectionnés
                    </button>
                    <button class="bulk-action-btn w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" data-action="update_expiry">
                        📅 Modifier la date d'expiration
                    </button>
                    <button class="bulk-action-btn w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" data-action="export">
                        📊 Exporter en CSV
                    </button>
                </div>
                <div class="flex gap-3 mt-6">
                    <button id="cancelBulkAction" class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                        Annuler
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(menu);

        // Événements
        menu.addEventListener('click', (e) => {
            if (e.target === menu || e.target.id === 'cancelBulkAction') {
                menu.remove();
            } else if (e.target.classList.contains('bulk-action-btn')) {
                const action = e.target.dataset.action;
                this.performBulkAction(action);
                menu.remove();
            }
        });
    }

    /**
     * Effectuer une action en lot
     */
    async performBulkAction(action) {
        const lotIds = Array.from(this.selectedLots);
        
        try {
            let result;
            
            switch (action) {
                case 'delete':
                    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${lotIds.length} lot(s) ?`)) return;
                    result = await window.api.stockLots.bulkAction(lotIds, 'delete');
                    break;
                    
                case 'update_expiry':
                    const newDate = prompt('Nouvelle date d\'expiration (YYYY-MM-DD) :');
                    if (!newDate) return;
                    result = await window.api.stockLots.bulkAction(lotIds, 'update_expiry', { expiry_date: newDate });
                    break;
                    
                case 'export':
                    // TODO: Implémenter l'export CSV
                    alert('Fonctionnalité d\'export en développement');
                    return;
            }
            
            if (result.success) {
                this.selectedLots.clear();
                this.updateSelectionUI();
                this.triggerFiltersChange();
                
                if (window.showNotification) {
                    window.showNotification(result.message, 'success');
                }
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Erreur lors de l\'action en lot:', error);
            if (window.showNotification) {
                window.showNotification('Erreur lors de l\'action : ' + error.message, 'error');
            }
        }
    }

    /**
     * Réinitialiser les sélections
     */
    clearSelection() {
        this.selectedLots.clear();
        this.updateSelectionUI();
        document.querySelectorAll('.lot-checkbox').forEach(cb => cb.checked = false);
    }

    /**
     * Obtenir les préférences actuelles
     */
    getPreferences() {
        return { ...this.preferences };
    }

    /**
     * Définir le callback de changement de filtres
     */
    setOnFiltersChange(callback) {
        this.onFiltersChange = callback;
    }
}

// Export pour utilisation externe
window.LotFiltersManager = LotFiltersManager;
