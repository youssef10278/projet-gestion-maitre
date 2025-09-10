// src/js/page-initializer.js - Initialisateur de page premium sans flash

/**
 * Initialisateur de page premium qui évite le flash de traduction
 */
class PageInitializer {
    constructor() {
        this.isInitialized = false;
        this.initPromise = null;
    }

    /**
     * Initialise une page de manière premium
     * @param {string} pageName - Nom de la page pour le menu actif
     * @param {Function} pageSpecificInit - Fonction d'initialisation spécifique à la page
     */
    async initializePage(pageName, pageSpecificInit = null) {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._doInitialize(pageName, pageSpecificInit);
        return this.initPromise;
    }

    async _doInitialize(pageName, pageSpecificInit) {
        try {
            // Étape 1: Pré-chargement immédiat des styles de langue
            this._applyLanguageStylesImmediately();

            // Étape 2: Vérifier si les traductions sont déjà chargées
            let translationsReady = false;
            if (window.i18n && window.i18n.getCurrentLanguage) {
                const currentLang = window.i18n.getCurrentLanguage();
                if (currentLang && Object.keys(window.i18n.t('') || {}).length > 0) {
                    translationsReady = true;
                }
            }

            // Étape 3: Charger les traductions seulement si nécessaire
            if (!translationsReady) {
                if (window.translationPreloader && !window.translationPreloader.isInitialized) {
                    await window.translationPreloader.initialize();
                }

                if (window.i18n) {
                    if (window.i18n.isLoading && window.i18n.isLoading()) {
                        await window.i18n.loadTranslationsAsync();
                    } else if (!window.i18n.getCurrentLanguage) {
                        await window.i18n.loadTranslations();
                    }
                }
            }

            // Étape 4: Appliquer les traductions instantanément (seulement si nécessaire)
            if (window.i18n && window.i18n.applyTranslationsInstant) {
                window.i18n.applyTranslationsInstant();
            }

            // Étape 5: Initialiser le layout/menu (éviter la double initialisation)
            if (typeof initializePage === 'function') {
                // Vérifier si le menu est déjà construit
                const navContainer = document.getElementById('main-nav');
                const hasMenu = navContainer && navContainer.children.length > 0;

                if (!hasMenu) {
                    await initializePage(pageName);
                } else {
                    // Juste mettre à jour le lien actif
                    if (typeof updateActiveLink === 'function') {
                        updateActiveLink(pageName);
                    }
                }
            }

            // Étape 6: Initialisation spécifique à la page
            if (pageSpecificInit && typeof pageSpecificInit === 'function') {
                await pageSpecificInit();
            }

            // Étape 7: Appliquer les traductions finales seulement pour le nouveau contenu
            if (window.i18n && window.i18n.applyTranslationsToHTML) {
                // Appliquer seulement aux éléments non traduits
                const untranslatedElements = document.querySelectorAll('[data-i18n]:not([data-translated])');
                if (untranslatedElements.length > 0) {
                    window.i18n.applyTranslationsToHTML();
                    // Marquer les éléments comme traduits
                    untranslatedElements.forEach(el => el.setAttribute('data-translated', 'true'));
                }
            }

            this.isInitialized = true;
            console.log(`Page ${pageName} initialisée avec succès (rechargement évité)`);

        } catch (error) {
            console.error(`Erreur lors de l'initialisation de la page ${pageName}:`, error);

            // Fallback: essayer d'afficher la page même en cas d'erreur
            try {
                if (typeof initializePage === 'function') {
                    await initializePage(pageName);
                }
                if (pageSpecificInit && typeof pageSpecificInit === 'function') {
                    await pageSpecificInit();
                }
            } catch (fallbackError) {
                console.error('Erreur lors du fallback:', fallbackError);
            }
        }
    }

    /**
     * Applique immédiatement les styles de langue pour éviter le flash
     */
    _applyLanguageStylesImmediately() {
        const savedLang = localStorage.getItem('app-language') || 'fr';
        
        // Appliquer immédiatement les attributs de langue
        document.documentElement.lang = savedLang;
        document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
        
        if (savedLang === 'ar') {
            document.documentElement.classList.add('rtl');
            document.body.classList.add('rtl');
        } else {
            document.documentElement.classList.remove('rtl');
            document.body.classList.remove('rtl');
        }
    }

    /**
     * Réinitialise l'initialisateur pour une nouvelle page
     */
    reset() {
        this.isInitialized = false;
        this.initPromise = null;
    }
}

// Instance globale
const pageInitializer = new PageInitializer();

/**
 * Fonction utilitaire pour initialiser une page
 * @param {string} pageName - Nom de la page
 * @param {Function} pageSpecificInit - Fonction d'initialisation spécifique
 */
async function initPagePremium(pageName, pageSpecificInit = null) {
    return await pageInitializer.initializePage(pageName, pageSpecificInit);
}

/**
 * Fonction pour créer un initialisateur de page standard
 * @param {string} pageName - Nom de la page
 */
function createPageInitializer(pageName) {
    return async function(pageSpecificInit = null) {
        // Attendre que le DOM soit prêt
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        return await initPagePremium(pageName, pageSpecificInit);
    };
}

// Exposer globalement
window.pageInitializer = pageInitializer;
window.initPagePremium = initPagePremium;
window.createPageInitializer = createPageInitializer;

// Auto-initialisation si la page a un attribut data-page-name
document.addEventListener('DOMContentLoaded', () => {
    const pageNameElement = document.querySelector('[data-page-name]');
    if (pageNameElement) {
        const pageName = pageNameElement.getAttribute('data-page-name');
        initPagePremium(pageName);
    }
});
