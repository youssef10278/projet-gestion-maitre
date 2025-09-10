// layout.js - VERSION FINALE TRADUITE ET OPTIMISÉE

/**
 * Corrige les transitions CSS pour éviter la vibration du menu
 */
function fixMenuTransitions() {
    try {
        const navContainer = document.getElementById('main-nav');
        if (!navContainer) return;

        // Corriger toutes les transitions des liens de navigation
        const allLinks = navContainer.querySelectorAll('.nav-link');
        allLinks.forEach(link => {
            // Remplacer transition-all par transition-colors pour plus de stabilité
            if (link.classList.contains('transition-all')) {
                link.classList.remove('transition-all', 'duration-200');
                link.classList.add('transition-colors', 'duration-300');
            }

            // Corriger les transitions des conteneurs d'icônes
            const iconContainer = link.querySelector('div');
            if (iconContainer && iconContainer.classList.contains('duration-200')) {
                iconContainer.classList.remove('duration-200');
                iconContainer.classList.add('duration-300');
            }
        });
    } catch (error) {
        console.warn('Erreur lors de la correction des transitions:', error);
    }
}

/**
 * Met à jour le style du lien actif dans la navigation sans tout reconstruire.
 * @param {string} activePage - Le nom de la page actuellement affichée.
 */
function updateActiveLink(activePage) {
    try {
        const navContainer = document.getElementById('main-nav');
        if (!navContainer) return;

        // Supprimer l'état actif de tous les liens
        const allLinks = navContainer.querySelectorAll('.nav-link');
        allLinks.forEach(link => {
            try {
                // Supprimer les classes d'état actif
                link.classList.remove('active-nav-link', 'bg-gradient-to-r', 'from-blue-600', 'to-blue-700', 'text-white', 'shadow-lg');

                // Restaurer les couleurs par défaut
                link.classList.add('text-white');

        // Réinitialiser l'icône et son conteneur
        const iconContainer = link.querySelector('div');
        const icon = link.querySelector('svg');
        if (iconContainer && icon) {
            try {
                // Supprimer les classes d'état actif
                iconContainer.classList.remove('bg-white/20');
                icon.classList.remove('text-white');

                // Supprimer toutes les classes de couleur existantes
                const colorClasses = [
                    'text-blue-300', 'text-green-300', 'text-purple-300', 'text-yellow-300',
                    'text-indigo-300', 'text-teal-300', 'text-gray-300', 'text-red-300',
                    'text-orange-300', 'text-pink-300'
                ];
                const bgClasses = [
                    'bg-blue-500/20', 'bg-green-500/20', 'bg-purple-500/20', 'bg-yellow-500/20',
                    'bg-indigo-500/20', 'bg-teal-500/20', 'bg-gray-500/20', 'bg-red-500/20',
                    'bg-orange-500/20', 'bg-pink-500/20'
                ];

                icon.classList.remove(...colorClasses);
                iconContainer.classList.remove(...bgClasses);

                // Restaurer les couleurs d'origine selon l'URL
                const href = link.getAttribute('href');
                if (href && href.includes('index.html')) {
                    icon.classList.add('text-blue-300');
                    iconContainer.classList.add('bg-blue-500/20');
                } else if (href && href.includes('caisse.html')) {
                    icon.classList.add('text-green-300');
                    iconContainer.classList.add('bg-green-500/20');
                } else if (href && href.includes('quotes.html')) {
                    icon.classList.add('text-cyan-300');
                    iconContainer.classList.add('bg-cyan-500/20');
                } else if (href && href.includes('products.html')) {
                    icon.classList.add('text-purple-300');
                    iconContainer.classList.add('bg-purple-500/20');
                } else if (href && href.includes('suppliers.html')) {
                    icon.classList.add('text-orange-300');
                    iconContainer.classList.add('bg-orange-500/20');
                } else if (href && href.includes('price-adjustment.html')) {
                    icon.classList.add('text-yellow-300');
                    iconContainer.classList.add('bg-yellow-500/20');
                } else if (href && href.includes('stock-adjustment.html')) {
                    icon.classList.add('text-indigo-300');
                    iconContainer.classList.add('bg-indigo-500/20');
                } else if (href && href.includes('clients.html')) {
                    icon.classList.add('text-teal-300');
                    iconContainer.classList.add('bg-teal-500/20');
                } else if (href && href.includes('history.html')) {
                    icon.classList.add('text-gray-300');
                    iconContainer.classList.add('bg-gray-500/20');
                } else if (href && href.includes('credits.html')) {
                    icon.classList.add('text-red-300');
                    iconContainer.classList.add('bg-red-500/20');
                } else if (href && href.includes('invoices.html')) {
                    icon.classList.add('text-orange-300');
                    iconContainer.classList.add('bg-orange-500/20');
                } else if (href && href.includes('settings.html')) {
                    icon.classList.add('text-pink-300');
                    iconContainer.classList.add('bg-pink-500/20');
                } else if (href && href.includes('delivery-notes.html')) {
                    icon.classList.add('text-emerald-300');
                    iconContainer.classList.add('bg-emerald-500/20');
                }
            } catch (iconError) {
                console.warn('Erreur lors de la restauration des couleurs d\'icône:', iconError);
            }
        }
        } catch (linkError) {
            console.warn('Erreur lors du traitement du lien:', linkError);
        }
    });

    // Activer le lien correspondant à la page actuelle
    const newActive = navContainer.querySelector(`a[href*="${activePage}.html"]`);
    if (newActive) {
        try {
            newActive.classList.add('active-nav-link', 'bg-gradient-to-r', 'from-blue-600', 'to-blue-700', 'text-white', 'shadow-lg');

            // Activer l'icône avec style uniforme
            const iconContainer = newActive.querySelector('div');
            const icon = newActive.querySelector('svg');
            if (iconContainer && icon) {
                try {
                    // Supprimer toutes les couleurs thématiques avec classList
                    const colorClasses = [
                        'text-blue-300', 'text-green-300', 'text-purple-300', 'text-yellow-300',
                        'text-indigo-300', 'text-teal-300', 'text-gray-300', 'text-red-300',
                        'text-orange-300', 'text-pink-300'
                    ];
                    const bgClasses = [
                        'bg-blue-500/20', 'bg-green-500/20', 'bg-purple-500/20', 'bg-yellow-500/20',
                        'bg-indigo-500/20', 'bg-teal-500/20', 'bg-gray-500/20', 'bg-red-500/20',
                        'bg-orange-500/20', 'bg-pink-500/20'
                    ];

                    icon.classList.remove(...colorClasses);
                    iconContainer.classList.remove(...bgClasses);

                    // Appliquer le style actif
                    iconContainer.classList.add('bg-white/20');
                    icon.classList.add('text-white');
                } catch (activeIconError) {
                    console.warn('Erreur lors de l\'activation de l\'icône:', activeIconError);
                }
            }
        } catch (activeError) {
            console.warn('Erreur lors de l\'activation du lien:', activeError);
        }
    }
    } catch (error) {
        console.error('Erreur dans updateActiveLink:', error);
    }
}


