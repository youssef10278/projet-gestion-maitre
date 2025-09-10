// preload.js - MODIFIÉ POUR L'INTERNATIONALISATION
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // --- Session et Application ---
    session: {
        authenticate: (username, password) => ipcRenderer.invoke('users:authenticate', { username, password }),
        getCurrentUser: () => ipcRenderer.invoke('session:get-current-user'),
    },
    app: {
        getMachineId: () => ipcRenderer.invoke('app:get-machine-id'),
        notifyActivationSuccess: (licenseKey) => ipcRenderer.send('app:activation-success', licenseKey),
        reload: () => ipcRenderer.invoke('app:reload'),
        activateLicense: (licenseKey) => ipcRenderer.invoke('activate-license', licenseKey),
        factoryReset: () => ipcRenderer.invoke('system:factory-reset'),
    },
    dialog: {
        openImage: () => ipcRenderer.invoke('dialog:open-image'),
    },
    file: {
        saveImage: (args) => ipcRenderer.invoke('file:save-image', args),
    },

    // --- API Produits ---
    products: {
        getAll: (searchTerm) => ipcRenderer.invoke('products:get-all', searchTerm),
        getById: (id) => ipcRenderer.invoke('products:get-by-id', id),
        add: (product) => ipcRenderer.invoke('products:add', product),
        update: (product) => ipcRenderer.invoke('products:update', product),
        delete: (id) => ipcRenderer.invoke('products:delete', id),
        getCategories: () => ipcRenderer.invoke('products:get-categories'),
        getLowStock: () => ipcRenderer.invoke('products:get-low-stock'),
        adjustStock: (data) => ipcRenderer.invoke('products:adjust-stock', data),
    },

    // --- API Gestion des Stocks par Lots ---
    stockLots: {
        getProductLots: (productId, includeEmpty) => ipcRenderer.invoke('stock-lots:get-product-lots', productId, includeEmpty),
        getLotById: (lotId) => ipcRenderer.invoke('stock-lots:get-lot-by-id', lotId),
        createLot: (lotData) => ipcRenderer.invoke('stock-lots:create-lot', lotData),
        updateQuantity: (lotId, quantity) => ipcRenderer.invoke('stock-lots:update-quantity', lotId, quantity),
        recordMovement: (movementData) => ipcRenderer.invoke('stock-lots:record-movement', movementData),
        getMovements: (productId, limit) => ipcRenderer.invoke('stock-lots:get-movements', productId, limit),
        getValuationSettings: (productId) => ipcRenderer.invoke('stock-lots:get-valuation-settings', productId),
        calculateAverageCost: (productId) => ipcRenderer.invoke('stock-lots:calculate-average-cost', productId),
        migrate: () => ipcRenderer.invoke('stock-lots:migrate'),
        syncProductStock: (productId) => ipcRenderer.invoke('stock-lots:sync-product-stock', productId),
        syncAllStocks: () => ipcRenderer.invoke('stock-lots:sync-all-stocks'),
        // Intégration transparente
        adjustStockDirectly: (productId, newStock) => ipcRenderer.invoke('stock-lots:adjust-stock-directly', productId, newStock),
        ensureProductHasLots: (productId) => ipcRenderer.invoke('stock-lots:ensure-product-has-lots', productId),
        ensureAllProductsHaveLots: () => ipcRenderer.invoke('stock-lots:ensure-all-products-have-lots'),
        // Filtrage et préférences
        saveFilterPreferences: (userId, preferences) => ipcRenderer.invoke('stock-lots:save-filter-preferences', userId, preferences),
        getFilterPreferences: (userId) => ipcRenderer.invoke('stock-lots:get-filter-preferences', userId),
        bulkAction: (lotIds, action, actionData) => ipcRenderer.invoke('stock-lots:bulk-action', lotIds, action, actionData),
    },
    suppliers: {
        create: (supplierData) => ipcRenderer.invoke('suppliers:create', supplierData),
        getAll: (options) => ipcRenderer.invoke('suppliers:getAll', options),
        getById: (supplierId) => ipcRenderer.invoke('suppliers:getById', supplierId),
        update: (supplierId, supplierData) => ipcRenderer.invoke('suppliers:update', supplierId, supplierData),
        delete: (supplierId) => ipcRenderer.invoke('suppliers:delete', supplierId),
        getStats: (supplierId) => ipcRenderer.invoke('suppliers:getStats', supplierId),
        getAllWithStats: (options) => ipcRenderer.invoke('suppliers:getAllWithStats', options),
    },


    // --- API Clients ---
    clients: {
        getAll: (searchTerm) => ipcRenderer.invoke('clients:get-all', searchTerm),
        getById: (id) => ipcRenderer.invoke('clients:get-by-id', id),
        add: (client) => ipcRenderer.invoke('clients:add', client),
        forceAdd: (client) => ipcRenderer.invoke('clients:force-add', client),
        update: (client) => ipcRenderer.invoke('clients:update', client),
        delete: (id) => ipcRenderer.invoke('clients:delete', id),
        cleanupDuplicates: () => ipcRenderer.invoke('clients:cleanup-duplicates'),
        findSimilar: (name) => ipcRenderer.invoke('clients:find-similar', name),
    },

    // --- API Ventes ---
    sales: {
        process: (saleData) => ipcRenderer.invoke('sales:process', saleData),
        getHistory: (filters) => ipcRenderer.invoke('sales:get-history', filters),
        getHistoryForUser: () => ipcRenderer.invoke('sales:get-history-for-user'),
        getClientHistory: (clientId) => ipcRenderer.invoke('sales:get-client-history', clientId),
        getDetails: (saleId) => ipcRenderer.invoke('sales:get-details', saleId),
        edit: (editData) => ipcRenderer.invoke('sales:edit', editData),
        getLast: () => ipcRenderer.invoke('sales:get-last'),
        processReturn: (returnData) => ipcRenderer.invoke('sales:process-return', returnData),
        getAll: () => ipcRenderer.invoke('sales:get-all'),
        getAllItems: () => ipcRenderer.invoke('sales:get-all-items'),
    },
    
    // --- API Crédits ---
    credits: {
        getDebtors: () => ipcRenderer.invoke('credits:get-debtors'),
        getClientCredit: (clientId) => ipcRenderer.invoke('credits:get-client-credit', clientId),
        getClientHistory: (clientId) => ipcRenderer.invoke('credits:get-client-history', clientId),
        recordPayment: (paymentData) => ipcRenderer.invoke('credits:record-payment', paymentData),
        addManual: (creditData) => ipcRenderer.invoke('credits:add-manual', creditData),
    },

    // --- API Retours ---
    returns: {
        searchSales: (filters) => ipcRenderer.invoke('returns:search-sales', filters),
        getSaleDetails: (saleId) => ipcRenderer.invoke('returns:get-sale-details', saleId),
        process: (returnData) => ipcRenderer.invoke('returns:process', returnData),
        getHistory: (filters) => ipcRenderer.invoke('returns:get-history', filters),
        getDetails: (returnId) => ipcRenderer.invoke('returns:get-details', returnId),
        getExistingReturns: (saleId) => ipcRenderer.invoke('returns:get-existing-returns', saleId),
        getStats: () => ipcRenderer.invoke('returns:get-stats'),
    },

    // --- API Devis ---
    quotes: {
        create: (quoteData) => ipcRenderer.invoke('quotes:create', quoteData),
        getAll: () => ipcRenderer.invoke('quotes:get-all'),
        getById: (id) => ipcRenderer.invoke('quotes:get-by-id', id),
        update: (id, updateData) => ipcRenderer.invoke('quotes:update', id, updateData),
        delete: (id) => ipcRenderer.invoke('quotes:delete', id),
        updateStatus: (id, status, saleId) => ipcRenderer.invoke('quotes:update-status', id, status, saleId),
        getByStatus: (status) => ipcRenderer.invoke('quotes:get-by-status', status),
        getNextNumber: () => ipcRenderer.invoke('quotes:get-next-number'),
        addItem: (quoteId, item) => ipcRenderer.invoke('quotes:add-item', quoteId, item),
        updateItem: (itemId, item) => ipcRenderer.invoke('quotes:update-item', itemId, item),
        deleteItem: (itemId) => ipcRenderer.invoke('quotes:delete-item', itemId),
        getItems: (quoteId) => ipcRenderer.invoke('quotes:get-items', quoteId)
    },

    // --- API Dépenses ---
    expenses: {
        getAll: (filters) => ipcRenderer.invoke('expenses:get-all', filters),
        getById: (id) => ipcRenderer.invoke('expenses:get-by-id', id),
        create: (expenseData) => ipcRenderer.invoke('expenses:create', expenseData),
        update: (id, expenseData) => ipcRenderer.invoke('expenses:update', id, expenseData),
        delete: (id) => ipcRenderer.invoke('expenses:delete', id),
        getCategories: () => ipcRenderer.invoke('expenses:get-categories'),
        getStats: (period) => ipcRenderer.invoke('expenses:get-stats', period),
        getRecurring: () => ipcRenderer.invoke('expenses:get-recurring'),
        createRecurring: (recurringData) => ipcRenderer.invoke('expenses:create-recurring', recurringData),
        updateRecurring: (id, recurringData) => ipcRenderer.invoke('expenses:update-recurring', id, recurringData),
        deleteRecurring: (id) => ipcRenderer.invoke('expenses:delete-recurring', id),
        processRecurring: (id) => ipcRenderer.invoke('expenses:process-recurring', id),
        getUpcoming: (days) => ipcRenderer.invoke('expenses:get-upcoming', days || 7),
        getBudgetSettings: () => ipcRenderer.invoke('expenses:get-budget-settings'),
        setBudgetSettings: (settings) => ipcRenderer.invoke('expenses:set-budget-settings', settings),
        clearTestData: () => ipcRenderer.invoke('expenses:clear-test-data'),
        hasTestData: () => ipcRenderer.invoke('expenses:has-test-data'),
    },

    // --- API Templates de Factures ---
    templates: {
        getAll: () => ipcRenderer.invoke('templates:get-all'),
        getById: (id) => ipcRenderer.invoke('templates:get-by-id', id),
        create: (templateData) => ipcRenderer.invoke('templates:create', templateData),
        update: (id, templateData) => ipcRenderer.invoke('templates:update', id, templateData),
        delete: (id) => ipcRenderer.invoke('templates:delete', id),
        setDefault: (id) => ipcRenderer.invoke('templates:set-default', id),
        getDefault: () => ipcRenderer.invoke('templates:get-default')
    },

    // --- API Migration ---
    migration: {
        getTicketStats: () => ipcRenderer.invoke('migration:get-ticket-stats'),
        migrateTicketNumbers: () => ipcRenderer.invoke('migration:migrate-ticket-numbers'),
    },

    // --- API Factures ---
    invoices: {
        getAll: () => ipcRenderer.invoke('invoices:get-all'),
        getDetails: (id) => ipcRenderer.invoke('invoices:get-details', id),
        getNextNumber: () => ipcRenderer.invoke('invoices:get-next-number'),
        create: (invoiceData) => ipcRenderer.invoke('invoices:create', invoiceData),
        getAllItems: () => ipcRenderer.invoke('invoices:get-all-items'),
    },

    // ================== AJOUT DE LA NOUVELLE API I18N ==================
    i18n: {
        getTranslation: (lang) => ipcRenderer.invoke('i18n:get-translation', lang)
    },
    // =================================================================

    // --- API Paramètres ---
    settings: {
        getCompanyInfo: () => ipcRenderer.invoke('settings:get-company-info'),
        saveCompanyInfo: (info) => ipcRenderer.invoke('settings:save-company-info', info),
        language: {
            get: () => ipcRenderer.invoke('settings:get-language'),
            set: (lang) => ipcRenderer.invoke('settings:set-language', lang),
        },
        getAll: () => ipcRenderer.invoke('settings:get-all'),
    },

    // --- API Paramètres Génériques ---
    getSetting: (key) => ipcRenderer.invoke('settings:get', key),
    saveSetting: (key, value) => ipcRenderer.invoke('settings:save', key, value),

    // --- API Thème ---
    theme: {
        set: (theme) => ipcRenderer.invoke('theme:set', theme),
        get: () => ipcRenderer.invoke('theme:get'),
    },

    // --- API Utilisateurs (Vendeurs) ---
    users: {
        getAll: () => ipcRenderer.invoke('users:get-all'),
        add: (userData) => ipcRenderer.invoke('users:add', userData),
        delete: (id) => ipcRenderer.invoke('users:delete', id),
        updatePassword: (data) => ipcRenderer.invoke('users:update-password', data),
        updateCredentials: (data) => ipcRenderer.invoke('users:update-credentials', data),
    },

    // --- API Dashboard ---
    dashboard: {
        getStats: (range) => ipcRenderer.invoke('dashboard:get-stats', range),
        getTopProfitable: (params) => ipcRenderer.invoke('dashboard:get-top-profitable', params),
        getTopSelling: (params) => ipcRenderer.invoke('dashboard:get-top-selling', params),
        getPerformanceOverview: (params) => ipcRenderer.invoke('dashboard:get-performance-overview', params),
        getInsights: (params) => ipcRenderer.invoke('dashboard:get-insights', params),
    },

    // --- API Impression ---
    print: {
        toPDF: (htmlContent) => ipcRenderer.invoke('print:to-pdf', htmlContent),
    },

    // --- API PDF ---
    pdf: {
        generatePDF: (htmlContent, filename) => ipcRenderer.invoke('pdf:generate-ticket', htmlContent, filename),
        generateQuotePDF: (htmlContent, filename) => ipcRenderer.invoke('pdf:generate-quote', htmlContent, filename),
    },

    // --- API Sauvegarde/Restauration ---
    backup: {
        clearAllData: () => ipcRenderer.invoke('backup:clear-all-data'),
        importProducts: (products, mode) => ipcRenderer.invoke('backup:import-products', products, mode),
        importClients: (clients, mode) => ipcRenderer.invoke('backup:import-clients', clients, mode),
        importSales: (sales, saleItems, mode) => ipcRenderer.invoke('backup:import-sales', sales, saleItems, mode),
        importInvoices: (invoices, invoiceItems, mode) => ipcRenderer.invoke('backup:import-invoices', invoices, invoiceItems, mode),
        importSettings: (settings, mode) => ipcRenderer.invoke('backup:import-settings', settings, mode),
        getBackupHistory: () => ipcRenderer.invoke('backup:get-backup-history'),
        saveBackupHistory: (history) => ipcRenderer.invoke('backup:save-backup-history', history),
        saveAutoBackup: (filename, content) => ipcRenderer.invoke('backup:save-auto-backup', filename, content),
        getBackupContent: (filename) => ipcRenderer.invoke('backup:get-backup-content', filename),
        deleteBackup: (filename) => ipcRenderer.invoke('backup:delete-backup', filename),
        getBackupSettings: () => ipcRenderer.invoke('backup:get-backup-settings'),
        saveBackupSettings: (settings) => ipcRenderer.invoke('backup:save-backup-settings', settings),
    },
});