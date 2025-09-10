// src/js/i18n.js - MOTEUR DE TRADUCTION AVEC PRÉ-CHARGEMENT

let translations = {};
let currentLanguage = 'fr';
let isLoading = false;
let loadPromise = null;

// Cache des traductions pour éviter les rechargements
const translationCache = new Map();

/**
 * Pré-charge les traductions de manière synchrone si possible
 */
function preloadTranslations() {
    // Essayer de récupérer la langue depuis le localStorage en premier
    const savedLang = localStorage.getItem('app-language') || 'fr';
    currentLanguage = savedLang;

    // Appliquer immédiatement les styles de direction pour éviter le flash
    applyLanguageStyles(savedLang);

    // Charger les traductions en arrière-plan seulement si pas déjà en cours
    if (!loadPromise && !isLoading) {
        loadPromise = loadTranslationsAsync();
    }

    return loadPromise || Promise.resolve(translations);
}

/**
 * Applique les styles de langue immédiatement
 */
function applyLanguageStyles(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    if (lang === 'ar') {
        document.body.classList.add('rtl');
        document.documentElement.classList.add('rtl');
    } else {
        document.body.classList.remove('rtl');
        document.documentElement.classList.remove('rtl');
    }
}

/**
 * Charge les traductions de manière asynchrone
 */
async function loadTranslationsAsync() {
    if (isLoading) return loadPromise;

    isLoading = true;

    try {
        // Récupérer la langue depuis les paramètres
        const lang = (await window.api.settings.language.get()) || currentLanguage;

        // Mettre à jour la langue courante si différente
        if (lang !== currentLanguage) {
            currentLanguage = lang;
            localStorage.setItem('app-language', lang);
            applyLanguageStyles(lang);
        }

        // Vérifier le cache d'abord
        if (translationCache.has(lang)) {
            translations = translationCache.get(lang);
            isLoading = false;
            return translations;
        }

        // Charger les traductions depuis l'API
        const loadedTranslations = await window.api.i18n.getTranslation(lang);

        if (Object.keys(loadedTranslations).length === 0) {
            throw new Error(`Le fichier de traduction pour '${lang}' est vide ou n'a pas pu être chargé.`);
        }

        // Mettre en cache et utiliser
        translationCache.set(lang, loadedTranslations);
        translations = loadedTranslations;

    } catch (error) {
        console.error("Erreur de chargement des traductions:", error);

        // Fallback vers le français
        try {
            if (!translationCache.has('fr')) {
                const frTranslations = await window.api.i18n.getTranslation('fr');
                translationCache.set('fr', frTranslations);
            }
            translations = translationCache.get('fr');
            currentLanguage = 'fr';
            localStorage.setItem('app-language', 'fr');
            applyLanguageStyles('fr');
        } catch (fallbackError) {
            console.error("Erreur critique: Impossible de charger le fichier de traduction français par défaut.", fallbackError);
            translations = {};
        }
    }

    isLoading = false;
    return translations;
}

/**
 * Fonction de compatibilité avec l'ancien système
 */
async function loadTranslations() {
    return await loadTranslationsAsync();
}

function t(key) {
    return translations[key] || `[${key}]`; // On affiche la clé si la traduction manque
}

/**
 * Applique les traductions au HTML de manière optimisée
 */
function applyTranslationsToHTML() {
    // Utiliser un fragment pour éviter les reflows multiples
    const elementsToTranslate = document.querySelectorAll('[data-i18n]');

    // Traitement par batch pour améliorer les performances
    const batchSize = 50;
    let currentBatch = 0;

    function processBatch() {
        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, elementsToTranslate.length);

        for (let i = start; i < end; i++) {
            const element = elementsToTranslate[i];
            const key = element.dataset.i18n;
            const translation = t(key);

            // Gère les placeholders et le contenu textuel
            if (element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else {
                element.textContent = translation;
            }
        }

        currentBatch++;

        // Continuer avec le batch suivant si nécessaire
        if (end < elementsToTranslate.length) {
            requestAnimationFrame(processBatch);
        } else {
            // Traiter les titres après les éléments principaux
            processPageTitles();
        }
    }

    function processPageTitles() {
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.dataset.i18nTitle;
            element.title = t(key);
        });

        // Traiter le titre de la page
        const titleElement = document.querySelector('title[data-i18n]');
        if (titleElement) {
            const key = titleElement.dataset.i18n;
            titleElement.textContent = t(key);
        }
    }

    // Démarrer le traitement
    if (elementsToTranslate.length > 0) {
        processBatch();
    } else {
        processPageTitles();
    }
}

/**
 * Applique les traductions de manière instantanée (pour le pré-chargement)
 */
function applyTranslationsInstant() {
    // Vérifier si les traductions sont disponibles
    if (!translations || Object.keys(translations).length === 0) {
        console.warn('Traductions non disponibles pour application instantanée');
        return;
    }

    // Version simplifiée pour le pré-chargement - seulement les éléments non traduits
    const elementsToTranslate = document.querySelectorAll('[data-i18n]:not([data-translated])');

    elementsToTranslate.forEach(element => {
        const key = element.dataset.i18n;
        const translation = t(key);

        if (translation && translation !== `[${key}]`) {
            if (element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else {
                element.textContent = translation;
            }

            // Marquer comme traduit pour éviter les re-traductions
            element.setAttribute('data-translated', 'true');
        }
    });

    // Titres (seulement non traduits)
    document.querySelectorAll('[data-i18n-title]:not([data-translated])').forEach(element => {
        const key = element.dataset.i18nTitle;
        const translation = t(key);
        if (translation && translation !== `[${key}]`) {
            element.title = translation;
            element.setAttribute('data-translated', 'true');
        }
    });

    // Titre de la page
    const titleElement = document.querySelector('title[data-i18n]:not([data-translated])');
    if (titleElement) {
        const key = titleElement.dataset.i18n;
        const translation = t(key);
        if (translation && translation !== `[${key}]`) {
            titleElement.textContent = translation;
            titleElement.setAttribute('data-translated', 'true');
        }
    }
}

/**
 * Nettoie les attributs de traduction pour permettre une re-traduction
 */
function clearTranslationMarkers() {
    document.querySelectorAll('[data-translated]').forEach(element => {
        element.removeAttribute('data-translated');
    });
}

/**
 * Force une re-traduction complète de la page
 */
function forceRetranslate() {
    clearTranslationMarkers();
    applyTranslationsInstant();
}

// Initialiser le pré-chargement dès que le script est chargé
if (typeof window !== 'undefined') {
    // Pré-charger immédiatement si l'API est disponible
    if (window.api) {
        preloadTranslations();
    } else {
        // Attendre que l'API soit disponible
        document.addEventListener('DOMContentLoaded', () => {
            if (window.api) {
                preloadTranslations();
            }
        });
    }
}

window.i18n = {
    loadTranslations,
    loadTranslationsAsync,
    preloadTranslations,
    applyTranslationsToHTML,
    applyTranslationsInstant,
    applyLanguageStyles,
    clearTranslationMarkers,
    forceRetranslate,
    t,
    getCurrentLanguage: () => currentLanguage,
    isLoading: () => isLoading,
    clearCache: () => translationCache.clear(),
    getTranslations: () => translations
};