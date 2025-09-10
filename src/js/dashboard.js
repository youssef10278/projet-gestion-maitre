/**
 * Dashboard Controller - Professional Implementation
 * Manages dashboard analytics and data visualization
 * @version 3.0.0
 * @author Professional Development Team
 */

// Gestionnaire d'Alertes Autonome
class AlertsManager {
    constructor() {
        this.alerts = [];
        this.subscribers = [];
    }

    addAlert(alert) {
        this.alerts.push({
            ...alert,
            id: alert.id || Date.now().toString(),
            timestamp: new Date()
        });
        this.notifySubscribers();
    }

    removeAlert(id) {
        this.alerts = this.alerts.filter(alert => alert.id !== id);
        this.notifySubscribers();
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.alerts));
    }
}

class DashboardManager {
    constructor() {
        this.state = {
            isLoading: false,
            currentPeriod: 'today',
            dateRange: { startDate: null, endDate: null },
            cache: new Map(),
            lastUpdate: null,
            alerts: [],
            alertsVisible: false
        };

        this.elements = {};
        this.eventListeners = [];
        this.config = {
            cacheTimeout: 5 * 60 * 1000, // 5 minutes
            maxRetries: 3,
            retryDelay: 1000,
            alertRefreshInterval: 30 * 1000, // 30 secondes
            targets: {
                dailyRevenue: 10000,
                profitMargin: 25,
                maxCreditRisk: 20
            }
        };

        // Gestionnaire d'alertes
        try {
            this.alertsManager = new AlertsManager();
        } catch (error) {
            console.warn('AlertsManager non disponible, fonctionnalité d\'alertes désactivée:', error);
            this.alertsManager = null;
        }
    }

    /**
     * Initialize dashboard
     */
    async init() {
        try {
            await this.loadTranslations();
            this.validateAPIs();
            await this.initializeLayout();
            this.bindElements();
            this.attachEventListeners();
            await this.initializeUserPermissions();
            await this.loadInitialData();
        } catch (error) {
            this.handleError('Dashboard initialization failed', error);
        }
    }

    /**
     * Initialize layout and navigation
     */
    async initializeLayout() {
        // Try to use the existing function first
        if (typeof initializePage === 'function') {
            await initializePage('dashboard');
            return;
        }

        // Fallback: build navigation ourselves
        await this.buildNavigation();
        await this.updateStockAlertBadge();
    }

    /**
     * Build navigation menu
     */
    async buildNavigation() {
        try {
            const user = await window.api.session.getCurrentUser();
            const navContainer = document.getElementById('main-nav');
            if (!navContainer) return;

            const t = window.i18n ? window.i18n.t : (key) => key;

            const links = {
                dashboard: `<a href="index.html" class="block py-3 px-4 text-lg hover:bg-gray-700 bg-gray-700">${t('main_menu_dashboard') || 'Dashboard'}</a>`,
                caisse: `<a href="caisse.html" class="block py-3 px-4 text-lg hover:bg-gray-700">${t('main_menu_cash_register') || 'Caisse'}</a>`,
                products: `<a href="products.html" class="block py-3 px-4 text-lg hover:bg-gray-700">${t('main_menu_products') || 'Produits'}</a>`,
                price_adjustment: `<a href="price-adjustment.html" class="block py-3 px-4 text-lg hover:bg-gray-700">${t('main_menu_price_adjustment') || 'Ajustement Prix'}</a>`,
                stock_adjustment: `<a href="stock-adjustment.html" class="block py-3 px-4 text-lg hover:bg-gray-700">${t('main_menu_stock_adjustment') || 'Ajustement Stock'}</a>`,
                clients: `<a href="clients.html" class="block py-3 px-4 text-lg hover:bg-gray-700">${t('main_menu_clients') || 'Clients'}</a>`,
                history: `<a href="history.html" class="block py-3 px-4 text-lg hover:bg-gray-700">${t('main_menu_history') || 'Historique'}</a>`,
                credits: `<a href="credits.html" class="block py-3 px-4 text-lg hover:bg-gray-700">${t('main_menu_credits') || 'Crédits'}</a>`,
                invoices: `<a href="invoices.html" class="block py-3 px-4 text-lg hover:bg-gray-700">${t('main_menu_invoices') || 'Factures'}</a>`,
                settings: `<a href="settings.html" class="block py-3 px-4 text-lg hover:bg-gray-700">${t('main_menu_settings') || 'Paramètres'}</a>`,
                seller_history: `<a href="history.html" class="block py-3 px-4 text-lg hover:bg-gray-700">${t('main_menu_seller_history') || 'Mon Historique'}</a>`
            };

            let navHTML = '';
            if (user && user.role === 'Propriétaire') {
                navHTML += links.dashboard;
            }
            navHTML += links.caisse;
            if (user && user.role === 'Propriétaire') {
                navHTML += links.products + links.price_adjustment + links.stock_adjustment + links.clients + links.history + links.credits + links.invoices + links.settings;
            } else {
                navHTML += links.seller_history;
            }

            navContainer.innerHTML = navHTML;
        } catch (error) {
            console.error('Failed to build navigation:', error);
        }
    }

    /**
     * Update stock alert badge
     */
    async updateStockAlertBadge() {
        try {
            const user = await window.api.session.getCurrentUser();
            if (!user || user.role !== 'Propriétaire') return;

            const lowStockProducts = await window.api.products.getLowStock();
            const badge = document.querySelector('#stock-alert-badge');

            if (badge && lowStockProducts && lowStockProducts.length > 0) {
                badge.textContent = lowStockProducts.length;
                badge.classList.remove('hidden');
            }
        } catch (error) {
            console.warn('Failed to update stock alert badge:', error);
        }
    }

    /**
     * Load translations
     */
    async loadTranslations() {
        if (window.i18n) {
            await window.i18n.loadTranslations();
            window.i18n.applyTranslationsToHTML();
        }
    }