/**
 * Construit le menu de navigation latéral en utilisant les clés de traduction.
 */
async function buildNavigation(activePage) {
    try {
        console.log(`🔧 buildNavigation appelée pour la page: ${activePage}`);

        // Vérification détaillée de l'API
        console.log('🔍 Vérification API:', {
            'window.api': !!window.api,
            'window.api.session': !!(window.api && window.api.session),
            'window.api.i18n': !!(window.api && window.api.i18n)
        });

        if (!window.api || !window.api.session) {
            console.error("❌ API de session non disponible.");
            console.log('🔍 window.api disponible:', !!window.api);
            if (window.api) {
                console.log('🔍 Propriétés de window.api:', Object.keys(window.api));
            }
            return;
        }

        // On s'assure que la fonction de traduction 't' est disponible
        const t = window.i18n ? window.i18n.t : (key) => key;
        console.log('🔍 Fonction de traduction disponible:', typeof t);

        console.log('🔧 Récupération de l\'utilisateur actuel...');
        const user = await window.api.session.getCurrentUser();
        console.log('✅ Utilisateur récupéré:', user ? `${user.username} (${user.role})` : 'null');

        const navContainer = document.getElementById('main-nav');
        if (!navContainer) {
            console.error("❌ Conteneur de navigation non trouvé");
            return;
        }
        console.log('✅ Conteneur de navigation trouvé');

    // ========================= DÉBUT DE LA MODIFICATION =========================
    // Menu moderne avec icônes et design amélioré
    const links = {
        dashboard: `
            <a href="index.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-colors duration-300 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-blue-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"></path>
                    </svg>
                </div>
                <span>${t('main_menu_dashboard')}</span>
            </a>`,
        caisse: `
            <a href="caisse.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-colors duration-300 text-white hover:bg-gradient-to-r hover:from-green-600 hover:to-green-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500/20 group-hover:bg-white/20 transition-colors duration-300">
                    <svg class="w-5 h-5 text-green-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
                <span>${t('main_menu_cash_register')}</span>
            </a>`,
        quotes: `
            <a href="quotes.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-colors duration-300 text-white hover:bg-gradient-to-r hover:from-cyan-600 hover:to-cyan-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-500/20 group-hover:bg-white/20 transition-colors duration-300">
                    <svg class="w-5 h-5 text-cyan-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <span>${t('main_menu_quotes') || 'Devis'}</span>
            </a>`,
        products: `
            <a href="products.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-purple-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                </div>
                <span class="flex-1">${t('main_menu_products')}</span>
            </a>`,
        suppliers: `
            <a href="suppliers.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-orange-600 hover:to-orange-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-orange-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                </div>
                <span>${t('main_menu_suppliers') || 'Fournisseurs'}</span>
            </a>`,
        price_adjustment: `
            <a href="price-adjustment.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-yellow-600 hover:to-yellow-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-yellow-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                </div>
                <span>${t('main_menu_price_adjustment')}</span>
            </a>`,
        stock_adjustment: `
            <a href="stock-adjustment.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-indigo-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                    </svg>
                </div>
                <span>${t('main_menu_stock_adjustment')}</span>
            </a>`,
        clients: `
            <a href="clients.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-teal-600 hover:to-teal-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-teal-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
                <span>${t('main_menu_clients')}</span>
            </a>`,
        history: `
            <a href="history.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-gray-600 hover:to-gray-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-gray-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <span>${t('main_menu_history')}</span>
            </a>`,

        credits: `
            <a href="credits.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-red-600 hover:to-red-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-red-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                    </svg>
                </div>
                <span>${t('main_menu_credits')}</span>
            </a>`,
        invoices: `
            <a href="invoices.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-orange-600 hover:to-orange-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-orange-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <span>${t('main_menu_invoices')}</span>
            </a>`,
        returns: `
            <a href="returns.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-amber-600 hover:to-amber-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-amber-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                    </svg>
                </div>
                <span>${t('main_menu_returns') || 'Retours'}</span>
            </a>`,
        expenses: `
            <a href="expenses.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-indigo-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
                <span>${t('main_menu_expenses')}</span>
            </a>`,
        deliveryNotes: `
            <a href="delivery-notes.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/20 group-hover:bg-white/20 transition-colors duration-200">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                </div>
                <span>${t('main_menu_delivery_notes') || 'Bons de Livraison'}</span>
            </a>`,
        settings: `
            <a href="settings.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-pink-600 hover:to-pink-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-pink-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-pink-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                </div>
                <span>${t('main_menu_settings')}</span>
            </a>`,
        migration: `
            <a href="migrate-tickets.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-violet-600 hover:to-violet-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-violet-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                </div>
                <span>${t('main_menu_migration') || 'Migration Tickets'}</span>
            </a>`,
        backup: `
            <a href="backup.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-cyan-600 hover:to-cyan-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-cyan-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m3 3V10"></path>
                    </svg>
                </div>
                <span>${t('main_menu_backup') || 'Sauvegarde'}</span>
            </a>`,
        seller_history: `
            <a href="history.html" class="nav-link group flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-all duration-200 text-white hover:bg-gradient-to-r hover:from-gray-600 hover:to-gray-700 hover:text-white hover:shadow-md">
                <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-500/20 group-hover:bg-white/20 transition-colors duration-200">
                    <svg class="w-5 h-5 text-gray-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <span>${t('main_menu_seller_history')}</span>
            </a>`
    };
    // ========================== FIN DE LA MODIFICATION ==========================

    let navHTML = '';
    if (user && user.role === 'Propriétaire') {
        navHTML += links.dashboard;
    }
    navHTML += links.caisse;
    // Ajouter les devis pour tous les utilisateurs (propriétaires et vendeurs)
    navHTML += links.quotes;
    // Ajouter les retours pour tous les utilisateurs (propriétaires et vendeurs)
    navHTML += links.returns;
    if (user && user.role === 'Propriétaire') {
        navHTML += links.deliveryNotes + links.expenses + links.products + links.suppliers + links.price_adjustment + links.stock_adjustment + links.clients + links.history + links.credits + links.invoices + links.settings + links.backup;
    } else {
        navHTML += links.seller_history;
    }
        navContainer.innerHTML = navHTML;

        // Vérifier que le contenu a été inséré
        if (navContainer.children.length === 0) {
            console.error("Échec de l'insertion du menu HTML");
            return;
        }

        updateActiveLink(activePage);

        // Corriger les transitions pour éviter la vibration
        fixMenuTransitions();

        console.log(`Menu construit avec succès pour la page: ${activePage}`);

    } catch (error) {
        console.error('Erreur lors de la construction du menu:', error);

        // Fallback : créer un menu minimal
        try {
            const navContainer = document.getElementById('main-nav');
            if (navContainer) {
                navContainer.innerHTML = `
                    <div class="text-white p-4">
                        <p>Menu temporairement indisponible</p>
                        <button onclick="window.rebuildMenu('${activePage}')" class="bg-blue-600 text-white px-4 py-2 rounded mt-2">
                            Recharger le menu
                        </button>
                    </div>
                `;
            }
        } catch (fallbackError) {
            console.error('Erreur lors de la création du menu de fallback:', fallbackError);
        }
    }
}

