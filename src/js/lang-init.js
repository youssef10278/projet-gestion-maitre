// lang-init.js - Initialisation immédiate de la langue
// Pré-chargement de la langue depuis localStorage pour éviter le flash

(function() {
    'use strict';
    
    // Pré-chargement immédiat de la langue depuis localStorage
    const savedLang = localStorage.getItem('app-language') || 'fr';
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    
    if (savedLang === 'ar') {
        document.documentElement.classList.add('rtl');
    }
    
    console.log('🌐 Langue initialisée:', savedLang);
})();