    /**
     * Validate required APIs
     */
    validateAPIs() {
        if (!window.api) {
            throw new Error('window.api is not available');
        }
        if (!window.api.session) {
            throw new Error('window.api.session is not available');
        }
        if (!window.api.dashboard) {
            throw new Error('window.api.dashboard is not available');
        }
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        const elementMap = {
            revenueStatEl: 'revenue-stat',
            creditStatEl: 'credit-stat',
            profitStatCard: 'profit-stat-card',
            profitStatEl: 'profit-stat',
            startDateInput: 'startDate',
            endDateInput: 'endDate',
            filterBtn: 'filterByDate',
            exportBtn: 'exportAnalytics',
            viewPerformanceBtn: 'viewPerformanceDetails',

            // Centre d'Alertes
            alertsToggle: 'alertsToggle',
            alertsPanel: 'alertsPanel',
            alertsBadge: 'alertsBadge',
            alertsList: 'alertsList',
            markAllRead: 'markAllRead',

            // KPIs Visuels
            revenueProgress: 'revenue-progress',
            revenuePercentage: 'revenue-percentage',
            revenueTarget: 'revenue-target',
            profitProgress: 'profit-progress',
            profitPercentage: 'profit-percentage',
            profitMargin: 'profit-margin',
            creditRisk: 'credit-risk',
            creditRiskLabel: 'credit-risk-label',
            overdueCredits: 'overdue-credits',
            lowStockCount: 'low-stock-count',
            totalProducts: 'total-products',
            stockHealth: 'stock-health',
            stockHealthLabel: 'stock-health-label',

            // Actions Rapides
            quickRestock: 'quickRestock',
            quickReminder: 'quickReminder',
            quickReport: 'quickReport'
        };

        Object.entries(elementMap).forEach(([key, id]) => {
            this.elements[key] = document.getElementById(id);
        });

        this.elements.periodButtons = document.querySelectorAll('.period-btn');
        this.elements.analyticsContainers = {
            profitable: document.getElementById('profitable-products'),
            selling: document.getElementById('selling-products'),
            performance: document.getElementById('performance-overview'),
            insights: document.getElementById('quick-insights')
        };
    }

