// src/js/preloader.js - Système de pré-chargement pour éviter le flash de traduction

/**
 * Système de pré-chargement premium pour éviter le flash de contenu
 */
class TranslationPreloader {
    constructor() {
        this.isInitialized = false;
        this.loadingPromise = null;
        this.observers = [];
    }

    /**
     * Initialise le pré-chargement dès que possible
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('Preloader déjà initialisé, éviter le rechargement');
            return Promise.resolve();
        }

        try {
            // Vérifier si les traductions sont déjà disponibles
            const hasTranslations = window.i18n &&
                                  window.i18n.getTranslations &&
                                  Object.keys(window.i18n.getTranslations()).length > 0;

            if (hasTranslations) {
                console.log('Traductions déjà disponibles, pas de rechargement nécessaire');
                this.isInitialized = true;
                return Promise.resolve();
            }

            // Masquer le contenu pendant le chargement seulement si nécessaire
            this.hideContent();

            // Pré-charger les traductions
            if (window.i18n && window.i18n.preloadTranslations) {
                this.loadingPromise = window.i18n.preloadTranslations();
                await this.loadingPromise;
            }

            // Appliquer les traductions instantanément
            if (window.i18n && window.i18n.applyTranslationsInstant) {
                window.i18n.applyTranslationsInstant();
            }

            // Afficher le contenu
            this.showContent();

            this.isInitialized = true;
            console.log('Preloader initialisé avec succès');

        } catch (error) {
            console.error('Erreur lors du pré-chargement:', error);
            // En cas d'erreur, afficher quand même le contenu
            this.showContent();
            this.isInitialized = true; // Marquer comme initialisé pour éviter les tentatives répétées
        }
    }

    /**
     * Masque le contenu pendant le chargement
     */
    hideContent() {
        // Ajouter une classe CSS pour masquer le contenu
        document.documentElement.style.setProperty('--preloader-opacity', '0');
        document.documentElement.style.setProperty('--preloader-transition', 'opacity 0.3s ease');
        
        // Ajouter un style inline temporaire
        const style = document.createElement('style');
        style.id = 'translation-preloader-style';
        style.textContent = `
            .translation-loading {
                opacity: var(--preloader-opacity, 0);
                transition: var(--preloader-transition, opacity 0.3s ease);
            }
            
            .translation-loading * {
                visibility: hidden;
            }
            
            .translation-loading .preloader-spinner {
                visibility: visible;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 9999;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .rtl {
                direction: rtl;
            }
            
            .rtl * {
                text-align: right;
            }
        `;
        document.head.appendChild(style);
        
        // Ajouter la classe de chargement au body
        document.body.classList.add('translation-loading');
        
        // Ajouter un spinner de chargement
        const spinner = document.createElement('div');
        spinner.className = 'preloader-spinner';
        spinner.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(spinner);
    }

    /**
     * Affiche le contenu après le chargement
     */
    showContent() {
        // Supprimer le spinner
        const spinner = document.querySelector('.preloader-spinner');
        if (spinner) {
            spinner.remove();
        }
        
        // Afficher le contenu avec une transition fluide
        document.documentElement.style.setProperty('--preloader-opacity', '1');
        
        setTimeout(() => {
            // Supprimer la classe de chargement
            document.body.classList.remove('translation-loading');
            
            // Supprimer le style temporaire
            const style = document.getElementById('translation-preloader-style');
            if (style) {
                style.remove();
            }
            
            // Nettoyer les variables CSS
            document.documentElement.style.removeProperty('--preloader-opacity');
            document.documentElement.style.removeProperty('--preloader-transition');
        }, 300);
    }

    /**
     * Observe les changements de DOM pour appliquer les traductions
     */
    observeChanges() {
        if (!window.MutationObserver) return;
        
        const observer = new MutationObserver((mutations) => {
            let hasNewTranslatableElements = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.hasAttribute && node.hasAttribute('data-i18n')) {
                                hasNewTranslatableElements = true;
                            } else if (node.querySelector && node.querySelector('[data-i18n]')) {
                                hasNewTranslatableElements = true;
                            }
                        }
                    });
                }
            });
            
            if (hasNewTranslatableElements && window.i18n && window.i18n.applyTranslationsInstant) {
                // Appliquer les traductions aux nouveaux éléments
                requestAnimationFrame(() => {
                    window.i18n.applyTranslationsInstant();
                });
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observers.push(observer);
    }

    /**
     * Nettoie les observateurs
     */
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }

    /**
     * Réinitialise le preloader pour une nouvelle page
     */
    reset() {
        this.isInitialized = false;
        this.loadingPromise = null;
        console.log('Preloader réinitialisé');
    }

    /**
     * Vérifie si le preloader est prêt
     */
    isReady() {
        return this.isInitialized &&
               window.i18n &&
               window.i18n.getTranslations &&
               Object.keys(window.i18n.getTranslations()).length > 0;
    }
}

// Instance globale du preloader
const translationPreloader = new TranslationPreloader();

// Initialiser dès que possible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        translationPreloader.initialize();
        translationPreloader.observeChanges();
    });
} else {
    // Le DOM est déjà chargé
    translationPreloader.initialize();
    translationPreloader.observeChanges();
}

// Exposer globalement
window.translationPreloader = translationPreloader;
