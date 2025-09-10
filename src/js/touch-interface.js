// touch-interface.js - Optimisations pour interfaces tactiles
// Améliore l'expérience utilisateur sur caisses tactiles

class TouchInterface {
    constructor() {
        this.isTouchDevice = this.detectTouchDevice();
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.longPressTimer = null;
        this.longPressDelay = 500; // 500ms pour un appui long
        this.tapDelay = 300; // Délai pour détecter un double tap
        this.lastTap = 0;
        
        this.init();
    }

    detectTouchDevice() {
        return (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
    }

    init() {
        if (!this.isTouchDevice) {
            console.log('Interface tactile non détectée, optimisations désactivées');
            return;
        }

        console.log('Interface tactile détectée, activation des optimisations');
        
        // Ajouter la classe CSS pour les appareils tactiles
        document.body.classList.add('touch-device');
        
        // Initialiser les gestionnaires d'événements tactiles
        this.initTouchHandlers();
        this.initVisualFeedback();
        this.initAccessibility();
        this.initKeyboardHandling();
        this.preventZoom();
    }

    initTouchHandlers() {
        // Gestionnaire pour tous les éléments interactifs
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        
        // Gestionnaire spécial pour les boutons
        this.initButtonHandlers();
        
        // Gestionnaire pour les cartes produits
        this.initProductCardHandlers();
    }

    handleTouchStart(e) {
        const target = e.target.closest('.touch-target, button, .product-card');
        if (!target) return;

        this.touchStartTime = Date.now();
        this.touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };

        // Ajouter la classe de feedback visuel
        target.classList.add('touch-active');
        
        // Démarrer le timer pour l'appui long
        this.longPressTimer = setTimeout(() => {
            this.handleLongPress(target, e);
        }, this.longPressDelay);

        // Vibration tactile si supportée
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    handleTouchEnd(e) {
        const target = e.target.closest('.touch-target, button, .product-card');
        if (!target) return;

        // Nettoyer le timer d'appui long
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        // Retirer la classe de feedback visuel
        setTimeout(() => {
            target.classList.remove('touch-active');
        }, 150);

        const touchDuration = Date.now() - this.touchStartTime;
        const touchDistance = this.calculateDistance(
            this.touchStartPos,
            { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
        );

        // Vérifier si c'est un tap valide (courte durée, faible distance)
        if (touchDuration < 500 && touchDistance < 20) {
            this.handleTap(target, e);
        }
    }

    handleTouchMove(e) {
        const touchDistance = this.calculateDistance(
            this.touchStartPos,
            { x: e.touches[0].clientX, y: e.touches[0].clientY }
        );

        // Annuler l'appui long si l'utilisateur bouge trop
        if (touchDistance > 20 && this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    calculateDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
        );
    }

    handleTap(target, e) {
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTap;

        if (timeSinceLastTap < this.tapDelay) {
            // Double tap détecté
            this.handleDoubleTap(target, e);
        } else {
            // Simple tap
            this.handleSingleTap(target, e);
        }

        this.lastTap = now;
    }

    handleSingleTap(target, e) {
        // Feedback visuel pour le tap
        this.showTapFeedback(target);
        
        // Laisser l'événement se propager normalement pour les boutons
        if (target.tagName === 'BUTTON' || target.type === 'submit') {
            return;
        }

        // Pour les autres éléments, déclencher un clic
        if (target.onclick || target.addEventListener) {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            target.dispatchEvent(clickEvent);
        }
    }

    handleDoubleTap(target, e) {
        e.preventDefault();
        
        // Actions spéciales pour le double tap
        if (target.classList.contains('product-card')) {
            // Double tap sur produit = ajout rapide de 2 unités
            this.addProductQuickly(target, 2);
        } else if (target.id === 'barcodeInput') {
            // Double tap sur scanner = effacer le contenu
            target.value = '';
            target.focus();
        }
    }

    handleLongPress(target, e) {
        e.preventDefault();
        
        // Vibration plus forte pour l'appui long
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }

        // Actions spéciales pour l'appui long
        if (target.classList.contains('product-card')) {
            // Appui long sur produit = voir détails
            this.showProductDetails(target);
        } else if (target.classList.contains('quantity-btn')) {
            // Appui long sur bouton quantité = modification rapide
            this.showQuantityEditor(target);
        }

        // Ajouter une classe pour le feedback visuel
        target.classList.add('long-press-active');
        setTimeout(() => {
            target.classList.remove('long-press-active');
        }, 300);
    }

    initButtonHandlers() {
        // Améliorer les boutons de paiement
        const paymentButtons = document.querySelectorAll(
            '#validate-payment-btn, #cancel-sale-btn, #cash-payment-btn, #check-payment-btn, #credit-payment-btn'
        );

        paymentButtons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                button.style.transform = 'scale(0.95)';
            }, { passive: true });