/**
 * Met à jour le badge d'alerte de stock bas.
 */
async function updateStockAlertBadge() {
    if (!window.api || !window.api.session || !window.api.products) return;
    try {
        const user = await window.api.session.getCurrentUser();
        if (!user || user.role !== 'Propriétaire') return;

        const lowStockProducts = await window.api.products.getLowStock();
        const productLink = document.querySelector('a[href="products.html"]');
        if (!productLink) return;

        let badge = productLink.querySelector('.alert-badge');
        if (lowStockProducts.length > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'alert-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse';

                // Ajouter le badge au conteneur d'icône pour un positionnement relatif
                const iconContainer = productLink.querySelector('div');
                if (iconContainer) {
                    iconContainer.style.position = 'relative';
                    iconContainer.appendChild(badge);
                }
            }
            badge.textContent = lowStockProducts.length;
        } else {
            if (badge) badge.remove();
        }
    } catch (error) {
        console.error("Impossible de mettre à jour le badge d'alerte:", error);
    }
}

/**
 * Initialise la page de manière intelligente.
 */
async function initializePage(activePage) {
    try {
        // Toujours reconstruire le menu pour s'assurer qu'il est visible
        await buildNavigation(activePage);
        await updateStockAlertBadge();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la page:', error);
        // Fallback : essayer de mettre à jour seulement le lien actif
        try {
            updateActiveLink(activePage);
        } catch (fallbackError) {
            console.error('Erreur lors du fallback:', fallbackError);
        }
    }
}

