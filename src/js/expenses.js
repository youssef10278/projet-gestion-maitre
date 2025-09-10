/**
 * Gestion des Dépenses - JavaScript Principal
 * Version 1.0 - MVP
 */

// Variables globales
let currentExpenses = [];
let recurringExpenses = [];
let expenseCategories = [];
let currentBudget = 0; // Budget mensuel (sera chargé depuis les paramètres)

/**
 * Initialisation de la page dépenses
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('💰 Initialisation de la page dépenses...');

    try {
        // Attendre un peu pour s'assurer que tous les scripts sont chargés
        await new Promise(resolve => setTimeout(resolve, 100));

        // Initialiser le menu de navigation (identique au dashboard)
        if (typeof window.initializePage === 'function') {
            await window.initializePage('expenses');
            console.log('✅ Menu de navigation initialisé via initializePage');
        } else if (typeof window.buildNavigation === 'function') {
            await window.buildNavigation('expenses');
            console.log('✅ Menu de navigation construit via buildNavigation');
        } else {
            console.warn('⚠️ Fonctions de menu non disponibles, tentative de fallback...');
            // Fallback : attendre que layout.js soit chargé
            setTimeout(async () => {
                if (typeof window.buildNavigation === 'function') {
                    await window.buildNavigation('expenses');
                    console.log('✅ Menu de navigation construit (fallback)');
                } else {
                    console.error('❌ Impossible de construire le menu de navigation');
                }
            }, 1000);
        }

        // Vérifier que le menu hamburger est initialisé
        setTimeout(() => {
            if (window.hamburgerMenu) {
                console.log('✅ Menu hamburger disponible');
            } else {
                console.warn('⚠️ Menu hamburger non disponible');
            }
        }, 500);

        // Attendre que tous les éléments soient rendus
        setTimeout(() => {
            // Initialiser les événements
            initializeEvents();

            // Charger les données initiales
            loadInitialData();

            // Charger les traductions
            if (typeof loadTranslations === 'function') {
                loadTranslations();
            }

            // Configurer le rafraîchissement automatique du dashboard
            setupDashboardRefresh();

            console.log('✅ Page dépenses initialisée');

            // Diagnostic final
            diagnoseDOMElements();

            // Vérifier les fonctions globales
            verifyGlobalFunctions();
        }, 200); // Délai augmenté pour s'assurer que le menu est construit

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la page dépenses:', error);

        // Fallback d'urgence pour le menu
        setTimeout(async () => {
            try {
                if (typeof window.buildNavigation === 'function') {
                    await window.buildNavigation('expenses');
                    console.log('✅ Menu de navigation construit (fallback d\'urgence)');
                }
            } catch (fallbackError) {
                console.error('❌ Échec du fallback menu:', fallbackError);
            }
        }, 1000);
    }
});

/**
 * Diagnostic des éléments DOM
 */
function diagnoseDOMElements() {
    setTimeout(() => {
        console.log('🔍 DIAGNOSTIC DOM:');

        const elements = [
            'refreshDashboardBtn',
            'addExpenseBtn',
            'recurringBtn',
            'totalMonthAmount',
            'budgetRemaining'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                console.log(`✅ ${id}: TROUVÉ`);
            } else {
                console.error(`❌ ${id}: NON TROUVÉ`);
            }
        });

        // Test spécifique du bouton refresh
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) {
            console.log('🔄 Test du bouton refresh:');
            console.log('  - Texte:', refreshBtn.textContent.trim());
            console.log('  - Classes:', refreshBtn.className);
            console.log('  - Parent:', refreshBtn.parentElement?.tagName);
            console.log('  - Event listeners:', typeof getEventListeners !== 'undefined' ? getEventListeners(refreshBtn) : 'Non disponible (DevTools uniquement)');
        }
    }, 300);
}

/**
 * Initialise tous les événements de la page
 */
function initializeEvents() {
    console.log('🎯 Initialisation des événements...');

    // Bouton retour principal supprimé (navigation via menu latéral)

    // Boutons d'action principaux
    addEventListenerSafe('addExpenseBtn', 'click', showAddExpenseModal);
    addEventListenerSafe('recurringBtn', 'click', showRecurringExpensesModal);
    addEventListenerSafe('refreshDashboardBtn', 'click', refreshDashboard);
    addEventListenerSafe('clearTestDataBtn', 'click', clearTestDataManually);
    addEventListenerSafe('editBudgetBtn', 'click', showEditBudgetModal);

    // Filtres
    addEventListenerSafe('filterCategory', 'change', filterExpenses);
    addEventListenerSafe('filterDate', 'change', filterExpenses);

    // Note: Délégation d'événements supprimée - on utilise onclick directement

    // Modal de modification du budget
    addEventListenerSafe('closeBudgetModal', 'click', hideEditBudgetModal);
    addEventListenerSafe('cancelBudgetEdit', 'click', hideEditBudgetModal);
    addEventListenerSafe('editBudgetForm', 'submit', handleBudgetUpdate);
    addEventListenerSafe('monthlyBudgetInput', 'input', updateBudgetSimulation);

    // Test spécifique pour le bouton actualiser
    testRefreshButton();

    console.log('✅ Événements initialisés');
}

/**
 * Test spécifique pour le bouton actualiser
 */
function testRefreshButton() {
    setTimeout(() => {
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) {
            console.log('✅ Bouton actualiser trouvé dans le DOM');
            console.log('📍 Position:', refreshBtn.getBoundingClientRect());
            console.log('👁️ Visible:', refreshBtn.offsetParent !== null);
            console.log('🎯 Classes:', refreshBtn.className);

            // Ajouter un event listener de test
            refreshBtn.addEventListener('click', function(e) {
                console.log('🔄 CLIC DÉTECTÉ sur le bouton actualiser !');
                e.preventDefault();
                e.stopPropagation();
                refreshDashboard();
            });

            // Ajouter des styles visuels pour confirmer que le bouton est actif
            refreshBtn.style.border = '2px solid #10b981';
            refreshBtn.style.transition = 'all 0.2s';

            refreshBtn.addEventListener('mouseenter', () => {
                refreshBtn.style.transform = 'scale(1.05)';
                console.log('🖱️ Survol du bouton actualiser');
            });

            refreshBtn.addEventListener('mouseleave', () => {
                refreshBtn.style.transform = 'scale(1)';
            });

        } else {
            console.error('❌ Bouton actualiser NON TROUVÉ dans le DOM');
            console.log('🔍 Éléments disponibles avec "refresh":',
                Array.from(document.querySelectorAll('[id*="refresh"]')).map(el => el.id));
        }
    }, 200);
}

