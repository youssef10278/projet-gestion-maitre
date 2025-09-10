/**
 * Script d'initialisation spécifique pour la page factures
 * S'assure que le menu de navigation est correctement chargé
 */

console.log('🚀 Initialisation de la page factures...');

// Fonction pour initialiser le menu de navigation
async function initializeInvoicesNavigation() {
    console.log('🔧 Initialisation du menu de navigation pour les factures...');
    
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
        try {
            // Vérifier si les fonctions de navigation sont disponibles
            if (window.buildNavigation && typeof window.buildNavigation === 'function') {
                console.log('✅ Fonction buildNavigation trouvée, construction du menu...');
                await window.buildNavigation('invoices');
                console.log('✅ Menu de navigation initialisé avec succès');
                return true;
            }
            
            if (window.rebuildMenu && typeof window.rebuildMenu === 'function') {
                console.log('✅ Fonction rebuildMenu trouvée, reconstruction du menu...');
                await window.rebuildMenu('invoices');
                console.log('✅ Menu reconstruit avec succès');
                return true;
            }
            
            console.warn(`⚠️ Tentative ${attempts + 1}/${maxAttempts}: Fonctions de navigation non disponibles`);
            attempts++;
            
            // Attendre un peu avant la prochaine tentative
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.error(`❌ Erreur tentative ${attempts + 1}:`, error);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    console.error('❌ Impossible d\'initialiser le menu après', maxAttempts, 'tentatives');
    return false;
}

// Fonction pour vérifier si le menu est visible
function checkMenuVisibility() {
    const navContainer = document.getElementById('main-nav');
    if (!navContainer) {
        console.warn('⚠️ Conteneur de navigation non trouvé');
        return false;
    }
    
    const hasContent = navContainer.innerHTML.trim().length > 0;
    console.log(`🔍 Menu visible: ${hasContent ? 'OUI' : 'NON'}`);
    
    if (!hasContent) {
        console.log('📝 Contenu du conteneur nav:', navContainer.innerHTML);
    }
    
    return hasContent;
}

// Fonction principale d'initialisation
async function initializeInvoicesPage() {
    console.log('🎯 Démarrage de l\'initialisation de la page factures...');
    
    try {
        // Attendre que le DOM soit complètement chargé
        if (document.readyState !== 'complete') {
            console.log('⏳ Attente du chargement complet du DOM...');
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            });
        }
        
        console.log('✅ DOM complètement chargé');
        
        // Vérifier si le menu est déjà visible
        if (checkMenuVisibility()) {
            console.log('✅ Menu déjà visible, pas besoin de l\'initialiser');
            return;
        }
        
        // Initialiser le menu de navigation
        const menuInitialized = await initializeInvoicesNavigation();
        
        if (menuInitialized) {
            // Vérifier à nouveau la visibilité
            setTimeout(() => {
                checkMenuVisibility();
            }, 100);
        }
        
        console.log('🎉 Initialisation de la page factures terminée');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la page factures:', error);
    }
}

// Démarrer l'initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeInvoicesPage);
} else {
    // Le DOM est déjà chargé
    initializeInvoicesPage();
}

// Exporter les fonctions pour usage externe si nécessaire
window.initializeInvoicesNavigation = initializeInvoicesNavigation;
window.checkMenuVisibility = checkMenuVisibility;