/**
 * Vérifie que le menu est visible et le reconstruit si nécessaire
 */
function ensureMenuVisible(activePage) {
    const navContainer = document.getElementById('main-nav');
    if (!navContainer) {
        console.warn('Conteneur de navigation non trouvé');
        return false;
    }

    const links = navContainer.querySelectorAll('.nav-link');
    if (links.length === 0) {
        console.warn('Menu vide détecté, reconstruction...');
        initializePage(activePage);
        return false;
    }

    return true;
}

/**
 * Force la reconstruction du menu
 */
async function rebuildMenu(activePage) {
    try {
        await buildNavigation(activePage);
        await updateStockAlertBadge();
        console.log('Menu reconstruit avec succès');
    } catch (error) {
        console.error('Erreur lors de la reconstruction du menu:', error);
    }
}

// On expose les fonctions pour l'appeler depuis d'autres scripts.
window.updateStockAlertBadge = updateStockAlertBadge;
window.initializePage = initializePage;
window.ensureMenuVisible = ensureMenuVisible;
window.rebuildMenu = rebuildMenu;
window.buildNavigation = buildNavigation;
window.buildMenu = buildNavigation; // Alias pour compatibilité

function showConfirmation(message) {
    // ... (votre fonction de confirmation reste identique)
    const modal = document.getElementById('confirmationModal');
    const messageEl = document.getElementById('confirmationMessage');
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');

    if (!modal || !messageEl || !okBtn || !cancelBtn) {
        console.error("Éléments de la modale de confirmation introuvables.");
        return Promise.resolve(false);
    }
    
    // On traduit le message de la modale ici
    const t = window.i18n ? window.i18n.t : (key) => key;
    messageEl.textContent = t(message);
    if(document.getElementById('confirmationModal')) { // Ajout d'une sécurité
        document.querySelector('#confirmationMessage').textContent = message;
    }

    modal.classList.replace('hidden', 'flex');
    okBtn.focus();

    return new Promise((resolve) => {
        const cleanupAndResolve = (value) => {
            modal.classList.replace('flex', 'hidden');
            okBtn.removeEventListener('click', okHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
            document.removeEventListener('keydown', keydownHandler);
            resolve(value);
        };
        
        const okHandler = () => cleanupAndResolve(true);
        const cancelHandler = () => cleanupAndResolve(false);
        const keydownHandler = (e) => {
    const active = document.activeElement;
    const isTypingField = active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.isContentEditable
    );

    if (e.key === 'Enter' && !isTypingField) {
        e.preventDefault();
        okHandler();
    } else if (e.key === 'Escape') {
        cancelHandler();
    }
};

        okBtn.addEventListener('click', okHandler, { once: true });
        cancelBtn.addEventListener('click', cancelHandler, { once: true });
        document.addEventListener('keydown', keydownHandler);
    });
}
window.showConfirmation = showConfirmation;