/**
 * Fonction utilitaire pour ajouter des événements de manière sécurisée
 */
function addEventListenerSafe(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(event, handler);
        console.log(`✅ Événement ${event} ajouté à ${elementId}`);

        // Test immédiat pour le bouton refresh
        if (elementId === 'refreshDashboardBtn') {
            console.log('🔄 Test du bouton actualiser configuré');
            element.style.cursor = 'pointer';
            element.title = 'Cliquez pour actualiser le dashboard';
        }
    } else {
        console.error(`❌ Élément ${elementId} non trouvé dans le DOM`);

        // Essayer de le trouver avec un délai
        setTimeout(() => {
            const retryElement = document.getElementById(elementId);
            if (retryElement) {
                retryElement.addEventListener(event, handler);
                console.log(`✅ Événement ${event} ajouté à ${elementId} (après délai)`);

                if (elementId === 'refreshDashboardBtn') {
                    console.log('🔄 Test du bouton actualiser configuré (après délai)');
                    retryElement.style.cursor = 'pointer';
                    retryElement.title = 'Cliquez pour actualiser le dashboard';
                }
            } else {
                console.error(`❌ Élément ${elementId} toujours non trouvé après délai`);
            }
        }, 500);
    }
}

/**
 * Fonction goBack supprimée - Navigation via menu latéral
 */

/**
 * Charge les données initiales
 */
