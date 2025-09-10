// src/js/lang-preloader.js - Pré-chargement de la langue

// Pré-chargement immédiat de la langue depuis localStorage
(function() {
    const savedLang = localStorage.getItem('app-language') || 'fr';
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    if (savedLang === 'ar') {
        document.documentElement.classList.add('rtl');
    }
})();
