// hamburger-menu.js - Composant menu hamburger pour navigation tactile
// Gestion du menu responsive sur petits écrans

class HamburgerMenu {
    constructor() {
        this.isOpen = false;
        this.breakpoint = 1440; // Point de rupture pour afficher le menu hamburger (écrans 15 pouces et moins)
        this.menuElement = null;
        this.hamburgerButton = null;
        this.overlay = null;
        this.sidebar = null;

        this.init();
    }

    init() {
        console.log('🍔 Initialisation du menu hamburger...');
        
        // Attendre que le DOM soit prêt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Créer les éléments du menu hamburger
        this.createHamburgerButton();
        this.createOverlay();
        this.setupSidebar();
        
        // Initialiser les événements
        this.initEventListeners();
        
        // Vérifier la taille d'écran initiale
        this.checkScreenSize();
        
        console.log('✅ Menu hamburger initialisé');
    }

    createHamburgerButton() {
        // Créer le bouton hamburger
        this.hamburgerButton = document.createElement('button');
        this.hamburgerButton.id = 'hamburger-menu-btn';
        this.hamburgerButton.className = 'hamburger-menu-btn touch-target touch-feedback';
        this.hamburgerButton.setAttribute('aria-label', 'Ouvrir le menu de navigation');
        this.hamburgerButton.setAttribute('aria-expanded', 'false');
        
        // Icône hamburger animée
        this.hamburgerButton.innerHTML = `
            <div class="hamburger-icon">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </div>
        `;
        
        // Ajouter au début du body
        document.body.insertBefore(this.hamburgerButton, document.body.firstChild);
    }

    createOverlay() {
        // Créer l'overlay pour fermer le menu en cliquant en dehors
        this.overlay = document.createElement('div');
        this.overlay.id = 'menu-overlay';
        this.overlay.className = 'menu-overlay hidden';
        this.overlay.setAttribute('aria-hidden', 'true');
        
        document.body.appendChild(this.overlay);
    }