async function loadInitialData() {
    try {
        console.log('📊 Chargement des données initiales...');

        // Vérifier et nettoyer les données de test si nécessaire
        await checkAndClearTestData();

        // Charger le budget mensuel depuis les paramètres
        await loadBudgetSettings();

        // Charger les catégories depuis l'API
        await loadCategories();

        // Charger les dépenses existantes
        await loadExpenses();

        // Charger les dépenses récurrentes
        await loadRecurringExpenses();

        // Mettre à jour le dashboard
        updateDashboard();

        // Afficher les dépenses
        displayExpenses();

        console.log('✅ Données initiales chargées');

    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

/**
 * Vérifie et nettoie les données de test automatiquement
 */
async function checkAndClearTestData() {
    try {
        if (window.api && window.api.expenses) {
            const hasTestData = await window.api.expenses.hasTestData();

            if (hasTestData) {
                console.log('🧹 Données de test détectées, nettoyage automatique...');

                const result = await window.api.expenses.clearTestData();

                if (result.success) {
                    console.log(`✅ Nettoyage terminé: ${result.expensesDeleted} dépenses et ${result.recurringDeleted} récurrentes supprimées`);
                    showNotification('Données de test supprimées automatiquement', 'success');
                } else {
                    console.warn('⚠️ Échec du nettoyage automatique');
                }
            } else {
                console.log('✅ Aucune donnée de test détectée');
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des données de test:', error);
        // Ne pas bloquer le chargement pour cette erreur
    }
}

/**
 * Charge les paramètres de budget
 */
async function loadBudgetSettings() {
    try {
        if (window.api && window.api.expenses) {
            const settings = await window.api.expenses.getBudgetSettings();
            currentBudget = settings.monthlyBudget || 0;
            console.log(`💰 Budget mensuel chargé: ${currentBudget.toFixed(2)} MAD`);
        } else {
            // Fallback : essayer de charger depuis localStorage
            const savedBudget = localStorage.getItem('monthlyBudget');
            currentBudget = savedBudget ? parseFloat(savedBudget) : 0;
            console.log(`💰 Budget depuis localStorage: ${currentBudget.toFixed(2)} MAD`);
        }

        // Si aucun budget configuré, utiliser une valeur par défaut
        if (currentBudget === 0) {
            currentBudget = 10000; // Budget par défaut de 10,000 MAD
            console.log(`💰 Budget par défaut utilisé: ${currentBudget.toFixed(2)} MAD`);
        }

    } catch (error) {
        console.error('❌ Erreur lors du chargement du budget:', error);
        currentBudget = 10000; // Fallback
        console.log(`💰 Budget fallback: ${currentBudget.toFixed(2)} MAD`);
    }
}

/**
 * Charge les catégories depuis l'API
 */
async function loadCategories() {
    try {
        if (window.api && window.api.expenses) {
            expenseCategories = await window.api.expenses.getCategories();
            console.log(`✅ ${expenseCategories.length} catégorie(s) chargée(s)`);
        } else {
            // Fallback vers les catégories par défaut
            expenseCategories = [
                { id: 'fixed', name: 'Charges fixes', color: 'blue', icon: '🏢' },
                { id: 'variable', name: 'Charges variables', color: 'green', icon: '📊' },
                { id: 'exceptional', name: 'Exceptionnelles', color: 'yellow', icon: '⚡' }
            ];
            console.log('✅ Catégories par défaut utilisées');
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des catégories:', error);
        expenseCategories = [
            { id: 'fixed', name: 'Charges fixes', color: 'blue', icon: '🏢' },
            { id: 'variable', name: 'Charges variables', color: 'green', icon: '📊' },
            { id: 'exceptional', name: 'Exceptionnelles', color: 'yellow', icon: '⚡' }
        ];
    }
}

/**
 * Charge les dépenses depuis l'API
 */
async function loadExpenses() {
    try {
        if (window.api && window.api.expenses) {
            currentExpenses = await window.api.expenses.getAll();
            console.log(`✅ ${currentExpenses.length} dépense(s) chargée(s) depuis l'API`);
        } else {
            console.warn('⚠️ API dépenses non disponible, utilisation de données de test');
            currentExpenses = [
                {
                    id: 1,
                    date: '2025-01-20',
                    description: 'Loyer du magasin',
                    category: 'fixed',
                    amount: 3500,
                    status: 'paid',
                    recurring_id: 1
                },
                {
                    id: 2,
                    date: '2025-01-19',
                    description: 'Facture électricité',
                    category: 'fixed',
                    amount: 450,
                    status: 'paid',
                    recurring_id: null
                },
                {
                    id: 3,
                    date: '2025-01-18',
                    description: 'Achat fournitures bureau',
                    category: 'variable',
                    amount: 120,
                    status: 'pending',
                    recurring_id: null
                }
            ];
            console.log(`✅ ${currentExpenses.length} dépense(s) de test chargée(s)`);
        }

    } catch (error) {
        console.error('❌ Erreur lors du chargement des dépenses:', error);
        currentExpenses = [];
        showNotification('Erreur lors du chargement des dépenses', 'error');
    }
}

/**
 * Charge les dépenses récurrentes
 */
async function loadRecurringExpenses() {
    try {
        if (window.api && window.api.expenses) {
            recurringExpenses = await window.api.expenses.getRecurring();
            console.log(`✅ ${recurringExpenses.length} dépense(s) récurrente(s) chargée(s) depuis l'API`);
        } else {
            console.warn('⚠️ API dépenses non disponible, utilisation de données de test');
            recurringExpenses = [
                {
                    id: 1,
                    name: 'Loyer magasin',
                    amount: 3500,
                    category: 'fixed',
                    frequency: 'monthly',
                    next_date: '2025-02-01',
                    active: 1
                },
                {
                    id: 2,
                    name: 'Assurance locale',
                    amount: 800,
                    category: 'fixed',
                    frequency: 'monthly',
                    next_date: '2025-01-25',
                    active: 1
                }
            ];
            console.log(`✅ ${recurringExpenses.length} dépense(s) récurrente(s) de test chargée(s)`);
        }

    } catch (error) {
        console.error('❌ Erreur lors du chargement des dépenses récurrentes:', error);
        recurringExpenses = [];
        showNotification('Erreur lors du chargement des dépenses récurrentes', 'error');
    }
}

/**
 * Met à jour le dashboard avec les statistiques
 */
async function updateDashboard() {
    try {
        console.log('📊 Mise à jour du dashboard...');

        // Obtenir les statistiques depuis l'API si disponible
        let stats = null;
        if (window.api && window.api.expenses) {
            try {
                stats = await window.api.expenses.getStats('month');
                console.log('📈 Statistiques API récupérées:', stats);
            } catch (error) {
                console.warn('⚠️ Erreur API stats, calcul local:', error);
            }
        }

        // Calcul local si pas d'API ou erreur
        if (!stats) {
            stats = calculateLocalStats();
        }

        // Calculer le budget restant
        const totalMonth = stats.total?.total || 0;
        const budgetRemaining = Math.max(0, currentBudget - totalMonth);
        const pendingCount = stats.pending?.count || 0;
        const recurringCount = recurringExpenses.filter(recurring => recurring.active || recurring.active === 1).length;

        // Mettre à jour l'affichage avec animation
        updateElementTextWithAnimation('totalMonthAmount', `${totalMonth.toFixed(2)} MAD`);
        updateElementTextWithAnimation('budgetRemaining', `${budgetRemaining.toFixed(2)} MAD`);
        updateElementTextWithAnimation('pendingCount', pendingCount.toString());
        updateElementTextWithAnimation('recurringCount', recurringCount.toString());

        // Mettre à jour l'affichage du budget total
        updateElementTextWithAnimation('currentBudgetDisplay', `/ ${currentBudget.toFixed(2)} MAD`);

        // Mettre à jour les couleurs selon les seuils
        updateBudgetColors(budgetRemaining, currentBudget);

        // Mettre à jour les prochaines échéances
        await updateUpcomingExpenses();

        console.log('✅ Dashboard mis à jour avec succès');
        console.log(`💰 Total mois: ${totalMonth.toFixed(2)} MAD`);
        console.log(`💳 Budget restant: ${budgetRemaining.toFixed(2)} MAD`);
        console.log(`⏳ En attente: ${pendingCount}`);
        console.log(`🔄 Récurrentes: ${recurringCount}`);

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du dashboard:', error);
        showNotification('Erreur lors de la mise à jour du dashboard', 'error');
    }
}

/**
 * Calcule les statistiques localement
 */
function calculateLocalStats() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = currentExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth &&
               expenseDate.getFullYear() === currentYear;
    });

    const totalMonth = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const pendingExpenses = currentExpenses.filter(expense => expense.status === 'pending');
    const pendingCount = pendingExpenses.length;

    return {
        total: { total: totalMonth },
        pending: { count: pendingCount }
    };
}

/**
 * Met à jour un élément avec animation
 */
function updateElementTextWithAnimation(elementId, newText) {
    const element = document.getElementById(elementId);
    if (element && element.textContent !== newText) {
        // Animation de changement
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.2s ease';

        setTimeout(() => {
            element.textContent = newText;
            element.style.transform = 'scale(1)';
        }, 100);
    }
}

/**
 * Met à jour les couleurs selon les seuils budgétaires
 */
function updateBudgetColors(budgetRemaining, totalBudget) {
    const budgetElement = document.getElementById('budgetRemaining');
    if (!budgetElement) return;

    const percentage = (budgetRemaining / totalBudget) * 100;

    // Supprimer les anciennes classes
    budgetElement.classList.remove('text-red-600', 'text-yellow-600', 'text-green-600');

    if (percentage < 10) {
        budgetElement.classList.add('text-red-600');
        budgetElement.parentElement.classList.add('animate-pulse');
    } else if (percentage < 25) {
        budgetElement.classList.add('text-yellow-600');
        budgetElement.parentElement.classList.remove('animate-pulse');
    } else {
        budgetElement.classList.add('text-green-600');
        budgetElement.parentElement.classList.remove('animate-pulse');
    }
}

/**
 * Met à jour les prochaines échéances
 */
async function updateUpcomingExpenses() {
    const upcomingContainer = document.getElementById('upcomingExpenses');
    if (!upcomingContainer) return;

    try {
        let upcoming = [];

        // Essayer d'obtenir les échéances depuis l'API
        if (window.api && window.api.expenses) {
            try {
                upcoming = await window.api.expenses.getUpcoming(7);
                console.log(`📅 ${upcoming.length} échéance(s) récupérée(s) depuis l'API`);
            } catch (error) {
                console.warn('⚠️ Erreur API upcoming, calcul local:', error);
            }
        }

        // Calcul local si pas d'API
        if (upcoming.length === 0) {
            upcoming = calculateLocalUpcoming();
        }

        if (upcoming.length === 0) {
            upcomingContainer.innerHTML = `
                <div class="flex items-center text-yellow-700 dark:text-yellow-300">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Aucune échéance dans les 7 prochains jours
                </div>
            `;
            return;
        }

        const upcomingHTML = upcoming.map(recurring => {
            const nextDate = new Date(recurring.next_date);
            const today = new Date();
            const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

            // Déterminer la couleur selon l'urgence
            let urgencyClass = 'text-yellow-600';
            let urgencyIcon = '⏰';

            if (daysUntil <= 1) {
                urgencyClass = 'text-red-600';
                urgencyIcon = '🚨';
            } else if (daysUntil <= 3) {
                urgencyClass = 'text-orange-600';
                urgencyIcon = '⚠️';
            }

            const dayText = daysUntil === 0 ? 'aujourd\'hui' :
                           daysUntil === 1 ? 'demain' :
                           `dans ${daysUntil} jour(s)`;

            return `
                <div class="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-700 rounded-lg mb-2 border-l-4 border-yellow-400">
                    <div class="flex items-center">
                        <span class="text-lg mr-2">${urgencyIcon}</span>
                        <div>
                            <span class="font-medium text-yellow-800 dark:text-yellow-200">
                                ${recurring.name}
                            </span>
                            <div class="text-sm text-gray-600 dark:text-gray-400">
                                ${recurring.amount.toFixed(2)} MAD
                            </div>
                        </div>
                    </div>
                    <span class="text-sm font-medium ${urgencyClass}">
                        ${dayText}
                    </span>
                </div>
            `;
        }).join('');

        upcomingContainer.innerHTML = upcomingHTML;

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des échéances:', error);
        upcomingContainer.innerHTML = `
            <div class="text-red-600 dark:text-red-400">
                Erreur lors du chargement des échéances
            </div>
        `;
    }
}

/**
 * Calcule les échéances localement
 */
function calculateLocalUpcoming() {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return recurringExpenses.filter(recurring => {
        if (!recurring.active && recurring.active !== 1) return false;
        const nextDate = new Date(recurring.next_date);
        return nextDate >= today && nextDate <= nextWeek;
    }).sort((a, b) => new Date(a.next_date) - new Date(b.next_date));
}

/**
 * Configure le rafraîchissement automatique du dashboard
 */
function setupDashboardRefresh() {
    // Rafraîchir le dashboard toutes les 30 secondes
    setInterval(async () => {
        try {
            console.log('🔄 Rafraîchissement automatique du dashboard...');
            await updateDashboard();
        } catch (error) {
            console.error('❌ Erreur lors du rafraîchissement automatique:', error);
        }
    }, 30000); // 30 secondes

    // Rafraîchir aussi quand la page devient visible
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            console.log('👁️ Page visible, rafraîchissement du dashboard...');
            try {
                await loadExpenses();
                await loadRecurringExpenses();
                await updateDashboard();
                displayExpenses();
            } catch (error) {
                console.error('❌ Erreur lors du rafraîchissement de visibilité:', error);
            }
        }
    });

    console.log('✅ Rafraîchissement automatique configuré');
}