            button.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 100);
            }, { passive: true });
        });
    }

    initProductCardHandlers() {
        // Observer pour les nouvelles cartes produits ajoutées dynamiquement
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('product-card')) {
                        this.enhanceProductCard(node);
                    }
                });
            });
        });

        observer.observe(document.getElementById('product-grid') || document.body, {
            childList: true,
            subtree: true
        });
    }

    enhanceProductCard(card) {
        // Ajouter des indicateurs visuels pour les interactions tactiles
        if (!card.querySelector('.touch-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'touch-indicator';
            indicator.innerHTML = '👆'; // Icône de doigt
            indicator.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                font-size: 12px;
                opacity: 0.6;
                pointer-events: none;
            `;
            card.style.position = 'relative';
            card.appendChild(indicator);
        }
    }

    initVisualFeedback() {
        // Ajouter les styles CSS pour le feedback tactile
        const style = document.createElement('style');
        style.textContent = `
            .touch-active {
                transform: scale(0.95) !important;
                opacity: 0.8 !important;
                transition: all 0.1s ease !important;
            }
            
            .long-press-active {
                box-shadow: 0 0 20px rgba(59, 130, 246, 0.5) !important;
                border-color: #3b82f6 !important;
            }
            
            .tap-feedback {
                position: relative;
                overflow: hidden;
            }
            
            .tap-feedback::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                transform: translate(-50%, -50%);
                animation: tap-ripple 0.3s ease-out;
            }
            
            @keyframes tap-ripple {
                to {
                    width: 100px;
                    height: 100px;
                    opacity: 0;
                }
            }
            
            .touch-device .touch-target:focus {
                outline: 3px solid #3b82f6 !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(style);
    }

    showTapFeedback(element) {
        element.classList.add('tap-feedback');
        setTimeout(() => {
            element.classList.remove('tap-feedback');
        }, 300);
    }

    initAccessibility() {
        // Améliorer l'accessibilité pour les appareils tactiles
        document.addEventListener('focusin', (e) => {
            if (e.target.classList.contains('touch-target')) {
                e.target.style.outline = '3px solid #3b82f6';
                e.target.style.outlineOffset = '2px';
            }
        });

        document.addEventListener('focusout', (e) => {
            if (e.target.classList.contains('touch-target')) {
                e.target.style.outline = '';
                e.target.style.outlineOffset = '';
            }
        });
    }

    initKeyboardHandling() {
        // Gérer l'apparition du clavier virtuel
        let initialViewportHeight = window.innerHeight;

        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;

            if (heightDifference > 150) {
                // Clavier probablement ouvert
                document.body.classList.add('keyboard-open');
                this.adjustLayoutForKeyboard(true);
            } else {
                // Clavier probablement fermé
                document.body.classList.remove('keyboard-open');
                this.adjustLayoutForKeyboard(false);
            }
        });
    }

    adjustLayoutForKeyboard(keyboardOpen) {
        const main = document.querySelector('main');
        if (keyboardOpen) {
            main.style.height = '50vh';
            main.style.overflow = 'auto';
        } else {
            main.style.height = '';
            main.style.overflow = '';
        }
    }

    preventZoom() {
        // Empêcher le zoom accidentel
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    // Méthodes utilitaires pour les actions spéciales
    addProductQuickly(productCard, quantity = 1) {
        // Déclencher l'ajout rapide de produit
        const event = new CustomEvent('quickAddProduct', {
            detail: { productCard, quantity }
        });
        document.dispatchEvent(event);
    }

    showProductDetails(productCard) {
        // Afficher les détails du produit
        const event = new CustomEvent('showProductDetails', {
            detail: { productCard }
        });
        document.dispatchEvent(event);
    }

    showQuantityEditor(quantityBtn) {
        // Afficher l'éditeur de quantité
        const event = new CustomEvent('showQuantityEditor', {
            detail: { quantityBtn }
        });
        document.dispatchEvent(event);
    }
}

// Initialiser l'interface tactile quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.touchInterface = new TouchInterface();
});

// Exporter pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TouchInterface;
}
