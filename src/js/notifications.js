// notifications.js - Système de notifications non-bloquantes global

/**
 * Affiche une notification non-bloquante
 * @param {string} message - Le message à afficher
 * @param {string} type - Le type de notification ('success', 'error', 'warning', 'info')
 * @param {number} duration - Durée d'affichage en millisecondes (défaut: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 max-w-sm ${getNotificationClasses(type)}`;
    
    // Contenu de la notification
    notification.innerHTML = `
        <div class="flex items-center">
            <div class="flex-shrink-0">
                ${getNotificationIcon(type)}
            </div>
            <div class="ml-3">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
                <button class="close-notification-btn inline-flex text-white hover:text-gray-200 focus:outline-none">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    `;

    // Ajouter l'event listener pour le bouton de fermeture
    const closeBtn = notification.querySelector('.close-notification-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
    }

    // Style initial pour l'animation
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';

    // Ajouter au DOM
    document.body.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);

    // Auto-suppression après la durée spécifiée
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);

    return notification;
}

/**
 * Retourne les classes CSS pour le type de notification
 * @param {string} type - Le type de notification
 * @returns {string} Les classes CSS
 */
function getNotificationClasses(type) {
    switch (type) {
        case 'success':
            return 'bg-green-500 text-white border-green-600';
        case 'error':
            return 'bg-red-500 text-white border-red-600';
        case 'warning':
            return 'bg-yellow-500 text-white border-yellow-600';
        case 'info':
        default:
            return 'bg-blue-500 text-white border-blue-600';
    }
}

/**
 * Retourne l'icône SVG pour le type de notification
 * @param {string} type - Le type de notification
 * @returns {string} L'icône SVG
 */
function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return `<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>`;
        case 'error':
            return `<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>`;
        case 'warning':
            return `<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>`;
        case 'info':
        default:
            return `<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>`;
    }
}

/**
 * Affiche une notification de succès
 * @param {string} message - Le message à afficher
 * @param {number} duration - Durée d'affichage (optionnel)
 */
function showSuccess(message, duration) {
    return showNotification(message, 'success', duration);
}

/**
 * Affiche une notification d'erreur
 * @param {string} message - Le message à afficher
 * @param {number} duration - Durée d'affichage (optionnel)
 */
function showError(message, duration) {
    return showNotification(message, 'error', duration);
}

/**
 * Affiche une notification d'avertissement
 * @param {string} message - Le message à afficher
 * @param {number} duration - Durée d'affichage (optionnel)
 */
function showWarning(message, duration) {
    return showNotification(message, 'warning', duration);
}

/**
 * Affiche une notification d'information
 * @param {string} message - Le message à afficher
 * @param {number} duration - Durée d'affichage (optionnel)
 */
function showInfo(message, duration) {
    return showNotification(message, 'info', duration);
}

/**
 * Supprime toutes les notifications actuellement affichées
 */
function clearAllNotifications() {
    const notifications = document.querySelectorAll('.fixed.top-4.right-4.z-50');
    notifications.forEach(notification => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    });
}

// Exposer les fonctions globalement
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.clearAllNotifications = clearAllNotifications;

// Compatibilité avec l'ancien système d'alertes
window.alert = function(message) {
    console.warn('alert() intercepté et remplacé par showNotification()');
    showNotification(message, 'info');
};