/**
 * Force le rafraîchissement complet du dashboard
 */
async function refreshDashboard() {
    try {
        console.log('🔄 Rafraîchissement manuel du dashboard...');
        showNotification('Mise à jour en cours...', 'info');

        await loadExpenses();
        await loadRecurringExpenses();
        await updateDashboard();
        displayExpenses();

        showNotification('Dashboard mis à jour', 'success');
        console.log('✅ Rafraîchissement manuel terminé');

    } catch (error) {
        console.error('❌ Erreur lors du rafraîchissement manuel:', error);
        showNotification('Erreur lors de la mise à jour', 'error');
    }
}

/**
 * Nettoie manuellement les données de test
 */
async function clearTestDataManually() {
    try {
        console.log('🧹 Nettoyage manuel des données de test...');

        // Demander confirmation
        if (!confirm('Êtes-vous sûr de vouloir supprimer TOUTES les dépenses et dépenses récurrentes ?\n\nCette action est irréversible !')) {
            return;
        }

        showNotification('Nettoyage en cours...', 'info');

        if (window.api && window.api.expenses) {
            const result = await window.api.expenses.clearTestData();

            if (result.success) {
                console.log(`✅ Nettoyage manuel terminé: ${result.expensesDeleted} dépenses et ${result.recurringDeleted} récurrentes supprimées`);

                // Recharger les données
                await loadExpenses();
                await loadRecurringExpenses();
                await updateDashboard();
                displayExpenses();

                showNotification(`Nettoyage terminé: ${result.expensesDeleted + result.recurringDeleted} éléments supprimés`, 'success');
            } else {
                showNotification('Erreur lors du nettoyage', 'error');
            }
        } else {
            showNotification('API non disponible pour le nettoyage', 'error');
        }

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage manuel:', error);
        showNotification('Erreur lors du nettoyage: ' + error.message, 'error');
    }
}

/**
 * Affiche le modal de modification du budget
 */
async function showEditBudgetModal() {
    try {
        console.log('💰 Ouverture du modal de modification du budget...');

        const modal = document.getElementById('editBudgetModal');
        const monthlyBudgetInput = document.getElementById('monthlyBudgetInput');

        if (!modal || !monthlyBudgetInput) {
            console.error('❌ Éléments du modal non trouvés');
            showNotification('Erreur d\'interface', 'error');
            return;
        }

        // Charger les données actuelles
        await loadCurrentBudgetInfo();

        // Pré-remplir le champ avec le budget actuel
        monthlyBudgetInput.value = currentBudget.toFixed(2);

        // Afficher le modal
        modal.classList.remove('hidden');
        monthlyBudgetInput.focus();

        console.log('✅ Modal de budget ouvert');

    } catch (error) {
        console.error('❌ Erreur lors de l\'ouverture du modal de budget:', error);
        showNotification('Erreur lors de l\'ouverture du modal', 'error');
    }
}

/**
 * Cache le modal de modification du budget
 */
function hideEditBudgetModal() {
    try {
        const modal = document.getElementById('editBudgetModal');
        const simulationDiv = document.getElementById('budgetSimulation');

        if (modal) {
            modal.classList.add('hidden');
        }

        if (simulationDiv) {
            simulationDiv.classList.add('hidden');
        }

        // Réinitialiser le formulaire
        const form = document.getElementById('editBudgetForm');
        if (form) {
            form.reset();
        }

        console.log('✅ Modal de budget fermé');

    } catch (error) {
        console.error('❌ Erreur lors de la fermeture du modal:', error);
    }
}

/**
 * Charge les informations actuelles du budget
 */