    setupSidebar() {
        // Récupérer la sidebar existante
        this.sidebar = document.querySelector('aside');

        if (this.sidebar) {
            // Nettoyer complètement la sidebar des anciens éléments
            this.cleanupSidebar();

            // Ajouter les classes nécessaires
            this.sidebar.classList.add('responsive-sidebar');

            // Supprimer tous les anciens boutons de fermeture existants
            const existingCloseButtons = this.sidebar.querySelectorAll('.sidebar-close-btn');
            existingCloseButtons.forEach(btn => {
                console.log('🗑️ Suppression ancien bouton de fermeture');
                btn.remove();
            });

            // Vérifier si le header structuré existe déjà
            let sidebarHeader = this.sidebar.querySelector('.sidebar-header');

            if (!sidebarHeader) {
                // Créer le header structuré
                sidebarHeader = document.createElement('div');
                sidebarHeader.className = 'sidebar-header';

                // Créer le logo
                const sidebarLogo = document.createElement('div');
                sidebarLogo.className = 'sidebar-logo';

                const logoIcon = document.createElement('span');
                logoIcon.className = 'sidebar-logo-icon';
                logoIcon.innerHTML = '🏢';

                const logoText = document.createElement('span');
                logoText.className = 'sidebar-logo-text';
                logoText.textContent = 'GestionPro';

                sidebarLogo.appendChild(logoIcon);
                sidebarLogo.appendChild(logoText);

                // Créer le bouton de fermeture
                const closeButton = document.createElement('button');
                closeButton.className = 'sidebar-close-btn touch-target touch-feedback';
                closeButton.setAttribute('aria-label', 'Fermer le menu');
                closeButton.setAttribute('title', 'Fermer le menu');
                closeButton.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                `;

                // Assembler le header - Bouton X à gauche, Logo à droite
                sidebarHeader.appendChild(closeButton);
                sidebarHeader.appendChild(sidebarLogo);

                // Nettoyer et remplacer l'ancien header s'il existe
                const oldHeader = this.sidebar.querySelector('.p-4') || this.sidebar.firstElementChild;
                if (oldHeader && (oldHeader.classList.contains('p-4') || oldHeader.textContent.includes('GestionPro') || oldHeader.textContent.includes('Tableau'))) {
                    // Supprimer tout bouton de fermeture dans l'ancien header
                    const oldButtons = oldHeader.querySelectorAll('.sidebar-close-btn');
                    oldButtons.forEach(btn => btn.remove());

                    this.sidebar.replaceChild(sidebarHeader, oldHeader);
                    console.log('✅ Ancien header nettoyé et remplacé par header structuré');
                } else {
                    // Ajouter le header au début
                    this.sidebar.insertBefore(sidebarHeader, this.sidebar.firstChild);
                    console.log('✅ Header structuré ajouté au début');
                }

                // Stocker la référence du bouton
                this.closeButton = closeButton;

                // Événement de fermeture
                closeButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeMenu();
                    console.log('🔄 Menu fermé via bouton X dans header');
                });

                // Feedback tactile
                closeButton.addEventListener('touchstart', () => {
                    if (navigator.vibrate) {
                        navigator.vibrate(10);
                    }
                }, { passive: true });

            } else {
                console.log('ℹ️ Header structuré déjà existant');
                this.closeButton = sidebarHeader.querySelector('.sidebar-close-btn');
            }

        } else {
            console.warn('⚠️ Sidebar non trouvée pour setupSidebar');
        }
    }

    cleanupSidebar() {
        if (!this.sidebar) return;

        // Supprimer tous les boutons de fermeture existants
        const existingCloseButtons = this.sidebar.querySelectorAll('.sidebar-close-btn');
        existingCloseButtons.forEach((btn, index) => {
            console.log(`🗑️ Suppression bouton de fermeture ${index + 1}`);
            btn.remove();
        });

        // Supprimer les anciens headers structurés
        const existingHeaders = this.sidebar.querySelectorAll('.sidebar-header');
        existingHeaders.forEach((header, index) => {
            console.log(`🗑️ Suppression ancien header structuré ${index + 1}`);
            header.remove();
        });

        // Nettoyer les styles inline qui pourraient causer des conflits
        const elementsWithInlineStyles = this.sidebar.querySelectorAll('[style*="position"]');
        elementsWithInlineStyles.forEach(element => {
            if (element.style.position === 'relative') {
                element.style.position = '';
                console.log('🧹 Nettoyage style inline position');
            }
        });

        console.log('✅ Sidebar nettoyée complètement');
    }

    initEventListeners() {
        // Clic sur le bouton hamburger
        this.hamburgerButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        // Clic sur l'overlay pour fermer
        this.overlay.addEventListener('click', () => this.closeMenu());

        // Gestion du redimensionnement de fenêtre
        window.addEventListener('resize', () => this.handleResize());

        // Gestion des touches clavier
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Gestion du swipe pour ouvrir le menu (tactile)
        this.initSwipeGestures();

        // Fermer le menu lors de la navigation
        document.addEventListener('click', (e) => {
            if (this.isOpen && e.target.closest('nav a')) {
                this.closeMenu();
            }
        });
    }

    initSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let isSwipeGesture = false;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipeGesture = startX < 50; // Swipe depuis le bord gauche
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isSwipeGesture) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - startX;
            const deltaY = Math.abs(currentY - startY);

            // Swipe horizontal depuis le bord gauche
            if (deltaX > 50 && deltaY < 100 && !this.isOpen) {
                this.openMenu();
                isSwipeGesture = false;
            }
        }, { passive: true });
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        if (this.isOpen) return;

        this.isOpen = true;

        // Mettre à jour les classes et attributs
        this.hamburgerButton.classList.add('active');
        this.hamburgerButton.setAttribute('aria-expanded', 'true');

        this.overlay.classList.remove('hidden');
        this.overlay.setAttribute('aria-hidden', 'false');

        if (this.sidebar) {
            this.sidebar.classList.add('sidebar-open');

            // S'assurer que le bouton de fermeture est visible
            if (this.closeButton) {
                this.closeButton.style.display = 'flex';
                console.log('👁️ Bouton de fermeture forcé visible');
            }
        }

        document.body.classList.add('menu-open');

        // Focus sur le premier élément de navigation
        setTimeout(() => {
            const firstNavItem = this.sidebar?.querySelector('nav a');
            if (firstNavItem) {
                firstNavItem.focus();
            }
        }, 300);

        // Vibration tactile
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }

        console.log('📱 Menu ouvert');
    }

    closeMenu() {
        if (!this.isOpen) return;

        this.isOpen = false;
        
        // Mettre à jour les classes et attributs
        this.hamburgerButton.classList.remove('active');
        this.hamburgerButton.setAttribute('aria-expanded', 'false');
        
        this.overlay.classList.add('hidden');
        this.overlay.setAttribute('aria-hidden', 'true');
        
        if (this.sidebar) {
            this.sidebar.classList.remove('sidebar-open');
        }
        
        document.body.classList.remove('menu-open');
        
        // Remettre le focus sur le bouton hamburger
        this.hamburgerButton.focus();

        console.log('📱 Menu fermé');
    }

    handleResize() {
        // Debounce pour éviter trop d'appels
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.checkScreenSize();
        }, 250);
    }

    checkScreenSize() {
        const width = window.innerWidth;
        const isCompactScreen = width < this.breakpoint;

        // Détecter le type d'écran pour les logs
        let screenType = 'Large (>15")';
        if (width <= 768) {
            screenType = 'Mobile/Tablette';
        } else if (width <= 1024) {
            screenType = 'Tablette/Petit laptop';
        } else if (width <= 1440) {
            screenType = 'Laptop 15" ou moins';
        }

        if (isCompactScreen) {
            // Afficher le bouton hamburger avec animation
            this.hamburgerButton.classList.remove('hidden');
            if (this.sidebar) {
                this.sidebar.classList.add('sidebar-responsive');
            }

            // Ajouter une classe au body pour les styles conditionnels
            document.body.classList.add('hamburger-active');

            // Ajuster la position du bouton selon la taille d'écran
            this.adjustButtonPosition(width);

            console.log(`📱 Menu hamburger activé - ${screenType} (${width}px)`);
        } else {
            // Masquer le bouton hamburger et fermer le menu
            this.hamburgerButton.classList.add('hidden');
            if (this.sidebar) {
                this.sidebar.classList.remove('sidebar-responsive');
            }

            // Retirer la classe du body
            document.body.classList.remove('hamburger-active');

            this.closeMenu();
            console.log(`🖥️ Menu hamburger désactivé - ${screenType} (${width}px)`);
        }
    }

    adjustButtonPosition(width) {
        // Ajuster la position du bouton selon la taille d'écran
        if (width <= 768) {
            // Smartphones
            this.hamburgerButton.style.top = '15px';
            this.hamburgerButton.style.left = '12px';
        } else if (width <= 1024) {
            // Tablettes
            this.hamburgerButton.style.top = '20px';
            this.hamburgerButton.style.left = '16px';
        } else {
            // Laptops 15"
            this.hamburgerButton.style.top = '30px';
            this.hamburgerButton.style.left = '24px';
        }
    }

    handleKeydown(e) {
        if (!this.isOpen) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.closeMenu();
                break;
                
            case 'Tab':
                // Gérer la navigation au clavier dans le menu
                this.handleTabNavigation(e);
                break;
        }
    }

    handleTabNavigation(e) {
        if (!this.sidebar) return;

        const focusableElements = this.sidebar.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab (navigation arrière)
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab (navigation avant)
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    // Méthodes publiques pour contrôle externe
    show() {
        this.hamburgerButton.classList.remove('hidden');
    }

    hide() {
        this.hamburgerButton.classList.add('hidden');
        this.closeMenu();
    }

    setBreakpoint(width) {
        this.breakpoint = width;
        this.checkScreenSize();
    }

    destroy() {
        // Nettoyer les événements et éléments
        if (this.hamburgerButton) {
            this.hamburgerButton.remove();
        }
        if (this.overlay) {
            this.overlay.remove();
        }
        
        document.body.classList.remove('menu-open');
        
        if (this.sidebar) {
            this.sidebar.classList.remove('responsive-sidebar', 'sidebar-responsive', 'sidebar-open');
        }
        
        console.log('🗑️ Menu hamburger détruit');
    }
}

// Auto-initialisation
let hamburgerMenuInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    hamburgerMenuInstance = new HamburgerMenu();
    
    // Exposer l'instance globalement pour contrôle externe
    window.hamburgerMenu = hamburgerMenuInstance;
});

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HamburgerMenu;
}