    /**
     * Attach event listeners with cleanup tracking
     */
    attachEventListeners() {
        // Period buttons
        this.elements.periodButtons.forEach(button => {
            const handler = () => this.handlePeriodChange(button.dataset.period);
            button.addEventListener('click', handler);
            this.eventListeners.push({ element: button, event: 'click', handler });
        });

        // Date filter
        if (this.elements.filterBtn) {
            const handler = () => this.handleDateFilter();
            this.elements.filterBtn.addEventListener('click', handler);
            this.eventListeners.push({ element: this.elements.filterBtn, event: 'click', handler });
        }

        // Export button
        if (this.elements.exportBtn) {
            const handler = () => this.handleExport();
            this.elements.exportBtn.addEventListener('click', handler);
            this.eventListeners.push({ element: this.elements.exportBtn, event: 'click', handler });
        }

        // Performance details button
        if (this.elements.viewPerformanceBtn) {
            const handler = () => this.handleViewPerformanceDetails();
            this.elements.viewPerformanceBtn.addEventListener('click', handler);
            this.eventListeners.push({ element: this.elements.viewPerformanceBtn, event: 'click', handler });
        }

        // Centre d'Alertes
        if (this.elements.alertsToggle) {
            const handler = () => this.toggleAlertsPanel();
            this.elements.alertsToggle.addEventListener('click', handler);
            this.eventListeners.push({ element: this.elements.alertsToggle, event: 'click', handler });
        }

        if (this.elements.markAllRead) {
            const handler = () => this.markAllAlertsRead();
            this.elements.markAllRead.addEventListener('click', handler);
            this.eventListeners.push({ element: this.elements.markAllRead, event: 'click', handler });
        }

        // Actions Rapides
        if (this.elements.quickRestock) {
            const handler = () => this.handleQuickRestock();
            this.elements.quickRestock.addEventListener('click', handler);
            this.eventListeners.push({ element: this.elements.quickRestock, event: 'click', handler });
        }

        if (this.elements.quickReminder) {
            const handler = () => this.handleQuickReminder();
            this.elements.quickReminder.addEventListener('click', handler);
            this.eventListeners.push({ element: this.elements.quickReminder, event: 'click', handler });
        }

        if (this.elements.quickReport) {
            const handler = () => this.handleQuickReport();
            this.elements.quickReport.addEventListener('click', handler);
            this.eventListeners.push({ element: this.elements.quickReport, event: 'click', handler });
        }

        // Fermer le panel d'alertes en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (this.state.alertsVisible &&
                !this.elements.alertsPanel?.contains(e.target) &&
                !this.elements.alertsToggle?.contains(e.target)) {
                this.hideAlertsPanel();
            }
        });
    }

    /**
     * Initialize user permissions
     */
    async initializeUserPermissions() {
        try {
            const user = await window.api.session.getCurrentUser();
            if (user?.role === 'Propriétaire') {
                this.elements.profitStatCard?.classList.remove('hidden');
            } else {
                this.elements.profitStatCard?.classList.add('hidden');
            }
        } catch (error) {
            console.warn('Failed to load user permissions:', error);
        }
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        const todayButton = document.querySelector('button[data-period="today"]');
        if (todayButton) {
            await this.handlePeriodChange('today');
            this.setActiveButton(todayButton);
        }

        // Démarrer le rafraîchissement automatique des alertes
        this.startAlertRefresh();
    }

    /**
     * Handle period change
     */
    async handlePeriodChange(period) {
        try {
            this.state.currentPeriod = period;
            const dateRange = this.calculateDateRange(period);

            this.elements.startDateInput.value = dateRange.startDate;
            this.elements.endDateInput.value = dateRange.endDate;

            await this.refreshDashboard(dateRange);

            const button = document.querySelector(`button[data-period="${period}"]`);
            this.setActiveButton(button);
        } catch (error) {
            this.handleError('Failed to change period', error);
        }
    }

    /**
     * Handle date filter
     */
    async handleDateFilter() {
        try {
            const startDate = this.elements.startDateInput.value;
            const endDate = this.elements.endDateInput.value;

            if (!startDate || !endDate) {
                this.showNotification('Veuillez sélectionner une date de début et de fin.', 'warning');
                return;
            }

            if (new Date(startDate) > new Date(endDate)) {
                this.showNotification('La date de début ne peut pas être après la date de fin.', 'warning');
                return;
            }

            await this.refreshDashboard({ startDate, endDate });
            this.setActiveButton(null);
        } catch (error) {
            this.handleError('Failed to filter by date', error);
        }
    }

    /**
     * Calculate date range for period
     */
    calculateDateRange(period) {
        const end = new Date();
        const start = new Date();

        switch (period) {
            case 'today':
                // No change needed
                break;
            case 'week':
                const day = end.getDay();
                start.setDate(end.getDate() - (day === 0 ? 6 : day - 1));
                break;
            case 'month':
                start.setDate(1);
                break;
            default:
                throw new Error(`Unknown period: ${period}`);
        }

        return {
            startDate: this.formatDate(start),
            endDate: this.formatDate(end)
        };
    }

    /**
     * Format date to YYYY-MM-DD
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Refresh dashboard data
     */
    async refreshDashboard(dateRange) {
        try {
            this.setLoadingState(true);
            this.state.dateRange = dateRange;

            // Check cache first
            const cacheKey = `${dateRange.startDate}-${dateRange.endDate}`;
            const cachedData = this.getCachedData(cacheKey);

            if (cachedData) {
                this.renderDashboard(cachedData);
                return;
            }

            // Load fresh data
            const data = await this.loadDashboardData(dateRange);

            // Cache the data
            this.setCachedData(cacheKey, data);

            // Render dashboard
            this.renderDashboard(data);

        } catch (error) {
            this.handleError('Failed to refresh dashboard', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Load dashboard data from API
     */
    async loadDashboardData(dateRange) {
        const { startDate, endDate } = dateRange;
        const params = { startDate, endDate, limit: 5 };

        try {
            const [stats, topProfitable, topSelling, performanceOverview, insights] = await Promise.all([
                this.retryOperation(() => window.api.dashboard.getStats({ startDate, endDate })),
                this.retryOperation(() => window.api.dashboard.getTopProfitable(params)),
                this.retryOperation(() => window.api.dashboard.getTopSelling(params)),
                this.retryOperation(() => window.api.dashboard.getPerformanceOverview({ startDate, endDate })),
                this.retryOperation(() => window.api.dashboard.getInsights({ startDate, endDate }))
            ]);

            return {
                stats,
                analytics: {
                    topProfitable,
                    topSelling,
                    performanceOverview,
                    insights
                }
            };
        } catch (error) {
            throw new Error(`Failed to load dashboard data: ${error.message}`);
        }
    }

    /**
     * Retry operation with exponential backoff
     */
    async retryOperation(operation, retries = this.config.maxRetries) {
        try {
            return await operation();
        } catch (error) {
            if (retries > 0) {
                await this.delay(this.config.retryDelay);
                return this.retryOperation(operation, retries - 1);
            }
            throw error;
        }
    }

    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get cached data
     */
    getCachedData(key) {
        const cached = this.state.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    /**
     * Set cached data
     */
    setCachedData(key, data) {
        this.state.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        this.state.isLoading = isLoading;

        if (isLoading) {
            this.showLoadingIndicators();
        }
    }

    /**
     * Show loading indicators
     */
    showLoadingIndicators() {
        Object.values(this.elements.analyticsContainers).forEach(container => {
            if (container) {
                container.innerHTML = this.createLoadingHTML();
            }
        });
    }

    /**
     * Create loading HTML
     */
    createLoadingHTML() {
        return `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-gray-500 dark:text-gray-400">Chargement des analytics...</span>
            </div>
        `;
    }

    /**
     * Render dashboard with data
     */
    renderDashboard(data) {
        try {
            this.renderStats(data.stats);
            this.renderVisualKPIs(data.stats);
            this.renderAnalytics(data.analytics);
            this.refreshAlerts(data.stats);
            this.state.lastUpdate = Date.now();
        } catch (error) {
            this.handleError('Failed to render dashboard', error);
        }
    }

    /**
     * Render statistics
     */
    renderStats(stats) {
        const revenue = stats.revenue || 0;
        const credit = stats.credit_given || 0;
        const profit = (stats.revenue || 0) - (stats.total_cost || 0);

        if (this.elements.revenueStatEl) {
            this.elements.revenueStatEl.textContent = revenue.toFixed(2);
        }
        if (this.elements.creditStatEl) {
            this.elements.creditStatEl.textContent = credit.toFixed(2);
        }
        if (this.elements.profitStatEl) {
            this.elements.profitStatEl.textContent = profit.toFixed(2);
        }
    }

    /**
     * Render analytics sections
     */
    renderAnalytics(analytics) {
        this.renderTopProfitableProducts(analytics.topProfitable);
        this.renderTopSellingProducts(analytics.topSelling);
        this.renderPerformanceOverview(analytics.performanceOverview);
        this.renderInsights(analytics.insights);
    }

    /**
     * Show error state in analytics containers
     */
    showAnalyticsError() {
        Object.values(this.elements.analyticsContainers).forEach(container => {
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-4 text-red-500 dark:text-red-400">
                        <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p>Erreur lors du chargement</p>
                    </div>
                `;
            }
        });
    }

    /**
     * Set active period button
     */
    setActiveButton(activeBtn) {
        this.elements.periodButtons.forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-200', 'dark:bg-gray-700');
        });
        if (activeBtn) {
            activeBtn.classList.add('bg-blue-600', 'text-white');
            activeBtn.classList.remove('bg-gray-200', 'dark:bg-gray-700');
        }
    }

    /**
     * Render top profitable products
     */
    renderTopProfitableProducts(products) {
        const container = this.elements.analyticsContainers.profitable;
        if (!container) return;

        if (!products || products.length === 0) {
            container.innerHTML = this.createNoDataHTML('Aucun produit rentable trouvé');
            return;
        }

        const maxProfit = Math.max(...products.map(p => p.total_profit));

        container.innerHTML = products.map((product, index) => {
            const progressWidth = maxProfit > 0 ? (product.total_profit / maxProfit) * 100 : 0;
            const profitColor = this.getProfitColor(index);

            return `
                <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-700 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-r ${profitColor} flex items-center justify-center text-white font-bold text-sm mr-3">
                                ${index + 1}
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-800 dark:text-white text-sm">${this.escapeHtml(product.name)}</h4>
                                <p class="text-xs text-gray-500 dark:text-gray-400">${this.escapeHtml(product.category || 'Sans catégorie')}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-green-600 dark:text-green-400">${product.total_profit.toFixed(2)} MAD</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">${product.profit_margin || 0}% marge</p>
                        </div>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div class="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500" style="width: ${progressWidth}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>${product.total_quantity} vendus</span>
                        <span>${product.total_revenue.toFixed(2)} MAD CA</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get profit color based on ranking
     */
    getProfitColor(index) {
        const colors = [
            'from-yellow-400 to-yellow-600',
            'from-gray-300 to-gray-500',
            'from-orange-400 to-orange-600',
            'from-green-400 to-green-600'
        ];
        return colors[index] || colors[colors.length - 1];
    }

    /**
     * Render top selling products
     */
    renderTopSellingProducts(products) {
        const container = this.elements.analyticsContainers.selling;
        if (!container) return;

        if (!products || products.length === 0) {
            container.innerHTML = this.createNoDataHTML('Aucun produit vendu trouvé');
            return;
        }

        const maxQuantity = Math.max(...products.map(p => p.total_quantity));

        container.innerHTML = products.map((product, index) => {
            const progressWidth = maxQuantity > 0 ? (product.total_quantity / maxQuantity) * 100 : 0;
            const quantityColor = this.getQuantityColor(index);

            return `
                <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-r ${quantityColor} flex items-center justify-center text-white font-bold text-sm mr-3">
                                ${index + 1}
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-800 dark:text-white text-sm">${this.escapeHtml(product.name)}</h4>
                                <p class="text-xs text-gray-500 dark:text-gray-400">${this.escapeHtml(product.category || 'Sans catégorie')}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-blue-600 dark:text-blue-400">${product.total_quantity}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">${product.avg_daily_sales || 0}/jour</p>
                        </div>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div class="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500" style="width: ${progressWidth}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>${product.sales_count || 0} ventes</span>
                        <span>${product.total_revenue.toFixed(2)} MAD CA</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get quantity color based on ranking
     */
    getQuantityColor(index) {
        const colors = [
            'from-blue-400 to-blue-600',
            'from-purple-400 to-purple-600',
            'from-indigo-400 to-indigo-600',
            'from-cyan-400 to-cyan-600'
        ];
        return colors[index] || colors[colors.length - 1];
    }

    /**
     * Render performance overview
     */
    renderPerformanceOverview(performanceData) {
        const container = this.elements.analyticsContainers.performance;
        if (!container) return;

        if (!performanceData || performanceData.length === 0) {
            container.innerHTML = this.createNoDataHTML('Aucune donnée de performance');
            return;
        }

        const stats = this.calculatePerformanceStats(performanceData);

        container.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Produits</div>
                        <div class="text-lg font-bold text-purple-600 dark:text-purple-400">${stats.totalProducts}</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Marge Moyenne</div>
                        <div class="text-lg font-bold text-purple-600 dark:text-purple-400">${stats.avgMargin.toFixed(1)}%</div>
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                        <div class="flex items-center">
                            <span class="text-green-600 mr-2">🎯</span>
                            <span class="text-sm font-medium text-green-800 dark:text-green-200">Haute Performance</span>
                        </div>
                        <span class="text-sm font-bold text-green-600">${stats.highPerformers} produits</span>
                    </div>

                    ${stats.lowStock > 0 ? `
                    <div class="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                        <div class="flex items-center">
                            <span class="text-orange-600 mr-2">⚠️</span>
                            <span class="text-sm font-medium text-orange-800 dark:text-orange-200">Stock Faible</span>
                        </div>
                        <span class="text-sm font-bold text-orange-600">${stats.lowStock} produits</span>
                    </div>
                    ` : ''}

                    <div class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div class="flex items-center">
                            <span class="text-blue-600 mr-2">💰</span>
                            <span class="text-sm font-medium text-blue-800 dark:text-blue-200">Bénéfice Total</span>
                        </div>
                        <span class="text-sm font-bold text-blue-600">${stats.totalProfit.toFixed(2)} MAD</span>
                    </div>
                </div>

                <div class="space-y-1">
                    <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Top 3 Performers:</div>
                    ${performanceData.slice(0, 3).map((product, index) => `
                        <div class="flex items-center justify-between text-xs">
                            <div class="flex items-center">
                                <span class="w-4 h-4 rounded-full bg-gradient-to-r ${this.getProfitColor(index)} flex items-center justify-center text-white text-xs font-bold mr-2">${index + 1}</span>
                                <span class="text-gray-700 dark:text-gray-300 truncate max-w-[100px]">${this.escapeHtml(product.name)}</span>
                            </div>
                            <span class="font-medium text-purple-600 dark:text-purple-400">${product.total_profit.toFixed(0)} MAD</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Calculate performance statistics
     */
    calculatePerformanceStats(performanceData) {
        const totalProducts = performanceData.length;
        const totalRevenue = performanceData.reduce((sum, p) => sum + (p.total_revenue || 0), 0);
        const totalProfit = performanceData.reduce((sum, p) => sum + (p.total_profit || 0), 0);
        const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const highPerformers = performanceData.filter(p => (p.profit_margin || 0) >= 50).length;
        const lowStock = performanceData.filter(p => p.stock <= p.alert_threshold && p.alert_threshold > 0).length;

        return {
            totalProducts,
            totalRevenue,
            totalProfit,
            avgMargin,
            highPerformers,
            lowStock
        };
    }

    /**
     * Render insights
     */
    renderInsights(insights) {
        const container = this.elements.analyticsContainers.insights;
        if (!container) return;

        if (!insights || insights.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                    <div class="text-4xl mb-2">💡</div>
                    <p>Aucune recommandation pour le moment</p>
                    <p class="text-xs mt-1">Continuez à vendre pour obtenir des insights !</p>
                </div>
            `;
            return;
        }

        container.innerHTML = insights.map(insight => {
            const colorClass = this.getInsightColorClass(insight.type);
            return `
                <div class="p-3 rounded-lg border-2 ${colorClass} hover:shadow-md transition-shadow">
                    <div class="flex items-center">
                        <span class="text-2xl mr-3">${insight.icon || '💡'}</span>
                        <p class="font-medium text-sm">${this.escapeHtml(insight.message || insight.description || '')}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get insight color class based on type
     */
    getInsightColorClass(type) {
        const colorMap = {
            'growth': 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-200',
            'warning': 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-200',
            'info': 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200'
        };
        return colorMap[type] || colorMap.info;
    }

    /**
     * Create no data HTML
     */
    createNoDataHTML(message) {
        return `
            <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Handle export functionality
     */
    async handleExport() {
        try {
            const { startDate, endDate } = this.state.dateRange;

            if (!startDate || !endDate) {
                this.showNotification('Veuillez sélectionner une période pour l\'export', 'warning');
                return;
            }

            const [topProfitable, topSelling] = await Promise.all([
                window.api.dashboard.getTopProfitable({ startDate, endDate, limit: 20 }),
                window.api.dashboard.getTopSelling({ startDate, endDate, limit: 20 })
            ]);

            this.exportToCSV({ topProfitable, topSelling }, startDate, endDate);
            this.showNotification('Export réussi !', 'success');

        } catch (error) {
            this.handleError('Failed to export data', error);
        }
    }

    /**
     * Export data to Excel
     */
    exportToCSV(data, startDate, endDate) {
        // Generate Excel content using HTML table format
        const excelContent = this.generateAnalyticsExcelContent(data, startDate, endDate);

        // Download as Excel file
        this.downloadExcel(excelContent, `analytics_produits_${startDate}_${endDate}.xls`);
    }

    /**
     * Generate Excel content for analytics data
     */
    generateAnalyticsExcelContent(data, startDate, endDate) {
        let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .number { text-align: right; }
        .center { text-align: center; }
        .section-title { font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; color: #333; }
        .main-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #000; }
    </style>
</head>
<body>
    <div class="main-title">ANALYTICS PRODUITS - ${this.escapeHtml(startDate)} au ${this.escapeHtml(endDate)}</div>

    <div class="section-title">PRODUITS LES PLUS RENTABLES</div>
    <table>
        <thead>
            <tr>
                <th class="center">Rang</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th class="number">Bénéfice (MAD)</th>
                <th class="number">Marge (%)</th>
                <th class="number">Quantité Vendue</th>
                <th class="number">CA (MAD)</th>
            </tr>
        </thead>
        <tbody>`;

        data.topProfitable.forEach((product, index) => {
            htmlContent += `
            <tr>
                <td class="center">${index + 1}</td>
                <td>${this.escapeHtml(product.name)}</td>
                <td>${this.escapeHtml(product.category || 'Sans catégorie')}</td>
                <td class="number">${product.total_profit.toFixed(2)}</td>
                <td class="number">${product.profit_margin || 0}</td>
                <td class="number">${product.total_quantity}</td>
                <td class="number">${product.total_revenue.toFixed(2)}</td>
            </tr>`;
        });

        htmlContent += `
        </tbody>
    </table>

    <div class="section-title">PRODUITS LES PLUS VENDUS</div>
    <table>
        <thead>
            <tr>
                <th class="center">Rang</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th class="number">Quantité Vendue</th>
                <th class="number">Ventes/Jour</th>
                <th class="number">Nombre de Ventes</th>
                <th class="number">CA (MAD)</th>
            </tr>
        </thead>
        <tbody>`;

        data.topSelling.forEach((product, index) => {
            htmlContent += `
            <tr>
                <td class="center">${index + 1}</td>
                <td>${this.escapeHtml(product.name)}</td>
                <td>${this.escapeHtml(product.category || 'Sans catégorie')}</td>
                <td class="number">${product.total_quantity}</td>
                <td class="number">${product.avg_daily_sales || 0}</td>
                <td class="number">${product.sales_count || 0}</td>
                <td class="number">${product.total_revenue.toFixed(2)}</td>
            </tr>`;
        });

        htmlContent += `
        </tbody>
    </table>
</body>
</html>`;

        return htmlContent;
    }

    /**
     * Handle view performance details
     */
    async handleViewPerformanceDetails() {
        try {
            const { startDate, endDate } = this.state.dateRange;

            if (!startDate || !endDate) {
                this.showNotification('Veuillez sélectionner une période', 'warning');
                return;
            }

            const performanceData = await window.api.dashboard.getPerformanceOverview({ startDate, endDate });

            if (!performanceData || performanceData.length === 0) {
                this.showNotification('Aucune donnée de performance disponible pour cette période', 'info');
                return;
            }

            // Show performance details modal
            this.showPerformanceModal(performanceData, startDate, endDate);

        } catch (error) {
            this.handleError('Failed to load performance details', error);
        }
    }

    /**
     * Show performance details modal
     */
    showPerformanceModal(performanceData, startDate, endDate) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="text-xl font-bold text-gray-800 dark:text-white">
                        📊 Performance Détaillée des Produits (${startDate} - ${endDate})
                    </h2>
                    <button id="closeModal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div class="p-6 overflow-y-auto max-h-[70vh]">
                    <div class="mb-4 flex flex-wrap gap-2">
                        <button id="sortByProfit" class="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors">
                            Trier par Bénéfice
                        </button>
                        <button id="sortByQuantity" class="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors">
                            Trier par Quantité
                        </button>
                        <button id="sortByMargin" class="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors">
                            Trier par Marge
                        </button>
                        <button id="sortByRevenue" class="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 transition-colors">
                            Trier par CA
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Produit</th>
                                    <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Catégorie</th>
                                    <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Quantité</th>
                                    <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">CA (MAD)</th>
                                    <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Coût (MAD)</th>
                                    <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Bénéfice (MAD)</th>
                                    <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Marge (%)</th>
                                    <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Fréquence</th>
                                    <th class="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Stock</th>
                                </tr>
                            </thead>
                            <tbody id="performanceTableBody" class="divide-y divide-gray-200 dark:divide-gray-700">
                                <!-- Contenu généré dynamiquement -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        Total: ${performanceData.length} produits
                    </div>
                    <button id="exportPerformance" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Exporter CSV
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Fill the table
        this.renderPerformanceTable(performanceData);

        // Setup event listeners
        this.setupModalEventListeners(modal, performanceData, startDate, endDate);
    }

    /**
     * Setup modal event listeners
     */
    setupModalEventListeners(modal, performanceData, startDate, endDate) {
        const closeBtn = modal.querySelector('#closeModal');
        const exportBtn = modal.querySelector('#exportPerformance');
        const sortButtons = modal.querySelectorAll('[id^="sortBy"]');

        // Close modal handlers
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Export handler
        exportBtn.addEventListener('click', () => {
            this.exportPerformanceData(performanceData, startDate, endDate);
        });

        // Sort handlers
        sortButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const sortType = btn.id.replace('sortBy', '').toLowerCase();
                const sortedData = this.sortPerformanceData(performanceData, sortType);
                this.renderPerformanceTable(sortedData);

                // Update active button
                sortButtons.forEach(b => b.classList.remove('ring-2', 'ring-blue-500'));
                btn.classList.add('ring-2', 'ring-blue-500');
            });
        });

        // Escape key handler
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * Render performance table
     */
    renderPerformanceTable(data) {
        const tbody = document.getElementById('performanceTableBody');
        if (!tbody) return;

        tbody.innerHTML = data.map(product => {
            const stockStatus = (product.stock <= product.alert_threshold && product.alert_threshold > 0) ?
                'text-red-600 font-bold' : 'text-gray-600';
            const marginColor = (product.profit_margin >= 50) ? 'text-green-600' :
                               (product.profit_margin >= 25) ? 'text-yellow-600' : 'text-red-600';

            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">${this.escapeHtml(product.name)}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-400">${this.escapeHtml(product.category || 'Sans catégorie')}</td>
                    <td class="px-4 py-3 text-right font-medium">${product.total_quantity || 0}</td>
                    <td class="px-4 py-3 text-right">${(product.total_revenue || 0).toFixed(2)}</td>
                    <td class="px-4 py-3 text-right">${(product.total_cost || 0).toFixed(2)}</td>
                    <td class="px-4 py-3 text-right font-bold text-green-600">${(product.total_profit || 0).toFixed(2)}</td>
                    <td class="px-4 py-3 text-right font-medium ${marginColor}">${product.profit_margin || 0}%</td>
                    <td class="px-4 py-3 text-right">${product.sales_frequency || 0}</td>
                    <td class="px-4 py-3 text-center ${stockStatus}">${product.stock || 0}</td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Sort performance data
     */
    sortPerformanceData(data, sortType) {
        const sortedData = [...data];

        switch (sortType) {
            case 'profit':
                return sortedData.sort((a, b) => (b.total_profit || 0) - (a.total_profit || 0));
            case 'quantity':
                return sortedData.sort((a, b) => (b.total_quantity || 0) - (a.total_quantity || 0));
            case 'margin':
                return sortedData.sort((a, b) => (b.profit_margin || 0) - (a.profit_margin || 0));
            case 'revenue':
                return sortedData.sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0));
            default:
                return sortedData;
        }
    }

    /**
     * Export performance data to Excel
     */
    exportPerformanceData(data, startDate, endDate) {
        // Generate Excel content using HTML table format
        const excelContent = this.generatePerformanceExcelContent(data, startDate, endDate);

        // Download as Excel file
        this.downloadExcel(excelContent, `performance_detaillee_${startDate}_${endDate}.xls`);

        this.showNotification("Export réussi !", 'success');
    }

    /**
     * Generate Excel content for performance data
     */
    generatePerformanceExcelContent(data, startDate, endDate) {
        let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .number { text-align: right; }
        .center { text-align: center; }
        .main-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #000; }
    </style>
</head>
<body>
    <div class="main-title">PERFORMANCE DÉTAILLÉE DES PRODUITS - ${this.escapeHtml(startDate)} au ${this.escapeHtml(endDate)}</div>

    <table>
        <thead>
            <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th class="number">Quantité Vendue</th>
                <th class="number">CA (MAD)</th>
                <th class="number">Coût (MAD)</th>
                <th class="number">Bénéfice (MAD)</th>
                <th class="number">Marge (%)</th>
                <th class="number">Fréquence Ventes</th>
                <th class="center">Stock Actuel</th>
            </tr>
        </thead>
        <tbody>`;

        data.forEach(product => {
            htmlContent += `
            <tr>
                <td>${this.escapeHtml(product.name)}</td>
                <td>${this.escapeHtml(product.category || 'Sans catégorie')}</td>
                <td class="number">${product.total_quantity || 0}</td>
                <td class="number">${(product.total_revenue || 0).toFixed(2)}</td>
                <td class="number">${(product.total_cost || 0).toFixed(2)}</td>
                <td class="number">${(product.total_profit || 0).toFixed(2)}</td>
                <td class="number">${product.profit_margin || 0}</td>
                <td class="number">${product.sales_frequency || 0}</td>
                <td class="center">${product.stock || 0}</td>
            </tr>`;
        });

        htmlContent += `
        </tbody>
    </table>
</body>
</html>`;

        return htmlContent;
    }

    /**
     * Download Excel file
     */
    downloadExcel(excelContent, filename) {
        // Create blob with HTML content and Excel MIME type
        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the URL object
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Handle errors
     */
    handleError(context, error) {
        console.error(`${context}:`, error);
        this.showNotification(`Erreur: ${error.message || 'Une erreur est survenue'}`, 'error');
        this.showAnalyticsError();
    }

    /**
     * Render Visual KPIs with progress bars and gauges
     */
    renderVisualKPIs(stats) {
        try {
            // Vérifier que les éléments KPI existent
            if (!stats) {
                console.warn('Aucune donnée de statistiques disponible pour les KPIs visuels');
                return;
            }
            // Chiffre d'Affaires avec Jauge
            const revenue = parseFloat(stats.revenue || 0);
            const revenueTarget = this.config.targets.dailyRevenue;
            const revenuePercentage = Math.min((revenue / revenueTarget) * 100, 100);

            if (this.elements.revenueProgress) {
                this.elements.revenueProgress.style.width = `${revenuePercentage}%`;
            }
            if (this.elements.revenuePercentage) {
                this.elements.revenuePercentage.textContent = `${Math.round(revenuePercentage)}%`;
            }
            if (this.elements.revenueTarget) {
                this.elements.revenueTarget.textContent = revenueTarget.toLocaleString();
            }

            // Bénéfice avec Marge
            const profit = parseFloat(stats.profit || 0);
            const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
            const targetMargin = this.config.targets.profitMargin;
            const marginPercentage = Math.min((profitMargin / targetMargin) * 100, 100);

            if (this.elements.profitProgress) {
                this.elements.profitProgress.style.width = `${marginPercentage}%`;
            }
            if (this.elements.profitMargin) {
                this.elements.profitMargin.textContent = Math.round(profitMargin);
            }
            if (this.elements.profitPercentage) {
                this.elements.profitPercentage.textContent = `${Math.round(marginPercentage)}%`;
            }

            // Crédits avec Risque
            const totalCredit = parseFloat(stats.totalCredit || 0);
            const overdueCredit = parseFloat(stats.overdueCredit || 0);
            const creditRiskPercentage = totalCredit > 0 ? (overdueCredit / totalCredit) * 100 : 0;

            if (this.elements.creditRisk) {
                this.elements.creditRisk.style.width = `${Math.min(creditRiskPercentage, 100)}%`;
            }
            if (this.elements.overdueCredits) {
                this.elements.overdueCredits.textContent = overdueCredit.toFixed(2);
            }
            if (this.elements.creditRiskLabel) {
                const riskLevel = creditRiskPercentage < 10 ? 'Faible' :
                                creditRiskPercentage < 25 ? 'Moyen' : 'Élevé';
                this.elements.creditRiskLabel.textContent = riskLevel;
            }

            // Stock avec Santé
            const lowStockCount = parseInt(stats.lowStockCount || 0);
            const totalProducts = parseInt(stats.totalProducts || 1);
            const stockHealthPercentage = ((totalProducts - lowStockCount) / totalProducts) * 100;

            if (this.elements.lowStockCount) {
                this.elements.lowStockCount.textContent = lowStockCount;
            }
            if (this.elements.totalProducts) {
                this.elements.totalProducts.textContent = totalProducts;
            }
            if (this.elements.stockHealth) {
                this.elements.stockHealth.style.width = `${stockHealthPercentage}%`;
            }
            if (this.elements.stockHealthLabel) {
                const healthLabel = stockHealthPercentage > 80 ? 'Excellent' :
                                  stockHealthPercentage > 60 ? 'Moyen' : 'Critique';
                this.elements.stockHealthLabel.textContent = healthLabel;
            }

        } catch (error) {
            console.error('Erreur lors du rendu des KPIs visuels:', error);
        }
    }

    /**
     * Refresh alerts based on current data
     */
    async refreshAlerts(stats) {
        try {
            // Vérifier que les éléments d'alertes existent
            if (!this.elements.alertsBadge || !this.elements.alertsList) {
                console.warn('Éléments d\'alertes non trouvés, fonctionnalité désactivée');
                return;
            }
            const alerts = [];

            // Alerte Stock Critique
            const lowStockCount = parseInt(stats.lowStockCount || 0);
            if (lowStockCount > 0) {
                alerts.push({
                    id: 'low-stock',
                    type: 'warning',
                    title: 'Stock Critique',
                    message: `${lowStockCount} produit(s) en rupture de stock`,
                    action: 'Réapprovisionner',
                    actionHandler: () => this.handleQuickRestock(),
                    priority: 'high'
                });
            }

            // Alerte Crédits en Retard
            const overdueCredit = parseFloat(stats.overdueCredit || 0);
            if (overdueCredit > 0) {
                alerts.push({
                    id: 'overdue-credit',
                    type: 'error',
                    title: 'Créances Échues',
                    message: `${overdueCredit.toFixed(2)} MAD en retard de paiement`,
                    action: 'Relancer',
                    actionHandler: () => this.handleQuickReminder(),
                    priority: 'high'
                });
            }

            this.state.alerts = alerts;
            this.updateAlertsUI();

        } catch (error) {
            console.error('Erreur lors du rafraîchissement des alertes:', error);
        }
    }

    /**
     * Update alerts UI
     */
    updateAlertsUI() {
        const alertsCount = this.state.alerts.length;

        // Mettre à jour le badge
        if (this.elements.alertsBadge) {
            if (alertsCount > 0) {
                this.elements.alertsBadge.textContent = alertsCount;
                this.elements.alertsBadge.classList.remove('hidden');
            } else {
                this.elements.alertsBadge.classList.add('hidden');
            }
        }

        // Mettre à jour la liste des alertes
        if (this.elements.alertsList) {
            this.elements.alertsList.innerHTML = '';

            if (alertsCount === 0) {
                this.elements.alertsList.innerHTML = `
                    <div class="p-6 text-center text-gray-500 dark:text-gray-400">
                        <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p>Aucune alerte</p>
                        <p class="text-xs">Tout fonctionne parfaitement</p>
                    </div>
                `;
            } else {
                this.state.alerts.forEach(alert => {
                    const alertElement = this.createAlertElement(alert);
                    this.elements.alertsList.appendChild(alertElement);
                });
            }
        }
    }

    /**
     * Create alert element
     */
    createAlertElement(alert) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer`;

        const typeColors = {
            error: 'text-red-600 bg-red-100',
            warning: 'text-orange-600 bg-orange-100',
            info: 'text-blue-600 bg-blue-100',
            success: 'text-green-600 bg-green-100'
        };

        const typeColor = typeColors[alert.type] || typeColors.info;

        alertDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-full ${typeColor} flex items-center justify-center">
                        ${this.getAlertIcon(alert.type)}
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">${alert.title}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${alert.message}</p>
                    <div class="mt-2">
                        <button class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
                            ${alert.action}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Ajouter l'event listener pour l'action
        const actionButton = alertDiv.querySelector('button');
        if (actionButton && alert.actionHandler) {
            actionButton.addEventListener('click', (e) => {
                e.stopPropagation();
                alert.actionHandler();
                this.hideAlertsPanel();
            });
        }

        return alertDiv;
    }

    /**
     * Get alert icon based on type
     */
    getAlertIcon(type) {
        const icons = {
            error: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
            warning: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
            info: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>',
            success: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
        };
        return icons[type] || icons.info;
    }

    /**
     * Toggle alerts panel
     */
    toggleAlertsPanel() {
        if (this.state.alertsVisible) {
            this.hideAlertsPanel();
        } else {
            this.showAlertsPanel();
        }
    }

    /**
     * Show alerts panel
     */
    showAlertsPanel() {
        if (this.elements.alertsPanel) {
            this.elements.alertsPanel.classList.remove('hidden');
            this.state.alertsVisible = true;
        }
    }

    /**
     * Hide alerts panel
     */
    hideAlertsPanel() {
        if (this.elements.alertsPanel) {
            this.elements.alertsPanel.classList.add('hidden');
            this.state.alertsVisible = false;
        }
    }

    /**
     * Mark all alerts as read
     */
    markAllAlertsRead() {
        this.state.alerts = [];
        this.updateAlertsUI();
        this.showNotification('Toutes les alertes ont été marquées comme lues', 'success');
    }

    /**
     * Start automatic alert refresh
     */
    startAlertRefresh() {
        setInterval(() => {
            if (this.state.lastUpdate) {
                // Rafraîchir les alertes avec les dernières données
                this.loadDashboardData(this.state.dateRange).then(data => {
                    this.refreshAlerts(data.stats);
                }).catch(error => {
                    console.error('Erreur lors du rafraîchissement automatique des alertes:', error);
                });
            }
        }, this.config.alertRefreshInterval);
    }

    /**
     * Handle quick restock action
     */
    async handleQuickRestock() {
        try {
            this.showNotification('Redirection vers la gestion des stocks...', 'info');
            window.location.href = 'stock-adjustment.html';
        } catch (error) {
            console.error('Erreur lors du réapprovisionnement rapide:', error);
            this.showNotification('Erreur lors du réapprovisionnement', 'error');
        }
    }

    /**
     * Handle quick reminder action
     */
    async handleQuickReminder() {
        try {
            this.showNotification('Redirection vers la gestion des crédits...', 'info');
            window.location.href = 'credits.html';
        } catch (error) {
            console.error('Erreur lors de la relance clients:', error);
            this.showNotification('Erreur lors de la relance', 'error');
        }
    }

    /**
     * Handle quick report action
     */
    async handleQuickReport() {
        try {
            this.showNotification('Génération du rapport en cours...', 'info');
            // Générer un rapport simple
            const reportData = {
                period: `${this.state.dateRange.startDate} - ${this.state.dateRange.endDate}`,
                generatedAt: new Date().toISOString(),
                summary: 'Rapport express généré depuis le dashboard'
            };

            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rapport-express-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('Rapport téléchargé avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la génération du rapport:', error);
            this.showNotification('Erreur lors de la génération du rapport', 'error');
        }
    }

    /**
     * Cleanup event listeners
     */
    cleanup() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
        this.state.cache.clear();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Utiliser le système de pré-chargement premium
        await initPagePremium('index', async () => {
            // Initialisation spécifique au dashboard
            const dashboard = new DashboardManager();
            await dashboard.init();

            // Store reference for cleanup if needed
            window.dashboardManager = dashboard;
        });
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        document.body.innerHTML = '<h1>Erreur: Impossible de charger le dashboard</h1>';
    }
});