async function loadCurrentBudgetInfo() {
    try {
        // Calculer les dépenses du mois actuel
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        let totalSpent = 0;
        if (window.api && window.api.expenses) {
            try {
                const stats = await window.api.expenses.getStats('month');
                totalSpent = stats.total?.total || 0;
            } catch (error) {
                console.warn('⚠️ Erreur API stats, calcul local:', error);
                totalSpent = calculateLocalStats().total?.total || 0;
            }
        } else {
            totalSpent = calculateLocalStats().total?.total || 0;
        }

        const budgetRemaining = Math.max(0, currentBudget - totalSpent);

        // Mettre à jour l'affichage des informations actuelles
        updateElementText('currentBudgetInfo', `${currentBudget.toFixed(2)} MAD`);
        updateElementText('currentSpentInfo', `${totalSpent.toFixed(2)} MAD`);
        updateElementText('currentRemainingInfo', `${budgetRemaining.toFixed(2)} MAD`);

        console.log(`💰 Infos budget chargées: Budget=${currentBudget}, Dépensé=${totalSpent}, Restant=${budgetRemaining}`);

    } catch (error) {
        console.error('❌ Erreur lors du chargement des infos budget:', error);
    }
}

/**
 * Met à jour la simulation du nouveau budget
 */
function updateBudgetSimulation() {
    try {
        const monthlyBudgetInput = document.getElementById('monthlyBudgetInput');
        const simulationDiv = document.getElementById('budgetSimulation');

        if (!monthlyBudgetInput || !simulationDiv) return;

        const newBudget = parseFloat(monthlyBudgetInput.value) || 0;

        if (newBudget <= 0) {
            simulationDiv.classList.add('hidden');
            return;
        }

        // Calculer les nouvelles valeurs
        const currentSpentText = document.getElementById('currentSpentInfo')?.textContent || '0 MAD';
        const currentSpent = parseFloat(currentSpentText.replace(' MAD', '')) || 0;

        const newRemaining = Math.max(0, newBudget - currentSpent);
        const currentRemaining = Math.max(0, currentBudget - currentSpent);
        const difference = newRemaining - currentRemaining;

        // Mettre à jour l'affichage de la simulation
        updateElementText('newBudgetInfo', `${newBudget.toFixed(2)} MAD`);
        updateElementText('newRemainingInfo', `${newRemaining.toFixed(2)} MAD`);

        const differenceElement = document.getElementById('budgetDifferenceInfo');
        if (differenceElement) {
            const sign = difference >= 0 ? '+' : '';
            differenceElement.textContent = `${sign}${difference.toFixed(2)} MAD`;

            // Couleur selon la différence avec classes améliorées
            differenceElement.classList.remove('text-green-600', 'text-red-600', 'text-gray-600', 'text-green-700', 'text-red-700', 'text-yellow-700');
            if (difference > 0) {
                differenceElement.classList.add('text-green-700', 'dark:text-green-400');
            } else if (difference < 0) {
                differenceElement.classList.add('text-red-700', 'dark:text-red-400');
            } else {
                differenceElement.classList.add('text-yellow-700', 'dark:text-yellow-400');
            }

            // Animation de pulsation pour attirer l'attention
            differenceElement.style.animation = 'none';
            setTimeout(() => {
                differenceElement.style.animation = 'pulse 0.5s ease-in-out';
            }, 10);
        }

        // Afficher la simulation avec animation fluide
        simulationDiv.classList.remove('hidden');

        // Animation d'apparition si c'est la première fois
        if (simulationDiv.style.opacity === '' || simulationDiv.style.opacity === '0') {
            simulationDiv.style.opacity = '0';
            simulationDiv.style.transform = 'translateY(10px)';
            setTimeout(() => {
                simulationDiv.style.transition = 'all 0.3s ease-out';
                simulationDiv.style.opacity = '1';
                simulationDiv.style.transform = 'translateY(0)';
            }, 50);
        }

    } catch (error) {
        console.error('❌ Erreur lors de la simulation du budget:', error);
    }
}

/**
 * Gère la mise à jour du budget
 */
async function handleBudgetUpdate(event) {
    event.preventDefault();

    try {
        console.log('💰 Mise à jour du budget...');

        const monthlyBudgetInput = document.getElementById('monthlyBudgetInput');
        if (!monthlyBudgetInput) {
            throw new Error('Champ budget non trouvé');
        }

        const newBudget = parseFloat(monthlyBudgetInput.value);

        if (isNaN(newBudget) || newBudget < 0) {
            showNotification('Veuillez entrer un budget valide', 'error');
            return;
        }

        if (newBudget === currentBudget) {
            showNotification('Le budget n\'a pas changé', 'info');
            hideEditBudgetModal();
            return;
        }

        showNotification('Mise à jour du budget...', 'info');

        // Sauvegarder via l'API
        if (window.api && window.api.expenses) {
            const settings = {
                monthlyBudget: newBudget,
                yearlyBudget: newBudget * 12,
                currency: 'MAD'
            };

            const result = await window.api.expenses.setBudgetSettings(settings);

            if (result.success) {
                // Mettre à jour la variable globale
                currentBudget = newBudget;

                // Sauvegarder aussi en localStorage pour la cohérence
                localStorage.setItem('monthlyBudget', newBudget.toString());

                // Fermer le modal
                hideEditBudgetModal();

                // Recharger le dashboard
                await updateDashboard();

                showNotification(`Budget mis à jour: ${newBudget.toFixed(2)} MAD/mois`, 'success');
                console.log(`✅ Budget mis à jour: ${currentBudget} MAD`);

            } else {
                throw new Error('Échec de la sauvegarde');
            }
        } else {
            // Fallback : sauvegarder en localStorage
            currentBudget = newBudget;
            localStorage.setItem('monthlyBudget', newBudget.toString());

            hideEditBudgetModal();
            await updateDashboard();

            showNotification(`Budget mis à jour: ${newBudget.toFixed(2)} MAD/mois (localStorage)`, 'success');
            console.log(`✅ Budget mis à jour (localStorage): ${currentBudget} MAD`);
        }

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du budget:', error);
        showNotification('Erreur lors de la mise à jour: ' + error.message, 'error');
    }
}

/**
 * Affiche les dépenses dans le tableau
 */
function displayExpenses() {
    const tableBody = document.getElementById('expensesTableBody');
    if (!tableBody) return;
    
    if (currentExpenses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Aucune dépense enregistrée
                </td>
            </tr>
        `;
        return;
    }
    
    const expensesHTML = currentExpenses.map(expense => {
        const category = expenseCategories.find(cat => cat.id === expense.category);
        const categoryName = category ? category.name : expense.category;
        const categoryClass = `category-${expense.category}`;
        
        const statusText = expense.status === 'paid' ? 'Payée' : 'En attente';
        const statusClass = expense.status === 'paid' ? 'text-green-600' : 'text-yellow-600';
        
        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${new Date(expense.date).toLocaleDateString('fr-FR')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${expense.description}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="expense-category ${categoryClass}">
                        ${categoryName}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ${expense.amount.toFixed(2)} MAD
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass}">
                    ${statusText}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="editExpense(${expense.id})">
                        Modifier
                    </button>
                    <button class="text-red-600 hover:text-red-900" onclick="deleteExpense(${expense.id})">
                        Supprimer
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = expensesHTML;

    // Test des boutons après affichage
    setTimeout(() => {
        testExpenseButtons();
    }, 500);
}

/**
 * Met à jour le texte d'un élément de manière sécurisée
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Affiche une notification à l'utilisateur
 */
function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
        window.showNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
        if (type === 'error') {
            alert(`Erreur: ${message}`);
        }
    }
}

/**
 * Affiche le modal pour ajouter une nouvelle dépense
 */
function showAddExpenseModal() {
    console.log('🆕 Ouverture modal nouvelle dépense');

    // Créer le modal dynamiquement
    const modalHTML = `
        <div id="addExpenseModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Nouvelle Dépense</h3>

                <form id="addExpenseForm">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <input type="text" id="expenseDescription" class="form-input" required>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant (MAD)</label>
                            <input type="number" id="expenseAmount" class="form-input" step="0.01" required>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                            <select id="expenseCategory" class="form-input" required>
                                <option value="">Sélectionner une catégorie</option>
                                <option value="fixed">Charges fixes</option>
                                <option value="variable">Charges variables</option>
                                <option value="exceptional">Exceptionnelles</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                            <input type="date" id="expenseDate" class="form-input" required>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
                            <select id="expenseStatus" class="form-input">
                                <option value="pending">En attente</option>
                                <option value="paid">Payée</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optionnel)</label>
                            <textarea id="expenseNotes" class="form-input" rows="3" placeholder="Notes additionnelles..."></textarea>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" id="cancelAddExpense" class="btn btn-outline">Annuler</button>
                        <button type="submit" id="submitExpenseBtn" class="btn btn-primary">Ajouter</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Ajouter le modal au DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Définir la date par défaut à aujourd'hui
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];

    // Gérer la soumission du formulaire
    document.getElementById('addExpenseForm').addEventListener('submit', handleAddExpense);

    // Gérer l'annulation
    document.getElementById('cancelAddExpense').addEventListener('click', closeAddExpenseModal);

    // Fermer en cliquant à l'extérieur
    document.getElementById('addExpenseModal').addEventListener('click', (e) => {
        if (e.target.id === 'addExpenseModal') {
            closeAddExpenseModal();
        }
    });
}

/**
 * Ferme le modal d'ajout de dépense
 */
function closeAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
        modal.remove();
    }

    // Réinitialiser le bouton de soumission pour le prochain usage
    resetExpenseFormForAdd();
}

/**
 * Réinitialise le formulaire pour un nouvel ajout
 */
function resetExpenseFormForAdd() {
    // Réinitialiser le bouton de soumission
    const submitBtn = document.getElementById('submitExpenseBtn');
    if (submitBtn) {
        submitBtn.textContent = 'Ajouter la Dépense';
        delete submitBtn.dataset.expenseId;
    }

    // Réinitialiser le titre du modal
    const modalTitle = document.querySelector('#addExpenseModal h3');
    if (modalTitle) {
        modalTitle.textContent = 'Nouvelle Dépense';
    }

    console.log('🔄 Formulaire réinitialisé pour un nouvel ajout');
}

/**
 * Gère l'ajout d'une nouvelle dépense
 */
async function handleAddExpense(e) {
    e.preventDefault();

    try {
        const expenseData = {
            description: document.getElementById('expenseDescription').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            category: document.getElementById('expenseCategory').value,
            date: document.getElementById('expenseDate').value,
            status: document.getElementById('expenseStatus').value,
            notes: document.getElementById('expenseNotes')?.value || ''
        };

        // Vérifier si c'est une modification ou un ajout
        const submitBtn = document.getElementById('submitExpenseBtn');
        const expenseId = submitBtn?.dataset.expenseId;

        if (expenseId) {
            // Mode modification
            console.log('✏️ Modification dépense ID:', expenseId, expenseData);

            if (window.api && window.api.expenses) {
                const updatedExpense = await window.api.expenses.update(parseInt(expenseId), expenseData);
                console.log('✅ Dépense modifiée:', updatedExpense);
                showNotification('Dépense modifiée avec succès', 'success');
            } else {
                // Mode test : modifier dans la liste locale
                const index = currentExpenses.findIndex(exp => exp.id == expenseId);
                if (index !== -1) {
                    currentExpenses[index] = { ...currentExpenses[index], ...expenseData };
                    console.log('✅ Dépense modifiée (mode test)');
                    showNotification('Dépense modifiée (mode test)', 'success');
                }
            }
        } else {
            // Mode ajout
            console.log('💰 Ajout nouvelle dépense:', expenseData);

            if (window.api && window.api.expenses) {
                const newExpense = await window.api.expenses.create(expenseData);
                console.log('✅ Dépense créée:', newExpense);
                showNotification('Dépense ajoutée avec succès', 'success');
            } else {
                // Mode test : ajouter à la liste locale
                const newExpense = {
                    id: Date.now(),
                    ...expenseData
                };
                currentExpenses.unshift(newExpense);
                console.log('✅ Dépense ajoutée (mode test)');
                showNotification('Dépense ajoutée (mode test)', 'success');
            }
        }

        // Recharger les données
        await loadExpenses();
        updateDashboard();
        displayExpenses();

        closeAddExpenseModal();

    } catch (error) {
        console.error('❌ Erreur lors de la gestion de la dépense:', error);
        showNotification('Erreur lors de la gestion de la dépense', 'error');
    }
}

/**
 * Affiche le modal des dépenses récurrentes
 */
function showRecurringExpensesModal() {
    console.log('🔄 Ouverture modal dépenses récurrentes');
    showNotification('Modal dépenses récurrentes en cours de développement', 'info');
}

/**
 * Filtre les dépenses selon les critères sélectionnés
 */
async function filterExpenses() {
    try {
        console.log('🔍 Filtrage des dépenses');

        const filters = {};

        const categoryFilter = document.getElementById('filterCategory').value;
        if (categoryFilter) {
            filters.category = categoryFilter;
        }

        const dateFilter = document.getElementById('filterDate').value;
        if (dateFilter) {
            filters.dateFrom = dateFilter;
            filters.dateTo = dateFilter;
        }

        if (window.api && window.api.expenses) {
            currentExpenses = await window.api.expenses.getAll(filters);
        } else {
            // Mode test : filtrer localement
            let filteredExpenses = [...currentExpenses];

            if (filters.category) {
                filteredExpenses = filteredExpenses.filter(expense => expense.category === filters.category);
            }

            if (filters.dateFrom) {
                filteredExpenses = filteredExpenses.filter(expense => expense.date === filters.dateFrom);
            }

            currentExpenses = filteredExpenses;
        }

        displayExpenses();
        console.log(`✅ ${currentExpenses.length} dépense(s) après filtrage`);

    } catch (error) {
        console.error('❌ Erreur lors du filtrage:', error);
        showNotification('Erreur lors du filtrage', 'error');
    }
}

/**
 * Modifie une dépense
 */
async function editExpense(id) {
    console.log('✏️ DÉBUT Modification dépense ID:', id);
    console.log('🔍 Type de l\'ID:', typeof id, 'Valeur:', id);

    try {
        // Récupérer les détails de la dépense
        const expense = await window.api.expenses.getById(id);

        if (!expense) {
            showNotification('Dépense non trouvée', 'error');
            return;
        }

        console.log('📄 Dépense à modifier:', expense);

        // Ouvrir le modal de création/modification
        // D'abord, vérifier si un modal existe déjà et le fermer
        const existingModal = document.getElementById('addExpenseModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Créer et afficher le modal avec les données pré-remplies
        showAddExpenseModal();

        // Attendre que le modal soit créé puis le modifier pour l'édition
        setTimeout(() => {
            const modal = document.getElementById('addExpenseModal');
            if (modal) {
                // Changer le titre du modal
                const modalTitle = modal.querySelector('h3');
                if (modalTitle) {
                    modalTitle.textContent = 'Modifier la Dépense';
                }

                // Changer le texte du bouton de soumission
                const submitBtn = document.getElementById('submitExpenseBtn');
                if (submitBtn) {
                    submitBtn.textContent = 'Mettre à Jour';
                    submitBtn.dataset.expenseId = id; // Stocker l'ID pour la mise à jour
                }

                // Pré-remplir le formulaire avec les données existantes
                populateFormForEdit(expense);

                console.log('✅ Modal configuré pour la modification');
            } else {
                console.error('❌ Modal non trouvé après création');
            }
        }, 100);

        console.log('✅ Processus de modification initié');

    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la dépense:', error);
        showNotification('Erreur lors de la récupération de la dépense', 'error');
    }
}

// Exposer immédiatement la fonction editExpense
window.editExpense = editExpense;

/**
 * Pré-remplit le formulaire avec les données de la dépense à modifier
 */
function populateFormForEdit(expense) {
    console.log('📝 Pré-remplissage du formulaire avec:', expense);

    // Attendre un peu pour s'assurer que le DOM est prêt
    setTimeout(() => {
        // Remplir les champs du formulaire
        const descriptionField = document.getElementById('expenseDescription');
        if (descriptionField) {
            descriptionField.value = expense.description || '';
            console.log('✅ Description remplie:', expense.description);
        } else {
            console.error('❌ Champ description non trouvé');
        }

        const amountField = document.getElementById('expenseAmount');
        if (amountField) {
            amountField.value = expense.amount || '';
            console.log('✅ Montant rempli:', expense.amount);
        } else {
            console.error('❌ Champ montant non trouvé');
        }

        const categoryField = document.getElementById('expenseCategory');
        if (categoryField) {
            categoryField.value = expense.category || '';
            console.log('✅ Catégorie remplie:', expense.category);
        } else {
            console.error('❌ Champ catégorie non trouvé');
        }

        const dateField = document.getElementById('expenseDate');
        if (dateField && expense.date) {
            // Convertir la date au format YYYY-MM-DD pour l'input date
            const date = new Date(expense.date);
            dateField.value = date.toISOString().split('T')[0];
            console.log('✅ Date remplie:', dateField.value);
        } else {
            console.error('❌ Champ date non trouvé ou date manquante');
        }

        const statusField = document.getElementById('expenseStatus');
        if (statusField) {
            statusField.value = expense.status || 'pending';
            console.log('✅ Statut rempli:', expense.status);
        } else {
            console.error('❌ Champ statut non trouvé');
        }

        const notesField = document.getElementById('expenseNotes');
        if (notesField) {
            notesField.value = expense.notes || '';
            console.log('✅ Notes remplies:', expense.notes);
        } else {
            console.warn('⚠️ Champ notes non trouvé (optionnel)');
        }

        console.log('✅ Formulaire pré-rempli avec les données de la dépense');
    }, 50);
}

/**
 * Supprime une dépense avec modal de confirmation
 */
async function deleteExpense(id) {
    try {
        console.log('🗑️ Demande de suppression dépense ID:', id);

        // Trouver la dépense pour afficher ses détails
        const expense = currentExpenses.find(exp => exp.id === id);
        const expenseName = expense ? expense.description : 'cette dépense';
        const expenseAmount = expense ? expense.amount.toFixed(2) + ' MAD' : '';

        // Afficher le modal de confirmation
        showDeleteConfirmationModal(id, expenseName, expenseAmount);

    } catch (error) {
        console.error('❌ Erreur lors de la préparation de suppression:', error);
        showNotification('Erreur lors de la préparation de suppression', 'error');
    }
}

/**
 * Affiche le modal de confirmation de suppression
 */
function showDeleteConfirmationModal(expenseId, expenseName, expenseAmount) {
    const modalHTML = `
        <div id="deleteConfirmationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 transform transition-all">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-4">
                        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Confirmer la suppression</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Cette action est irréversible</p>
                    </div>
                </div>

                <div class="mb-6">
                    <p class="text-gray-700 dark:text-gray-300 mb-2">
                        Êtes-vous sûr de vouloir supprimer cette dépense ?
                    </p>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p class="font-medium text-gray-900 dark:text-white">${expenseName}</p>
                        ${expenseAmount ? `<p class="text-sm text-gray-600 dark:text-gray-400">Montant : ${expenseAmount}</p>` : ''}
                    </div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button type="button" id="cancelDeleteExpense" class="btn btn-outline">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        Annuler
                    </button>
                    <button type="button" id="confirmDeleteExpense" class="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500" data-expense-id="${expenseId}">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    `;

    // Ajouter le modal au DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Gérer la confirmation
    document.getElementById('confirmDeleteExpense').addEventListener('click', () => {
        const expenseId = document.getElementById('confirmDeleteExpense').getAttribute('data-expense-id');
        confirmDeleteExpense(parseInt(expenseId));
    });

    // Gérer l'annulation
    document.getElementById('cancelDeleteExpense').addEventListener('click', closeDeleteConfirmationModal);

    // Fermer en cliquant à l'extérieur
    document.getElementById('deleteConfirmationModal').addEventListener('click', (e) => {
        if (e.target.id === 'deleteConfirmationModal') {
            closeDeleteConfirmationModal();
        }
    });

    // Fermer avec la touche Escape
    document.addEventListener('keydown', handleDeleteModalKeydown);
}

/**
 * Ferme le modal de confirmation de suppression
 */
function closeDeleteConfirmationModal() {
    const modal = document.getElementById('deleteConfirmationModal');
    if (modal) {
        modal.remove();
    }

    // Supprimer l'écouteur d'événement Escape
    document.removeEventListener('keydown', handleDeleteModalKeydown);
}

/**
 * Gère les touches du clavier pour le modal de suppression
 */
function handleDeleteModalKeydown(e) {
    if (e.key === 'Escape') {
        closeDeleteConfirmationModal();
    }
}

/**
 * Confirme et exécute la suppression de la dépense
 */
async function confirmDeleteExpense(id) {
    try {
        console.log('🗑️ Confirmation de suppression dépense ID:', id);

        // Fermer le modal
        closeDeleteConfirmationModal();

        // Afficher un indicateur de chargement
        showNotification('Suppression en cours...', 'info');

        if (window.api && window.api.expenses) {
            await window.api.expenses.delete(id);
            console.log('✅ Dépense supprimée de la base de données');

            // Recharger les données
            await loadExpenses();
            updateDashboard();
            displayExpenses();

            showNotification('Dépense supprimée avec succès', 'success');
        } else {
            // Mode test : supprimer de la liste locale
            currentExpenses = currentExpenses.filter(expense => expense.id !== id);
            updateDashboard();
            displayExpenses();
            showNotification('Dépense supprimée (mode test)', 'success');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showNotification('Erreur lors de la suppression : ' + error.message, 'error');
    }
}

// Exposer immédiatement la fonction deleteExpense
window.deleteExpense = deleteExpense;

/**
 * Configure la délégation d'événements pour les boutons du tableau
 */
function setupTableEventDelegation() {
    const tableBody = document.getElementById('expensesTableBody');
    if (!tableBody) {
        console.warn('⚠️ Table body non trouvé pour la délégation d\'événements');
        return;
    }

    tableBody.addEventListener('click', function(e) {
        const target = e.target;

        // Vérifier si c'est un bouton Modifier
        if (target.textContent.trim() === 'Modifier' && target.tagName === 'BUTTON') {
            e.preventDefault();
            const onclickAttr = target.getAttribute('onclick');
            if (onclickAttr) {
                // Extraire l'ID de l'onclick
                const match = onclickAttr.match(/editExpense\((\d+)\)/);
                if (match) {
                    const expenseId = parseInt(match[1]);
                    console.log('🔧 Délégation: Modification dépense ID:', expenseId);
                    editExpense(expenseId);
                }
            }
        }

        // Vérifier si c'est un bouton Supprimer
        if (target.textContent.trim() === 'Supprimer' && target.tagName === 'BUTTON') {
            e.preventDefault();
            const onclickAttr = target.getAttribute('onclick');
            if (onclickAttr) {
                // Extraire l'ID de l'onclick
                const match = onclickAttr.match(/deleteExpense\((\d+)\)/);
                if (match) {
                    const expenseId = parseInt(match[1]);
                    console.log('🗑️ Délégation: Suppression dépense ID:', expenseId);
                    deleteExpense(expenseId);
                }
            }
        }
    });

    console.log('✅ Délégation d\'événements configurée pour le tableau des dépenses');
}

/**
 * Vérifie que les fonctions sont bien exposées globalement
 */
function verifyGlobalFunctions() {
    console.log('🔍 VÉRIFICATION DES FONCTIONS GLOBALES:');

    if (typeof window.editExpense === 'function') {
        console.log('✅ window.editExpense est disponible');
        console.log('🔧 Test d\'appel: window.editExpense =', window.editExpense.toString().substring(0, 100) + '...');
    } else {
        console.error('❌ window.editExpense N\'EST PAS disponible');
    }

    if (typeof window.deleteExpense === 'function') {
        console.log('✅ window.deleteExpense est disponible');
        console.log('🗑️ Test d\'appel: window.deleteExpense =', window.deleteExpense.toString().substring(0, 100) + '...');
    } else {
        console.error('❌ window.deleteExpense N\'EST PAS disponible');
    }

    // Test d'appel avec un ID fictif pour vérifier que ça ne crash pas
    try {
        console.log('🧪 Test d\'appel editExpense avec ID fictif...');
        // Ne pas vraiment appeler, juste vérifier que la fonction existe
        if (window.editExpense) {
            console.log('✅ editExpense peut être appelée');
        }
    } catch (error) {
        console.error('❌ Erreur lors du test editExpense:', error);
    }
}

/**
 * Teste les boutons du tableau après leur génération
 */
function testExpenseButtons() {
    console.log('🧪 TEST DES BOUTONS DU TABLEAU:');

    const tableBody = document.getElementById('expensesTableBody');
    if (!tableBody) {
        console.error('❌ Table body non trouvé');
        return;
    }

    // Méthode pour trouver les boutons par leur contenu
    const allButtons = tableBody.querySelectorAll('button');
    let modifierCount = 0;
    let supprimerCount = 0;

    allButtons.forEach((button, index) => {
        const text = button.textContent.trim();
        const onclick = button.getAttribute('onclick');

        console.log(`🔘 Bouton ${index + 1}: "${text}" | onclick: "${onclick}"`);

        if (text === 'Modifier') {
            modifierCount++;

            // Tester le clic
            button.addEventListener('click', function(e) {
                console.log('🖱️ CLIC DÉTECTÉ sur bouton Modifier');
                console.log('🎯 Event target:', e.target);
                console.log('🔗 onclick attr:', e.target.getAttribute('onclick'));
            });
        }

        if (text === 'Supprimer') {
            supprimerCount++;
        }
    });

    console.log(`📊 Trouvé ${modifierCount} boutons "Modifier" et ${supprimerCount} boutons "Supprimer"`);

    if (modifierCount === 0) {
        console.error('❌ AUCUN bouton "Modifier" trouvé !');
    } else {
        console.log('✅ Boutons "Modifier" trouvés');
    }
}

// ===== EXPOSITION GLOBALE DES FONCTIONS =====
// Les fonctions sont maintenant exposées immédiatement après leur définition
console.log('🌐 Fonctions editExpense et deleteExpense exposées globalement');
